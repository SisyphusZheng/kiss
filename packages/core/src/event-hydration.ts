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

const EVENT_PROP_RE = /^on[A-Z]/;
const EVENT_TYPE_ALIASES: Record<string, string> = {
  Dblclick: 'dblclick',
  DoubleClick: 'dblclick',
  FocusIn: 'focusin',
  FocusOut: 'focusout',
  MouseEnter: 'mouseenter',
  MouseLeave: 'mouseleave',
  PointerCancel: 'pointercancel',
  PointerDown: 'pointerdown',
  PointerEnter: 'pointerenter',
  PointerLeave: 'pointerleave',
  PointerMove: 'pointermove',
  PointerOut: 'pointerout',
  PointerOver: 'pointerover',
  PointerUp: 'pointerup',
};

export interface EventBindingRecord {
  id: string;
  type: string;
  handler: EventListener;
}

export interface EventMarkerContext {
  nextId(): string;
}

export function createEventMarkerContext(): EventMarkerContext {
  let count = 0;
  return {
    nextId(): string {
      return eventMarkerId(count++);
    },
  };
}

export function eventMarkerId(index: number): string {
  return `e${index}`;
}

export function eventTypeFromProp(prop: string): string | null {
  if (!EVENT_PROP_RE.test(prop)) return null;
  const eventName = prop.slice(2);
  return EVENT_TYPE_ALIASES[eventName] ?? eventName.toLowerCase();
}

export function serializeEventMarkers(
  props: Record<string, unknown> | undefined,
  context: EventMarkerContext,
): string {
  if (!props) return '';
  for (const [key, value] of Object.entries(props)) {
    if (eventTypeFromProp(key) && typeof value === 'function') {
      return ` data-eid="${context.nextId()}"`;
    }
  }
  return '';
}

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

    if (records.length > 0) {
      const id = eventMarkerId(count++);
      bindings.set(id, records.map((record) => ({ ...record, id })));
    }

    for (const child of children) visit(child);
  };

  visit(node);
  return bindings;
}

export function hydrateEventMarkers(
  root: Element | ShadowRoot,
  bindings: Map<string, EventBindingRecord[]>,
  cleanupBag: Array<() => void>,
  owner?: unknown,
): void {
  for (const el of root.querySelectorAll('[data-eid]')) {
    const id = el.getAttribute('data-eid');
    if (!id) continue;
    const records = bindings.get(id);
    if (!records) continue;
    for (const record of records) {
      const handler = owner && typeof record.handler === 'function'
        ? (record.handler as EventListener).bind(owner)
        : record.handler as EventListener;
      el.addEventListener(record.type, handler);
      cleanupBag.push(() => el.removeEventListener(record.type, handler));
    }
  }
}
