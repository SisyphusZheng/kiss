/**
 * @openelement/element — compiled Part Program runtime (v0.44 alpha.8).
 *
 * A Part Program v1 is executed by three entry points in this file:
 * `serializeToHtml`, `createFreshDom`, and `claimExistingDom`. They share the
 * same tree/Part/Region semantics. The browser path never performs selector or
 * marker discovery: markers are emitted and claimed only at compiler-owned
 * dynamic anchors, while fixed Parts resolve their compiler-owned paths once.
 * Part `location` records are the auditable identity of those same addresses;
 * the validator proves they agree with `path` before any mode runs.
 */

import type { SignalLike, Unsubscribe } from '../protocol/signal.ts';
import { noteCompiledProgramActivated } from '../signal/selection.ts';
import {
  partAnchorEndMarker,
  partAnchorMarker,
  type PartProgramSpike,
  type SpikeAttrPart,
  type SpikeBoolPart,
  type SpikeChildPart,
  type SpikeClassPart,
  type SpikeEachPart,
  type SpikeElementNode,
  type SpikeEventPart,
  type SpikeFixedPart,
  type SpikeHtmlPart,
  type SpikePropPart,
  type SpikeRefPart,
  type SpikeStylePart,
  type SpikeTextPart,
  type SpikeTreeNode,
  type SpikeWhenPart,
  STATIC_STYLES_MARKER,
  validatePartProgram,
} from './program.ts';

/** Structured diagnostic for claim-time structure/identity drift. */
export class PartProgramClaimError extends Error {
  readonly code = 'OPEN_ELEMENT_COMPILED_CLAIM_MISMATCH';
  readonly path: string;

  constructor(path: string, message: string) {
    super(`[compiled-claim] ${path}: ${message}`);
    this.name = 'PartProgramClaimError';
    this.path = path;
  }
}

export type CompiledEventHandler = (event: unknown) => void;
export type CompiledRefHandler = (element: Element | null) => void | Unsubscribe;

/** Host-provided state and behavior keyed by compiler-emitted names. */
export interface CompiledSpikeHost {
  signals: Record<string, SignalLike<unknown>>;
  handlers: Record<string, CompiledEventHandler>;
  refs?: Record<string, CompiledRefHandler>;
}

export interface CompiledSpikeInstance {
  dispose(): void;
}

/**
 * A scope is the lifetime owner for one Part or Region. Parent scopes own
 * nested scopes, so removing a Region disposes all nested subscriptions,
 * event listeners, and refs exactly once.
 */
class ResourceScope {
  #parent?: ResourceScope;
  #children = new Set<ResourceScope>();
  #cleanups: Array<() => void> = [];
  #rangeCleanups: Array<() => void> = [];
  #disposed = false;

  constructor(parent?: ResourceScope) {
    this.#parent = parent;
    if (parent) parent.#children.add(this);
  }

  child(): ResourceScope {
    return new ResourceScope(this);
  }

  get disposed(): boolean {
    return this.#disposed;
  }

  add(cleanup: () => void): void {
    if (this.#disposed) {
      cleanup();
      return;
    }
    this.#cleanups.push(cleanup);
  }

  addRangeCleanup(cleanup: () => void): void {
    if (this.#disposed) {
      cleanup();
      return;
    }
    this.#rangeCleanups.push(cleanup);
  }

  dispose(detachOwnedNodes = false): void {
    if (this.#disposed) return;
    this.#disposed = true;
    let firstError: unknown;
    let hasError = false;

    for (const child of [...this.#children]) {
      try {
        child.dispose(detachOwnedNodes);
      } catch (error) {
        hasError = true;
        firstError ??= error;
      }
    }
    this.#children.clear();

    for (const cleanup of this.#cleanups.splice(0).reverse()) {
      try {
        cleanup();
      } catch (error) {
        hasError = true;
        firstError ??= error;
      }
    }
    const rangeCleanups = this.#rangeCleanups.splice(0).reverse();
    if (detachOwnedNodes) {
      for (const cleanup of rangeCleanups) {
        try {
          cleanup();
        } catch (error) {
          hasError = true;
          firstError ??= error;
        }
      }
    }
    if (this.#parent) this.#parent.#children.delete(this);
    if (hasError) throw firstError;
  }
}

interface MountContext {
  program: PartProgramSpike;
  host: CompiledSpikeHost;
  rootScope: ResourceScope;
  fixedPartsByPath: Map<string, SpikeFixedPart[]>;
}

function createContext(program: PartProgramSpike, host: CompiledSpikeHost): MountContext {
  const fixedPartsByPath = new Map<string, SpikeFixedPart[]>();
  for (const part of program.parts) {
    if (!isFixedPart(part)) continue;
    const key = part.path.join('.');
    const list = fixedPartsByPath.get(key) ?? [];
    list.push(part);
    fixedPartsByPath.set(key, list);
  }
  return {
    program,
    host,
    rootScope: new ResourceScope(),
    fixedPartsByPath,
  };
}

function signalOf(ctx: MountContext, name: string): SignalLike<unknown> {
  const signal = ctx.host.signals[name];
  if (!signal) throw new Error(`[compiled-runtime] missing host signal "${name}"`);
  return signal;
}

/**
 * Subscribe to future writes only. Preact's adapter delivers a synchronous
 * initial effect; a conforming lazy engine may not. Only that exact
 * subscription-time echo is ignored, so a lazy engine's first real write is
 * never lost.
 */
function subscribeWrites(
  ctx: MountContext,
  scope: ResourceScope,
  name: string,
  fn: (value: unknown) => void,
): void {
  const signal = signalOf(ctx, name);
  const snapshot = signal.value;
  let subscribeReturned = false;
  const unsub = signal.subscribe((value) => {
    if (!subscribeReturned && Object.is(value, snapshot)) return;
    if (!scope.disposed) fn(value);
  });
  subscribeReturned = true;
  if (typeof unsub !== 'function') {
    throw new Error(`[compiled-runtime] signal "${name}" returned an invalid unsubscribe`);
  }
  scope.add(unsub);
}

function isFixedPart(part: PartProgramSpike['parts'][number]): part is SpikeFixedPart {
  return (
    part.k === 'attr' || part.k === 'prop' || part.k === 'bool' || part.k === 'class' ||
    part.k === 'style' || part.k === 'html' || part.k === 'event' || part.k === 'ref'
  );
}

function fixedPartsAtPath(ctx: MountContext, path: number[]): SpikeFixedPart[] {
  const parts = [...(ctx.fixedPartsByPath.get(path.join('.')) ?? [])];
  return parts.sort((left, right) => left.index - right.index);
}

function isComment(node: Node): node is Comment {
  return node.nodeType === 8;
}

function isText(node: Node): node is Text {
  return node.nodeType === 3;
}

function isElement(node: Node): node is Element {
  return node.nodeType === 1;
}

function isDomNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null &&
    typeof (value as { nodeType?: unknown }).nodeType === 'number';
}

function displayValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function attributeValue(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function classValue(value: unknown): string {
  if (value === null || value === undefined || value === false) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(classValue).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .filter((key) => Boolean((value as Record<string, unknown>)[key]))
      .join(' ');
  }
  throw new Error('[compiled-runtime] class Part expects a string, array, or record');
}

function cssName(name: string): string {
  if (name.startsWith('--')) return name;
  const vendor = /^(Webkit|Moz|ms|O)([A-Z].*)$/.exec(name);
  const kebab = (value: string): string =>
    value[0].toLowerCase() +
    value.slice(1).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  if (vendor) return `-${vendor[1].toLowerCase()}-${kebab(vendor[2])}`;
  return kebab(name);
}

function styleValue(value: unknown): string {
  if (value === null || value === undefined || value === false) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(styleValue).filter(Boolean).join(';');
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .filter((key) => {
        const item = (value as Record<string, unknown>)[key];
        return item !== null && item !== undefined && item !== false;
      })
      .map((key) => `${cssName(key)}:${String((value as Record<string, unknown>)[key])}`)
      .join(';');
  }
  throw new Error('[compiled-runtime] style Part expects CSS text or a declaration record');
}

function removeNodes(nodes: readonly Node[]): void {
  for (const node of nodes) node.parentNode?.removeChild(node);
}

function insertNodesBefore(parent: Node, nodes: readonly Node[], reference: Node): void {
  for (const node of nodes) parent.insertBefore(node, reference);
}

function itemValue(part: SpikeEachPart, item: unknown, field?: string): unknown {
  const selected = field ?? part.field;
  if (selected === undefined) return item;
  if (typeof item !== 'object' || item === null) return undefined;
  return (item as Record<string, unknown>)[selected];
}

/** Per-item attribute slot value: bare when true, omitted when falsy/absent. */
function itemAttrValue(item: unknown, field: string): string | null {
  if (typeof item !== 'object' || item === null) return null;
  const value = (item as Record<string, unknown>)[field];
  if (value === true) return '';
  if (value === false || value === null || value === undefined) return null;
  return String(value);
}

function itemKey(part: SpikeEachPart, item: unknown, index: number): string {
  if (part.key === undefined || part.keyed === false) return `index:${index}`;
  if (typeof item !== 'object' || item === null) {
    throw new Error(`[compiled-runtime] each part ${part.index} keyed items must be records`);
  }
  const value = (item as Record<string, unknown>)[part.key];
  if (
    (value !== null && typeof value === 'object') || typeof value === 'function' ||
    typeof value === 'symbol'
  ) {
    throw new Error(`[compiled-runtime] each part ${part.index} keys must be serializable values`);
  }
  return `${typeof value}:${String(value)}`;
}

interface WhenRegion {
  ctx: MountContext;
  part: SpikeWhenPart;
  scope: ResourceScope;
  anchor: Comment;
  end: Comment;
  current: boolean;
  branchScope: ResourceScope;
  nodes: Node[];
  item: unknown;
  itemPart?: SpikeEachPart;
}

interface TextPartSlot {
  scope: ResourceScope;
  anchor: Comment;
  text?: Text;
  current: string;
}

interface ItemValueSlot {
  text?: Text;
  parent?: Node;
  before?: Node | null;
  position?: number;
  /** Item field this slot renders (multi-field item templates). */
  field?: string;
}

/** Per-item attribute slot tracked for keyed-reuse updates. */
interface ItemAttrSlot {
  element: Element;
  name: string;
  field: string;
}

interface ChildRegion {
  ctx: MountContext;
  part: SpikeChildPart;
  scope: ResourceScope;
  anchor: Comment;
  end: Comment;
  currentValue: unknown;
  nodes: Node[];
}

interface EachEntry {
  key: string;
  scope: ResourceScope;
  nodes: Node[];
  valueSlots: ItemValueSlot[];
  attrSlots: ItemAttrSlot[];
}

interface EachRegion {
  ctx: MountContext;
  part: SpikeEachPart;
  scope: ResourceScope;
  anchor: Comment;
  end: Comment;
  entries: EachEntry[];
  byKey: Map<string, EachEntry>;
  item: unknown;
}

function whenActive(part: SpikeWhenPart, value: unknown): boolean {
  return Number(value) > part.gt;
}

function buildDynamicValue(doc: Document, value: unknown): Node[] {
  const out: Node[] = [];
  let pendingText = '';
  let hasPendingText = false;
  const flushText = (): void => {
    if (!hasPendingText) return;
    if (pendingText.length > 0) out.push(doc.createTextNode(pendingText));
    pendingText = '';
    hasPendingText = false;
  };
  const append = (next: unknown): void => {
    if (Array.isArray(next)) {
      for (const item of next) append(item);
      return;
    }
    if (next === null || next === undefined) return;
    if (
      typeof next === 'string' || typeof next === 'number' || typeof next === 'boolean' ||
      typeof next === 'bigint'
    ) {
      pendingText += String(next);
      hasPendingText = true;
      return;
    }
    flushText();
    if (isDomNode(next)) {
      out.push(next);
      return;
    }
    throw new Error(
      '[compiled-runtime] child Region values must be primitives, DOM nodes, or arrays of those',
    );
  };
  append(value);
  flushText();
  return out;
}

function serializeDynamicValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(serializeDynamicValue).join('');
  if (value === null || value === undefined) return '';
  if (isDomNode(value)) {
    throw new Error('[compiled-runtime] DOM nodes cannot be serialized by a Part Program');
  }
  if (
    typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' &&
    typeof value !== 'bigint'
  ) {
    throw new Error('[compiled-runtime] child Region value is not serializable');
  }
  return escapeText(String(value));
}

function mountNodes(
  ctx: MountContext,
  scope: ResourceScope,
  doc: Document,
  nodes: SpikeTreeNode[],
  item: unknown = NO_ITEM,
  itemPart?: SpikeEachPart,
  itemValueSlots?: ItemValueSlot[],
  parent?: Node,
  itemAttrSlots?: ItemAttrSlot[],
): Node[] {
  const out: Node[] = [];
  const slotStart = itemValueSlots?.length ?? 0;
  for (const node of nodes) {
    if (node.k === 'text') {
      out.push(doc.createTextNode(node.value));
      continue;
    }
    if (node.k === 'ival') {
      if (item === NO_ITEM) {
        throw new Error('[compiled-runtime] item value slot outside an each Region');
      }
      if (!itemPart) throw new Error('[compiled-runtime] item value slot has no item Region');
      const value = displayValue(itemValue(itemPart, item, node.field));
      const slot: ItemValueSlot = { parent, position: out.length, field: node.field };
      if (value.length > 0) {
        const text = doc.createTextNode(value);
        slot.text = text;
        out.push(text);
      }
      itemValueSlots?.push(slot);
      continue;
    }
    if (node.k === 'el') {
      const el = doc.createElement(node.tag);
      for (const [name, value] of node.attrs) el.setAttribute(name, value);
      if (node.iattrs !== undefined) {
        if (item === NO_ITEM || !itemPart) {
          throw new Error('[compiled-runtime] item attribute slot outside an each Region');
        }
        for (const [name, field] of node.iattrs) {
          const value = itemAttrValue(item, field);
          if (value !== null) el.setAttribute(name, value);
          itemAttrSlots?.push({ element: el, name, field });
        }
      }
      for (
        const child of mountNodes(
          ctx,
          scope,
          doc,
          node.children,
          item,
          itemPart,
          itemValueSlots,
          el,
          itemAttrSlots,
        )
      ) {
        el.appendChild(child);
      }
      out.push(el);
      continue;
    }
    out.push(...mountPart(ctx, scope, doc, node.index, item, itemPart, parent));
  }
  if (itemValueSlots && parent) {
    for (let index = slotStart; index < itemValueSlots.length; index++) {
      const slot = itemValueSlots[index];
      if (slot.parent !== parent || slot.before !== undefined) continue;
      const position = slot.position ?? out.length;
      slot.before = out[position + (slot.text ? 1 : 0)] ?? null;
    }
  }
  return out;
}

/** The sentinel distinguishes an undefined item from no item context. */
const NO_ITEM = Symbol('compiled-runtime.no-item');

function buildItem(
  ctx: MountContext,
  regionScope: ResourceScope,
  doc: Document,
  part: SpikeEachPart,
  item: unknown,
  parent?: Node,
): { nodes: Node[]; valueSlots: ItemValueSlot[]; attrSlots: ItemAttrSlot[]; scope: ResourceScope } {
  const scope = regionScope.child();
  const valueSlots: ItemValueSlot[] = [];
  const attrSlots: ItemAttrSlot[] = [];
  try {
    return {
      nodes: mountNodes(ctx, scope, doc, part.item, item, part, valueSlots, parent, attrSlots),
      valueSlots,
      attrSlots,
      scope,
    };
  } catch (error) {
    try {
      scope.dispose();
    } catch {
      // Preserve the item construction error after attempting every cleanup.
    }
    throw error;
  }
}

function buildWhen(
  ctx: MountContext,
  parentScope: ResourceScope,
  doc: Document,
  part: SpikeWhenPart,
  item: unknown,
  itemPart?: SpikeEachPart,
  parent?: Node,
): Node[] {
  const scope = parentScope.child();
  const anchor = doc.createComment(partAnchorMarker(part.index));
  const end = doc.createComment(partAnchorEndMarker(part.index));
  const current = whenActive(part, signalOf(ctx, part.signal).value);
  const region: WhenRegion = {
    ctx,
    part,
    scope,
    anchor,
    end,
    current,
    branchScope: scope.child(),
    nodes: [],
    item,
    itemPart,
  };
  scope.addRangeCleanup(() => removeNodes(region.nodes));
  region.nodes = mountNodes(
    ctx,
    region.branchScope,
    doc,
    current ? part.on : part.off,
    item,
    itemPart,
    undefined,
    parent,
  );
  subscribeWrites(ctx, scope, part.signal, (value) => updateWhen(region, value));
  return [anchor, ...region.nodes, end];
}

function updateWhen(region: WhenRegion, value: unknown): void {
  if (region.scope.disposed) return;
  const next = whenActive(region.part, value);
  if (next === region.current) return;
  const parent = region.end.parentNode;
  if (!parent) return;
  try {
    region.branchScope.dispose(true);
  } finally {
    removeNodes(region.nodes);
  }
  const branchScope = region.scope.child();
  let nodes: Node[];
  try {
    nodes = mountNodes(
      region.ctx,
      branchScope,
      region.end.ownerDocument,
      next ? region.part.on : region.part.off,
      region.item,
      region.itemPart,
      undefined,
      parent,
    );
    insertNodesBefore(parent, nodes, region.end);
  } catch (error) {
    try {
      branchScope.dispose();
    } catch {
      // Preserve the branch construction error.
    }
    region.branchScope = branchScope;
    region.nodes = [];
    region.current = next;
    throw error;
  }
  region.branchScope = branchScope;
  region.nodes = nodes;
  region.current = next;
}

function buildChild(
  ctx: MountContext,
  parentScope: ResourceScope,
  doc: Document,
  part: SpikeChildPart,
): Node[] {
  const scope = parentScope.child();
  const anchor = doc.createComment(partAnchorMarker(part.index));
  const end = doc.createComment(partAnchorEndMarker(part.index));
  const currentValue = signalOf(ctx, part.signal).value;
  const region: ChildRegion = {
    ctx,
    part,
    scope,
    anchor,
    end,
    currentValue,
    nodes: buildDynamicValue(doc, currentValue),
  };
  scope.addRangeCleanup(() => removeNodes(region.nodes));
  subscribeWrites(ctx, scope, part.signal, (value) => updateChild(region, value));
  return [anchor, ...region.nodes, end];
}

function updateChild(region: ChildRegion, value: unknown): void {
  if (region.scope.disposed || Object.is(region.currentValue, value)) return;
  const parent = region.end.parentNode;
  if (!parent) return;
  removeNodes(region.nodes);
  region.nodes = buildDynamicValue(region.end.ownerDocument, value);
  insertNodesBefore(parent, region.nodes, region.end);
  region.currentValue = value;
}

function updateTextPart(slot: TextPartSlot, value: unknown): void {
  if (slot.scope.disposed) return;
  const next = displayValue(value);
  if (next === slot.current) return;
  const parent = slot.anchor.parentNode;
  if (!parent) {
    slot.current = next;
    return;
  }
  if (next.length === 0) {
    slot.text?.parentNode?.removeChild(slot.text);
    slot.text = undefined;
  } else if (slot.text) {
    slot.text.data = next;
  } else {
    slot.text = slot.anchor.ownerDocument.createTextNode(next);
    parent.insertBefore(slot.text, slot.anchor.nextSibling);
  }
  slot.current = next;
}

function buildTextPart(
  ctx: MountContext,
  parentScope: ResourceScope,
  doc: Document,
  part: SpikeTextPart,
): Node[] {
  const scope = parentScope.child();
  const anchor = doc.createComment(partAnchorMarker(part.index));
  const current = displayValue(signalOf(ctx, part.signal).value);
  const slot: TextPartSlot = {
    scope,
    anchor,
    text: current.length > 0 ? doc.createTextNode(current) : undefined,
    current,
  };
  scope.addRangeCleanup(() => {
    slot.text?.parentNode?.removeChild(slot.text);
    slot.text = undefined;
  });
  subscribeWrites(ctx, scope, part.signal, (value) => updateTextPart(slot, value));
  return [anchor, ...(slot.text ? [slot.text] : [])];
}

function buildEach(
  ctx: MountContext,
  parentScope: ResourceScope,
  doc: Document,
  part: SpikeEachPart,
  parent?: Node,
): Node[] {
  const scope = parentScope.child();
  const anchor = doc.createComment(partAnchorMarker(part.index));
  const end = doc.createComment(partAnchorEndMarker(part.index));
  const region: EachRegion = {
    ctx,
    part,
    scope,
    anchor,
    end,
    entries: [],
    byKey: new Map(),
    item: NO_ITEM,
  };
  scope.addRangeCleanup(() => {
    for (const entry of region.entries) removeNodes(entry.nodes);
  });
  const value = signalOf(ctx, part.signal).value;
  if (!Array.isArray(value)) {
    throw new Error(`[compiled-runtime] each part ${part.index} expects an array signal`);
  }
  const nodes: Node[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < value.length; index++) {
    const key = itemKey(part, value[index], index);
    if (seen.has(key)) {
      throw new Error(`[compiled-runtime] each part ${part.index} has duplicate key`);
    }
    seen.add(key);
    const entry = buildItem(ctx, scope, doc, part, value[index], parent);
    const stored = {
      key,
      scope: entry.scope,
      nodes: entry.nodes,
      valueSlots: entry.valueSlots,
      attrSlots: entry.attrSlots,
    };
    region.entries.push(stored);
    region.byKey.set(key, stored);
    nodes.push(...entry.nodes);
  }
  subscribeWrites(ctx, scope, part.signal, (next) => updateEach(region, next));
  return [anchor, ...nodes, end];
}

function recordDirectItemValueNode(entry: EachEntry, slot: ItemValueSlot, text: Text): void {
  const parent = slot.parent;
  if (!parent) return;
  const hasDirectEntryNode = entry.nodes.some((node) => node.parentNode === parent);
  if (!hasDirectEntryNode && entry.nodes.length > 0) return;
  if (entry.nodes.includes(text)) return;

  const reference = slot.before;
  const position = reference ? entry.nodes.indexOf(reference) : -1;
  if (position >= 0) entry.nodes.splice(position, 0, text);
  else entry.nodes.push(text);
}

function insertItemValue(
  entry: EachEntry,
  slotIndex: number,
  text: Text,
  regionParent: Node,
  regionReference: Node,
): void {
  const slot = entry.valueSlots[slotIndex];
  const parent = slot.parent;
  if (!parent) return;

  let reference: Node | null = null;
  for (let index = slotIndex + 1; index < entry.valueSlots.length; index++) {
    const later = entry.valueSlots[index].text;
    if (later?.parentNode === parent) {
      reference = later;
      break;
    }
  }
  if (!reference && slot.before?.parentNode === parent) reference = slot.before;
  if (!reference && parent === regionParent && regionReference.parentNode === parent) {
    reference = regionReference;
  }
  if (reference) parent.insertBefore(text, reference);
  else parent.appendChild(text);
  recordDirectItemValueNode(entry, slot, text);
}

function removeItemValue(entry: EachEntry, slot: ItemValueSlot, text: Text): void {
  const replacement = slot.before ?? null;
  text.parentNode?.removeChild(text);
  for (const other of entry.valueSlots) {
    if (other.before === text) other.before = replacement;
  }
  const position = entry.nodes.indexOf(text);
  if (position >= 0) entry.nodes.splice(position, 1);
  slot.text = undefined;
}

function updateItemValues(
  part: SpikeEachPart,
  entry: EachEntry,
  item: unknown,
  regionParent: Node,
  regionReference: Node,
): void {
  for (const [index, slot] of entry.valueSlots.entries()) {
    const next = displayValue(itemValue(part, item, slot.field));
    if (next.length === 0) {
      if (slot.text) removeItemValue(entry, slot, slot.text);
      continue;
    }
    if (slot.text) {
      if (slot.text.data !== next) slot.text.data = next;
      continue;
    }
    const parent = slot.parent ?? regionParent;
    slot.parent = parent;
    const document = parent.ownerDocument;
    if (!document) throw new Error('[compiled-runtime] item value slot has no owner document');
    const text = document.createTextNode(next);
    slot.text = text;
    insertItemValue(entry, index, text, regionParent, regionReference);
  }
  for (const slot of entry.attrSlots) {
    const next = itemAttrValue(item, slot.field);
    if (next === null) {
      if (slot.element.hasAttribute(slot.name)) slot.element.removeAttribute(slot.name);
    } else if (slot.element.getAttribute(slot.name) !== next) {
      slot.element.setAttribute(slot.name, next);
    }
  }
}

function disposeEntry(entry: EachEntry): void {
  try {
    entry.scope.dispose(true);
  } finally {
    removeNodes(entry.nodes);
  }
}

function moveEntries(region: EachRegion, parent: Node, entries: EachEntry[]): void {
  let cursor: Node = region.anchor.nextSibling ?? region.end;
  for (const entry of entries) {
    for (const node of entry.nodes) {
      if (node === cursor) {
        cursor = node.nextSibling ?? region.end;
      } else {
        parent.insertBefore(node, cursor);
        cursor = node.nextSibling ?? region.end;
      }
    }
  }
}

function updateEach(region: EachRegion, value: unknown): void {
  if (region.scope.disposed) return;
  if (!Array.isArray(value)) {
    throw new Error(`[compiled-runtime] each part ${region.part.index} expects an array signal`);
  }
  const parent = region.end.parentNode;
  if (!parent) return;

  const descriptors: Array<{ key: string; item: unknown; existing?: EachEntry }> = [];
  const seen = new Set<string>();
  for (let index = 0; index < value.length; index++) {
    const item = value[index];
    const key = itemKey(region.part, item, index);
    if (seen.has(key)) {
      throw new Error(`[compiled-runtime] each part ${region.part.index} has duplicate key`);
    }
    seen.add(key);
    descriptors.push({ key, item, existing: region.byKey.get(key) });
  }

  const created: EachEntry[] = [];
  try {
    for (const descriptor of descriptors) {
      if (descriptor.existing) continue;
      const built = buildItem(
        region.ctx,
        region.scope,
        region.end.ownerDocument,
        region.part,
        descriptor.item,
        parent,
      );
      const entry = { key: descriptor.key, ...built };
      descriptor.existing = entry;
      created.push(entry);
    }
  } catch (error) {
    for (const entry of created) disposeEntry(entry);
    throw error;
  }

  for (const entry of region.entries) {
    if (seen.has(entry.key)) continue;
    disposeEntry(entry);
  }
  const nextEntries = descriptors.map((descriptor) => descriptor.existing!);
  for (let descriptorIndex = 0; descriptorIndex < descriptors.length; descriptorIndex++) {
    const descriptor = descriptors[descriptorIndex];
    if (descriptor.existing && !created.includes(descriptor.existing)) {
      let regionReference: Node = region.end;
      for (let nextIndex = descriptorIndex + 1; nextIndex < nextEntries.length; nextIndex++) {
        const nextNode = nextEntries[nextIndex].nodes.find((node) => node.parentNode === parent);
        if (nextNode) {
          regionReference = nextNode;
          break;
        }
      }
      updateItemValues(region.part, descriptor.existing, descriptor.item, parent, regionReference);
    }
  }
  region.entries = nextEntries;
  region.byKey = new Map(nextEntries.map((entry) => [entry.key, entry]));
  moveEntries(region, parent, nextEntries);
}

function mountPart(
  ctx: MountContext,
  parentScope: ResourceScope,
  doc: Document,
  index: number,
  item: unknown,
  itemPart?: SpikeEachPart,
  parent?: Node,
): Node[] {
  const part = ctx.program.parts[index];
  if (!part) throw new Error(`[compiled-runtime] missing Part ${index}`);
  if (part.k === 'text') return buildTextPart(ctx, parentScope, doc, part);
  if (part.k === 'when') return buildWhen(ctx, parentScope, doc, part, item, itemPart, parent);
  if (part.k === 'child') return buildChild(ctx, parentScope, doc, part);
  if (part.k === 'each') return buildEach(ctx, parentScope, doc, part, parent);
  throw new Error(`[compiled-runtime] fixed Part ${part.index} cannot be used as an anchor`);
}

/** Resolve a compiler-owned static path without any selector/discovery walk. */
function resolvePath(root: Node, path: number[], where: string): Element {
  // Program paths are relative to the template node list: the first index
  // selects a child of the mount root (the sole template root element lives at
  // path [0]). The validator rejects empty paths, so every path walks at least
  // once into the template.
  if (path.length === 0) {
    throw new Error(`[compiled-runtime] ${where}: path [] unresolved`);
  }
  let node: Node = root;
  for (const index of path) {
    const child = node.childNodes[index];
    if (!child) throw new Error(`[compiled-runtime] ${where}: path [${path.join(',')}] unresolved`);
    node = child;
  }
  if (!isElement(node)) {
    throw new Error(`[compiled-runtime] ${where}: path [${path.join(',')}] is not an element`);
  }
  return node;
}

interface PropertySink extends Element {
  [property: string]: unknown;
}

function propertySink(element: Element): PropertySink {
  return element as PropertySink;
}

function applyProperty(element: Element, name: string, value: unknown, initial: boolean): void {
  const sink = propertySink(element);
  if (initial) {
    const serialized = attributeValue(value);
    if (serialized === null) element.removeAttribute(name);
    else element.setAttribute(name, serialized);
  }
  sink[name] = value;
}

function applyAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function applyBoolean(element: Element, name: string, value: boolean): void {
  propertySink(element)[name] = value;
  if (value) element.setAttribute(name, '');
  else element.removeAttribute(name);
}

function installValuePart(
  ctx: MountContext,
  root: Node,
  part:
    | SpikeAttrPart
    | SpikePropPart
    | SpikeBoolPart
    | SpikeClassPart
    | SpikeStylePart
    | SpikeHtmlPart,
  mode: 'fresh' | 'claim',
): void {
  const element = resolvePath(root, part.path, `${part.k} Part`);
  const scope = ctx.rootScope.child();
  const initial = signalOf(ctx, part.signal).value;

  if (part.k === 'html') {
    if (typeof initial !== 'string') {
      throw new Error('[compiled-runtime] html Part expects a string signal value');
    }
    let current = initial;
    if (mode === 'fresh') (element as Element).innerHTML = current;
    subscribeWrites(ctx, scope, part.signal, (value) => {
      if (typeof value !== 'string') {
        throw new Error('[compiled-runtime] html Part expects a string signal value');
      }
      if (Object.is(value, current)) return;
      (element as Element).innerHTML = value;
      current = value;
    });
    return;
  }

  if (part.k === 'attr') {
    let current = attributeValue(initial);
    if (mode === 'fresh') applyAttribute(element, part.name, current);
    subscribeWrites(ctx, scope, part.signal, (value) => {
      const next = attributeValue(value);
      if (Object.is(next, current)) return;
      applyAttribute(element, part.name, next);
      current = next;
    });
    return;
  }

  if (part.k === 'prop') {
    let current = initial;
    if (mode === 'fresh') applyProperty(element, part.name, current, true);
    subscribeWrites(ctx, scope, part.signal, (value) => {
      if (Object.is(value, current)) return;
      applyProperty(element, part.name, value, false);
      current = value;
    });
    return;
  }

  if (part.k === 'bool') {
    let current = Boolean(initial);
    if (mode === 'fresh') applyBoolean(element, part.name, current);
    subscribeWrites(ctx, scope, part.signal, (value) => {
      const next = Boolean(value);
      if (Object.is(next, current)) return;
      applyBoolean(element, part.name, next);
      current = next;
    });
    return;
  }

  if (part.k === 'class') {
    let current = classValue(initial);
    if (mode === 'fresh') applyAttribute(element, 'class', current || null);
    subscribeWrites(ctx, scope, part.signal, (value) => {
      const next = classValue(value);
      if (Object.is(next, current)) return;
      applyAttribute(element, 'class', next || null);
      current = next;
    });
    return;
  }

  let current = styleValue(initial);
  if (mode === 'fresh') applyAttribute(element, 'style', current || null);
  subscribeWrites(ctx, scope, part.signal, (value) => {
    const next = styleValue(value);
    if (Object.is(next, current)) return;
    applyAttribute(element, 'style', next || null);
    current = next;
  });
}

function eventHandler(
  ctx: MountContext,
  part: SpikeEventPart,
  value?: unknown,
): CompiledEventHandler {
  if (part.handler !== undefined) {
    const handler = ctx.host.handlers?.[part.handler];
    if (!handler) throw new Error(`[compiled-runtime] missing host handler "${part.handler}"`);
    return handler;
  }
  const handler = value ?? signalOf(ctx, part.signal as string).value;
  if (typeof handler !== 'function') {
    throw new Error(`[compiled-runtime] event Part ${part.index} signal must contain a function`);
  }
  return handler as CompiledEventHandler;
}

function installEventPart(ctx: MountContext, root: Node, part: SpikeEventPart): void {
  const element = resolvePath(root, part.path, 'event Part');
  const scope = ctx.rootScope.child();
  const options = part.options;
  let listener: EventListener | undefined;
  let current: CompiledEventHandler;

  const add = (handler: CompiledEventHandler): void => {
    const next: EventListener = (event) => handler(event);
    element.addEventListener(part.event, next, options);
    listener = next;
    current = handler;
  };
  const remove = (): void => {
    if (!listener) return;
    element.removeEventListener(part.event, listener, options);
    listener = undefined;
  };

  current = eventHandler(ctx, part);
  add(current);
  scope.add(remove);
  if (part.signal !== undefined) {
    subscribeWrites(ctx, scope, part.signal, (value) => {
      const next = eventHandler(ctx, part, value);
      if (next === current) return;
      remove();
      add(next);
    });
  }
}

function refHandler(ctx: MountContext, part: SpikeRefPart, value?: unknown): CompiledRefHandler {
  if (part.ref !== undefined) {
    const ref = ctx.host.refs?.[part.ref];
    if (!ref) throw new Error(`[compiled-runtime] missing host ref "${part.ref}"`);
    return ref;
  }
  if (part.handler !== undefined) {
    const handler = ctx.host.handlers?.[part.handler];
    if (!handler) throw new Error(`[compiled-runtime] missing host handler "${part.handler}"`);
    return handler as CompiledRefHandler;
  }
  const ref = value ?? signalOf(ctx, part.signal as string).value;
  if (typeof ref !== 'function') {
    throw new Error(`[compiled-runtime] ref Part ${part.index} signal must contain a function`);
  }
  return ref as CompiledRefHandler;
}

function installRefPart(ctx: MountContext, root: Node, part: SpikeRefPart): void {
  const element = resolvePath(root, part.path, 'ref Part');
  const scope = ctx.rootScope.child();
  let current = refHandler(ctx, part);
  let cleanup = current(element);

  const detach = (): void => {
    try {
      if (typeof cleanup === 'function') cleanup();
    } finally {
      cleanup = undefined;
      current(null);
    }
  };
  scope.add(detach);
  if (part.signal !== undefined) {
    subscribeWrites(ctx, scope, part.signal, (value) => {
      const next = refHandler(ctx, part, value);
      if (next === current) return;
      detach();
      current = next;
      cleanup = current(element);
    });
  }
}

function attachFixedParts(ctx: MountContext, root: Node, mode: 'fresh' | 'claim'): void {
  for (const part of ctx.program.parts) {
    if (
      part.k === 'attr' || part.k === 'prop' || part.k === 'bool' || part.k === 'class' ||
      part.k === 'style' || part.k === 'html'
    ) {
      installValuePart(ctx, root, part, mode);
    } else if (part.k === 'event') {
      installEventPart(ctx, root, part);
    } else if (part.k === 'ref') {
      installRefPart(ctx, root, part);
    }
  }
}

function instance(ctx: MountContext): CompiledSpikeInstance {
  let disposed = false;
  return {
    dispose(): void {
      if (disposed) return;
      disposed = true;
      ctx.rootScope.dispose();
    },
  };
}

/** Fresh browser DOM creation from the validated Part Program. */
export function createFreshDom(
  program: PartProgramSpike,
  host: CompiledSpikeHost,
  root: Node,
): CompiledSpikeInstance {
  noteCompiledProgramActivated();
  validatePartProgram(program);
  const ctx = createContext(program, host);
  const doc = root.ownerDocument;
  if (!doc) throw new Error('[compiled-runtime] root must have an ownerDocument');
  if (root.childNodes.length > 0) {
    throw new Error('[compiled-runtime] fresh DOM root must be empty');
  }
  let created: Node[] = [];
  try {
    created = mountNodes(
      ctx,
      ctx.rootScope,
      doc,
      ctx.program.template,
      NO_ITEM,
      undefined,
      undefined,
      root,
    );
    for (const node of created) {
      root.appendChild(node);
    }
    attachFixedParts(ctx, root, 'fresh');
    return instance(ctx);
  } catch (error) {
    removeNodes(created);
    try {
      ctx.rootScope.dispose();
    } catch {
      // Preserve the construction error; every cleanup was still attempted.
    }
    throw error;
  }
}

// ─── Server serialization ──────────────────────────────────────────

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeAttr(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function serializedFixedAttributes(
  ctx: MountContext,
  node: SpikeElementNode,
  path: number[],
): Array<[string, string]> {
  const attrs = new Map<string, string>();
  for (const [name, value] of node.attrs) attrs.set(name, value);
  for (const part of fixedPartsAtPath(ctx, path)) {
    if (part.k === 'attr' || part.k === 'prop') {
      const value = signalOf(ctx, part.signal).value;
      const next = attributeValue(value);
      if (next === null) attrs.delete(part.name);
      else attrs.set(part.name, next);
    } else if (part.k === 'bool') {
      const value = signalOf(ctx, part.signal).value;
      if (value) attrs.set(part.name, '');
      else attrs.delete(part.name);
    } else if (part.k === 'class') {
      const value = signalOf(ctx, part.signal).value;
      const next = classValue(value);
      if (next) attrs.set('class', next);
      else attrs.delete('class');
    } else if (part.k === 'style') {
      const value = signalOf(ctx, part.signal).value;
      const next = styleValue(value);
      if (next) attrs.set('style', next);
      else attrs.delete('style');
    }
  }
  return [...attrs.entries()];
}

function serializeElement(
  ctx: MountContext,
  node: SpikeElementNode,
  programPath: number[],
  item: unknown,
  itemPart?: SpikeEachPart,
): string {
  const attrList = serializedFixedAttributes(ctx, node, programPath);
  if (node.iattrs !== undefined) {
    if (item === NO_ITEM || !itemPart) {
      throw new Error('[compiled-runtime] item attribute slot outside an each Region');
    }
    for (const [name, field] of node.iattrs) {
      const value = itemAttrValue(item, field);
      if (value !== null) attrList.push([name, value]);
    }
  }
  const attrs = attrList.map(([name, value]) => ` ${name}="${escapeAttr(value)}"`).join('');
  const open = `<${node.tag}${attrs}`;
  if (VOID_TAGS.has(node.tag)) return `${open}>`;
  const htmlSink = fixedPartsAtPath(ctx, programPath).find((part) => part.k === 'html');
  if (htmlSink && htmlSink.k === 'html') {
    const value = signalOf(ctx, htmlSink.signal).value;
    if (typeof value !== 'string') {
      throw new Error('[compiled-runtime] html Part expects a string signal value');
    }
    return `${open}>${value}</${node.tag}>`;
  }
  const children = node.children
    .map((child, index) => serializeNode(ctx, child, [...programPath, index], item, itemPart))
    .join('');
  return `${open}>${children}</${node.tag}>`;
}

function serializeNode(
  ctx: MountContext,
  node: SpikeTreeNode,
  programPath: number[],
  item: unknown = NO_ITEM,
  itemPart?: SpikeEachPart,
): string {
  if (node.k === 'text') return escapeText(node.value);
  if (node.k === 'ival') {
    if (item === NO_ITEM) {
      throw new Error('[compiled-runtime] item value slot outside an each Region');
    }
    if (!itemPart) throw new Error('[compiled-runtime] item value slot has no item Region');
    return escapeText(displayValue(itemValue(itemPart, item)));
  }
  if (node.k === 'el') return serializeElement(ctx, node, programPath, item, itemPart);

  const part = ctx.program.parts[node.index];
  if (!part) throw new Error(`[compiled-runtime] missing Part ${node.index}`);
  const open = `<!--${partAnchorMarker(part.index)}-->`;
  if (part.k === 'text') return open + escapeText(displayValue(signalOf(ctx, part.signal).value));
  const close = `<!--${partAnchorEndMarker(part.index)}-->`;
  if (part.k === 'child') {
    return open + serializeDynamicValue(signalOf(ctx, part.signal).value) + close;
  }
  if (part.k === 'when') {
    const branch = whenActive(part, signalOf(ctx, part.signal).value) ? part.on : part.off;
    return open + branch.map((child, index) =>
      serializeNode(ctx, child, [...programPath, index], item, itemPart)
    ).join('') +
      close;
  }
  if (part.k === 'each') {
    const value = signalOf(ctx, part.signal).value;
    if (!Array.isArray(value)) {
      throw new Error(`[compiled-runtime] each part ${part.index} expects an array signal`);
    }
    return open + value.map((entry) =>
      part.item.map((child, index) =>
        serializeNode(ctx, child, [...programPath, index], entry, part)
      ).join('')
    ).join('') + close;
  }
  throw new Error(`[compiled-runtime] fixed Part ${part.index} has no serialized anchor`);
}

/** Server serialization: the same program renders deterministic HTML. */
export function serializeToHtml(program: PartProgramSpike, host: CompiledSpikeHost): string {
  validatePartProgram(program);
  const ctx = createContext(program, host);
  return ctx.program.template.map((node, index) => serializeNode(ctx, node, [index])).join('');
}

// ─── Existing-DOM claim ─────────────────────────────────────────────

function claimFailure(path: string, message: string): never {
  throw new PartProgramClaimError(path, message);
}

function expectComment(node: Node, marker: string, path: string): Comment {
  if (!isComment(node) || node.data !== marker) {
    claimFailure(path, `expected <!--${marker}--> anchor`);
  }
  return node;
}

function dynamicAttributeNames(ctx: MountContext, path: number[]): Set<string> {
  const names = new Set<string>();
  for (const part of fixedPartsAtPath(ctx, path)) {
    if (part.k === 'attr' || part.k === 'prop' || part.k === 'bool') names.add(part.name);
    if (part.k === 'class') names.add('class');
    if (part.k === 'style') names.add('style');
  }
  return names;
}

function claimElementAttributes(
  ctx: MountContext,
  element: Element,
  node: SpikeElementNode,
  path: string,
  programPath: number[],
): void {
  const dynamic = dynamicAttributeNames(ctx, programPath);
  // Per-item attribute slots are verified with their item context by the
  // caller; they are not static drift.
  for (const [name] of node.iattrs ?? []) dynamic.add(name);
  for (const [name, value] of node.attrs) {
    if (dynamic.has(name)) continue;
    if (element.getAttribute(name) !== value) {
      claimFailure(path, `attribute drift on "${name}": expected ${JSON.stringify(value)}`);
    }
  }
  const getNames = (element as Element & { getAttributeNames?: () => string[] }).getAttributeNames;
  if (getNames) {
    const expected = new Set(node.attrs.map(([name]) => name));
    for (const name of dynamic) expected.add(name);
    for (const name of getNames.call(element)) {
      if (!expected.has(name)) claimFailure(path, `unexpected attribute "${name}"`);
    }
  }
}

function claimDynamicValue(
  parent: Node,
  cursor: number,
  value: unknown,
  path: string,
): number {
  const expectedTexts: string[] = [];
  let pendingText = '';
  let hasPendingText = false;
  const flushText = (): void => {
    if (!hasPendingText) return;
    if (pendingText.length > 0) expectedTexts.push(pendingText);
    pendingText = '';
    hasPendingText = false;
  };
  const collect = (next: unknown): void => {
    if (Array.isArray(next)) {
      for (const item of next) collect(item);
      return;
    }
    if (next === null || next === undefined) return;
    if (
      typeof next === 'string' || typeof next === 'number' || typeof next === 'boolean' ||
      typeof next === 'bigint'
    ) {
      pendingText += String(next);
      hasPendingText = true;
      return;
    }
    flushText();
    if (isDomNode(next)) {
      claimFailure(path, 'DOM node values are not claimable from serialized HTML');
    }
    claimFailure(path, 'dynamic value is not claimable');
  };
  collect(value);
  flushText();
  for (const expected of expectedTexts) {
    const node = parent.childNodes[cursor];
    if (!node || !isText(node)) claimFailure(path, 'expected dynamic text node');
    if (node.data !== expected) {
      claimFailure(path, `dynamic text drift: expected ${JSON.stringify(expected)}`);
    }
    cursor++;
  }
  return cursor;
}

function claimNodes(
  ctx: MountContext,
  parent: Node,
  cursor: number,
  nodes: SpikeTreeNode[],
  path: string,
  programPath: number[],
  scope: ResourceScope,
  item: unknown = NO_ITEM,
  itemPart?: SpikeEachPart,
  itemValueSlots?: ItemValueSlot[],
  itemAttrSlots?: ItemAttrSlot[],
): number {
  const at = (index: number): Node => {
    const node = parent.childNodes[index];
    if (!node) claimFailure(path, `missing child at DOM index ${index}`);
    return node;
  };

  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const nodePath = `${path}[${index}]`;
    const nodeProgramPath = [...programPath, index];
    if (node.k === 'text') {
      const dom = at(cursor++);
      if (!isText(dom)) claimFailure(nodePath, 'expected a text node');
      if (dom.data !== node.value) {
        claimFailure(
          nodePath,
          `text drift: expected ${JSON.stringify(node.value)}, found ${JSON.stringify(dom.data)}`,
        );
      }
      continue;
    }
    if (node.k === 'ival') {
      if (item === NO_ITEM) claimFailure(nodePath, 'item value slot outside an each Region');
      if (!itemPart) claimFailure(nodePath, 'item value slot has no item Region');
      const expected = displayValue(itemValue(itemPart, item, node.field));
      if (expected.length > 0) {
        const dom = at(cursor++);
        if (!isText(dom)) claimFailure(nodePath, 'expected item value text');
        if (dom.data !== expected) {
          claimFailure(nodePath, `item text drift: expected ${JSON.stringify(expected)}`);
        }
        itemValueSlots?.push({
          text: dom,
          parent,
          before: parent.childNodes[cursor] ?? null,
          field: node.field,
        });
      } else {
        itemValueSlots?.push({
          parent,
          before: parent.childNodes[cursor] ?? null,
          field: node.field,
        });
      }
      continue;
    }
    if (node.k === 'el') {
      const dom = at(cursor++);
      if (!isElement(dom)) claimFailure(nodePath, 'expected an element');
      if (dom.tagName.toLowerCase() !== node.tag) {
        claimFailure(nodePath, `expected <${node.tag}>, found <${dom.tagName.toLowerCase()}>`);
      }
      claimElementAttributes(ctx, dom, node, nodePath, nodeProgramPath);
      if (node.iattrs !== undefined) {
        // Per-item attribute slots carry the item context: values are verified
        // against the item (deterministic) and tracked for keyed-reuse updates.
        if (item === NO_ITEM || !itemPart) {
          claimFailure(nodePath, 'item attribute slot outside an each Region');
        }
        for (const [name, field] of node.iattrs) {
          const expected = itemAttrValue(item, field);
          const actual = dom.getAttribute(name);
          if (expected === null ? actual !== null : actual !== expected) {
            claimFailure(
              nodePath,
              `item attribute drift on "${name}": expected ${JSON.stringify(expected)}`,
            );
          }
          itemAttrSlots?.push({ element: dom, name, field });
        }
      }
      // A trusted-HTML sink owns the target's whole content: the subtree is
      // opaque to the claim (the program declares no structure inside it).
      const hasHtmlSink = fixedPartsAtPath(ctx, nodeProgramPath)
        .some((part) => part.k === 'html');
      const consumed = hasHtmlSink ? dom.childNodes.length : claimNodes(
        ctx,
        dom,
        0,
        node.children,
        `${nodePath}.children`,
        nodeProgramPath,
        scope,
        item,
        itemPart,
        itemValueSlots,
        itemAttrSlots,
      );
      if (consumed !== dom.childNodes.length) {
        claimFailure(`${nodePath}.children`, 'unexpected trailing nodes');
      }
      continue;
    }

    const part = ctx.program.parts[node.index];
    if (!part) claimFailure(nodePath, `missing Part ${node.index}`);
    if (part.k === 'text') {
      const anchor = expectComment(at(cursor++), partAnchorMarker(part.index), nodePath);
      const expected = displayValue(signalOf(ctx, part.signal).value);
      let text: Text | undefined;
      if (expected.length > 0) {
        const next = at(cursor++);
        if (!isText(next)) claimFailure(nodePath, 'expected a text node after the part anchor');
        text = next;
        if (text.data !== expected) {
          claimFailure(nodePath, `part text drift: expected ${JSON.stringify(expected)}`);
        }
      }
      const partScope = scope.child();
      const slot: TextPartSlot = { scope: partScope, anchor, text, current: expected };
      partScope.addRangeCleanup(() => {
        slot.text?.parentNode?.removeChild(slot.text);
        slot.text = undefined;
      });
      subscribeWrites(ctx, partScope, part.signal, (value) => {
        updateTextPart(slot, value);
      });
      continue;
    }
    if (part.k === 'child') {
      const anchor = expectComment(at(cursor++), partAnchorMarker(part.index), nodePath);
      const start = cursor;
      cursor = claimDynamicValue(
        parent,
        cursor,
        signalOf(ctx, part.signal).value,
        `${nodePath}.value`,
      );
      const end = expectComment(at(cursor++), partAnchorEndMarker(part.index), nodePath);
      const partScope = scope.child();
      const region: ChildRegion = {
        ctx,
        part,
        scope: partScope,
        anchor,
        end,
        currentValue: signalOf(ctx, part.signal).value,
        nodes: Array.from(parent.childNodes).slice(start, cursor - 1),
      };
      partScope.addRangeCleanup(() => removeNodes(region.nodes));
      subscribeWrites(ctx, partScope, part.signal, (value) => updateChild(region, value));
      continue;
    }
    if (part.k === 'when') {
      const anchor = expectComment(at(cursor++), partAnchorMarker(part.index), nodePath);
      const active = whenActive(part, signalOf(ctx, part.signal).value);
      const partScope = scope.child();
      const branchScope = partScope.child();
      const before = cursor;
      cursor = claimNodes(
        ctx,
        parent,
        cursor,
        active ? part.on : part.off,
        `${nodePath}.branch`,
        [],
        branchScope,
        item,
        itemPart,
        itemValueSlots,
      );
      const end = expectComment(at(cursor++), partAnchorEndMarker(part.index), nodePath);
      const region: WhenRegion = {
        ctx,
        part,
        scope: partScope,
        anchor,
        end,
        current: active,
        branchScope,
        nodes: Array.from(parent.childNodes).slice(before, cursor - 1),
        item,
      };
      partScope.addRangeCleanup(() => removeNodes(region.nodes));
      subscribeWrites(ctx, partScope, part.signal, (value) => updateWhen(region, value));
      continue;
    }
    if (part.k === 'each') {
      const anchor = expectComment(at(cursor++), partAnchorMarker(part.index), nodePath);
      const value = signalOf(ctx, part.signal).value;
      if (!Array.isArray(value)) claimFailure(nodePath, 'each Part signal is not an array');
      const partScope = scope.child();
      const region: EachRegion = {
        ctx,
        part,
        scope: partScope,
        anchor,
        end: anchor,
        entries: [],
        byKey: new Map(),
        item: NO_ITEM,
      };
      partScope.addRangeCleanup(() => {
        for (const entry of region.entries) removeNodes(entry.nodes);
      });
      const seen = new Set<string>();
      for (let itemIndex = 0; itemIndex < value.length; itemIndex++) {
        const currentItem = value[itemIndex];
        const key = itemKey(part, currentItem, itemIndex);
        if (seen.has(key)) claimFailure(`${nodePath}.item[${itemIndex}]`, 'duplicate item key');
        seen.add(key);
        const itemScope = partScope.child();
        const itemSlots: ItemValueSlot[] = [];
        const itemAttrs: ItemAttrSlot[] = [];
        const before = cursor;
        cursor = claimNodes(
          ctx,
          parent,
          cursor,
          part.item,
          `${nodePath}.item[${itemIndex}]`,
          [],
          itemScope,
          currentItem,
          part,
          itemSlots,
          itemAttrs,
        );
        const entry: EachEntry = {
          key,
          scope: itemScope,
          nodes: Array.from(parent.childNodes).slice(before, cursor),
          valueSlots: itemSlots,
          attrSlots: itemAttrs,
        };
        region.entries.push(entry);
        region.byKey.set(key, entry);
      }
      region.end = expectComment(at(cursor++), partAnchorEndMarker(part.index), nodePath);
      subscribeWrites(ctx, partScope, part.signal, (next) => updateEach(region, next));
      continue;
    }
    claimFailure(nodePath, `Part ${node.index} has no claimable anchor`);
  }
  return cursor;
}

/** Claim-time options for the owning root's serialized static style sink. */
export interface CompiledClaimOptions {
  /**
   * True when the claiming class carries static styles. The server serializer
   * emits those styles as one marked `<style data-oe-static-styles>` element —
   * the first template child — so a claim skips exactly that node. A marked
   * style node on a style-less class is drift and fails closed.
   */
  expectStaticStyle?: boolean;
}

function isStaticStyleNode(node: Node | undefined): boolean {
  return (
    !!node && isElement(node) && node.tagName.toLowerCase() === 'style' &&
    node.hasAttribute(STATIC_STYLES_MARKER)
  );
}

/** Claim existing SSR DOM without allocating or overwriting live values. */
export function claimExistingDom(
  program: PartProgramSpike,
  host: CompiledSpikeHost,
  root: Node,
  options: CompiledClaimOptions = {},
): CompiledSpikeInstance {
  noteCompiledProgramActivated();
  validatePartProgram(program);
  const ctx = createContext(program, host);
  const styleNode = root.childNodes[0];
  const hasStaticStyle = isStaticStyleNode(styleNode);
  if (hasStaticStyle && !options.expectStaticStyle) {
    claimFailure('template', 'unexpected static style element');
  }
  const cursorStart = hasStaticStyle ? 1 : 0;
  try {
    const consumed = claimNodes(
      ctx,
      root,
      cursorStart,
      ctx.program.template,
      'template',
      [],
      ctx.rootScope,
    );
    if (consumed !== root.childNodes.length) claimFailure('template', 'unexpected trailing nodes');
    attachFixedParts(ctx, root, 'claim');
    return instance(ctx);
  } catch (error) {
    try {
      ctx.rootScope.dispose();
    } catch {
      // Keep the structural diagnostic while still attempting every cleanup.
    }
    throw error;
  }
}

/** Canonical entry-point aliases. */
export const createPartProgram = createFreshDom;
export const serializePartProgram = serializeToHtml;
export const claimPartProgram = claimExistingDom;
