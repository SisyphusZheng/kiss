/**
 * Internal hydration helpers for OpenElement.
 *
 * Extracted from open-element.ts to isolate DSD signal/event hydration logic
 * from the base class lifecycle. Exposed as a package subpath so Deno can emit
 * its types, but this is an internal implementation detail — consumers should
 * use OpenElement instead.
 *
 * @internal
 * @module @openelement/element/open-element-hydration
 */

import {
  applyBindingDescriptor,
  collectEventBindings,
  hydrateEventMarkers,
  isVNode,
  renderToDom,
} from '@openelement/core';
import type { BindingDescriptor, BindingLifecycle, BindingRenderer } from '@openelement/core';
import type { Signal } from '@openelement/protocol/signal';
import {
  DATA_SIGNAL,
  DATA_SIGNAL_ATTR,
  DATA_SIGNAL_CLASS,
  DATA_SIGNAL_RENDER,
  parseSignalAttrSpec,
} from '@openelement/protocol/hydration-markers';
import {
  disposeRenderBindings,
  type OpenElementLike,
  type VNodeCacheAccess,
} from './open-element-render.js';

/**
 * v0.28 (ADR-0067): Signal-native hydration.
 *
 * Reads data-signal markers from the DSD shadow root and creates direct
 * signal→DOM effect bindings. No position matching, no childNodes filtering,
 * no VNode traversal.
 *
 * Effects are added to `effectDisposers` for batch cleanup. VNode event marker
 * listeners are added to `eventCleanups`.
 */
function collectHydrationBindings(
  shadowRoot: ShadowRoot,
  signalRegistry: Map<string, Signal<unknown>>,
): BindingDescriptor[] {
  const descriptors: BindingDescriptor[] = [];

  // --- Signal → text / class / attribute bindings: data-signal="signalName" ---
  for (const el of shadowRoot.querySelectorAll(`[${DATA_SIGNAL}]`)) {
    const name = el.getAttribute(DATA_SIGNAL);
    if (!name) continue;
    const sig = signalRegistry.get(name);
    if (!sig) continue;

    const hasClass = el.hasAttribute(DATA_SIGNAL_CLASS);
    const hasAttr = el.hasAttribute(DATA_SIGNAL_ATTR);

    if (hasClass) {
      const className = el.getAttribute(DATA_SIGNAL_CLASS);
      if (className) {
        descriptors.push({
          kind: 'signal-class',
          el,
          className,
          signal: sig,
        });
      }
    }

    if (hasAttr) {
      const attrSpec = el.getAttribute(DATA_SIGNAL_ATTR);
      if (attrSpec) {
        const attrNames = parseSignalAttrSpec(attrSpec);
        if (attrNames.length > 0) {
          descriptors.push({
            kind: 'signal-attr',
            el,
            attrNames,
            signal: sig,
          });
        }
      }
    }

    if (!hasClass && !hasAttr) {
      descriptors.push({
        kind: 'signal-text',
        el,
        signal: sig,
      });
    }
  }

  // --- Signal → VNode rendering: data-signal-render="signalName" (v0.30.1 / ADR-0081) ---
  for (const el of shadowRoot.querySelectorAll(`[${DATA_SIGNAL_RENDER}]`)) {
    const name = el.getAttribute(DATA_SIGNAL_RENDER);
    if (!name) continue;
    const sig = signalRegistry.get(name);
    if (!sig) continue;

    descriptors.push({
      kind: 'signal-render',
      el,
      signal: sig,
      lifecycle: {}, // Filled by hydrateSignals before application.
    });
  }

  return descriptors;
}

export function hydrateSignals(
  instance: OpenElementLike,
  shadowRoot: ShadowRoot,
  signalRegistry: Map<string, Signal<unknown>>,
  effectDisposers: Set<() => void>,
  eventCleanups: Array<() => void>,
  cache: VNodeCacheAccess,
): void {
  const lifecycle: BindingLifecycle = { disposers: effectDisposers };
  const descriptors = collectHydrationBindings(shadowRoot, signalRegistry);
  const renderer: BindingRenderer = {
    render: (node: unknown, childLifecycle: BindingLifecycle) => renderToDom(node, childLifecycle),
  };

  for (const desc of descriptors) {
    if (desc.kind === 'signal-render') {
      desc.lifecycle = lifecycle;
      // Preserve the original DSD hydration contract: replace any SSR content
      // with the client-rendered VNode tree on first activation.
      while (desc.el.firstChild) desc.el.removeChild(desc.el.firstChild);
    }
    applyBindingDescriptor(desc, lifecycle, renderer);
  }

  // v0.28.1: Cache VNode so SSR and hydration use the same event IDs.
  // render() may have been called at build time for SSR — reuse cached VNode
  // if available, otherwise call render() once and cache for hydration.
  if (!cache.get().valid) {
    cache.set(instance.render());
  }
  const vnode = cache.get().vnode;
  if (isVNode(vnode)) {
    hydrateEventMarkers(shadowRoot, collectEventBindings(vnode), eventCleanups, instance);
  }

  // Chromium DSD layout fix: force reflow without DOM rebuild
  requestAnimationFrame(() => {
    void (instance as unknown as HTMLElement).offsetHeight;
  });
}

/**
 * Hydrate DSD DOM with signal and event bindings.
 *
 * v0.28 (ADR-0067): Disposes previous effects and events, then delegates to
 * hydrateSignals().
 */
export function hydrateExistingDom(
  instance: OpenElementLike,
  signalRegistry: Map<string, Signal<unknown>>,
  effectDisposers: Set<() => void>,
  eventCleanups: Array<() => void>,
  cache: VNodeCacheAccess,
): Array<() => void> {
  if (!instance.shadowRoot) return eventCleanups;

  const newEventCleanups = disposeRenderBindings(effectDisposers, eventCleanups);
  hydrateSignals(
    instance,
    instance.shadowRoot,
    signalRegistry,
    effectDisposers,
    newEventCleanups,
    cache,
  );

  return newEventCleanups;
}
