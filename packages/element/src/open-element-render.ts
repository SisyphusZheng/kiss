/**
 * Internal rendering helpers for OpenElement.
 *
 * Extracted from open-element.ts to keep the base class focused on its
 * public lifecycle API. These functions are NOT part of the public package
 * surface and should only be consumed by OpenElement itself.
 *
 * @internal
 * @module @openelement/element/open-element-render
 */

import type { VNode } from '@openelement/core';
import { renderToDom } from '@openelement/core';
import { formatError } from '@openelement/core/errors';
import { createLogger } from '@openelement/core/logger';
import type { OpenElement } from './open-element.js';

/**
 * Minimal accessor for the VNode cache stored on an OpenElement instance.
 *
 * The cache lives as true private fields on the class, so helpers interact
 * with it through this small facade instead of trying to access #private
 * state from outside the class body.
 */
export interface VNodeCacheAccess {
  /** Read the current cached VNode and whether it is valid. */
  get(): { vnode: unknown; valid: boolean };
  /** Store a VNode and mark the cache valid. */
  set(vnode: unknown): void;
}

/**
 * Dispose all reactive effects and declarative event listeners created by
 * previous renders or hydration passes.
 *
 * Returns a fresh, empty event-cleanup array so callers can replace their
 * existing bag and avoid retaining stale closures.
 */
export function disposeRenderBindings(
  effectDisposers: Set<() => void>,
  eventCleanups: Array<() => void>,
): Array<() => void> {
  for (const d of effectDisposers) d();
  effectDisposers.clear();
  for (const f of eventCleanups) f();
  return [];
}

/**
 * CSR render path for light-DOM components.
 *
 * Clears previous bindings, calls render(), caches the result, and mounts the
 * produced DOM into the element itself.
 */
export function renderIntoLightDom(
  instance: OpenElement,
  effectDisposers: Set<() => void>,
  eventCleanups: Array<() => void>,
  cache: VNodeCacheAccess,
): Array<() => void> {
  const newEventCleanups = disposeRenderBindings(effectDisposers, eventCleanups);

  const result = instance.render();
  cache.set(result);

  const self = instance as HTMLElement;
  while (self.firstChild) {
    self.removeChild(self.firstChild);
  }

  if (result != null) {
    self.appendChild(renderToDom(result, undefined, effectDisposers));
  }

  return newEventCleanups;
}

/**
 * CSR render path for shadow-DOM components.
 *
 * Clears previous bindings, calls render(), caches the result, and mounts the
 * produced DOM into the shadow root.
 */
export function renderIntoShadowRoot(
  instance: OpenElement,
  effectDisposers: Set<() => void>,
  eventCleanups: Array<() => void>,
  cache: VNodeCacheAccess,
): Array<() => void> {
  const root = instance.shadowRoot;
  if (!root) return eventCleanups;

  const newEventCleanups = disposeRenderBindings(effectDisposers, eventCleanups);

  const result = instance.render();
  cache.set(result);

  if (result != null) {
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
    root.appendChild(renderToDom(result, undefined, effectDisposers));
  }

  return newEventCleanups;
}

/**
 * Render a fallback VNode when the unified render/hydrate path throws.
 *
 * Ensures the render root exists, invokes onRenderError(), disposes any
 * previous bindings, and mounts the fallback content.
 */
export function renderErrorFallback(
  instance: OpenElement,
  error: unknown,
  effectDisposers: Set<() => void>,
  eventCleanups: Array<() => void>,
  onRenderError: (error: unknown) => VNode | null,
): Array<() => void> {
  const ctor = instance.constructor as typeof OpenElement;
  const isLightDom = ctor.renderMode === 'light';

  if (!instance.shadowRoot && !isLightDom) {
    instance.createRenderRoot();
  }

  const target = isLightDom ? (instance as HTMLElement) : instance.shadowRoot;
  if (!target) return [];

  let fallback: VNode | null;
  try {
    fallback = onRenderError(error);
  } catch (fallbackError) {
    createLogger('dsd').error(
      `<${instance.tagName.toLowerCase()}> onRenderError failed: ${formatError(fallbackError)}`,
    );
    fallback = null;
  }

  const newEventCleanups = disposeRenderBindings(effectDisposers, eventCleanups);

  if (fallback != null) {
    while (target.firstChild) {
      target.removeChild(target.firstChild);
    }
    target.appendChild(renderToDom(fallback, undefined, effectDisposers));
  }

  return newEventCleanups;
}
