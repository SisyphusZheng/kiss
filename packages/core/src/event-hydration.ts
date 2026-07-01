/**
 * Marker-based event hydration for SSR VNode output.
 *
 * SSR emits deterministic `data-eid` markers. During DSD upgrade,
 * DsdElement renders the same VNode tree in memory, collects event handlers in
 * the same traversal order, and binds them to matching DOM markers without
 * replacing the existing DSD DOM.
 */

import { FOR_TAG, Fragment, SHOW_TAG } from './jsx-runtime.ts';
import { isSignalLike } from '@openelement/signal';
import { isComponentCtor, isVNode } from './vnode.ts';
import type { RenderFn, VNode } from '@openelement/protocol/vnode';
import { DATA_EID } from '@openelement/protocol/hydration-markers';
import { applyBindingDescriptor } from './binding-activation.ts';
import { bindEvent } from './binding-descriptor.ts';
import type { EventBindingDescriptor } from './binding-descriptor.ts';
import { eventMarkerId, eventTypeFromProp } from './event-marker.ts';

// Re-export pure marker helpers so existing consumers keep working.
export {
  createEventMarkerContext,
  eventMarkerId,
  eventTypeFromProp,
  serializeEventMarkers,
} from './event-marker.ts';
export type { EventMarkerContext } from './event-marker.ts';

export interface EventBindingRecord {
  id: string;
  type: string;
  handler: EventListener;
}

/** Hydration-time event binding contract (mirrors BindingDescriptor). */
export type EventBinding = EventBindingDescriptor;

export function collectEventBindings(node: unknown): Map<string, EventBindingRecord[]> {
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
      const whenVal = isSignalLike(props?.when)
        ? (props!.when as { value: unknown }).value
        : props?.when;
      const target = whenVal ? children[0] : children[1];
      visit(target);
      return;
    }

    if (tag === FOR_TAG || tag === 'fore') {
      const items = (isSignalLike(props?.each)
        ? (props!.each as { value: unknown }).value
        : props?.each) as unknown[];
      const renderFn = children[0] as RenderFn;
      if (Array.isArray(items) && typeof renderFn === 'function') {
        items.forEach((item, i) =>
          visit(renderFn(item, i))
        );
      }
      return;
    }

    if (isComponentCtor(tag)) {
      try {
        const instance = new tag();
        for (const [k, v] of Object.entries(props)) {
          (instance as Record<string, unknown>)[k] = v;
        }
        visit(instance.render());
      } catch {
        return;
      }
      return;
    }

    if (typeof tag === 'function') {
      try {
        visit((tag as (props: Record<string, unknown>) => unknown)({ ...props, children }));
      } catch {
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
