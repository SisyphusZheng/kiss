/**
 * @openelement/core/hydrate - DSD interactive runtime surface.
 *
 * Includes the static rendering surface plus marker-based event hydration
 * and DSD shadow-root hydration helpers. Used by DSD interactive islands.
 *
 * ADR-0109 Phase 1: split @openelement/core into static, hydrate, and csr.
 */

export * from './static.ts';

// Binding layer
export type { BindingDescriptor, BindingDispose, BindingLifecycle } from './binding-descriptor.ts';
export { applyBindingDescriptor } from './binding-activation.js';

// Marker-based event hydration (DOM-specific parts not in static.ts)
export {
  collectEventBindings,
  eventRecordsToDescriptors,
  hydrateEventMarkers,
} from './event-hydration.ts';
export type { EventBinding, EventBindingRecord } from './event-hydration.ts';

// DSD hydration contract
export { createDsdRenderRoot, hydrateDsdEvents } from './dsd-hydration.ts';
export type { Constructor, DsdHydration } from './dsd-hydration.ts';
export { bindHydrateEvents } from './dsd-hydration-events.js';
