/**
 * @openelement/element — compiled Part Program v1 (v0.44 internal alpha.8).
 *
 * This is the element-side copy of the canonical exchange artifact defined by
 * the alpha.1 compiler: one deterministic, JSON-safe, versioned program with
 * compiler-owned identities for every element, Part and Region. It intentionally
 * has no import edge to the adapter compiler; the generated JSON is the seam
 * shared by server serialization, fresh DOM creation and existing-DOM claim.
 *
 * On top of the compiler-emitted vocabulary this schema also validates the
 * runtime-owned instructions the alpha.2 runtime executes but the spike
 * compiler does not emit yet: `child` Regions, signal-driven event/ref
 * callbacks, event listener options, unkeyed `each` Regions and dynamic anchors
 * nested inside Region subtrees. Every rule the compiler's validator enforces
 * is enforced identically here; the extensions follow the same fail-closed
 * discipline. Unknown kinds, version drift, unsafe paths and inherited or
 * `__proto__`-carried fields all throw before a runtime can guess at meaning.
 */

export const PART_PROGRAM_VERSION = 1 as const;

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
  /**
   * Per-item attribute slots ([name, itemField]) — valid only inside an
   * `each` item template. At mount/claim time the value resolves from the
   * current item: `true` emits a bare attribute, `false`/`null`/`undefined`
   * omit it, anything else serializes with String().
   */
  iattrs?: Array<[string, string]>;
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
  id: string;
  index: number;
}

/**
 * Item-value text slot; valid only inside an `each` item template. `field`
 * names the item field rendered by this slot. The compiler always emits it
 * (multi-field item templates carry one slot per field); runtime-owned
 * programs may omit it and render the Region's `field` (or the item itself
 * for field-less unkeyed Regions).
 */
export interface SpikeItemValueNode {
  k: 'ival';
  field?: string;
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

/** DOM property sink bound to a Signal. */
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

/** Boolean attribute sink bound to a Signal; truthy values mean present. */
export interface SpikeBoolPart {
  k: 'bool';
  index: number;
  signal: string;
  name: string;
  path: number[];
  location: ProgramLocation;
}

/** Exact `class` attribute sink. Values may be strings, arrays, or maps. */
export interface SpikeClassPart {
  k: 'class';
  index: number;
  signal: string;
  path: number[];
  location: ProgramLocation;
}

/** Exact `style` attribute sink. Values may be CSS text or a declaration map. */
export interface SpikeStylePart {
  k: 'style';
  index: number;
  signal: string;
  path: number[];
  location: ProgramLocation;
}

/**
 * Trusted-HTML content sink (ADR-0143 alpha.8). The signal value must be a
 * string of pre-sanitized, build-time-trusted HTML; it replaces the target
 * element's content. The target's subtree is opaque to the claim path (the
 * program declares no structure inside it). The compiler emits this only for
 * an explicit `innerHTML={this.<field>}` sink on an otherwise childless
 * element — there is no implicit or discovery path to raw HTML.
 */
export interface SpikeHtmlPart {
  k: 'html';
  index: number;
  signal: string;
  path: number[];
  location: ProgramLocation;
}

/**
 * Ref sink. The callback is looked up in `host.refs` when `ref` is present, or
 * in `host.handlers` when `handler` is present; a `signal` may instead supply a
 * replaceable ref callback. The three forms are mutually exclusive.
 */
export interface SpikeRefPart {
  k: 'ref';
  index: number;
  ref?: string;
  handler?: string;
  signal?: string;
  path: number[];
  location: ProgramLocation;
}

export type SpikeEventAction =
  | { kind: 'method'; name: string }
  | { kind: 'call'; name: string }
  | { kind: 'increment' | 'decrement'; signal: string }
  | { kind: 'assign'; signal: string; value: SerializableValue }
  | { kind: 'add' | 'subtract'; signal: string; value: number };

export interface SpikeEventOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
}

/**
 * Event sink. A fixed `handler` names a host handler and carries the compiler's
 * `action` description; a `signal` may instead supply a replaceable event
 * callback. The two forms are mutually exclusive.
 */
export interface SpikeEventPart {
  k: 'event';
  index: number;
  event: string;
  handler?: string;
  signal?: string;
  action?: SpikeEventAction;
  options?: SpikeEventOptions;
  path: number[];
  location: ProgramLocation;
}

export type ConditionOperator = 'greater-than';

export interface SpikeCondition {
  signal: string;
  op: ConditionOperator;
  value?: SerializableValue;
}

/** Conditional Region with bounded branch ownership. */
export interface SpikeWhenPart {
  k: 'when';
  index: number;
  signal: string;
  gt: number;
  /** Compiler-emitted restatement of the `gt` threshold; validated when present. */
  test?: SpikeCondition;
  on: SpikeTreeNode[];
  off: SpikeTreeNode[];
  location: ProgramLocation;
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
  location: ProgramLocation;
}

/**
 * Dynamic child Region. Primitive values and arrays of primitive/DOM values
 * are supported; arbitrary VNodes are deliberately not part of this grammar.
 */
export interface SpikeChildPart {
  k: 'child';
  index: number;
  signal: string;
  location: ProgramLocation;
}

/** Fixed Parts own exact DOM sinks addressed by a static template path. */
export type SpikeFixedPart =
  | SpikePropPart
  | SpikeAttrPart
  | SpikeBoolPart
  | SpikeClassPart
  | SpikeStylePart
  | SpikeHtmlPart
  | SpikeRefPart
  | SpikeEventPart;

/** Regions own bounded dynamic ranges delimited by anchor and end markers. */
export type SpikeRegionPart = SpikeWhenPart | SpikeEachPart | SpikeChildPart;

export type SpikePart =
  | SpikeTextPart
  | SpikePropPart
  | SpikeAttrPart
  | SpikeBoolPart
  | SpikeClassPart
  | SpikeStylePart
  | SpikeHtmlPart
  | SpikeRefPart
  | SpikeEventPart
  | SpikeWhenPart
  | SpikeEachPart
  | SpikeChildPart;

export interface ProgramRegionRecord {
  id: string;
  index: number;
  kind: 'when' | 'each' | 'child';
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
  /**
   * True for computed fields (`= computed(() => ...)` in the source): their
   * signal is derived from other property signals by the generated
   * `__computedFields` factory, never seeded from attributes/props. Always
   * paired with `attribute: null` and `reflect: false`.
   */
  computed?: boolean;
  /** Source signal names a computed field reads (declaration order). */
  deps?: string[];
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

/** Anchor marker payloads shared by serialization, creation and claim. */
export function partAnchorMarker(index: number): string {
  return `oe:p${index}`;
}

export function partAnchorEndMarker(index: number): string {
  return `oe:/p${index}`;
}

/**
 * The one `<style>` element the server serializer emits as the first DSD
 * template child when the class carries static styles (legacy renderDsd
 * parity — pages never upgrade, so their styles must ship in the payload).
 * The claim path skips exactly this marked node; a marked node on a
 * style-less class is claim drift and fails closed.
 */
export const STATIC_STYLES_MARKER = 'data-oe-static-styles';

function fail(reason: string): never {
  throw new Error(`[compiled-program] invalid Part Program v1: ${reason}`);
}

/**
 * Records must be plain JSON-shaped objects. A foreign prototype would make
 * validation read inherited fields, so it fails before any key is inspected.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertKeys(
  record: unknown,
  allowed: readonly string[],
  where: string,
): void {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(record as Record<string, unknown>)) {
    if (!allowedKeys.has(key)) fail(`${where} contains unsupported key "${key}"`);
  }
}

function isIntegerArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => Number.isInteger(entry) && entry >= 0);
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function isAttributeName(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z_:][A-Za-z0-9_.:-]*$/.test(value) &&
    !/^on/i.test(value);
}

/** Template tags are lowercase intrinsics or custom elements as opaque leaves. */
function isElementTag(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value);
}

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
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Object.values(value).every((entry) => isSerializable(entry, seen));
}

function validatePosition(value: unknown, where: string): void {
  if (!isRecord(value)) fail(`${where} must be a position object`);
  assertKeys(value, ['offset', 'line', 'column'], where);
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
  if (!isRecord(value)) fail(`${where} must be a source range object`);
  assertKeys(value, ['file', 'start', 'end'], where);
  if (typeof value.file !== 'string' || value.file.length === 0) {
    fail(`${where} must contain a source file`);
  }
  validatePosition(value.start, `${where}.start`);
  validatePosition(value.end, `${where}.end`);
  const start = value.start as Record<string, unknown>;
  const end = value.end as Record<string, unknown>;
  if ((end.offset as number) < (start.offset as number)) fail(`${where} end precedes start`);
}

/** One dynamic-anchor occurrence found while walking a node list. */
interface AnchorOccurrence {
  partIndex: number;
  where: string;
  /** Plain child-index path inside the node list that owns the occurrence. */
  path: number[];
  /** Owning Region subtree, e.g. `parts[1].on`; undefined for the template. */
  container?: string;
}

/**
 * Validate one node list. Element locations use the compiler's subtree-relative
 * addressing (a Region subtree's root element is `[]`); anchor occurrences are
 * recorded with plain in-container paths so each dynamic Part's `location.path`
 * can be proven against exactly one tree anchor.
 */
function validateTreeNodes(
  nodes: unknown,
  where: string,
  allowAnchors: boolean,
  allowItemValues: boolean,
  elementIds: Set<string>,
  occurrences: AnchorOccurrence[],
  elementLocations: Map<string, { tag: string; path: number[] }>,
  plainPrefix: number[] = [],
  elementPrefix: number[] = [],
  subtreeRoot = false,
  container?: string,
): asserts nodes is SpikeTreeNode[] {
  if (!Array.isArray(nodes)) fail(`${where} must be an array`);
  for (const [position, rawNode] of nodes.entries()) {
    if (!isRecord(rawNode)) fail(`${where}[${position}] must be an object`);
    const plainPath = [...plainPrefix, position];
    switch (rawNode.k) {
      case 'el': {
        assertKeys(
          rawNode,
          ['k', 'id', 'tag', 'attrs', 'iattrs', 'children'],
          `${where}[${position}]`,
        );
        if (typeof rawNode.id !== 'string' || !/^e\d+$/.test(rawNode.id)) {
          fail(`${where}[${position}] element needs a stable eN id`);
        }
        if (elementIds.has(rawNode.id)) {
          fail(`${where}[${position}] duplicates element ${rawNode.id}`);
        }
        elementIds.add(rawNode.id);
        if (!isElementTag(rawNode.tag)) {
          fail(`${where}[${position}].tag must be a lowercase element tag`);
        }
        const elementPath = subtreeRoot && position === 0 ? [] : [...elementPrefix, position];
        elementLocations.set(rawNode.id, { tag: rawNode.tag, path: elementPath });
        if (!Array.isArray(rawNode.attrs)) fail(`${where}[${position}].attrs must be an array`);
        const attributeNames = new Set<string>();
        for (const [attrPosition, attr] of rawNode.attrs.entries()) {
          if (
            !Array.isArray(attr) || attr.length !== 2 || typeof attr[0] !== 'string' ||
            typeof attr[1] !== 'string'
          ) {
            fail(`${where}[${position}].attrs[${attrPosition}] must be a [name, value] pair`);
          }
          if (!isAttributeName(attr[0])) {
            fail(`${where}[${position}].attrs[${attrPosition}] has an unsafe name`);
          }
          if (attributeNames.has(attr[0].toLowerCase())) {
            fail(`${where}[${position}].attrs[${attrPosition}] duplicates attribute ${attr[0]}`);
          }
          attributeNames.add(attr[0].toLowerCase());
        }
        if (rawNode.iattrs !== undefined) {
          if (!allowItemValues) {
            fail(`${where}[${position}].iattrs item attribute slots need an each item template`);
          }
          if (!Array.isArray(rawNode.iattrs)) {
            fail(`${where}[${position}].iattrs must be an array`);
          }
          for (const [slotPosition, slot] of rawNode.iattrs.entries()) {
            if (
              !Array.isArray(slot) || slot.length !== 2 || typeof slot[0] !== 'string' ||
              typeof slot[1] !== 'string'
            ) {
              fail(`${where}[${position}].iattrs[${slotPosition}] must be a [name, field] pair`);
            }
            if (!isAttributeName(slot[0])) {
              fail(`${where}[${position}].iattrs[${slotPosition}] has an unsafe name`);
            }
            if (slot[0].toLowerCase() === 'key') {
              fail(`${where}[${position}].iattrs[${slotPosition}] may not bind the item key`);
            }
            if (!isIdentifier(slot[1])) {
              fail(`${where}[${position}].iattrs[${slotPosition}] field must be an identifier`);
            }
            if (attributeNames.has(slot[0].toLowerCase())) {
              fail(
                `${where}[${position}].iattrs[${slotPosition}] duplicates static attribute ${
                  slot[0]
                }`,
              );
            }
            attributeNames.add(slot[0].toLowerCase());
          }
        }
        if (!Array.isArray(rawNode.children)) {
          fail(`${where}[${position}].children must be an array`);
        }
        if (VOID_TAGS.has(rawNode.tag) && rawNode.children.length > 0) {
          fail(`${where}[${position}] void elements may not have children`);
        }
        validateTreeNodes(
          rawNode.children,
          `${where}[${position}].children`,
          allowAnchors,
          allowItemValues,
          elementIds,
          occurrences,
          elementLocations,
          plainPath,
          elementPath,
          false,
          container,
        );
        break;
      }
      case 'text':
        assertKeys(rawNode, ['k', 'value'], `${where}[${position}]`);
        if (typeof rawNode.value !== 'string' || rawNode.value.length === 0) {
          fail(`${where}[${position}].value must be a non-empty string`);
        }
        break;
      case 'part': {
        assertKeys(rawNode, ['k', 'id', 'index'], `${where}[${position}]`);
        if (!allowAnchors) fail(`${where}[${position}] may not contain a part anchor`);
        const index = rawNode.index;
        if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
          fail(`${where}[${position}].index must be a non-negative integer`);
        }
        if (rawNode.id !== `p${index}`) {
          fail(`${where}[${position}] id must match its part index`);
        }
        occurrences.push({
          partIndex: index,
          where: `${where}[${position}]`,
          path: plainPath,
          container,
        });
        break;
      }
      case 'ival':
        assertKeys(rawNode, ['k', 'field'], `${where}[${position}]`);
        if (!allowItemValues) fail(`${where}[${position}] may not contain an item value slot`);
        if (rawNode.field !== undefined && !isIdentifier(rawNode.field)) {
          fail(`${where}[${position}].field must be an identifier`);
        }
        break;
      default:
        fail(`${where}[${position}] has unknown node kind ${String(rawNode.k)}`);
    }
  }
}

function validateLocation(value: unknown, where: string): asserts value is ProgramLocation {
  if (!isRecord(value)) fail(`${where} must be a location object`);
  assertKeys(value, ['id', 'kind', 'path', 'node'], where);
  if (typeof value.id !== 'string' || !/^p\d+$/.test(value.id)) fail(`${where}.id is invalid`);
  if (value.kind !== 'anchor' && value.kind !== 'sink') fail(`${where}.kind is invalid`);
  if (!isIntegerArray(value.path)) fail(`${where}.path must be non-negative child indices`);
  if (value.kind === 'sink' && (typeof value.node !== 'string' || !/^e\d+$/.test(value.node))) {
    fail(`${where}.node must name a stable element id`);
  }
}

function validateCondition(value: unknown, where: string): asserts value is SpikeCondition {
  if (!isRecord(value)) fail(`${where} must be a condition object`);
  assertKeys(value, ['signal', 'op', 'value'], where);
  if (
    !isIdentifier(value.signal) || value.op !== 'greater-than' ||
    typeof value.value !== 'number' || !Number.isFinite(value.value)
  ) {
    fail(`${where} supports only greater-than with a finite numeric value`);
  }
}

/**
 * Item value slots render their own `field` (multi-field templates) or — for
 * single-field templates — restate the owning Region's `field`. A slot that
 * contradicts a present Region `field` fails; field-less slots render the
 * Region's `field` (or the item itself for field-less unkeyed Regions).
 */
function validateItemValueFields(
  nodes: SpikeTreeNode[],
  field: string | undefined,
  where: string,
): void {
  nodes.forEach((node, position) => {
    if (node.k === 'ival') {
      if (node.field !== undefined && field !== undefined && node.field !== field) {
        fail(`${where}[${position}] must use item field ${field}`);
      }
      return;
    }
    if (node.k === 'el') {
      validateItemValueFields(node.children, field, `${where}[${position}].children`);
    }
  });
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

function validateFixedPartPath(
  template: SpikeTreeNode[],
  path: number[],
  where: string,
): void {
  let nodes = template;
  for (const target of path) {
    for (let sibling = 0; sibling < target; sibling++) {
      if (nodes[sibling]?.k === 'part') {
        fail(`${where}.path is preceded by a dynamic anchor`);
      }
    }
    const next = nodes[target];
    nodes = next?.k === 'el' ? next.children : [];
  }
}

function hasSignal(part: SpikePart): boolean {
  switch (part.k) {
    case 'text':
    case 'prop':
    case 'attr':
    case 'bool':
    case 'class':
    case 'style':
    case 'html':
    case 'when':
    case 'each':
    case 'child':
      return true;
    case 'event':
    case 'ref':
      return part.signal !== undefined;
  }
}

function isRegion(part: SpikePart): part is SpikeRegionPart {
  return part.k === 'when' || part.k === 'each' || part.k === 'child';
}

function isDynamicAnchorPart(part: SpikePart): part is SpikeTextPart | SpikeRegionPart {
  return part.k === 'text' || isRegion(part);
}

function validateEventAction(value: unknown, where: string): void {
  if (!isRecord(value)) fail(`${where} must be an event action`);
  assertKeys(value, ['kind', 'name', 'signal', 'value'], where);
  if (typeof value.kind !== 'string') fail(`${where} must be an event action`);
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

/** Exactly one of the listed callback selectors must be present as an identifier. */
function requireOneSelector(
  values: Array<string | undefined>,
  selectors: string,
  where: string,
): void {
  const present = values.filter((value) => value !== undefined);
  if (present.length !== 1 || !isIdentifier(present[0])) {
    fail(`${where} needs exactly one non-empty ${selectors} selector`);
  }
}

const PART_KEYS: Record<SpikePart['k'], readonly string[]> = {
  text: ['k', 'index', 'signal', 'location'],
  prop: ['k', 'index', 'signal', 'name', 'path', 'location'],
  attr: ['k', 'index', 'signal', 'name', 'path', 'location'],
  bool: ['k', 'index', 'signal', 'name', 'path', 'location'],
  class: ['k', 'index', 'signal', 'path', 'location'],
  style: ['k', 'index', 'signal', 'path', 'location'],
  html: ['k', 'index', 'signal', 'path', 'location'],
  ref: ['k', 'index', 'ref', 'handler', 'signal', 'path', 'location'],
  event: ['k', 'index', 'event', 'handler', 'signal', 'action', 'options', 'path', 'location'],
  when: ['k', 'index', 'signal', 'gt', 'test', 'on', 'off', 'location'],
  each: ['k', 'index', 'signal', 'key', 'field', 'keyed', 'item', 'location'],
  child: ['k', 'index', 'signal', 'location'],
};

/**
 * Validate an unknown value as a Part Program v1. The validator is intentionally
 * strict: unknown instruction kinds, missing ownership records, unsafe paths
 * and foreign object prototypes fail before a runtime can guess at their meaning.
 * It returns the value narrowed to the serializable grammar.
 */
export function validatePartProgram(raw: unknown): asserts raw is PartProgram {
  if (!isRecord(raw)) fail('program must be an object');
  assertKeys(
    raw,
    [
      'version',
      'tag',
      'root',
      'template',
      'parts',
      'regions',
      'dependencies',
      'locations',
      'sourceMap',
      'metadata',
    ],
    'program',
  );
  if (raw.version !== PART_PROGRAM_VERSION) fail('version must be 1');
  if (typeof raw.tag !== 'string' || !/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(raw.tag)) {
    fail('tag must be a custom-element tag name');
  }
  if (!isRecord(raw.root)) fail('root must be a root record');
  assertKeys(raw.root, ['id', 'kind', 'nodes'], 'root');
  if (raw.root.id !== 'root') fail('root must be a root record');
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
  const occurrences: AnchorOccurrence[] = [];
  const elementLocations = new Map<string, { tag: string; path: number[] }>();
  validateTreeNodes(
    raw.template,
    'template',
    true,
    false,
    elementIds,
    occurrences,
    elementLocations,
  );
  const template = raw.template as SpikeTreeNode[];
  const topLevelElements = template
    .filter((node): node is SpikeElementNode => node.k === 'el')
    .map((node) => node.id);
  if (JSON.stringify(raw.root.nodes) !== JSON.stringify(topLevelElements)) {
    fail('root.nodes must match top-level template elements in order');
  }

  if (!Array.isArray(raw.parts)) fail('parts must be an array');
  const parts = raw.parts as SpikePart[];
  parts.forEach((part, position) => {
    if (!isRecord(part)) fail(`parts[${position}] must be an object`);
    if (part.index !== position) fail(`parts[${position}].index must equal its position`);
    const knownKinds = Object.keys(PART_KEYS);
    if (!knownKinds.includes(part.k)) {
      fail(`parts[${position}] has unknown part kind ${String(part.k)}`);
    }
    assertKeys(part, PART_KEYS[part.k], `parts[${position}]`);
    validateLocation(part.location, `parts[${position}].location`);
    if (part.location.id !== `p${position}`) fail(`parts[${position}].location id is out of order`);
    switch (part.k) {
      case 'text':
        if (!isIdentifier(part.signal)) fail(`parts[${position}].signal must be an identifier`);
        if (part.location.kind !== 'anchor') fail(`parts[${position}] text must own an anchor`);
        break;
      case 'prop':
      case 'attr':
      case 'bool':
        if (!isIdentifier(part.signal) || typeof part.name !== 'string' || part.name.length === 0) {
          fail(`parts[${position}] ${part.k} needs signal and name`);
        }
        if (part.k === 'prop' && (!isIdentifier(part.name) || /^on/i.test(part.name))) {
          fail(`parts[${position}] prop name must be an identifier`);
        }
        if ((part.k === 'attr' || part.k === 'bool') && !isAttributeName(part.name)) {
          fail(`parts[${position}] ${part.k} name is unsafe`);
        }
        if (part.location.kind !== 'sink') fail(`parts[${position}] ${part.k} must own a sink`);
        if (
          validatePartPath(template, part.path, `parts[${position}]`, elementIds) !==
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
          validatePartPath(template, part.path, `parts[${position}]`, elementIds) !==
            part.location.node
        ) {
          fail(`parts[${position}] location node does not match path`);
        }
        if (!samePath(part.location.path, part.path)) {
          fail(`parts[${position}] location path does not match path`);
        }
        break;
      case 'html': {
        if (!isIdentifier(part.signal) || part.location.kind !== 'sink') {
          fail(`parts[${position}] html is invalid`);
        }
        const htmlTargetId = validatePartPath(
          template,
          part.path,
          `parts[${position}]`,
          elementIds,
        );
        if (htmlTargetId !== part.location.node) {
          fail(`parts[${position}] location node does not match path`);
        }
        if (!samePath(part.location.path, part.path)) {
          fail(`parts[${position}] location path does not match path`);
        }
        // The HTML sink owns its target's whole content: the target must not
        // also carry program children (the serializer would overwrite them).
        let htmlTarget: SpikeTreeNode | undefined;
        let htmlNodes = template;
        for (const pathIndex of part.path) {
          htmlTarget = htmlNodes[pathIndex];
          htmlNodes = htmlTarget?.k === 'el' ? htmlTarget.children : [];
        }
        if (htmlTarget?.k !== 'el' || htmlTarget.children.length > 0) {
          fail(`parts[${position}] html sink target must be a childless element`);
        }
        break;
      }
      case 'ref':
        requireOneSelector(
          [part.ref, part.handler, part.signal],
          'ref, handler, or signal',
          `parts[${position}] ref`,
        );
        if (part.location.kind !== 'sink') fail(`parts[${position}] ref must own a sink`);
        if (
          validatePartPath(template, part.path, `parts[${position}]`, elementIds) !==
            part.location.node
        ) {
          fail(`parts[${position}] location node does not match path`);
        }
        if (!samePath(part.location.path, part.path)) {
          fail(`parts[${position}] location path does not match path`);
        }
        break;
      case 'event': {
        if (typeof part.event !== 'string' || !/^[a-z][a-z0-9:-]*$/.test(part.event)) {
          fail(`parts[${position}] event name is unsafe`);
        }
        requireOneSelector(
          [part.handler, part.signal],
          'handler or signal',
          `parts[${position}] event`,
        );
        if (part.handler !== undefined) {
          validateEventAction(part.action, `parts[${position}].action`);
        } else if (part.action !== undefined) {
          fail(`parts[${position}] signal-driven event may not carry an action`);
        }
        validateEventOptions(part.options, `parts[${position}]`);
        if (part.location.kind !== 'sink') fail(`parts[${position}] event must own a sink`);
        if (
          validatePartPath(template, part.path, `parts[${position}]`, elementIds) !==
            part.location.node
        ) {
          fail(`parts[${position}] event location node does not match path`);
        }
        if (!samePath(part.location.path, part.path)) {
          fail(`parts[${position}] location path does not match path`);
        }
        break;
      }
      case 'when':
        if (
          !isIdentifier(part.signal) || typeof part.gt !== 'number' || !Number.isFinite(part.gt)
        ) {
          fail(`parts[${position}] when needs a signal and finite threshold`);
        }
        if (part.location.kind !== 'anchor') fail(`parts[${position}] when must own an anchor`);
        if (part.test !== undefined) {
          validateCondition(part.test, `parts[${position}].test`);
          if (part.test.signal !== part.signal) fail(`parts[${position}] test signal mismatch`);
          if (part.test.value !== part.gt) fail(`parts[${position}] threshold mismatches its test`);
        }
        validateTreeNodes(
          part.on,
          `parts[${position}].on`,
          true,
          false,
          elementIds,
          occurrences,
          elementLocations,
          [],
          [],
          true,
          `parts[${position}].on`,
        );
        validateTreeNodes(
          part.off,
          `parts[${position}].off`,
          true,
          false,
          elementIds,
          occurrences,
          elementLocations,
          [],
          [],
          true,
          `parts[${position}].off`,
        );
        break;
      case 'each':
        if (!isIdentifier(part.signal)) {
          fail(`parts[${position}] each needs a signal identifier`);
        }
        if (part.key !== undefined && !isIdentifier(part.key)) {
          fail(`parts[${position}].key must be an identifier when present`);
        }
        if (part.field !== undefined && !isIdentifier(part.field)) {
          fail(`parts[${position}].field must be an identifier when present`);
        }
        if (part.keyed !== undefined && typeof part.keyed !== 'boolean') {
          fail(`parts[${position}].keyed must be boolean when present`);
        }
        if (part.keyed === true && part.key === undefined) {
          fail(`parts[${position}] keyed Regions require key`);
        }
        if (part.location.kind !== 'anchor') fail(`parts[${position}] each must own an anchor`);
        validateTreeNodes(
          part.item,
          `parts[${position}].item`,
          true,
          true,
          elementIds,
          occurrences,
          elementLocations,
          [],
          [],
          true,
          `parts[${position}].item`,
        );
        validateItemValueFields(part.item, part.field, `parts[${position}].item`);
        break;
      case 'child':
        if (!isIdentifier(part.signal)) fail(`parts[${position}].signal must be an identifier`);
        if (part.location.kind !== 'anchor') fail(`parts[${position}] child must own an anchor`);
        break;
      default:
        fail(`parts[${position}] has unknown part kind ${String((part as { k?: unknown }).k)}`);
    }
  });

  for (const part of parts) {
    if (isDynamicAnchorPart(part)) continue;
    validateFixedPartPath(template, part.path, `parts[${part.index}]`);
  }

  // Every dynamic Part owns exactly one tree anchor (in the template or inside
  // one Region subtree); fixed Parts never own an anchor. The anchor's recorded
  // path must restate the Part's location path.
  const occurrencesByPart = new Map<number, AnchorOccurrence[]>();
  for (const occurrence of occurrences) {
    const part = parts[occurrence.partIndex];
    if (!part) {
      fail(`${occurrence.where} references missing part ${occurrence.partIndex}`);
    }
    if (!isDynamicAnchorPart(part)) {
      fail(`${occurrence.where} must reference a text or Region part`);
    }
    const list = occurrencesByPart.get(occurrence.partIndex) ?? [];
    list.push(occurrence);
    occurrencesByPart.set(occurrence.partIndex, list);
  }
  for (const part of parts) {
    const owned = occurrencesByPart.get(part.index) ?? [];
    if (!isDynamicAnchorPart(part)) {
      if (owned.length > 0) fail(`fixed part ${part.index} may not have a tree anchor`);
      continue;
    }
    if (owned.length !== 1) {
      fail(`part ${part.index} must have exactly one tree anchor`);
    }
    if (!samePath(owned[0].path, part.location.path)) {
      fail(`parts[${part.index}] location path does not match its tree anchor`);
    }
  }

  // Region subtrees may anchor other Parts, but the ownership graph they induce
  // must stay acyclic: a Region that (transitively) anchors itself has no
  // bounded range to own.
  const regionEdges = new Map<number, number[]>();
  for (const occurrence of occurrences) {
    if (occurrence.container === undefined) continue;
    const owner = Number(/^parts\[(\d+)\]/.exec(occurrence.container)?.[1]);
    if (!Number.isInteger(owner)) continue;
    const edges = regionEdges.get(owner) ?? [];
    edges.push(occurrence.partIndex);
    regionEdges.set(owner, edges);
  }
  const visiting = new Set<number>();
  const visited = new Set<number>();
  const assertAcyclic = (index: number): void => {
    if (visited.has(index)) return;
    if (visiting.has(index)) {
      fail(`parts[${index}] creates a recursive Region definition`);
    }
    visiting.add(index);
    for (const next of regionEdges.get(index) ?? []) assertAcyclic(next);
    visiting.delete(index);
    visited.add(index);
  };
  for (const index of regionEdges.keys()) assertAcyclic(index);

  if (!Array.isArray(raw.regions)) fail('regions must be an array');
  const regions = raw.regions as ProgramRegionRecord[];
  const regionParts = parts.filter(isRegion);
  if (regions.length !== regionParts.length) {
    fail('regions must describe every Region part exactly once');
  }
  regions.forEach((region, position) => {
    if (!isRecord(region)) fail(`regions[${position}] must be an object`);
    assertKeys(region, ['id', 'index', 'kind', 'anchor', 'end', 'source'], `regions[${position}]`);
    if (
      region.id !== `r${region.index}` ||
      region.index !== regionParts[position].index ||
      (region.kind !== 'when' && region.kind !== 'each' && region.kind !== 'child') ||
      region.anchor !== `p${region.index}` ||
      region.end !== `p${region.index}:end` || region.source !== `p${region.index}`
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
    if (!isRecord(dependency)) fail(`dependencies[${position}] must be an object`);
    assertKeys(dependency, ['signal', 'owner', 'location'], `dependencies[${position}]`);
    if (!isIdentifier(dependency.signal) || !isRecord(dependency.owner)) {
      fail(`dependencies[${position}] is invalid`);
    }
    assertKeys(dependency.owner, ['kind', 'index'], `dependencies[${position}].owner`);
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
    if (
      owner.signal !== dependency.signal || dependency.location !== owner.location.id
    ) {
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
      assertKeys(location, ['id', 'kind', 'tag', 'path'], `locations[${position}]`);
      const element = elementLocations.get(location.id);
      if (
        !element || location.tag !== element.tag || !samePath(location.path, element.path)
      ) fail(`locations[${position}] element is invalid`);
    } else if (location.kind === 'anchor') {
      assertKeys(location, ['id', 'kind', 'part', 'path'], `locations[${position}]`);
      const part = Number.isInteger(location.part) ? parts[location.part] : undefined;
      if (
        !part || !isDynamicAnchorPart(part) || location.id !== `p${location.part}` ||
        !samePath(location.path, part.location.path)
      ) {
        fail(`locations[${position}] anchor is invalid`);
      }
    } else if (location.kind === 'sink') {
      assertKeys(location, ['id', 'kind', 'part', 'node', 'path'], `locations[${position}]`);
      const part = Number.isInteger(location.part) ? parts[location.part] : undefined;
      if (
        !part || isDynamicAnchorPart(part) || location.id !== `p${location.part}` ||
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
  assertKeys(
    metadata,
    ['tag', 'className', 'sourceFile', 'properties', 'observedAttributes', 'cem'],
    'metadata',
  );
  if (!isRecord(raw.sourceMap)) fail('sourceMap must be an object');
  assertKeys(raw.sourceMap, ['version', 'file', 'records'], 'sourceMap');
  if (raw.sourceMap.version !== 1 || raw.sourceMap.file !== metadata.sourceFile) {
    fail('sourceMap must be version 1 and identify the metadata source file');
  }
  if (!Array.isArray(raw.sourceMap.records)) fail('sourceMap.records must be an array');
  const sourceIds = new Set<string>();
  for (const [position, record] of raw.sourceMap.records.entries()) {
    if (!isRecord(record) || typeof record.id !== 'string' || sourceIds.has(record.id)) {
      fail(`sourceMap.records[${position}] must have a unique id`);
    }
    assertKeys(record, ['id', 'kind', 'source'], `sourceMap.records[${position}]`);
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
    const computed = property && isRecord(property) ? property.computed : undefined;
    const deps = property && isRecord(property) ? property.deps : undefined;
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
    assertKeys(
      property,
      ['name', 'attribute', 'type', 'converter', 'reflect', 'default', 'computed', 'deps'],
      `metadata.properties[${position}]`,
    );
    if (computed !== undefined) {
      // Computed fields derive their signal from other properties, so they can
      // never be attribute-backed, reflect, or carry no source list.
      if (
        computed !== true || attribute !== null || reflect !== false ||
        !Array.isArray(deps) || deps.length === 0 ||
        deps.some((dep) => !isIdentifier(dep))
      ) {
        fail(`metadata.properties[${position}].computed is invalid`);
      }
    } else if (deps !== undefined) {
      fail(`metadata.properties[${position}].deps requires computed: true`);
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
  if (!isRecord(cem)) fail('metadata.cem must be an object');
  assertKeys(
    cem,
    ['tagName', 'className', 'declaration', 'attributes', 'members'],
    'metadata.cem',
  );
  if (
    cem.tagName !== raw.tag || cem.className !== metadata.className ||
    !isRecord(cem.declaration) || cem.declaration.name !== metadata.className ||
    typeof cem.declaration.module !== 'string' || !Array.isArray(cem.attributes) ||
    !Array.isArray(cem.members)
  ) {
    fail('metadata.cem identity or shape is invalid');
  }
  assertKeys(cem.declaration, ['name', 'module'], 'metadata.cem.declaration');
  const cemAttributes = cem.attributes;
  const expectedCemAttributes = metadataProperties.filter((property) =>
    property.attribute !== null
  );
  if (cemAttributes.length !== expectedCemAttributes.length) {
    fail('metadata.cem attributes are incomplete');
  }
  for (const [position, attribute] of cemAttributes.entries()) {
    if (!isRecord(attribute)) fail(`metadata.cem.attributes[${position}] must be an object`);
    assertKeys(
      attribute,
      ['name', 'fieldName', 'type', 'reflect'],
      `metadata.cem.attributes[${position}]`,
    );
    if (
      !isAttributeName(attribute.name) ||
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
    if (!isRecord(member)) fail(`metadata.cem.members[${position}] must be an object`);
    assertKeys(
      member,
      ['name', 'fieldName', 'type', 'attribute', 'reflect'],
      `metadata.cem.members[${position}]`,
    );
    if (
      !isIdentifier(member.name) || !isIdentifier(member.fieldName) ||
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
