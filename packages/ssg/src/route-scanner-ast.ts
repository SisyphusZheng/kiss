/**
 * @openelement/ssg - Route scanner AST helpers
 *
 * TypeScript AST utilities for statically extracting metadata from route and
 * island modules without executing them. These helpers are intentionally
 * kept separate from file-system and orchestration concerns.
 */

import { OpenElementError } from '@openelement/core/errors';
import * as ts from 'typescript';
import { safeReadFile } from './route-scanner-fs.ts';

/** Local island metadata indexed by tag name. */
export interface LocalIslandMeta {
  tagName: string;
  filePath: string;
  ssr?: boolean;
  dsd?: boolean;
  hydrate?: 'load' | 'idle' | 'visible' | 'only';
  reason?: string;
}

/**
 * Read `export const tagName = '...'` from source text via AST.
 * This avoids importing the module (which can fail for modules that
 * depend on Vite generated-entry modules).
 */
export function readRouteTagName(source: string, fileName: string): string | undefined {
  return readStaticStringExport(source, 'tagName', fileName);
}

/**
 * Read tagName from a route file using static AST scanning.
 */
export async function readRouteTagNameFromModule(filePath: string): Promise<string | undefined> {
  const source = await safeReadFile(filePath);
  if (source === undefined) return undefined;
  return readRouteTagName(source, filePath);
}

export function readStaticStringExport(
  source: string,
  exportName: string,
  fileName: string,
): string | undefined {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const isExported = statement.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName) continue;
      if (!declaration.initializer) return undefined;

      const value = unwrapStaticOpenElementExpression(declaration.initializer);
      if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
        return value.text;
      }
      throw new OpenElementError(
        `Invalid static ${exportName} export: expected a string literal.`,
        'STATIC_METADATA_ERROR',
        500,
        false,
      );
    }
  }

  return undefined;
}

/**
 * v0.33.0: Static AST extraction of
 * `export const openElement = defineIslandConfig({ ... })`.
 *
 * The scanner intentionally does not execute island modules. It accepts only a
 * defineIslandConfig() call with boolean `ssr`/`dsd` and string `hydrate`
 * literal values. Dynamic metadata is rejected instead of guessed.
 */
export function readStaticOpenElementExport(source: string): {
  ssr?: boolean;
  dsd?: boolean;
  hydrate?: LocalIslandMeta['hydrate'];
} | null {
  const sourceFile = ts.createSourceFile(
    'island.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const isExported = statement.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'openElement') continue;
      if (!declaration.initializer) {
        throw staticOpenElementError('openElement export must have an initializer');
      }

      const initializer = unwrapStaticOpenElementExpression(declaration.initializer);
      if (!ts.isCallExpression(initializer)) {
        throw staticOpenElementError(
          `openElement export must call defineIslandConfig(...), got ${
            ts.SyntaxKind[initializer.kind]
          }`,
        );
      }

      const callee = unwrapStaticOpenElementExpression(initializer.expression);
      if (!ts.isIdentifier(callee) || callee.text !== 'defineIslandConfig') {
        throw staticOpenElementError('openElement export must call defineIslandConfig(...)');
      }
      if (initializer.arguments.length !== 1) {
        throw staticOpenElementError('defineIslandConfig() requires exactly one object argument');
      }
      const config = unwrapStaticOpenElementExpression(initializer.arguments[0]);
      if (!ts.isObjectLiteralExpression(config)) {
        throw staticOpenElementError(
          `defineIslandConfig() argument must be a static object literal, got ${
            ts.SyntaxKind[config.kind]
          }`,
        );
      }

      return readOpenElementObjectLiteral(config);
    }
  }

  return null;
}

export function unwrapStaticOpenElementExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function readOpenElementObjectLiteral(object: ts.ObjectLiteralExpression): {
  ssr?: boolean;
  dsd?: boolean;
  hydrate?: LocalIslandMeta['hydrate'];
} {
  const meta: {
    ssr?: boolean;
    dsd?: boolean;
    hydrate?: LocalIslandMeta['hydrate'];
  } = {};

  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw staticOpenElementError(
        `unsupported openElement metadata syntax: ${ts.SyntaxKind[property.kind]}`,
      );
    }
    if (property.name.kind === ts.SyntaxKind.ComputedPropertyName) {
      throw staticOpenElementError('computed openElement metadata keys are not supported');
    }

    const key = propertyNameToString(property.name);
    if (!key || !['ssr', 'dsd', 'hydrate'].includes(key)) {
      throw staticOpenElementError(`unsupported openElement metadata key "${String(key)}"`);
    }

    const value = unwrapStaticOpenElementExpression(property.initializer);
    if (key === 'ssr' || key === 'dsd') {
      if (value.kind !== ts.SyntaxKind.TrueKeyword && value.kind !== ts.SyntaxKind.FalseKeyword) {
        throw staticOpenElementError(`openElement.${key} must be a boolean literal`);
      }
      meta[key] = value.kind === ts.SyntaxKind.TrueKeyword;
      continue;
    }

    if (!ts.isStringLiteral(value) && !ts.isNoSubstitutionTemplateLiteral(value)) {
      throw staticOpenElementError('openElement.hydrate must be a string literal');
    }
    if (!['load', 'idle', 'visible', 'only'].includes(value.text)) {
      throw staticOpenElementError(`openElement.hydrate has unsupported value "${value.text}"`);
    }
    meta.hydrate = value.text as LocalIslandMeta['hydrate'];
  }

  return meta;
}

function propertyNameToString(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function staticOpenElementError(message: string): OpenElementError {
  return new OpenElementError(
    `Invalid static island metadata export "openElement": ${message}. Accepted shape: export const openElement = defineIslandConfig({ ssr?: boolean, dsd?: boolean, hydrate?: "load" | "idle" | "visible" | "only" }).`,
    'ISLAND_METADATA_ERROR',
    500,
    false,
  );
}
