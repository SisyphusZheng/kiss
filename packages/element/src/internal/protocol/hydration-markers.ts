/**
 * ./index.ts - DSD hydration marker contract.
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

/** All hydration marker attribute names. */
export type HydrationMarkerAttr =
  | typeof DATA_SIGNAL
  | typeof DATA_SIGNAL_ATTR
  | typeof DATA_SIGNAL_CLASS
  | typeof DATA_SIGNAL_RENDER
  | typeof DATA_EID;

/** Parsed value of a `data-signal-attr` attribute: a list of attribute names. */
export type SignalAttrSpec = string[];

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
