/**
 * @openelement/adapter-vite — serializable Part Program v1.
 *
 * This is the compiler-side copy of the exchange artifact. It intentionally
 * has no import edge to the element runtime: the generated JSON is the seam
 * shared by server serialization, fresh DOM creation and existing-DOM claim.
 * Every dynamic location receives a compiler-owned identity. Runtime code does
 * not discover bindings by walking a VNode or a generic DOM tree.
 */

export const PART_PROGRAM_VERSION = 1 as const;

/** Kept as a source-level name for the alpha.0 fixture while the schema is v1. */
export const PART_PROGRAM_SPIKE_VERSION = PART_PROGRAM_VERSION;

export type RootMode = 'light' | 'shadow-open' | 'shadow-closed';

export interface ProgramRoot {
  id: 'root';
  kind: RootMode;
  nodes: string[];
}

export type SerializableValue =
  | null
  | boolean
  | number
  | string
  | SerializableValue[]
  | { [key: string]: SerializableValue };

export interface ProgramPosition {
  offset: number;
  line: number;
  column: number;
}

export interface ProgramSourceRange {
  file: string;
  start: ProgramPosition;
  end: ProgramPosition;
}

export type ProgramSourceKind =
  | 'root'
  | 'element'
  | 'part'
  | 'region'
  | 'property'
  | 'handler';

export interface ProgramSourceRecord {
  id: string;
  kind: ProgramSourceKind;
  source: ProgramSourceRange;
}

export interface ProgramSourceMap {
  version: 1;
  file: string;
  records: ProgramSourceRecord[];
}

/** Exact compiler-owned location for one dynamic sink or range anchor. */
export interface ProgramLocation {
  id: string;
  kind: 'anchor' | 'sink';
  path: number[];
  node?: string;
}

/** A location record also makes the identity auditable without inspecting parts. */
export type ProgramLocationRecord =
  | { id: string; kind: 'element'; tag: string; path: number[] }
  | { id: string; kind: 'anchor'; part: number; path: number[] }
  | { id: string; kind: 'sink'; part: number; node: string; path: number[] };

export interface SpikeElementNode {
  k: 'el';
  id: string;
  tag: string;
  attrs: Array<[string, string]>;
  children: SpikeTreeNode[];
}

export interface SpikeTextNode {
  k: 'text';
  value: string;
}

export interface SpikePartAnchorNode {
  k: 'part';
  id: string;
  index: number;
}

/** Item-value text slot; valid only inside an `each` item template. */
export interface SpikeItemValueNode {
  k: 'ival';
  field: string;
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
  location: ProgramLocation;
}

/** DOM property sink bound to a Signal; `path` is retained for seed consumers. */
export interface SpikePropPart {
  k: 'prop';
  index: number;
  signal: string;
  name: string;
  path: number[];
  location: ProgramLocation;
}

/** String attribute sink bound to a Signal. */
export interface SpikeAttrPart {
  k: 'attr';
  index: number;
  signal: string;
  name: string;
  path: number[];
  location: ProgramLocation;
}

/** Boolean attribute sink bound to a Signal. */
export interface SpikeBoolPart {
  k: 'bool';
  index: number;
  signal: string;
  name: string;
  path: number[];
  location: ProgramLocation;
}

/** Specialized fixed sinks make ownership explicit for class and style text. */
export interface SpikeClassPart {
  k: 'class';
  index: number;
  signal: string;
  path: number[];
  location: ProgramLocation;
}

export interface SpikeStylePart {
  k: 'style';
  index: number;
  signal: string;
  path: number[];
  location: ProgramLocation;
}

/** A named ref slot is serializable; the generated class supplies the ref value. */
export interface SpikeRefPart {
  k: 'ref';
  index: number;
  ref: string;
  path: number[];
  location: ProgramLocation;
}

export type SpikeEventAction =
  | { kind: 'method'; name: string }
  | { kind: 'call'; name: string }
  | { kind: 'increment' | 'decrement'; signal: string }
  | { kind: 'assign'; signal: string; value: SerializableValue }
  | { kind: 'add' | 'subtract'; signal: string; value: number };

export interface SpikeEventPart {
  k: 'event';
  index: number;
  event: string;
  handler: string;
  action: SpikeEventAction;
  path: number[];
  location: ProgramLocation;
}

export type ConditionOperator =
  | 'truthy'
  | 'falsy'
  | 'equal'
  | 'not-equal'
  | 'greater-than'
  | 'greater-than-or-equal'
  | 'less-than'
  | 'less-than-or-equal';

export interface SpikeCondition {
  signal: string;
  op: ConditionOperator;
  value?: SerializableValue;
}

export interface SpikeWhenPart {
  k: 'when';
  index: number;
  signal: string;
  /** Seed-runtime field for the common `this.signal > number` form. */
  gt?: number;
  test: SpikeCondition;
  on: SpikeTreeNode[];
  off: SpikeTreeNode[];
  location: ProgramLocation;
}

export interface SpikeEachPart {
  k: 'each';
  index: number;
  signal: string;
  key: string;
  field: string;
  item: SpikeTreeNode[];
  location: ProgramLocation;
}

export type SpikePart =
  | SpikeTextPart
  | SpikePropPart
  | SpikeAttrPart
  | SpikeBoolPart
  | SpikeClassPart
  | SpikeStylePart
  | SpikeRefPart
  | SpikeEventPart
  | SpikeWhenPart
  | SpikeEachPart;

export interface ProgramRegionRecord {
  id: string;
  index: number;
  kind: 'when' | 'each';
  anchor: string;
  end: string;
  source: string;
}

export interface ProgramDependencyRecord {
  signal: string;
  owner: { kind: 'part' | 'region'; index: number };
  location: string;
}

export type PropertyValueType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface CompiledPropertyMetadata {
  name: string;
  attribute: string | null;
  type: PropertyValueType;
  converter: PropertyValueType;
  reflect: boolean;
  default: SerializableValue;
}

export interface CemPropertyMetadata {
  name: string;
  fieldName: string;
  type: PropertyValueType;
  attribute: string | null;
  reflect: boolean;
}

export interface CompiledCemMetadata {
  tagName: string;
  className: string;
  declaration: { name: string; module: string };
  attributes: Array<{ name: string; fieldName: string; type: PropertyValueType; reflect: boolean }>;
  members: CemPropertyMetadata[];
}

export interface CompiledElementMetadata {
  tag: string;
  className: string;
  sourceFile: string;
  properties: CompiledPropertyMetadata[];
  observedAttributes: string[];
  cem: CompiledCemMetadata;
}

/** The one deterministic program consumed by all execution modes. */
export interface PartProgramSpike {
  version: typeof PART_PROGRAM_VERSION;
  tag: string;
  root: ProgramRoot;
  template: SpikeTreeNode[];
  parts: SpikePart[];
  regions: ProgramRegionRecord[];
  dependencies: ProgramDependencyRecord[];
  locations: ProgramLocationRecord[];
  sourceMap: ProgramSourceMap;
  metadata: CompiledElementMetadata;
}

export type PartProgram = PartProgramSpike;

/** Anchor marker payloads shared by seed runtime consumers. */
export function partAnchorMarker(index: number): string {
  return `oe:p${index}`;
}

export function partAnchorEndMarker(index: number): string {
  return `oe:/p${index}`;
}

function fail(reason: string): never {
  throw new Error(`[compiled-program] invalid Part Program v1: ${reason}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIntegerArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => Number.isInteger(entry) && entry >= 0);
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function isAttributeName(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z_:][A-Za-z0-9_.:-]*$/.test(value);
}

function samePath(left: unknown, right: number[]): boolean {
  return isIntegerArray(left) && JSON.stringify(left) === JSON.stringify(right);
}

function isSerializable(value: unknown, seen = new Set<unknown>()): value is SerializableValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.every((entry) => isSerializable(entry, seen));
  return Object.entries(value).every(([key, entry]) =>
    key.length > 0 && isSerializable(entry, seen)
  );
}

function validatePosition(value: unknown, where: string): void {
  if (!isRecord(value)) fail(`${where} must be a position object`);
  const offset = value.offset;
  const line = value.line;
  const column = value.column;
  if (typeof offset !== 'number' || !Number.isInteger(offset) || offset < 0) {
    fail(`${where}.offset must be non-negative`);
  }
  if (typeof line !== 'number' || !Number.isInteger(line) || line < 1) {
    fail(`${where}.line must be positive`);
  }
  if (typeof column !== 'number' || !Number.isInteger(column) || column < 1) {
    fail(`${where}.column must be positive`);
  }
}

function validateSourceRange(value: unknown, where: string): void {
  if (!isRecord(value) || typeof value.file !== 'string' || value.file.length === 0) {
    fail(`${where} must contain a source file`);
  }
  validatePosition(value.start, `${where}.start`);
  validatePosition(value.end, `${where}.end`);
  const start = value.start as Record<string, unknown>;
  const end = value.end as Record<string, unknown>;
  if ((end.offset as number) < (start.offset as number)) fail(`${where} end precedes start`);
}

function validateTreeNodes(
  nodes: unknown,
  where: string,
  allowAnchors: boolean,
  allowItemValues: boolean,
  elementIds: Set<string>,
  anchorIds: Map<number, string>,
): asserts nodes is SpikeTreeNode[] {
  if (!Array.isArray(nodes)) fail(`${where} must be an array`);
  for (const [position, rawNode] of nodes.entries()) {
    if (!isRecord(rawNode)) fail(`${where}[${position}] must be an object`);
    switch (rawNode.k) {
      case 'el': {
        if (typeof rawNode.id !== 'string' || !/^e\d+$/.test(rawNode.id)) {
          fail(`${where}[${position}] element needs a stable eN id`);
        }
        if (elementIds.has(rawNode.id)) {
          fail(`${where}[${position}] duplicates element ${rawNode.id}`);
        }
        elementIds.add(rawNode.id);
        if (typeof rawNode.tag !== 'string' || !/^[a-z][a-z0-9]*$/.test(rawNode.tag)) {
          fail(`${where}[${position}].tag must be a lowercase intrinsic tag`);
        }
        if (!Array.isArray(rawNode.attrs)) fail(`${where}[${position}].attrs must be an array`);
        for (const [attrPosition, attr] of rawNode.attrs.entries()) {
          if (
            !Array.isArray(attr) || attr.length !== 2 || typeof attr[0] !== 'string' ||
            typeof attr[1] !== 'string'
          ) {
            fail(`${where}[${position}].attrs[${attrPosition}] must be a [name, value] pair`);
          }
        }
        validateTreeNodes(
          rawNode.children,
          `${where}[${position}].children`,
          allowAnchors,
          allowItemValues,
          elementIds,
          anchorIds,
        );
        break;
      }
      case 'text':
        if (typeof rawNode.value !== 'string') fail(`${where}[${position}].value must be a string`);
        break;
      case 'part': {
        if (!allowAnchors) fail(`${where}[${position}] may not contain a part anchor`);
        const index = rawNode.index;
        if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
          fail(`${where}[${position}].index must be a non-negative integer`);
        }
        if (rawNode.id !== `p${index}`) {
          fail(`${where}[${position}] id must match its part index`);
        }
        if (anchorIds.has(index)) fail(`${where} duplicates part ${index}`);
        anchorIds.set(index, rawNode.id);
        break;
      }
      case 'ival':
        if (!allowItemValues) fail(`${where}[${position}] may not contain an item value slot`);
        if (!isIdentifier(rawNode.field)) fail(`${where}[${position}].field must be an identifier`);
        break;
      default:
        fail(`${where}[${position}] has unknown node kind ${String(rawNode.k)}`);
    }
  }
}

function validateLocation(value: unknown, where: string): asserts value is ProgramLocation {
  if (!isRecord(value)) fail(`${where} must be a location object`);
  if (typeof value.id !== 'string' || !/^p\d+$/.test(value.id)) fail(`${where}.id is invalid`);
  if (value.kind !== 'anchor' && value.kind !== 'sink') fail(`${where}.kind is invalid`);
  if (!isIntegerArray(value.path)) fail(`${where}.path must be non-negative child indices`);
  if (value.kind === 'sink' && (typeof value.node !== 'string' || !/^e\d+$/.test(value.node))) {
    fail(`${where}.node must name a stable element id`);
  }
}

function validateCondition(value: unknown, where: string): asserts value is SpikeCondition {
  if (!isRecord(value) || !isIdentifier(value.signal)) fail(`${where} needs a signal`);
  const operators = new Set<ConditionOperator>([
    'truthy',
    'falsy',
    'equal',
    'not-equal',
    'greater-than',
    'greater-than-or-equal',
    'less-than',
    'less-than-or-equal',
  ]);
  if (typeof value.op !== 'string' || !operators.has(value.op as ConditionOperator)) {
    fail(`${where}.op is unsupported`);
  }
  if ('value' in value && !isSerializable(value.value)) fail(`${where}.value must be serializable`);
}

function validatePartPath(
  template: SpikeTreeNode[],
  path: unknown,
  where: string,
  elementIds: Set<string>,
): string {
  if (!isIntegerArray(path) || path.length === 0) fail(`${where}.path must target an element`);
  let nodes = template;
  let node: SpikeTreeNode | undefined;
  for (const index of path) {
    node = nodes[index];
    if (!node) fail(`${where}.path [${path.join(',')}] is unresolved`);
    nodes = node.k === 'el' ? node.children : [];
  }
  if (!node || node.k !== 'el') fail(`${where}.path must target an element`);
  if (!elementIds.has(node.id)) fail(`${where}.path targets an unknown element`);
  return node.id;
}

function validateAnchorPath(
  template: SpikeTreeNode[],
  path: unknown,
  partIndex: number,
  where: string,
): void {
  if (!isIntegerArray(path) || path.length === 0) {
    fail(`${where}.path must target a template anchor`);
  }
  let nodes = template;
  let node: SpikeTreeNode | undefined;
  for (const [position, index] of path.entries()) {
    node = nodes[index];
    if (!node) fail(`${where}.path [${path.join(',')}] is unresolved`);
    if (position < path.length - 1) {
      if (node.k !== 'el') fail(`${where}.path must target a template anchor`);
      nodes = node.children;
    }
  }
  if (!node || node.k !== 'part' || node.index !== partIndex || node.id !== `p${partIndex}`) {
    fail(`${where}.path must target anchor p${partIndex}`);
  }
}

function hasSignal(
  part: SpikePart,
): part is
  | SpikeTextPart
  | SpikePropPart
  | SpikeAttrPart
  | SpikeBoolPart
  | SpikeClassPart
  | SpikeStylePart
  | SpikeWhenPart
  | SpikeEachPart {
  return part.k === 'text' || part.k === 'prop' || part.k === 'attr' || part.k === 'bool' ||
    part.k === 'class' || part.k === 'style' || part.k === 'when' || part.k === 'each';
}

function isRegion(part: SpikePart): part is SpikeWhenPart | SpikeEachPart {
  return part.k === 'when' || part.k === 'each';
}

function validateEventAction(value: unknown, where: string): void {
  if (!isRecord(value) || typeof value.kind !== 'string') fail(`${where} must be an event action`);
  if (value.kind === 'method' || value.kind === 'call') {
    if (!isIdentifier(value.name)) fail(`${where}.name must be an identifier`);
    return;
  }
  if (value.kind === 'increment' || value.kind === 'decrement') {
    if (!isIdentifier(value.signal)) fail(`${where}.signal must be an identifier`);
    return;
  }
  if (value.kind === 'assign') {
    if (!isIdentifier(value.signal) || !isSerializable(value.value)) {
      fail(`${where} assign action needs a signal and serializable value`);
    }
    return;
  }
  if (value.kind === 'add' || value.kind === 'subtract') {
    if (
      !isIdentifier(value.signal) || typeof value.value !== 'number' ||
      !Number.isFinite(value.value)
    ) {
      fail(`${where} arithmetic action is invalid`);
    }
    return;
  }
  fail(`${where} has unknown action kind ${value.kind}`);
}

/**
 * Validate an unknown value as a Part Program v1. The validator is intentionally
 * strict: unknown instruction kinds, missing ownership records and unsafe paths
 * fail before a runtime can guess at their meaning.
 */
export function validatePartProgram(raw: unknown): asserts raw is PartProgram {
  if (!isRecord(raw)) fail('program must be an object');
  if (raw.version !== PART_PROGRAM_VERSION) fail('version must be 1');
  if (typeof raw.tag !== 'string' || !/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(raw.tag)) {
    fail('tag must be a custom-element tag name');
  }
  if (!isRecord(raw.root) || raw.root.id !== 'root') fail('root must be a root record');
  if (
    raw.root.kind !== 'light' && raw.root.kind !== 'shadow-open' &&
    raw.root.kind !== 'shadow-closed'
  ) {
    fail('root.kind is unsupported');
  }
  if (!Array.isArray(raw.root.nodes) || raw.root.nodes.some((id) => typeof id !== 'string')) {
    fail('root.nodes must list element ids');
  }

  const elementIds = new Set<string>();
  const anchorIds = new Map<number, string>();
  validateTreeNodes(raw.template, 'template', true, false, elementIds, anchorIds);
  const topLevelElements = (raw.template as SpikeTreeNode[])
    .filter((node): node is SpikeElementNode => node.k === 'el')
    .map((node) => node.id);
  if (JSON.stringify(raw.root.nodes) !== JSON.stringify(topLevelElements)) {
    fail('root.nodes must match top-level template elements in order');
  }

  if (!Array.isArray(raw.parts)) fail('parts must be an array');
  const parts = raw.parts as SpikePart[];
  const anchorPartCounts = new Map<number, number>();
  parts.forEach((part, position) => {
    if (!isRecord(part)) fail(`parts[${position}] must be an object`);
    if (part.index !== position) fail(`parts[${position}].index must equal its position`);
    validateLocation(part.location, `parts[${position}].location`);
    if (part.location.id !== `p${position}`) fail(`parts[${position}].location id is out of order`);
    switch (part.k) {
      case 'text':
        if (!isIdentifier(part.signal)) fail(`parts[${position}].signal must be an identifier`);
        if (part.location.kind !== 'anchor') fail(`parts[${position}] text must own an anchor`);
        validateAnchorPath(
          raw.template as SpikeTreeNode[],
          part.location.path,
          position,
          `parts[${position}]`,
        );
        anchorPartCounts.set(position, (anchorPartCounts.get(position) ?? 0) + 1);
        break;
      case 'prop':
      case 'attr':
      case 'bool':
        if (!isIdentifier(part.signal) || typeof part.name !== 'string' || part.name.length === 0) {
          fail(`parts[${position}] ${part.k} needs signal and name`);
        }
        if (part.location.kind !== 'sink') fail(`parts[${position}] ${part.k} must own a sink`);
        if (
          validatePartPath(
            raw.template as SpikeTreeNode[],
            part.path,
            `parts[${position}]`,
            elementIds,
          ) !==
            part.location.node
        ) {
          fail(`parts[${position}] location node does not match path`);
        }
        if (!samePath(part.location.path, part.path)) {
          fail(`parts[${position}] location path does not match path`);
        }
        break;
      case 'class':
      case 'style':
        if (!isIdentifier(part.signal) || part.location.kind !== 'sink') {
          fail(`parts[${position}] ${part.k} is invalid`);
        }
        if (
          validatePartPath(
            raw.template as SpikeTreeNode[],
            part.path,
            `parts[${position}]`,
            elementIds,
          ) !==
            part.location.node
        ) {
          fail(`parts[${position}] location node does not match path`);
        }
        if (!samePath(part.location.path, part.path)) {
          fail(`parts[${position}] location path does not match path`);
        }
        break;
      case 'ref':
        if (!isIdentifier(part.ref) || part.location.kind !== 'sink') {
          fail(`parts[${position}] ref is invalid`);
        }
        if (
          validatePartPath(
            raw.template as SpikeTreeNode[],
            part.path,
            `parts[${position}]`,
            elementIds,
          ) !==
            part.location.node
        ) {
          fail(`parts[${position}] location node does not match path`);
        }
        if (!samePath(part.location.path, part.path)) {
          fail(`parts[${position}] location path does not match path`);
        }
        break;
      case 'event':
        if (
          !isIdentifier(part.handler) || typeof part.event !== 'string' || part.event.length === 0
        ) {
          fail(`parts[${position}] event needs event and handler`);
        }
        validateEventAction(part.action, `parts[${position}].action`);
        if (part.location.kind !== 'sink') fail(`parts[${position}] event must own a sink`);
        if (
          validatePartPath(
            raw.template as SpikeTreeNode[],
            part.path,
            `parts[${position}]`,
            elementIds,
          ) !==
            part.location.node
        ) {
          fail(`parts[${position}] event location node does not match path`);
        }
        if (!samePath(part.location.path, part.path)) {
          fail(`parts[${position}] location path does not match path`);
        }
        break;
      case 'when':
        if (!isIdentifier(part.signal) || (part.gt !== undefined && !Number.isFinite(part.gt))) {
          fail(`parts[${position}] when needs a signal and finite threshold`);
        }
        if (part.location.kind !== 'anchor') fail(`parts[${position}] when must own an anchor`);
        validateCondition(part.test, `parts[${position}].test`);
        if (part.test.signal !== part.signal) fail(`parts[${position}] test signal mismatch`);
        validateTreeNodes(part.on, `parts[${position}].on`, false, false, elementIds, new Map());
        validateTreeNodes(part.off, `parts[${position}].off`, false, false, elementIds, new Map());
        validateAnchorPath(
          raw.template as SpikeTreeNode[],
          part.location.path,
          position,
          `parts[${position}]`,
        );
        anchorPartCounts.set(position, (anchorPartCounts.get(position) ?? 0) + 1);
        break;
      case 'each':
        if (!isIdentifier(part.signal) || !isIdentifier(part.key) || !isIdentifier(part.field)) {
          fail(`parts[${position}] each needs signal, key and field identifiers`);
        }
        if (part.location.kind !== 'anchor') fail(`parts[${position}] each must own an anchor`);
        validateTreeNodes(part.item, `parts[${position}].item`, false, true, elementIds, new Map());
        validateAnchorPath(
          raw.template as SpikeTreeNode[],
          part.location.path,
          position,
          `parts[${position}]`,
        );
        anchorPartCounts.set(position, (anchorPartCounts.get(position) ?? 0) + 1);
        break;
      default:
        fail(`parts[${position}] has unknown part kind ${String((part as { k?: unknown }).k)}`);
    }
  });

  for (const [index, id] of anchorIds) {
    const part = parts[index];
    if (!part || (!isRegion(part) && part.k !== 'text')) {
      fail(`anchor ${id} must reference a text or Region part`);
    }
    if ((anchorPartCounts.get(index) ?? 0) !== 1) {
      fail(`part ${index} must have exactly one anchor`);
    }
  }
  for (const part of parts) {
    if (isRegion(part) || part.k === 'text') {
      if (!anchorIds.has(part.index)) fail(`part ${part.index} is missing its template anchor`);
    } else if (anchorIds.has(part.index)) {
      fail(`fixed part ${part.index} may not have a template anchor`);
    }
  }

  if (!Array.isArray(raw.regions)) fail('regions must be an array');
  const regions = raw.regions as ProgramRegionRecord[];
  const regionParts = parts.filter(isRegion);
  if (regions.length !== regionParts.length) {
    fail('regions must describe every Region part exactly once');
  }
  regions.forEach((region, position) => {
    if (
      !isRecord(region) || region.id !== `r${region.index}` ||
      region.index !== regionParts[position].index ||
      (region.kind !== 'when' && region.kind !== 'each') || region.anchor !== `p${region.index}` ||
      region.end !== `p${region.index}:end` || typeof region.source !== 'string'
    ) {
      fail(`regions[${position}] has an invalid Region record`);
    }
    if (region.kind !== regionParts[position].k) {
      fail(`regions[${position}] kind mismatches its part`);
    }
  });

  if (!Array.isArray(raw.dependencies)) fail('dependencies must be an array');
  const dependencies = raw.dependencies as ProgramDependencyRecord[];
  const dependencyOwners = new Set<string>();
  const expectedDependencyOwners = new Set(
    parts.filter(hasSignal).map((part) => `${isRegion(part) ? 'region' : 'part'}:${part.index}`),
  );
  for (const [position, dependency] of dependencies.entries()) {
    if (!isRecord(dependency) || !isIdentifier(dependency.signal) || !isRecord(dependency.owner)) {
      fail(`dependencies[${position}] is invalid`);
    }
    if (dependency.owner.kind !== 'part' && dependency.owner.kind !== 'region') {
      fail(`dependencies[${position}].owner.kind is invalid`);
    }
    if (!Number.isInteger(dependency.owner.index) || dependency.owner.index < 0) {
      fail(`dependencies[${position}].owner.index is invalid`);
    }
    const owner = parts[dependency.owner.index];
    if (
      !owner || !hasSignal(owner) || (isRegion(owner) ? 'region' : 'part') !== dependency.owner.kind
    ) {
      fail(`dependencies[${position}] points at a non-signal owner`);
    }
    if (owner.signal !== dependency.signal || dependency.location !== owner.location.id) {
      fail(`dependencies[${position}] does not match its owning instruction`);
    }
    const ownerKey = `${dependency.owner.kind}:${dependency.owner.index}`;
    if (dependencyOwners.has(ownerKey)) fail(`dependencies duplicate ${ownerKey}`);
    dependencyOwners.add(ownerKey);
  }
  if (dependencyOwners.size !== expectedDependencyOwners.size) {
    fail('every signal-owning instruction needs one dependency record');
  }
  for (const owner of expectedDependencyOwners) {
    if (!dependencyOwners.has(owner)) fail(`missing dependency ${owner}`);
  }

  if (!Array.isArray(raw.locations)) fail('locations must be an array');
  const locations = raw.locations as ProgramLocationRecord[];
  const locationIds = new Set<string>();
  const locationById = new Map<string, ProgramLocationRecord>();
  for (const [position, location] of locations.entries()) {
    if (!isRecord(location) || typeof location.id !== 'string' || locationIds.has(location.id)) {
      fail(`locations[${position}] must have a unique id`);
    }
    locationIds.add(location.id);
    locationById.set(location.id, location);
    if (!isIntegerArray(location.path)) fail(`locations[${position}].path is invalid`);
    if (location.kind === 'element') {
      if (
        !elementIds.has(location.id) || typeof location.tag !== 'string' ||
        !/^[a-z][a-z0-9]*$/.test(location.tag)
      ) fail(`locations[${position}] element is invalid`);
    } else if (location.kind === 'anchor') {
      const part = Number.isInteger(location.part) ? parts[location.part] : undefined;
      if (
        !part || !isRegion(part) && part.k !== 'text' || location.id !== `p${location.part}` ||
        !samePath(location.path, part.location.path)
      ) {
        fail(`locations[${position}] anchor is invalid`);
      }
    } else if (location.kind === 'sink') {
      const part = Number.isInteger(location.part) ? parts[location.part] : undefined;
      if (
        !part || isRegion(part) || part.k === 'text' || location.id !== `p${location.part}` ||
        !elementIds.has(location.node) || !samePath(location.path, part.location.path) ||
        part.location.node !== location.node
      ) {
        fail(`locations[${position}] sink is invalid`);
      }
    } else {
      fail(`locations[${position}] has an unknown kind`);
    }
  }
  for (const elementId of elementIds) {
    if (!locationIds.has(elementId)) fail(`missing location for ${elementId}`);
  }
  for (const part of parts) {
    if (!locationIds.has(part.location.id)) fail(`missing location for ${part.location.id}`);
    const location = locationById.get(part.location.id);
    if (!location || location.kind !== part.location.kind) {
      fail(`location ${part.location.id} does not match its instruction`);
    }
  }

  if (!isRecord(raw.metadata)) fail('metadata must be an object');
  const metadata = raw.metadata;
  if (
    !isRecord(raw.sourceMap) || raw.sourceMap.version !== 1 ||
    raw.sourceMap.file !== metadata.sourceFile
  ) {
    fail('sourceMap must be version 1 and identify the metadata source file');
  }
  if (!Array.isArray(raw.sourceMap.records)) fail('sourceMap.records must be an array');
  const sourceIds = new Set<string>();
  for (const [position, record] of raw.sourceMap.records.entries()) {
    if (!isRecord(record) || typeof record.id !== 'string' || sourceIds.has(record.id)) {
      fail(`sourceMap.records[${position}] must have a unique id`);
    }
    sourceIds.add(record.id);
    const kinds = new Set<ProgramSourceKind>([
      'root',
      'element',
      'part',
      'region',
      'property',
      'handler',
    ]);
    if (typeof record.kind !== 'string' || !kinds.has(record.kind as ProgramSourceKind)) {
      fail(`sourceMap.records[${position}].kind is invalid`);
    }
    validateSourceRange(record.source, `sourceMap.records[${position}].source`);
  }

  if (
    metadata.tag !== raw.tag || typeof metadata.className !== 'string' ||
    typeof metadata.sourceFile !== 'string'
  ) {
    fail('metadata identity does not match the program');
  }
  if (!Array.isArray(metadata.properties) || !Array.isArray(metadata.observedAttributes)) {
    fail('metadata properties and observedAttributes must be arrays');
  }
  const propertyTypes = new Set<PropertyValueType>([
    'string',
    'number',
    'boolean',
    'array',
    'object',
  ]);
  const metadataNames = new Set<string>();
  const metadataProperties: Array<{
    name: string;
    attribute: string | null;
    type: PropertyValueType;
    reflect: boolean;
  }> = [];
  for (const [position, property] of metadata.properties.entries()) {
    const name = isIdentifier(property && isRecord(property) ? property.name : undefined)
      ? property.name
      : '';
    const attribute = property && isRecord(property) && property.attribute !== undefined
      ? property.attribute
      : undefined;
    const type = property && isRecord(property) ? property.type : undefined;
    const converter = property && isRecord(property) ? property.converter : undefined;
    const reflect = property && isRecord(property) ? property.reflect : undefined;
    const defaultValue = property && isRecord(property) ? property.default : undefined;
    if (
      !isRecord(property) || !isIdentifier(name) || metadataNames.has(name) ||
      (attribute !== null && !isAttributeName(attribute)) ||
      (attribute === undefined) || typeof type !== 'string' ||
      !propertyTypes.has(type as PropertyValueType) ||
      typeof converter !== 'string' || !propertyTypes.has(converter as PropertyValueType) ||
      typeof reflect !== 'boolean' || !isSerializable(defaultValue)
    ) {
      fail(`metadata.properties[${position}] is invalid`);
    }
    metadataNames.add(name);
    metadataProperties.push({
      name,
      attribute: attribute as string | null,
      type: type as PropertyValueType,
      reflect,
    });
  }
  const observed = new Set<string>();
  for (const [position, attribute] of metadata.observedAttributes.entries()) {
    if (!isAttributeName(attribute) || attribute.length === 0 || observed.has(attribute)) {
      fail(`metadata.observedAttributes[${position}] is invalid`);
    }
    observed.add(attribute);
  }
  const expectedObserved = metadataProperties.flatMap((property) =>
    property.attribute === null ? [] : [property.attribute]
  );
  if (JSON.stringify(expectedObserved) !== JSON.stringify(metadata.observedAttributes)) {
    fail('metadata.observedAttributes must match property attributes in declaration order');
  }
  const cem = metadata.cem;
  if (
    !isRecord(cem) || cem.tagName !== raw.tag || cem.className !== metadata.className ||
    !isRecord(cem.declaration) || cem.declaration.name !== metadata.className ||
    typeof cem.declaration.module !== 'string' || !Array.isArray(cem.attributes) ||
    !Array.isArray(cem.members)
  ) {
    fail('metadata.cem identity or shape is invalid');
  }
  const cemAttributes = cem.attributes;
  const expectedCemAttributes = metadataProperties.filter((property) =>
    property.attribute !== null
  );
  if (cemAttributes.length !== expectedCemAttributes.length) {
    fail('metadata.cem attributes are incomplete');
  }
  for (const [position, attribute] of cemAttributes.entries()) {
    if (
      !isRecord(attribute) || !isAttributeName(attribute.name) ||
      !isIdentifier(attribute.fieldName) ||
      typeof attribute.type !== 'string' ||
      !propertyTypes.has(attribute.type as PropertyValueType) ||
      typeof attribute.reflect !== 'boolean'
    ) {
      fail(`metadata.cem.attributes[${position}] is invalid`);
    }
    const expected = expectedCemAttributes[position];
    if (
      attribute.name !== expected.attribute || attribute.fieldName !== expected.name ||
      attribute.type !== expected.type || attribute.reflect !== expected.reflect
    ) {
      fail(`metadata.cem.attributes[${position}] does not match property metadata`);
    }
  }
  if (cem.members.length !== metadataProperties.length) fail('metadata.cem members are incomplete');
  for (const [position, member] of cem.members.entries()) {
    if (
      !isRecord(member) || !isIdentifier(member.name) || !isIdentifier(member.fieldName) ||
      typeof member.type !== 'string' || !propertyTypes.has(member.type as PropertyValueType) ||
      (member.attribute !== null && !isAttributeName(member.attribute)) ||
      typeof member.reflect !== 'boolean'
    ) {
      fail(`metadata.cem.members[${position}] is invalid`);
    }
    const expected = metadataProperties[position];
    if (
      member.name !== expected.name || member.fieldName !== expected.name ||
      member.type !== expected.type ||
      member.attribute !== expected.attribute || member.reflect !== expected.reflect
    ) {
      fail(`metadata.cem.members[${position}] does not match property metadata`);
    }
  }

  const expectedSourceIds = new Set<string>([
    'root',
    ...metadataProperties.map((property) => `property:${property.name}`),
    ...locations.map((location) => location.id),
    ...regions.map((region) => region.id),
  ]);
  for (const sourceId of expectedSourceIds) {
    if (!sourceIds.has(sourceId)) fail(`sourceMap is missing record ${sourceId}`);
  }
}

/** Compatibility source name for alpha.0 tests; validation remains strict v1. */
export function validateSpikeProgram(raw: unknown): PartProgramSpike {
  validatePartProgram(raw);
  return raw;
}
