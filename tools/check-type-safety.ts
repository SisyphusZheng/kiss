/**
 * Type-safety gate for the current source tree.
 *
 * Scans active TypeScript/TSX source and tests for explicit `any` type escapes.
 * Allowed: `unknown`, `unknown[]`, structured interfaces, generic constraints.
 * Forbidden: \x60as any\x60, \x60: any\x60, \x60any[]\x60 in active code.
 */

import { walk } from './lib/fs.ts';
import { normalizeSlashes } from './lib/path.ts';
import { stripCommentsLine } from './lib/text.ts';

export interface Issue {
  file: string;
  line: number;
  text: string;
}

const ANY_PATTERNS = [
  { re: /\bas\s+any\b/u, name: 'unsafe cast' },
  { re: /:\s*any\b/u, name: 'unsafe annotation' },
  { re: /\bany\s*\[\s*\]/u, name: 'unsafe array element' },
];

const ACTIVE_ROOTS = [
  'packages',
  'tools',
  'www',
];

const EXCLUDED_FILES = new Set([
  'tools/check-type-safety.ts',
  'tools/check-architecture-contract.ts',
  // Test files that exercise the detector necessarily contain any-escape tokens,
  // so they are excluded from scanning just like the gate tools themselves.
  'tools/check-type-safety.test.ts',
  'tools/check-architecture-contract.test.ts',
]);

const EXTENSIONS = /\.(ts|tsx)$/;

const WALK_SKIP = ['node_modules', 'dist', 'vendor'];

export function isCodeLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return false;
  if (trimmed.startsWith('*') || trimmed.startsWith('/*')) return false;
  return true;
}

export interface SourceFile {
  path: string;
  text: string;
}

/**
 * Scan already-loaded source files for explicit `any` escapes.
 *
 * Pure: does not touch the filesystem and does not apply EXCLUDED_FILES, so it
 * can be exercised directly in tests with synthetic inputs.
 */
export function scanSourcesForAnyIssues(files: SourceFile[]): Issue[] {
  const issues: Issue[] = [];
  for (const file of files) {
    const lines = file.text.split(/\r?\n/);
    let inBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const { line, inBlock: next } = stripCommentsLine(lines[i], inBlock);
      inBlock = next;
      if (!isCodeLine(line)) continue;
      for (const { re, name } of ANY_PATTERNS) {
        if (re.test(line)) {
          issues.push({ file: file.path, line: i + 1, text: name });
          break;
        }
      }
    }
  }
  return issues;
}

/** Walk the active roots and read every scannable, non-excluded source file. */
export async function collectActiveSourceFiles(): Promise<SourceFile[]> {
  const files: SourceFile[] = [];
  for (const root of ACTIVE_ROOTS) {
    try {
      for await (const path of walk(root, { skip: WALK_SKIP, extensions: EXTENSIONS })) {
        const normalized = normalizeSlashes(path);
        if (EXCLUDED_FILES.has(normalized)) continue;
        files.push({ path: normalized, text: await Deno.readTextFile(normalized) });
      }
    } catch {
      // Root may not exist in all contexts.
    }
  }
  return files;
}

async function main(): Promise<void> {
  const files = await collectActiveSourceFiles();
  const issues = scanSourcesForAnyIssues(files);

  if (issues.length > 0) {
    console.error(`Type-safety check failed: ${issues.length} explicit any escape(s) found.`);
    for (const issue of issues) {
      console.error(`  ${issue.file}:${issue.line} (${issue.text})`);
    }
    Deno.exit(1);
  }

  console.log(`Type-safety check passed (${files.length} active TS/TSX files, 0 explicit any).`);
}

if (import.meta.main) {
  await main();
}
