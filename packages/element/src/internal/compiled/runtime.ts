/**
 * @openelement/element — compiled Part Program spike runtime (#1160).
 *
 * Executes the alpha.0 spike Part Program in the three ADR-0143 modes:
 *   - serializeToHtml:    server serialization (pure string output)
 *   - createFreshDom:     fresh browser DOM creation
 *   - claimExistingDom:   attach to existing SSR DOM, preserving node identity
 *
 * Signal -> Part/Region is the only reactive path: a Signal write reaches
 * exactly its subscribed Part or Region. There is no VNode tree, no binding
 * discovery walk and no interpreter fallback here.
 *
 * Internal alpha.0 spike only — not exported from the package entry points.
 */

import type { SignalLike, Unsubscribe } from '../protocol/signal.ts';
import {
  partAnchorEndMarker,
  partAnchorMarker,
  type PartProgramSpike,
  type SpikeEachPart,
  type SpikeElementNode,
  type SpikePropPart,
  type SpikeTreeNode,
  type SpikeWhenPart,
} from './program.ts';

/** Structured diagnostic for claim-time structure/identity drift (#631-class). */
export class PartProgramClaimError extends Error {
  readonly code = 'OPEN_ELEMENT_COMPILED_CLAIM_MISMATCH';
  readonly path: string;
  constructor(path: string, message: string) {
    super(`[compiled-claim] ${path}: ${message}`);
    this.name = 'PartProgramClaimError';
    this.path = path;
  }
}

/** Host-provided reactive state and behavior, keyed by compiled names. */
export interface CompiledSpikeHost {
  signals: Record<string, SignalLike<unknown>>;
  handlers: Record<string, (event: unknown) => void>;
}

export interface CompiledSpikeInstance {
  dispose(): void;
}

interface MountContext {
  program: PartProgramSpike;
  host: CompiledSpikeHost;
  unsubs: Unsubscribe[];
  listeners: Array<{ el: Element; type: string; fn: EventListener }>;
  /** Prop parts keyed by `path.join('.')` for attribute/serialization lookup. */
  propPartsByPath: Map<string, SpikePropPart[]>;
}

function createContext(program: PartProgramSpike, host: CompiledSpikeHost): MountContext {
  const propPartsByPath = new Map<string, SpikePropPart[]>();
  for (const part of program.parts) {
    if (part.k !== 'prop') continue;
    const key = part.path.join('.');
    const list = propPartsByPath.get(key) ?? [];
    list.push(part);
    propPartsByPath.set(key, list);
  }
  return { program, host, unsubs: [], listeners: [], propPartsByPath };
}

function signalOf(ctx: MountContext, name: string): SignalLike<unknown> {
  const signal = ctx.host.signals[name];
  if (!signal) throw new Error(`[compiled-runtime] missing host signal "${name}"`);
  return signal;
}

/**
 * Subscribe to future writes only, engine-neutrally. Build and claim have
 * already applied the current value, so a subscription-time echo would double
 * write — and, for claim, would clobber live DOM state such as a user-edited
 * input value. The public Signal protocol does not require immediate delivery
 * (preact-engine delivers immediately via effect(); a conforming engine may be
 * lazy), so suppression is precise: only a callback delivered synchronously
 * before `subscribe()` returns, whose value equals the snapshot read
 * immediately before subscribing, is treated as the echo. Any callback
 * delivered after `subscribe()` returns is a real update and is applied —
 * including a first write from a lazy-delivery engine.
 */
function subscribeWrites(
  ctx: MountContext,
  name: string,
  fn: (value: unknown) => void,
): void {
  const signal = signalOf(ctx, name);
  const snapshot = signal.value;
  let subscribeReturned = false;
  const unsub = signal.subscribe((value) => {
    if (!subscribeReturned && Object.is(value, snapshot)) return; // sync initial echo
    fn(value);
  });
  subscribeReturned = true;
  ctx.unsubs.push(unsub);
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

// ─── Shared node construction ────────────────────────────────────────

function buildStaticNodes(doc: Document, nodes: SpikeTreeNode[], where: string): Node[] {
  const out: Node[] = [];
  for (const node of nodes) {
    if (node.k === 'text') {
      out.push(doc.createTextNode(node.value));
    } else if (node.k === 'el') {
      const el = doc.createElement(node.tag);
      for (const [name, value] of node.attrs) el.setAttribute(name, value);
      for (const child of buildStaticNodes(doc, node.children, where)) el.appendChild(child);
      out.push(el);
    } else {
      throw new Error(`[compiled-runtime] ${where} must be fully static (found "${node.k}")`);
    }
  }
  return out;
}

interface BuiltItem {
  nodes: Node[];
  texts: Text[];
}

function buildItem(doc: Document, part: SpikeEachPart, item: Record<string, unknown>): BuiltItem {
  const texts: Text[] = [];
  const buildItemNodes = (nodes: SpikeTreeNode[]): Node[] => {
    const out: Node[] = [];
    for (const node of nodes) {
      if (node.k === 'ival') {
        const text = doc.createTextNode(String(item[part.field]));
        texts.push(text);
        out.push(text);
      } else if (node.k === 'text') {
        out.push(doc.createTextNode(node.value));
      } else if (node.k === 'el') {
        const el = doc.createElement(node.tag);
        for (const [name, value] of node.attrs) el.setAttribute(name, value);
        for (const child of buildItemNodes(node.children)) el.appendChild(child);
        out.push(el);
      } else {
        throw new Error('[compiled-runtime] item templates may not contain part anchors');
      }
    }
    return out;
  };
  return { nodes: buildItemNodes(part.item), texts };
}

// ─── Regions ─────────────────────────────────────────────────────────

interface WhenRegion {
  part: SpikeWhenPart;
  anchor: Comment;
  end: Comment;
  current: boolean;
}

interface EachEntry extends BuiltItem {
  key: string;
}

interface EachRegion {
  part: SpikeEachPart;
  anchor: Comment;
  end: Comment;
  byKey: Map<string, EachEntry>;
}

function whenActive(part: SpikeWhenPart, value: unknown): boolean {
  return Number(value) > part.gt;
}

function updateWhen(region: WhenRegion, value: unknown): void {
  const next = whenActive(region.part, value);
  if (next === region.current) return;
  const parent = region.end.parentNode;
  if (!parent) return;
  let node = region.anchor.nextSibling;
  while (node && node !== region.end) {
    const after = node.nextSibling;
    parent.removeChild(node);
    node = after;
  }
  const branch = next ? region.part.on : region.part.off;
  for (const built of buildStaticNodes(region.end.ownerDocument, branch, 'when branch')) {
    parent.insertBefore(built, region.end);
  }
  region.current = next;
}

function updateEach(region: EachRegion, value: unknown): void {
  if (!Array.isArray(value)) {
    throw new Error(`[compiled-runtime] each part ${region.part.index} expects an array signal`);
  }
  const items = value as Array<Record<string, unknown>>;
  const parent = region.end.parentNode;
  if (!parent) return;
  const seen = new Set<string>();
  // `current` walks the live DOM inside the Region; the end anchor bounds it.
  let current: Node = region.anchor.nextSibling ?? region.end;
  for (const item of items) {
    const key = String(item[region.part.key]);
    seen.add(key);
    let entry = region.byKey.get(key);
    if (!entry) {
      const built = buildItem(region.end.ownerDocument, region.part, item);
      entry = { key, nodes: built.nodes, texts: built.texts };
      region.byKey.set(key, entry);
    } else {
      const nextText = String(item[region.part.field]);
      if (entry.texts.length > 0 && entry.texts[0].data !== nextText) {
        entry.texts[0].data = nextText;
      }
    }
    for (const node of entry.nodes) {
      if (node === current) {
        current = current.nextSibling ?? region.end;
        continue;
      }
      parent.insertBefore(node, current);
    }
  }
  for (const [key, entry] of region.byKey) {
    if (seen.has(key)) continue;
    for (const node of entry.nodes) node.parentNode?.removeChild(node);
    region.byKey.delete(key);
  }
}

// ─── Fresh DOM creation ──────────────────────────────────────────────

function buildNodes(ctx: MountContext, doc: Document, nodes: SpikeTreeNode[]): Node[] {
  const out: Node[] = [];
  for (const node of nodes) {
    if (node.k === 'text') {
      out.push(doc.createTextNode(node.value));
      continue;
    }
    if (node.k === 'el') {
      const el = doc.createElement(node.tag);
      for (const [name, value] of node.attrs) el.setAttribute(name, value);
      for (const child of buildNodes(ctx, doc, node.children)) el.appendChild(child);
      out.push(el);
      continue;
    }
    if (node.k !== 'part') {
      throw new Error('[compiled-runtime] item value slot outside an each Region');
    }
    const part = ctx.program.parts[node.index];
    if (part.k === 'text') {
      const text = doc.createTextNode(String(signalOf(ctx, part.signal).value));
      subscribeWrites(ctx, part.signal, (value) => {
        text.data = String(value);
      });
      out.push(doc.createComment(partAnchorMarker(part.index)), text);
      continue;
    }
    if (part.k === 'when') {
      const anchor = doc.createComment(partAnchorMarker(part.index));
      const end = doc.createComment(partAnchorEndMarker(part.index));
      const active = whenActive(part, signalOf(ctx, part.signal).value);
      const region: WhenRegion = { part, anchor, end, current: active };
      subscribeWrites(ctx, part.signal, (value) => updateWhen(region, value));
      out.push(anchor, ...buildStaticNodes(doc, active ? part.on : part.off, 'when branch'), end);
      continue;
    }
    if (part.k === 'each') {
      const anchor = doc.createComment(partAnchorMarker(part.index));
      const end = doc.createComment(partAnchorEndMarker(part.index));
      const region: EachRegion = { part, anchor, end, byKey: new Map() };
      const items = signalOf(ctx, part.signal).value as Array<Record<string, unknown>>;
      const itemNodes: Node[] = [];
      for (const item of items) {
        const built = buildItem(doc, part, item);
        region.byKey.set(String(item[part.key]), { key: String(item[part.key]), ...built });
        itemNodes.push(...built.nodes);
      }
      subscribeWrites(ctx, part.signal, (value) => updateEach(region, value));
      out.push(anchor, ...itemNodes, end);
      continue;
    }
    throw new Error(`[compiled-runtime] part ${node.index} has no anchor representation`);
  }
  return out;
}

function resolvePath(root: Node, path: number[], where: string): Element {
  let node: Node = root;
  for (const index of path) {
    const child: ChildNode | undefined = node.childNodes[index];
    if (!child) throw new Error(`[compiled-runtime] ${where}: path [${path.join(',')}] unresolved`);
    node = child;
  }
  if (!isElement(node)) {
    throw new Error(`[compiled-runtime] ${where}: path [${path.join(',')}] is not an element`);
  }
  return node;
}

/**
 * Structural view of an Element carrying writable DOM properties. A compiled
 * property Part owns the named property on its target element by construction,
 * so this single-step structural assertion is honest: no double cast, no
 * `unknown` laundering, and the sink stays generic for any Element.
 */
interface SpikePropertySink extends Element {
  [property: string]: unknown;
}

function propertySink(el: Element): SpikePropertySink {
  return el as SpikePropertySink;
}

/** Attach path-addressed prop/event parts. */
function attachPathParts(ctx: MountContext, root: Node, mode: 'fresh' | 'claim'): void {
  for (const part of ctx.program.parts) {
    if (part.k === 'prop') {
      const el = resolvePath(root, part.path, 'prop part');
      const sink = propertySink(el);
      if (mode === 'fresh') {
        const initial = signalOf(ctx, part.signal).value;
        el.setAttribute(part.name, String(initial));
        sink[part.name] = initial;
      }
      // claim deliberately does not write the initial value: live DOM state
      // (e.g. a user-edited input value) survives a successful claim.
      subscribeWrites(ctx, part.signal, (value) => {
        sink[part.name] = value;
      });
      continue;
    }
    if (part.k === 'event') {
      const el = resolvePath(root, part.path, 'event part');
      const handler = ctx.host.handlers[part.handler];
      if (!handler) {
        throw new Error(`[compiled-runtime] missing host handler "${part.handler}"`);
      }
      const fn: EventListener = (event) => handler(event);
      el.addEventListener(part.event, fn);
      ctx.listeners.push({ el, type: part.event, fn });
    }
  }
}

function instance(ctx: MountContext): CompiledSpikeInstance {
  let disposed = false;
  return {
    dispose(): void {
      if (disposed) return;
      disposed = true;
      for (const unsub of ctx.unsubs.splice(0)) unsub();
      for (const { el, type, fn } of ctx.listeners.splice(0)) el.removeEventListener(type, fn);
    },
  };
}

/** Fresh browser DOM creation: build the program under `root`. */
export function createFreshDom(
  program: PartProgramSpike,
  host: CompiledSpikeHost,
  root: Node,
): CompiledSpikeInstance {
  const ctx = createContext(program, host);
  const doc = root.ownerDocument;
  if (!doc) throw new Error('[compiled-runtime] root must have an ownerDocument');
  for (const node of buildNodes(ctx, doc, program.template)) root.appendChild(node);
  attachPathParts(ctx, root, 'fresh');
  return instance(ctx);
}

// ─── Server serialization ────────────────────────────────────────────

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

function serializeElement(
  ctx: MountContext,
  node: SpikeElementNode,
  programPath: number[],
): string {
  const attrs = node.attrs.map(([name, value]) => ` ${name}="${escapeAttr(value)}"`);
  for (const part of ctx.propPartsByPath.get(programPath.join('.')) ?? []) {
    attrs.push(` ${part.name}="${escapeAttr(String(signalOf(ctx, part.signal).value))}"`);
  }
  const open = `<${node.tag}${attrs.join('')}`;
  if (VOID_TAGS.has(node.tag)) return `${open}>`;
  const children = node.children
    .map((child, index) => serializeNode(ctx, child, [...programPath, index]))
    .join('');
  return `${open}>${children}</${node.tag}>`;
}

function serializeItemNodes(
  nodes: SpikeTreeNode[],
  part: SpikeEachPart,
  item: Record<string, unknown>,
): string {
  return nodes
    .map((node) => {
      if (node.k === 'ival') return escapeText(String(item[part.field]));
      if (node.k === 'text') return escapeText(node.value);
      if (node.k === 'el') {
        const attrs = node.attrs.map(([name, value]) => ` ${name}="${escapeAttr(value)}"`).join('');
        const inner = serializeItemNodes(node.children, part, item);
        return VOID_TAGS.has(node.tag)
          ? `<${node.tag}${attrs}>`
          : `<${node.tag}${attrs}>${inner}</${node.tag}>`;
      }
      throw new Error('[compiled-runtime] item templates may not contain part anchors');
    })
    .join('');
}

function serializeNode(ctx: MountContext, node: SpikeTreeNode, programPath: number[]): string {
  switch (node.k) {
    case 'text':
      return escapeText(node.value);
    case 'el':
      return serializeElement(ctx, node, programPath);
    case 'part': {
      const part = ctx.program.parts[node.index];
      const open = `<!--${partAnchorMarker(part.index)}-->`;
      if (part.k === 'text') {
        return open + escapeText(String(signalOf(ctx, part.signal).value));
      }
      const close = `<!--${partAnchorEndMarker(part.index)}-->`;
      if (part.k === 'when') {
        const active = whenActive(part, signalOf(ctx, part.signal).value);
        const branch = (active ? part.on : part.off)
          .map((branchNode, index) => serializeNode(ctx, branchNode, [...programPath, index]))
          .join('');
        return open + branch + close;
      }
      if (part.k === 'each') {
        const items = signalOf(ctx, part.signal).value as Array<Record<string, unknown>>;
        return open + items.map((item) => serializeItemNodes(part.item, part, item)).join('') +
          close;
      }
      throw new Error(`[compiled-runtime] part ${part.index} has no serialized anchor`);
    }
    case 'ival':
      throw new Error('[compiled-runtime] item value slot outside an each Region');
  }
}

/** Server serialization: the same program rendered to deterministic HTML. */
export function serializeToHtml(program: PartProgramSpike, host: CompiledSpikeHost): string {
  const ctx = createContext(program, host);
  return program.template.map((node, index) => serializeNode(ctx, node, [index])).join('');
}

// ─── Existing-DOM claim ──────────────────────────────────────────────

function claimFailure(path: string, message: string): never {
  throw new PartProgramClaimError(path, message);
}

function expectComment(node: Node, marker: string, path: string): Comment {
  if (!isComment(node) || node.data !== marker) {
    claimFailure(path, `expected <!--${marker}--> anchor`);
  }
  return node;
}

function claimItemNodes(
  part: SpikeEachPart,
  nodes: SpikeTreeNode[],
  parent: Node,
  cursor: number,
  item: Record<string, unknown>,
  path: string,
): { consumed: number; entryNodes: Node[]; texts: Text[] } {
  const entryNodes: Node[] = [];
  const texts: Text[] = [];
  let used = 0;
  for (const node of nodes) {
    const dom = parent.childNodes[cursor + used];
    if (!dom) claimFailure(path, 'missing item node');
    if (node.k === 'ival') {
      if (!isText(dom)) claimFailure(path, 'expected item value text');
      const expected = String(item[part.field]);
      if (dom.data !== expected) {
        claimFailure(path, `item text drift: expected ${JSON.stringify(expected)}`);
      }
      texts.push(dom);
      entryNodes.push(dom);
      used++;
      continue;
    }
    if (node.k === 'text') {
      if (!isText(dom) || dom.data !== node.value) claimFailure(path, 'item text drift');
      entryNodes.push(dom);
      used++;
      continue;
    }
    if (node.k === 'el') {
      if (!isElement(dom) || dom.tagName.toLowerCase() !== node.tag) {
        claimFailure(path, `expected item element <${node.tag}>`);
      }
      for (const [name, value] of node.attrs) {
        if ((dom as Element).getAttribute(name) !== value) {
          claimFailure(path, `item attribute "${name}" drift`);
        }
      }
      texts.push(...claimItemChildren(part, node, dom, item, path));
      entryNodes.push(dom);
      used++;
      continue;
    }
    claimFailure(path, 'item templates may not contain part anchors');
  }
  return { consumed: used, entryNodes, texts };
}

function claimItemChildren(
  part: SpikeEachPart,
  node: SpikeElementNode,
  el: Node,
  item: Record<string, unknown>,
  path: string,
): Text[] {
  const texts: Text[] = [];
  if (el.childNodes.length !== node.children.length) {
    claimFailure(path, 'item element child count drift');
  }
  node.children.forEach((child, index) => {
    const dom = el.childNodes[index];
    if (child.k === 'ival') {
      if (!isText(dom)) claimFailure(path, 'expected item value text');
      const expected = String(item[part.field]);
      if (dom.data !== expected) {
        claimFailure(path, `item text drift: expected ${JSON.stringify(expected)}`);
      }
      texts.push(dom);
      return;
    }
    if (child.k === 'text') {
      if (!isText(dom) || dom.data !== child.value) claimFailure(path, 'item text drift');
      return;
    }
    if (child.k === 'el') {
      if (!isElement(dom) || dom.tagName.toLowerCase() !== child.tag) {
        claimFailure(path, `expected item element <${child.tag}>`);
      }
      texts.push(...claimItemChildren(part, child, dom, item, path));
      return;
    }
    claimFailure(path, 'item templates may not contain part anchors');
  });
  return texts;
}

/**
 * Claim `nodes` against `parent`'s existing children starting at `cursor`.
 * Returns the cursor after the consumed children. `programPath` tracks
 * template child indices so prop-driven attributes can skip verification.
 */
function claimChildren(
  ctx: MountContext,
  parent: Node,
  cursor: number,
  nodes: SpikeTreeNode[],
  path: string,
  programPath: number[],
): number {
  const kids = parent.childNodes;
  const at = (index: number): Node => {
    const node = kids[index];
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

    if (node.k === 'el') {
      const dom = at(cursor++);
      if (!isElement(dom)) claimFailure(nodePath, 'expected an element');
      if (dom.tagName.toLowerCase() !== node.tag) {
        claimFailure(nodePath, `expected <${node.tag}>, found <${dom.tagName.toLowerCase()}>`);
      }
      const propDriven = new Set(
        (ctx.propPartsByPath.get(nodeProgramPath.join('.')) ?? []).map((part) => part.name),
      );
      for (const [name, value] of node.attrs) {
        if (propDriven.has(name)) continue; // live property state wins over SSR drift
        if (dom.getAttribute(name) !== value) {
          claimFailure(nodePath, `attribute drift on "${name}": expected ${JSON.stringify(value)}`);
        }
      }
      const consumed = claimChildren(
        ctx,
        dom,
        0,
        node.children,
        `${nodePath}.children`,
        nodeProgramPath,
      );
      if (consumed !== dom.childNodes.length) {
        claimFailure(`${nodePath}.children`, 'unexpected trailing nodes');
      }
      continue;
    }

    if (node.k === 'part') {
      const part = ctx.program.parts[node.index];
      if (part.k === 'text') {
        expectComment(at(cursor++), partAnchorMarker(part.index), nodePath);
        const text = at(cursor++);
        if (!isText(text)) claimFailure(nodePath, 'expected a text node after the part anchor');
        const expected = String(signalOf(ctx, part.signal).value);
        if (text.data !== expected) {
          claimFailure(
            nodePath,
            `part text drift: expected ${JSON.stringify(expected)}, found ${
              JSON.stringify(text.data)
            }`,
          );
        }
        subscribeWrites(ctx, part.signal, (value) => {
          text.data = String(value);
        });
        continue;
      }
      if (part.k === 'when') {
        const anchor = expectComment(at(cursor++), partAnchorMarker(part.index), nodePath);
        const active = whenActive(part, signalOf(ctx, part.signal).value);
        const branch = active ? part.on : part.off;
        cursor = claimChildren(ctx, parent, cursor, branch, `${nodePath}.branch`, []);
        const end = expectComment(at(cursor++), partAnchorEndMarker(part.index), nodePath);
        const region: WhenRegion = { part, anchor, end, current: active };
        subscribeWrites(ctx, part.signal, (value) => updateWhen(region, value));
        continue;
      }
      if (part.k === 'each') {
        const anchor = expectComment(at(cursor++), partAnchorMarker(part.index), nodePath);
        const region: EachRegion = { part, anchor, end: anchor, byKey: new Map() };
        const items = signalOf(ctx, part.signal).value as Array<Record<string, unknown>>;
        for (const item of items) {
          const claimed = claimItemNodes(part, part.item, parent, cursor, item, `${nodePath}.item`);
          cursor += claimed.consumed;
          region.byKey.set(String(item[part.key]), {
            key: String(item[part.key]),
            nodes: claimed.entryNodes,
            texts: claimed.texts,
          });
        }
        region.end = expectComment(at(cursor++), partAnchorEndMarker(part.index), nodePath);
        subscribeWrites(ctx, part.signal, (value) => updateEach(region, value));
        continue;
      }
      claimFailure(nodePath, `part ${node.index} has no claimable anchor`);
    }

    claimFailure(nodePath, 'item value slot outside an each Region');
  }

  return cursor;
}

/**
 * Claim existing SSR DOM: verify exact structure and attach Parts, Regions,
 * events and subscriptions without recreating nodes. Structural drift fails
 * with a PartProgramClaimError carrying the template path; bounded recovery of
 * the owning element range is owned by #1169 and is intentionally absent here.
 */
export function claimExistingDom(
  program: PartProgramSpike,
  host: CompiledSpikeHost,
  root: Node,
): CompiledSpikeInstance {
  const ctx = createContext(program, host);
  const consumed = claimChildren(ctx, root, 0, program.template, 'template', []);
  if (consumed !== root.childNodes.length) {
    claimFailure('template', 'unexpected trailing nodes');
  }
  attachPathParts(ctx, root, 'claim');
  return instance(ctx);
}
