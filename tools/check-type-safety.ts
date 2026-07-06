/**
 * Type-safety gate for the v0.40.x Ultimate Clean Plan.
 *
 * Scans active TypeScript/TSX source and tests for explicit `any` type escapes.
 * Allowed: `unknown`, `unknown[]`, structured interfaces, generic constraints.
 * Forbidden: \x60as any\x60, \x60: any\x60, \x60any[]\x60 in active code.
 */

interface Issue {
  file: string;
  line: number;
  text: string;
}

const ANY_PATTERNS = [
  { re: new RegExp('\\bas\\s+any\\b'), name: 'as' + ' ' + 'any' },
  { re: /:\s*any\b/, name: ':' + ' ' + 'any' },
  { re: /\bany\s*\[\s*\]/, name: 'any' + '[]' },
];

const ACTIVE_ROOTS = [
  'packages',
  'tools',
  'www',
];

const EXCLUDED_FILES = new Set([
  'tools/check-type-safety.ts',
  'tools/check-architecture-contract.ts',
]);

import { normalizeSlashes } from './lib/path.ts';
import { walk } from './lib/fs.ts';

const EXTENSIONS = /\.(ts|tsx)$/;

function isCodeLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return false;
  if (trimmed.startsWith('*') || trimmed.startsWith('/*')) return false;
  return true;
}

async function main(): Promise<void> {
  const issues: Issue[] = [];
  const files: string[] = [];

  for (const root of ACTIVE_ROOTS) {
    try {
      for await (const path of walk(root, { skip: ['node_modules', 'dist', 'vendor'] })) {
        if (!EXTENSIONS.test(path)) continue;
        const normalized = normalizeSlashes(path);
        if (EXCLUDED_FILES.has(normalized)) continue;
        files.push(normalized);
      }
    } catch {
      // Root may not exist in all contexts.
    }
  }

  for (const file of files) {
    const text = await Deno.readTextFile(file);
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!isCodeLine(line)) continue;
      for (const { re, name } of ANY_PATTERNS) {
        if (re.test(line)) {
          issues.push({ file, line: i + 1, text: name });
          break;
        }
      }
    }
  }

  if (issues.length > 0) {
    console.error(`Type-safety check failed: ${issues.length} explicit any escape(s) found.`);
    for (const issue of issues) {
      console.error(`  ${issue.file}:${issue.line} (${issue.text})`);
    }
    Deno.exit(1);
  }

  console.log(`Type-safety check passed (${files.length} active TS/TSX files, 0 explicit any).`);
}

await main();
