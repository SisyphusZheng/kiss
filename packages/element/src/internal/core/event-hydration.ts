/**
 * Marker-based event hydration for SSR VNode output.
 *
 * SSR emits deterministic `data-eid` markers (plus `<!--oe-branch:...-->`
 * branch-state comments for `<Show>`/`<For>`). During DSD upgrade,
 * OpenElement renders the same VNode tree in memory, collects event handlers in
 * the same traversal order, and binds them to matching DOM markers without
 * replacing the existing DSD DOM. HydrationScope validates the marker count
 * and branch-token sequence before binding; on any divergence it degrades the
 * scope to a client-side re-render instead of mis-binding handlers.
 */

import { isForTag, isFragment, isShowTag } from './jsx-runtime.ts';
import { isSignalLike, unwrapSignalLike } from '../signal/index.ts';
import type { Signal } from '../protocol/signal.ts';
import { isComponentCtor, isVNode } from './vnode.ts';
import type { ComponentCtor, ComponentFn, RenderFn, VNode } from '../protocol/vnode.ts';
import {
  BRANCH_MARKER_PREFIX,
  DATA_EID,
  FOR_END_PREFIX,
  FOR_ITEM_PREFIX,
} from '../protocol/hydration-markers.ts';
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

export interface EventBindingRecord {
  id: string;
  type: string;
  handler: EventListener;
}

/** Hydration-time event binding contract (mirrors BindingDescriptor). */
type EventBinding = EventBindingDescriptor;

/**
 * A `<For>` encountered during the matched VNode walk. `branchOrdinal` is the
 * position of its branch token in the `branches` array — the same ordinal the
 * DOM group (collectListGroups) gets, so the two sides can be paired up.
 */
export interface ListTarget {
  branchOrdinal: number;
  items: Signal<unknown> | unknown;
  renderItem: RenderFn;
  keyFn?: (item: unknown, index: number) => string | number;
}

/**
 * A parsed `<For>` region in the SSR DOM: the branch comment anchor plus the
 * per-item boundary marker comments, in order (see collectListGroups).
 */
export interface ListDomGroup {
  branchOrdinal: number;
  anchor: Comment;
  /** One node range per item, in order (nested group markers live inside their item's range). */
  itemRanges: ChildNode[][];
}

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
  listTargets?: ListTarget[],
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

    if (isFragment(tag)) {
      visitChildren(children, visit);
      return;
    }

    if (isShowTag(tag)) {
      visitShowBranch(props, children, branches, visit);
      return;
    }

    if (isForTag(tag)) {
      visitForBranch(props, children, branches, listTargets, visit);
      return;
    }

    if (isComponentCtor(tag)) {
      visitComponentBranch(tag, props, visit);
      return;
    }

    if (typeof tag === 'function') {
      visitFunctionBranch(tag, props, children, visit);
      return;
    }

    const records = visitHostElement(props, children, visit);
    if (records.length > 0) {
      const id = eventMarkerId(count++);
      bindings.set(id, records.map((record) => ({ ...record, id })));
    }
  };

  visit(node);
  return bindings;
}

/** Fragment: visit children in traversal order. */
function visitChildren(children: unknown[], visit: (value: unknown) => void): void {
  for (const child of children) visit(child);
}

/** `<Show>`: push the resolved branch token, then visit the active child. */
function visitShowBranch(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  branches: string[] | undefined,
  visit: (value: unknown) => void,
): void {
  const whenVal = unwrapSignalLike(props?.when);
  branches?.push(showBranchMarker(Boolean(whenVal)));
  const target = whenVal ? children[0] : children[1];
  visit(target);
}

/** `<For>`: push the resolved branch token, then visit each rendered item. */
function visitForBranch(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  branches: string[] | undefined,
  listTargets: ListTarget[] | undefined,
  visit: (value: unknown) => void,
): void {
  const items = unwrapSignalLike(props?.each) as unknown[];
  const renderFn = children[0] as RenderFn;
  const branchOrdinal = branches?.push(forBranchMarker(items)) ?? 0;
  if (listTargets && typeof renderFn === 'function') {
    listTargets.push({
      branchOrdinal: branchOrdinal - 1,
      items: props?.each,
      renderItem: renderFn,
      keyFn: typeof props?.key === 'function'
        ? (props.key as (item: unknown, index: number) => string | number)
        : undefined,
    });
  }
  if (Array.isArray(items) && typeof renderFn === 'function') {
    items.forEach((item, i) => visit(renderFn(item, i)));
  }
}

/** Component constructor: instantiate with SSR props, then visit its render(). */
function visitComponentBranch(
  tag: ComponentCtor,
  props: Record<string, unknown> | undefined,
  visit: (value: unknown) => void,
): void {
  try {
    const instance = new tag();
    injectPropsSafe(instance, props ?? {}, `hydrate<${String(tag)}>`, hydrationLog);
    visit(instance.render());
  } catch (err) {
    hydrationLog.error(`Hydration component instantiation failed: ${formatError(err)}`);
  }
}

/** Function component: invoke with props + children, then visit the result. */
function visitFunctionBranch(
  tag: ComponentFn,
  props: Record<string, unknown> | undefined,
  children: unknown[],
  visit: (value: unknown) => void,
): void {
  try {
    visit(tag({ ...props, children }));
  } catch (err) {
    hydrationLog.error(`Hydration function component invocation failed: ${formatError(err)}`);
  }
}

/** Host element: collect handler records, visit children (SSR order), return records. */
function visitHostElement(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  visit: (value: unknown) => void,
): EventBindingRecord[] {
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

  return records;
}

function eventRecordsToDescriptors(
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

/**
 * Parse `<For>` regions out of the SSR DOM (matched-hydration path, #917).
 *
 * SSR emits one group per For branch: the branch comment anchor, a
 * `oe-for-item:N` marker ahead of each item's content, and a `oe-for-end`
 * terminator. Nested For groups (and Show branches, which carry no markers)
 * are consumed by recursive descent over the flat comment sequence, so each
 * group's item ranges are self-delimiting — nested markers live inside the
 * item range that contains them. The branch ordinal (position among ALL
 * branch tokens, Show included) matches the ordinal ListTarget got from
 * collectEventBindings, pairing each DOM group with its VNode-side target.
 */
export function collectListGroups(root: Element | ShadowRoot): ListDomGroup[] {
  const flat: Array<{ node: Comment; kind: 'branch' | 'item' | 'end' }> = [];
  const walk = (node: Element | ShadowRoot | ChildNode): void => {
    for (const child of node.childNodes) {
      if (child.nodeType === 8) {
        const data = (child as Comment).data;
        if (data.startsWith(BRANCH_MARKER_PREFIX)) {
          flat.push({ node: child as Comment, kind: 'branch' });
        } else if (data.startsWith(FOR_ITEM_PREFIX)) {
          flat.push({ node: child as Comment, kind: 'item' });
        } else if (data.startsWith(FOR_END_PREFIX)) {
          flat.push({ node: child as Comment, kind: 'end' });
        }
        continue;
      }
      walk(child);
    }
  };
  walk(root);

  const groups: ListDomGroup[] = [];
  let ordinal = 0;
  let i = 0;

  const sliceBetween = (a: Comment, b: Comment | null): ChildNode[] => {
    const out: ChildNode[] = [];
    let n = a.nextSibling;
    while (n && n !== b) {
      out.push(n);
      n = n.nextSibling;
    }
    return out;
  };

  const parseGroup = (): void => {
    if (i >= flat.length) return;
    const head = flat[i];
    const isFor = head.node.data.startsWith(`${BRANCH_MARKER_PREFIX}for:`);
    ordinal++;
    i++;
    if (!isFor) return; // Show branch: no list region; its content parses as the loop continues
    const anchor = head.node;
    const markers: Comment[] = [];
    let end: Comment | null = null;
    while (i < flat.length) {
      const inner = flat[i];
      if (inner.kind === 'item') {
        markers.push(inner.node);
        i++;
      } else if (inner.kind === 'branch') {
        parseGroup(); // nested group consumed wholly; its nodes stay inside the current item
      } else {
        end = inner.node;
        i++;
        break;
      }
    }
    const itemRanges = markers.map((marker, index) =>
      sliceBetween(marker, markers[index + 1] ?? end)
    );
    groups.push({ branchOrdinal: ordinal - 1, anchor, itemRanges });
  };

  while (i < flat.length) parseGroup();
  return groups;
}
