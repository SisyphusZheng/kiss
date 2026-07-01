/**
 * @openelement/core/csr - Client-side rendering runtime surface.
 *
 * Includes the static rendering surface plus the full DOM renderer and event
 * hydration helpers. Used for CSR fallbacks and pure islands.
 *
 * ADR-0109 Phase 1: split @openelement/core into static, hydrate, and csr.
 */

export * from './static.ts';

// Binding layer
export type {
  BindingDescriptor,
  BindingDispose,
  BindingLifecycle,
  BindingRenderer,
} from './binding-descriptor.ts';
export {
  bindAttr,
  bindClass,
  bindConditional,
  bindEvent,
  bindHtml,
  bindList,
  bindRef,
  bindRender,
  bindStaticAttr,
  bindStaticBoolean,
  bindStaticProp,
  bindStaticStyle,
  bindText,
} from './binding-descriptor.ts';
export {
  applyBindingDescriptor,
  commitBindings,
  registerBindingKind,
} from './binding-activation.ts';

// Full DOM renderer
export { applyProps, collectPropBindings, renderToDom } from './jsx-render-dom.ts';

// Event hydration (DOM-specific parts not already in static.ts)
export {
  collectEventBindings,
  eventRecordsToDescriptors,
  hydrateEventMarkers,
} from './event-hydration.ts';
export type { EventBinding, EventBindingRecord } from './event-hydration.ts';
