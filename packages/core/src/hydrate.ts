/**
 * @openelement/core/hydrate - DSD interactive runtime surface.
 *
 * Includes the static rendering surface plus marker-based event hydration
 * and DSD shadow-root hydration helpers. Used by DSD interactive islands.
 *
 * ADR-0109 Phase 1: split @openelement/core into static, hydrate, and csr.
 */

export * from './static.js';

// Hydration scope
export { HydrationScope } from './hydration-scope.js';
export type { HydrationScopeDebug, HydrationScopeOptions } from './hydration-scope.js';

// Binding layer
export type {
  BindingDescriptor,
  BindingDispose,
  BindingLifecycle,
  BindingRenderer,
} from './binding-descriptor.js';
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
} from './binding-descriptor.js';
export {
  applyBindingDescriptor,
  commitBindings,
  registerBindingKind,
} from './binding-activation.js';

// Marker-based event hydration (DOM-specific parts not in static.ts)
export {
  collectEventBindings,
  eventRecordsToDescriptors,
  hydrateEventMarkers,
} from './event-hydration.js';
export type { EventBinding, EventBindingRecord } from './event-hydration.js';

// DSD hydration contract
export { createDsdRenderRoot, hydrateDsdEvents } from './dsd-hydration.js';
export type { Constructor, DsdHydration } from './dsd-hydration.js';

// Client runtime for third-party frameworks
export { disposeOpenElement, hydrateOpenElement } from './client-runtime.js';
export type { ClientRuntimeOptions } from './client-runtime.js';
