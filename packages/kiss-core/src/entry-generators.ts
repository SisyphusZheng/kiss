/**
 * @kissjs/core - Entry Generators
 * Pure functions that generate auto-entry code strings.
 * No Vite dependency — safe to import in tests.
 *
 * v0.3.0: Client entry includes Lit hydration logic.
 * The client entry is built by Vite (Phase 2), which bundles
 * @lit-labs/ssr-client's hydrate() into the output. This avoids
 * bare module imports in static HTML — Vite resolves everything.
 *
 * Hydration lifecycle:
 *   1. SSR outputs `<tag defer-hydration>` with `<!--lit-part-->` markers
 *   2. Client entry registers custom elements (customElements.define)
 *   3. Waits for elements to upgrade (customElements.whenDefined)
 *   4. Calls Lit's hydrate(el) — re-associates template expressions with DOM
 *   5. Removes defer-hydration attribute
 *
 * This creates a TRUE hydration loop: defer → define → hydrate → removeAttribute
 * SSR HTML is preserved (not destroyed by client-render), giving real first-paint perf.
 */

import type { PackageIslandMeta } from './types.js';

/** Island entry for client bundle generation */
export interface ClientIslandEntry {
  /** Custom element tag name */
  tagName: string;
  /** Absolute or relative module path for import */
  modulePath: string;
}

/** Hydration strategy for island components */
export type HydrationStrategy = 'eager' | 'lazy' | 'idle' | 'visible';

/**
 * Generate the client entry point file content.
 *
 * This entry is built by Vite's client build (Phase 2).
 * It does three things:
 * 1. Imports and registers all island custom elements
 * 2. Imports hydrate() from @lit-labs/ssr-client (bundled by Vite)
 * 3. Hydrates SSR-rendered elements based on the configured strategy
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

  const imports = islands
    .map((island, i) => {
      return `import Island_${i} from '${island.modulePath}';`;
    })
    .join('\n');

  const registrations = islands
    .map((island, i) => {
      return `if (!customElements.get('${island.tagName}')) customElements.define('${island.tagName}', Island_${i});`;
    })
    .join('\n');

  const whenDefinedList = islands
    .map((island) => `customElements.whenDefined('${island.tagName}')`)
    .join(', ');

  const strategyCode = generateStrategyCode(strategy);

  return `// KISS Client Entry (auto-generated — KISS Architecture: Islands only)
// DO NOT EDIT — changes will be overwritten
//
// Hydration: uses Lit's hydrate() from @lit-labs/ssr-client.
// Vite bundles this import — no bare module specifiers in output.
// SSR HTML preserves <!--lit-part--> markers for hydration.

import { hydrate } from '@lit-labs/ssr-client';

${imports}

// --- Register all island custom elements ---
${registrations}

// --- Hydration: re-associate Lit templates with SSR DOM ---
// Must wait for custom elements to upgrade before hydrating.
// Lit's hydrate() reads <!--lit-part--> comments left by SSR
// to re-bind template expressions + event listeners to existing DOM.
// This preserves SSR HTML instead of destroying it (client-render).

Promise.all([${whenDefinedList}]).then(() => {
  function __kissHydrateAll() {
    document.querySelectorAll('[defer-hydration]').forEach(el => {
      hydrate(el);
      el.removeAttribute('defer-hydration');
    });
  }

  function __kissHydrateElement(el) {
    hydrate(el);
    el.removeAttribute('defer-hydration');
  }

${strategyCode}
});
`;
}

/**
 * Generate strategy dispatch code.
 *
 * - eager: hydrate all islands immediately after element upgrade
 * - lazy: hydrate on requestIdleCallback (or setTimeout fallback)
 * - idle: hydrate on requestIdleCallback or window load
 * - visible: hydrate individual islands as they scroll into view
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
  const __kissObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        __kissHydrateElement(entry.target);
        __kissObserver.unobserve(entry.target);
      }
    }
  });
  document.querySelectorAll('[defer-hydration]').forEach(el => __kissObserver.observe(el));`;

    default:
      return `  __kissHydrateAll();`;
  }
}
