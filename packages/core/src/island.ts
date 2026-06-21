import { ERROR_PREFIX } from '@openelement/core';
import { formatError } from './errors.js';
/**
 * @openelement/core - defineIsland() wrapper
 *
 * v0.6.2: defineIsland() wraps any Custom Element class to provide:
 *   - Automatic registration via customElements.define()
 *   - Hydration strategy support (load, idle, visible, only)
 *   - __island / __tagName / __layer metadata markers
 *   - data-ssr-props restoration on client upgrade
 *   - DSD opt-out via `dsd: false` (Pure Island / Layer 3)
 *
 * Framework-agnostic: works with Lit, vanilla Custom Elements,
 * FAST, or any Web Component library. bindSsrProps() sets props
 * directly; adapters handle framework-specific update triggers.
 *
 * v0.29.1: defineCustomElement helper inlined from custom-element.ts.
 */

import { createLogger } from './logger.js';
import type { HydrationStrategy } from './schemas.js';

/** WeakSet to track elements that have already had SSR props bound (idempotent). */
const ssrPropsBoundSet = new WeakSet<HTMLElement>();
const log = createLogger('core');

/**
 * SSR-safe custom element registration helper.
 * v0.29.1: Merged from custom-element.ts.
 */
export function defineCustomElement(
  tag: string,
  ctor: CustomElementConstructor,
): void {
  if (typeof globalThis.customElements === 'undefined') return;
  if (!globalThis.customElements.get(tag)) {
    globalThis.customElements.define(tag, ctor);
  }
}

const VALID_STRATEGIES = new Set<HydrationStrategy>(['load', 'idle', 'visible', 'only']);

// Module-level store of active visibility strategy timeout IDs.
// Used for test cleanup - tests can call _clearAllVisibilityTimeouts()
// to prevent timer leaks.
const _visibilityTimeouts = new Set<ReturnType<typeof setTimeout>>();

export interface IslandMeta {
  tagName: string;
  layer: string;
  isIsland: boolean;
  ssr?: boolean;
  dsd: boolean;
}

const _islandMeta = new WeakMap<CustomElementConstructor, IslandMeta>();

export function getIslandMeta(ctor: CustomElementConstructor): IslandMeta | undefined {
  return _islandMeta.get(ctor);
}

/** Clear all active visibility strategy timeouts (for test cleanup). */
export function _clearAllVisibilityTimeouts(): void {
  for (const id of _visibilityTimeouts) {
    clearTimeout(id);
  }
  _visibilityTimeouts.clear();
}

export interface IslandOptions {
  /** Hydration strategy:
   *   - 'load': load immediately when module is imported
   *   - 'idle': defer to requestIdleCallback (default)
   *   - 'visible': use IntersectionObserver to defer until element is visible
   *   - 'only': client-only render, no DSD/SSR output
   */
  strategy?: HydrationStrategy;

  /** Optional tag name override. If provided, used instead of the first argument. */
  tagName?: string;

  /**
   * Whether to use DSD for SSR rendering of this island.
   * - true (default): SSR emits <template shadowrootmode="open"> for no-flicker first paint.
   *   Component uses _dsdHydrated pattern; adapter handles event hydration.
   * - false: SSR emits just the tag (<my-island></my-island>).
   *   Framework fully owns the shadow root on client, getting full reactivity.
   *   This is Layer 3 (pure-island) in the three-layer model.
   * @default true
   */
  dsd?: boolean;

  /**
   * Whether this island may be admitted into server rendering.
   * Build-time metadata controls scanner admission; this runtime field records
   * the same canonical descriptor for tests and direct registrations.
   */
  ssr?: boolean;
}

/**
 * Get the value of the data-ssr-props attribute from a host element.
 * Used to reconstruct SSR props on client upgrade.
 *
 * @param el - The custom element host element
 * @returns Parsed props object, or null if no data-ssr-props attribute
 *
 * @example
 * ```ts
 * connectedCallback() {
 *   super.connectedCallback();
 *   const props = getSsrProps(this);
 *   if (props) {
 *     this.count = props.count ?? 0;
 *   }
 * }
 * ```
 */
export function getSsrProps(el: HTMLElement): Record<string, unknown> | null {
  const raw = el.getAttribute('data-ssr-props');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    log.warn(`Failed to parse data-ssr-props on <${el.tagName.toLowerCase()}>`);
    return null;
  }
}

/**
 * Apply SSR props from data-ssr-props to a component instance.
 * This restores server-rendered property values to the
 * client-side component on upgrade, ensuring consistency between
 * SSR and client state.
 *
 * v0.6.2: Framework-agnostic. No Lit-specific detection.
 * Props are set directly on the instance. DSD hydration and VNode event
 * markers are handled at the component level via DsdElement.
 *
 * v0.14.3: Prototype pollution fix - filters dangerous keys
 * (__proto__, constructor, prototype) from parsed SSR props.
 *
 * @param el - The upgraded custom element
 */

/** Keys that could cause prototype pollution if assigned to an object instance.
 * v0.14.7: Extended to cover all Object.prototype methods that could be
 * exploited via arbitrary property assignment (C-03 fix).
 */
import { DANGEROUS_KEYS } from './security.js';

export function bindSsrProps(el: HTMLElement): void {
  const props = getSsrProps(el);
  if (!props) return;

  for (const [key, value] of Object.entries(props)) {
    // v0.14.3: Prevent prototype pollution - skip dangerous keys
    if (DANGEROUS_KEYS.has(key)) {
      log.warn(
        `Skipping dangerous key "${key}" in data-ssr-props on <${el.tagName.toLowerCase()}>`,
      );
      continue;
    }
    try {
      (el as unknown as Record<string, unknown>)[key] = value;
    } catch (e) {
      // Some properties may be read-only - safe to skip, but log for debuggability
      log.debug(
        `Cannot set read-only property "${key}" on <${el.tagName.toLowerCase()}>: ${
          formatError(e)
        }`,
      );
    }
  }
}

/**
 * Create an IntersectionObserver-based upgrade strategy.
 * v0.6': Uses querySelectorAll to observe ALL instances of the tag,
 * not just the first one. Per WHATWG IntersectionObserver spec.
 */
function createVisibleStrategy(
  tagName: string,
  registerFn: () => void,
): void {
  let registered = false;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          if (!registered) {
            registered = true;
            clearTimeout(timeoutId);
            _visibilityTimeouts.delete(timeoutId);
            registerFn();
          }
          return;
        }
      }
    },
    { rootMargin: '200px' }, // Start loading 200px before visible
  );

  // We need to wait for elements to be in the DOM first
  const observeAll = () => {
    const elements = document.querySelectorAll(tagName);
    if (elements.length > 0) {
      elements.forEach((el) => observer.observe(el));
      return true;
    }
    return false;
  };

  const mo = new MutationObserver((_mutations, mutObs) => {
    if (observeAll()) {
      mutObs.disconnect();
    } else {
      // v0.14.5: If elements were removed from DOM, disconnect all observers
      const elements = document.querySelectorAll(tagName);
      if (elements.length === 0 && !registered) {
        mutObs.disconnect();
        observer.disconnect();
        clearTimeout(timeoutId);
        _visibilityTimeouts.delete(timeoutId);
      }
    }
  });

  // v0.14.3: Timeout guard - if the target element never appears
  // (e.g., route changed after island was registered), disconnect
  // both observers after 30 seconds to prevent memory/perf leaks.
  const VISIBILITY_TIMEOUT = 30_000; // 30s
  const timeoutId = setTimeout(() => {
    _visibilityTimeouts.delete(timeoutId);
    if (!registered) {
      mo.disconnect();
      observer.disconnect();
      log.debug(`Visibility strategy for <${tagName}> timed out after ${VISIBILITY_TIMEOUT}ms`);
    }
  }, VISIBILITY_TIMEOUT);
  _visibilityTimeouts.add(timeoutId);

  // Start observing after DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!observeAll()) {
        mo.observe(document.body, { childList: true, subtree: true });
      }
    });
  } else {
    if (!observeAll()) {
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }
}

/**
 * Create an idle (requestIdleCallback-based) hydration strategy.
 * v0.6': Improved fallback chain:
 *   1. requestIdleCallback (optimal, progressive)
 *   2. requestAnimationFrame (next frame, good for interaction)
 *   3. setTimeout(fn, 50) (final fallback, shorter than old 200ms)
 */
function createIdleStrategy(registerFn: () => void): void {
  const g = globalThis as {
    requestIdleCallback?: (fn: () => void) => void;
    requestAnimationFrame?: (fn: () => void) => number;
  };

  if (typeof g.requestIdleCallback === 'function') {
    g.requestIdleCallback(registerFn);
  } else if (typeof g.requestAnimationFrame === 'function') {
    g.requestAnimationFrame(() => registerFn());
  } else {
    setTimeout(registerFn, 50);
  }
}

/**
 * Wrap a component class as a openElement Island.
 *
 * Handles:
 *   - Automatic customElements.define() registration
 *   - Strategy-based upgrade timing
 *   - data-ssr-props binding (open:bind)
 *   - __island / __tagName export markers
 *   - __layer metadata (dsd-static, dsd-interactive, or pure-island)
 *   - Idempotent registration (safe for SSR with multiple routes)
 *
 * v0.6.2: Added `dsd` option. When false, the island is a Pure Island
 * (Layer 3) - no DSD template is emitted, framework fully owns shadow root.
 *
 * @param tagName - Custom element tag name (must contain hyphen)
 * @param componentClass - Custom Element constructor (framework-agnostic)
 * @param options - Island options
 * @returns The component class (for chaining / re-export)
 *
 * @example
 * ```ts
 * // Basic usage (DSD enabled by default)
 * export default defineIsland('my-counter', MyCounter);
 *
 * // Pure Island - no DSD, full framework reactivity
 * export default defineIsland('my-counter', MyCounter, { dsd: false });
 *
 * // With visible strategy (IntersectionObserver)
 * export default defineIsland('my-counter', MyCounter, { strategy: 'visible' });
 *
 * // With load strategy (immediate upgrade)
 * export default defineIsland('my-counter', MyCounter, { strategy: 'load' });
 * ```
 */
export function defineIsland<T extends CustomElementConstructor>(
  tagName: string,
  componentClass: T,
  options: IslandOptions = {},
): T {
  const strategy = options.strategy || 'idle';
  if (!VALID_STRATEGIES.has(strategy)) {
    throw new Error(
      `${ERROR_PREFIX} Invalid island hydration strategy "${String(strategy)}". ` +
        'Use one of: load, idle, visible, only.',
    );
  }
  const useDsd = strategy === 'only' ? false : options.dsd !== false; // default true
  const useSsr = strategy === 'only' ? false : options.ssr !== false; // default true

  // Validate tag name per WHATWG Custom Element name rules
  // https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
  if (!tagName || !tagName.includes('-')) {
    throw new Error(
      `${ERROR_PREFIX} defineIsland() requires a hyphenated tag name, got "${tagName}". ` +
        'Custom Element names must contain a hyphen per the HTML spec.',
    );
  }
  // WHATWG: must start with lowercase letter, only lowercase/digits/hyphens,
  // must not start with a reserved prefix, no uppercase
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(tagName)) {
    throw new Error(
      `${ERROR_PREFIX} defineIsland() tag name "${tagName}" is not a valid custom element name. ` +
        'Must start with a lowercase ASCII letter, contain only lowercase ASCII ' +
        'letters, digits, and hyphens, and not use reserved names.',
    );
  }
  // Reserved names per WHATWG (partial list)
  const reservedPrefixes = [
    'annotation-',
    'color-profile',
    'font-face',
    'font-face-',
    'missing-glyph',
  ];
  for (const prefix of reservedPrefixes) {
    if (tagName.startsWith(prefix)) {
      throw new Error(
        `${ERROR_PREFIX} defineIsland() tag name "${tagName}" uses a reserved prefix "${prefix}".`,
      );
    }
  }

  _islandMeta.set(componentClass, {
    isIsland: true,
    tagName,
    layer: useDsd ? 'dsd-interactive' : 'pure-island',
    ssr: useSsr,
    dsd: useDsd,
  });

  // v0.6': Mixin pattern for connectedCallback - replaces monkey-patch.
  // Instead of modifying the prototype directly, we create a wrapper
  // that calls the original callback + auto-binds SSR props.
  // This is safer than monkey-patching because it doesn't interfere
  // with Lit's own connectedCallback chain.
  //
  // v0.14.3: Added __ssrPropsBound idempotency guard to prevent
  // double bindSsrProps() calls when a subclass island inherits from a
  // parent island (both registered via defineIsland()). Without this guard,
  // the parent's wrapped connectedCallback and the subclass's both
  // call bindSsrProps on the same element.
  const origConnected = componentClass.prototype.connectedCallback;
  if (!componentClass.prototype.__openIslandWrapped) {
    componentClass.prototype.__openIslandWrapped = true;
    componentClass.prototype.connectedCallback = function (this: HTMLElement) {
      // Call original connectedCallback first (super.connectedCallback)
      if (typeof origConnected === 'function') {
        origConnected.call(this);
      }
      // Auto-bind SSR props on upgrade (idempotent - only once per element)
      if (
        this.hasAttribute('data-ssr-props') &&
        !ssrPropsBoundSet.has(this)
      ) {
        ssrPropsBoundSet.add(this);
        Promise.resolve().then(() => bindSsrProps(this));
      }
    } as unknown as typeof componentClass.prototype.connectedCallback;
  }

  // Define a registration function that's idempotent
  const register = () => {
    const registry = globalThis.customElements;
    if (!registry) return;
    if (!registry.get(tagName)) {
      try {
        registry.define(tagName, componentClass);
      } catch (e) {
        // Already defined - safe to ignore in SSR contexts
        log.debug(
          `customElements.define("${tagName}") skipped: ${formatError(e)}`,
        );
      }
    }
  };

  // SSR guard: browser-specific strategy scheduling is a no-op during SSR.
  // IntersectionObserver, MutationObserver etc. are browser-only APIs.
  // During SSR we just define the custom element and let the generated
  // client entry handle strategy dispatch in the browser.
  const isBrowser = typeof IntersectionObserver !== 'undefined';

  if (isBrowser) {
    switch (strategy) {
      case 'load': // ponytail: fallthrough, both 'load' and 'only' call register()
      case 'only':
        register();
        break;
      case 'idle':
        createIdleStrategy(register);
        break;
      case 'visible':
        createVisibleStrategy(tagName, register);
        break;
    }
  } else {
    // SSR path: define the element idempotently, strategy runs on client.
    register();
  }

  return componentClass;
}

/**
 * Exports the `island` function as default for convenience imports.
 * Tree-shakable: bundlers can eliminate unused named exports from the same module.
 */
export default defineIsland;
