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
 * Browser-side: walk from a registered island component up the prototype
 * chain to the direct HTMLElement subclass — that is the OpenElement base
 * class. Must stay self-contained (no closure references): the source below
 * is injected into page.evaluate callbacks.
 */
function findOpenElementBase(tag: string): OpenElementBaseProbe {
  let base = customElements.get(tag) as CustomElementConstructor;
  for (let i = 0; i < 10 && Object.getPrototypeOf(base) !== HTMLElement; i++) {
    base = Object.getPrototypeOf(base) as CustomElementConstructor;
  }
  if (Object.getPrototypeOf(base) !== HTMLElement) {
    return { error: 'OpenElement base class not found' };
  }
  return { base };
}

/**
 * Source of findOpenElementBase. Pass it as a page.evaluate argument and
 * instantiate it inside the callback:
 * `const findBase = new Function('return (' + source + ')')() as FindOpenElementBase;`
 */
export const FIND_OPEN_ELEMENT_BASE_SOURCE = findOpenElementBase.toString();
