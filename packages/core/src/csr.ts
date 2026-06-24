/**
 * @openelement/core/csr - Client-side rendering runtime surface.
 *
 * Includes the static rendering surface plus the full DOM renderer and event
 * hydration helpers. Used for CSR fallbacks and pure islands.
 *
 * ADR-0109 Phase 1: split @openelement/core into static, hydrate, and csr.
 */

export * from './static.js';

// Binding layer
export type { BindingDescriptor, BindingDispose, BindingLifecycle } from './binding-descriptor.js';
export { applyBindingDescriptor } from './binding-activation.js';

// Full DOM renderer
export { applyProps, collectPropBindings, renderToDom } from './jsx-render-dom.js';

// Event hydration (DOM-specific parts not already in static.ts)
export {
  collectEventBindings,
  eventRecordsToDescriptors,
  hydrateEventMarkers,
} from './event-hydration.js';
export type { EventBinding, EventBindingRecord } from './event-hydration.js';
