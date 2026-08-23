/**
 * event-marker.ts - Deterministic event marker generation for SSR output.
 *
 * Pure, side-effect-free helper used by the SSR renderer to emit `data-eid`
 * markers. This module intentionally does NOT depend on the DOM binding layer
 * so that static-only bundles can use it without pulling in hydration code.
 *
 * Hydration-time binding logic lives in `event-hydration.ts`.
 *
 * @module ./event-marker.ts
 */

import {
  BRANCH_MARKER_PREFIX,
  DATA_EID,
  FOR_END_PREFIX,
  FOR_ITEM_PREFIX,
} from '../protocol/hydration-markers.ts';

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
  /** Request-scoped evaluator supplied by an App page host during SSR. */
  evaluate?<T>(render: () => T): T;
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
export function forBranchMarker(
  items: unknown,
  /** Precomputed per-item keys (render-ir computes them once per render so a
   * getter with side effects is read exactly once per item). */
  keys?: readonly (string | number | undefined)[],
): string {
  if (!Array.isArray(items)) return `${BRANCH_MARKER_PREFIX}for:-1`;
  let signature = '';
  for (let i = 0; i < items.length; i++) {
    signature += `${forItemSignature(items[i], i, keys?.[i])};`;
  }
  return `${BRANCH_MARKER_PREFIX}for:${items.length}:${hashBranchSignature(signature)}`;
}

/**
 * Per-item boundary marker for a `<For>` list (value = item ordinal). Emitted
 * by SSR ahead of each item's content; hydration slices seeded list regions
 * between consecutive markers. Deliberately carries no key material — the
 * branch token above already guards content parity, and keys are recomputed
 * client-side from the resolved items + key fn.
 */
export function forItemBoundaryMarker(index: number): string {
  return `${FOR_ITEM_PREFIX}${index}`;
}

/** Region terminator emitted by SSR after a `<For>`'s last item. */
export function forEndMarker(): string {
  return FOR_END_PREFIX;
}

/**
 * Lightweight per-item identity for For branch markers. Primitives (and
 * symbols/bigints) sign as a length-prefixed string value so separator
 * characters inside a value cannot smuggle extra segments into the joined
 * signature; objects sign by a stable primitive `id`/`key` field (see
 * forItemKey) when present, otherwise by type + index. The fallback cannot
 * distinguish a same-shape object replacement at the same index — an
 * accepted limitation that avoids JSON.stringify on arbitrary (potentially
 * large or circular) objects.
 */
function forItemSignature(item: unknown, index: number, key?: string | number): string {
  if (item === null) return 'null';
  const t = typeof item;
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint' || t === 'symbol') {
    const s = String(item);
    return `${t}:${s.length}:${s}`;
  }
  if (t === 'undefined') return 'undefined';
  const stable = key !== undefined ? key : forItemKey(item);
  if (stable !== undefined) return `key:${String(stable)}`;
  return `${t}#${index}`;
}

/**
 * Stable key of a `<For>` item: a primitive `id`/`key` field when present,
 * else undefined. Shared by forItemSignature (branch tokens) and the #975
 * depth-trip path window (`for-item[key=…]` segments), so both read item
 * identity from exactly the same fields.
 */
export function forItemKey(item: unknown): string | number | undefined {
  if (item === null || typeof item !== 'object') return undefined;
  const record = item as Record<string, unknown>;
  const id = record.id;
  if (typeof id === 'string' || typeof id === 'number') return id;
  const key = record.key;
  if (typeof key === 'string' || typeof key === 'number') return key;
  return undefined;
}

/** djb2 string hash in base36 — cheap and deterministic across engines. */
function hashBranchSignature(signature: string): string {
  let hash = 5381;
  for (let i = 0; i < signature.length; i++) {
    hash = ((hash * 33) ^ signature.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}
