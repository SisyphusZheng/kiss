/**
 * Internal hydration helpers for OpenElement.
 *
 * Extracted from the OpenElement base class (open-element-implementation.ts)
 * to isolate DSD signal/event hydration logic
 * from the base class lifecycle. Not part of the package exports map —
 * internal implementation detail; consumers should use OpenElement instead.
 *
 * v0.41.0-alpha.2: The active hydration state now lives in the internal
 * hydration scope. This module keeps thin adapter functions that forward to
 * the scope so the OpenElement base class does not need to reach into
 * HydrationScope internals directly.
 *
 * @internal
 * @module ./open-element-hydration.ts
 */

import type { HydrationScope } from './internal/core/index.ts';
import type { OpenElementLike } from './open-element-render.ts';

/**
 * v0.28 (ADR-0067): Signal-native hydration.
 *
 * Delegates to the HydrationScope that owns this element's lifecycle state.
 */
function hydrateSignals(
  instance: OpenElementLike,
  shadowRoot: ShadowRoot,
  scope: HydrationScope,
): void {
  // Ensure the cache holds the current VNode before event-marker hydration.
  scope.setCachedVNode(instance.render());
  scope.hydrate(shadowRoot);
}

/**
 * Hydrate DSD DOM with signal and event bindings.
 *
 * v0.28 (ADR-0067): Disposes previous effects and events, then delegates to
 * hydrateSignals().
 */
export function hydrateExistingDom(
  instance: OpenElementLike,
  scope: HydrationScope,
): void {
  if (!instance.shadowRoot) return;

  scope.reset();
  hydrateSignals(instance, instance.shadowRoot, scope);
}

/**
 * Hydrate server-rendered light DOM in place (ADR-0142, #1148).
 *
 * Mirrors hydrateExistingDom but roots the scope at the host element itself:
 * the SSR subtree (proven by the host's `data-oe-light` marker) is activated
 * by binding its existing markers, so node identity, focus, form values, and
 * nested custom-element instances survive the upgrade.
 */
export function hydrateExistingLightDom(
  instance: OpenElementLike & HTMLElement,
  scope: HydrationScope,
): void {
  scope.reset();
  scope.setCachedVNode(instance.render());
  scope.hydrate(instance);
}
