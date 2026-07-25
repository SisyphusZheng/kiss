/**
 * ./hydrate.ts - DSD interactive runtime surface.
 *
 * Includes the static rendering surface plus marker-based event hydration
 * and DSD shadow-root hydration helpers. Used by DSD interactive islands.
 *
 * ADR-0109 Phase 1: split ./index.ts into static, hydrate, and csr.
 */

export * from './static.ts';

// Hydration scope
export { hasSelfHydrated, HydrationScope, markSelfHydrated } from './hydration-scope.ts';
export type { HydrationScopeDebug, HydrationScopeOptions } from './hydration-scope.ts';

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

// Marker-based event hydration (DOM-specific parts not in static.ts)
export {
  collectEventBindings,
  eventRecordsToDescriptors,
  hydrateEventMarkers,
} from './event-hydration.ts';
export type { EventBinding, EventBindingRecord } from './event-hydration.ts';

// Client runtime for third-party frameworks
export { disposeOpenElement, hydrateOpenElement } from './client-runtime.ts';
export type { ClientRuntimeOptions } from './client-runtime.ts';
