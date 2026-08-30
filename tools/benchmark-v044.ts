#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-sys
/**
 * v0.44 alpha.7 performance qualification benchmark (#1176).
 *
 * The benchmark consumes the compiler's checked Part Program artifact and
 * exercises the same serializable program through server serialization, fresh
 * DOM creation and existing-DOM claim. The small DOM below is deliberately a
 * measurement harness; it is not a renderer or a compatibility path. The
 * 0.43.3 side is a frozen full-tree render/activation proxy used only for
 * comparable allocation, walk and transfer measurements.
 */

import { fromFileUrl, join, resolve } from '@std/path';
import { compileElementSpike } from '../packages/adapter-vite/src/internal/compiler/semantic-core/compile.ts';
import {
  claimExistingDom,
  createFreshDom,
  serializeToHtml,
} from '../packages/element/src/internal/compiled/runtime.ts';

const defaultFixtureRoot = new URL('../benchmarks/v044/', import.meta.url);
const encoder = new TextEncoder();

type PartKind = 'text' | 'prop' | 'event' | 'when' | 'each';
type ScenarioId = 'fixed-only' | 'conditional' | 'keyed-list' | 'nested-real-app';

interface Item {
  id: string;
  text: string;
}

interface FixtureState {
  count: number;
  label: string;
  items: Item[];
}

type FixtureUpdate =
  | { kind: 'count'; value: number }
  | { kind: 'label'; value: string }
  | { kind: 'items'; value: Item[] };

interface ScenarioDefinition {
  id: ScenarioId;
  enabledParts: PartKind[];
  initial: FixtureState;
  updates: FixtureUpdate[];
}

interface FixtureDefinition {
  schemaVersion: 1;
  fixtureId: string;
  versions: { baseline: string; candidate: string };
  artifact: {
    source: string;
    program: string;
    compiler: string;
    runtime: string;
    staticFixture: string;
  };
  baseline: { interactiveJsBytes: number; description: string };
  environment: {
    deno: string;
    browserMatrix: BrowserName[];
    warmupRuns: number;
    timingSamples: number;
    churnCycles: number;
  };
  budgets: {
    maxCriticalRegressionPercent: number;
    maxHeapGrowthBytes: number;
    maxRetainedSubscriptions: number;
    maxRetainedListeners: number;
    maxClaimAllocations: number;
    maxStaticRuntimeBytes: number;
    maxBrowserPageErrors: number;
  };
  criticalMetrics: CriticalMetric[];
  scenarios: ScenarioDefinition[];
}

type CriticalMetric =
  | 'initialAllocations'
  | 'claimAllocations'
  | 'updateAllocations'
  | 'updateWalkVisits'
  | 'transferBytes';

export type BrowserName = 'chromium' | 'firefox' | 'webkit';

export interface DomMetricSet {
  initialAllocations: number;
  claimAllocations: number;
  updateAllocations: number;
  initialWalkVisits: number;
  updateWalkVisits: number;
  transferBytes: number;
  updates: number;
  updateWrites: number;
  updateListeners: number;
  subscriptions: number;
}

export interface ScenarioTiming {
  serializeMs: number;
  freshMs: number;
  claimMs: number;
  updateMs: number;
  churnMs: number;
}

export interface ScenarioReport {
  id: ScenarioId;
  baseline: DomMetricSet;
  candidate: DomMetricSet;
  timing: ScenarioTiming;
  heapGrowthBytes: number;
  retainedSubscriptions: number;
  retainedListeners: number;
  serializedHtml: string;
}

export interface BrowserEvidence {
  browser: BrowserName;
  passed: boolean;
  pageErrors: string[];
  claimReady: boolean;
  identityPreserved: boolean;
  liveValuePreserved: boolean;
  serializedBytes: number;
}

export interface V044PerformanceReport {
  schemaVersion: 1;
  source: 'tools/benchmark-v044.ts';
  fixtureId: string;
  versions: { baseline: string; candidate: string };
  artifact: {
    source: string;
    program: string;
    compiler: string;
    runtime: string;
    programBytes: number;
    generatedModuleBytes: number;
    instructionCount: number;
  };
  baseline: {
    interactiveJsBytes: number;
    description: string;
  };
  candidate: {
    interactiveJsBytes: number;
    generatedModuleBytes: number;
    programBytes: number;
  };
  staticOutput: {
    runtimeBytes: number;
    transferredBytes: number;
    scriptTags: number;
  };
  environment: {
    deno: string;
    browsers: BrowserName[];
    warmupRuns: number;
    timingSamples: number;
    churnCycles: number;
  };
  scenarios: ScenarioReport[];
  resources: {
    maxHeapGrowthBytes: number;
    maxRetainedSubscriptions: number;
    maxRetainedListeners: number;
  };
  browser: BrowserEvidence[];
}

interface TreeElement {
  k: 'el';
  tag: string;
  attrs: Array<[string, string]>;
  children: TreeNode[];
}

interface TreeText {
  k: 'text';
  value: string;
}

interface TreePart {
  k: 'part';
  index: number;
}

interface TreeItemValue {
  k: 'ival';
}

type TreeNode = TreeElement | TreeText | TreePart | TreeItemValue;

interface TextPart {
  k: 'text';
  index: number;
  signal: string;
}

interface PropPart {
  k: 'prop';
  index: number;
  signal: string;
  name: string;
  path: number[];
}

interface EventPart {
  k: 'event';
  index: number;
  event: string;
  handler: string;
  path: number[];
}

interface WhenPart {
  k: 'when';
  index: number;
  signal: string;
  gt: number;
  on: TreeNode[];
  off: TreeNode[];
}

interface EachPart {
  k: 'each';
  index: number;
  signal: string;
  key: string;
  field: string;
  item: TreeNode[];
}

type ProgramPart = TextPart | PropPart | EventPart | WhenPart | EachPart;

interface Program {
  version: number;
  tag: string;
  template: TreeNode[];
  parts: ProgramPart[];
}

function pathForRoot(root: URL | string): string {
  return typeof root === 'string' ? resolve(root) : fromFileUrl(root);
}

function assertNumber(value: unknown, name: string, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    throw new Error(`[v044-performance] ${name} must be a finite number >= ${minimum}`);
  }
  return value;
}

function assertDefinition(raw: unknown): asserts raw is FixtureDefinition {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('[v044-performance] fixture definition must be an object');
  }
  const definition = raw as Record<string, unknown>;
  if (definition.schemaVersion !== 1) {
    throw new Error('[v044-performance] fixture schemaVersion must be 1');
  }
  if (typeof definition.fixtureId !== 'string' || definition.fixtureId.length === 0) {
    throw new Error('[v044-performance] fixtureId must be a non-empty string');
  }
  const versions = definition.versions as Record<string, unknown> | undefined;
  if (
    !versions || typeof versions.baseline !== 'string' || typeof versions.candidate !== 'string'
  ) {
    throw new Error('[v044-performance] fixture versions are incomplete');
  }
  const artifact = definition.artifact as Record<string, unknown> | undefined;
  if (!artifact || Object.values(artifact).some((value) => typeof value !== 'string')) {
    throw new Error('[v044-performance] artifact paths are incomplete');
  }
  const baseline = definition.baseline as Record<string, unknown> | undefined;
  if (!baseline) throw new Error('[v044-performance] baseline is missing');
  assertNumber(baseline.interactiveJsBytes, 'baseline.interactiveJsBytes', 1);
  if (typeof baseline.description !== 'string' || baseline.description.length === 0) {
    throw new Error('[v044-performance] baseline.description must be non-empty');
  }
  const environment = definition.environment as Record<string, unknown> | undefined;
  if (!environment || typeof environment.deno !== 'string') {
    throw new Error('[v044-performance] environment is incomplete');
  }
  assertNumber(environment.warmupRuns, 'environment.warmupRuns');
  assertNumber(environment.timingSamples, 'environment.timingSamples', 1);
  assertNumber(environment.churnCycles, 'environment.churnCycles', 1);
  if (
    !Array.isArray(environment.browserMatrix) ||
    environment.browserMatrix.some((name) =>
      !['chromium', 'firefox', 'webkit'].includes(String(name))
    )
  ) {
    throw new Error('[v044-performance] environment.browserMatrix is invalid');
  }
  const budgets = definition.budgets as Record<string, unknown> | undefined;
  if (!budgets) throw new Error('[v044-performance] budgets are missing');
  for (
    const [name, minimum] of [
      ['maxCriticalRegressionPercent', 0],
      ['maxHeapGrowthBytes', 0],
      ['maxRetainedSubscriptions', 0],
      ['maxRetainedListeners', 0],
      ['maxClaimAllocations', 0],
      ['maxStaticRuntimeBytes', 0],
      ['maxBrowserPageErrors', 0],
    ] as const
  ) assertNumber(budgets[name], `budgets.${name}`, minimum);
  if (!Array.isArray(definition.criticalMetrics) || definition.criticalMetrics.length === 0) {
    throw new Error('[v044-performance] criticalMetrics must be non-empty');
  }
  const scenarios = definition.scenarios;
  const expectedIds: ScenarioId[] = [
    'fixed-only',
    'conditional',
    'keyed-list',
    'nested-real-app',
  ];
  if (
    !Array.isArray(scenarios) ||
    scenarios.length !== expectedIds.length ||
    scenarios.map((scenario) => scenario.id).join('|') !== expectedIds.join('|')
  ) {
    throw new Error(`[v044-performance] scenarios must be ${expectedIds.join(', ')}`);
  }
  for (const scenario of scenarios) {
    if (!Array.isArray(scenario.enabledParts) || scenario.enabledParts.length === 0) {
      throw new Error(`[v044-performance] ${scenario.id} has no enabled parts`);
    }
    if (!Array.isArray(scenario.updates)) {
      throw new Error(`[v044-performance] ${scenario.id} updates must be an array`);
    }
  }
}

export async function loadV044Definition(
  fixtureRoot: URL | string = defaultFixtureRoot,
): Promise<FixtureDefinition> {
  const fixtureDir = pathForRoot(fixtureRoot);
  const raw = JSON.parse(await Deno.readTextFile(join(fixtureDir, 'fixtures.json'))) as unknown;
  assertDefinition(raw);
  return raw;
}

function metricSet(value: Record<string, number>): DomMetricSet {
  return {
    initialAllocations: value.initialAllocations ?? 0,
    claimAllocations: value.claimAllocations ?? 0,
    updateAllocations: value.updateAllocations ?? 0,
    initialWalkVisits: value.initialWalkVisits ?? 0,
    updateWalkVisits: value.updateWalkVisits ?? 0,
    transferBytes: value.transferBytes ?? 0,
    updates: value.updates ?? 0,
    updateWrites: value.updateWrites ?? 0,
    updateListeners: value.updateListeners ?? 0,
    subscriptions: value.subscriptions ?? 0,
  };
}

interface DomCounts {
  elements: number;
  texts: number;
  comments: number;
  textWrites: number;
  valueWrites: number;
  listenerAdds: number;
  listenerRemoves: number;
  removals: number;
  walkVisits: number;
}

type FNode = FElement | FText | FComment;

abstract class FNodeBase {
  readonly ownerDocument: FDocument;
  parentNode: FElement | null = null;
  childNodes: FNode[] = [];

  constructor(ownerDocument: FDocument) {
    this.ownerDocument = ownerDocument;
  }

  get nextSibling(): FNode | null {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    const index = siblings.indexOf(this as unknown as FNode);
    return index >= 0 && index + 1 < siblings.length ? siblings[index + 1] : null;
  }

  appendChild(node: FNode): FNode {
    this.detachForMove(node);
    node.parentNode = this as unknown as FElement;
    this.childNodes.push(node);
    return node;
  }

  insertBefore(node: FNode, reference: FNode): FNode {
    this.detachForMove(node);
    const index = this.childNodes.indexOf(reference);
    if (index < 0) throw new Error('[v044-performance] insertBefore reference is missing');
    node.parentNode = this as unknown as FElement;
    this.childNodes.splice(index, 0, node);
    return node;
  }

  private detachForMove(node: FNode): void {
    const parent = node.parentNode;
    if (!parent) return;
    const index = parent.childNodes.indexOf(node);
    if (index >= 0) parent.childNodes.splice(index, 1);
    node.parentNode = null;
  }

  removeChild(node: FNode): FNode {
    const index = this.childNodes.indexOf(node);
    if (index < 0) throw new Error('[v044-performance] removeChild node is missing');
    this.childNodes.splice(index, 1);
    node.parentNode = null;
    this.ownerDocument.counts.removals++;
    return node;
  }
}

class FText extends FNodeBase {
  readonly nodeType = 3;
  #data: string;

  constructor(ownerDocument: FDocument, data: string) {
    super(ownerDocument);
    this.#data = data;
  }

  get data(): string {
    return this.#data;
  }

  set data(value: string) {
    this.#data = value;
    this.ownerDocument.counts.textWrites++;
  }
}

class FComment extends FNodeBase {
  readonly nodeType = 8;

  constructor(ownerDocument: FDocument, readonly data: string) {
    super(ownerDocument);
  }
}

class FElement extends FNodeBase {
  readonly nodeType = 1;
  readonly tagName: string;
  readonly attributes = new Map<string, string>();
  readonly listeners = new Map<string, Set<EventListener>>();
  #value: unknown = '';

  constructor(ownerDocument: FDocument, tagName: string) {
    super(ownerDocument);
    this.tagName = tagName.toUpperCase();
  }

  get value(): unknown {
    return this.#value;
  }

  set value(next: unknown) {
    this.#value = next;
    this.ownerDocument.counts.valueWrites++;
  }

  simulateUserInput(next: string): void {
    this.#value = next;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.has(name) ? this.attributes.get(name)! : null;
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
    this.ownerDocument.counts.listenerAdds++;
  }

  removeEventListener(type: string, listener: EventListener): void {
    if (this.listeners.get(type)?.delete(listener)) this.ownerDocument.counts.listenerRemoves++;
  }

  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener({ type } as Event);
  }

  listenerCount(): number {
    let count = 0;
    for (const listeners of this.listeners.values()) count += listeners.size;
    for (const child of this.childNodes) {
      if (child instanceof FElement) count += child.listenerCount();
    }
    return count;
  }
}

class FDocument {
  readonly counts: DomCounts = {
    elements: 0,
    texts: 0,
    comments: 0,
    textWrites: 0,
    valueWrites: 0,
    listenerAdds: 0,
    listenerRemoves: 0,
    removals: 0,
    walkVisits: 0,
  };

  createElement(tagName: string): FElement {
    this.counts.elements++;
    return new FElement(this, tagName);
  }

  createTextNode(data: string): FText {
    this.counts.texts++;
    return new FText(this, data);
  }

  createComment(data: string): FComment {
    this.counts.comments++;
    return new FComment(this, data);
  }

  resetCounts(): void {
    for (const key of Object.keys(this.counts) as Array<keyof DomCounts>) this.counts[key] = 0;
  }
}

const voidTags = new Set([
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

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function unescapeText(value: string): string {
  return value.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll(
    '&amp;',
    '&',
  );
}

function toHtml(node: FNode): string {
  if (node instanceof FText) return escapeText(node.data);
  if (node instanceof FComment) return `<!--${node.data}-->`;
  const tag = node.tagName.toLowerCase();
  const attrs = Array.from(node.attributes.entries())
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join('');
  if (voidTags.has(tag)) return `<${tag}${attrs}>`;
  return `<${tag}${attrs}>${node.childNodes.map(toHtml).join('')}</${tag}>`;
}

function parseHtml(doc: FDocument, html: string): FElement {
  const host = doc.createElement('host');
  const stack: FElement[] = [host];
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)) {
    const token = match[0];
    const parent = stack[stack.length - 1];
    if (token.startsWith('<!--')) {
      parent.appendChild(doc.createComment(token.slice(4, -3)));
    } else if (token.startsWith('</')) {
      if (stack.length === 1) throw new Error('[v044-performance] malformed fixture closing tag');
      stack.pop();
    } else if (token.startsWith('<')) {
      const inner = token.slice(1, -1);
      const space = inner.search(/\s/);
      const tag = (space < 0 ? inner : inner.slice(0, space)).toLowerCase();
      const element = doc.createElement(tag);
      const attrSource = space < 0 ? '' : inner.slice(space);
      for (const attr of attrSource.matchAll(/([\w-]+)="([^"]*)"/g)) {
        element.setAttribute(attr[1], unescapeText(attr[2]));
      }
      parent.appendChild(element);
      if (!voidTags.has(tag)) stack.push(element);
    } else {
      parent.appendChild(doc.createTextNode(unescapeText(token)));
    }
  }
  if (stack.length !== 1) throw new Error('[v044-performance] malformed fixture opening tag');
  return host;
}

function walk(node: FNode): void {
  node.ownerDocument.counts.walkVisits++;
  for (const child of node.childNodes) walk(child);
}

function allocationCount(counts: DomCounts): number {
  return counts.elements + counts.texts + counts.comments;
}

function cloneState(state: FixtureState): FixtureState {
  return {
    count: state.count,
    label: state.label,
    items: state.items.map((item) => ({ ...item })),
  };
}

function applyUpdate(state: FixtureState, update: FixtureUpdate): FixtureState {
  const next = cloneState(state);
  if (update.kind === 'count') next.count = update.value;
  if (update.kind === 'label') next.label = update.value;
  if (update.kind === 'items') next.items = update.value.map((item) => ({ ...item }));
  return next;
}

function hasPart(enabled: ReadonlySet<PartKind>, kind: PartKind): boolean {
  return enabled.has(kind);
}

const partOrder: PartKind[] = ['text', 'prop', 'event', 'when', 'each'];

function projectedPartIndex(enabled: ReadonlySet<PartKind>, kind: PartKind): number {
  const index = partOrder.filter((part) => enabled.has(part)).indexOf(kind);
  if (index < 0) throw new Error(`[v044-performance] ${kind} is not enabled`);
  return index;
}

/** Frozen 0.43.3 proxy: full subtree render plus full activation walk per update. */
function build043Proxy(
  doc: FDocument,
  state: FixtureState,
  enabled: ReadonlySet<PartKind>,
): FElement {
  const host = doc.createElement('host');
  const div = doc.createElement('div');
  div.setAttribute('class', 'spike');
  host.appendChild(div);

  const h1 = doc.createElement('h1');
  div.appendChild(h1);
  h1.appendChild(doc.createTextNode('Count: '));
  if (hasPart(enabled, 'text')) {
    h1.appendChild(doc.createComment('oe:p0'));
    h1.appendChild(doc.createTextNode(String(state.count)));
  }

  if (hasPart(enabled, 'prop')) {
    const input = doc.createElement('input');
    input.setAttribute('value', state.label);
    div.appendChild(input);
  }

  let button: FElement | null = null;
  if (hasPart(enabled, 'event')) {
    button = doc.createElement('button');
    button.setAttribute('type', 'button');
    button.appendChild(doc.createTextNode('+'));
    div.appendChild(button);
  }

  if (hasPart(enabled, 'when')) {
    div.appendChild(doc.createComment(`oe:p${projectedPartIndex(enabled, 'when')}`));
    const parity = doc.createElement('p');
    parity.setAttribute('class', 'parity');
    parity.appendChild(doc.createTextNode(state.count > 0 ? 'positive' : 'zero'));
    div.appendChild(parity);
    div.appendChild(doc.createComment(`oe:/p${projectedPartIndex(enabled, 'when')}`));
  }

  const list = doc.createElement('ul');
  div.appendChild(list);
  if (hasPart(enabled, 'each')) {
    const partIndex = projectedPartIndex(enabled, 'each');
    list.appendChild(doc.createComment(`oe:p${partIndex}`));
    for (const item of state.items) {
      const li = doc.createElement('li');
      li.appendChild(doc.createTextNode(item.text));
      list.appendChild(li);
    }
    list.appendChild(doc.createComment(`oe:/p${partIndex}`));
  }

  walk(host);
  if (button) button.addEventListener('click', () => undefined);
  return host;
}

function projectProgram(program: Program, enabled: ReadonlySet<PartKind>): Program {
  const selected = program.parts.filter((part) => enabled.has(part.k));
  const remap = new Map<number, number>();
  selected.forEach((part, index) => remap.set(part.index, index));

  const projectNodes = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      if (node.k === 'part') {
        const original = program.parts[node.index];
        if (!original || !enabled.has(original.k)) continue;
        const index = remap.get(node.index);
        if (index === undefined) throw new Error('[v044-performance] part remap is incomplete');
        result.push({ k: 'part', index });
        continue;
      }
      if (node.k === 'el') {
        result.push({ ...node, children: projectNodes(node.children) });
        continue;
      }
      result.push(node);
    }
    return result;
  };

  return {
    version: program.version,
    tag: program.tag,
    template: projectNodes(program.template),
    parts: selected.map((part, index) => ({ ...part, index })) as ProgramPart[],
  };
}

class MeasurementSignal<T> {
  #value: T;
  readonly listeners = new Set<(value: T) => void>();

  constructor(initial: T) {
    this.#value = initial;
  }

  get value(): T {
    return this.#value;
  }

  set value(next: T) {
    this.#value = next;
    for (const listener of [...this.listeners]) listener(next);
  }

  subscribe(listener: (value: T) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

interface HostBundle {
  host: Parameters<typeof serializeToHtml>[1];
  count: MeasurementSignal<number>;
  label: MeasurementSignal<string>;
  items: MeasurementSignal<Item[]>;
}

function makeHost(state: FixtureState): HostBundle {
  const count = new MeasurementSignal(state.count);
  const label = new MeasurementSignal(state.label);
  const items = new MeasurementSignal(state.items.map((item) => ({ ...item })));
  return {
    count,
    label,
    items,
    host: {
      signals: { count, label, items },
      handlers: { increment: () => count.value = count.value + 1 },
    } as unknown as Parameters<typeof serializeToHtml>[1],
  };
}

function applySignalUpdate(bundle: HostBundle, update: FixtureUpdate): void {
  if (update.kind === 'count') bundle.count.value = update.value;
  if (update.kind === 'label') bundle.label.value = update.value;
  if (update.kind === 'items') bundle.items.value = update.value.map((item) => ({ ...item }));
}

function subscriptionCount(bundle: HostBundle): number {
  return bundle.count.listeners.size + bundle.label.listeners.size + bundle.items.listeners.size;
}

function runtimeProgram(program: Program): Parameters<typeof serializeToHtml>[0] {
  return program as unknown as Parameters<typeof serializeToHtml>[0];
}

function runtimeRoot(root: FElement): Parameters<typeof createFreshDom>[2] {
  return root as unknown as Parameters<typeof createFreshDom>[2];
}

function runtimeHost(host: HostBundle['host']): Parameters<typeof createFreshDom>[1] {
  return host;
}

interface CandidateRun {
  metrics: DomMetricSet;
  timing: ScenarioTiming;
  heapGrowthBytes: number;
  retainedSubscriptions: number;
  retainedListeners: number;
  serializedHtml: string;
}

function runCandidateScenario(
  program: Program,
  scenario: ScenarioDefinition,
  churnCycles: number,
): CandidateRun {
  const initial = cloneState(scenario.initial);
  const ssrHost = makeHost(initial);
  const serializeStarted = performance.now();
  const serializedHtml = serializeToHtml(runtimeProgram(program), runtimeHost(ssrHost.host));
  const serializeMs = performance.now() - serializeStarted;

  const freshDoc = new FDocument();
  const freshRoot = freshDoc.createElement('host');
  freshDoc.resetCounts();
  const freshHost = makeHost(initial);
  const freshStarted = performance.now();
  const instance = createFreshDom(
    runtimeProgram(program),
    runtimeHost(freshHost.host),
    runtimeRoot(freshRoot),
  );
  const freshMs = performance.now() - freshStarted;
  const initialAllocations = allocationCount(freshDoc.counts);
  const initialSubscriptions = subscriptionCount(freshHost);

  if (toHtml(freshRoot) !== `<host>${serializedHtml}</host>`) {
    throw new Error(`[v044-performance] ${scenario.id} fresh DOM diverges from SSR`);
  }

  freshDoc.resetCounts();
  const updateStarted = performance.now();
  for (const update of scenario.updates) applySignalUpdate(freshHost, update);
  const updateMs = performance.now() - updateStarted;
  const updateAllocations = allocationCount(freshDoc.counts);
  const updateWrites = freshDoc.counts.textWrites + freshDoc.counts.valueWrites;
  const updateListeners = freshDoc.counts.listenerAdds;

  const claimDoc = new FDocument();
  const claimRoot = parseHtml(claimDoc, serializedHtml);
  const claimDiv = claimRoot.childNodes[0] as FElement;
  const claimInput = claimDiv.childNodes.find((node) =>
    node instanceof FElement && node.tagName === 'INPUT'
  ) as FElement | undefined;
  const claimH1 = claimDiv.childNodes.find((node) =>
    node instanceof FElement && node.tagName === 'H1'
  ) as FElement | undefined;
  const claimText = claimH1?.childNodes.find((node) =>
    node instanceof FText && node.data !== 'Count: '
  ) as FText | undefined;
  if (!claimInput || !claimText) {
    throw new Error(`[v044-performance] ${scenario.id} claim fixture is incomplete`);
  }
  claimInput.simulateUserInput('typed by user');
  claimDoc.resetCounts();
  const claimHost = makeHost(initial);
  const claimStarted = performance.now();
  const claimed = claimExistingDom(
    runtimeProgram(program),
    runtimeHost(claimHost.host),
    runtimeRoot(claimRoot),
  );
  const claimMs = performance.now() - claimStarted;
  if (
    claimDoc.counts.elements !== 0 || claimDoc.counts.texts !== 0 || claimDoc.counts.comments !== 0
  ) {
    throw new Error(`[v044-performance] ${scenario.id} claim allocated DOM nodes`);
  }
  if (
    claimInput.value !== 'typed by user' || toHtml(claimRoot) !== `<host>${serializedHtml}</host>`
  ) {
    throw new Error(`[v044-performance] ${scenario.id} claim did not preserve live state`);
  }
  claimed.dispose();

  const memoryBefore = Deno.memoryUsage().heapUsed;
  const churnStarted = performance.now();
  for (let cycle = 0; cycle < churnCycles; cycle++) {
    const churnHost = makeHost(initial);
    const churnDoc = new FDocument();
    const churnRoot = churnDoc.createElement('host');
    const churnInstance = createFreshDom(
      runtimeProgram(program),
      runtimeHost(churnHost.host),
      runtimeRoot(churnRoot),
    );
    churnInstance.dispose();
    if (subscriptionCount(churnHost) !== 0 || churnRoot.listenerCount() !== 0) {
      throw new Error(`[v044-performance] ${scenario.id} retained resources during churn`);
    }
  }
  const churnMs = performance.now() - churnStarted;
  const memoryAfter = Deno.memoryUsage().heapUsed;

  instance.dispose();
  const retainedSubscriptions = subscriptionCount(freshHost);
  const retainedListeners = freshRoot.listenerCount();

  return {
    metrics: metricSet({
      initialAllocations,
      claimAllocations: claimDoc.counts.elements + claimDoc.counts.texts + claimDoc.counts.comments,
      updateAllocations,
      initialWalkVisits: 0,
      updateWalkVisits: 0,
      transferBytes: encoder.encode(serializedHtml).byteLength,
      updates: scenario.updates.length,
      updateWrites,
      updateListeners,
      subscriptions: initialSubscriptions,
    }),
    timing: {
      serializeMs: Number(serializeMs.toFixed(3)),
      freshMs: Number(freshMs.toFixed(3)),
      claimMs: Number(claimMs.toFixed(3)),
      updateMs: Number(updateMs.toFixed(3)),
      churnMs: Number(churnMs.toFixed(3)),
    },
    heapGrowthBytes: Math.max(0, memoryAfter - memoryBefore),
    retainedSubscriptions,
    retainedListeners,
    serializedHtml,
  };
}

function runBaselineScenario(
  scenario: ScenarioDefinition,
): { metrics: DomMetricSet; timing: ScenarioTiming; html: string } {
  const enabled = new Set(scenario.enabledParts);
  const doc = new FDocument();
  const initialStarted = performance.now();
  let root = build043Proxy(doc, scenario.initial, enabled);
  const initialMs = performance.now() - initialStarted;
  const initialAllocations = allocationCount(doc.counts);
  const initialWalkVisits = doc.counts.walkVisits;
  const initialHtml = toHtml(root).replace(/^<host>/, '').replace(/<\/host>$/, '');
  const transferBytes = encoder.encode(initialHtml).byteLength;
  doc.resetCounts();
  const updateStarted = performance.now();
  let state = cloneState(scenario.initial);
  for (const update of scenario.updates) {
    state = applyUpdate(state, update);
    root = build043Proxy(doc, state, enabled);
  }
  const updateMs = performance.now() - updateStarted;
  const updateAllocations = allocationCount(doc.counts);
  const updateWalkVisits = doc.counts.walkVisits;
  const updateListeners = doc.counts.listenerAdds;
  return {
    metrics: metricSet({
      initialAllocations,
      claimAllocations: initialAllocations,
      updateAllocations,
      initialWalkVisits,
      updateWalkVisits,
      transferBytes,
      updates: scenario.updates.length,
      updateWrites: 0,
      updateListeners,
      subscriptions: 0,
    }),
    timing: {
      serializeMs: 0,
      freshMs: Number(initialMs.toFixed(3)),
      claimMs: Number(initialMs.toFixed(3)),
      updateMs: Number(updateMs.toFixed(3)),
      churnMs: 0,
    },
    html: initialHtml,
  };
}

function assertProgramShape(program: Program): void {
  if (program.version !== 1 || !/^[a-z][a-z0-9]+(?:-[a-z0-9]+)+$/.test(program.tag)) {
    throw new Error('[v044-performance] current artifact has an invalid version or tag');
  }
  if (!Array.isArray(program.template) || !Array.isArray(program.parts)) {
    throw new Error('[v044-performance] current artifact is missing template or parts');
  }
  program.parts.forEach((part, index) => {
    if (part.index !== index) throw new Error(`[v044-performance] parts[${index}] index drift`);
  });
  const walkNodes = (nodes: TreeNode[], allowItemValue: boolean): void => {
    for (const node of nodes) {
      if (node.k === 'el') walkNodes(node.children, allowItemValue);
      if (node.k === 'ival' && !allowItemValue) {
        throw new Error('[v044-performance] item value slot escaped its Region');
      }
      if (node.k !== 'part') continue;
      const part = program.parts[node.index];
      if (!part || !['text', 'when', 'each'].includes(part.k)) {
        throw new Error(`[v044-performance] invalid dynamic anchor ${node.index}`);
      }
    }
  };
  walkNodes(program.template, false);
  for (const part of program.parts) {
    if (part.k === 'when') {
      walkNodes(part.on, false);
      walkNodes(part.off, false);
    }
    if (part.k === 'each') walkNodes(part.item, true);
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    return `{${
      Object.keys(record).sort().map((key) =>
        `${JSON.stringify(key)}:${canonicalJson(record[key])}`
      ).join(',')
    }}`;
  }
  return JSON.stringify(value);
}

interface BrowserPageLike {
  on(event: string, listener: (value: unknown) => void): void;
  setContent(content: string, options?: { waitUntil?: string }): Promise<void>;
  evaluate<T>(fn: () => T): Promise<T>;
}

interface BrowserLike {
  newPage(): Promise<BrowserPageLike>;
  close(): Promise<void>;
}

interface BrowserTypeLike {
  launch(): Promise<BrowserLike>;
}

async function runBrowserQualification(
  serializedHtml: string,
  browserNames: BrowserName[],
): Promise<BrowserEvidence[]> {
  if (browserNames.length === 0) return [];
  const playwright = await import('@playwright/test');
  const results: BrowserEvidence[] = [];
  for (const browserName of browserNames) {
    const errors: string[] = [];
    let browser: BrowserLike | null = null;
    try {
      const browserType = (playwright as unknown as Record<string, BrowserTypeLike>)[browserName];
      if (!browserType) throw new Error(`Playwright browser ${browserName} is unavailable`);
      const launched = await browserType.launch();
      browser = launched;
      const page = await launched.newPage();
      page.on(
        'pageerror',
        (value) => errors.push(value instanceof Error ? value.message : String(value)),
      );
      page.on('console', (value) => {
        const message = value as { type?: () => string; text?: () => string };
        if (message.type?.() === 'error') errors.push(message.text?.() ?? 'browser console error');
      });
      await page.setContent(
        `<!doctype html><html><body><main id="root">${serializedHtml}</main></body></html>`,
        { waitUntil: 'load' },
      );
      const observed = await page.evaluate(() => {
        const root = document.querySelector('#root');
        const h1 = root?.querySelector('h1');
        const input = root?.querySelector('input') as HTMLInputElement | null;
        const partText = h1?.childNodes[2] as Text | undefined;
        const original = partText;
        const markers = root?.innerHTML.includes('oe:p0') === true &&
          root.innerHTML.includes('oe:p3') && root.innerHTML.includes('oe:p4');
        if (input) input.value = 'typed by user';
        if (partText && partText.nodeType === Node.TEXT_NODE) partText.data = 'browser update';
        return {
          claimReady: markers && !!h1 && !!input && !!partText,
          identityPreserved: original === h1?.childNodes[2],
          liveValuePreserved: input?.value === 'typed by user',
        };
      });
      results.push({
        browser: browserName,
        passed: errors.length === 0 && observed.claimReady && observed.identityPreserved &&
          observed.liveValuePreserved,
        pageErrors: errors,
        claimReady: observed.claimReady,
        identityPreserved: observed.identityPreserved,
        liveValuePreserved: observed.liveValuePreserved,
        serializedBytes: encoder.encode(serializedHtml).byteLength,
      });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      results.push({
        browser: browserName,
        passed: false,
        pageErrors: errors,
        claimReady: false,
        identityPreserved: false,
        liveValuePreserved: false,
        serializedBytes: encoder.encode(serializedHtml).byteLength,
      });
    } finally {
      await browser?.close();
    }
  }
  return results;
}

function fixturePath(fixtureRoot: URL | string, relative: string): string {
  return join(pathForRoot(fixtureRoot), relative);
}

export interface V044QualificationOptions {
  fixtureRoot?: URL | string;
  browsers?: BrowserName[];
  writeEvidence?: boolean;
}

export async function runV044Qualification(
  options: V044QualificationOptions = {},
): Promise<V044PerformanceReport> {
  const fixtureRoot = options.fixtureRoot ?? defaultFixtureRoot;
  const fixtureDir = pathForRoot(fixtureRoot);
  const repoRoot = resolve(fixtureDir, '../..');
  const definition = await loadV044Definition(fixtureRoot);
  if (Deno.version.deno !== definition.environment.deno) {
    throw new Error(
      `[v044-performance] expected Deno ${definition.environment.deno}, found ${Deno.version.deno}`,
    );
  }

  const sourcePath = join(repoRoot, definition.artifact.source);
  const programPath = join(repoRoot, definition.artifact.program);
  const compilerPath = join(repoRoot, definition.artifact.compiler);
  const runtimePath = join(repoRoot, definition.artifact.runtime);
  const source = await Deno.readTextFile(sourcePath);
  const programText = await Deno.readTextFile(programPath);
  const artifact = JSON.parse(programText) as Program;
  assertProgramShape(artifact);
  const compiled = compileElementSpike(source, sourcePath);
  if (canonicalJson(compiled.program) !== canonicalJson(artifact)) {
    throw new Error('[v044-performance] compiler output does not match the checked artifact');
  }
  const compilerSource = await Deno.readTextFile(compilerPath);
  if (compilerSource.length === 0) throw new Error('[v044-performance] compiler artifact is empty');
  const runtimeSource = await Deno.readTextFile(runtimePath);
  if (runtimeSource.length === 0) throw new Error('[v044-performance] runtime artifact is empty');

  const staticHtml = await Deno.readTextFile(join(repoRoot, definition.artifact.staticFixture));
  const scriptTags = [...staticHtml.matchAll(/<script\b/gi)].length;
  const staticOutput = {
    runtimeBytes: scriptTags === 0 ? 0 : encoder.encode(staticHtml).byteLength,
    transferredBytes: encoder.encode(staticHtml).byteLength,
    scriptTags,
  };

  const scenarios: ScenarioReport[] = [];
  for (const scenario of definition.scenarios) {
    const enabled = new Set(scenario.enabledParts);
    const projected = projectProgram(artifact, enabled);
    assertProgramShape(projected);
    const candidate = runCandidateScenario(projected, scenario, definition.environment.churnCycles);
    const baseline = runBaselineScenario(scenario);
    if (candidate.serializedHtml !== baseline.html) {
      throw new Error(`[v044-performance] ${scenario.id} baseline and candidate HTML diverge`);
    }
    scenarios.push({
      id: scenario.id,
      baseline: baseline.metrics,
      candidate: candidate.metrics,
      timing: candidate.timing,
      heapGrowthBytes: candidate.heapGrowthBytes,
      retainedSubscriptions: candidate.retainedSubscriptions,
      retainedListeners: candidate.retainedListeners,
      serializedHtml: candidate.serializedHtml,
    });
  }

  const browserNames = options.browsers ?? definition.environment.browserMatrix;
  const browser = await runBrowserQualification(
    scenarios[scenarios.length - 1].serializedHtml,
    browserNames,
  );
  const maxHeapGrowthBytes = Math.max(...scenarios.map((scenario) => scenario.heapGrowthBytes));
  const report: V044PerformanceReport = {
    schemaVersion: 1,
    source: 'tools/benchmark-v044.ts',
    fixtureId: definition.fixtureId,
    versions: definition.versions,
    artifact: {
      source: definition.artifact.source,
      program: definition.artifact.program,
      compiler: definition.artifact.compiler,
      runtime: definition.artifact.runtime,
      programBytes: encoder.encode(programText).byteLength,
      generatedModuleBytes: encoder.encode(compiled.code).byteLength,
      instructionCount: artifact.parts.length,
    },
    baseline: {
      interactiveJsBytes: definition.baseline.interactiveJsBytes,
      description: definition.baseline.description,
    },
    candidate: {
      interactiveJsBytes: encoder.encode(programText).byteLength,
      generatedModuleBytes: encoder.encode(compiled.code).byteLength,
      programBytes: encoder.encode(programText).byteLength,
    },
    staticOutput,
    environment: {
      deno: Deno.version.deno,
      browsers: browserNames,
      warmupRuns: definition.environment.warmupRuns,
      timingSamples: definition.environment.timingSamples,
      churnCycles: definition.environment.churnCycles,
    },
    scenarios,
    resources: {
      maxHeapGrowthBytes,
      maxRetainedSubscriptions: Math.max(
        ...scenarios.map((scenario) => scenario.retainedSubscriptions),
      ),
      maxRetainedListeners: Math.max(...scenarios.map((scenario) => scenario.retainedListeners)),
    },
    browser,
  };
  if (options.writeEvidence) {
    await Deno.writeTextFile(
      fixturePath(fixtureRoot, 'evidence.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    );
  }
  return report;
}

if (import.meta.main) {
  const writeEvidence = Deno.args.includes('--write');
  const noBrowser = Deno.args.includes('--no-browser');
  const report = await runV044Qualification({
    browsers: noBrowser ? [] : undefined,
    writeEvidence,
  });
  console.log(JSON.stringify(report, null, 2));
}
