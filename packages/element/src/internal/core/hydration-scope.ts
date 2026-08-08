/**
 * hydration-scope.ts - HydrationScope value object.
 *
 * Standalone container for the lifecycle state of a hydrated shadow root.
 * Owns effect disposers, event cleanups, and the cached VNode used for
 * declarative event marker binding. Designed to be usable without an
 * OpenElement instance so third-party framework runtimes can hydrate the
 * same DSD shadow root later.
 *
 * @module ./hydration-scope.ts
 */

import type { Signal } from '../protocol/signal.ts';
import { applyBindingDescriptor } from './binding-activation.ts';
import {
  collectDomBranchMarkers,
  collectEventBindings,
  type EventBindingRecord,
  hydrateEventMarkers,
} from './event-hydration.ts';
import { renderToDom } from './jsx-render-dom.ts';
import { isVNode } from './vnode.ts';
import { bindAttr, bindClass, bindRender, bindText } from './binding-descriptor.ts';
import type { BindingDescriptor, BindingLifecycle, BindingRenderer } from './binding-descriptor.ts';
import {
  DATA_EID,
  DATA_SIGNAL,
  DATA_SIGNAL_ATTR,
  DATA_SIGNAL_CLASS,
  DATA_SIGNAL_RENDER,
  parseSignalAttrSpec,
} from '../protocol/hydration-markers.ts';
import { createLogger } from './logger.ts';
import { clearChildren } from './dom-utils.ts';

const scopeLog = createLogger('hydration');

/**
 * Elements whose shadow-root (or light-DOM) bindings are owned by the
 * element's own HydrationScope — set by OpenElement after a successful DSD
 * hydration or CSR render. client-runtime reads this to avoid stacking a
 * second HydrationScope onto an element that already hydrated itself (which
 * double-subscribed every signal marker and cleared signal-render targets a
 * second time).
 */
const selfHydratedElements = new WeakSet<Element>();

/** Record that an element manages its own bindings through its own scope. */
export function markSelfHydrated(el: Element): void {
  selfHydratedElements.add(el);
}

/** Whether an element manages its own bindings through its own scope. */
export function hasSelfHydrated(el: Element): boolean {
  return selfHydratedElements.has(el);
}

/** Options for creating a HydrationScope. */
interface HydrationScopeOptions {
  /** Signal registry used to resolve data-signal markers. */
  signalRegistry?: Map<string, Signal<unknown>>;
  /** Renderer used for signal-render and event-marker VNode rendering. */
  renderer?: BindingRenderer;
  /** Render function that produces the VNode used for event-marker hydration. */
  render?: () => unknown;
}

/** Read-only observables exposed for debugging. */
interface HydrationScopeDebug {
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
 *
 * Event-marker hydration is guarded: when the marker count or the
 * `<!--oe-branch:...-->` token sequence in the SSR DOM diverges from what the
 * cached VNode implies (signal drift between SSR and hydration, or transformed
 * SSR HTML), the scope warns and degrades to a client-side re-render of the
 * shadow root rather than binding handlers to misaligned elements.
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
      render: (node, lifecycle) => renderToDom(node, lifecycle, this.#signalRegistry),
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
  hydrate(
    shadowRoot: ShadowRoot,
    signalRegistry?: Map<string, Signal<unknown>>,
  ): void {
    if (!this.#active) return;

    const registry = signalRegistry ?? this.#signalRegistry;
    const lifecycle: BindingLifecycle = { disposers: this.#effectDisposers };

    // Bind declarative event markers from the cached or freshly-rendered VNode.
    const vnode = this.#resolveVNode();
    if (isVNode(vnode)) {
      const expectedBranches: string[] = [];
      const eventBindings = collectEventBindings(vnode, expectedBranches);
      if (!this.#matchesSsrDom(shadowRoot, eventBindings, expectedBranches)) {
        // The SSR DOM cannot be trusted to line up with the VNode-derived
        // bindings (eid count drift or Show/For branch flip between SSR and
        // hydration). Binding anyway would attach handlers to the wrong
        // elements, so degrade this scope to a client-side re-render.
        scopeLog.warn(
          'SSR/hydration mismatch (event markers or Show/For branch state); ' +
            'falling back to client-side render for this shadow root.',
        );
        this.#renderClientSide(shadowRoot, vnode, lifecycle);
        this.#scheduleLayoutFix(shadowRoot);
        return;
      }

      this.#activateSignalBindings(shadowRoot, registry, lifecycle);
      hydrateEventMarkers(
        shadowRoot,
        eventBindings,
        this.#eventCleanups,
        shadowRoot.host ?? undefined,
      );
    } else {
      this.#activateSignalBindings(shadowRoot, registry, lifecycle);
    }

    this.#scheduleLayoutFix(shadowRoot);
  }

  #activateSignalBindings(
    shadowRoot: ShadowRoot,
    registry: Map<string, Signal<unknown>>,
    lifecycle: BindingLifecycle,
  ): void {
    const descriptors = collectHydrationBindings(
      shadowRoot,
      registry,
      lifecycle,
    );

    for (const desc of descriptors) {
      if (desc.kind === 'signal-render') {
        // Preserve the original DSD hydration contract: replace any SSR content
        // with the client-rendered VNode tree on first activation.
        clearChildren(desc.el);
      }
      applyBindingDescriptor(desc, lifecycle, this.#renderer);
    }
  }

  /**
   * Determinism guard for marker-based event hydration.
   *
   * SSR (renderToNode) and hydration (collectEventBindings) assign `data-eid`
   * values in the same traversal order, so the marker count in the serialized
   * DOM must equal the binding count derived from the cached VNode, and the
   * `<!--oe-branch:...-->` token sequence must match exactly. Any drift means
   * runtime signal values changed between SSR and hydration (or the SSR HTML
   * was transformed), in which case position-based binding would be wrong.
   */
  #matchesSsrDom(
    shadowRoot: ShadowRoot,
    eventBindings: Map<string, EventBindingRecord[]>,
    expectedBranches: string[],
  ): boolean {
    const markerCount = shadowRoot.querySelectorAll(`[${DATA_EID}]`).length;
    if (markerCount !== eventBindings.size) return false;

    const domBranches = collectDomBranchMarkers(shadowRoot);
    if (domBranches.length !== expectedBranches.length) return false;
    return domBranches.every((token, index) => token === expectedBranches[index]);
  }

  /** Degrade to a full client-side render when SSR DOM alignment is broken. */
  #renderClientSide(
    shadowRoot: ShadowRoot,
    vnode: unknown,
    lifecycle: BindingLifecycle,
  ): void {
    clearChildren(shadowRoot);
    shadowRoot.appendChild(this.#renderer.render(vnode, lifecycle));
  }

  /**
   * Chromium DSD layout fix: force reflow without DOM rebuild.
   *
   * Batched module-wide: every hydrated host queues into one set, and a
   * single requestAnimationFrame forces reflow for all of them, instead of
   * scheduling one rAF per hydrated component.
   */
  #scheduleLayoutFix(shadowRoot: ShadowRoot): void {
    queueLayoutFixHost(shadowRoot.host);
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
    this.#active = true;
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

// ─── Module-wide batched Chromium DSD layout fix ──────────────────────
// #896: chunked per-frame flush — a mass hydration (thousands of hosts in
// one frame) must not force thousands of synchronous reflows in a single
// rAF callback. Each frame drains at most LAYOUT_FIX_CHUNK_SIZE hosts and
// schedules the next chunk; small batches still flush in one frame.
const LAYOUT_FIX_CHUNK_SIZE = 100;
const LAYOUT_FIX_WARN_THRESHOLD = 500;
const layoutFixHosts = new Set<Element>();
let layoutFixScheduled = false;
let layoutFixWarned = false;

function flushLayoutFixHosts(): void {
  layoutFixScheduled = false;
  const chunk: Element[] = [];
  for (const host of layoutFixHosts) {
    chunk.push(host);
    if (chunk.length >= LAYOUT_FIX_CHUNK_SIZE) break;
  }
  for (const host of chunk) {
    layoutFixHosts.delete(host);
    void (host as HTMLElement).offsetHeight;
  }
  if (layoutFixHosts.size === 0) return;
  if (typeof globalThis.requestAnimationFrame === 'function') {
    layoutFixScheduled = true;
    globalThis.requestAnimationFrame(flushLayoutFixHosts);
  } else {
    // No rAF (non-browser runtimes): drain the remaining chunks
    // synchronously. Without this, the queued hosts would never drain (and
    // stay strongly referenced) and the reflow fix would be lost (#845).
    flushLayoutFixHosts();
  }
}

function queueLayoutFixHost(host: Element | undefined): void {
  if (!host) return;
  layoutFixHosts.add(host);
  if (layoutFixHosts.size > LAYOUT_FIX_WARN_THRESHOLD && !layoutFixWarned) {
    layoutFixWarned = true;
    console.warn(
      `[openElement] ${layoutFixHosts.size} hosts queued for the DSD layout fix in one frame; ` +
        'a hydration pathology is likely (thousands of elements per frame).',
    );
  }
  if (layoutFixScheduled) return;
  layoutFixScheduled = true;
  if (typeof globalThis.requestAnimationFrame === 'function') {
    globalThis.requestAnimationFrame(flushLayoutFixHosts);
  } else {
    // No rAF (non-browser runtimes): flush synchronously. Without this
    // fallback layoutFixScheduled would latch forever, the queued hosts would
    // never drain (and stay strongly referenced), and the reflow fix would be
    // permanently lost (#845).
    flushLayoutFixHosts();
  }
}
