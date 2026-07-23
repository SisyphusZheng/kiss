/**
 * Marker-based event hydration for SSR VNode output.
 *
 * SSR emits deterministic `data-eid` markers (plus `<!--oe-branch:...-->`
 * branch-state comments for `<Show>`/`<For>`). During DSD upgrade,
 * DsdElement renders the same VNode tree in memory, collects event handlers in
 * the same traversal order, and binds them to matching DOM markers without
 * replacing the existing DSD DOM. HydrationScope validates the marker count
 * and branch-token sequence before binding; on any divergence it degrades the
 * scope to a client-side re-render instead of mis-binding handlers.
 */

import { FOR_TAG, Fragment, SHOW_TAG } from './jsx-runtime.ts';
import { isSignalLike, resolveSignalProp } from '../signal/index.ts';
import { isComponentCtor, isVNode } from './vnode.ts';
import type { RenderFn, VNode } from '../protocol/vnode.ts';
import { BRANCH_MARKER_PREFIX, DATA_EID } from '../protocol/hydration-markers.ts';
import { applyBindingDescriptor } from './binding-activation.ts';
import { bindEvent } from './binding-descriptor.ts';
import type { EventBindingDescriptor } from './binding-descriptor.ts';
import {
  eventMarkerId,
  eventTypeFromProp,
  forBranchMarker,
  showBranchMarker,
} from './event-marker.ts';
import { createLogger } from './logger.ts';
import { formatError } from './errors.ts';
import { injectPropsSafe } from './security.ts';

const hydrationLog = createLogger('hydration');

// Re-export pure marker helpers so existing consumers keep working.
export {
  createEventMarkerContext,
  eventMarkerId,
  eventTypeFromProp,
  forBranchMarker,
  serializeEventMarkers,
  showBranchMarker,
} from './event-marker.ts';
export type { EventMarkerContext } from './event-marker.ts';

export interface EventBindingRecord {
  id: string;
  type: string;
  handler: EventListener;
}

/** Hydration-time event binding contract (mirrors BindingDescriptor). */
export type EventBinding = EventBindingDescriptor;

/**
 * Walk a VNode tree in the exact order the SSR renderer (renderToNode) uses and
 * collect event bindings keyed by deterministic marker id (`e0`, `e1`, ...).
 *
 * When `branches` is provided, the resolved `<Show>`/`<For>` branch-state token
 * is appended in traversal order. SSR serializes the same tokens as
 * `<!--oe-branch:...-->` comments, so hydration can compare the two sequences
 * and detect signal drift between SSR and hydration instead of silently
 * mis-binding handlers (see HydrationScope.hydrate).
 */
export function collectEventBindings(
  node: unknown,
  branches?: string[],
): Map<string, EventBindingRecord[]> {
  const bindings = new Map<string, EventBindingRecord[]>();
  let count = 0;

  const visit = (value: unknown): void => {
    if (
      value == null || value === false || typeof value === 'string' || typeof value === 'number'
    ) {
      return;
    }
    if (isSignalLike(value)) {
      visit((value as { value: unknown }).value);
      return;
    }
    if (!isVNode(value)) return;

    const { tag, props, children } = value as VNode;

    if (
      tag === Fragment ||
      (typeof tag === 'symbol' && String(tag) === 'Symbol(openelement.fragment)')
    ) {
      for (const child of children) visit(child);
      return;
    }

    if (tag === SHOW_TAG || tag === 'show') {
      const whenVal = resolveSignalProp(props?.when);
      branches?.push(showBranchMarker(Boolean(whenVal)));
      const target = whenVal ? children[0] : children[1];
      visit(target);
      return;
    }

    if (tag === FOR_TAG || tag === 'for') {
      const items = resolveSignalProp(props?.each) as unknown[];
      const renderFn = children[0] as RenderFn;
      branches?.push(forBranchMarker(Array.isArray(items) ? items.length : -1));
      if (Array.isArray(items) && typeof renderFn === 'function') {
        items.forEach((item, i) => visit(renderFn(item, i)));
      }
      return;
    }

    if (isComponentCtor(tag)) {
      try {
        const instance = new tag();
        injectPropsSafe(instance, props, `hydrate<${String(tag)}>`, hydrationLog);
        visit(instance.render());
      } catch (err) {
        hydrationLog.error(`Hydration component instantiation failed: ${formatError(err)}`);
        return;
      }
      return;
    }

    if (typeof tag === 'function') {
      try {
        visit((tag as (props: Record<string, unknown>) => unknown)({ ...props, children }));
      } catch (err) {
        hydrationLog.error(`Hydration function component invocation failed: ${formatError(err)}`);
        return;
      }
      return;
    }

    const records: EventBindingRecord[] = [];
    for (const [key, value] of Object.entries(props ?? {})) {
      const type = eventTypeFromProp(key);
      if (type && typeof value === 'function') {
        records.push({
          id: '',
          type,
          handler: value as EventListener,
        });
      }
    }

    // Visit children before assigning an ID to this element so the order
    // matches SSR (renderToNode serializes children first).
    for (const child of children) visit(child);

    if (records.length > 0) {
      const id = eventMarkerId(count++);
      bindings.set(id, records.map((record) => ({ ...record, id })));
    }
  };

  visit(node);
  return bindings;
}

export function eventRecordsToDescriptors(
  el: Element,
  records: EventBindingRecord[],
  owner?: unknown,
): EventBinding[] {
  return records.map((record) => {
    const handler = owner && typeof record.handler === 'function'
      ? (record.handler as EventListener).bind(owner)
      : record.handler as EventListener;
    return bindEvent(el, record.type, handler);
  });
}

export function hydrateEventMarkers(
  root: Element | ShadowRoot,
  bindings: Map<string, EventBindingRecord[]>,
  cleanupBag: Array<() => void>,
  owner?: unknown,
): void {
  for (const el of root.querySelectorAll(`[${DATA_EID}]`)) {
    const id = el.getAttribute(DATA_EID);
    if (!id) continue;
    const records = bindings.get(id);
    if (!records) continue;
    for (const desc of eventRecordsToDescriptors(el, records, owner)) {
      const dispose = applyBindingDescriptor(desc, {});
      cleanupBag.push(dispose);
    }
  }
}

/**
 * Collect SSR branch-state comments (`<!--oe-branch:...-->`) from a shadow root
 * in document order. Compared against the tokens recomputed from the cached
 * VNode by collectEventBindings; any divergence means signal values changed
 * between SSR and hydration and marker-based binding must not proceed.
 */
export function collectDomBranchMarkers(root: Element | ShadowRoot): string[] {
  const tokens: string[] = [];
  const walk = (node: Element | ShadowRoot | ChildNode): void => {
    for (const child of node.childNodes) {
      if (child.nodeType === 8) {
        const data = (child as Comment).data;
        if (data.startsWith(BRANCH_MARKER_PREFIX)) tokens.push(data);
        continue;
      }
      walk(child);
    }
  };
  walk(root);
  return tokens;
}
