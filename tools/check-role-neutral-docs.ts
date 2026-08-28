/**
 * Deterministic role-neutral documentation gate (#1156, ADR-0146).
 *
 * Scans every text file under docs/ plus the root Markdown documents and
 * rejects any configured model/provider brand identifier or the prior thinker
 * nickname, case-insensitively, including inside JSON and code fences. The
 * prohibited identifier set is loaded from executable configuration
 * (tools/config/v044-roles.json) and is never duplicated here, in
 * documentation, or in fixtures.
 *
 * Match kinds:
 * - literal: case-insensitive substring (for compound identifiers);
 * - token:   case-insensitive standalone word (non-alphanumeric boundaries).
 *
 * Diagnostics intentionally report only path, line and match kind so that
 * human-readable output never reproduces a prohibited value.
 */

import { walk } from '@std/fs/walk';
import { loadV044RoleConfig, type V044RoleConfig } from './config/load-v044-roles.ts';

export interface ProhibitedMatch {
  line: number;
  kind: 'literal' | 'token';
}

interface CompiledIdentifier {
  kind: 'literal' | 'token';
  pattern: RegExp;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compileIdentifiers(config: V044RoleConfig): CompiledIdentifier[] {
  const compiled: CompiledIdentifier[] = [];
  for (const literal of config.prohibitedDocIdentifiers.literals) {
    compiled.push({ kind: 'literal', pattern: new RegExp(escapeRegExp(literal), 'gi') });
  }
  for (const token of config.prohibitedDocIdentifiers.tokens) {
    compiled.push({
      kind: 'token',
      pattern: new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(token)}(?![A-Za-z0-9])`, 'gi'),
    });
  }
  return compiled;
}

function scanOne(text: string, compiled: CompiledIdentifier[]): ProhibitedMatch[] {
  const matches: ProhibitedMatch[] = [];
  const lines = text.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const seen = new Set<string>();
    for (const identifier of compiled) {
      identifier.pattern.lastIndex = 0;
      if (identifier.pattern.test(lines[index]) && !seen.has(identifier.kind)) {
        seen.add(identifier.kind);
        matches.push({ line: index + 1, kind: identifier.kind });
      }
    }
  }
  return matches;
}

export function scanTextForProhibited(text: string, config: V044RoleConfig): ProhibitedMatch[] {
  return scanOne(text, compileIdentifiers(config));
}

const SCANNED_EXTENSIONS = new Set([
  '.md',
  '.markdown',
  '.json',
  '.jsonc',
  '.yml',
  '.yaml',
  '.txt',
  '.toml',
]);

function hasScannedExtension(path: string): boolean {
  const dot = path.lastIndexOf('.');
  return dot > -1 && SCANNED_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

/** docs/** text files plus root Markdown documents, as repo-relative paths. */
export async function collectDocPaths(root: URL): Promise<string[]> {
  const paths: string[] = [];
  for await (
    const entry of walk(new URL('docs/', root), {
      includeDirs: false,
      followSymlinks: false,
    })
  ) {
    const relative = entry.path.slice(new URL('docs/', root).pathname.length - 0);
    const repoRelative = `docs/${relative}`;
    if (hasScannedExtension(repoRelative)) paths.push(repoRelative);
  }
  for await (const entry of Deno.readDir(root)) {
    if (entry.isFile && entry.name.toLowerCase().endsWith('.md')) paths.push(entry.name);
  }
  return paths.sort();
}

export interface DocScanFailure {
  path: string;
  matches: ProhibitedMatch[];
}

export async function scanDocumentation(
  root: URL,
  config: V044RoleConfig,
): Promise<DocScanFailure[]> {
  const compiled = compileIdentifiers(config);
  const failures: DocScanFailure[] = [];
  for (const path of await collectDocPaths(root)) {
    const nameMatches = scanOne(path, compiled);
    const contentMatches = scanOne(await Deno.readTextFile(new URL(path, root)), compiled);
    const matches = [...nameMatches, ...contentMatches];
    if (matches.length > 0) failures.push({ path, matches });
  }
  return failures;
}

async function main(): Promise<void> {
  const root = new URL('../', import.meta.url);
  const config = await loadV044RoleConfig(root);
  const failures = await scanDocumentation(root, config);
  if (failures.length > 0) {
    console.error('role-neutral documentation check failed:');
    for (const failure of failures) {
      const lines = failure.matches.map((match) => match.line).join(', ');
      const kinds = [...new Set(failure.matches.map((match) => match.kind))].join('/');
      console.error(
        `- ${failure.path}: prohibited ${kinds} identifier on line(s) ${lines} ` +
          '(value redacted; see the configured set in executable configuration)',
      );
    }
    Deno.exit(1);
  }
  console.log(
    `role-neutral documentation check passed (${failures.length} violations, zero exemptions).`,
  );
}

if (import.meta.main) await main();
