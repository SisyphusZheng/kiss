/**
 * @kissjs/core - Entry Generators
 * Pure functions that generate auto-entry code strings.
 * No Vite dependency — safe to import in tests.
 *
 * Hydration lifecycle (corrected):
 *   1. SSR outputs `<tag defer-hydration>` with `<!--lit-part-->` markers
 *   2. Client entry registers custom elements (customElements.define)
 *   3. Imports lit-element-hydrate-support (side effect — patches LitElement)
 *   4. Waits for elements to upgrade (customElements.whenDefined)
 *   5. Removes `defer-hydration` attribute on each island element
 *   6. LitElement's patched attributeChangedCallback detects the removal
 *   7. Patched connectedCallback fires → update() → hydrate(value, renderRoot, options)
 *   8. Lit's hydrate() re-associates <!--lit-part--> markers with live DOM
 *
 * Key insight: We do NOT call hydrate() directly.
 * The correct hydrate(result, container, options) requires the TemplateResult
 * which only exists inside each component's render(). Calling hydrate(el) with
 * just a DOM element is wrong — it interprets the element as the TemplateResult.
 * Instead, lit-element-hydrate-support patches LitElement to call hydrate()
 * internally with the correct arguments after defer-hydration is removed.
 */

/** Island entry for client bundle generation */
export interface ClientIslandEntry {
  /** Custom element tag name */
  tagName: string;
  /** Absolute or relative module path for import */
  modulePath: string;
  /** True if this island comes from a package (e.g. @kissjs/ui) — uses side-effect import */
  isPackage?: boolean;
}

/** Hydration strategy for island components */
export type HydrationStrategy = 'eager' | 'lazy' | 'idle' | 'visible';

/**
 * Generate the client entry point file content.
 *
 * This entry is built by Vite's client build (Phase 2).
 * It does three things:
 * 1. Imports lit-element-hydrate-support (side effect — patches LitElement for hydration)
 * 2. Imports and registers all island custom elements
 * 3. Removes defer-hydration attributes based on the configured strategy
 *
 * The built output is a self-contained JS module that browsers can load
 * via <script type="module" src="..."> — no import maps needed.
 */
export function generateClientEntry(
  islands: ClientIslandEntry[],
  strategy: HydrationStrategy = 'lazy',
): string {
  if (islands.length === 0) {
    return '// KISS Client Entry — No islands detected, zero client JS needed\n';
  }

  // Package islands (from @kissjs/ui etc.) self-register via customElements.define()
  // in their bundled output — we only need a side-effect import.
  // Local islands use `export default class` — we import the class and register.
  //
  // CRITICAL ORDERING: litElementHydrateSupport({LitElement}) must run BEFORE
  // any customElements.define() calls. In ESM, all static imports execute
  // before module-level code. If package islands use static imports, their
  // customElements.define() side effects run before litElementHydrateSupport().
  // Solution: use dynamic import() for package islands so they execute AFTER
  // the hydration support is activated.
  let localIdx = 0;
  const staticImports = islands
    .filter((island) => !island.isPackage)
    .map((island) => {
      const idx = localIdx++;
      return `import Island_${idx} from '${island.modulePath}';`;
    })
    .join('\n');

  const packageIslands = islands.filter((island) => island.isPackage);
  const dynamicImports = packageIslands.length > 0
    ? packageIslands
      .map((island) => `  import('${island.modulePath}');`)
      .join('\n')
    : '';

  localIdx = 0;
  const registrations = islands
    .filter((island) => !island.isPackage)
    .map((island) => {
      const idx = localIdx++;
      return `if (!customElements.get('${island.tagName}')) customElements.define('${island.tagName}', Island_${idx});`;
    })
    .join('\n');

  const whenDefinedList = islands
    .map((island) => `customElements.whenDefined('${island.tagName}')`)
    .join(', ');

  const strategyCode = generateStrategyCode(strategy);

  const activateHydration = `// Activate hydration support FIRST — must patch LitElement before any
// customElements.define() calls. Package islands use dynamic import()
// to ensure they register AFTER this patch is applied.
//
// The side-effect import auto-patches LitElement with hydration support:
// it adds 'defer-hydration' to observedAttributes and patches
// connectedCallback/attributeChangedCallback to call hydrate() internally
// when defer-hydration is removed. No manual litElementHydrateSupport() call needed.
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';`;

  const packageImportBlock = dynamicImports
    ? `\n// --- Dynamic import for package islands (after LitElement patch) ---\n${dynamicImports}\n`
    : '';

  return `// KISS Client Entry (auto-generated — KISS Architecture: Islands only)
// DO NOT EDIT — changes will be overwritten
//
// Hydration: lit-element-hydrate-support patches LitElement so that
// removing defer-hydration triggers internal hydrate() with correct args.
// We do NOT call hydrate() directly — that requires (result, container, options).

${activateHydration}

${staticImports}

// --- Register local island custom elements ---
${registrations}
${packageImportBlock}
// --- Hydration: remove defer-hydration to trigger LitElement's patched lifecycle ---
// lit-element-hydrate-support adds 'defer-hydration' to observedAttributes.
// When we remove it, attributeChangedCallback fires → connectedCallback →
// update() → hydrate(this.render(), this.renderRoot, this.renderOptions).
// This is the ONLY correct way to hydrate — hydrate() needs the TemplateResult.
//
// CRITICAL: document.querySelectorAll() does NOT pierce Shadow DOM.
// SSR-rendered elements (like counter-island inside page-fullstack-demo's
// shadow root) won't be found by a top-level querySelectorAll.
// We must recursively walk all shadow roots.

Promise.all([${whenDefinedList}]).then(() => {
  function __kissFindDeferred(root) {
    const deferred = [];
    // Check direct children with defer-hydration
    root.querySelectorAll('[defer-hydration]').forEach(el => {
      deferred.push(el);
    });
    // Recurse into shadow roots of all custom elements
    root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) {
        deferred.push(...__kissFindDeferred(el.shadowRoot));
      }
    });
    return deferred;
  }

  function __kissHydrateAll() {
    const all = __kissFindDeferred(document);
    all.forEach(el => el.removeAttribute('defer-hydration'));
  }

  function __kissHydrateElement(el) {
    el.removeAttribute('defer-hydration');
  }

${strategyCode}
});
`;
}

/**
 * Generate strategy dispatch code.
 *
 * - eager: remove defer-hydration on all islands immediately
 * - lazy: remove defer-hydration on requestIdleCallback (or setTimeout fallback)
 * - idle: remove defer-hydration on requestIdleCallback or window load
 * - visible: remove defer-hydration on individual islands as they scroll into view
 */
function generateStrategyCode(strategy: HydrationStrategy): string {
  switch (strategy) {
    case 'eager':
      return `  // Eager: hydrate all islands immediately
  __kissHydrateAll();`;

    case 'lazy':
      return `  // Lazy: hydrate on requestIdleCallback (non-blocking)
  if ('requestIdleCallback' in window) {
    requestIdleCallback(__kissHydrateAll);
  } else {
    setTimeout(__kissHydrateAll, 200);
  }`;

    case 'idle':
      return `  // Idle: wait for page to be fully idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(__kissHydrateAll);
  } else {
    window.addEventListener('load', __kissHydrateAll);
  }`;

    case 'visible':
      return `  // Visible: hydrate each island when it scrolls into view
  // Uses __kissFindDeferred to traverse Shadow DOM (document.querySelectorAll doesn't pierce it)
  const __kissObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        __kissHydrateElement(entry.target);
        observer.unobserve(entry.target);
      }
    }
    // Disconnect observer when no deferred elements remain (traverse Shadow DOM)
    if (__kissFindDeferred(document).length === 0) {
      observer.disconnect();
    }
  });
  __kissFindDeferred(document).forEach(el => __kissObserver.observe(el));`;

    default:
      return `  __kissHydrateAll();`;
  }
}
