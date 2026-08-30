/**
 * @openelement/adapter-vite — TSX-to-Part Program v1 compiler (#1161–#1163).
 *
 * The compiler accepts one deliberately bounded authoring grammar. It lowers
 * every accepted dynamic expression to a typed fixed Part or Region with a
 * stable compiler-owned location. Anything outside that grammar produces a
 * source-located diagnostic; no runtime discovery or fallback renderer is
 * emitted.
 */

import ts from 'typescript';
import {
  type CompilerDiagnostic,
  CompilerDiagnosticError,
  diagnosticAt,
  diagnosticMessage,
} from './diagnostics/index.ts';
import {
  type CompiledElementMetadata,
  type PartProgramSpike,
  type ProgramDependencyRecord,
  type ProgramLocation,
  type ProgramLocationRecord,
  type ProgramRegionRecord,
  type ProgramSourceRecord,
  type PropertyValueType,
  type SerializableValue,
  type SpikeCondition,
  type SpikeEventAction,
  type SpikePart,
  type SpikeTreeNode,
  validatePartProgram,
} from './program.ts';

export interface SpikeDiagnostic extends CompilerDiagnostic {}

/** Error shape consumed by the Vite plugin and compiler tests. */
export class CompiledSpikeError extends CompilerDiagnosticError {
  constructor(diagnostics: SpikeDiagnostic[]) {
    super(diagnostics);
    this.name = 'CompiledSpikeError';
  }
}

export interface CompileSpikeResult {
  code: string;
  program: PartProgramSpike;
}

interface SpikeField {
  name: string;
  reflect: boolean;
  attribute: string | null;
  type: PropertyValueType;
  converter: PropertyValueType;
  typeConstructor: 'String' | 'Number' | 'Boolean' | 'Array' | 'Object';
  accessibility: 'public' | 'protected' | 'private' | '';
  typeText: string;
  initializerText: string;
  defaultValue: SerializableValue;
  node: ts.PropertyDeclaration;
  /**
   * Computed field (alpha.8): the source initializer is
   * `computed(() => <expr>)` (optionally behind a type assertion). The
   * compiled accessor returns the derived value. The compiler records the
   * source-signal dependencies and emits a `__computedFields` factory over the
   * instance's signal record; no field initializer runs on the generated class.
   */
  computed?: { deps: string[]; factoryText: string };
}

interface GeneratedHandler {
  name: string;
  action: SpikeEventAction;
  node: ts.ArrowFunction;
}

/** Distributive input union for addPart (Omit<union> collapses; do not use). */
type SpikePartInput =
  | { k: 'text'; signal: string }
  | { k: 'prop'; signal: string; name: string; path: number[] }
  | { k: 'attr'; signal: string; name: string; path: number[] }
  | { k: 'bool'; signal: string; name: string; path: number[] }
  | { k: 'class'; signal: string; path: number[] }
  | { k: 'style'; signal: string; path: number[] }
  | { k: 'html'; signal: string; path: number[] }
  | { k: 'ref'; ref: string; path: number[] }
  | {
    k: 'event';
    event: string;
    handler: string;
    action: SpikeEventAction;
    path: number[];
  }
  | {
    k: 'when';
    signal: string;
    gt?: number;
    test: SpikeCondition;
    on: SpikeTreeNode[];
    off: SpikeTreeNode[];
  }
  | { k: 'each'; signal: string; key: string; field?: string; item: SpikeTreeNode[] };

const BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'inert',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
]);

const DOM_PROPERTY_NAMES = new Set([
  'checked',
  'files',
  'indeterminate',
  'readOnly',
  'scrollLeft',
  'scrollTop',
  'selected',
  'value',
]);

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

function camelToKebab(value: string): string {
  return value.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function isSafeAttributeName(value: string): boolean {
  return /^[A-Za-z_:][A-Za-z0-9_.:-]*$/.test(value) && !/^on/i.test(value);
}

function isIdentifier(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function unwrapExpression(expr: ts.Expression): ts.Expression {
  let current = expr;
  while (
    ts.isParenthesizedExpression(current) || ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

/** Return a JSON-safe literal, or undefined when the expression is not literal. */
function literalValue(expr: ts.Expression, sf: ts.SourceFile): SerializableValue | undefined {
  const value = unwrapExpression(expr);
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) return value.text;
  if (ts.isNumericLiteral(value)) {
    const number = Number(value.text);
    return Number.isFinite(number) ? number : undefined;
  }
  if (value.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (value.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (value.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(value) && value.operator === ts.SyntaxKind.MinusToken) {
    if (!ts.isNumericLiteral(value.operand)) return undefined;
    const number = -Number(value.operand.text);
    return Number.isFinite(number) ? number : undefined;
  }
  if (ts.isArrayLiteralExpression(value)) {
    const entries: SerializableValue[] = [];
    for (const element of value.elements) {
      if (ts.isSpreadElement(element)) return undefined;
      const entry = literalValue(element, sf);
      if (entry === undefined) return undefined;
      entries.push(entry);
    }
    return entries;
  }
  if (ts.isObjectLiteralExpression(value)) {
    const object: { [key: string]: SerializableValue } = {};
    for (const property of value.properties) {
      if (!ts.isPropertyAssignment(property)) return undefined;
      const name = property.name;
      const key = ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)
        ? name.text
        : undefined;
      if (key === undefined || key === '__proto__') return undefined;
      const entry = literalValue(property.initializer, sf);
      if (entry === undefined) return undefined;
      object[key] = entry;
    }
    return object;
  }
  return undefined;
}

function primitiveText(value: SerializableValue): string | null {
  if (value === null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function hasMeaningfulJsxChild(sf: ts.SourceFile, child: ts.JsxChild): boolean {
  if (ts.isJsxText(child)) return child.getText(sf).trim().length > 0;
  if (ts.isJsxExpression(child)) {
    if (!child.expression) return false;
    const literal = literalValue(child.expression, sf);
    if (literal !== undefined) return primitiveText(literal) !== '';
  }
  return true;
}

function propertyTypeFromConstructor(
  expr: ts.Expression,
  sf: ts.SourceFile,
  node: ts.Node,
  fail: (node: ts.Node, code: string, message: string) => never,
): { label: PropertyValueType; constructorName: SpikeField['typeConstructor'] } {
  const name = expr.getText(sf);
  if (
    name !== 'String' && name !== 'Number' && name !== 'Boolean' && name !== 'Array' &&
    name !== 'Object'
  ) {
    return fail(
      node,
      'OEC9021',
      'property type/converter must be one of String, Number, Boolean, Array or Object',
    );
  }
  return { label: name.toLowerCase() as PropertyValueType, constructorName: name };
}

/**
 * Parse a computed field initializer (alpha.8, ADR-0143): `computed(() => ...)`
 * behind optional `as`-casts. The arrow body may read `this.<field>` of any
 * NON-computed declared field (rewritten to the signal-record read) and use
 * any module-scope values; `this` in any other position, reads of computed
 * fields, and nested non-arrow functions fail closed (OEC9024). Returns null
 * for non-computed initializers.
 */
function parseComputedInitializer(
  initializer: ts.Expression,
  sf: ts.SourceFile,
  plainFieldNames: ReadonlySet<string>,
  computedFieldNames: ReadonlySet<string>,
  fail: (node: ts.Node, code: string, message: string) => never,
): { deps: string[]; factoryText: string } | null {
  const value = unwrapExpression(initializer);
  if (!ts.isCallExpression(value) || value.expression.getText(sf) !== 'computed') return null;
  if (value.arguments.length !== 1 || !ts.isArrowFunction(value.arguments[0])) {
    fail(value, 'OEC9024', 'computed fields take exactly one zero-argument arrow function');
  }
  const arrow = value.arguments[0] as ts.ArrowFunction;
  if (arrow.parameters.length > 0) {
    fail(arrow, 'OEC9024', 'computed field arrows may not declare parameters');
  }
  if (!ts.isBlock(arrow.body)) {
    // expression body — the supported form
  } else if (
    arrow.body.statements.length === 1 && ts.isReturnStatement(arrow.body.statements[0]) &&
    arrow.body.statements[0].expression
  ) {
    fail(
      arrow.body,
      'OEC9024',
      'computed field arrows use an expression body, not a block (keep derived values atomic)',
    );
  } else {
    fail(arrow.body, 'OEC9024', 'computed field arrows use an expression body, not a block');
  }
  const body = arrow.body as ts.Expression;
  const deps: string[] = [];
  const replacements: Array<{ start: number; end: number; name: string }> = [];
  const visit = (node: ts.Node): void => {
    if (node !== body && (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node))) {
      fail(node, 'OEC9024', 'computed field arrows may not nest non-arrow functions');
    }
    if (ts.isPropertyAccessExpression(node) && node.expression.kind === ts.SyntaxKind.ThisKeyword) {
      const name = node.name.text;
      if (computedFieldNames.has(name)) {
        fail(node, 'OEC9024', `computed field may not read computed field "${name}"`);
      }
      if (!plainFieldNames.has(name)) {
        fail(
          node,
          'OEC9024',
          `computed fields may only read this.<declared property> (found this.${name})`,
        );
      }
      if (!deps.includes(name)) deps.push(name);
      replacements.push({ start: node.getStart(sf), end: node.getEnd(), name });
      return;
    }
    if (node.kind === ts.SyntaxKind.ThisKeyword || node.kind === ts.SyntaxKind.SuperKeyword) {
      fail(node, 'OEC9024', 'computed field arrows may only reference this.<property>');
    }
    ts.forEachChild(node, visit);
  };
  visit(body);
  let bodyText = body.getText(sf);
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    const offset = body.getStart(sf);
    bodyText = bodyText.slice(0, replacement.start - offset) +
      `__s.${replacement.name}.value` +
      bodyText.slice(replacement.end - offset);
  }
  return { deps, factoryText: `(__s) => computed(() => ${bodyText})` };
}

function inferPropertyType(
  member: ts.PropertyDeclaration,
  defaultValue: SerializableValue,
  sf: ts.SourceFile,
): { label: PropertyValueType; constructorName: SpikeField['typeConstructor'] } {
  const typeText = member.type?.getText(sf).replace(/[\s?]/g, '') ?? '';
  if (typeText === 'string' || typeText === 'String') {
    return { label: 'string', constructorName: 'String' };
  }
  if (typeText === 'number' || typeText === 'Number') {
    return { label: 'number', constructorName: 'Number' };
  }
  if (typeText === 'boolean' || typeText === 'Boolean') {
    return { label: 'boolean', constructorName: 'Boolean' };
  }
  if (/^(Array|ReadonlyArray|Set)</.test(typeText) || typeText.endsWith('[]')) {
    return { label: 'array', constructorName: 'Array' };
  }
  if (/^(Record|Map|Object)</.test(typeText)) return { label: 'object', constructorName: 'Object' };
  if (Array.isArray(defaultValue)) return { label: 'array', constructorName: 'Array' };
  if (defaultValue !== null && typeof defaultValue === 'object') {
    return { label: 'object', constructorName: 'Object' };
  }
  if (typeof defaultValue === 'number') return { label: 'number', constructorName: 'Number' };
  if (typeof defaultValue === 'boolean') return { label: 'boolean', constructorName: 'Boolean' };
  return { label: 'string', constructorName: 'String' };
}

function sourceRange(sf: ts.SourceFile, node: ts.Node): {
  file: string;
  start: { offset: number; line: number; column: number };
  end: { offset: number; line: number; column: number };
} {
  const start = node.getStart(sf);
  const end = node.getEnd();
  const startPosition = sf.getLineAndCharacterOfPosition(start);
  const endPosition = sf.getLineAndCharacterOfPosition(end);
  return {
    file: sf.fileName,
    start: { offset: start, line: startPosition.line + 1, column: startPosition.character + 1 },
    end: { offset: end, line: endPosition.line + 1, column: endPosition.character + 1 },
  };
}

function parseDiagnostic(sf: ts.SourceFile, diagnostic: ts.Diagnostic): SpikeDiagnostic {
  const start = diagnostic.start ?? 0;
  const end = diagnostic.start === undefined ? start : start + (diagnostic.length ?? 0);
  const position = sf.getLineAndCharacterOfPosition(start);
  return {
    code: 'OEC9000',
    message: diagnosticMessage(diagnostic),
    file: sf.fileName,
    line: position.line + 1,
    character: position.character + 1,
    start,
    end,
  };
}

class Lowering {
  readonly parts: SpikePart[] = [];
  readonly regions: ProgramRegionRecord[] = [];
  readonly dependencies: ProgramDependencyRecord[] = [];
  readonly locations: ProgramLocationRecord[] = [];
  readonly sourceRecords: ProgramSourceRecord[] = [];
  readonly generatedHandlers: GeneratedHandler[] = [];
  readonly fieldNames: Set<string>;
  readonly methodNames: Set<string>;
  readonly computedNames: Set<string>;
  readonly fieldTypes: Map<string, PropertyValueType>;
  private elementSerial = 0;

  constructor(
    private readonly sf: ts.SourceFile,
    fields: SpikeField[],
    methodNames: string[],
  ) {
    this.fieldNames = new Set(fields.map((field) => field.name));
    this.methodNames = new Set(methodNames);
    this.computedNames = new Set(
      fields.filter((field) => field.computed).map((field) => field.name),
    );
    this.fieldTypes = new Map(fields.map((field) => [field.name, field.type]));
  }

  fail(node: ts.Node, code: string, message: string): never {
    throw new CompiledSpikeError([diagnosticAt(this.sf, node, code, message)]);
  }

  private addSource(id: string, kind: ProgramSourceRecord['kind'], node: ts.Node): void {
    if (this.sourceRecords.some((record) => record.id === id)) return;
    this.sourceRecords.push({ id, kind, source: sourceRange(this.sf, node) });
  }

  private reserveElement(tag: string, path: number[], node: ts.Node): string {
    const id = `e${this.elementSerial++}`;
    this.locations.push({ id, kind: 'element', tag, path: [...path] });
    this.addSource(id, 'element', node);
    return id;
  }

  private addElement(
    id: string,
    tag: string,
    attrs: Array<[string, string]>,
    children: SpikeTreeNode[],
    iattrs?: Array<[string, string]>,
  ): SpikeTreeNode {
    return {
      k: 'el',
      id,
      tag,
      attrs,
      ...(iattrs && iattrs.length > 0 ? { iattrs } : {}),
      children,
    };
  }

  private addPart(
    part: SpikePartInput,
    path: number[],
    node: ts.Node,
    targetNode?: string,
  ): number {
    const index = this.parts.length;
    const isAnchor = part.k === 'text' || part.k === 'when' || part.k === 'each';
    const location: ProgramLocation = {
      id: `p${index}`,
      kind: isAnchor ? 'anchor' : 'sink',
      path: [...path],
      ...(targetNode ? { node: targetNode } : {}),
    };
    const fullPart = { ...part, index, location } as SpikePart;
    this.parts.push(fullPart);
    if (isAnchor) {
      this.locations.push({ id: `p${index}`, kind: 'anchor', part: index, path: [...path] });
    } else {
      this.locations.push({
        id: `p${index}`,
        kind: 'sink',
        part: index,
        node: targetNode!,
        path: [...path],
      });
    }
    const sourceKind = part.k === 'when' || part.k === 'each' ? 'region' : 'part';
    this.addSource(`p${index}`, sourceKind, node);
    if (part.k === 'when' || part.k === 'each') {
      this.regions.push({
        id: `r${index}`,
        index,
        kind: part.k,
        anchor: `p${index}`,
        end: `p${index}:end`,
        source: `p${index}`,
      });
      this.addSource(`r${index}`, 'region', node);
    }
    if (
      part.k === 'text' || part.k === 'prop' || part.k === 'attr' || part.k === 'bool' ||
      part.k === 'class' || part.k === 'style' || part.k === 'html' || part.k === 'when' ||
      part.k === 'each'
    ) {
      this.dependencies.push({
        signal: part.signal,
        owner: { kind: part.k === 'when' || part.k === 'each' ? 'region' : 'part', index },
        location: `p${index}`,
      });
    }
    return index;
  }

  private fieldAccess(expr: ts.Expression): string | null {
    const value = unwrapExpression(expr);
    if (
      ts.isPropertyAccessExpression(value) && value.expression.kind === ts.SyntaxKind.ThisKeyword &&
      this.fieldNames.has(value.name.text)
    ) {
      return value.name.text;
    }
    return null;
  }

  private methodAccess(expr: ts.Expression): string | null {
    const value = unwrapExpression(expr);
    if (
      ts.isPropertyAccessExpression(value) && value.expression.kind === ts.SyntaxKind.ThisKeyword &&
      this.methodNames.has(value.name.text)
    ) {
      return value.name.text;
    }
    return null;
  }

  lowerRoot(expr: ts.Expression): SpikeTreeNode {
    const root = unwrapExpression(expr);
    if (ts.isJsxElement(root)) {
      return this.lowerElement(
        root.openingElement.tagName,
        root.openingElement.attributes,
        [...root.children],
        [0],
        root,
      );
    }
    if (ts.isJsxSelfClosingElement(root)) {
      return this.lowerElement(root.tagName, root.attributes, [], [0], root);
    }
    return this.fail(root, 'OEC9007', 'render() must return a single JSX element');
  }

  private normalizeAttributeName(name: string): string {
    return name === 'className' ? 'class' : name;
  }

  private lowerElement(
    tagNameNode: ts.JsxTagNameExpression,
    attributes: ts.JsxAttributes,
    children: ts.JsxChild[],
    path: number[],
    sourceNode: ts.Node,
    staticOnly = false,
  ): SpikeTreeNode {
    const tag = tagNameNode.getText(this.sf);
    // alpha.8: custom-element hosts (<x-y>) are admitted as nested hosts — the
    // page/layout composition renders them as host tags that the server entry
    // expands per the SSR admission plan. They carry static literal attributes
    // or this.<property> bindings (lowered as prop Parts so the server
    // serializer emits them as host attributes and the client claim assigns
    // them as JS properties). Children are the host's light content (slot
    // projection is platform behavior) and lower with the ordinary grammar;
    // event handlers and refs on hosts still fail closed.
    const isCustomHost = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(tag);
    if (!/^[a-z][a-z0-9]*$/.test(tag) && !isCustomHost) {
      this.fail(
        tagNameNode,
        'OEC9010',
        `component tag <${tag}> is outside the compiler grammar (intrinsic lowercase elements and custom-element hosts only)`,
      );
    }
    const attrs: Array<[string, string]> = [];
    const elementId = this.reserveElement(tag, path, sourceNode);
    const attributeNames = new Set<string>();
    for (const prop of attributes.properties) {
      if (ts.isJsxSpreadAttribute(prop)) {
        this.fail(prop, 'OEC9011', 'spread attributes are not supported by the compiler grammar');
      }
      const name = this.normalizeAttributeName(prop.name.getText(this.sf));
      const init = prop.initializer;
      const isDynamicEvent = /^on[A-Z]/.test(name) && init !== undefined &&
        ts.isJsxExpression(init) && init.expression !== undefined;
      if (isCustomHost && (isDynamicEvent || /^on[A-Z]/.test(name))) {
        this.fail(prop, 'OEC9017', `custom-element host <${tag}> may not carry event handlers`);
      }
      if (!isSafeAttributeName(name) && !isDynamicEvent) {
        this.fail(prop, 'OEC9011', `attribute name "${name}" is unsafe`);
      }
      const attributeKey = name.toLowerCase();
      if (attributeNames.has(attributeKey)) {
        this.fail(prop, 'OEC9011', `duplicate attribute "${name}" is unsupported`);
      }
      attributeNames.add(attributeKey);
      if (!init) {
        attrs.push([name, '']);
        continue;
      }
      if (ts.isStringLiteral(init)) {
        attrs.push([name, init.text]);
        continue;
      }
      if (!ts.isJsxExpression(init) || !init.expression) {
        this.fail(
          prop,
          'OEC9011',
          `attribute "${name}" must be a literal or a supported expression`,
        );
      }
      const expr = unwrapExpression(init.expression);
      if (/^on[A-Z]/.test(name)) {
        if (staticOnly) this.fail(prop, 'OEC9012', 'Region branches must be fully static');
        this.lowerEvent(name, expr, path, prop, elementId);
        continue;
      }
      if (name === 'ref') {
        if (isCustomHost) {
          this.fail(prop, 'OEC9017', `custom-element host <${tag}> may not carry a ref`);
        }
        if (staticOnly) this.fail(prop, 'OEC9012', 'Region branches must be fully static');
        const ref = this.fieldAccess(expr);
        if (!ref) this.fail(prop, 'OEC9011', 'ref must reference this.<field>');
        this.addPart({ k: 'ref', ref, path }, path, prop, elementId);
        continue;
      }
      const field = this.fieldAccess(expr);
      if (field) {
        if (staticOnly) this.fail(prop, 'OEC9012', 'Region branches must be fully static');
        if (isCustomHost) {
          // Host attributes cross the SSR boundary as host attributes: lower
          // every dynamic host attribute as a prop Part so the serializer
          // emits it and the client claim assigns it as a JS property.
          this.addPart({ k: 'prop', signal: field, name, path }, path, prop, elementId);
          continue;
        }
        this.lowerDynamicAttribute(name, field, tag, path, prop, elementId);
        continue;
      }
      const literal = literalValue(expr, this.sf);
      if (literal === undefined) {
        this.fail(
          prop,
          'OEC9011',
          `attribute "${name}" must be a literal, this.<property>, or a supported expression`,
        );
      }
      const text = primitiveText(literal);
      if (text === null) {
        this.fail(prop, 'OEC9011', `attribute "${name}" only accepts primitive literal values`);
      }
      if (literal === false || literal === null) continue;
      attrs.push([name, literal === true ? '' : text ?? '']);
    }

    if (
      !isCustomHost &&
      this.parts.some((part) =>
        part.k === 'html' && part.path.length === path.length &&
        part.path.every((value, index) => value === path[index])
      ) && children.some((child) => hasMeaningfulJsxChild(this.sf, child))
    ) {
      this.fail(
        sourceNode,
        'OEC9026',
        'an innerHTML sink target must be otherwise childless (the sink owns its content)',
      );
    }

    const lowered: SpikeTreeNode[] = [];
    for (const child of children) {
      const childPath = [...path, lowered.length];
      if (ts.isJsxText(child)) {
        const value = child.getText(this.sf).replace(/\s+/g, ' ');
        if (value.trim().length === 0) continue;
        lowered.push({ k: 'text', value });
        continue;
      }
      if (ts.isJsxExpression(child)) {
        const loweredChild = this.lowerExpressionChild(child, staticOnly, childPath);
        if (loweredChild) lowered.push(loweredChild);
        continue;
      }
      if (ts.isJsxElement(child)) {
        lowered.push(
          this.lowerElement(
            child.openingElement.tagName,
            child.openingElement.attributes,
            [...child.children],
            childPath,
            child,
            staticOnly,
          ),
        );
        continue;
      }
      if (ts.isJsxSelfClosingElement(child)) {
        lowered.push(
          this.lowerElement(child.tagName, child.attributes, [], childPath, child, staticOnly),
        );
        continue;
      }
      this.fail(child, 'OEC9013', 'JSX fragments and spreads are outside the compiler grammar');
    }
    if (VOID_TAGS.has(tag)) {
      const child = children.find((candidate) => hasMeaningfulJsxChild(this.sf, candidate));
      if (child) {
        this.fail(child, 'OEC9013', `void element <${tag}> may not have children`);
      }
    }
    return this.addElement(elementId, tag, attrs, lowered);
  }

  private lowerEvent(
    attributeName: string,
    expr: ts.Expression,
    path: number[],
    sourceNode: ts.Node,
    elementId: string,
  ): number {
    const action = this.eventAction(expr, sourceNode);
    return this.addPart(
      {
        k: 'event',
        event: attributeName.slice(2).toLowerCase(),
        handler: action.handler,
        action: action.action,
        path,
      },
      path,
      sourceNode,
      elementId,
    );
  }

  private eventAction(
    expr: ts.Expression,
    sourceNode: ts.Node,
  ): { handler: string; action: SpikeEventAction } {
    const method = this.methodAccess(expr);
    if (method) return { handler: method, action: { kind: 'method', name: method } };
    if (!ts.isArrowFunction(expr) || expr.parameters.length > 1) {
      this.fail(
        sourceNode,
        'OEC9016',
        'event handlers must be this.<method> or a single-action arrow',
      );
    }
    const expression = ts.isBlock(expr.body)
      ? expr.body.statements.length === 1 && ts.isExpressionStatement(expr.body.statements[0])
        ? expr.body.statements[0].expression
        : undefined
      : expr.body;
    if (!expression) {
      this.fail(
        sourceNode,
        'OEC9016',
        'event arrow handlers must contain exactly one supported action',
      );
    }
    const action = this.parseEventMutation(expression, sourceNode);
    let name = `__compiledEvent${this.generatedHandlers.length}`;
    while (this.methodNames.has(name) || this.fieldNames.has(name)) name = `_${name}`;
    this.methodNames.add(name);
    this.generatedHandlers.push({ name, action, node: expr });
    this.addSource(`handler:${name}`, 'handler', expr);
    return { handler: name, action };
  }

  private parseEventMutation(expr: ts.Expression, near: ts.Node): SpikeEventAction {
    const value = unwrapExpression(expr);
    const assertWritable = (signal: string): void => {
      if (this.computedNames.has(signal)) {
        this.fail(
          near,
          'OEC9024',
          `event actions may not write computed field "${signal}" — assign its source properties`,
        );
      }
    };
    if (ts.isPostfixUnaryExpression(value) || ts.isPrefixUnaryExpression(value)) {
      const signal = this.fieldAccess(value.operand);
      if (
        !signal ||
        (value.operator !== ts.SyntaxKind.PlusPlusToken &&
          value.operator !== ts.SyntaxKind.MinusMinusToken)
      ) {
        this.fail(near, 'OEC9016', 'event mutations support only this.<number>++ or --');
      }
      assertWritable(signal!);
      return {
        kind: value.operator === ts.SyntaxKind.PlusPlusToken ? 'increment' : 'decrement',
        signal: signal!,
      };
    }
    if (ts.isBinaryExpression(value)) {
      const signal = this.fieldAccess(value.left);
      const literal = literalValue(value.right, this.sf);
      if (!signal || literal === undefined) {
        this.fail(near, 'OEC9016', 'event assignment values must be serializable literals');
      }
      assertWritable(signal!);
      if (value.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        return { kind: 'assign', signal, value: literal! };
      }
      if (
        (value.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken ||
          value.operatorToken.kind === ts.SyntaxKind.MinusEqualsToken) &&
        typeof literal === 'number'
      ) {
        return {
          kind: value.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken ? 'add' : 'subtract',
          signal,
          value: literal,
        };
      }
      this.fail(near, 'OEC9016', 'event arithmetic supports only numeric += or -= literals');
    }
    if (ts.isCallExpression(value) && value.arguments.length === 0) {
      const method = this.methodAccess(value.expression);
      if (method) return { kind: 'call', name: method };
    }
    this.fail(
      near,
      'OEC9016',
      'unsupported event action; use this.<field>++, assignment or this.<method>()',
    );
  }

  private lowerDynamicAttribute(
    name: string,
    signal: string,
    tag: string,
    path: number[],
    sourceNode: ts.Node,
    elementId: string,
  ): void {
    const lowerName = name.toLowerCase();
    if (name === 'class') {
      this.addPart({ k: 'class', signal, path }, path, sourceNode, elementId);
      return;
    }
    if (name === 'style') {
      this.addPart({ k: 'style', signal, path }, path, sourceNode, elementId);
      return;
    }
    if (name === 'innerHTML') {
      // Trusted-HTML sink (alpha.8): pre-sanitized build-time content only.
      // The field must be string-typed; the target must be childless (checked
      // by the program validator, which also rejects raw-text targets).
      if (this.fieldTypes.get(signal) !== 'string') {
        this.fail(sourceNode, 'OEC9026', 'innerHTML sinks require a string-typed property');
      }
      if (VOID_TAGS.has(tag)) {
        this.fail(sourceNode, 'OEC9026', `void element <${tag}> cannot carry an innerHTML sink`);
      }
      this.addPart({ k: 'html', signal, path }, path, sourceNode, elementId);
      return;
    }
    if (BOOLEAN_ATTRIBUTES.has(lowerName)) {
      this.addPart({ k: 'bool', signal, name, path }, path, sourceNode, elementId);
      return;
    }
    if (name === 'value' || DOM_PROPERTY_NAMES.has(name) || (tag === 'input' && name === 'value')) {
      this.addPart({ k: 'prop', signal, name, path }, path, sourceNode, elementId);
      return;
    }
    this.addPart({ k: 'attr', signal, name, path }, path, sourceNode, elementId);
  }

  private lowerExpressionChild(
    child: ts.JsxExpression,
    staticOnly: boolean,
    path: number[],
  ): SpikeTreeNode | null {
    if (!child.expression) return null;
    const expr = unwrapExpression(child.expression);
    const field = this.fieldAccess(expr);
    if (field) {
      if (staticOnly) this.fail(child, 'OEC9012', 'Region branches must be fully static');
      const index = this.addPart({ k: 'text', signal: field }, path, child);
      return { k: 'part', id: `p${index}`, index };
    }
    const literal = literalValue(expr, this.sf);
    if (literal !== undefined) {
      const text = primitiveText(literal);
      if (text === null) {
        this.fail(child, 'OEC9013', 'dynamic child literals must be primitive values');
      }
      if (text === '') return null;
      return { k: 'text', value: text ?? '' };
    }
    if (ts.isConditionalExpression(expr)) {
      if (staticOnly) {
        this.fail(child, 'OEC9012', 'nested Regions are outside the compiler grammar');
      }
      const test = this.parseCondition(expr.condition, child);
      const on = this.lowerStaticBranch(expr.whenTrue, child);
      const off = this.lowerStaticBranch(expr.whenFalse, child);
      const gt = test.value as number;
      const index = this.addPart(
        { k: 'when', signal: test.signal, gt, test, on: [on], off: [off] },
        path,
        child,
      );
      return { k: 'part', id: `p${index}`, index };
    }
    if (ts.isCallExpression(expr)) {
      if (staticOnly) {
        this.fail(child, 'OEC9012', 'nested Regions are outside the compiler grammar');
      }
      return this.lowerEach(expr, child, path);
    }
    this.fail(
      child,
      'OEC9013',
      'unsupported dynamic expression; use this.<property>, a supported condition, or this.<array>.map(...)',
    );
  }

  private parseCondition(expr: ts.Expression, near: ts.Node): SpikeCondition {
    const condition = unwrapExpression(expr);
    if (ts.isBinaryExpression(condition)) {
      const signal = this.fieldAccess(condition.left);
      const value = literalValue(condition.right, this.sf);
      if (
        signal && typeof value === 'number' && Number.isFinite(value) &&
        condition.operatorToken.kind === ts.SyntaxKind.GreaterThanToken
      ) {
        return { signal, op: 'greater-than', value };
      }
    }
    this.fail(
      near,
      'OEC9013',
      'conditional Regions support only this.<property> > a finite numeric literal',
    );
  }

  private lowerStaticBranch(expr: ts.Expression, near: ts.Node): SpikeTreeNode {
    const branch = unwrapExpression(expr);
    if (ts.isJsxElement(branch)) {
      return this.lowerElement(
        branch.openingElement.tagName,
        branch.openingElement.attributes,
        [...branch.children],
        [],
        branch,
        true,
      );
    }
    if (ts.isJsxSelfClosingElement(branch)) {
      return this.lowerElement(branch.tagName, branch.attributes, [], [], branch, true);
    }
    this.fail(near, 'OEC9012', 'conditional Region branches must be single static JSX elements');
  }

  private lowerEach(expr: ts.CallExpression, near: ts.Node, path: number[]): SpikeTreeNode {
    const callee = expr.expression;
    if (
      !ts.isPropertyAccessExpression(callee) || callee.name.text !== 'map' ||
      expr.arguments.length !== 1
    ) {
      this.fail(near, 'OEC9013', 'list Regions support exactly this.<property>.map(...)');
    }
    const signal = this.fieldAccess(callee.expression);
    if (!signal) this.fail(near, 'OEC9013', 'list Regions must map over this.<property>');
    const arrow = expr.arguments[0];
    if (
      !ts.isArrowFunction(arrow) || arrow.parameters.length !== 1 ||
      !ts.isIdentifier(arrow.parameters[0].name)
    ) {
      this.fail(near, 'OEC9013', 'list Region mapper must be a single-parameter arrow function');
    }
    if (ts.isBlock(arrow.body)) {
      this.fail(near, 'OEC9013', 'list Region mapper must return one JSX element');
    }
    const body = unwrapExpression(arrow.body);
    if (!ts.isJsxElement(body) && !ts.isJsxSelfClosingElement(body)) {
      this.fail(near, 'OEC9013', 'list Region mapper must return one JSX element');
    }
    const param = arrow.parameters[0].name.text;
    const attributes = ts.isJsxElement(body) ? body.openingElement.attributes : body.attributes;
    let key: string | null = null;
    for (const prop of attributes.properties) {
      if (!ts.isJsxAttribute(prop)) {
        this.fail(prop, 'OEC9011', 'list Region items do not support spread attributes');
      }
      if (prop.name.getText(this.sf) !== 'key') continue;
      if (key !== null) this.fail(prop, 'OEC9014', 'list Region items may declare key only once');
      if (
        !prop.initializer || !ts.isJsxExpression(prop.initializer) || !prop.initializer.expression
      ) {
        this.fail(prop, 'OEC9014', 'key must be key={<item>.<field>}');
      }
      const keyExpr = unwrapExpression(prop.initializer.expression);
      if (
        ts.isPropertyAccessExpression(keyExpr) && ts.isIdentifier(keyExpr.expression) &&
        keyExpr.expression.text === param && isIdentifier(keyExpr.name.text)
      ) {
        key = keyExpr.name.text;
      } else {
        this.fail(prop, 'OEC9014', `key must reference ${param}.<field>`);
      }
    }
    if (!key) this.fail(body, 'OEC9014', 'list Region items require key={<item>.<field>}');

    const itemFields: string[] = [];
    const item = this.lowerItemElement(body, param, itemFields, [], true);
    const uniqueFields = [...new Set(itemFields)];
    if (uniqueFields.length === 0) {
      this.fail(
        body,
        'OEC9013',
        'list Region items must bind at least one {<item>.<field>} value or attribute slot',
      );
    }
    const index = this.addPart(
      {
        k: 'each',
        signal: signal!,
        key: key!,
        // Single-field templates keep the Region-level field restatement;
        // multi-field templates omit it — every ival/iattrs slot owns its own.
        ...(uniqueFields.length === 1 ? { field: uniqueFields[0] } : {}),
        item: [item],
      },
      path,
      near,
    );
    return { k: 'part', id: `p${index}`, index };
  }

  private lowerItemElement(
    element: ts.JsxElement | ts.JsxSelfClosingElement,
    param: string,
    itemFields: string[],
    path: number[],
    allowKey = false,
  ): SpikeTreeNode {
    const tagName = ts.isJsxElement(element) ? element.openingElement.tagName : element.tagName;
    const attributes = ts.isJsxElement(element)
      ? element.openingElement.attributes
      : element.attributes;
    const tag = tagName.getText(this.sf);
    // alpha.8: item templates may nest custom-element hosts (e.g. an island
    // per row) as empty static shells — static literal attributes only, no
    // children (slots are outside grammar v1). The server serializer emits
    // them verbatim and the client instantiates them per item.
    const isCustomHost = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(tag);
    if (!/^[a-z][a-z0-9]*$/.test(tag) && !isCustomHost) {
      this.fail(tagName, 'OEC9010', 'list Region item must be an intrinsic lowercase element');
    }
    const elementId = this.reserveElement(tag, path, element);
    const attrs: Array<[string, string]> = [];
    const iattrs: Array<[string, string]> = [];
    const attributeNames = new Set<string>();
    for (const prop of attributes.properties) {
      if (!ts.isJsxAttribute(prop)) {
        this.fail(prop, 'OEC9011', 'spread attributes are not supported in item templates');
      }
      const name = this.normalizeAttributeName(prop.name.getText(this.sf));
      if (name === 'key') {
        if (!allowKey) {
          this.fail(prop, 'OEC9011', 'key is only supported on the list Region item root');
        }
        continue;
      }
      if (!isSafeAttributeName(name)) {
        this.fail(prop, 'OEC9011', `attribute name "${name}" is unsafe`);
      }
      const attributeKey = name.toLowerCase();
      if (attributeNames.has(attributeKey)) {
        this.fail(prop, 'OEC9011', `duplicate attribute "${name}" is unsupported`);
      }
      attributeNames.add(attributeKey);
      if (!prop.initializer) {
        attrs.push([name, '']);
        continue;
      }
      if (ts.isStringLiteral(prop.initializer)) {
        attrs.push([name, prop.initializer.text]);
        continue;
      }
      if (!ts.isJsxExpression(prop.initializer) || !prop.initializer.expression) {
        this.fail(prop, 'OEC9011', 'item template attributes must be static literals');
      }
      // alpha.8: per-item attribute slots — `name={item.<field>}` resolves from
      // the current item at mount/claim (true emits a bare attribute, falsy
      // omits it, anything else serializes with String()).
      const attrExpr = unwrapExpression(prop.initializer.expression);
      if (
        ts.isPropertyAccessExpression(attrExpr) && ts.isIdentifier(attrExpr.expression) &&
        attrExpr.expression.text === param && isIdentifier(attrExpr.name.text)
      ) {
        itemFields.push(attrExpr.name.text);
        iattrs.push([name, attrExpr.name.text]);
        continue;
      }
      const literal = literalValue(prop.initializer.expression, this.sf);
      if (literal === undefined) {
        this.fail(
          prop,
          'OEC9011',
          `item template attribute "${name}" must be a static literal or {${param}.<field>}`,
        );
      }
      const text = primitiveText(literal);
      if (text === null) {
        this.fail(prop, 'OEC9011', 'item template attributes must use primitive literals');
      }
      if (literal === false || literal === null) continue;
      attrs.push([name, literal === true ? '' : text ?? '']);
    }
    const children: SpikeTreeNode[] = [];
    const rawChildren = ts.isJsxElement(element) ? [...element.children] : [];
    if (VOID_TAGS.has(tag)) {
      const child = rawChildren.find((candidate) => hasMeaningfulJsxChild(this.sf, candidate));
      if (child) this.fail(child, 'OEC9013', `void element <${tag}> may not have children`);
    }
    if (isCustomHost && rawChildren.some((child) => hasMeaningfulJsxChild(this.sf, child))) {
      this.fail(
        element,
        'OEC9017',
        `custom-element host <${tag}> may not have children in the compiler grammar (slots are unsupported)`,
      );
    }
    for (const child of rawChildren) {
      const childPath = [...path, children.length];
      if (ts.isJsxText(child)) {
        const text = child.getText(this.sf).replace(/\s+/g, ' ');
        if (text.trim()) children.push({ k: 'text', value: text });
        continue;
      }
      if (ts.isJsxExpression(child) && child.expression) {
        const expr = unwrapExpression(child.expression);
        if (
          ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression) &&
          expr.expression.text === param && isIdentifier(expr.name.text)
        ) {
          itemFields.push(expr.name.text);
          children.push({ k: 'ival', field: expr.name.text });
          continue;
        }
        this.fail(child, 'OEC9013', `item child must be {${param}.<field>}`);
      }
      if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
        children.push(this.lowerItemElement(child, param, itemFields, childPath));
        continue;
      }
      this.fail(
        child,
        'OEC9013',
        'item templates support static text, item values and intrinsic elements',
      );
    }
    return this.addElement(elementId, tag, attrs, children, iattrs);
  }
}

function propertyFields(
  sf: ts.SourceFile,
  classNode: ts.ClassDeclaration,
  fail: (node: ts.Node, code: string, message: string) => never,
): {
  fields: SpikeField[];
  methods: ts.MethodDeclaration[];
  render: ts.MethodDeclaration;
  stylesText?: string;
} {
  const fields: SpikeField[] = [];
  const methods: ts.MethodDeclaration[] = [];
  let render: ts.MethodDeclaration | null = null;
  let stylesText: string | undefined;
  const names = new Set<string>();
  const propertyAttributeNames = new Set<string>();
  for (const member of classNode.members) {
    if (ts.isPropertyDeclaration(member)) {
      const modifiers = ts.getModifiers(member) ?? [];
      // alpha.8: `static styles = <expr>` is the one static member a compiled
      // class may carry — the facade's compiled style scope consumes it
      // (adoptedStyleSheets for shadow roots, a document-head sink for light
      // roots). The initializer is copied verbatim; it typically references a
      // StyleSheet built in a non-compiled module (compiled modules ban
      // runtime top-level statements). Raw-text <style>/<script> elements are
      // rejected from templates by the serializer, so styles never inline.
      if (
        modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) &&
        ts.isIdentifier(member.name) && member.name.text === 'styles' &&
        (ts.getDecorators(member) ?? []).length === 0
      ) {
        if (!member.initializer) {
          fail(member, 'OEC9005', 'static styles requires an initializer');
        }
        if (stylesText !== undefined) {
          fail(member, 'OEC9005', 'compiled classes may declare static styles only once');
        }
        stylesText = member.initializer.getText(sf);
        continue;
      }
      const accessibilityModifiers = modifiers.filter((modifier) =>
        modifier.kind === ts.SyntaxKind.PublicKeyword ||
        modifier.kind === ts.SyntaxKind.ProtectedKeyword ||
        modifier.kind === ts.SyntaxKind.PrivateKeyword
      );
      const hasUnsupportedModifier = modifiers.some((modifier) =>
        modifier.kind !== ts.SyntaxKind.PublicKeyword &&
        modifier.kind !== ts.SyntaxKind.ProtectedKeyword &&
        modifier.kind !== ts.SyntaxKind.PrivateKeyword
      );
      if (
        hasUnsupportedModifier ||
        accessibilityModifiers.length > 1 || member.questionToken || member.exclamationToken
      ) {
        fail(
          member,
          'OEC9005',
          'compiled @property fields must be ordinary initialized instance fields',
        );
      }
      const decorators = ts.getDecorators(member) ?? [];
      if (decorators.length !== 1) {
        fail(member, 'OEC9005', 'compiled fields must carry exactly one @property decorator');
      }
      const decorator = decorators[0];
      const call = decorator.expression;
      if (!ts.isCallExpression(call) || call.expression.getText(sf) !== 'property') {
        fail(
          decorator,
          'OEC9004',
          'unknown decorator on an OpenElement member; use only @property',
        );
      }
      if (!ts.isIdentifier(member.name)) {
        fail(member, 'OEC9005', 'property names must be identifiers');
      }
      if (names.has(member.name.text)) {
        fail(member, 'OEC9005', `duplicate property "${member.name.text}"`);
      }
      names.add(member.name.text);
      if (!member.initializer) {
        fail(member, 'OEC9005', 'compiled fields require a literal initializer');
      }
      // alpha.8: computed fields derive their signal from other properties.
      // They never carry attributes, never reflect, and hold no serialized
      // default (metadata default is null; the value comes from the factory).
      const computedFieldNames = new Set(fields.filter((f) => f.computed).map((f) => f.name));
      const computedInit = parseComputedInitializer(
        member.initializer,
        sf,
        new Set(fields.filter((f) => !f.computed).map((f) => f.name)),
        computedFieldNames,
        fail,
      );
      const defaultValue = computedInit ? null : literalValue(member.initializer, sf);
      if (defaultValue === undefined) {
        fail(member.initializer, 'OEC9020', 'property defaults must be serializable literals');
      }
      const options = call.arguments.length === 1 ? call.arguments[0] : undefined;
      if (!options || !ts.isObjectLiteralExpression(options)) {
        fail(decorator, 'OEC9005', '@property requires one options object literal');
      }
      let reflect = false;
      let attribute: string | null | undefined;
      let explicitType:
        | { label: PropertyValueType; constructorName: SpikeField['typeConstructor'] }
        | undefined;
      let explicitConverter: PropertyValueType | undefined;
      const optionNames = new Set<string>();
      for (const entry of options.properties) {
        if (!ts.isPropertyAssignment(entry) || entry.name.getText(sf).length === 0) {
          fail(entry, 'OEC9022', '@property options must be named literal assignments');
        }
        const optionName = entry.name.getText(sf);
        if (optionNames.has(optionName)) {
          fail(entry, 'OEC9022', `@property option "${optionName}" may appear only once`);
        }
        optionNames.add(optionName);
        if (optionName === 'reflect') {
          if (
            entry.initializer.kind !== ts.SyntaxKind.TrueKeyword &&
            entry.initializer.kind !== ts.SyntaxKind.FalseKeyword
          ) {
            fail(entry, 'OEC9005', '@property reflect must be a boolean literal');
          }
          reflect = entry.initializer.kind === ts.SyntaxKind.TrueKeyword;
          continue;
        }
        if (optionName === 'attribute') {
          if (entry.initializer.kind === ts.SyntaxKind.FalseKeyword) {
            attribute = null;
          } else if (ts.isStringLiteral(entry.initializer)) {
            attribute = camelToKebab(entry.initializer.text);
            if (!isSafeAttributeName(attribute)) {
              fail(entry, 'OEC9023', 'property attribute name is unsafe');
            }
          } else {
            fail(entry, 'OEC9023', 'property attribute must be a string literal or false');
          }
          continue;
        }
        if (optionName === 'type' || optionName === 'converter') {
          const type = propertyTypeFromConstructor(entry.initializer, sf, entry, fail);
          if (optionName === 'type') explicitType = type;
          else explicitConverter = type.label;
          continue;
        }
        fail(entry, 'OEC9022', `unsupported @property option "${optionName}"`);
      }
      const inferred = explicitType ?? inferPropertyType(member, defaultValue, sf);
      const converter = explicitConverter ?? inferred.label;
      if (attribute === undefined) attribute = camelToKebab(member.name.text);
      if (computedInit) {
        if (attribute !== null || reflect) {
          fail(
            member,
            'OEC9025',
            'computed fields require @property({ reflect: false, attribute: false }) — ' +
              'derived signals have no attribute channel',
          );
        }
      }
      if (attribute !== null) {
        const attributeKey = attribute.toLowerCase();
        if (propertyAttributeNames.has(attributeKey)) {
          fail(member, 'OEC9023', `duplicate property attribute "${attribute}"`);
        }
        propertyAttributeNames.add(attributeKey);
      }
      if (attribute === null && reflect) {
        fail(member, 'OEC9023', 'a property with attribute: false cannot reflect');
      }
      fields.push({
        name: member.name.text,
        reflect,
        attribute,
        type: inferred.label,
        converter,
        typeConstructor: inferred.constructorName,
        accessibility: accessibilityModifiers.length === 0
          ? ''
          : accessibilityModifiers[0].kind === ts.SyntaxKind.PublicKeyword
          ? 'public'
          : accessibilityModifiers[0].kind === ts.SyntaxKind.ProtectedKeyword
          ? 'protected'
          : 'private',
        typeText: member.type ? `: ${member.type.getText(sf)}` : '',
        initializerText: member.initializer.getText(sf),
        defaultValue,
        node: member,
        ...(computedInit ? { computed: computedInit } : {}),
      });
      continue;
    }
    if (ts.isMethodDeclaration(member)) {
      const modifiers = ts.getModifiers(member) ?? [];
      if (
        modifiers.some((modifier) =>
          modifier.kind === ts.SyntaxKind.StaticKeyword ||
          modifier.kind === ts.SyntaxKind.AbstractKeyword ||
          modifier.kind === ts.SyntaxKind.DeclareKeyword ||
          modifier.kind === ts.SyntaxKind.AccessorKeyword
        ) || !member.body
      ) {
        fail(member, 'OEC9006', 'compiled methods must be concrete instance methods');
      }
      if ((ts.getDecorators(member) ?? []).length > 0) {
        fail(member, 'OEC9004', 'methods may not carry decorators in the compiler grammar');
      }
      if (member.parameters.some((parameter) => (ts.getDecorators(parameter) ?? []).length > 0)) {
        fail(
          member,
          'OEC9004',
          'method parameters may not carry decorators in the compiler grammar',
        );
      }
      if (!ts.isIdentifier(member.name)) {
        fail(member, 'OEC9006', 'method names must be identifiers');
      }
      if (member.name.text === 'render') {
        if (render) {
          fail(member, 'OEC9007', 'compiled classes may declare only one render() method');
        }
        if (
          member.parameters.length !== 0 ||
          modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
        ) {
          fail(member, 'OEC9007', 'render() must be a synchronous zero-argument method');
        }
        render = member;
      } else {
        methods.push(member);
      }
      continue;
    }
    fail(
      member,
      'OEC9006',
      'constructors, accessors and undecorated fields are outside the compiler grammar',
    );
  }
  if (!render) fail(classNode, 'OEC9007', 'compiled classes must declare render()');
  return { fields, methods, render, stylesText };
}

function isDeclareStatement(statement: ts.Statement): boolean {
  return ts.canHaveModifiers(statement) &&
    (ts.getModifiers(statement) ?? []).some((modifier) =>
      modifier.kind === ts.SyntaxKind.DeclareKeyword
    );
}

/**
 * The one extra runtime statement a compiled module may carry: the island
 * delivery policy colocated with the class
 * (`export const openElement = defineIslandConfig({ ... })`). The statement is
 * validated here and copied verbatim into the generated module; the runtime
 * defineIslandConfig() validates the descriptor itself at module evaluation.
 * Anything else stays outside the compiled module grammar (OEC9008).
 */
function isIslandConfigStatement(sf: ts.SourceFile, statement: ts.Statement): boolean {
  if (!ts.isVariableStatement(statement)) return false;
  const modifiers = ts.getModifiers(statement) ?? [];
  if (
    modifiers.length !== 1 || modifiers[0].kind !== ts.SyntaxKind.ExportKeyword
  ) {
    return false;
  }
  const declarations = statement.declarationList.declarations;
  if (declarations.length !== 1) return false;
  const declaration = declarations[0];
  if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'openElement') {
    return false;
  }
  const initializer = declaration.initializer;
  if (!initializer || !ts.isCallExpression(initializer)) return false;
  if (initializer.expression.getText(sf) !== 'defineIslandConfig') return false;
  if (
    initializer.arguments.length !== 1 || !ts.isObjectLiteralExpression(initializer.arguments[0])
  ) {
    return false;
  }
  return true;
}

function hasRuntimeOpenElementImport(sf: ts.SourceFile): boolean {
  return sf.statements.some((statement) => {
    if (
      !ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== '@openelement/element'
    ) {
      return false;
    }
    if (statement.importClause?.isTypeOnly) return false;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) return false;
    return bindings.elements.some((element) =>
      (element.propertyName?.text ?? element.name.text) === 'OpenElement'
    );
  });
}

/** True when the module has a runtime (non-type-only) named import of `name`. */
function hasRuntimeNamedImport(sf: ts.SourceFile, name: string): boolean {
  return sf.statements.some((statement) => {
    if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly) return false;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) return false;
    return bindings.elements.some((element) => element.name.text === name);
  });
}

/**
 * Path-addressed fixed Parts can use DOM child indexes only before any dynamic
 * anchor. An anchor expands to multiple DOM nodes, so accepting a fixed sink
 * after one would make server output, fresh creation and claim address
 * different nodes. The v1 location id remains the identity; this guard keeps
 * the path retained for seed consumers safe until they consume that id.
 */
function assertPathSafety(program: PartProgramSpike): void {
  for (const part of program.parts) {
    if (part.k === 'text' || part.k === 'when' || part.k === 'each') continue;
    let nodes = program.template;
    for (const target of part.path) {
      for (let sibling = 0; sibling < target; sibling++) {
        if (nodes[sibling]?.k === 'part') {
          const source = program.sourceMap.records.find((record) => record.id === `p${part.index}`)
            ?.source;
          throw new CompiledSpikeError([{
            code: 'OEC9015',
            message:
              `${part.k} part path [${part.path.join(',')}] is preceded by a dynamic anchor; ` +
              'path-addressed fixed sinks must appear before any dynamic anchor sibling',
            file: source?.file ?? program.sourceMap.file,
            line: source?.start.line ?? 1,
            character: source?.start.column ?? 1,
            start: source?.start.offset ?? 0,
            end: source?.end.offset ?? 0,
          }]);
        }
      }
      const next = nodes[target];
      nodes = next?.k === 'el' ? next.children : [];
    }
  }
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function runtimePropsText(fields: SpikeField[]): string[] {
  const lines = ['const __compiledProps = {'];
  for (const field of fields) {
    if (field.computed) {
      lines.push(
        `  ${field.name}: { type: Object, default: undefined, reflect: false, attribute: false },`,
      );
      continue;
    }
    const attribute = field.attribute === null ? 'false' : JSON.stringify(field.attribute);
    lines.push(
      `  ${field.name}: { type: ${field.typeConstructor}, default: ${field.initializerText}, ` +
        `reflect: ${field.reflect}, attribute: ${attribute} },`,
    );
  }
  lines.push('};');
  return lines;
}

function generatedHandlerText(handler: GeneratedHandler): string {
  const action = handler.action;
  if (action.kind === 'method') return `  ${handler.name}(): void { this.${action.name}(); }`;
  if (action.kind === 'call') return `  ${handler.name}(): void { this.${action.name}(); }`;
  if (action.kind === 'increment') return `  ${handler.name}(): void { this.${action.signal}++; }`;
  if (action.kind === 'decrement') return `  ${handler.name}(): void { this.${action.signal}--; }`;
  if (action.kind === 'add') {
    return `  ${handler.name}(): void { this.${action.signal} += ${action.value}; }`;
  }
  if (action.kind === 'subtract') {
    return `  ${handler.name}(): void { this.${action.signal} -= ${action.value}; }`;
  }
  if (action.kind === 'assign') {
    return `  ${handler.name}(): void { this.${action.signal} = ${JSON.stringify(action.value)}; }`;
  }
  return `  ${handler.name}(): void {}`;
}

export function compileElementSpike(source: string, fileName: string): CompileSpikeResult {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  const syntaxDiagnostics = ts.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).diagnostics ?? [];
  if (syntaxDiagnostics.length > 0) {
    throw new CompiledSpikeError([parseDiagnostic(sf, syntaxDiagnostics[0])]);
  }

  function fail(node: ts.Node, code: string, message: string): never {
    throw new CompiledSpikeError([diagnosticAt(sf, node, code, message)]);
  }

  const passthroughStatements: string[] = [];
  for (const statement of sf.statements) {
    if (
      ts.isImportDeclaration(statement) || ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) ||
      ts.isModuleDeclaration(statement) || isDeclareStatement(statement)
    ) continue;
    // alpha.8: the island delivery policy is the one runtime statement a
    // compiled module may carry; it is validated and copied verbatim below.
    if (isIslandConfigStatement(sf, statement)) {
      passthroughStatements.push(statement.getText(sf));
      continue;
    }
    fail(
      statement,
      'OEC9008',
      'runtime top-level statements are outside the compiled module grammar',
    );
  }

  const classes = sf.statements.filter(ts.isClassDeclaration);
  const decorated = classes.filter((node) =>
    (ts.getDecorators(node) ?? []).some((decorator) => {
      const expr = decorator.expression;
      return ts.isCallExpression(expr) && expr.expression.getText(sf) === 'element';
    })
  );
  if (classes.length !== 1 || decorated.length !== 1) {
    fail(sf, 'OEC9001', 'expected exactly one @element(...) class per compiled module');
  }
  const classNode = decorated[0];
  const classDecorators = ts.getDecorators(classNode) ?? [];
  if (classDecorators.length !== 1) {
    fail(
      classNode,
      'OEC9004',
      'compiled OpenElement classes must carry exactly one @element decorator',
    );
  }
  const classModifiers = ts.getModifiers(classNode) ?? [];
  // alpha.8: the canonical route/island module default-exports its compiled
  // class, so `export default class` is admitted alongside `export class`.
  const isDefaultExport = classModifiers.some((modifier) =>
    modifier.kind === ts.SyntaxKind.DefaultKeyword
  );
  const modifiersValid = isDefaultExport
    ? classModifiers.length === 2 &&
      classModifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    : classModifiers.length === 1 && classModifiers[0].kind === ts.SyntaxKind.ExportKeyword;
  if (!modifiersValid) {
    fail(
      classNode,
      'OEC9006',
      'compiled @element classes must be exported (optionally as the default export) without other class modifiers',
    );
  }
  let tag = '';
  const decorator = classDecorators[0];
  const expr = decorator.expression;
  if (!ts.isCallExpression(expr) || expr.expression.getText(sf) !== 'element') {
    fail(decorator, 'OEC9004', 'unknown decorator on an OpenElement class; use only @element');
  }
  if (
    expr.arguments.length < 1 || expr.arguments.length > 2 ||
    !ts.isStringLiteral(expr.arguments[0])
  ) {
    fail(
      decorator,
      'OEC9002',
      '@element requires a string tag name plus an optional options object',
    );
  }
  tag = expr.arguments[0].text;
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(tag)) {
    fail(decorator, 'OEC9002', `@element tag "${tag}" is not a custom-element name`);
  }
  // alpha.8: `@element(tag, { root: 'light' | 'shadow-open' | 'shadow-closed' })`
  // selects the program root ownership mode (light content vs DSD). Pages and
  // DSD islands compile with a shadow root; the default stays light.
  // `delegatesFocus`/`formAssociated` boolean literals emit the matching class
  // statics the facade kernel consumes (shadow attach options and
  // ElementInternals association).
  let rootKind: 'light' | 'shadow-open' | 'shadow-closed' = 'light';
  let delegatesFocus = false;
  let formAssociated = false;
  if (expr.arguments.length === 2) {
    const options = expr.arguments[1];
    if (!ts.isObjectLiteralExpression(options)) {
      fail(decorator, 'OEC9002', '@element options must be an object literal');
    }
    const seenOptions = new Set<string>();
    for (const entry of options.properties) {
      if (!ts.isPropertyAssignment(entry)) {
        fail(entry, 'OEC9002', '@element options must be named literal assignments');
      }
      const optionName = entry.name.getText(sf);
      if (seenOptions.has(optionName)) {
        fail(entry, 'OEC9002', `@element option "${optionName}" may appear only once`);
      }
      seenOptions.add(optionName);
      if (optionName === 'root') {
        if (!ts.isStringLiteral(entry.initializer)) {
          fail(entry, 'OEC9002', '@element root must be a string literal');
        }
        const mode = entry.initializer.text;
        if (mode !== 'light' && mode !== 'shadow-open' && mode !== 'shadow-closed') {
          fail(
            entry,
            'OEC9002',
            `@element root "${mode}" is unsupported; use "light", "shadow-open" or "shadow-closed"`,
          );
        }
        rootKind = mode;
        continue;
      }
      if (optionName === 'delegatesFocus' || optionName === 'formAssociated') {
        if (
          entry.initializer.kind !== ts.SyntaxKind.TrueKeyword &&
          entry.initializer.kind !== ts.SyntaxKind.FalseKeyword
        ) {
          fail(entry, 'OEC9002', `@element ${optionName} must be a boolean literal`);
        }
        const value = entry.initializer.kind === ts.SyntaxKind.TrueKeyword;
        if (optionName === 'delegatesFocus') delegatesFocus = value;
        else formAssociated = value;
        continue;
      }
      fail(
        entry,
        'OEC9002',
        '@element options support only root, delegatesFocus and formAssociated',
      );
    }
  }
  const heritage = classNode.heritageClauses?.find((clause) =>
    clause.token === ts.SyntaxKind.ExtendsKeyword
  );
  if (heritage?.types.length !== 1 || heritage.types[0].expression.getText(sf) !== 'OpenElement') {
    fail(
      classNode.name ?? classNode,
      'OEC9003',
      `compiled classes must extend OpenElement (found ${
        heritage?.types[0]?.expression.getText(sf) ?? 'no base class'
      })`,
    );
  }
  if (!classNode.name) fail(classNode, 'OEC9003', 'compiled classes must be named');
  const className = classNode.name.text;
  const { fields, methods, render, stylesText } = propertyFields(sf, classNode, fail);
  const methodNames = methods.map((method) => (method.name as ts.Identifier).text);
  if (
    fields.some((field) => field.computed) && !hasRuntimeNamedImport(sf, 'computed')
  ) {
    fail(
      classNode,
      'OEC9025',
      'computed fields require a runtime import of `computed` (e.g. ' +
        "import { computed } from '@openelement/element')",
    );
  }
  const lowering = new Lowering(sf, fields, methodNames);
  const renderStatements = render.body?.statements ?? [];
  if (
    renderStatements.length !== 1 || !ts.isReturnStatement(renderStatements[0]) ||
    !renderStatements[0].expression
  ) {
    fail(render, 'OEC9007', 'render() must be a single return of one JSX element');
  }
  const returned = renderStatements[0] as ts.ReturnStatement;
  const root = lowering.lowerRoot(returned.expression!);
  if (root.k !== 'el') fail(render, 'OEC9007', 'render() must return one intrinsic JSX element');

  const metadata: CompiledElementMetadata = {
    tag,
    className,
    sourceFile: fileName,
    properties: fields.map((field) => ({
      name: field.name,
      attribute: field.attribute,
      type: field.type,
      converter: field.converter,
      reflect: field.reflect,
      default: field.defaultValue,
      ...(field.computed ? { computed: true as const, deps: field.computed.deps } : {}),
    })),
    observedAttributes: fields.flatMap((field) =>
      field.attribute === null ? [] : [field.attribute]
    ),
    cem: {
      tagName: tag,
      className,
      declaration: { name: className, module: fileName },
      attributes: fields.flatMap((field) =>
        field.attribute === null ? [] : [{
          name: field.attribute,
          fieldName: field.name,
          type: field.type,
          reflect: field.reflect,
        }]
      ),
      members: fields.map((field) => ({
        name: field.name,
        fieldName: field.name,
        type: field.type,
        attribute: field.attribute,
        reflect: field.reflect,
      })),
    },
  };
  const sourceRecords: ProgramSourceRecord[] = [
    { id: 'root', kind: 'root', source: sourceRange(sf, render) },
    ...fields.map((field) => ({
      id: `property:${field.name}`,
      kind: 'property' as const,
      source: sourceRange(sf, field.node),
    })),
    ...lowering.sourceRecords,
  ];
  const program: PartProgramSpike = {
    version: 1,
    tag,
    root: { id: 'root', kind: rootKind, nodes: [root.id] },
    template: [root],
    parts: lowering.parts,
    regions: lowering.regions,
    dependencies: lowering.dependencies,
    locations: lowering.locations,
    sourceMap: { version: 1, file: fileName, records: sourceRecords },
    metadata,
  };
  assertPathSafety(program);
  validatePartProgram(program);

  const programJson = JSON.stringify(program, null, 2);
  const propertiesJson = JSON.stringify(metadata.properties, null, 2);
  const metadataJson = JSON.stringify(metadata, null, 2);
  const observedJson = JSON.stringify(metadata.observedAttributes, null, 2);
  const memberLines: string[] = [
    '  static __partProgram = __partProgram;',
    '  static __compiledProperties = __compiledProperties;',
    '  static __elementMetadata = __elementMetadata;',
    '  static props = __compiledProps;',
    '  static observedAttributes = __observedAttributes;',
  ];
  if (delegatesFocus) memberLines.push('  static delegatesFocus = true;');
  if (formAssociated) memberLines.push('  static formAssociated = true;');
  const computedFields = fields.filter((field) => field.computed);
  if (computedFields.length > 0) {
    // Derived-signal factories: each builds the field's read-only computed
    // over the instance's plain property signals (facade + renderDsd run the
    // same factories, so server output and client claim read one value set).
    memberLines.push('  static __computedFields = {');
    for (const field of computedFields) {
      memberLines.push(`    ${field.name}: ${field.computed!.factoryText},`);
    }
    memberLines.push('  };');
  }
  if (stylesText !== undefined) {
    // Copied verbatim: the facade reads static styles into the compiled style
    // scope (adoptedStyleSheets on shadow roots, a document-head sink on light
    // roots); the serializer inlines them as the marked DSD <style> element.
    memberLines.push(`  static styles = ${stylesText};`);
  }
  for (const field of fields) {
    // Computed fields carry no initializer on the generated class: the
    // prototype accessor reads the derived signal, and an own data property
    // would shadow it.
    if (field.computed) continue;
    const accessibility = field.accessibility ? `${field.accessibility} ` : '';
    memberLines.push(
      `  ${accessibility}${field.name}${field.typeText} = ${field.initializerText};`,
    );
  }
  for (const method of methods) {
    memberLines.push(...method.getText(sf).split('\n').map((line) => `  ${line}`));
  }
  for (const handler of lowering.generatedHandlers) memberLines.push(generatedHandlerText(handler));
  memberLines.push(
    '  render(): never {',
    '    throw new Error(',
    `      '[open:compiled-element] ${tag} is compiled to a Part Program; ` +
      "the runtime JSX render path is not available in 0.44.',",
    '    );',
    '  }',
  );

  const imports = sf.statements.filter(ts.isImportDeclaration).map((statement) =>
    statement.getText(sf)
  );
  if (!hasRuntimeOpenElementImport(sf)) {
    imports.unshift("import { OpenElement } from '@openelement/element';");
  }
  const codeLines = [
    '// <auto-generated by open:compiled-element; v0.44.0-alpha.1 - do not edit>',
    ...imports,
    '',
    ...passthroughStatements,
    ...(passthroughStatements.length > 0 ? [''] : []),
    `const __partProgram = ${programJson};`,
    '',
    `const __compiledProperties = ${propertiesJson};`,
    '',
    `const __elementMetadata = ${metadataJson};`,
    '',
    `const __observedAttributes = ${observedJson};`,
    '',
    ...runtimePropsText(fields),
    '',
    `export ${isDefaultExport ? 'default ' : ''}class ${className} extends OpenElement {`,
    ...memberLines,
    '}',
    '',
    'export { __partProgram, __elementMetadata };',
  ];
  const sourceMap = {
    version: 3,
    file: fileName,
    sources: [fileName],
    names: [],
    mappings: '',
    sourcesContent: [source],
    x_openElement: program.sourceMap,
  };
  codeLines.push(
    `//# sourceMappingURL=data:application/json;base64,${encodeBase64(JSON.stringify(sourceMap))}`,
  );
  return { code: codeLines.join('\n') + '\n', program };
}
