/**
 * @openelement/element — compiled Part Program spike types (v0.44.0-alpha.0, #1160).
 *
 * Internal alpha.0 spike grammar for the ADR-0143 replacement architecture.
 * One Part Program is the sole structural/mutation authority for server
 * serialization, fresh browser DOM creation and existing-DOM claim. This is
 * NOT the frozen Part Program v1 schema — #1161 owns the frozen grammar and
 * #1162 owns the canonical decorator lowering.
 *
 * The adapter-vite spike compiler
 * (packages/adapter-vite/src/internal/compiler/) emits exactly this shape as
 * serializable JSON; the two copies intentionally share no import because the
 * generated program must never depend on a private cross-package path.
 */

export const PART_PROGRAM_SPIKE_VERSION = 1;

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

/** Dynamic text bound one-to-one to a Signal. */
export interface SpikeTextPart {
  k: 'text';
  index: number;
  signal: string;
}

/** DOM property sink bound to a Signal; `path` addresses the target element. */
export interface SpikePropPart {
  k: 'prop';
  index: number;
  signal: string;
  name: string;
  path: number[];
}

/** Event sink on a path-addressed element; `handler` names a host handler. */
export interface SpikeEventPart {
  k: 'event';
  index: number;
  event: string;
  handler: string;
  path: number[];
}

/**
 * Conditional Region. The spike grammar supports exactly
 * `signal > <numeric literal>`; `gt` is the serialized threshold. Branches are
 * fully static structure.
 */
export interface SpikeWhenPart {
  k: 'when';
  index: number;
  signal: string;
  gt: number;
  on: SpikeTreeNode[];
  off: SpikeTreeNode[];
}

/**
 * Keyed list Region. `signal` holds an array of records; `key` selects the
 * identity field and `field` the rendered text field of each item.
 */
export interface SpikeEachPart {
  k: 'each';
  index: number;
  signal: string;
  key: string;
  field: string;
  item: SpikeTreeNode[];
}

export type SpikePart =
  | SpikeTextPart
  | SpikePropPart
  | SpikeEventPart
  | SpikeWhenPart
  | SpikeEachPart;

/** The one serializable program consumed by all three execution modes. */
export interface PartProgramSpike {
  version: typeof PART_PROGRAM_SPIKE_VERSION;
  tag: string;
  template: SpikeTreeNode[];
  parts: SpikePart[];
}

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
      case 'el':
        if (typeof node.tag !== 'string' || node.tag.length === 0) fail(`${where}.el needs tag`);
        if (!Array.isArray(node.attrs)) fail(`${where}.el(${node.tag}) attrs must be an array`);
        for (const attr of node.attrs) {
          if (
            !Array.isArray(attr) || attr.length !== 2 || typeof attr[0] !== 'string' ||
            typeof attr[1] !== 'string'
          ) {
            fail(`${where}.el(${node.tag}) attrs must be [name, value] pairs`);
          }
        }
        validateTreeNodes(node.children, `${where}.${node.tag}`, allowAnchors, allowItemValue);
        break;
      case 'text':
        if (typeof node.value !== 'string') fail(`${where}.text needs a string value`);
        break;
      case 'part':
        if (!allowAnchors) fail(`${where} may not contain part anchors`);
        if (!Number.isInteger(node.index)) fail(`${where}.part needs an integer index`);
        break;
      case 'ival':
        if (!allowItemValue) fail(`${where} may not contain item value slots`);
        break;
      default:
        fail(`${where} has unknown node kind ${String(node.k)}`);
    }
  }
}

/**
 * Validate an unknown value as a spike Part Program. Throws on any structural
 * violation; returns the value narrowed to PartProgramSpike on success.
 */
export function validateSpikeProgram(raw: unknown): PartProgramSpike {
  if (!isRecord(raw)) fail('program must be an object');
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
        if (typeof part.signal !== 'string') fail(`parts[${position}].signal must be a string`);
        break;
      case 'prop':
        if (typeof part.signal !== 'string' || typeof part.name !== 'string') {
          fail(`parts[${position}] prop needs signal and name`);
        }
        if (!Array.isArray(part.path) || part.path.some((i) => !Number.isInteger(i))) {
          fail(`parts[${position}].path must be integer child indices`);
        }
        break;
      case 'event':
        if (typeof part.event !== 'string' || typeof part.handler !== 'string') {
          fail(`parts[${position}] event needs event and handler`);
        }
        if (!Array.isArray(part.path) || part.path.some((i) => !Number.isInteger(i))) {
          fail(`parts[${position}].path must be integer child indices`);
        }
        break;
      case 'when':
        if (typeof part.signal !== 'string' || typeof part.gt !== 'number') {
          fail(`parts[${position}] when needs signal and numeric gt`);
        }
        validateTreeNodes(part.on, `parts[${position}].on`, false, false);
        validateTreeNodes(part.off, `parts[${position}].off`, false, false);
        break;
      case 'each':
        if (
          typeof part.signal !== 'string' || typeof part.key !== 'string' ||
          typeof part.field !== 'string'
        ) {
          fail(`parts[${position}] each needs signal, key and field`);
        }
        validateTreeNodes(part.item, `parts[${position}].item`, false, true);
        break;
      default:
        fail(`parts[${position}] has unknown part kind`);
    }
  });

  // Anchor nodes must reference anchor-bearing parts; path parts must resolve
  // to static elements inside the template.
  const resolveTemplate = (path: number[]): SpikeTreeNode => {
    let nodes = raw.template as SpikeTreeNode[];
    let node: SpikeTreeNode | undefined;
    for (const index of path) {
      node = nodes[index];
      if (!node) fail(`path [${path.join(',')}] does not resolve inside the template`);
      nodes = node.k === 'el' ? node.children : [];
    }
    return node!;
  };
  const walkAnchors = (nodes: SpikeTreeNode[]): void => {
    for (const node of nodes) {
      if (node.k === 'el') walkAnchors(node.children);
      if (node.k !== 'part') continue;
      const part = parts[node.index];
      if (!part || (part.k !== 'text' && part.k !== 'when' && part.k !== 'each')) {
        fail(`anchor ${node.index} must reference a text/when/each part`);
      }
    }
  };
  walkAnchors(raw.template as SpikeTreeNode[]);
  for (const part of parts) {
    if ((part.k === 'prop' || part.k === 'event') && resolveTemplate(part.path).k !== 'el') {
      fail(`${part.k} part ${part.index} path must target an element`);
    }
  }

  return raw as unknown as PartProgramSpike;
}
