/** Bundler-neutral module semantics consumed by compiler and Vite graph adapters. */

import ts from 'typescript';

export interface ModuleSemanticFacts {
  relativeImports: string[];
  compiledElementDecorator: boolean;
  exportedTagName?: string;
  definePage: boolean;
  usesExportedTagName: boolean;
  enhancedForm: boolean;
  defaultCompiledTag?: string;
  definedCustomElementTags: string[];
  referencedCustomElementTags: string[];
  compilerInteractionEvents: string[];
}

function importedNames(
  sourceFile: ts.SourceFile,
): Map<string, { module: string; imported: string }> {
  const names = new Map<string, { module: string; imported: string }>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const module = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (!clause) continue;
    if (clause.name) names.set(clause.name.text, { module, imported: 'default' });
    const bindings = clause.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const binding of bindings.elements) {
        names.set(binding.name.text, {
          module,
          imported: binding.propertyName?.text ?? binding.name.text,
        });
      }
    } else if (bindings && ts.isNamespaceImport(bindings)) {
      names.set(bindings.name.text, { module, imported: '*' });
    }
  }
  return names;
}

function isImported(
  names: Map<string, { module: string; imported: string }>,
  local: string,
  module: string,
  imported: string,
): boolean {
  const binding = names.get(local);
  return binding?.module === module && binding.imported === imported;
}

function isOpenElementImport(
  names: Map<string, { module: string; imported: string }>,
  local: string,
  imported: string,
): boolean {
  const binding = names.get(local);
  return (binding?.module === '@openelement/element' || binding?.module === '@openelement/app') &&
    binding.imported === imported;
}

function isCustomElementTag(value: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(value);
}

function stringArgument(call: ts.CallExpression, index = 0): string | undefined {
  const argument = call.arguments[index];
  return argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))
    ? argument.text
    : undefined;
}

export function analyzeModuleSemantics(source: string, fileName: string): ModuleSemanticFacts {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const imports = importedNames(sourceFile);
  const relativeImports = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (
      (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith('.')
    ) relativeImports.add(statement.moduleSpecifier.text);
  }

  let exportedTagName: string | undefined;
  let compiledElementDecorator = false;
  let definePage = fileName.endsWith('.mdx');
  let usesExportedTagName = false;
  let enhancedForm = false;
  let defaultCompiledTag: string | undefined;
  const defined = new Set<string>();
  const referenced = new Set<string>();
  const interactionEvents = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (
      ts.isVariableStatement(statement) &&
      statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) && declaration.name.text === 'tagName' &&
          declaration.initializer &&
          (ts.isStringLiteral(declaration.initializer) ||
            ts.isNoSubstitutionTemplateLiteral(declaration.initializer))
        ) exportedTagName = declaration.initializer.text;
      }
    }
    if (
      ts.isExportAssignment(statement) && ts.isCallExpression(statement.expression) &&
      ts.isIdentifier(statement.expression.expression) &&
      isImported(imports, statement.expression.expression.text, '@openelement/app', 'definePage')
    ) definePage = true;

    if (!ts.isClassDeclaration(statement)) continue;
    const isDefault = statement.modifiers?.some((modifier) =>
      modifier.kind === ts.SyntaxKind.DefaultKeyword
    );
    const heritage = statement.heritageClauses?.find((clause) =>
      clause.token === ts.SyntaxKind.ExtendsKeyword
    )?.types[0]?.expression;
    const extendsOpenElement = heritage && ts.isIdentifier(heritage) &&
      (heritage.text === 'OpenElement' ||
        isOpenElementImport(imports, heritage.text, 'OpenElement'));
    for (const decorator of ts.getDecorators(statement) ?? []) {
      if (
        !ts.isCallExpression(decorator.expression) ||
        !ts.isIdentifier(decorator.expression.expression)
      ) {
        continue;
      }
      if (
        decorator.expression.expression.text !== 'element' &&
        !isOpenElementImport(imports, decorator.expression.expression.text, 'element')
      ) continue;
      compiledElementDecorator = true;
      const tag = stringArgument(decorator.expression);
      if (!tag || !isCustomElementTag(tag)) continue;
      defined.add(tag);
      if (isDefault && extendsOpenElement) defaultCompiledTag = tag;
    }
  }

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (
        expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 &&
        ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text.startsWith('.')
      ) {
        relativeImports.add(node.arguments[0].text);
      }
      if (ts.isIdentifier(expression)) {
        const binding = imports.get(expression.text);
        if (
          (expression.text === 'defineElement' || expression.text === 'defineIsland') ||
          ((binding?.module === '@openelement/element' || binding?.module === '@openelement/app') &&
            (binding.imported === 'defineElement' || binding.imported === 'defineIsland'))
        ) {
          const tag = stringArgument(node);
          if (tag && isCustomElementTag(tag)) defined.add(tag);
          if (tag !== undefined && tag === exportedTagName) usesExportedTagName = true;
          if (
            node.arguments[0] && ts.isIdentifier(node.arguments[0]) &&
            node.arguments[0].text === 'tagName'
          ) usesExportedTagName = true;
        }
        const isElementJsxFactory =
          isImported(imports, expression.text, '@openelement/element/jsx-runtime', 'jsx') ||
          isImported(imports, expression.text, '@openelement/element/jsx-runtime', 'jsxs') ||
          isImported(imports, expression.text, '@openelement/element/jsx-runtime', 'jsxDEV');
        if (isElementJsxFactory) {
          const tag = stringArgument(node);
          if (tag && isCustomElementTag(tag)) referenced.add(tag);
        }
      } else if (
        ts.isPropertyAccessExpression(expression) && expression.expression.getText(sourceFile) ===
          'customElements' &&
        expression.name.text === 'define'
      ) {
        const tag = stringArgument(node);
        if (tag && isCustomElementTag(tag)) defined.add(tag);
        if (tag !== undefined && tag === exportedTagName) usesExportedTagName = true;
        if (
          node.arguments[0] && ts.isIdentifier(node.arguments[0]) &&
          node.arguments[0].text === 'tagName'
        ) usesExportedTagName = true;
      }
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sourceFile);
      if (isCustomElementTag(tag)) {
        referenced.add(tag);
        if (tag === exportedTagName) usesExportedTagName = true;
      }
      for (const attribute of node.attributes.properties) {
        if (ts.isJsxSpreadAttribute(attribute)) continue;
        const name = attribute.name.getText(sourceFile);
        if (name === 'data-open-enhance') enhancedForm = true;
        if (/^on[A-Z]/.test(name)) interactionEvents.add(name.slice(2).toLowerCase());
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return {
    relativeImports: [...relativeImports],
    compiledElementDecorator,
    ...(exportedTagName === undefined ? {} : { exportedTagName }),
    definePage,
    usesExportedTagName,
    enhancedForm,
    ...(defaultCompiledTag === undefined ? {} : { defaultCompiledTag }),
    definedCustomElementTags: [...defined].sort(),
    referencedCustomElementTags: [...referenced].sort(),
    compilerInteractionEvents: [...interactionEvents].sort(),
  };
}
