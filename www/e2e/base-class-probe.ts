/**
 * Shared browser-side probe for specs that extend the OpenElement base class
 * in a real page (hydration-behavior, static-props-observed,
 * static-props-reflect). Playwright serializes each page.evaluate callback by
 * source, and evaluate arguments must be serializable values — so the probe
 * ships as a source string (FIND_OPEN_ELEMENT_BASE_SOURCE) and is
 * instantiated inside the page with `new Function`.
 */

/** Islands the www island loader registers lazily; any of them anchors the walk. */
export const ISLAND_CANDIDATES = ['open-theme-toggle', 'open-card', 'open-button', 'open-search'];

/** Outcome of the base-class walk inside the page. */
export type OpenElementBaseProbe = { base: CustomElementConstructor } | { error: string };

export type FindOpenElementBase = (tag: string) => OpenElementBaseProbe;

/**
 * Browser-side: walk from a registered island component up the constructor
 * chain to the OpenElement runtime layer. The public class is deliberately
 * split across runtime, configuration, and SSR-safe HTMLElement layers, so
 * the direct HTMLElement subclass is not sufficient. Must stay self-contained
 * (no closure references): the source below is injected into page.evaluate
 * callbacks.
 */
function findOpenElementBase(tag: string): OpenElementBaseProbe {
  let base = customElements.get(tag) as CustomElementConstructor;
  for (let i = 0; i < 10 && base !== HTMLElement; i++) {
    const prototype = base.prototype as Record<string, unknown>;
    if (
      Object.prototype.hasOwnProperty.call(prototype, 'connectedCallback') &&
      Object.prototype.hasOwnProperty.call(prototype, 'registerSignal')
    ) {
      return { base };
    }
    base = Object.getPrototypeOf(base) as CustomElementConstructor;
  }
  return { error: 'OpenElement runtime class not found' };
}

/**
 * Source of findOpenElementBase. Pass it as a page.evaluate argument and
 * instantiate it inside the callback:
 * `const findBase = new Function('return (' + source + ')')() as FindOpenElementBase;`
 */
export const FIND_OPEN_ELEMENT_BASE_SOURCE = findOpenElementBase.toString();
