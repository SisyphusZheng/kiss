/**
 * hydration-markers.ts - DSD hydration marker contract.
 *
 * These constants and helpers define the canonical shape of the markers used
 * to re-connect signals and events between SSR output and client-side hydration.
 *
 * Keep marker string values stable: they are persisted in serialized HTML and
 * read by hydration code in `../core/index.ts` and `@openelement/element`.
 */

/** Marker that binds a named signal to an element's textContent. */
export const DATA_SIGNAL = 'data-signal';

/** Marker that lists the HTML attributes a signal drives on an element. */
export const DATA_SIGNAL_ATTR = 'data-signal-attr';

/** Marker that toggles a single CSS class based on a signal's truthiness. */
export const DATA_SIGNAL_CLASS = 'data-signal-class';

/** Marker that replaces an element's children with a signal's VNode value. */
export const DATA_SIGNAL_RENDER = 'data-signal-render';

/** Marker that identifies an element carrying serialized event bindings. */
export const DATA_EID = 'data-eid';

/**
 * Marker carrying the JSON-serialized public props of an SSR-rendered host,
 * read back on client upgrade to restore component state (#836).
 */
export const DATA_SSR_PROPS = 'data-ssr-props';

/**
 * HTML comment prefix recording the SSR-evaluated branch state of `<Show>`/`<For>`.
 *
 * SSR emits one `<!--oe-branch:...-->` comment per Show/For vnode, ahead of the
 * rendered branch content. Hydration replays the same traversal over the cached
 * VNode and compares token sequences; a divergence means runtime signal values
 * changed between SSR and hydration, so event-marker alignment can no longer be
 * trusted and the scope must fall back to client-side rendering.
 */
export const BRANCH_MARKER_PREFIX = 'oe-branch:';

/** Parsed value of a `data-signal-attr` attribute: a list of attribute names. */
type SignalAttrSpec = string[];

/**
 * Parse a `data-signal-attr` marker value into individual attribute names.
 *
 * The value is a comma-separated list (e.g. `"class,disabled"`). Empty entries
 * and surrounding whitespace are ignored, preserving the original attribute
 * order.
 *
 * @param value - Raw marker value from the DOM.
 * @returns Non-empty attribute names.
 */
export function parseSignalAttrSpec(value: string): SignalAttrSpec {
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}
