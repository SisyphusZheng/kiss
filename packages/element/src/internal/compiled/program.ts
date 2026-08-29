/**
 * @openelement/element — compiled Part Program types (v0.44 internal alpha.2).
 *
 * The alpha.0 fixture established the transport shape used by this package:
 * one JSON-safe, versioned tree plus an indexed instruction table. Alpha.2
 * keeps that shape and completes the runtime vocabulary. The tree contains
 * compiler-owned dynamic anchors; the runtime never discovers locations by
 * scanning selectors, markers, or a second render tree.
 *
 * This file intentionally has no dependency on the adapter compiler. A
 * generated program is a self-contained exchange artifact and can be consumed
 * by server serialization, fresh DOM creation, and existing-DOM claim.
 */

export const PART_PROGRAM_SPIKE_VERSION = 1;
/** Canonical internal name used by alpha.2 callers. */
export const PART_PROGRAM_VERSION = PART_PROGRAM_SPIKE_VERSION;

/** Static element node. `attrs` preserves source order for determinism. */
export interface SpikeElementNode {
  k: 'el';
  tag: string;
  attrs: Array<[string, string]>;
  children: SpikeTreeNode[];
}

/** Static text node. */
export interface SpikeTextNode {
  k: 'text';
  value: string;
}

/** Dynamic anchor: semantics are owned by `program.parts[index]`. */
export interface SpikePartAnchorNode {
  k: 'part';
  index: number;
}

/** Item-value text slot, valid only inside an `each` item template. */
export interface SpikeItemValueNode {
  k: 'ival';
}

export type SpikeTreeNode =
  | SpikeElementNode
  | SpikeTextNode
  | SpikePartAnchorNode
  | SpikeItemValueNode;

export interface SpikeTextPart {
  k: 'text';
  index: number;
  signal: string;
}

/** Dynamic attribute sink. `null` removes the attribute at runtime. */
export interface SpikeAttributePart {
  k: 'attr';
  index: number;
  signal: string;
  name: string;
  path: number[];
}

/** DOM property sink. The alpha.0 spelling `prop` remains canonical. */
export interface SpikePropPart {
  k: 'prop';
  index: number;
  signal: string;
  name: string;
  path: number[];
}

/** Boolean attribute sink; truthy values mean attribute present. */
export interface SpikeBooleanPart {
  k: 'boolean';
  index: number;
  signal: string;
  name: string;
  path: number[];
}

/** Exact `class` attribute sink. Values may be strings, arrays, or maps. */
export interface SpikeClassPart {
  k: 'class';
  index: number;
  signal: string;
  path: number[];
}

/** Exact `style` attribute sink. Values may be CSS text or a declaration map. */
export interface SpikeStylePart {
  k: 'style';
  index: number;
  signal: string;
  path: number[];
}

export interface SpikeEventOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
}

/**
 * Event sink. A fixed `handler` names a host handler; a `signal` may instead
 * supply a replaceable event callback. The two forms are mutually exclusive.
 */
export interface SpikeEventPart {
  k: 'event';
  index: number;
  event: string;
  handler?: string;
  signal?: string;
  options?: SpikeEventOptions;
  path: number[];
}

/**
 * Ref sink. The callback is looked up in `host.refs` when `ref` is present,
 * or in `host.handlers` when `handler` is present. A signal may replace it.
 */
export interface SpikeRefPart {
  k: 'ref';
  index: number;
  ref?: string;
  handler?: string;
  signal?: string;
  path: number[];
}

/** Conditional Region with bounded branch ownership. */
export interface SpikeWhenPart {
  k: 'when';
  index: number;
  signal: string;
  gt: number;
  on: SpikeTreeNode[];
  off: SpikeTreeNode[];
}

/**
 * Dynamic child Region. Primitive values and arrays of primitive/DOM values
 * are supported; arbitrary VNodes are deliberately not part of this grammar.
 */
export interface SpikeChildPart {
  k: 'child';
  index: number;
  signal: string;
}

/**
 * Keyed or unkeyed list Region. `key` is omitted for index-reuse semantics.
 * `field` selects the value rendered by an `ival` slot; omitted means the item
 * itself is rendered.
 */
export interface SpikeEachPart {
  k: 'each';
  index: number;
  signal: string;
  key?: string;
  field?: string;
  keyed?: boolean;
  item: SpikeTreeNode[];
}

export type SpikeFixedPart =
  | SpikeAttributePart
  | SpikePropPart
  | SpikeBooleanPart
  | SpikeClassPart
  | SpikeStylePart
  | SpikeEventPart
  | SpikeRefPart;

export type SpikeRegionPart = SpikeWhenPart | SpikeChildPart | SpikeEachPart;

export type SpikePart = SpikeTextPart | SpikeFixedPart | SpikeRegionPart;

/** The one serializable program consumed by all three execution modes. */
export interface PartProgramSpike {
  version: typeof PART_PROGRAM_SPIKE_VERSION;
  tag: string;
  template: SpikeTreeNode[];
  parts: SpikePart[];
}

/** Canonical alpha.2 spelling; the wire representation is unchanged. */
export type PartProgram = PartProgramSpike;

/** Anchor marker payloads shared by serialization, creation and claim. */
export function partAnchorMarker(index: number): string {
  return `oe:p${index}`;
}

export function partAnchorEndMarker(index: number): string {
  return `oe:/p${index}`;
}

function fail(reason: string): never {
  throw new Error(`[compiled-program] invalid Part Program spike: ${reason}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  where: string,
): void {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) fail(`${where} contains unsupported key "${key}"`);
  }
}

function requireSignal(part: Record<string, unknown>, where: string): void {
  if (typeof part.signal !== 'string' || part.signal.length === 0) {
    fail(`${where}.signal must be a non-empty string`);
  }
}

function validatePath(path: unknown, where: string): asserts path is number[] {
  if (
    !Array.isArray(path) ||
    path.some((index) => !Number.isInteger(index) || (index as number) < 0)
  ) {
    fail(`${where}.path must be non-negative integer child indices`);
  }
}

function validateName(name: unknown, where: string): void {
  if (typeof name !== 'string' || !/^[A-Za-z][A-Za-z0-9_:.-]*$/.test(name)) {
    fail(`${where} must be a safe DOM name`);
  }
}

function validateEventOptions(options: unknown, where: string): void {
  if (options === undefined) return;
  if (!isRecord(options)) fail(`${where}.options must be an object`);
  assertKeys(options, ['capture', 'once', 'passive'], `${where}.options`);
  for (const key of Object.keys(options)) {
    if (typeof options[key] !== 'boolean') {
      fail(`${where}.options.${key} must be boolean`);
    }
  }
}

function validateCallbackSelector(part: Record<string, unknown>, where: string): void {
  const selectors = ['handler', 'signal'].filter((key) => part[key] !== undefined);
  if (
    selectors.length !== 1 || typeof part[selectors[0]] !== 'string' ||
    part[selectors[0]] === ''
  ) {
    fail(`${where} needs exactly one non-empty handler or signal selector`);
  }
}

function validateRefSelector(part: Record<string, unknown>, where: string): void {
  const selectors = ['ref', 'handler', 'signal'].filter((key) => part[key] !== undefined);
  if (
    selectors.length !== 1 || typeof part[selectors[0]] !== 'string' ||
    part[selectors[0]] === ''
  ) {
    fail(`${where} needs exactly one non-empty ref, handler, or signal selector`);
  }
}

function validateTreeNodes(
  nodes: unknown,
  where: string,
  allowAnchors: boolean,
  allowItemValue: boolean,
): asserts nodes is SpikeTreeNode[] {
  if (!Array.isArray(nodes)) fail(`${where} must be an array`);
  for (const node of nodes) {
    if (!isRecord(node)) fail(`${where} entries must be objects`);
    switch (node.k) {
      case 'el': {
        assertKeys(node, ['k', 'tag', 'attrs', 'children'], `${where}.el`);
        if (typeof node.tag !== 'string' || node.tag.length === 0) {
          fail(`${where}.el needs tag`);
        }
        if (!/^[a-z][a-z0-9-]*$/.test(node.tag)) {
          fail(`${where}.el(${node.tag}) has an unsupported tag name`);
        }
        if (!Array.isArray(node.attrs)) fail(`${where}.el(${node.tag}) attrs must be an array`);
        const attributeNames = new Set<string>();
        for (const attr of node.attrs) {
          if (
            !Array.isArray(attr) || attr.length !== 2 || typeof attr[0] !== 'string' ||
            typeof attr[1] !== 'string'
          ) {
            fail(`${where}.el(${node.tag}) attrs must be [name, value] pairs`);
          }
          validateName(attr[0], `${where}.el(${node.tag}) attribute name`);
          if (attributeNames.has(attr[0])) {
            fail(`${where}.el(${node.tag}) repeats attribute "${attr[0]}"`);
          }
          attributeNames.add(attr[0]);
        }
        validateTreeNodes(node.children, `${where}.${node.tag}`, allowAnchors, allowItemValue);
        break;
      }
      case 'text':
        assertKeys(node, ['k', 'value'], `${where}.text`);
        if (typeof node.value !== 'string') fail(`${where}.text needs a string value`);
        if (node.value.length === 0) {
          fail(`${where}.text may not be empty; omit an empty static text node`);
        }
        break;
      case 'part':
        assertKeys(node, ['k', 'index'], `${where}.part`);
        if (!allowAnchors) fail(`${where} may not contain part anchors`);
        if (!Number.isInteger(node.index) || (node.index as number) < 0) {
          fail(`${where}.part needs a non-negative integer index`);
        }
        break;
      case 'ival':
        assertKeys(node, ['k'], `${where}.ival`);
        if (!allowItemValue) fail(`${where} may not contain item value slots`);
        break;
      default:
        fail(`${where} has unknown node kind ${String(node.k)}`);
    }
  }
}

function isDynamicAnchorPart(part: SpikePart): boolean {
  return part.k === 'text' || part.k === 'when' || part.k === 'child' || part.k === 'each';
}

/**
 * Resolve a compiler path through the static tree. Dynamic siblings are not
 * safe predecessors for a path-addressed sink because they expand to a
 * variable number of DOM nodes; those paths are rejected below.
 */
function resolveTemplatePath(
  template: SpikeTreeNode[],
  path: number[],
  where: string,
): SpikeTreeNode {
  if (path.length === 0) {
    if (template.length !== 1 || template[0].k !== 'el') {
      fail(`${where} empty path requires exactly one root element`);
    }
    return template[0];
  }
  let nodes = template;
  let node: SpikeTreeNode | undefined;
  for (const index of path) {
    node = nodes[index];
    if (!node) fail(`${where} path [${path.join(',')}] does not resolve inside the template`);
    if (node.k !== 'el' && index !== path[path.length - 1]) {
      fail(`${where} path [${path.join(',')}] crosses a non-element node`);
    }
    nodes = node.k === 'el' ? node.children : [];
  }
  return node!;
}

function assertPathSafety(
  template: SpikeTreeNode[],
  path: number[],
  where: string,
): void {
  let nodes = template;
  for (const target of path) {
    for (let sibling = 0; sibling < target; sibling++) {
      const predecessor = nodes[sibling];
      if (predecessor?.k === 'part') {
        fail(
          `${where} path [${path.join(',')}] is preceded by a dynamic anchor; ` +
            'path-addressed Parts require a static DOM index',
        );
      }
    }
    const next = nodes[target];
    if (!next || next.k !== 'el') return;
    nodes = next.children;
  }
}

/**
 * Validate an unknown value as a Part Program. Throws on every unsupported or
 * unsafe shape and returns the value narrowed to the serializable grammar.
 */
export function validateSpikeProgram(raw: unknown): PartProgramSpike {
  if (!isRecord(raw)) fail('program must be an object');
  assertKeys(raw, ['version', 'tag', 'template', 'parts'], 'program');
  if (raw.version !== PART_PROGRAM_SPIKE_VERSION) fail('version must be 1');
  if (typeof raw.tag !== 'string' || !/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(raw.tag)) {
    fail('tag must be a custom-element tag name');
  }
  validateTreeNodes(raw.template, 'template', true, false);
  if (!Array.isArray(raw.parts)) fail('parts must be an array');
  const parts = raw.parts as SpikePart[];

  parts.forEach((part, position) => {
    if (!isRecord(part)) fail(`parts[${position}] must be an object`);
    if (part.index !== position) fail(`parts[${position}].index must equal its position`);
    switch (part.k) {
      case 'text':
        assertKeys(part, ['k', 'index', 'signal'], `parts[${position}]`);
        requireSignal(part, `parts[${position}]`);
        break;
      case 'attr':
        assertKeys(part, ['k', 'index', 'signal', 'name', 'path'], `parts[${position}]`);
        requireSignal(part, `parts[${position}]`);
        validateName(part.name, `parts[${position}].name`);
        validatePath(part.path, `parts[${position}]`);
        break;
      case 'prop':
        assertKeys(part, ['k', 'index', 'signal', 'name', 'path'], `parts[${position}]`);
        requireSignal(part, `parts[${position}]`);
        validateName(part.name, `parts[${position}].name`);
        validatePath(part.path, `parts[${position}]`);
        break;
      case 'boolean':
        assertKeys(part, ['k', 'index', 'signal', 'name', 'path'], `parts[${position}]`);
        requireSignal(part, `parts[${position}]`);
        validateName(part.name, `parts[${position}].name`);
        validatePath(part.path, `parts[${position}]`);
        break;
      case 'class':
      case 'style':
        assertKeys(part, ['k', 'index', 'signal', 'path'], `parts[${position}]`);
        requireSignal(part, `parts[${position}]`);
        validatePath(part.path, `parts[${position}]`);
        break;
      case 'event':
        assertKeys(
          part,
          ['k', 'index', 'event', 'handler', 'signal', 'options', 'path'],
          `parts[${position}]`,
        );
        if (typeof part.event !== 'string' || !/^[a-z][a-z0-9:.-]*$/.test(part.event)) {
          fail(`parts[${position}].event must be a safe event name`);
        }
        validateCallbackSelector(part, `parts[${position}] event`);
        validateEventOptions(part.options, `parts[${position}]`);
        validatePath(part.path, `parts[${position}]`);
        break;
      case 'ref':
        assertKeys(
          part,
          ['k', 'index', 'ref', 'handler', 'signal', 'path'],
          `parts[${position}]`,
        );
        if (part.ref !== undefined) validateName(part.ref, `parts[${position}].ref`);
        validateRefSelector(part, `parts[${position}] ref`);
        validatePath(part.path, `parts[${position}]`);
        break;
      case 'when':
        assertKeys(part, ['k', 'index', 'signal', 'gt', 'on', 'off'], `parts[${position}]`);
        requireSignal(part, `parts[${position}]`);
        if (typeof part.gt !== 'number' || !Number.isFinite(part.gt)) {
          fail(`parts[${position}].gt must be a finite number`);
        }
        validateTreeNodes(part.on, `parts[${position}].on`, true, false);
        validateTreeNodes(part.off, `parts[${position}].off`, true, false);
        break;
      case 'child':
        assertKeys(part, ['k', 'index', 'signal'], `parts[${position}]`);
        requireSignal(part, `parts[${position}]`);
        break;
      case 'each':
        assertKeys(
          part,
          ['k', 'index', 'signal', 'key', 'field', 'keyed', 'item'],
          `parts[${position}]`,
        );
        requireSignal(part, `parts[${position}]`);
        if (part.key !== undefined && (typeof part.key !== 'string' || part.key.length === 0)) {
          fail(`parts[${position}].key must be a non-empty string when present`);
        }
        if (
          part.field !== undefined && (typeof part.field !== 'string' || part.field.length === 0)
        ) {
          fail(`parts[${position}].field must be a non-empty string when present`);
        }
        if (part.keyed !== undefined && typeof part.keyed !== 'boolean') {
          fail(`parts[${position}].keyed must be boolean when present`);
        }
        if (part.keyed === true && part.key === undefined) {
          fail(`parts[${position}] keyed Regions require key`);
        }
        validateTreeNodes(part.item, `parts[${position}].item`, true, true);
        break;
      default:
        fail(`parts[${position}] has unknown part kind`);
    }
  });

  const template = raw.template as SpikeTreeNode[];
  const anchorCounts = new Map<number, number>();
  const visitingParts = new Set<number>();
  const walkAnchors = (nodes: SpikeTreeNode[], where: string): void => {
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      const nodeWhere = `${where}[${index}]`;
      if (node.k === 'el') walkAnchors(node.children, `${nodeWhere}.children`);
      if (node.k !== 'part') continue;
      const part = parts[node.index];
      if (!part) fail(`${nodeWhere}.part references missing part ${node.index}`);
      if (!isDynamicAnchorPart(part)) {
        fail(`${nodeWhere}.part must reference a text, child, when, or each part`);
      }
      anchorCounts.set(node.index, (anchorCounts.get(node.index) ?? 0) + 1);
      if (visitingParts.has(node.index)) {
        fail(`${nodeWhere}.part creates a recursive Region definition`);
      }
      visitingParts.add(node.index);
      if (part.k === 'when') {
        walkAnchors(part.on, `${nodeWhere}.part[${part.index}].on`);
        walkAnchors(part.off, `${nodeWhere}.part[${part.index}].off`);
      } else if (part.k === 'each') {
        walkAnchors(part.item, `${nodeWhere}.part[${part.index}].item`);
      }
      visitingParts.delete(node.index);
    }
  };
  walkAnchors(template, 'template');
  for (const part of parts) {
    if (isDynamicAnchorPart(part) && !anchorCounts.has(part.index)) {
      fail(`parts[${part.index}] dynamic Part is not placed at a tree anchor`);
    }
    if (isDynamicAnchorPart(part) && anchorCounts.get(part.index) !== 1) {
      fail(`parts[${part.index}] dynamic Part must have exactly one tree anchor`);
    }
  }

  for (const part of parts) {
    if (
      part.k === 'attr' || part.k === 'prop' || part.k === 'boolean' || part.k === 'class' ||
      part.k === 'style' || part.k === 'event' || part.k === 'ref'
    ) {
      const target = resolveTemplatePath(template, part.path, `parts[${part.index}]`);
      if (target.k !== 'el') fail(`parts[${part.index}] path must target an element`);
      assertPathSafety(template, part.path, `parts[${part.index}]`);
    }
  }

  return {
    version: PART_PROGRAM_SPIKE_VERSION,
    tag: raw.tag,
    template,
    parts,
  };
}

/** Canonical alpha.2 validator spelling. */
export const validatePartProgram = validateSpikeProgram;
