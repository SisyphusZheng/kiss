import ts from 'typescript';

export interface StaticModuleSpecifier {
  value: string;
  line: number;
}

export function parseTypeScript(source: string, path = 'source.ts'): ts.SourceFile {
  const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, kind);
}

function literalText(node: ts.Node | undefined): string | undefined {
  return node && (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : undefined;
}

export function extractStaticModuleSpecifiers(
  source: string,
  path = 'source.ts',
): StaticModuleSpecifier[] {
  const file = parseTypeScript(source, path);
  const found: StaticModuleSpecifier[] = [];
  const add = (node: ts.Node | undefined): void => {
    const value = literalText(node);
    if (value === undefined || node === undefined) return;
    found.push({ value, line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1 });
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      add(node.moduleSpecifier);
    } else if (
      ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      add(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

export interface DenoAccess {
  member: string;
  line: number;
}

export function extractDenoAccesses(source: string, path = 'source.ts'): DenoAccess[] {
  const file = parseTypeScript(source, path);
  const found: DenoAccess[] = [];
  const visit = (node: ts.Node): void => {
    let member: string | undefined;
    if (
      ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) &&
      node.expression.text === 'Deno'
    ) {
      member = node.name.text;
    } else if (
      ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression) &&
      node.expression.text === 'Deno'
    ) {
      member = literalText(node.argumentExpression);
    }
    if (member !== undefined) {
      found.push({
        member,
        line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1,
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}
