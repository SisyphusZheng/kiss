/**
 * Internal hydration helpers for OpenElement.
 *
 * Extracted from open-element.ts to isolate DSD signal/event hydration logic
 * from the base class lifecycle. These functions are NOT part of the public
 * package surface and should only be consumed by OpenElement itself.
 *
 * @internal
 * @module @openelement/element/open-element-hydration
 */

import { collectEventBindings, hydrateEventMarkers, isVNode, renderToDom } from '@openelement/core';
import type { Signal } from '@openelement/signal';
import { effect } from '@openelement/signal';
import { disposeRenderBindings, type VNodeCacheAccess } from './open-element-render.js';
import type { OpenElement } from './open-element.js';

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
export function hydrateSignals(
  instance: OpenElement,
  shadowRoot: ShadowRoot,
  signalRegistry: Map<string, Signal<unknown>>,
  effectDisposers: Set<() => void>,
  eventCleanups: Array<() => void>,
  cache: VNodeCacheAccess,
): void {
  // --- Signal → textContent: data-signal="signalName" ---
  const signalEls = shadowRoot.querySelectorAll('[data-signal]');
  for (const el of signalEls) {
    const name = el.getAttribute('data-signal');
    if (!name) continue;
    const sig = signalRegistry.get(name);
    if (!sig) continue;

    // Skip textContent if this element has attribute or class binding.
    if (
      el.hasAttribute('data-signal-attr') ||
      el.hasAttribute('data-signal-class')
    ) continue;

    (el as HTMLElement).textContent = String(sig.value);
    const dispose = effect(() => {
      (el as HTMLElement).textContent = String(sig.value);
    });
    effectDisposers.add(dispose);
  }

  // --- Signal → CSS class: data-signal-class="className" (v0.28.1) ---
  // Toggles a CSS class based on signal truthiness.
  // Truthy (non-empty string / non-zero) → add class. Falsy → remove.
  const classSigEls = shadowRoot.querySelectorAll('[data-signal][data-signal-class]');
  for (const el of classSigEls) {
    const name = el.getAttribute('data-signal');
    const className = el.getAttribute('data-signal-class');
    if (!name || !className) continue;
    const sig = signalRegistry.get(name);
    if (!sig) continue;

    el.classList.toggle(className, !!sig.value);
    const dispose = effect(() => {
      el.classList.toggle(className, !!sig.value);
    });
    effectDisposers.add(dispose);
  }

  const attrSigEls = shadowRoot.querySelectorAll('[data-signal][data-signal-attr]');
  for (const el of attrSigEls) {
    const name = el.getAttribute('data-signal');
    const attrSpec = el.getAttribute('data-signal-attr');
    if (!name || !attrSpec) continue;
    const sig = signalRegistry.get(name);
    if (!sig) continue;

    const attrNames = attrSpec.split(',').map((a) => a.trim()).filter(Boolean);
    if (attrNames.length === 0) continue;

    const val = String(sig.value);
    for (const an of attrNames) {
      el.setAttribute(an, val);
    }

    const dispose = effect(() => {
      const v = String(sig.value);
      for (const an of attrNames) {
        el.setAttribute(an, v);
      }
    });
    effectDisposers.add(dispose);
  }

  // --- Signal → VNode rendering: data-signal-render="signalName" (v0.30.1 / ADR-0081) ---
  // Signal value is VNode | VNode[] — renderToDom handles event binding + XSS escape.
  const renderEls = shadowRoot.querySelectorAll('[data-signal-render]');
  for (const el of renderEls) {
    const name = el.getAttribute('data-signal-render');
    if (!name) continue;
    const sig = signalRegistry.get(name);
    if (!sig) continue;

    const renderTarget = () => {
      while (el.firstChild) el.removeChild(el.firstChild);
      const v = sig.value;
      if (v != null) {
        const nodes = Array.isArray(v) ? v : [v];
        for (const node of nodes) {
          el.appendChild(renderToDom(node, undefined, effectDisposers));
        }
      }
    };
    renderTarget();
    effectDisposers.add(effect(() => renderTarget()));
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
    void (instance as HTMLElement).offsetHeight;
  });
}

/**
 * Hydrate DSD DOM with signal and event bindings.
 *
 * v0.28 (ADR-0067): Disposes previous effects and events, then delegates to
 * hydrateSignals().
 */
export function hydrateExistingDom(
  instance: OpenElement,
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
