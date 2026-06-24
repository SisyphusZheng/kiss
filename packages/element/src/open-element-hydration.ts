/**
 * Internal hydration helpers for OpenElement.
 *
 * Extracted from open-element.ts to isolate DSD signal/event hydration logic
 * from the base class lifecycle. Exposed as a package subpath so Deno can emit
 * its types, but this is an internal implementation detail — consumers should
 * use OpenElement instead.
 *
 * v0.41.0-alpha.2: The active hydration state now lives in a
 * `@openelement/core/hydrate` HydrationScope. This module keeps thin adapter
 * functions that forward to the scope so the OpenElement base class does not
 * need to reach into HydrationScope internals directly.
 *
 * @internal
 * @module @openelement/element/open-element-hydration
 */

import type { HydrationScope } from '@openelement/core/hydrate';
import type { OpenElementLike } from './open-element-render.js';

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
