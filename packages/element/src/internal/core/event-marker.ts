/**
 * ./event-marker.ts - Deterministic event marker generation for SSR output.
 *
 * Pure, side-effect-free helper used by the SSR renderer to emit `data-eid`
 * markers. This module intentionally does NOT depend on the DOM binding layer
 * so that static-only bundles can use it without pulling in hydration code.
 *
 * Hydration-time binding logic lives in `event-hydration.ts`.
 *
 * @module ./event-marker.ts
 */

import { BRANCH_MARKER_PREFIX, DATA_EID } from '../protocol/hydration-markers.ts';

const EVENT_PROP_RE = /^on[A-Z]/;
const DASHED_EVENT_PROP_RE = /^on-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
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
  if (DASHED_EVENT_PROP_RE.test(prop)) return prop.slice(3);
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

/**
 * Branch-state token for a `<Show>` vnode. `truthy` is the resolved value of
 * the `when` prop at traversal time. Emitted as an HTML comment during SSR and
 * recomputed from the cached VNode during hydration (see BRANCH_MARKER_PREFIX).
 */
export function showBranchMarker(truthy: boolean): string {
  return `${BRANCH_MARKER_PREFIX}show:${truthy ? '1' : '0'}`;
}

/**
 * Branch-state token for a `<For>` vnode. Content-sensitive: the token
 * carries the item count plus a hash of per-item identities, so same-length
 * content drift between SSR and hydration (replaced or reordered items)
 * diverges the token sequence and triggers the degrade path instead of
 * mis-binding data-eid handlers. A non-array `each` emits the -1 empty-branch
 * token (mirrors the SSR fallback that renders an empty fragment).
 */
export function forBranchMarker(items: unknown): string {
  if (!Array.isArray(items)) return `${BRANCH_MARKER_PREFIX}for:-1`;
  let signature = '';
  for (let i = 0; i < items.length; i++) {
    signature += `${forItemSignature(items[i], i)};`;
  }
  return `${BRANCH_MARKER_PREFIX}for:${items.length}:${hashBranchSignature(signature)}`;
}

/**
 * Lightweight per-item identity for For branch markers. Primitives (and
 * symbols/bigints) sign as a length-prefixed string value so separator
 * characters inside a value cannot smuggle extra segments into the joined
 * signature; objects sign by a stable primitive `id`/`key` field when
 * present, otherwise by type + index. The fallback cannot distinguish a
 * same-shape object replacement at the same index — an accepted limitation
 * that avoids JSON.stringify on arbitrary (potentially large or circular)
 * objects.
 */
function forItemSignature(item: unknown, index: number): string {
  if (item === null) return 'null';
  const t = typeof item;
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint' || t === 'symbol') {
    const s = String(item);
    return `${t}:${s.length}:${s}`;
  }
  if (t === 'undefined') return 'undefined';
  const record = item as Record<string, unknown>;
  const id = record.id;
  const key = record.key;
  const stable = (typeof id === 'string' || typeof id === 'number')
    ? id
    : (typeof key === 'string' || typeof key === 'number')
    ? key
    : undefined;
  if (stable !== undefined) return `key:${String(stable)}`;
  return `${t}#${index}`;
}

/** djb2 string hash in base36 — cheap and deterministic across engines. */
function hashBranchSignature(signature: string): string {
  let hash = 5381;
  for (let i = 0; i < signature.length; i++) {
    hash = ((hash * 33) ^ signature.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}
