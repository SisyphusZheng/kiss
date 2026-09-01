/**
 * Existing-DOM claim for the alpha.3 compiled Part Program.
 *
 * Claim is a staged operation: the complete owned structure is checked first,
 * then Parts, Regions, listeners, and subscriptions are attached. A successful
 * claim performs no node allocation or replacement. An explicit `owning`
 * recovery may replace only the owning root children or one bounded Region
 * range; it never searches outside the compiled location identity.
 */

import {
  partAnchorEndMarker,
  partAnchorMarker,
  type PartProgramV1,
  type ProgramEachPart,
  type ProgramElementNode,
  type ProgramTreeNode,
  type ProgramWhenPart,
  STATIC_STYLES_MARKER,
} from '../program.ts';
import {
  assertCompiledProgram,
  attributeValueOf,
  classValueOf,
  CompiledProgramValidationError,
  handlersOf,
  isRecordValue,
  signalOf,
  styleValueOf,
  voidElement,
} from '../server/shared.ts';
import { trustedHtmlValue } from '../../core/security.ts';

export type { CompiledProgramHost, CompiledSignalLike } from '../server/shared.ts';
export { assertCompiledProgram, CompiledProgramValidationError } from '../server/shared.ts';

interface RootClaimOwner {
  kind: 'root';
  root: Node;
}

interface RegionClaimOwner {
  kind: 'region';
  parent: Node;
  anchor: Comment;
  end: Comment;
  part: ProgramWhenPart | ProgramEachPart;
}

type ClaimOwner = RootClaimOwner | RegionClaimOwner;

/** Structured, source-location-free diagnostic for deterministic claim drift. */
export class PartProgramClaimError extends Error {
  readonly code = 'OPEN_ELEMENT_COMPILED_CLAIM_MISMATCH';
  readonly path: string;
  readonly detail: string;
  readonly ownerKind: ClaimOwner['kind'];
  readonly owner: ClaimOwner;

  constructor(path: string, message: string, owner: ClaimOwner) {
    super(`[compiled-claim] ${path}: ${message}`);
    this.name = 'PartProgramClaimError';
    this.path = path;
    this.detail = message;
    this.ownerKind = owner.kind;
    this.owner = owner;
  }
}

/** Alias with the issue vocabulary used by claim callers. */
export const ClaimMismatchError = PartProgramClaimError;

export type ClaimRecoveryMode = 'throw' | 'owning';

export interface ClaimOptions {
  /** Default is `throw`; `owning` enables one bounded recovery attempt. */
  recovery?: ClaimRecoveryMode;
  /** Observe the exact structured mismatch before optional recovery. */
  onMismatch?: (error: PartProgramClaimError) => void;
  /** Events captured before upgrade and replayed after a successful attach. */
  preUpgradeEvents?: readonly PreUpgradeEvent[] | PreUpgradeEventCapture;
  /**
   * True when the claiming class carries static styles: the server serializer
   * emits them as one marked `<style data-oe-static-styles>` first template
   * child, which the claim skips. A marked style node on a style-less class
   * is drift and fails closed.
   */
  expectStaticStyle?: boolean;
}

export interface CompiledClaimInstance {
  dispose(): void;
}

export interface PreUpgradeEvent {
  readonly target: EventTarget;
  readonly type: string;
  readonly event?: Event;
  readonly init?: EventInit;
}

export interface PreUpgradeEventCapture {
  readonly events: readonly PreUpgradeEvent[];
  stop(): void;
}

const SUPPORTED_PRE_UPGRADE_EVENTS = new Set([
  'change',
  'click',
  'input',
  'keydown',
  'keyup',
  'pointerdown',
  'pointerup',
  'submit',
]);

const consumedEventRecords = new WeakSet<object>();
const consumedEventObjects = new WeakSet<object>();

/**
 * Capture the bounded pre-upgrade interaction set on an owning root. One
 * latest event per target/type is retained, matching the one-click-per-host
 * queue contract while keeping replay deterministic and finite.
 */
export function capturePreUpgradeEvents(
  root: EventTarget,
  eventTypes: readonly string[] = [...SUPPORTED_PRE_UPGRADE_EVENTS],
): PreUpgradeEventCapture {
  const events: PreUpgradeEvent[] = [];
  const listeners: Array<{ type: string; listener: EventListener }> = [];
  const replaceFor = (record: PreUpgradeEvent): void => {
    const existing = events.findIndex((candidate) =>
      candidate.target === record.target && candidate.type === record.type
    );
    if (existing >= 0) events[existing] = record;
    else events.push(record);
  };
  for (const type of eventTypes) {
    if (!SUPPORTED_PRE_UPGRADE_EVENTS.has(type)) continue;
    const listener: EventListener = (event) => {
      const target = event.target;
      if (!target) return;
      replaceFor({ target, type, event });
    };
    root.addEventListener(type, listener, { capture: true });
    listeners.push({ type, listener });
  }
  let stopped = false;
  return {
    events,
    stop(): void {
      if (stopped) return;
      stopped = true;
      for (const { type, listener } of listeners) {
        root.removeEventListener(type, listener, {
          capture: true,
        });
      }
    },
  };
}

function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && 'nodeType' in value &&
    'childNodes' in value;
}

function isInside(root: Node, target: EventTarget): target is Node {
  if (!isNode(target)) return false;
  let current: Node | null = target;
  while (current) {
    if (current === root) return true;
    current = current.parentNode;
  }
  return false;
}

function eventList(
  source: ClaimOptions['preUpgradeEvents'],
): readonly PreUpgradeEvent[] {
  if (!source) return [];
  if (Array.isArray(source)) return source;
  if (typeof source === 'object' && 'stop' in source) {
    source.stop();
    return source.events;
  }
  throw new CompiledProgramValidationError(
    'preUpgradeEvents',
    'expected an event array or capture object',
  );
}

/** Replay each captured record at most once, and only while its target remains owned. */
export function replayPreUpgradeEvents(
  root: Node,
  captured: readonly PreUpgradeEvent[],
): number {
  let replayed = 0;
  for (const record of captured) {
    if (consumedEventRecords.has(record)) continue;
    if (!SUPPORTED_PRE_UPGRADE_EVENTS.has(record.type) || !isInside(root, record.target)) {
      consumedEventRecords.add(record);
      continue;
    }
    const target = record.target;
    if (record.event && typeof record.event === 'object') {
      if (consumedEventObjects.has(record.event)) {
        consumedEventRecords.add(record);
        continue;
      }
      consumedEventObjects.add(record.event);
    }
    consumedEventRecords.add(record);
    if (typeof target.dispatchEvent !== 'function') continue;
    const event = record.event ?? (
      typeof globalThis.Event === 'function'
        ? new Event(record.type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          ...record.init,
        })
        : undefined
    );
    if (!event) continue;
    target.dispatchEvent(event);
    replayed++;
  }
  return replayed;
}

interface TextBinding {
  kind: 'text';
  part: Extract<ProgramPartOf<PartProgramV1>, { k: 'text' }>;
  text: Text;
}

interface WhenState {
  kind: 'when';
  part: ProgramWhenPart;
  anchor: Comment;
  end: Comment;
  current: boolean;
  path: string;
}

interface EachEntry {
  key: string;
  nodes: Node[];
  texts: Array<{ text: Text; field?: string }>;
  attrs: Array<{ element: Element; name: string; field: string }>;
}

interface EachState {
  kind: 'each';
  part: ProgramEachPart;
  anchor: Comment;
  end: Comment;
  byKey: Map<string, EachEntry>;
  path: string;
}

type RegionState = WhenState | EachState;

interface PropBinding {
  part: Extract<ProgramPartOf<PartProgramV1>, { k: 'prop' }>;
  element: Element;
}

interface EventBinding {
  part: Extract<ProgramPartOf<PartProgramV1>, { k: 'event' }>;
  element: Element;
}

/** attr/bool/class/style/html sinks claimed against an existing element. */
interface ValueBinding {
  part: Extract<
    ProgramPartOf<PartProgramV1>,
    { k: 'attr' | 'bool' | 'class' | 'style' | 'html' }
  >;
  element: Element;
}

interface ClaimPlan {
  textBindings: TextBinding[];
  regions: RegionState[];
  props: PropBinding[];
  events: EventBinding[];
  values: ValueBinding[];
  elements: Map<string, Element>;
}

type ProgramPartOf<P> = P extends { parts: Array<infer T> } ? T : never;

interface PropertySink extends Element {
  [property: string]: unknown;
}

function propertySink(element: Element): PropertySink {
  return element as PropertySink;
}

function childrenLength(node: Node): number {
  return node.childNodes.length;
}

function childAt(parent: Node, index: number): Node | undefined {
  return parent.childNodes[index];
}

function isComment(node: Node | undefined): node is Comment {
  return !!node && node.nodeType === 8;
}

function isText(node: Node | undefined): node is Text {
  return !!node && node.nodeType === 3;
}

function isElement(node: Node | undefined): node is Element {
  return !!node && node.nodeType === 1;
}

function claimFailure(path: string, message: string, owner: ClaimOwner): never {
  throw new PartProgramClaimError(path, message, owner);
}

function expectComment(
  node: Node | undefined,
  marker: string,
  path: string,
  owner: ClaimOwner,
): Comment {
  if (!isComment(node) || node.data !== marker) {
    claimFailure(path, `expected <!--${marker}--> anchor`, owner);
  }
  return node;
}

function stringValue(value: unknown, path: string, owner: ClaimOwner): string {
  try {
    return String(value);
  } catch {
    claimFailure(path, 'value cannot be converted to text', owner);
  }
}

function activeWhen(
  part: ProgramWhenPart,
  value: unknown,
  path: string,
  owner: ClaimOwner,
): boolean {
  try {
    return Number(value) > part.test.value;
  } catch {
    claimFailure(path, 'conditional dependency cannot be converted to a number', owner);
  }
}

function attributeNames(element: Element): string[] | null {
  const withNames = element as Element & { getAttributeNames?: () => string[] };
  if (typeof withNames.getAttributeNames === 'function') return withNames.getAttributeNames();

  const raw = (element as Element & { attributes?: unknown }).attributes;
  if (!raw || typeof raw !== 'object') return null;
  const keyed = raw as { keys?: () => IterableIterator<string> };
  if (typeof keyed.keys === 'function') return [...keyed.keys()];
  const indexed = raw as { length?: number; [index: number]: { name?: string } };
  if (typeof indexed.length !== 'number') return null;
  const names: string[] = [];
  for (let index = 0; index < indexed.length; index++) {
    const name = indexed[index]?.name;
    if (typeof name === 'string') names.push(name);
  }
  return names;
}

function isExpandedNestedLightHost(element: Element, node: ProgramElementNode): boolean {
  return node.children.length === 0 && node.tag.includes('-') &&
    element.getAttribute('data-oe-light') !== null;
}

function isExternalProjectionBoundary(element: Element, node: ProgramElementNode): boolean {
  return node.tag === 'slot' && node.children.length === 0 && childrenLength(element) > 0;
}

function verifyAttributes(
  element: Element,
  node: ProgramElementNode,
  dynamicNames: readonly string[],
  path: string,
  owner: ClaimOwner,
): void {
  const expectedNames = new Set<string>();
  for (const [name, value] of node.attrs) {
    expectedNames.add(name.toLowerCase());
    if (element.getAttribute(name) !== value) {
      claimFailure(path, `attribute drift on "${name}": expected ${JSON.stringify(value)}`, owner);
    }
  }
  for (const name of dynamicNames) expectedNames.add(name.toLowerCase());
  const actualNames = attributeNames(element);
  if (!actualNames) return;
  for (const actual of actualNames) {
    if (actual.toLowerCase() === 'data-oe-light' && isExpandedNestedLightHost(element, node)) {
      continue;
    }
    if (!expectedNames.has(actual.toLowerCase())) {
      claimFailure(path, `unexpected attribute "${actual}"`, owner);
    }
  }
  for (const expected of expectedNames) {
    if (!actualNames.some((actual) => actual.toLowerCase() === expected)) {
      // A dynamic property sink may legitimately have no serialized attribute;
      // its live property is deliberately not read or overwritten by claim.
      if (dynamicNames.some((name) => name.toLowerCase() === expected)) continue;
      claimFailure(path, `missing attribute "${expected}"`, owner);
    }
  }
}

function verifyStaticElement(
  element: Element,
  node: ProgramElementNode,
  path: string,
  owner: ClaimOwner,
  dynamicNames: readonly string[] = [],
): void {
  if (element.tagName.toLowerCase() !== node.tag) {
    claimFailure(path, `expected <${node.tag}>, found <${element.tagName.toLowerCase()}>`, owner);
  }
  verifyAttributes(element, node, dynamicNames, path, owner);
  if (voidElement(node.tag) && childrenLength(element) !== 0) {
    claimFailure(path, `void element <${node.tag}> has children`, owner);
  }
}

function findRegionEnd(
  parent: Node,
  start: number,
  marker: string,
): Comment | undefined {
  for (let index = start; index < childrenLength(parent); index++) {
    const node = childAt(parent, index);
    if (isComment(node) && node.data === marker) return node;
  }
  return undefined;
}

function regionOwner(
  parent: Node,
  start: number,
  part: ProgramWhenPart | ProgramEachPart,
  anchor: Comment,
  fallback: ClaimOwner,
): ClaimOwner {
  const end = findRegionEnd(parent, start, partAnchorEndMarker(part.index));
  return end ? { kind: 'region', parent, anchor, end, part } : fallback;
}

/**
 * Narrow the keyed-Region key the server/claim grammar requires. Item value
 * and attribute slots carry their own fields (multi-field templates); the
 * Region's optional `field` remains the fallback for field-less slots.
 */
function eachKey(
  part: ProgramEachPart,
  path: string,
  owner: ClaimOwner,
): string {
  if (part.key === undefined) {
    claimFailure(path, 'each Region needs key', owner);
  }
  return part.key;
}

/** Item fields referenced by an each Region's template (ival + iattr slots). */
function itemTemplateFields(
  nodes: readonly ProgramTreeNode[],
  out = new Set<string>(),
): Set<string> {
  for (const node of nodes) {
    if (node.k === 'ival') {
      if (node.field !== undefined) out.add(node.field);
      continue;
    }
    if (node.k === 'el') {
      for (const [, field] of node.iattrs ?? []) out.add(field);
      itemTemplateFields(node.children, out);
    }
  }
  return out;
}

/** Per-item slot value for one field (ival text / iattr attribute). */
function itemFieldValue(
  part: ProgramEachPart,
  item: Record<string, unknown>,
  field: string | undefined,
): unknown {
  if (field === undefined) return part.field === undefined ? item : item[part.field];
  return item[field];
}

/** Serialize a per-item attribute value: bare when true, omitted when absent. */
function itemAttrSerialized(value: unknown): string | null {
  if (value === true) return '';
  if (value === false || value === null || value === undefined) return null;
  return String(value);
}

function itemRecords(
  part: ProgramEachPart,
  value: unknown,
  path: string,
  owner: ClaimOwner,
): Array<Record<string, unknown>> {
  const keyField = eachKey(part, path, owner);
  const requiredFields = itemTemplateFields(part.item);
  if (!Array.isArray(value)) {
    claimFailure(path, 'each Region dependency must contain an array', owner);
  }
  const seen = new Set<string>();
  const items: Array<Record<string, unknown>> = [];
  value.forEach((item, index) => {
    if (!isRecordValue(item)) claimFailure(`${path}[${index}]`, 'item must be a record', owner);
    if (!Object.prototype.hasOwnProperty.call(item, keyField)) {
      claimFailure(`${path}[${index}]`, `item needs ${JSON.stringify(keyField)}`, owner);
    }
    for (const field of requiredFields) {
      if (!Object.prototype.hasOwnProperty.call(item, field)) {
        claimFailure(`${path}[${index}]`, `item needs ${JSON.stringify(field)}`, owner);
      }
    }
    const key = stringValue(item[keyField], `${path}[${index}].${keyField}`, owner);
    if (seen.has(key)) claimFailure(path, `duplicate key ${JSON.stringify(key)}`, owner);
    seen.add(key);
    items.push(item);
  });
  return items;
}

function dynamicNamesFor(
  program: PartProgramV1,
  path: readonly number[],
): string[] {
  return program.parts.flatMap((part) => {
    const samePath = 'path' in part && part.path.length === path.length &&
      part.path.every((value, index) => value === path[index]);
    if (!samePath) return [];
    if (part.k === 'prop' || part.k === 'attr' || part.k === 'bool') return [part.name];
    if (part.k === 'class') return ['class'];
    if (part.k === 'style') return ['style'];
    return [];
  });
}

function claimStaticChildren(
  parent: Node,
  cursor: number,
  nodes: ProgramTreeNode[],
  path: string,
  owner: ClaimOwner,
): number {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const nodePath = `${path}[${index}]`;
    const dom = childAt(parent, cursor++);
    if (!dom) claimFailure(nodePath, 'missing static node', owner);
    if (node.k === 'text') {
      if (!isText(dom) || dom.data !== node.value) {
        claimFailure(nodePath, 'static text drift', owner);
      }
      continue;
    }
    if (node.k !== 'el') claimFailure(nodePath, 'unsupported dynamic node in static Region', owner);
    if (!isElement(dom)) claimFailure(nodePath, `expected <${node.tag}>`, owner);
    verifyStaticElement(dom, node, nodePath, owner);
    const consumed = claimStaticChildren(dom, 0, node.children, `${nodePath}.children`, owner);
    if (consumed !== childrenLength(dom)) {
      claimFailure(`${nodePath}.children`, 'unexpected trailing static nodes', owner);
    }
  }
  return cursor;
}

function claimItemNodes(
  part: ProgramEachPart,
  nodes: ProgramTreeNode[],
  parent: Node,
  cursor: number,
  item: Record<string, unknown>,
  path: string,
  owner: ClaimOwner,
): {
  consumed: number;
  entryNodes: Node[];
  texts: Array<{ text: Text; field?: string }>;
  attrs: Array<{ element: Element; name: string; field: string }>;
} {
  const entryNodes: Node[] = [];
  const texts: Array<{ text: Text; field?: string }> = [];
  const attrs: Array<{ element: Element; name: string; field: string }> = [];
  let used = 0;
  for (const node of nodes) {
    const dom = childAt(parent, cursor + used);
    if (!dom) claimFailure(path, 'missing item node', owner);
    if (node.k === 'ival') {
      if (!isText(dom)) claimFailure(path, 'expected item value text', owner);
      const expected = stringValue(itemFieldValue(part, item, node.field), path, owner);
      if (dom.data !== expected) {
        claimFailure(path, `item text drift: expected ${JSON.stringify(expected)}`, owner);
      }
      texts.push({ text: dom, field: node.field });
      entryNodes.push(dom);
      used++;
      continue;
    }
    if (node.k === 'text') {
      if (!isText(dom) || dom.data !== node.value) claimFailure(path, 'item text drift', owner);
      entryNodes.push(dom);
      used++;
      continue;
    }
    if (node.k !== 'el') claimFailure(path, 'item templates may not contain Part anchors', owner);
    if (!isElement(dom)) claimFailure(path, `expected item element <${node.tag}>`, owner);
    verifyStaticElement(dom, node, path, owner, (node.iattrs ?? []).map(([name]) => name));
    for (const [name, field] of node.iattrs ?? []) {
      const expected = itemAttrSerialized(item[field]);
      const actual = dom.getAttribute(name);
      if (expected === null ? actual !== null : actual !== expected) {
        claimFailure(
          path,
          `item attribute drift on "${name}": expected ${JSON.stringify(expected)}`,
          owner,
        );
      }
      attrs.push({ element: dom, name, field });
    }
    texts.push(...claimItemChildren(part, node, dom, item, path, owner, attrs));
    const consumed = node.children.length;
    if (consumed !== childrenLength(dom)) {
      claimFailure(path, 'item element child count drift', owner);
    }
    entryNodes.push(dom);
    used++;
  }
  return { consumed: used, entryNodes, texts, attrs };
}

function claimItemChildren(
  part: ProgramEachPart,
  node: ProgramElementNode,
  element: Element,
  item: Record<string, unknown>,
  path: string,
  owner: ClaimOwner,
  attrs: Array<{ element: Element; name: string; field: string }>,
): Array<{ text: Text; field?: string }> {
  const texts: Array<{ text: Text; field?: string }> = [];
  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index];
    const dom = childAt(element, index);
    const childPath = `${path}.children[${index}]`;
    if (!dom) claimFailure(childPath, 'missing item child', owner);
    if (child.k === 'ival') {
      if (
        !isText(dom) || dom.data !== stringValue(
            itemFieldValue(part, item, child.field),
            childPath,
            owner,
          )
      ) {
        claimFailure(childPath, 'item text drift', owner);
      }
      texts.push({ text: dom, field: child.field });
      continue;
    }
    if (child.k === 'text') {
      if (!isText(dom) || dom.data !== child.value) {
        claimFailure(childPath, 'item text drift', owner);
      }
      continue;
    }
    if (child.k !== 'el') {
      claimFailure(childPath, 'item templates may not contain Part anchors', owner);
    }
    if (!isElement(dom)) claimFailure(childPath, `expected item element <${child.tag}>`, owner);
    verifyStaticElement(dom, child, childPath, owner, (child.iattrs ?? []).map(([name]) => name));
    for (const [name, field] of child.iattrs ?? []) {
      const expected = itemAttrSerialized(item[field]);
      const actual = dom.getAttribute(name);
      if (expected === null ? actual !== null : actual !== expected) {
        claimFailure(
          childPath,
          `item attribute drift on "${name}": expected ${JSON.stringify(expected)}`,
          owner,
        );
      }
      attrs.push({ element: dom, name, field });
    }
    texts.push(...claimItemChildren(part, child, dom, item, childPath, owner, attrs));
    if (child.children.length !== childrenLength(dom)) {
      claimFailure(childPath, 'item child count drift', owner);
    }
  }
  return texts;
}

function scanChildren(
  program: PartProgramV1,
  host: unknown,
  parent: Node,
  cursor: number,
  nodes: ProgramTreeNode[],
  path: string,
  programPath: readonly number[],
  owner: ClaimOwner,
  plan: Pick<ClaimPlan, 'textBindings' | 'regions' | 'elements'>,
): number {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const nodePath = `${path}[${index}]`;
    const nodeProgramPath = [...programPath, index];
    if (node.k === 'text') {
      const dom = childAt(parent, cursor++);
      if (!isText(dom)) claimFailure(nodePath, 'expected a text node', owner);
      if (dom.data !== node.value) {
        claimFailure(nodePath, `text drift: expected ${JSON.stringify(node.value)}`, owner);
      }
      continue;
    }
    if (node.k === 'el') {
      const dom = childAt(parent, cursor++);
      if (!isElement(dom)) claimFailure(nodePath, `expected <${node.tag}>`, owner);
      plan.elements.set(nodeProgramPath.join('.'), dom);
      const dynamicNames = dynamicNamesFor(program, nodeProgramPath);
      verifyStaticElement(dom, node, nodePath, owner, dynamicNames);
      // A trusted-HTML sink owns the target's whole content: the subtree is
      // opaque to the claim (the program declares no structure inside it).
      const hasHtmlSink = program.parts.some((part) =>
        part.k === 'html' && part.path.length === nodeProgramPath.length &&
        part.path.every((value, index) => value === nodeProgramPath[index])
      );
      // A nested light-root component expanded by SSG owns the subtree that
      // its own Part Program will claim. The parent still verifies the host
      // tag and every attribute it authored, but an originally-empty custom
      // host is opaque once the server marks it as independently rendered.
      const ownsExpandedSubtree = isExpandedNestedLightHost(dom, node) ||
        isExternalProjectionBoundary(dom, node);
      const consumed = hasHtmlSink || ownsExpandedSubtree ? childrenLength(dom) : scanChildren(
        program,
        host,
        dom,
        0,
        node.children,
        `${nodePath}.children`,
        nodeProgramPath,
        owner,
        plan,
      );
      if (consumed !== childrenLength(dom)) {
        claimFailure(`${nodePath}.children`, 'unexpected trailing nodes', owner);
      }
      continue;
    }
    if (node.k === 'ival') {
      claimFailure(nodePath, 'item value slot is outside an each Region', owner);
    }

    const part = program.parts[node.index];
    if (part.k === 'text') {
      const marker = expectComment(
        childAt(parent, cursor++),
        partAnchorMarker(part.index),
        nodePath,
        owner,
      );
      const dom = childAt(parent, cursor++);
      if (!isText(dom)) claimFailure(nodePath, 'expected text after the Part anchor', owner);
      const expected = stringValue(signalOf(host, part.signal).value, nodePath, owner);
      if (dom.data !== expected) {
        claimFailure(nodePath, `Part text drift: expected ${JSON.stringify(expected)}`, owner);
      }
      plan.textBindings.push({ kind: 'text', part, text: dom });
      // Keep the marker read as part of the staged identity check. It is not a
      // mutable sink and therefore is intentionally not stored in the plan.
      void marker;
      continue;
    }
    if (part.k === 'when') {
      const anchor = expectComment(
        childAt(parent, cursor++),
        partAnchorMarker(part.index),
        nodePath,
        owner,
      );
      const scopedOwner = regionOwner(parent, cursor, part, anchor, owner);
      const active = activeWhen(part, signalOf(host, part.signal).value, nodePath, scopedOwner);
      const branch = active ? part.on : part.off;
      cursor = claimStaticChildren(parent, cursor, branch, `${nodePath}.branch`, scopedOwner);
      const end = expectComment(
        childAt(parent, cursor++),
        partAnchorEndMarker(part.index),
        nodePath,
        scopedOwner,
      );
      plan.regions.push({ kind: 'when', part, anchor, end, current: active, path: nodePath });
      continue;
    }
    if (part.k === 'each') {
      const anchor = expectComment(
        childAt(parent, cursor++),
        partAnchorMarker(part.index),
        nodePath,
        owner,
      );
      const scopedOwner = regionOwner(parent, cursor, part, anchor, owner);
      const items = itemRecords(part, signalOf(host, part.signal).value, nodePath, scopedOwner);
      const byKey = new Map<string, EachEntry>();
      for (const item of items) {
        const claimed = claimItemNodes(
          part,
          part.item,
          parent,
          cursor,
          item,
          `${nodePath}.item`,
          scopedOwner,
        );
        cursor += claimed.consumed;
        const key = stringValue(
          item[eachKey(part, nodePath, scopedOwner)],
          nodePath,
          scopedOwner,
        );
        byKey.set(key, {
          key,
          nodes: claimed.entryNodes,
          texts: claimed.texts,
          attrs: claimed.attrs,
        });
      }
      const end = expectComment(
        childAt(parent, cursor++),
        partAnchorEndMarker(part.index),
        nodePath,
        scopedOwner,
      );
      plan.regions.push({ kind: 'each', part, anchor, end, byKey, path: nodePath });
      continue;
    }
    claimFailure(nodePath, `Part ${node.index} has no claimable anchor`, owner);
  }
  return cursor;
}

function createPlan(
  program: PartProgramV1,
  host: unknown,
  root: Node,
  options: ClaimOptions = {},
): ClaimPlan {
  const owner: RootClaimOwner = { kind: 'root', root };
  const firstChild = childAt(root, 0);
  const hasStaticStyle = !!firstChild && isElement(firstChild) &&
    firstChild.tagName.toLowerCase() === 'style' &&
    firstChild.hasAttribute(STATIC_STYLES_MARKER);
  if (hasStaticStyle && !options.expectStaticStyle) {
    claimFailure('template', 'unexpected static style element', owner);
  }
  const plan: ClaimPlan = {
    textBindings: [],
    regions: [],
    props: [],
    events: [],
    values: [],
    elements: new Map(),
  };
  const consumed = scanChildren(
    program,
    host,
    root,
    hasStaticStyle ? 1 : 0,
    program.template,
    'template',
    [],
    owner,
    plan,
  );
  if (consumed !== childrenLength(root)) {
    claimFailure('template', 'unexpected trailing nodes', owner);
  }

  const handlers = handlersOf(host);
  for (const part of program.parts) {
    if (
      part.k === 'attr' || part.k === 'bool' || part.k === 'class' || part.k === 'style' ||
      part.k === 'html'
    ) {
      const element = plan.elements.get(part.path.join('.'));
      if (!element) {
        claimFailure(
          `parts[${part.index}].path`,
          `path [${part.path.join(',')}] is unresolved`,
          owner,
        );
      }
      // Read the dependency now so missing signals cannot leave an earlier
      // subscription attached during the later attach phase.
      signalOf(host, part.signal);
      plan.values.push({ part, element });
    } else if (part.k === 'prop') {
      const element = plan.elements.get(part.path.join('.'));
      if (!element) {
        claimFailure(
          `parts[${part.index}].path`,
          `path [${part.path.join(',')}] is unresolved`,
          owner,
        );
      }
      // Read the dependency now so missing signals cannot leave an earlier
      // subscription attached during the later attach phase.
      signalOf(host, part.signal);
      plan.props.push({ part, element });
    } else if (part.k === 'event') {
      const handler = part.handler === undefined ? undefined : handlers[part.handler];
      if (typeof handler !== 'function') {
        throw new CompiledProgramValidationError(
          `parts[${part.index}].handler`,
          `missing host handler ${JSON.stringify(part.handler)}`,
        );
      }
      const element = plan.elements.get(part.path.join('.'));
      if (!element) {
        claimFailure(
          `parts[${part.index}].path`,
          `path [${part.path.join(',')}] is unresolved`,
          owner,
        );
      }
      plan.events.push({ part, element });
    }
  }
  return plan;
}

function subscribeWrites(
  host: unknown,
  name: string,
  fn: (value: unknown) => void,
  cleanup: Array<() => void>,
): void {
  const signal = signalOf(host, name);
  const snapshot = signal.value;
  let returned = false;
  const unsubscribe = signal.subscribe((value) => {
    if (!returned && Object.is(value, snapshot)) return;
    fn(value);
  });
  returned = true;
  if (typeof unsubscribe !== 'function') {
    throw new CompiledProgramValidationError(
      `host.signals.${name}`,
      'subscribe() must return an unsubscribe function',
    );
  }
  cleanup.push(unsubscribe);
}

function documentFor(node: Node): Document {
  if (node.ownerDocument) return node.ownerDocument;
  if (node.nodeType === 9) return node as Document;
  throw new CompiledProgramValidationError('claim.root', 'root has no ownerDocument');
}

function appendAll(parent: Node, nodes: Node[]): void {
  for (const node of nodes) parent.appendChild(node);
}

function createProgramElement(doc: Document, tag: string): Element {
  if (!/^[a-z][a-z0-9-]*$/.test(tag)) {
    throw new CompiledProgramValidationError('template', 'element tag is invalid');
  }
  return doc.createElement(tag);
}

function buildItemNodes(
  doc: Document,
  part: ProgramEachPart,
  item: Record<string, unknown>,
): Node[] {
  const build = (nodes: ProgramTreeNode[]): Node[] =>
    nodes.map((node) => {
      if (node.k === 'ival') {
        return doc.createTextNode(String(itemFieldValue(part, item, node.field) ?? ''));
      }
      if (node.k === 'text') return doc.createTextNode(node.value);
      if (node.k === 'el') {
        const element = createProgramElement(doc, node.tag);
        for (const [name, value] of node.attrs) element.setAttribute(name, value);
        for (const [name, field] of node.iattrs ?? []) {
          const value = itemAttrSerialized(item[field]);
          if (value !== null) element.setAttribute(name, value);
        }
        if (!voidElement(node.tag)) appendAll(element, build(node.children));
        return element;
      }
      throw new CompiledProgramValidationError(
        `parts[${part.index}].item`,
        'item templates may not contain Part anchors',
      );
    });
  return build(part.item);
}

function buildStaticNodes(doc: Document, nodes: ProgramTreeNode[]): Node[] {
  return nodes.map((node) => {
    if (node.k === 'text') return doc.createTextNode(node.value);
    if (node.k === 'el') {
      const element = createProgramElement(doc, node.tag);
      for (const [name, value] of node.attrs) element.setAttribute(name, value);
      if (!voidElement(node.tag)) appendAll(element, buildStaticNodes(doc, node.children));
      return element;
    }
    throw new CompiledProgramValidationError('claim.recovery', 'dynamic node in static Region');
  });
}

function buildNodes(
  program: PartProgramV1,
  host: unknown,
  doc: Document,
  nodes: ProgramTreeNode[],
  parentPath: readonly number[],
): Node[] {
  const output: Node[] = [];
  nodes.forEach((node, index) => {
    const path = [...parentPath, index];
    if (node.k === 'text') {
      output.push(doc.createTextNode(node.value));
      return;
    }
    if (node.k === 'el') {
      const element = doc.createElement(node.tag);
      for (const [name, value] of node.attrs) element.setAttribute(name, value);
      for (const part of program.parts) {
        const ownsPath = 'path' in part && part.path.length === path.length &&
          part.path.every((value, position) => value === path[position]);
        if (!ownsPath) continue;
        if (part.k === 'prop') {
          const value = signalOf(host, part.signal).value;
          element.setAttribute(part.name, String(value));
          propertySink(element)[part.name] = value;
        } else if (part.k === 'attr') {
          const value = attributeValueOf(signalOf(host, part.signal).value);
          if (value === null) element.removeAttribute(part.name);
          else element.setAttribute(part.name, value);
        } else if (part.k === 'bool') {
          if (signalOf(host, part.signal).value) element.setAttribute(part.name, '');
          else element.removeAttribute(part.name);
        } else if (part.k === 'class') {
          const value = classValueOf(signalOf(host, part.signal).value);
          if (value === '') element.removeAttribute('class');
          else element.setAttribute('class', value);
        } else if (part.k === 'style') {
          const value = styleValueOf(signalOf(host, part.signal).value);
          if (value === '') element.removeAttribute('style');
          else element.setAttribute('style', value);
        } else if (part.k === 'html') {
          const value = trustedHtmlValue(signalOf(host, part.signal).value);
          (element as Element & { innerHTML: string }).innerHTML = value;
        }
      }
      const hasHtmlSink = program.parts.some((part) =>
        part.k === 'html' && part.path.length === path.length &&
        part.path.every((value, position) => value === path[position])
      );
      if (!voidElement(node.tag) && !hasHtmlSink) {
        appendAll(element, buildNodes(program, host, doc, node.children, path));
      }
      output.push(element);
      return;
    }
    if (node.k === 'ival') {
      throw new CompiledProgramValidationError(
        'claim.recovery',
        'item value slot outside each Region',
      );
    }
    const part = program.parts[node.index];
    if (part.k === 'text') {
      output.push(
        doc.createComment(partAnchorMarker(part.index)),
        doc.createTextNode(String(signalOf(host, part.signal).value)),
      );
      return;
    }
    if (part.k === 'when') {
      const active = activeWhen(part, signalOf(host, part.signal).value, `parts[${part.index}]`, {
        kind: 'root',
        root: doc,
      });
      const branch = active ? part.on : part.off;
      output.push(
        doc.createComment(partAnchorMarker(part.index)),
        ...buildStaticNodes(doc, branch),
        doc.createComment(partAnchorEndMarker(part.index)),
      );
      return;
    }
    if (part.k === 'each') {
      const owner: RootClaimOwner = { kind: 'root', root: doc };
      const items = itemRecords(
        part,
        signalOf(host, part.signal).value,
        `parts[${part.index}]`,
        owner,
      );
      output.push(
        doc.createComment(partAnchorMarker(part.index)),
        ...items.flatMap((item) => buildItemNodes(doc, part, item)),
        doc.createComment(partAnchorEndMarker(part.index)),
      );
      return;
    }
    throw new CompiledProgramValidationError('claim.recovery', 'unsupported Part kind');
  });
  return output;
}

function buildRegionContent(
  part: ProgramWhenPart | ProgramEachPart,
  host: unknown,
  doc: Document,
): Node[] {
  if (part.k === 'when') {
    const owner: RootClaimOwner = { kind: 'root', root: doc };
    return buildStaticNodes(
      doc,
      activeWhen(part, signalOf(host, part.signal).value, `parts[${part.index}]`, owner)
        ? part.on
        : part.off,
    );
  }
  const owner: RootClaimOwner = { kind: 'root', root: doc };
  return itemRecords(part, signalOf(host, part.signal).value, `parts[${part.index}]`, owner)
    .flatMap((item) => buildItemNodes(doc, part, item));
}

function removeAllChildren(parent: Node): void {
  while (childrenLength(parent) > 0) {
    const child = childAt(parent, 0);
    if (!child) break;
    parent.removeChild(child);
  }
}

function recoverOwner(
  error: PartProgramClaimError,
  program: PartProgramV1,
  host: unknown,
): boolean {
  if (error.owner.kind === 'region') {
    const { parent, anchor, end, part } = error.owner;
    if (anchor.parentNode !== parent || end.parentNode !== parent) return false;
    const doc = documentFor(parent);
    const replacement = buildRegionContent(part, host, doc);
    let current = anchor.nextSibling;
    while (current && current !== end) {
      const next = current.nextSibling;
      parent.removeChild(current);
      current = next;
    }
    for (const node of replacement) parent.insertBefore(node, end);
    return true;
  }
  const root = error.owner.root;
  const doc = documentFor(root);
  const replacement = buildNodes(program, host, doc, program.template, []);
  // The marked static style node is serializer-owned, not program content:
  // the bounded rebuild preserves it (styles are not part of the drift).
  const firstChild = childAt(root, 0);
  const keepStyle = !!firstChild && isElement(firstChild) &&
    firstChild.tagName.toLowerCase() === 'style' &&
    firstChild.hasAttribute(STATIC_STYLES_MARKER);
  removeAllChildren(root);
  if (keepStyle) root.appendChild(firstChild);
  appendAll(root, replacement);
  return true;
}

function attachPlan(
  plan: ClaimPlan,
  host: unknown,
  root: Node,
  options: ClaimOptions,
): CompiledClaimInstance {
  const cleanup: Array<() => void> = [];
  const listeners: Array<{ element: Element; type: string; listener: EventListener }> = [];
  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    let cleanupFailed = false;
    let firstCleanupError: unknown;
    for (const unsubscribe of cleanup.splice(0)) {
      try {
        unsubscribe();
      } catch (error) {
        if (!cleanupFailed) firstCleanupError = error;
        cleanupFailed = true;
      }
    }
    for (const { element, type, listener } of listeners.splice(0)) {
      try {
        element.removeEventListener(type, listener);
      } catch (error) {
        if (!cleanupFailed) firstCleanupError = error;
        cleanupFailed = true;
      }
    }
    if (cleanupFailed) throw firstCleanupError;
  };
  try {
    for (const binding of plan.textBindings) {
      subscribeWrites(host, binding.part.signal, (value) => {
        binding.text.data = String(value);
      }, cleanup);
    }
    for (const state of plan.regions) {
      if (state.kind === 'when') {
        subscribeWrites(host, state.part.signal, (value) => {
          const parent = state.end.parentNode;
          if (!parent || state.anchor.parentNode !== parent) return;
          const next = activeWhen(state.part, value, state.path, {
            kind: 'region',
            parent,
            anchor: state.anchor,
            end: state.end,
            part: state.part,
          });
          if (next === state.current) return;
          const replacement = buildRegionContent(state.part, host, documentFor(parent));
          let current = state.anchor.nextSibling;
          while (current && current !== state.end) {
            const after = current.nextSibling;
            parent.removeChild(current);
            current = after;
          }
          for (const node of replacement) parent.insertBefore(node, state.end);
          state.current = next;
        }, cleanup);
      } else {
        subscribeWrites(host, state.part.signal, (value) => {
          updateEach(state, value, root);
        }, cleanup);
      }
    }
    for (const binding of plan.props) {
      subscribeWrites(host, binding.part.signal, (value) => {
        propertySink(binding.element)[binding.part.name] = value;
      }, cleanup);
    }
    for (const binding of plan.values) {
      const part = binding.part;
      const element = binding.element;
      if (part.k === 'attr') {
        subscribeWrites(host, part.signal, (value) => {
          const next = attributeValueOf(value);
          if (next === null) element.removeAttribute(part.name);
          else element.setAttribute(part.name, next);
        }, cleanup);
        continue;
      }
      if (part.k === 'bool') {
        subscribeWrites(host, part.signal, (value) => {
          propertySink(element)[part.name] = !!value;
          if (value) element.setAttribute(part.name, '');
          else element.removeAttribute(part.name);
        }, cleanup);
        continue;
      }
      if (part.k === 'class') {
        subscribeWrites(host, part.signal, (value) => {
          const next = classValueOf(value);
          if (next === '') element.removeAttribute('class');
          else element.setAttribute('class', next);
        }, cleanup);
        continue;
      }
      if (part.k === 'style') {
        subscribeWrites(host, part.signal, (value) => {
          const next = styleValueOf(value);
          if (next === '') element.removeAttribute('style');
          else element.setAttribute('style', next);
        }, cleanup);
        continue;
      }
      // html: trusted pre-sanitized content replaces the opaque subtree.
      trustedHtmlValue(signalOf(host, part.signal).value);
      subscribeWrites(host, part.signal, (value) => {
        (element as Element & { innerHTML: string }).innerHTML = trustedHtmlValue(value);
      }, cleanup);
    }
    const handlers = handlersOf(host);
    for (const binding of plan.events) {
      const handler = binding.part.handler === undefined
        ? undefined
        : handlers[binding.part.handler];
      if (!handler) {
        throw new CompiledProgramValidationError(
          `parts[${binding.part.index}]`,
          'missing event handler',
        );
      }
      const listener: EventListener = (event) => handler(event);
      binding.element.addEventListener(binding.part.event, listener);
      listeners.push({ element: binding.element, type: binding.part.event, listener });
    }
    replayPreUpgradeEvents(root, eventList(options.preUpgradeEvents));
    return { dispose };
  } catch (error) {
    try {
      dispose();
    } catch {
      // Preserve the attach failure while still attempting every cleanup.
    }
    throw error;
  }
}

function updateEach(state: EachState, value: unknown, root: Node): void {
  const owner: RootClaimOwner = { kind: 'root', root };
  const items = itemRecords(state.part, value, state.path, owner);
  const keyField = eachKey(state.part, state.path, owner);
  const parent = state.end.parentNode;
  if (!parent || state.anchor.parentNode !== parent) return;
  const nextEntries: EachEntry[] = [];
  const nextByKey = new Map<string, EachEntry>();
  for (const item of items) {
    const key = stringValue(item[keyField], state.path, owner);
    let entry = state.byKey.get(key);
    if (!entry) {
      entry = {
        key,
        nodes: buildItemNodes(documentFor(parent), state.part, item),
        texts: [],
        attrs: [],
      };
      collectItemValueSlots(state.part.item, entry.nodes, entry.texts, entry.attrs);
    } else {
      for (const slot of entry.texts) {
        const nextText = stringValue(
          itemFieldValue(state.part, item, slot.field),
          state.path,
          owner,
        );
        if (slot.text.data !== nextText) slot.text.data = nextText;
      }
      for (const slot of entry.attrs) {
        const next = itemAttrSerialized(item[slot.field]);
        if (next === null) {
          if (slot.element.hasAttribute(slot.name)) slot.element.removeAttribute(slot.name);
        } else if (slot.element.getAttribute(slot.name) !== next) {
          slot.element.setAttribute(slot.name, next);
        }
      }
    }
    nextEntries.push(entry);
    nextByKey.set(key, entry);
  }

  let current: Node = state.anchor.nextSibling ?? state.end;
  for (const entry of nextEntries) {
    for (const node of entry.nodes) {
      if (node === current) current = current.nextSibling ?? state.end;
      else parent.insertBefore(node, current);
    }
  }
  for (const [key, entry] of state.byKey) {
    if (nextByKey.has(key)) continue;
    for (const node of entry.nodes) node.parentNode?.removeChild(node);
  }
  state.byKey = nextByKey;
}

function collectItemValueSlots(
  nodes: ProgramTreeNode[],
  domNodes: Node[],
  texts: Array<{ text: Text; field?: string }>,
  attrs: Array<{ element: Element; name: string; field: string }>,
): void {
  let domIndex = 0;
  for (const node of nodes) {
    const dom = domNodes[domIndex++];
    if (node.k === 'ival') {
      if (isText(dom)) texts.push({ text: dom, field: node.field });
      continue;
    }
    if (node.k === 'el' && isElement(dom)) {
      for (const [name, field] of node.iattrs ?? []) attrs.push({ element: dom, name, field });
      const descendants = Array.from(dom.childNodes);
      collectItemValueSlots(node.children, descendants, texts, attrs);
    }
  }
}

/** Claim existing DOM against one validated Part Program. */
export function claimExistingDom(
  raw: unknown,
  host: unknown,
  root: Node,
  options: ClaimOptions = {},
): CompiledClaimInstance {
  // Stop a live capture before staged validation so a failed claim cannot
  // leave its root listener installed. The captured records are replayed only
  // after the complete plan has attached successfully.
  const capturedEvents = eventList(options.preUpgradeEvents);
  const attachOptions = capturedEvents === options.preUpgradeEvents
    ? options
    : { ...options, preUpgradeEvents: capturedEvents };
  const program = assertCompiledProgram(raw);
  const recovery = options.recovery ?? 'throw';
  let recovered = false;
  for (;;) {
    try {
      const plan = createPlan(program, host, root, options);
      return attachPlan(plan, host, root, attachOptions);
    } catch (error) {
      if (!(error instanceof PartProgramClaimError)) throw error;
      options.onMismatch?.(error);
      if (recovery !== 'owning' || recovered || !recoverOwner(error, program, host)) throw error;
      recovered = true;
    }
  }
}

/** Explicit alias for callers that name the operation after the artifact. */
export const claimPartProgram = claimExistingDom;
