/**
 * @openelement/core/hydrate - HydrationScope value object.
 *
 * Standalone container for the lifecycle state of a hydrated shadow root.
 * Owns effect disposers, event cleanups, and the cached VNode used for
 * declarative event marker binding. Designed to be usable without an
 * OpenElement instance so third-party framework runtimes can hydrate the
 * same DSD shadow root later.
 *
 * @module @openelement/core/hydrate
 */

import type { Signal } from '@openelement/protocol/signal';
import { applyBindingDescriptor } from './binding-activation.js';
import { collectEventBindings, hydrateEventMarkers } from './event-hydration.js';
import { renderToDom } from './jsx-render-dom.js';
import { isVNode } from './vnode.js';
import { bindAttr, bindClass, bindRender, bindText } from './binding-descriptor.js';
import type { BindingDescriptor, BindingLifecycle, BindingRenderer } from './binding-descriptor.js';
import {
  DATA_SIGNAL,
  DATA_SIGNAL_ATTR,
  DATA_SIGNAL_CLASS,
  DATA_SIGNAL_RENDER,
  parseSignalAttrSpec,
} from '@openelement/protocol/hydration-markers';

/** Options for creating a HydrationScope. */
export interface HydrationScopeOptions {
  /** Signal registry used to resolve data-signal markers. */
  signalRegistry?: Map<string, Signal<unknown>>;
  /** Renderer used for signal-render and event-marker VNode rendering. */
  renderer?: BindingRenderer;
  /** Render function that produces the VNode used for event-marker hydration. */
  render?: () => unknown;
}

/** Read-only observables exposed for debugging. */
export interface HydrationScopeDebug {
  isActive: boolean;
  effectCount: number;
  eventCleanupCount: number;
}

/** Collect binding descriptors from data-signal markers in a shadow root. */
function collectHydrationBindings(
  shadowRoot: ShadowRoot,
  signalRegistry: Map<string, Signal<unknown>>,
  lifecycle: BindingLifecycle,
): BindingDescriptor[] {
  const descriptors: BindingDescriptor[] = [];

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
        descriptors.push(bindClass(el, className, sig));
      }
    }

    if (hasAttr) {
      const attrSpec = el.getAttribute(DATA_SIGNAL_ATTR);
      if (attrSpec) {
        const attrNames = parseSignalAttrSpec(attrSpec);
        if (attrNames.length > 0) {
          descriptors.push(bindAttr(el, attrNames, sig));
        }
      }
    }

    if (!hasClass && !hasAttr) {
      descriptors.push(bindText(el, sig));
    }
  }

  for (const el of shadowRoot.querySelectorAll(`[${DATA_SIGNAL_RENDER}]`)) {
    const name = el.getAttribute(DATA_SIGNAL_RENDER);
    if (!name) continue;
    const sig = signalRegistry.get(name);
    if (!sig) continue;

    descriptors.push(bindRender(el, sig, lifecycle));
  }

  return descriptors;
}

/**
 * Lifecycle scope for a hydrated shadow root.
 *
 * Keeps effect disposers, event listener cleanups, and the cached VNode in one
 * place so they can be disposed as a unit. The scope does not depend on
 * OpenElement; callers provide the signal registry and optional render function.
 */
export class HydrationScope {
  #effectDisposers: Set<() => void> = new Set();
  #eventCleanups: Array<() => void> = [];
  #signalRegistry: Map<string, Signal<unknown>>;
  #renderer: BindingRenderer;
  #render?: () => unknown;
  #cachedVNode: unknown = undefined;
  #cacheValid = false;
  #active = true;

  constructor(options: HydrationScopeOptions = {}) {
    this.#signalRegistry = options.signalRegistry ?? new Map();
    this.#renderer = options.renderer ?? {
      render: (node, lifecycle) => renderToDom(node, lifecycle),
    };
    this.#render = options.render;
  }

  /** Create a BindingLifecycle backed by this scope's effect disposers. */
  createLifecycle(): BindingLifecycle {
    return { disposers: this.#effectDisposers };
  }

  /** Set the cached VNode for event-marker hydration. */
  setCachedVNode(vnode: unknown): void {
    this.#cachedVNode = vnode;
    this.#cacheValid = true;
  }

  /** Resolve data-signal markers in a shadow root and activate bindings. */
  hydrate(shadowRoot: ShadowRoot, signalRegistry?: Map<string, Signal<unknown>>): void {
    if (!this.#active) return;

    const registry = signalRegistry ?? this.#signalRegistry;
    const lifecycle: BindingLifecycle = { disposers: this.#effectDisposers };
    const descriptors = collectHydrationBindings(shadowRoot, registry, lifecycle);

    for (const desc of descriptors) {
      if (desc.kind === 'signal-render') {
        // Preserve the original DSD hydration contract: replace any SSR content
        // with the client-rendered VNode tree on first activation.
        while (desc.el.firstChild) desc.el.removeChild(desc.el.firstChild);
      }
      applyBindingDescriptor(desc, lifecycle, this.#renderer);
    }

    // Bind declarative event markers from the cached or freshly-rendered VNode.
    const vnode = this.#resolveVNode();
    if (isVNode(vnode)) {
      const eventBindings = collectEventBindings(vnode);
      hydrateEventMarkers(
        shadowRoot,
        eventBindings,
        this.#eventCleanups,
        shadowRoot.host ?? undefined,
      );
    }

    // Chromium DSD layout fix: force reflow without DOM rebuild.
    requestAnimationFrame(() => {
      void (shadowRoot.host as HTMLElement | undefined)?.offsetHeight;
    });
  }

  /** Dispose all effects and event listeners tracked by this scope. */
  dispose(): void {
    if (!this.#active) return;
    this.#active = false;

    this.#clearBindings();
  }

  /**
   * Clear effects and event listeners without deactivating the scope.
   *
   * Used before re-rendering or re-hydrating an existing shadow root so the
   * scope can accept a fresh set of bindings. Does not gate on #active so
   * that a disconnected-then-reconnected element can be re-hydrated.
   */
  reset(): void {
    this.#clearBindings();
  }

  #clearBindings(): void {
    for (const d of this.#effectDisposers) {
      try {
        d();
      } catch { /* ignore dispose errors */ }
    }
    this.#effectDisposers.clear();

    for (const f of this.#eventCleanups) {
      try {
        f();
      } catch { /* ignore cleanup errors */ }
    }
    this.#eventCleanups = [];

    this.#cachedVNode = undefined;
    this.#cacheValid = false;
  }

  /** Debug observables for testing and devtools. */
  get debug(): HydrationScopeDebug {
    return {
      isActive: this.#active,
      effectCount: this.#effectDisposers.size,
      eventCleanupCount: this.#eventCleanups.length,
    };
  }

  #resolveVNode(): unknown {
    if (this.#cacheValid) return this.#cachedVNode;
    if (this.#render) {
      const vnode = this.#render();
      this.#cachedVNode = vnode;
      this.#cacheValid = true;
      return vnode;
    }
    return undefined;
  }
}
