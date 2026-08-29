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
  type PartProgramSpike,
  type SpikeEachPart,
  type SpikeElementNode,
  type SpikeTreeNode,
  type SpikeWhenPart,
} from '../program.ts';
import {
  assertCompiledProgram,
  CompiledProgramValidationError,
  handlersOf,
  isRecordValue,
  signalOf,
  voidElement,
} from '../server/shared.ts';

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
  part: SpikeWhenPart | SpikeEachPart;
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
  part: Extract<SpikePartOf<PartProgramSpike>, { k: 'text' }>;
  text: Text;
}

interface WhenState {
  kind: 'when';
  part: SpikeWhenPart;
  anchor: Comment;
  end: Comment;
  current: boolean;
  path: string;
}

interface EachEntry {
  key: string;
  nodes: Node[];
  texts: Text[];
}

interface EachState {
  kind: 'each';
  part: SpikeEachPart;
  anchor: Comment;
  end: Comment;
  byKey: Map<string, EachEntry>;
  path: string;
}

type RegionState = WhenState | EachState;

interface PropBinding {
  part: Extract<SpikePartOf<PartProgramSpike>, { k: 'prop' }>;
  element: Element;
}

interface EventBinding {
  part: Extract<SpikePartOf<PartProgramSpike>, { k: 'event' }>;
  element: Element;
}

interface ClaimPlan {
  textBindings: TextBinding[];
  regions: RegionState[];
  props: PropBinding[];
  events: EventBinding[];
  elements: Map<string, Element>;
}

type SpikePartOf<P> = P extends { parts: Array<infer T> } ? T : never;

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

function activeWhen(part: SpikeWhenPart, value: unknown, path: string, owner: ClaimOwner): boolean {
  try {
    return Number(value) > part.gt;
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

function verifyAttributes(
  element: Element,
  node: SpikeElementNode,
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
  node: SpikeElementNode,
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
  part: SpikeWhenPart | SpikeEachPart,
  anchor: Comment,
  fallback: ClaimOwner,
): ClaimOwner {
  const end = findRegionEnd(parent, start, partAnchorEndMarker(part.index));
  return end ? { kind: 'region', parent, anchor, end, part } : fallback;
}

/**
 * Narrow the keyed-Region fields the server/claim grammar requires. Program
 * validation already rejects field-less `each` Regions for these modes; this
 * guard keeps the type-level invariant explicit and fail-closed.
 */
function eachKeyAndField(
  part: SpikeEachPart,
  path: string,
  owner: ClaimOwner,
): { key: string; field: string } {
  if (part.key === undefined || part.field === undefined) {
    claimFailure(path, 'each Region needs key and field', owner);
  }
  return { key: part.key, field: part.field };
}

function itemRecords(
  part: SpikeEachPart,
  value: unknown,
  path: string,
  owner: ClaimOwner,
): Array<Record<string, unknown>> {
  const { key: keyField, field: valueField } = eachKeyAndField(part, path, owner);
  if (!Array.isArray(value)) {
    claimFailure(path, 'each Region dependency must contain an array', owner);
  }
  const seen = new Set<string>();
  const items: Array<Record<string, unknown>> = [];
  value.forEach((item, index) => {
    if (!isRecordValue(item)) claimFailure(`${path}[${index}]`, 'item must be a record', owner);
    if (
      !Object.prototype.hasOwnProperty.call(item, keyField) ||
      !Object.prototype.hasOwnProperty.call(item, valueField)
    ) {
      claimFailure(
        `${path}[${index}]`,
        `item needs ${JSON.stringify(keyField)} and ${JSON.stringify(valueField)}`,
        owner,
      );
    }
    const key = stringValue(item[keyField], `${path}[${index}].${keyField}`, owner);
    if (seen.has(key)) claimFailure(path, `duplicate key ${JSON.stringify(key)}`, owner);
    seen.add(key);
    items.push(item);
  });
  return items;
}

function dynamicNamesFor(
  program: PartProgramSpike,
  path: readonly number[],
): string[] {
  return program.parts.flatMap((part) => {
    if (
      part.k === 'prop' && part.path.length === path.length &&
      part.path.every((value, index) => value === path[index])
    ) return [part.name];
    return [];
  });
}

function claimStaticChildren(
  parent: Node,
  cursor: number,
  nodes: SpikeTreeNode[],
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
  part: SpikeEachPart,
  nodes: SpikeTreeNode[],
  parent: Node,
  cursor: number,
  item: Record<string, unknown>,
  path: string,
  owner: ClaimOwner,
): { consumed: number; entryNodes: Node[]; texts: Text[] } {
  const { field } = eachKeyAndField(part, path, owner);
  const entryNodes: Node[] = [];
  const texts: Text[] = [];
  let used = 0;
  for (const node of nodes) {
    const dom = childAt(parent, cursor + used);
    if (!dom) claimFailure(path, 'missing item node', owner);
    if (node.k === 'ival') {
      if (!isText(dom)) claimFailure(path, 'expected item value text', owner);
      const expected = stringValue(item[field], path, owner);
      if (dom.data !== expected) {
        claimFailure(path, `item text drift: expected ${JSON.stringify(expected)}`, owner);
      }
      texts.push(dom);
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
    verifyStaticElement(dom, node, path, owner);
    texts.push(...claimItemChildren(part, node, dom, item, path, owner));
    const consumed = node.children.length;
    if (consumed !== childrenLength(dom)) {
      claimFailure(path, 'item element child count drift', owner);
    }
    entryNodes.push(dom);
    used++;
  }
  return { consumed: used, entryNodes, texts };
}

function claimItemChildren(
  part: SpikeEachPart,
  node: SpikeElementNode,
  element: Element,
  item: Record<string, unknown>,
  path: string,
  owner: ClaimOwner,
): Text[] {
  const { field } = eachKeyAndField(part, path, owner);
  const texts: Text[] = [];
  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index];
    const dom = childAt(element, index);
    const childPath = `${path}.children[${index}]`;
    if (!dom) claimFailure(childPath, 'missing item child', owner);
    if (child.k === 'ival') {
      if (!isText(dom) || dom.data !== stringValue(item[field], childPath, owner)) {
        claimFailure(childPath, 'item text drift', owner);
      }
      texts.push(dom);
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
    verifyStaticElement(dom, child, childPath, owner);
    texts.push(...claimItemChildren(part, child, dom, item, childPath, owner));
    if (child.children.length !== childrenLength(dom)) {
      claimFailure(childPath, 'item child count drift', owner);
    }
  }
  return texts;
}

function scanChildren(
  program: PartProgramSpike,
  host: unknown,
  parent: Node,
  cursor: number,
  nodes: SpikeTreeNode[],
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
      const consumed = scanChildren(
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
          item[eachKeyAndField(part, nodePath, scopedOwner).key],
          nodePath,
          scopedOwner,
        );
        byKey.set(key, { key, nodes: claimed.entryNodes, texts: claimed.texts });
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
  program: PartProgramSpike,
  host: unknown,
  root: Node,
): ClaimPlan {
  const owner: RootClaimOwner = { kind: 'root', root };
  const plan: ClaimPlan = {
    textBindings: [],
    regions: [],
    props: [],
    events: [],
    elements: new Map(),
  };
  const consumed = scanChildren(
    program,
    host,
    root,
    0,
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
    if (part.k === 'prop') {
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

function buildItemNodes(
  doc: Document,
  part: SpikeEachPart,
  item: Record<string, unknown>,
): Node[] {
  if (part.field === undefined) {
    throw new CompiledProgramValidationError(
      `parts[${part.index}].field`,
      'each Region item value slot needs a field',
    );
  }
  const field = part.field;
  const build = (nodes: SpikeTreeNode[]): Node[] =>
    nodes.map((node) => {
      if (node.k === 'ival') return doc.createTextNode(String(item[field]));
      if (node.k === 'text') return doc.createTextNode(node.value);
      if (node.k === 'el') {
        const element = doc.createElement(node.tag);
        for (const [name, value] of node.attrs) element.setAttribute(name, value);
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

function buildStaticNodes(doc: Document, nodes: SpikeTreeNode[]): Node[] {
  return nodes.map((node) => {
    if (node.k === 'text') return doc.createTextNode(node.value);
    if (node.k === 'el') {
      const element = doc.createElement(node.tag);
      for (const [name, value] of node.attrs) element.setAttribute(name, value);
      if (!voidElement(node.tag)) appendAll(element, buildStaticNodes(doc, node.children));
      return element;
    }
    throw new CompiledProgramValidationError('claim.recovery', 'dynamic node in static Region');
  });
}

function buildNodes(
  program: PartProgramSpike,
  host: unknown,
  doc: Document,
  nodes: SpikeTreeNode[],
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
        if (
          part.k === 'prop' && part.path.length === path.length &&
          part.path.every((value, position) => value === path[position])
        ) {
          const value = signalOf(host, part.signal).value;
          element.setAttribute(part.name, String(value));
          propertySink(element)[part.name] = value;
        }
      }
      if (!voidElement(node.tag)) {
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
  part: SpikeWhenPart | SpikeEachPart,
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
  program: PartProgramSpike,
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
  removeAllChildren(root);
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
  const { key: keyField, field: valueField } = eachKeyAndField(state.part, state.path, owner);
  const parent = state.end.parentNode;
  if (!parent || state.anchor.parentNode !== parent) return;
  const nextEntries: EachEntry[] = [];
  const nextByKey = new Map<string, EachEntry>();
  for (const item of items) {
    const key = stringValue(item[keyField], state.path, owner);
    let entry = state.byKey.get(key);
    if (!entry) {
      entry = { key, nodes: buildItemNodes(documentFor(parent), state.part, item), texts: [] };
      collectItemValueTexts(state.part.item, entry.nodes, entry.texts);
    } else {
      const nextText = stringValue(item[valueField], state.path, owner);
      for (const text of entry.texts) if (text.data !== nextText) text.data = nextText;
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

function collectItemValueTexts(nodes: SpikeTreeNode[], domNodes: Node[], out: Text[]): void {
  let domIndex = 0;
  for (const node of nodes) {
    const dom = domNodes[domIndex++];
    if (node.k === 'ival') {
      if (isText(dom)) out.push(dom);
      continue;
    }
    if (node.k === 'el' && isElement(dom)) {
      const descendants = Array.from(dom.childNodes);
      collectItemValueTexts(node.children, descendants, out);
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
      const plan = createPlan(program, host, root);
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
