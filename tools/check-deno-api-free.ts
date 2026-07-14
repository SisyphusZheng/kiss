/**
 * CI gate: ensure runtime-free/browser-facing product packages do not use
 * Deno-specific APIs or node:* imports in their source code.
 *
 * Build/server glue packages (ssg, content, adapter-vite) and tests/tools are
 * allowed to use Deno/Node APIs and are intentionally excluded.
 */

import { walkSync } from '@std/fs/walk';
import { stripCommentsLine } from './lib/text.ts';

const RESTRICTED_ROOTS = [
  'packages/element/src',
  'packages/ui/src',
  'packages/app/src',
];

const EXTENSIONS = new Set(['.ts', '.tsx']);

function scan(root: string): string[] {
  const violations: string[] = [];
  const files = walkSync(root, {
    includeDirs: false,
    skip: [/^__tests__$/],
  }).filter((entry) => {
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) return false;
    const dot = entry.name.lastIndexOf('.');
    if (dot === -1) return false;
    return EXTENSIONS.has(entry.name.slice(dot));
  });

  for (const entry of files) {
    const text = Deno.readTextFileSync(entry.path);
    const firstCodeLine = text.split('\n').find((l) => l.trim() !== '') ?? '';
    if (firstCodeLine.trim().startsWith('// deno-api-free:ignore')) continue;
    const lines = text.split('\n');
    let inBlockComment = false;
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const { line, inBlock } = stripCommentsLine(raw, inBlockComment);
      inBlockComment = inBlock;

      if (/'node:[^']*'/.test(line) || /"node:[^"]*"/.test(line)) {
        violations.push(`${entry.path}:${i + 1}: node import: ${raw.trim()}`);
      }
      if (/\bDeno\.[a-zA-Z_]/.test(line)) {
        violations.push(`${entry.path}:${i + 1}: Deno API: ${raw.trim()}`);
      }
    }
  }
  return violations;
}

const violations: string[] = [];
for (const root of RESTRICTED_ROOTS) violations.push(...scan(root));

if (violations.length > 0) {
  console.error('Deno API usage detected in runtime-free product packages:');
  for (const v of violations) console.error(`  ${v}`);
  Deno.exit(1);
}

console.log('No Deno API usage in runtime-free product packages.');
