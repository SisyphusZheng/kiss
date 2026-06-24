/**
 * Internal rendering helpers for OpenElement.
 *
 * Extracted from open-element.ts to keep the base class focused on its
 * public lifecycle API. Exposed as a package subpath so Deno can emit its
 * types, but this is an internal implementation detail — consumers should
 * use OpenElement instead.
 *
 * @internal
 * @module @openelement/element/open-element-render
 */

import type { VNode } from '@openelement/protocol/vnode';
import { renderToDom } from '@openelement/core';
import { formatError } from '@openelement/core/errors';
import { createLogger } from '@openelement/core/logger';
import type { HydrationScope } from '@openelement/core/hydrate';

/**
 * Minimal structural stand-in for OpenElement instances.
 *
 * Avoids importing the real OpenElement class, which creates a circular
 * dependency that confuses Deno's npm type-generation. Only the members
 * actually used by the render helpers are declared.
 */
export interface OpenElementLike {
  render(): unknown;
  shadowRoot: ShadowRoot | null;
  createRenderRoot(): void;
  signalRegistry: Map<string, import('@openelement/protocol/signal').Signal<unknown>>;
  tagName: string;
}

interface OpenElementLikeConstructor {
  renderMode?: 'shadow' | 'light';
}

/**
 * CSR render path for light-DOM components.
 *
 * Clears previous bindings, calls render(), caches the result, and mounts the
 * produced DOM into the element itself.
 */
export function renderIntoLightDom(
  instance: OpenElementLike,
  scope: HydrationScope,
): void {
  scope.reset();

  const result = instance.render();
  scope.cacheAccess.set(result);

  const self = instance as unknown as HTMLElement;
  while (self.firstChild) {
    self.removeChild(self.firstChild);
  }

  if (result != null) {
    self.appendChild(
      renderToDom(
        result,
        { disposers: scope._effectDisposers },
        undefined,
        instance.signalRegistry,
      ),
    );
  }
}

/**
 * CSR render path for shadow-DOM components.
 *
 * Clears previous bindings, calls render(), caches the result, and mounts the
 * produced DOM into the shadow root.
 */
export function renderIntoShadowRoot(
  instance: OpenElementLike,
  scope: HydrationScope,
): void {
  const root = instance.shadowRoot;
  if (!root) return;

  scope.reset();

  const result = instance.render();
  scope.cacheAccess.set(result);

  if (result != null) {
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
    root.appendChild(
      renderToDom(
        result,
        { disposers: scope._effectDisposers },
        undefined,
        instance.signalRegistry,
      ),
    );
  }
}

/**
 * Render a fallback VNode when the unified client render/hydrate path throws.
 *
 * Ensures the render root exists, invokes onRenderError(), disposes any
 * previous bindings, and mounts the fallback content.
 */
export function renderErrorFallback(
  instance: OpenElementLike,
  error: unknown,
  scope: HydrationScope,
  onRenderError: (error: unknown) => VNode | null,
): void {
  const ctor = instance.constructor as unknown as OpenElementLikeConstructor;
  const isLightDom = ctor.renderMode === 'light';

  if (!instance.shadowRoot && !isLightDom) {
    instance.createRenderRoot();
  }

  const target = isLightDom ? (instance as unknown as HTMLElement) : instance.shadowRoot;
  if (!target) return;

  let fallback: VNode | null;
  try {
    fallback = onRenderError(error);
  } catch (fallbackError) {
    createLogger('dsd').error(
      `<${instance.tagName.toLowerCase()}> onRenderError failed: ${formatError(fallbackError)}`,
    );
    fallback = null;
  }

  scope.reset();

  if (fallback != null) {
    while (target.firstChild) {
      target.removeChild(target.firstChild);
    }
    target.appendChild(
      renderToDom(
        fallback,
        { disposers: scope._effectDisposers },
        undefined,
        instance.signalRegistry,
      ),
    );
  }
}
