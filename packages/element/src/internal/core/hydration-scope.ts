/**
 * Standalone container for the lifecycle state of a hydrated shadow root or
 * light-mode host subtree (ADR-0142). Owns effect disposers, event cleanups,
 * and the cached VNode used for declarative event marker binding. Designed to
 * be usable without an OpenElement instance so third-party framework runtimes
 * can hydrate the same DSD shadow root later.
 *
 * @module ./hydration-scope.ts
 */

import type { Signal } from '../protocol/signal.ts';
import { applyBindingDescriptor } from './binding-activation.ts';
import {
  collectDomBranchMarkers,
  collectEventBindings,
  collectListGroups,
  type EventBindingRecord,
  hydrateEventMarkers,
  isInsideNestedLightHost,
  type ListTarget,
} from './event-hydration.ts';
import { renderToDom } from './jsx-render-dom.ts';
import { isVNode } from './vnode.ts';
import { bindAttr, bindClass, bindList, bindRender, bindText } from './binding-descriptor.ts';
import { unwrapSignalLike } from '../signal/index.ts';
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
import { queueLayoutFixHost } from './layout-fix-queue.ts';
import {
  formatHydrationMismatchMessage,
  type HydrationMismatchDetail,
  isHydrationDevBuild,
} from './hydration-diagnostics.ts';

export {
  formatHydrationMismatchMessage,
  hasSelfHydrated,
  HYDRATION_MISMATCH_CODE,
  markSelfHydrated,
} from './hydration-diagnostics.ts';
export type { HydrationMismatchDetail, HydrationMismatchReason } from './hydration-diagnostics.ts';

const scopeLog = createLogger('hydration');

/** Options for creating a HydrationScope. */
interface HydrationScopeOptions {
  signalRegistry?: Map<string, Signal<unknown>>;
  renderer?: BindingRenderer;
  render?: () => unknown;
}

/** Read-only observables exposed for debugging. */
interface HydrationScopeDebug {
  isActive: boolean;
  effectCount: number;
  eventCleanupCount: number;
}

/**
 * Collect binding descriptors from data-signal markers in an activation root.
 *
 * `scopeLightHost` (ADR-0142, #1148) is set only when the root is a
 * light-mode host: markers inside a nested `data-oe-light` subtree bind in
 * the nested host's own scope and are pruned from this walk.
 */
function collectHydrationBindings(
  root: Element | ShadowRoot,
  signalRegistry: Map<string, Signal<unknown>>,
  lifecycle: BindingLifecycle,
  scopeLightHost = false,
): BindingDescriptor[] {
  const descriptors: BindingDescriptor[] = [];

  for (const el of root.querySelectorAll(`[${DATA_SIGNAL}]`)) {
    if (scopeLightHost && isInsideNestedLightHost(el, root)) continue;
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

  for (const el of root.querySelectorAll(`[${DATA_SIGNAL_RENDER}]`)) {
    if (scopeLightHost && isInsideNestedLightHost(el, root)) continue;
    const name = el.getAttribute(DATA_SIGNAL_RENDER);
    if (!name) continue;
    const sig = signalRegistry.get(name);
    if (!sig) continue;

    descriptors.push(bindRender(el, sig, lifecycle));
  }

  return descriptors;
}

/**
 * Lifecycle scope for a hydrated shadow root or light-mode host element.
 *
 * Keeps effect disposers, event listener cleanups, and the cached VNode in one
 * place so they can be disposed as a unit. The scope does not depend on
 * OpenElement; callers provide the signal registry and optional render function.
 *
 * Event-marker hydration is guarded: when the marker count or the
 * `<!--oe-branch:...-->` token sequence in the SSR DOM diverges from what the
 * cached VNode implies (signal drift between SSR and hydration, or transformed
 * SSR HTML), the scope warns and degrades to a client-side re-render of the
 * activation root rather than binding handlers to misaligned elements.
 *
 * ADR-0142 (#1148): the activation root may be a light-mode host element
 * carrying `data-oe-light`; nested light subtrees are then pruned from every
 * marker walk (`scopeLightHost`).
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

  /** Resolve data-signal markers in an activation root and activate bindings. */
  hydrate(
    root: ShadowRoot | HTMLElement,
    signalRegistry?: Map<string, Signal<unknown>>,
  ): void {
    if (!this.#active) return;

    // ADR-0142 (#1148): a light-mode host hydrates in place with the host
    // element itself as root. An Element has no `.host`, so `host === root`
    // identifies that case; nested light subtrees are then pruned from every
    // marker walk via scopeLightHost.
    const host: Element | undefined = (root as ShadowRoot).host ?? (root as unknown as Element);
    const isLightRoot = host === root;

    const registry = signalRegistry ?? this.#signalRegistry;
    const lifecycle: BindingLifecycle = { disposers: this.#effectDisposers };

    // Bind declarative event markers from the cached or freshly-rendered VNode.
    const vnode = this.#resolveVNode();
    if (isVNode(vnode)) {
      const expectedBranches: string[] = [];
      const listTargets: ListTarget[] = [];
      const eventBindings = collectEventBindings(vnode, expectedBranches, listTargets);
      const detail = this.#detectSsrMismatch(
        root,
        host,
        eventBindings,
        expectedBranches,
        isLightRoot,
      );
      if (detail) {
        // The SSR DOM cannot be trusted to line up with the VNode-derived
        // bindings (eid count drift or Show/For branch flip between SSR and
        // hydration). Binding anyway would attach handlers to the wrong
        // elements, so degrade this scope to a client-side re-render. The
        // warning carries the stable code and (as a second argument) the
        // structured detail; the message text carries the full detail in dev
        // builds and a one-line coded summary in production (#631).
        scopeLog.warn(
          formatHydrationMismatchMessage(
            detail,
            isHydrationDevBuild(),
            isLightRoot ? 'light' : 'shadow',
          ),
          detail,
        );
        this.#renderClientSide(root, vnode, lifecycle);
        this.#scheduleLayoutFix(host, isLightRoot);
        return;
      }

      this.#activateSignalBindings(root, registry, lifecycle, isLightRoot);
      this.#activateListBindings(root, listTargets, lifecycle, isLightRoot);
      hydrateEventMarkers(
        root,
        eventBindings,
        this.#eventCleanups,
        host ?? undefined,
        { scopeLightHost: isLightRoot },
      );
    } else {
      this.#activateSignalBindings(root, registry, lifecycle, isLightRoot);
    }

    this.#scheduleLayoutFix(host, isLightRoot);
  }

  #activateSignalBindings(
    root: ShadowRoot | HTMLElement,
    registry: Map<string, Signal<unknown>>,
    lifecycle: BindingLifecycle,
    scopeLightHost: boolean,
  ): void {
    const descriptors = collectHydrationBindings(
      root,
      registry,
      lifecycle,
      scopeLightHost,
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
   * Establish list bindings over the matched SSR DOM (#917): for each `<For>`
   * the VNode walk found, pair it with its DOM group (anchor comment + per-item
   * ranges from the oe-for-item markers) and seed a keyed/unkeyed list binding
   * so later item-signal writes reconcile the existing nodes instead of being
   * ignored. Without this, lists were inert after matched hydration and only
   * the degrade path restored reactivity.
   */
  #activateListBindings(
    root: ShadowRoot | HTMLElement,
    listTargets: ListTarget[],
    lifecycle: BindingLifecycle,
    scopeLightHost: boolean,
  ): void {
    if (listTargets.length === 0) return;
    const groups = collectListGroups(root, { scopeLightHost });
    for (const group of groups) {
      // Pair by branchOrdinal, not position: the ordinal counts ALL branches
      // (Show included) on both sides, while listTargets is a compact
      // For-only array — a Show preceding a For would shift a positional
      // lookup off by one (inert list or cross-wired items).
      const target = listTargets.find((t) => t.branchOrdinal === group.branchOrdinal);
      if (!target) continue;
      const items = unwrapSignalLike(target.items);
      const seed: Array<{ key?: string; nodes: ChildNode[] }> = [];
      if (Array.isArray(items)) {
        if (target.keyFn) {
          for (let i = 0; i < items.length; i++) {
            const range = group.itemRanges[i];
            if (!range) continue;
            seed.push({ key: String(target.keyFn(items[i], i)), nodes: range });
          }
        } else {
          seed.push({ nodes: group.itemRanges.flat() });
        }
      }
      applyBindingDescriptor(
        bindList(group.anchor, target.items, target.renderItem, target.keyFn, seed),
        lifecycle,
        this.#renderer,
      );
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
   *
   * Light roots (ADR-0142 readiness, #1148) additionally validate the exact
   * in-scope id multiset: the DOM `data-eid` values must be precisely the
   * VNode-derived set `e0..e(N-1)`, so a duplicated, missing, or substituted
   * id degrades even when the count matches. Bindings are id-keyed
   * (hydrateEventMarkers looks records up by `data-eid`), so REORDERED ids
   * are fine — only membership and uniqueness matter. Shadow roots keep the
   * historical count-only check (frozen behavior).
   *
   * Returns null on a match; on divergence returns the structured detail used
   * for the #631 diagnostic (checks run cheapest-first: marker count, light
   * id multiset, branch count, then token equality).
   */
  #detectSsrMismatch(
    root: ShadowRoot | HTMLElement,
    host: Element | undefined,
    eventBindings: Map<string, EventBindingRecord[]>,
    expectedBranches: string[],
    scopeLightHost: boolean,
  ): HydrationMismatchDetail | null {
    const hostTag = host?.tagName?.toLowerCase() ?? '(unknown host)';
    const markerEls = root.querySelectorAll(`[${DATA_EID}]`);
    let actualMarkers = markerEls.length;
    if (scopeLightHost) {
      // ADR-0142 (#1148): markers inside a nested light host's subtree bind in
      // the nested host's own scope — count only markers in this scope.
      actualMarkers = 0;
      for (const el of markerEls) {
        if (!isInsideNestedLightHost(el, root)) actualMarkers++;
      }
    }
    if (actualMarkers !== eventBindings.size) {
      return {
        reason: 'marker-count',
        hostTag,
        expectedMarkers: eventBindings.size,
        actualMarkers,
        expectedBranches,
        actualBranches: [],
      };
    }

    if (scopeLightHost) {
      // ADR-0142 readiness (#1148): count equality is not enough for a light
      // root — the in-scope DOM ids must be EXACTLY the VNode-derived id set
      // (e0..e(N-1)). A duplicated, missing, or substituted id means the SSR
      // DOM was hand-authored or transformed, and id-keyed binding would
      // mis-wire handlers. Reordered ids are fine: only membership and
      // uniqueness matter.
      const expectedMarkerIds = [...eventBindings.keys()];
      const actualMarkerIds: string[] = [];
      for (const el of markerEls) {
        if (isInsideNestedLightHost(el, root)) continue;
        actualMarkerIds.push(el.getAttribute(DATA_EID) ?? '');
      }
      const byId = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
      const sortedActual = [...actualMarkerIds].sort(byId).join('\n');
      const sortedExpected = [...expectedMarkerIds].sort(byId).join('\n');
      if (sortedActual !== sortedExpected) {
        return {
          reason: 'marker-id',
          hostTag,
          expectedMarkers: eventBindings.size,
          actualMarkers,
          expectedBranches,
          actualBranches: [],
          expectedMarkerIds,
          actualMarkerIds,
        };
      }
    }

    const actualBranches = collectDomBranchMarkers(root, { scopeLightHost });
    const base = {
      hostTag,
      expectedMarkers: eventBindings.size,
      actualMarkers,
      expectedBranches,
      actualBranches,
    };
    if (actualBranches.length !== expectedBranches.length) {
      return { reason: 'branch-count', ...base };
    }
    const divergedAt = expectedBranches.findIndex((token, i) => actualBranches[i] !== token);
    if (divergedAt !== -1) {
      return { reason: 'branch-token', ...base, divergedAt };
    }
    return null;
  }

  /** Degrade to a full client-side render when SSR DOM alignment is broken. */
  #renderClientSide(
    root: ShadowRoot | HTMLElement,
    vnode: unknown,
    lifecycle: BindingLifecycle,
  ): void {
    clearChildren(root);
    root.appendChild(this.#renderer.render(vnode, lifecycle));
  }

  /**
   * Chromium DSD layout fix: force reflow without DOM rebuild.
   *
   * Batched module-wide: every hydrated host queues into one set, and a
   * single requestAnimationFrame forces reflow for all of them, instead of
   * scheduling one rAF per hydrated component.
   *
   * DSD-only (ADR-0142 readiness, #1148): the fix works around a Chromium
   * declarative-shadow-DOM parser bug, so a light-mode activation root —
   * plain light DOM, no shadow root — must never be queued.
   */
  #scheduleLayoutFix(host: Element | undefined, isLightRoot: boolean): void {
    if (isLightRoot) return;
    queueLayoutFixHost(host);
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
