import { ERROR_PREFIX } from '../protocol/errors.ts';
import { formatError } from './errors.ts';
/**
 * island.ts - defineIsland() wrapper
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
 *
 * 0.42.0-alpha.13 (#606): strategy scheduling has a single owner — the
 * generated client entry (island-scheduler.ts in @openelement/adapter-vite).
 * defineIsland() no longer observes visibility itself; when an island module
 * evaluates, the scheduler already decided to load it, so load/only/visible
 * register immediately (idle still defers registration for standalone use).
 */

import { createLogger } from './logger.ts';
import { injectPropsSafe } from './security.ts';
import { assertValidTagName } from './tag-utils.ts';
import { HYDRATION_STRATEGIES, type HydrationStrategy } from '../protocol/framework.ts';
import { DATA_SSR_PROPS } from '../protocol/hydration-markers.ts';
import type { IslandOptions } from '../protocol/island.ts';
export type { IslandOptions };

/** WeakSet to track elements that have already had SSR props bound (idempotent). */
const ssrPropsBoundSet = new WeakSet<HTMLElement>();
const log = createLogger('island');

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

const VALID_STRATEGIES = new Set<HydrationStrategy>(HYDRATION_STRATEGIES);

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
  const raw = el.getAttribute(DATA_SSR_PROPS);
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
 * markers are handled at the component level via OpenElement.
 *
 * v0.14.3: Prototype pollution fix - filters dangerous keys
 * (__proto__, constructor, prototype) from parsed SSR props.
 * v0.14.7: Extended to cover all Object.prototype methods that could be
 * exploited via arbitrary property assignment (C-03 fix).
 *
 * @param el - The upgraded custom element
 */
export function bindSsrProps(el: HTMLElement): void {
  const props = getSsrProps(el);
  if (!props) return;

  // v0.14.3: Prevent prototype pollution - shared guarded assignment
  injectPropsSafe(el as unknown as Record<string, unknown>, props, el.tagName.toLowerCase(), log);
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
 * // With visible strategy (loaded on viewport entry by the client entry)
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
  // `options.dsd` / `options.ssr` have no runtime effect in defineIsland():
  // SSR/DSD admission is decided by the build-side island scan, which reads
  // `export const openElement = defineIslandConfig({ ... })` instead.

  // Validate tag name per WHATWG Custom Element name rules
  // https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
  // Single rule source shared with defineElement() (tag-utils.ts).
  assertValidTagName(tagName);

  // v0.6': connectedCallback wrapper - the prototype's connectedCallback is
  // replaced with a wrapper that calls the original callback + auto-binds SSR
  // props. The original is captured first, so the wrapped chain still runs the
  // component's own (and Lit's) connectedCallback logic.
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
        this.hasAttribute(DATA_SSR_PROPS) &&
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

  // SSR guard: browser-specific strategy handling is a no-op during SSR.
  // During SSR we just define the custom element and let the generated
  // client entry handle strategy dispatch in the browser.
  const isBrowser = typeof IntersectionObserver !== 'undefined';

  if (isBrowser) {
    switch (strategy) {
      case 'load': // Fall through: load/only/visible all register on evaluation.
      case 'only':
      case 'visible':
        // #606: the generated client entry (island-scheduler.ts in
        // @openelement/adapter-vite) is the single owner of strategy
        // scheduling — an island module only evaluates after the scheduler
        // decided to import it, so registration here is immediate. The old
        // defineIsland-side IntersectionObserver queried the light DOM only
        // and never found islands inside page DSD shadow roots; that dual
        // path is removed.
        register();
        break;
      case 'idle':
        createIdleStrategy(register);
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
