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
  collectListGroups,
  type EventBindingRecord,
  hydrateEventMarkers,
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

const scopeLog = createLogger('hydration');

/**
 * Stable diagnostic code for SSR/hydration mismatches (#631), in the same
 * taxonomy style as the `OPEN_ELEMENT_RENDER_*` render codes. Kept as a
 * module-local constant: the client hydration path cannot reach the SSR
 * `RenderHooks.onError` channel (hooks are renderDsd options), so the
 * diagnostic stays logger-based with the code in the message and the
 * structured detail as a second logger argument.
 */
export const HYDRATION_MISMATCH_CODE = 'OPEN_ELEMENT_HYDRATION_MISMATCH';

/** Why the SSR shadow root diverged from the VNode-derived expectations. */
export type HydrationMismatchReason = 'marker-count' | 'branch-count' | 'branch-token';

/**
 * Structured detail for a hydration mismatch, attached to the warning as a
 * second logger argument so devtools/telemetry can consume it without
 * parsing the message. Counts/tokens are exactly what the detection point
 * knows: the `data-eid` marker count the client VNode implies vs the SSR
 * DOM, and the expected vs actual `oe-branch` token sequence.
 */
export interface HydrationMismatchDetail {
  reason: HydrationMismatchReason;
  /** Lowercased tag of the shadow host whose hydration degraded. */
  hostTag: string;
  expectedMarkers: number;
  actualMarkers: number;
  expectedBranches: string[];
  actualBranches: string[];
  /** Index of the first diverging branch token (reason 'branch-token' only). */
  divergedAt?: number;
}

// Mirrors the Vite half of the shared dev-mode signal (#743,
// packages/app/src/internal/dev-mode.ts): element is runtime-free, so it can
// only read the compile-time `import.meta.env.DEV` constant, never DENO_ENV.
interface ImportMetaWithEnv extends ImportMeta {
  env?: { DEV?: boolean };
}

function isDevBuild(): boolean {
  return (import.meta as ImportMetaWithEnv).env?.DEV === true;
}

/**
 * Format the mismatch warning. Development (Vite `import.meta.env.DEV`)
 * gets the full structured detail — counts, both token sequences, and the
 * divergence index — while production gets a one-line coded summary. The
 * detail object is always passed to the logger as a second argument.
 * Exported for tests; not part of the package public facade.
 */
export function formatHydrationMismatchMessage(
  detail: HydrationMismatchDetail,
  dev: boolean,
): string {
  if (!dev) {
    return `[${HYDRATION_MISMATCH_CODE}] SSR/hydration mismatch (${detail.reason}) on ` +
      `<${detail.hostTag}>; falling back to client-side render for this shadow root.`;
  }
  const lines = [
    `[${HYDRATION_MISMATCH_CODE}] SSR/hydration mismatch on <${detail.hostTag}>: ` +
    'the SSR shadow root diverged from the client VNode.',
  ];
  if (detail.reason === 'marker-count') {
    lines.push(
      `  data-eid event markers: expected ${detail.expectedMarkers} (client VNode), ` +
        `found ${detail.actualMarkers} (SSR DOM).`,
    );
  } else if (detail.reason === 'branch-count') {
    lines.push(
      `  oe-branch tokens: expected ${detail.expectedBranches.length} (client VNode), ` +
        `found ${detail.actualBranches.length} (SSR DOM).`,
    );
  } else {
    const at = detail.divergedAt ?? 0;
    lines.push(
      `  oe-branch token diverges at index ${at}: expected ` +
        `"${detail.expectedBranches[at]}", found "${detail.actualBranches[at]}".`,
    );
  }
  if (detail.reason !== 'marker-count') {
    lines.push(`  expected tokens: [${detail.expectedBranches.join(', ')}]`);
    lines.push(`  actual tokens:   [${detail.actualBranches.join(', ')}]`);
  }
  lines.push('Falling back to client-side render for this shadow root.');
  return lines.join('\n');
}

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
      const listTargets: ListTarget[] = [];
      const eventBindings = collectEventBindings(vnode, expectedBranches, listTargets);
      const detail = this.#detectSsrMismatch(shadowRoot, eventBindings, expectedBranches);
      if (detail) {
        // The SSR DOM cannot be trusted to line up with the VNode-derived
        // bindings (eid count drift or Show/For branch flip between SSR and
        // hydration). Binding anyway would attach handlers to the wrong
        // elements, so degrade this scope to a client-side re-render. The
        // warning carries the stable code and (as a second argument) the
        // structured detail; the message text carries the full detail in dev
        // builds and a one-line coded summary in production (#631).
        scopeLog.warn(formatHydrationMismatchMessage(detail, isDevBuild()), detail);
        this.#renderClientSide(shadowRoot, vnode, lifecycle);
        this.#scheduleLayoutFix(shadowRoot);
        return;
      }

      this.#activateSignalBindings(shadowRoot, registry, lifecycle);
      this.#activateListBindings(shadowRoot, listTargets, lifecycle);
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
   * Establish list bindings over the matched SSR DOM (#917): for each `<For>`
   * the VNode walk found, pair it with its DOM group (anchor comment + per-item
   * ranges from the oe-for-item markers) and seed a keyed/unkeyed list binding
   * so later item-signal writes reconcile the existing nodes instead of being
   * ignored. Without this, lists were inert after matched hydration and only
   * the degrade path restored reactivity.
   */
  #activateListBindings(
    shadowRoot: ShadowRoot,
    listTargets: ListTarget[],
    lifecycle: BindingLifecycle,
  ): void {
    if (listTargets.length === 0) return;
    const groups = collectListGroups(shadowRoot);
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
   * Returns null on a match; on divergence returns the structured detail used
   * for the #631 diagnostic (checks run cheapest-first: marker count, branch
   * count, then token equality).
   */
  #detectSsrMismatch(
    shadowRoot: ShadowRoot,
    eventBindings: Map<string, EventBindingRecord[]>,
    expectedBranches: string[],
  ): HydrationMismatchDetail | null {
    const hostTag = (shadowRoot.host as Element | undefined)?.tagName?.toLowerCase() ??
      '(unknown host)';
    const actualMarkers = shadowRoot.querySelectorAll(`[${DATA_EID}]`).length;
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

    const actualBranches = collectDomBranchMarkers(shadowRoot);
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
