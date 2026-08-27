/**
 * @openelement/adapter-vite — TSX-to-Part Program spike compiler (#1160).
 *
 * Recognizes exactly the alpha.0 fixture grammar:
 *   - one `@element('tag')` class extending OpenElement
 *   - `@property({ reflect: boolean })` class fields with literal initializers
 *   - a render() returning one JSX tree with static elements/attributes,
 *     `{this.field}` text, `value={this.field}` on <input>, `onX={this.method}`
 *     events, `{this.field > N ? a : b}` conditional Regions and
 *     `{this.field.map((item) => <li key={item.id}>{item.text}</li>)}` keyed
 *     list Regions
 *
 * Every other construct fails closed with a source-located diagnostic
 * (OEC9xx). There is no runtime fallback: the emitted render() throws.
 */

import ts from 'typescript';
import type { PartProgramSpike, SpikePart, SpikeTreeNode } from './program.ts';

export interface SpikeDiagnostic {
  code: string;
  message: string;
  file: string;
  line: number;
  character: number;
}

export class CompiledSpikeError extends Error {
  readonly diagnostics: SpikeDiagnostic[];
  constructor(diagnostics: SpikeDiagnostic[]) {
    super(
      diagnostics
        .map((d) => `${d.file}:${d.line}:${d.character} - error ${d.code}: ${d.message}`)
        .join('\n'),
    );
    this.name = 'CompiledSpikeError';
    this.diagnostics = diagnostics;
  }
}

export interface CompileSpikeResult {
  code: string;
  program: PartProgramSpike;
}

interface SpikeField {
  name: string;
  reflect: boolean;
  typeText: string;
  initializerText: string;
}

/** Distributive input union for addPart (Omit<union> collapses; do not use). */
type SpikePartInput =
  | { k: 'text'; signal: string }
  | { k: 'prop'; signal: string; name: string; path: number[] }
  | { k: 'event'; event: string; handler: string; path: number[] }
  | { k: 'when'; signal: string; gt: number; on: SpikeTreeNode[]; off: SpikeTreeNode[] }
  | { k: 'each'; signal: string; key: string; field: string; item: SpikeTreeNode[] };

class Lowering {
  readonly parts: SpikePart[] = [];
  readonly fieldNames: Set<string>;
  readonly methodNames: Set<string>;

  constructor(
    private readonly sf: ts.SourceFile,
    fields: SpikeField[],
    methodNames: string[],
  ) {
    this.fieldNames = new Set(fields.map((field) => field.name));
    this.methodNames = new Set(methodNames);
  }

  fail(node: ts.Node, code: string, message: string): never {
    const { line, character } = this.sf.getLineAndCharacterOfPosition(node.getStart(this.sf));
    throw new CompiledSpikeError([{
      code,
      message,
      file: this.sf.fileName,
      line: line + 1,
      character: character + 1,
    }]);
  }

  private addPart(part: SpikePartInput): number {
    const index = this.parts.length;
    this.parts.push({ ...part, index } as SpikePart);
    return index;
  }

  /** `this.<name>` referencing a compiled @property field, or null. */
  private fieldAccess(expr: ts.Expression): string | null {
    if (
      ts.isPropertyAccessExpression(expr) &&
      expr.expression.kind === ts.SyntaxKind.ThisKeyword &&
      this.fieldNames.has(expr.name.text)
    ) {
      return expr.name.text;
    }
    return null;
  }

  private unwrap(expr: ts.Expression): ts.Expression {
    return ts.isParenthesizedExpression(expr) ? this.unwrap(expr.expression) : expr;
  }

  lowerRoot(expr: ts.Expression): SpikeTreeNode {
    const root = this.unwrap(expr);
    if (ts.isJsxElement(root)) {
      return this.lowerElement(root.openingElement.tagName, root.openingElement.attributes, [
        ...root.children,
      ], [0]);
    }
    if (ts.isJsxSelfClosingElement(root)) {
      return this.lowerElement(root.tagName, root.attributes, [], [0]);
    }
    return this.fail(root, 'OEC9007', 'render() must return a single JSX element');
  }

  private lowerElement(
    tagNameNode: ts.JsxTagNameExpression,
    attributes: ts.JsxAttributes,
    children: ts.JsxChild[],
    path: number[],
    staticOnly = false,
  ): SpikeTreeNode {
    const tag = tagNameNode.getText(this.sf);
    if (!/^[a-z][a-z0-9]*$/.test(tag)) {
      this.fail(
        tagNameNode,
        'OEC9010',
        `component tag <${tag}> is outside the spike grammar (intrinsic lowercase elements only)`,
      );
    }
    const attrs: Array<[string, string]> = [];
    for (const prop of attributes.properties) {
      if (ts.isJsxSpreadAttribute(prop)) {
        this.fail(prop, 'OEC9011', 'spread attributes are not supported by the spike grammar');
      }
      const name = prop.name.getText(this.sf);
      const init = prop.initializer;
      if (!init) {
        this.fail(prop, 'OEC9011', `boolean attribute "${name}" is not supported by the spike`);
      }
      if (ts.isStringLiteral(init)) {
        attrs.push([name, init.text]);
        continue;
      }
      if (!ts.isJsxExpression(init) || !init.expression) {
        this.fail(prop, 'OEC9011', `attribute "${name}" must be a string literal`);
      }
      const expr = this.unwrap(init.expression);
      if (/^on[A-Z]/.test(name)) {
        if (staticOnly) this.fail(prop, 'OEC9012', 'region branches must be fully static');
        if (
          ts.isPropertyAccessExpression(expr) &&
          expr.expression.kind === ts.SyntaxKind.ThisKeyword &&
          this.methodNames.has(expr.name.text)
        ) {
          this.addPart({
            k: 'event',
            event: name.slice(2).toLowerCase(),
            handler: expr.name.text,
            path,
          });
          continue;
        }
        this.fail(prop, 'OEC9011', `event attribute "${name}" must reference this.<method>`);
      }
      if (name === 'value' && tag === 'input') {
        if (staticOnly) this.fail(prop, 'OEC9012', 'region branches must be fully static');
        const field = this.fieldAccess(expr);
        if (!field) {
          this.fail(prop, 'OEC9011', 'input value must be a compiled this.<property> reference');
        }
        this.addPart({ k: 'prop', signal: field, name: 'value', path });
        continue;
      }
      this.fail(
        prop,
        'OEC9011',
        `attribute "${name}" expression is outside the spike grammar ` +
          '(only on<Event>={this.method} and value={this.property} on <input> are supported)',
      );
    }

    const lowered: SpikeTreeNode[] = [];
    for (const child of children) {
      if (ts.isJsxText(child)) {
        const value = child.getText(this.sf).replace(/\s+/g, ' ');
        if (value.trim().length === 0) continue;
        lowered.push({ k: 'text', value });
        continue;
      }
      if (ts.isJsxExpression(child)) {
        const loweredChild = this.lowerExpressionChild(child, staticOnly);
        if (loweredChild) lowered.push(loweredChild);
        continue;
      }
      if (ts.isJsxElement(child)) {
        lowered.push(
          this.lowerElement(
            child.openingElement.tagName,
            child.openingElement.attributes,
            [
              ...child.children,
            ],
            [...path, lowered.length],
            staticOnly,
          ),
        );
        continue;
      }
      if (ts.isJsxSelfClosingElement(child)) {
        lowered.push(
          this.lowerElement(
            child.tagName,
            child.attributes,
            [],
            [...path, lowered.length],
            staticOnly,
          ),
        );
        continue;
      }
      this.fail(child, 'OEC9013', 'JSX fragments and spreads are outside the spike grammar');
    }
    return { k: 'el', tag, attrs, children: lowered };
  }

  private lowerExpressionChild(
    child: ts.JsxExpression,
    staticOnly: boolean,
  ): SpikeTreeNode | null {
    if (!child.expression) return null; // {} formatting whitespace
    const expr = this.unwrap(child.expression);

    const textField = this.fieldAccess(expr);
    if (textField) {
      if (staticOnly) this.fail(child, 'OEC9012', 'region branches must be fully static');
      const index = this.addPart({ k: 'text', signal: textField });
      return { k: 'part', index };
    }

    if (ts.isConditionalExpression(expr)) {
      if (staticOnly) this.fail(child, 'OEC9012', 'nested regions are outside the spike grammar');
      const condition = expr.condition;
      if (
        !ts.isBinaryExpression(condition) ||
        condition.operatorToken.kind !== ts.SyntaxKind.GreaterThanToken ||
        !ts.isNumericLiteral(condition.right)
      ) {
        this.fail(
          child,
          'OEC9013',
          'conditional Regions support exactly `this.<property> > <number>` in the spike',
        );
      }
      const field = this.fieldAccess(condition.left);
      if (!field) {
        this.fail(child, 'OEC9013', 'conditional Region test must reference this.<property>');
      }
      const on = this.lowerStaticBranch(expr.whenTrue, child);
      const off = this.lowerStaticBranch(expr.whenFalse, child);
      const index = this.addPart({
        k: 'when',
        signal: field,
        gt: Number(condition.right.getText(this.sf)),
        on: [on],
        off: [off],
      });
      return { k: 'part', index };
    }

    if (ts.isCallExpression(expr)) {
      if (staticOnly) this.fail(child, 'OEC9012', 'nested regions are outside the spike grammar');
      return this.lowerEach(expr, child);
    }

    this.fail(
      child,
      'OEC9013',
      'unsupported dynamic expression; the spike grammar supports {this.<property>}, ' +
        '{this.<property> > <number> ? a : b} and {this.<property>.map((item) => <li key={item.id}>{item.text}</li>)}',
    );
  }

  private lowerStaticBranch(expr: ts.Expression, near: ts.Node): SpikeTreeNode {
    const branch = this.unwrap(expr);
    const lower = (
      tagName: ts.JsxTagNameExpression,
      attributes: ts.JsxAttributes,
      children: ts.JsxChild[],
    ): SpikeTreeNode => this.lowerElement(tagName, attributes, children, [], true);
    if (ts.isJsxElement(branch)) {
      return lower(branch.openingElement.tagName, branch.openingElement.attributes, [
        ...branch.children,
      ]);
    }
    if (ts.isJsxSelfClosingElement(branch)) {
      return lower(branch.tagName, branch.attributes, []);
    }
    this.fail(near, 'OEC9012', 'conditional Region branches must be single static JSX elements');
  }

  private lowerEach(expr: ts.CallExpression, near: ts.Node): SpikeTreeNode {
    const callee = expr.expression;
    if (
      !ts.isPropertyAccessExpression(callee) || callee.name.text !== 'map' ||
      expr.arguments.length !== 1
    ) {
      this.fail(near, 'OEC9013', 'list Regions support exactly this.<property>.map(...)');
    }
    const field = this.fieldAccess(callee.expression);
    if (!field) this.fail(near, 'OEC9013', 'list Regions must map over this.<property>');
    const arrow = expr.arguments[0];
    if (!ts.isArrowFunction(arrow) || arrow.parameters.length !== 1) {
      this.fail(near, 'OEC9013', 'list Region mapper must be a single-parameter arrow function');
    }
    const param = arrow.parameters[0].name.getText(this.sf);
    const body = this.unwrap(arrow.body as ts.Expression);
    if (!ts.isJsxElement(body) && !ts.isJsxSelfClosingElement(body)) {
      this.fail(near, 'OEC9013', 'list Region mapper must return one JSX element');
    }
    const tagName = ts.isJsxElement(body) ? body.openingElement.tagName : body.tagName;
    const attributes = ts.isJsxElement(body) ? body.openingElement.attributes : body.attributes;
    const itemChildren = ts.isJsxElement(body) ? [...body.children] : [];
    const tag = tagName.getText(this.sf);
    if (!/^[a-z][a-z0-9]*$/.test(tag)) {
      this.fail(tagName, 'OEC9010', 'list Region item must be an intrinsic lowercase element');
    }

    let key: string | null = null;
    for (const prop of attributes.properties) {
      if (!ts.isJsxAttribute(prop)) {
        this.fail(prop, 'OEC9011', 'spread attributes are not supported by the spike grammar');
      }
      const name = prop.name.getText(this.sf);
      if (name !== 'key') {
        this.fail(prop, 'OEC9011', 'list Region items support only the key attribute');
      }
      if (
        !prop.initializer || !ts.isJsxExpression(prop.initializer) ||
        !prop.initializer.expression
      ) {
        this.fail(prop, 'OEC9014', 'key must be key={<item>.<field>}');
      }
      const keyExpr = this.unwrap(prop.initializer.expression);
      if (
        ts.isPropertyAccessExpression(keyExpr) &&
        ts.isIdentifier(keyExpr.expression) &&
        keyExpr.expression.text === param
      ) {
        key = keyExpr.name.text;
      } else {
        this.fail(prop, 'OEC9014', `key must reference ${param}.<field>`);
      }
    }
    if (!key) this.fail(body, 'OEC9014', 'list Region items require key={<item>.<field>}');

    if (itemChildren.length !== 1) {
      this.fail(body, 'OEC9013', 'list Region items support exactly one {<item>.<field>} child');
    }
    const onlyChild = itemChildren[0];
    if (!ts.isJsxExpression(onlyChild) || !onlyChild.expression) {
      this.fail(onlyChild, 'OEC9013', 'list Region item child must be {<item>.<field>}');
    }
    const valueExpr = this.unwrap(onlyChild.expression!);
    let textField: string | null = null;
    if (
      ts.isPropertyAccessExpression(valueExpr) &&
      ts.isIdentifier(valueExpr.expression) &&
      valueExpr.expression.text === param
    ) {
      textField = valueExpr.name.text;
    }
    if (!textField) this.fail(onlyChild, 'OEC9013', `item child must be {${param}.<field>}`);

    const index = this.addPart({
      k: 'each',
      signal: field!,
      key: key!,
      field: textField,
      item: [{ k: 'el', tag, attrs: [], children: [{ k: 'ival' }] }],
    });
    return { k: 'part', index };
  }
}

/**
 * Verify path-addressed parts are not preceded by dynamic anchors. Path parts
 * resolve by template child index, which matches the DOM child index only when
 * no preceding sibling is a dynamic anchor (anchors expand to multiple DOM
 * nodes). Fail closed otherwise; general dynamic addressing is owned by #1161.
 */
function assertPathSafety(program: PartProgramSpike, file: string): void {
  for (const part of program.parts) {
    if (part.k !== 'prop' && part.k !== 'event') continue;
    let nodes = program.template;
    for (let depth = 0; depth < part.path.length; depth++) {
      const target = part.path[depth];
      for (let sibling = 0; sibling < target; sibling++) {
        if (nodes[sibling].k === 'part') {
          throw new CompiledSpikeError([{
            code: 'OEC9015',
            message:
              `${part.k} part path [${part.path.join(',')}] is preceded by a dynamic anchor; ` +
              'path-addressed parts must appear before any Region sibling in the spike grammar',
            file,
            line: 1,
            character: 1,
          }]);
        }
      }
      const next = nodes[target];
      nodes = next.k === 'el' ? next.children : [];
    }
  }
}

export function compileElementSpike(source: string, fileName: string): CompileSpikeResult {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);

  // Function declaration (not an arrow const): TS 6 only narrows after calls
  // to never-returning functions declared with the `function` keyword.
  function fail(node: ts.Node, code: string, message: string): never {
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    throw new CompiledSpikeError([{
      code,
      message,
      file: fileName,
      line: line + 1,
      character: character + 1,
    }]);
  }

  const classes = sf.statements.filter(ts.isClassDeclaration);
  const decorated = classes.filter((node) =>
    (ts.getDecorators(node) ?? []).some((decorator) => {
      const expr = decorator.expression;
      return ts.isCallExpression(expr) && expr.expression.getText(sf) === 'element';
    })
  );
  if (decorated.length !== 1) {
    fail(sf, 'OEC9001', 'expected exactly one @element(...) class per compiled module');
  }
  const classNode = decorated[0];

  // Class decorators: exactly one @element('<tag>'), nothing else.
  let tag = '';
  for (const decorator of ts.getDecorators(classNode) ?? []) {
    const expr = decorator.expression;
    if (ts.isCallExpression(expr) && expr.expression.getText(sf) === 'element') {
      const arg = expr.arguments[0];
      if (!arg || !ts.isStringLiteral(arg)) {
        fail(decorator, 'OEC9002', '@element requires a single string tag name');
      }
      if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(arg.text)) {
        fail(decorator, 'OEC9002', `@element tag "${arg.text}" is not a custom-element name`);
      }
      tag = arg.text;
      continue;
    }
    fail(
      decorator,
      'OEC9004',
      'unknown decorator on an OpenElement class; the spike supports only @element and @property',
    );
  }

  const heritage = classNode.heritageClauses?.find((clause) =>
    clause.token === ts.SyntaxKind.ExtendsKeyword
  );
  const baseName = heritage?.types[0]?.expression.getText(sf);
  if (baseName !== 'OpenElement') {
    fail(
      classNode.name ?? classNode,
      'OEC9003',
      `compiled classes must extend OpenElement (found ${baseName ?? 'no base class'})`,
    );
  }
  if (!classNode.name) fail(classNode, 'OEC9003', 'compiled classes must be named');
  const className = classNode.name.text;

  // Members: @property fields, plain methods, render(). Nothing else.
  const fields: SpikeField[] = [];
  const methodNames: string[] = [];
  const methodTexts: string[] = [];
  let renderMethod: ts.MethodDeclaration | null = null;

  for (const member of classNode.members) {
    if (ts.isPropertyDeclaration(member)) {
      const decorators = ts.getDecorators(member) ?? [];
      if (decorators.length !== 1) {
        fail(member, 'OEC9005', 'compiled fields must carry exactly one @property decorator');
      }
      const call = decorators[0].expression;
      const isPropertyDecorator = ts.isCallExpression(call) &&
        call.expression.getText(sf) === 'property';
      if (!isPropertyDecorator) {
        fail(
          decorators[0],
          'OEC9004',
          'unknown decorator on an OpenElement member; the spike supports only @property',
        );
      }
      const options = (call as ts.CallExpression).arguments[0];
      if (!options || !ts.isObjectLiteralExpression(options)) {
        fail(decorators[0], 'OEC9005', '@property requires an options object literal');
      }
      let reflect = false;
      for (const entry of options.properties) {
        if (
          !ts.isPropertyAssignment(entry) || entry.name.getText(sf) !== 'reflect' ||
          (entry.initializer.kind !== ts.SyntaxKind.TrueKeyword &&
            entry.initializer.kind !== ts.SyntaxKind.FalseKeyword)
        ) {
          fail(entry, 'OEC9005', '@property options support only `reflect: <boolean>`');
        }
        reflect = entry.initializer.kind === ts.SyntaxKind.TrueKeyword;
      }
      if (!member.initializer) {
        fail(member, 'OEC9005', 'compiled fields require an initializer for deterministic codegen');
      }
      if (!ts.isIdentifier(member.name)) fail(member, 'OEC9005', 'field names must be identifiers');
      fields.push({
        name: member.name.text,
        reflect,
        typeText: member.type ? `: ${member.type.getText(sf)}` : '',
        initializerText: member.initializer.getText(sf),
      });
      continue;
    }
    if (ts.isMethodDeclaration(member)) {
      if ((ts.getDecorators(member) ?? []).length > 0) {
        fail(member, 'OEC9004', 'methods may not carry decorators in the spike grammar');
      }
      const name = member.name.getText(sf);
      if (name === 'render') {
        renderMethod = member;
        continue;
      }
      methodNames.push(name);
      methodTexts.push(member.getText(sf));
      continue;
    }
    fail(member, 'OEC9006', 'constructors and accessors are outside the spike grammar');
  }

  if (!renderMethod) fail(classNode, 'OEC9007', 'compiled classes must declare render()');
  const renderBody = renderMethod.body;
  const returns = renderBody?.statements ?? [];
  if (returns.length !== 1 || !ts.isReturnStatement(returns[0]) || !returns[0].expression) {
    fail(renderMethod, 'OEC9007', 'render() must be a single return of one JSX element');
  }

  const lowering = new Lowering(sf, fields, methodNames);
  const root = lowering.lowerRoot(returns[0].expression!);

  const program: PartProgramSpike = {
    version: 1,
    tag,
    template: [root],
    parts: lowering.parts,
  };
  assertPathSafety(program, fileName);

  // ─── Deterministic emission ────────────────────────────────────────
  const programJson = JSON.stringify(program, null, 2);
  // Preserve the fixture's @property reflection decisions as deterministic
  // internal generated metadata (source field order). This is compile-time
  // data only: no runtime reflection, no public export, no frozen schema —
  // #1161/#1162 own those contracts.
  const propertiesJson = JSON.stringify(
    Object.fromEntries(fields.map((field) => [field.name, { reflect: field.reflect }])),
    null,
    2,
  );
  const memberLines: string[] = [];
  memberLines.push('  static __partProgram = __partProgram;');
  memberLines.push('  static __compiledProperties = __compiledProperties;');
  for (const field of fields) {
    memberLines.push(`  ${field.name}${field.typeText} = ${field.initializerText};`);
  }
  for (const text of methodTexts) {
    memberLines.push(...text.split('\n').map((line) => `  ${line}`));
  }
  memberLines.push('  render(): never {');
  memberLines.push('    throw new Error(');
  memberLines.push(
    `      '[open:compiled-element] ${tag} is compiled to a Part Program; ` +
      "the runtime JSX render path is not available in 0.44.',",
  );
  memberLines.push('    );');
  memberLines.push('  }');

  const code = [
    '// <auto-generated by open:compiled-element; v0.44.0-alpha.0 spike - do not edit>',
    "import { OpenElement } from '@openelement/element';",
    '',
    `const __partProgram = ${programJson};`,
    '',
    `const __compiledProperties = ${propertiesJson};`,
    '',
    `export class ${className} extends OpenElement {`,
    ...memberLines,
    '}',
    '',
    'export { __partProgram };',
    '',
  ].join('\n');

  return { code, program };
}
