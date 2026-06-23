/**
 * @openelement/core - Deterministic event marker generation for SSR output.
 *
 * Pure, side-effect-free helper used by the SSR renderer to emit `data-eid`
 * markers. This module intentionally does NOT depend on the DOM binding layer
 * so that static-only bundles can use it without pulling in hydration code.
 *
 * Hydration-time binding logic lives in `event-hydration.ts`.
 *
 * @module @openelement/core/event-marker
 */

import { DATA_EID } from '@openelement/protocol/hydration-markers';

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
      return ` ${DATA_EID}="${context.nextId()}"`;
    }
  }
  return '';
}
