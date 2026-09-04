/**
 * API reference enumeration (#1158, B2.4): derive the public API and Custom
 * Element reference from the real v0.44 public exports, their JSDoc, the
 * PACKAGE_SURFACE.md stability classification and the @openelement/ui
 * compiler manifest.
 *
 * Export enumeration uses the TypeScript compiler API exactly like the
 * public-interface snapshot (tools/check-public-interface-snapshot.ts) — no
 * hand-rolled parser, no subprocess. All functions are deterministic:
 * identical inputs produce identical records.
 */

import ts from 'typescript';
import { resolve } from '@std/path';

// ─── PACKAGE_SURFACE.md machine blocks ──────────────────────────────────────
// Local copies of the block extraction (kept in sync with
// tools/check-package-surface.ts, which gates the same blocks against the
// real export surface). Self-contained so this module stays importable
// without pulling a CLI module.

export interface SurfaceMapEntry {
  supported: string[];
  internal: string[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function extractJsonBlock(doc: string, marker: string): unknown | null {
  const begin = doc.indexOf(`<!-- ${marker}`);
  if (begin === -1) return null;
  const end = doc.indexOf('-->', begin);
  if (end === -1) return null;
  try {
    return JSON.parse(doc.slice(begin + marker.length + 5, end).trim());
  } catch {
    return null;
  }
}

export function parseSurfaceMap(doc: string): Record<string, SurfaceMapEntry> | null {
  const parsed = extractJsonBlock(doc, 'package-surface-map');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const map: Record<string, SurfaceMapEntry> = {};
  for (const [name, entry] of Object.entries(parsed as Record<string, unknown>)) {
    if (!entry || typeof entry !== 'object') return null;
    const { supported, internal } = entry as Record<string, unknown>;
    if (!isStringArray(supported) || !isStringArray(internal)) return null;
    map[name] = { supported, internal };
  }
  return map;
}

export type ExportClassMap = Record<string, Record<string, Record<string, string>>>;

export function parseExportClassMap(doc: string): ExportClassMap | null {
  const parsed = extractJsonBlock(doc, 'package-export-classes');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const map: ExportClassMap = {};
  for (const [pkg, subpaths] of Object.entries(parsed as Record<string, unknown>)) {
    if (!subpaths || typeof subpaths !== 'object' || Array.isArray(subpaths)) return null;
    const subpathMap: Record<string, Record<string, string>> = {};
    for (const [subpath, classes] of Object.entries(subpaths as Record<string, unknown>)) {
      if (!classes || typeof classes !== 'object' || Array.isArray(classes)) return null;
      const classEntries: Record<string, string> = {};
      for (const [name, cls] of Object.entries(classes as Record<string, unknown>)) {
        if (typeof cls !== 'string') return null;
        classEntries[name] = cls;
      }
      subpathMap[subpath] = classEntries;
    }
    map[pkg] = subpathMap;
  }
  return map;
}

// ─── Workspace resolution ───────────────────────────────────────────────────

interface WorkspacePackage {
  name: string;
  dir: string;
  exports: unknown;
}

/**
 * Build a TypeScript `paths` map that resolves every package's bare
 * `@openelement/*` specifiers (root and each exports subpath) to real files,
 * so cross-package re-exports enumerate to their true declarations.
 */
export function workspacePaths(packages: WorkspacePackage[]): Record<string, string[]> {
  const paths: Record<string, string[]> = {};
  for (const pkg of packages) {
    const entries = typeof pkg.exports === 'string'
      ? { '.': pkg.exports }
      : (pkg.exports ?? {}) as Record<string, string>;
    for (const [key, target] of Object.entries(entries)) {
      if (typeof target !== 'string') continue;
      const specifier = key === '.' ? pkg.name : `${pkg.name}/${key.replace(/^\.\//, '')}`;
      paths[specifier] = [`${pkg.dir}/${target.replace(/^\.\//, '')}`];
    }
  }
  return paths;
}

// ─── Export enumeration ─────────────────────────────────────────────────────

export interface ApiExportRecord {
  name: string;
  /** Broad symbol kind: value | class | interface | type | namespace. */
  kind: string;
  /** First JSDoc block line; '' when the export carries no documentation. */
  summary: string;
  /** Repo-relative declaration location. */
  source: { path: string; line: number };
  /** Stability class from the PACKAGE_SURFACE.md package-export-classes block. */
  stability: string;
  /** Stable documentation anchor (unique across the whole reference). */
  anchor: string;
}

function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  let current = symbol;
  const seen = new Set<ts.Symbol>();
  while ((current.flags & ts.SymbolFlags.Alias) !== 0 && !seen.has(current)) {
    seen.add(current);
    current = checker.getAliasedSymbol(current);
  }
  return current;
}

function symbolKind(symbol: ts.Symbol): string {
  if ((symbol.flags & ts.SymbolFlags.Class) !== 0) return 'class';
  if ((symbol.flags & ts.SymbolFlags.Interface) !== 0) return 'interface';
  if ((symbol.flags & ts.SymbolFlags.TypeAlias) !== 0) return 'type';
  if ((symbol.flags & ts.SymbolFlags.Namespace) !== 0) return 'namespace';
  if ((symbol.flags & ts.SymbolFlags.Enum) !== 0) return 'enum';
  if ((symbol.flags & ts.SymbolFlags.Function) !== 0) return 'function';
  return 'value';
}

function jsdocSummary(checker: ts.TypeChecker, symbol: ts.Symbol): string {
  const text = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
  // The summary is the first block of prose up to the first blank line,
  // flattened to one line so the generated module stays stable.
  return text.split(/\n\s*\n/)[0]?.replace(/\s+/g, ' ').trim() ?? '';
}

/**
 * Enumerate the named exports of one published subpath entry module with
 * their kind, JSDoc summary and declaration location. `paths` maps the
 * workspace's bare `@openelement/*` specifiers onto real files so
 * cross-package re-exports resolve to their true declarations.
 */
export function enumerateSubpathExports(
  entryFile: string,
  repoRoot: string,
  paths: Record<string, string[]> = {},
): Omit<ApiExportRecord, 'stability' | 'anchor'>[] {
  const resolvedEntry = resolve(entryFile);
  const program = ts.createProgram([resolvedEntry], {
    allowImportingTsExtensions: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ESNext,
    baseUrl: repoRoot,
    paths,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(resolvedEntry);
  if (!source) throw new Error(`TypeScript did not load public entry ${entryFile}`);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`TypeScript did not resolve module ${entryFile}`);

  return checker.getExportsOfModule(moduleSymbol).map((exportSymbol) => {
    const target = resolveAlias(checker, exportSymbol);
    const declaration = target.valueDeclaration ?? target.declarations?.[0] ?? source;
    const declarationFile = declaration.getSourceFile();
    return {
      name: exportSymbol.getName(),
      kind: symbolKind(target),
      summary: jsdocSummary(checker, target),
      source: {
        path: resolve(declarationFile.fileName).slice(repoRoot.length + 1),
        line: declarationFile.getLineAndCharacterOfPosition(declaration.getStart()).line + 1,
      },
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}
