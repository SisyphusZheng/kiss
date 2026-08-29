import ts from 'typescript';

const ELEMENT_MODULE = '@openelement/element';
const LEGACY_MODULES = new Set(['@openelement/element', '@openelement/app']);
const CUSTOM_ELEMENT_TAG = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/u;

export interface MigrationDiagnostic {
  code: string;
  message: string;
  file: string;
  line: number;
  character: number;
}

export interface MigrationResult {
  code: string;
  changed: boolean;
  diagnostics: MigrationDiagnostic[];
}

interface TextEdit {
  start: number;
  end: number;
  text: string;
}

type LegacyCallKind = 'defineElement' | 'defineCustomElement';

interface ImportBinding {
  declaration: ts.ImportDeclaration;
  imported: string;
  local: string;
}

interface MigrationPlan {
  edits: TextEdit[];
  transformedCalls: Set<ts.CallExpression>;
  transformedAliases: Set<string>;
  needsElementDecorator: boolean;
  needsOpenElementBase: boolean;
}

function parseSource(source: string, fileName: string): ts.SourceFile {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind);
}

function unwrap(expression: ts.Expression): ts.Expression {
  if (
    ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) || ts.isNonNullExpression(expression)
  ) {
    return unwrap(expression.expression);
  }
  return expression;
}

function stringLiteralValue(expression: ts.Expression): string | undefined {
  const value = unwrap(expression);
  return ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)
    ? value.text
    : undefined;
}

function nodeLocation(sf: ts.SourceFile, node: ts.Node): { line: number; character: number } {
  const position = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return { line: position.line + 1, character: position.character + 1 };
}

function diagnostic(
  sf: ts.SourceFile,
  node: ts.Node,
  code: string,
  message: string,
): MigrationDiagnostic {
  return { code, message, file: sf.fileName, ...nodeLocation(sf, node) };
}

function propertyName(node: ts.PropertyName, sf: ts.SourceFile): string | undefined {
  if (ts.isComputedPropertyName(node)) return undefined;
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  return node.getText(sf) === 'styles' || node.getText(sf) === 'render'
    ? node.getText(sf)
    : undefined;
}

function importModuleName(declaration: ts.ImportDeclaration): string | undefined {
  return ts.isStringLiteral(declaration.moduleSpecifier)
    ? declaration.moduleSpecifier.text
    : undefined;
}

function collectImportBindings(sf: ts.SourceFile): {
  bindings: ImportBinding[];
  legacyAliases: Map<string, LegacyCallKind>;
} {
  const bindings: ImportBinding[] = [];
  const legacyAliases = new Map<string, LegacyCallKind>();

  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const moduleName = importModuleName(statement);
    if (!moduleName || !LEGACY_MODULES.has(moduleName)) continue;
    const named = statement.importClause?.namedBindings;
    if (!named || !ts.isNamedImports(named)) continue;
    for (const specifier of named.elements) {
      const imported = specifier.propertyName?.text ?? specifier.name.text;
      const local = specifier.name.text;
      bindings.push({ declaration: statement, imported, local });
      if (imported === 'defineElement' || imported === 'defineCustomElement') {
        legacyAliases.set(local, imported);
      }
    }
  }

  return { bindings, legacyAliases };
}

function collectLiteralBindings(sf: ts.SourceFile): Map<string, string> {
  const bindings = new Map<string, string>();
  for (const statement of sf.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      if ((declaration.parent.flags & ts.NodeFlags.Const) === 0) continue;
      const value = stringLiteralValue(declaration.initializer);
      if (value !== undefined) bindings.set(declaration.name.text, value);
    }
  }
  return bindings;
}

function collectClasses(sf: ts.SourceFile): Map<string, ts.ClassDeclaration> {
  const classes = new Map<string, ts.ClassDeclaration>();
  for (const statement of sf.statements) {
    if (ts.isClassDeclaration(statement) && statement.name) {
      classes.set(statement.name.text, statement);
    }
  }
  return classes;
}

function hasTopLevelBinding(sf: ts.SourceFile, name: string): boolean {
  for (const statement of sf.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (statement.importClause?.name?.text === name) return true;
      const named = statement.importClause?.namedBindings;
      if (named && ts.isNamedImports(named)) {
        if (named.elements.some((specifier) => specifier.name.text === name)) return true;
      }
      continue;
    }
    if (
      (ts.isClassDeclaration(statement) || ts.isFunctionDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) && statement.name?.text === name
    ) {
      return true;
    }
    if (ts.isVariableStatement(statement)) {
      if (
        statement.declarationList.declarations.some((declaration) =>
          ts.isIdentifier(declaration.name) && declaration.name.text === name
        )
      ) return true;
    }
  }
  return false;
}

function callKind(
  expression: ts.Expression,
  aliases: Map<string, LegacyCallKind>,
): LegacyCallKind | undefined {
  if (!ts.isIdentifier(expression)) return undefined;
  return aliases.get(expression.text) ?? (
    expression.text === 'defineElement' || expression.text === 'defineCustomElement'
      ? expression.text
      : undefined
  );
}

function isCustomElementsDefine(expression: ts.Expression): boolean {
  return ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'customElements' && expression.name.text === 'define';
}

function findRegistrationClass(
  sf: ts.SourceFile,
  node: ts.CallExpression,
  classes: Map<string, ts.ClassDeclaration>,
  literalBindings: Map<string, string>,
  diagnostics: MigrationDiagnostic[],
): { classNode: ts.ClassDeclaration; tag: string } | undefined {
  if (node.arguments.length !== 2) {
    diagnostics.push(
      diagnostic(
        sf,
        node,
        'OE-MIGRATE-002',
        'legacy element registration must have exactly a tag and a class argument',
      ),
    );
    return undefined;
  }

  const firstArgument = unwrap(node.arguments[0]);
  const tag = stringLiteralValue(firstArgument) ??
    (ts.isIdentifier(firstArgument) ? literalBindings.get(firstArgument.text) : undefined);
  if (tag === undefined || !CUSTOM_ELEMENT_TAG.test(tag)) {
    diagnostics.push(
      diagnostic(
        sf,
        node.arguments[0],
        'OE-MIGRATE-001',
        'migration requires a literal custom-element tag (a string literal or const string binding)',
      ),
    );
    return undefined;
  }

  const classArgument = unwrap(node.arguments[1]);
  if (!ts.isIdentifier(classArgument)) {
    diagnostics.push(
      diagnostic(
        sf,
        node.arguments[1],
        'OE-MIGRATE-002',
        'legacy element registration must name a class declaration directly',
      ),
    );
    return undefined;
  }
  const classNode = classes.get(classArgument.text);
  if (!classNode) {
    diagnostics.push(
      diagnostic(
        sf,
        classArgument,
        'OE-MIGRATE-002',
        `could not find class declaration for registered element ${classArgument.text}`,
      ),
    );
    return undefined;
  }

  const heritage = classNode.heritageClauses?.find((clause) =>
    clause.token === ts.SyntaxKind.ExtendsKeyword
  );
  const base = heritage?.types[0]?.expression.getText(sf);
  if (base !== 'OpenElement') {
    diagnostics.push(
      diagnostic(
        sf,
        classNode,
        'OE-MIGRATE-002',
        `registered class must extend OpenElement directly (found ${base ?? 'no base class'})`,
      ),
    );
    return undefined;
  }

  return { classNode, tag };
}

function decoratorName(decorator: ts.Decorator, sf: ts.SourceFile): string {
  const expression = decorator.expression;
  return ts.isCallExpression(expression)
    ? expression.expression.getText(sf)
    : expression.getText(sf);
}

function existingElementDecorator(
  classNode: ts.ClassDeclaration,
  sf: ts.SourceFile,
): ts.Decorator | undefined {
  return (ts.getDecorators(classNode) ?? []).find((decorator) =>
    decoratorName(decorator, sf) === 'element'
  );
}

function decoratorTag(
  decorator: ts.Decorator,
): string | undefined {
  if (!ts.isCallExpression(decorator.expression) || decorator.expression.arguments.length !== 1) {
    return undefined;
  }
  return stringLiteralValue(decorator.expression.arguments[0]);
}

function renderMethodFromCallable(
  sf: ts.SourceFile,
  callable: ts.ArrowFunction | ts.FunctionExpression,
  diagnostics: MigrationDiagnostic[],
): string | undefined {
  if (callable.parameters.length !== 0) {
    diagnostics.push(
      diagnostic(
        sf,
        callable,
        'OE-MIGRATE-002',
        'defineElement render functions with props or other parameters require manual migration',
      ),
    );
    return undefined;
  }
  if (
    callable.asteriskToken ||
    callable.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
  ) {
    diagnostics.push(
      diagnostic(
        sf,
        callable,
        'OE-MIGRATE-002',
        'async and generator render functions require manual migration',
      ),
    );
    return undefined;
  }
  if (bodyContainsThis(callable.body)) {
    diagnostics.push(
      diagnostic(
        sf,
        callable,
        'OE-MIGRATE-002',
        'defineElement render functions that use this require manual migration',
      ),
    );
    return undefined;
  }
  if (ts.isBlock(callable.body)) {
    return `render() ${callable.body.getText(sf)}`;
  }
  return `render() { return ${callable.body.getText(sf)}; }`;
}

function bodyContainsThis(node: ts.Node): boolean {
  let found = false;
  const visit = (current: ts.Node): void => {
    if (current.kind === ts.SyntaxKind.ThisKeyword) {
      found = true;
      return;
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return found;
}

function renderMethodFromProperty(
  sf: ts.SourceFile,
  property: ts.ObjectLiteralElementLike,
  diagnostics: MigrationDiagnostic[],
): string | undefined {
  if (ts.isMethodDeclaration(property)) {
    if (
      property.parameters.length !== 0 || property.asteriskToken ||
      property.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)
    ) {
      diagnostics.push(
        diagnostic(
          sf,
          property,
          'OE-MIGRATE-002',
          'defineElement render methods with parameters, async, or generator behavior require manual migration',
        ),
      );
      return undefined;
    }
    if (bodyContainsThis(property.body ?? property)) {
      diagnostics.push(
        diagnostic(
          sf,
          property,
          'OE-MIGRATE-002',
          'defineElement render methods that use this require manual migration',
        ),
      );
      return undefined;
    }
    return property.getText(sf);
  }
  if (!ts.isPropertyAssignment(property)) return undefined;
  const initializer = unwrap(property.initializer);
  if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) {
    return renderMethodFromCallable(sf, initializer, diagnostics);
  }
  diagnostics.push(
    diagnostic(
      sf,
      property.initializer,
      'OE-MIGRATE-002',
      'defineElement render must be a zero-argument method or function',
    ),
  );
  return undefined;
}

function indentMember(member: string): string {
  const lines = member.split('\n');
  const commonIndent = lines.slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/u)?.[0].length ?? 0)
    .reduce((minimum, length) => Math.min(minimum, length), Number.POSITIVE_INFINITY);
  if (Number.isFinite(commonIndent) && commonIndent > 0) {
    for (let index = 1; index < lines.length; index++) {
      lines[index] = lines[index].slice(
        Math.min(commonIndent, lines[index].match(/^\s*/u)?.[0].length ?? 0),
      );
    }
  }
  return lines.map((line) => `  ${line}`).join('\n');
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (ts.canHaveModifiers(node) ? ts.getModifiers(node) ?? [] : [])
    .some((modifier) => modifier.kind === kind);
}

function convertDefineElement(
  sf: ts.SourceFile,
  call: ts.CallExpression,
  literalBindings: Map<string, string>,
  diagnostics: MigrationDiagnostic[],
): { declaration: ts.VariableStatement; classText: string } | undefined {
  const declaration = call.parent;
  if (!ts.isVariableDeclaration(declaration) || declaration.initializer !== call) {
    diagnostics.push(
      diagnostic(
        sf,
        call,
        'OE-MIGRATE-002',
        'defineElement must be a direct initializer of one named const for automatic migration',
      ),
    );
    return undefined;
  }
  const statement = declaration.parent.parent;
  if (!ts.isVariableStatement(statement) || statement.declarationList.declarations.length !== 1) {
    diagnostics.push(
      diagnostic(
        sf,
        declaration,
        'OE-MIGRATE-002',
        'defineElement declarations must contain exactly one named binding',
      ),
    );
    return undefined;
  }
  if (!ts.isIdentifier(declaration.name)) {
    diagnostics.push(
      diagnostic(
        sf,
        declaration.name,
        'OE-MIGRATE-002',
        'defineElement binding must be a named class',
      ),
    );
    return undefined;
  }
  if (
    !hasModifier(statement, ts.SyntaxKind.ExportKeyword) &&
    hasModifier(statement, ts.SyntaxKind.DefaultKeyword)
  ) {
    diagnostics.push(
      diagnostic(
        sf,
        statement,
        'OE-MIGRATE-002',
        'default defineElement expressions require a named class for migration',
      ),
    );
    return undefined;
  }
  if (call.arguments.length !== 2) {
    diagnostics.push(
      diagnostic(
        sf,
        call,
        'OE-MIGRATE-002',
        'defineElement must have exactly a tag and a definition argument',
      ),
    );
    return undefined;
  }

  const firstArgument = unwrap(call.arguments[0]);
  const tag = stringLiteralValue(firstArgument) ??
    (ts.isIdentifier(firstArgument) ? literalBindings.get(firstArgument.text) : undefined);
  if (tag === undefined || !CUSTOM_ELEMENT_TAG.test(tag)) {
    diagnostics.push(
      diagnostic(
        sf,
        call.arguments[0],
        'OE-MIGRATE-001',
        'migration requires a literal custom-element tag (a string literal or const string binding)',
      ),
    );
    return undefined;
  }

  const definition = unwrap(call.arguments[1]);
  const definitionDiagnosticStart = diagnostics.length;
  let styles: string | undefined;
  let render: string | undefined;
  if (ts.isObjectLiteralExpression(definition)) {
    for (const member of definition.properties) {
      if (ts.isSpreadAssignment(member)) {
        diagnostics.push(
          diagnostic(
            sf,
            member,
            'OE-MIGRATE-002',
            'defineElement definition spreads require manual migration',
          ),
        );
        continue;
      }
      const name = propertyName(member.name, sf);
      if (name === 'styles') {
        if (ts.isShorthandPropertyAssignment(member)) {
          styles = member.name.text;
        } else if (ts.isPropertyAssignment(member)) {
          styles = member.initializer.getText(sf);
        } else {
          diagnostics.push(
            diagnostic(
              sf,
              member,
              'OE-MIGRATE-002',
              'defineElement styles must be a value or shorthand property',
            ),
          );
        }
        continue;
      }
      if (name === 'render') {
        render = renderMethodFromProperty(sf, member, diagnostics);
        continue;
      }
      diagnostics.push(
        diagnostic(
          sf,
          member,
          'OE-MIGRATE-002',
          `defineElement definition property ${
            name ?? '<computed>'
          } is not deterministic; migrate it manually`,
        ),
      );
    }
  } else if (ts.isArrowFunction(definition) || ts.isFunctionExpression(definition)) {
    render = renderMethodFromCallable(sf, definition, diagnostics);
  } else {
    diagnostics.push(
      diagnostic(
        sf,
        call.arguments[1],
        'OE-MIGRATE-002',
        'defineElement requires an object definition or zero-argument render function for automatic migration',
      ),
    );
  }

  if (
    !render && diagnostics.length === definitionDiagnosticStart
  ) {
    diagnostics.push(
      diagnostic(
        sf,
        call.arguments[1],
        'OE-MIGRATE-002',
        'defineElement definition must provide render',
      ),
    );
  }
  if (!render) return undefined;

  const exportPrefix = hasModifier(statement, ts.SyntaxKind.ExportKeyword) ? 'export ' : '';
  const members = [
    ...(styles ? [indentMember(`static styles = ${styles};`)] : []),
    indentMember(render),
  ];
  const classText = [
    `@element('${tag}')`,
    `${exportPrefix}class ${declaration.name.text} extends OpenElement {`,
    members.join('\n'),
    '}',
  ].join('\n');
  return { declaration: statement, classText };
}

function applyEdits(source: string, edits: TextEdit[]): string {
  const ordered = [...edits].sort((left, right) => right.start - left.start);
  let result = source;
  let previousStart = source.length + 1;
  for (const edit of ordered) {
    if (edit.end > previousStart) throw new Error('overlapping migration edits');
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
    previousStart = edit.start;
  }
  return result;
}

function standaloneStatementEnd(source: string, statement: ts.Statement): number {
  const end = statement.getEnd();
  const lineEnd = source.indexOf('\n', end);
  const remainder = source.slice(end, lineEnd === -1 ? source.length : lineEnd);
  if (!/^\s*$/u.test(remainder)) return end;
  if (source.startsWith('\r\n', end)) return end + 2;
  if (source[end] === '\n') return end + 1;
  return end;
}

function importText(
  sf: ts.SourceFile,
  declaration: ts.ImportDeclaration,
  names: string[],
): string {
  const clause = declaration.importClause;
  const moduleText = declaration.moduleSpecifier.getText(sf);
  const defaultName = clause?.name?.getText(sf);
  const defaultPart = defaultName ? `${defaultName}, ` : '';
  const namedPart = names.length > 0 ? `{ ${names.join(', ')} }` : '';
  if (defaultPart && !namedPart) return `import ${defaultName} from ${moduleText};`;
  if (defaultPart || namedPart) return `import ${defaultPart}${namedPart} from ${moduleText};`;
  return `import ${moduleText};`;
}

function addImportEdits(
  sf: ts.SourceFile,
  bindings: ImportBinding[],
  transformedAliases: Set<string>,
  needsOpenElementBase: boolean,
  diagnostics: MigrationDiagnostic[],
): TextEdit[] {
  const edits: TextEdit[] = [];
  const legacyByDeclaration = new Map<ts.ImportDeclaration, Set<string>>();
  for (const binding of bindings) {
    if (!transformedAliases.has(binding.local)) continue;
    const removed = legacyByDeclaration.get(binding.declaration) ?? new Set<string>();
    removed.add(binding.local);
    legacyByDeclaration.set(binding.declaration, removed);
  }

  const elementImports = [
    ...new Set(
      bindings
        .filter((binding) => importModuleName(binding.declaration) === ELEMENT_MODULE)
        .map((binding) => binding.declaration),
    ),
  ];
  let addedToElementImport = false;
  const requiredNames = [
    ...(needsOpenElementBase ? ['OpenElement'] : []),
  ];

  for (const declaration of new Set(bindings.map((binding) => binding.declaration))) {
    const named = declaration.importClause?.namedBindings;
    const moduleName = importModuleName(declaration);
    const removed = legacyByDeclaration.get(declaration) ?? new Set<string>();
    if (!removed.size) continue;
    if (declaration.importClause?.isTypeOnly) {
      diagnostics.push(
        diagnostic(
          sf,
          declaration,
          'OE-MIGRATE-002',
          'runtime legacy imports cannot be type-only imports',
        ),
      );
      continue;
    }
    if (!named || !ts.isNamedImports(named)) {
      diagnostics.push(
        diagnostic(
          sf,
          declaration,
          'OE-MIGRATE-002',
          'namespace and default-only legacy imports require manual migration',
        ),
      );
      continue;
    }
    const retained = named.elements
      .filter((specifier) => !removed.has(specifier.name.text))
      .map((specifier) => specifier.getText(sf));
    const additions =
      moduleName === ELEMENT_MODULE && requiredNames.length > 0 && !addedToElementImport
        ? requiredNames.filter((name) =>
          !retained.some((item) => item === name || item.startsWith(`${name} as `))
        )
        : [];
    if (additions.length > 0) addedToElementImport = true;
    const next = [...additions, ...retained];
    edits.push({
      start: declaration.getStart(sf),
      end: declaration.getEnd(),
      text: importText(sf, declaration, next),
    });
  }

  if (requiredNames.length > 0 && !addedToElementImport) {
    const existing = elementImports.find((declaration) => !legacyByDeclaration.has(declaration));
    if (existing) {
      const named = existing.importClause?.namedBindings;
      if (named && ts.isNamedImports(named) && !existing.importClause?.isTypeOnly) {
        const retained = named.elements.map((specifier) => specifier.getText(sf));
        const additions = requiredNames.filter((name) =>
          !named.elements.some((specifier) =>
            (specifier.propertyName?.text ?? specifier.name.text) === name
          )
        );
        if (additions.length > 0) {
          edits.push({
            start: existing.getStart(sf),
            end: existing.getEnd(),
            text: importText(sf, existing, [...additions, ...retained]),
          });
        }
        addedToElementImport = true;
      }
    }
  }

  if (requiredNames.length > 0 && !addedToElementImport) {
    edits.push({
      start: 0,
      end: 0,
      text: `import { ${requiredNames.join(', ')} } from '${ELEMENT_MODULE}';\n`,
    });
  }
  return edits;
}

function findLegacyCalls(
  sf: ts.SourceFile,
  aliases: Map<string, LegacyCallKind>,
): Array<{ call: ts.CallExpression; kind: LegacyCallKind | 'customElements' }> {
  const calls: Array<{ call: ts.CallExpression; kind: LegacyCallKind | 'customElements' }> = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const kind = callKind(node.expression, aliases);
      if (kind) calls.push({ call: node, kind });
      else if (isCustomElementsDefine(node.expression)) {
        calls.push({ call: node, kind: 'customElements' });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return calls;
}

function findLegacyIdentifierUses(
  sf: ts.SourceFile,
  aliases: Map<string, LegacyCallKind>,
  transformedCalls: Set<ts.CallExpression>,
  bindings: ImportBinding[],
  diagnostics: MigrationDiagnostic[],
): void {
  const importLocals = new Set(bindings.map((binding) => binding.local));
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && aliases.has(node.text)) {
      const parent = node.parent;
      const isImportBinding = importLocals.has(node.text) &&
        (ts.isImportSpecifier(parent) || ts.isImportClause(parent));
      const isTransformedCallee = ts.isCallExpression(parent) &&
        parent.expression === node && transformedCalls.has(parent);
      if (!isImportBinding && !isTransformedCallee) {
        diagnostics.push(
          diagnostic(
            sf,
            node,
            'OE-MIGRATE-002',
            `${node.text} is used outside a deterministic registration call; migrate it manually`,
          ),
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

/**
 * Convert the deterministic subset of the v0.43 registration surface to the
 * v0.44 decorator authoring form. The function is pure: it never writes a
 * source file and returns the original source whenever any manual repair is
 * required.
 */
export function migrateV043Source(source: string, fileName = 'source.tsx'): MigrationResult {
  const sf = parseSource(source, fileName);
  const diagnostics: MigrationDiagnostic[] = [];
  const { bindings, legacyAliases } = collectImportBindings(sf);
  const literalBindings = collectLiteralBindings(sf);
  const classes = collectClasses(sf);
  const calls = findLegacyCalls(sf, legacyAliases);
  const plan: MigrationPlan = {
    edits: [],
    transformedCalls: new Set(),
    transformedAliases: new Set(),
    needsElementDecorator: false,
    needsOpenElementBase: false,
  };
  const plannedClasses = new Set<ts.ClassDeclaration>();

  for (const { call, kind } of calls) {
    if (kind === 'defineElement') {
      const converted = convertDefineElement(sf, call, literalBindings, diagnostics);
      if (!converted) continue;
      plan.edits.push({
        start: converted.declaration.getStart(sf),
        end: converted.declaration.getEnd(),
        text: converted.classText,
      });
      plan.transformedCalls.add(call);
      plan.needsElementDecorator = true;
      plan.needsOpenElementBase = true;
      const alias = ts.isIdentifier(call.expression) ? call.expression.text : undefined;
      if (alias && legacyAliases.has(alias)) plan.transformedAliases.add(alias);
      continue;
    }

    const isRegistration = kind === 'customElements' || kind === 'defineCustomElement';
    if (!isRegistration) continue;
    const expressionStatement = call.parent;
    if (!ts.isExpressionStatement(expressionStatement) || expressionStatement.parent !== sf) {
      diagnostics.push(
        diagnostic(
          sf,
          call,
          'OE-MIGRATE-002',
          'legacy registration must be a top-level standalone call for automatic migration',
        ),
      );
      continue;
    }
    const registration = findRegistrationClass(sf, call, classes, literalBindings, diagnostics);
    if (!registration) continue;
    const existing = existingElementDecorator(registration.classNode, sf);
    if (existing) {
      const existingTag = decoratorTag(existing);
      if (existingTag !== registration.tag) {
        diagnostics.push(
          diagnostic(
            sf,
            existing,
            'OE-MIGRATE-002',
            `existing @element tag ${
              existingTag ?? '<non-literal>'
            } does not match ${registration.tag}`,
          ),
        );
        continue;
      }
    } else if (!plannedClasses.has(registration.classNode)) {
      plan.edits.push({
        start: registration.classNode.getStart(sf),
        end: registration.classNode.getStart(sf),
        text: `@element('${registration.tag}')\n`,
      });
      plan.needsElementDecorator = true;
      plannedClasses.add(registration.classNode);
    }
    plan.edits.push({
      start: expressionStatement.getStart(sf),
      end: standaloneStatementEnd(source, expressionStatement),
      text: '',
    });
    plan.transformedCalls.add(call);
    if (kind === 'defineCustomElement' && ts.isIdentifier(call.expression)) {
      const alias = call.expression.text;
      if (legacyAliases.has(alias)) plan.transformedAliases.add(alias);
    }
  }

  // A source with no legacy calls is already migration-clean. This also makes
  // a second run byte-identical, which is required for safe codemod retries.
  if (calls.length === 0) return { code: source, changed: false, diagnostics: [] };

  findLegacyIdentifierUses(sf, legacyAliases, plan.transformedCalls, bindings, diagnostics);
  if (diagnostics.length > 0) return { code: source, changed: false, diagnostics };

  plan.edits.push(
    ...addImportEdits(
      sf,
      bindings,
      plan.transformedAliases,
      plan.needsOpenElementBase,
      diagnostics,
    ),
  );
  if (diagnostics.length > 0) return { code: source, changed: false, diagnostics };

  // Decorators are compiler input, not runtime registration machinery. Keep a
  // local type-only declaration when the source does not already provide one;
  // the compiler erases it together with @element before the module ships.
  if (plan.needsElementDecorator && !hasTopLevelBinding(sf, 'element')) {
    const insertionPoint = sf.statements[0]?.getStart(sf) ?? 0;
    plan.edits.push({
      start: insertionPoint,
      end: insertionPoint,
      text: 'declare function element(tag: string): ClassDecorator;\n\n',
    });
  }

  const code = applyEdits(source, plan.edits);
  return { code, changed: code !== source, diagnostics: [] };
}

export function formatMigrationDiagnostic(item: MigrationDiagnostic): string {
  return `${item.file}:${item.line}:${item.character} - ${item.code}: ${item.message}`;
}

function printUsage(): void {
  console.log(
    'Usage: deno run --allow-read --allow-write tools/migration/v044/migrate.ts [--write] <file.ts|file.tsx> [...files]',
  );
}

async function main(): Promise<void> {
  const write = Deno.args.includes('--write');
  const paths = Deno.args.filter((arg) => arg !== '--write');
  if (paths.length === 0 || Deno.args.includes('--help')) {
    printUsage();
    if (paths.length === 0) Deno.exit(1);
    return;
  }

  let failed = false;
  for (const path of paths) {
    const source = await Deno.readTextFile(path);
    const result = migrateV043Source(source, path);
    if (result.diagnostics.length > 0) {
      failed = true;
      for (const item of result.diagnostics) console.error(formatMigrationDiagnostic(item));
      continue;
    }
    if (write && result.changed) {
      await Deno.writeTextFile(path, result.code);
      console.log(`migrated ${path}`);
    } else if (result.changed) {
      console.log(`--- ${path} ---`);
      console.log(result.code);
    } else {
      console.log(`clean ${path}`);
    }
  }
  if (failed) Deno.exit(1);
}

if (import.meta.main) await main();
