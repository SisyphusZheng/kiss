/**
 * CI gate: ensure runtime-free/browser-facing product packages do not use
 * Deno-specific APIs or node:* imports in their source code.
 *
 * Build/server glue packages (ssg, content, adapter-vite) and tests/tools are
 * allowed to use Deno/Node APIs and are intentionally excluded.
 */

import { walkFiles } from './lib/walk.ts';

const RESTRICTED_ROOTS = [
  'packages/core/src',
  'packages/element/src',
  'packages/ui/src',
  'packages/protocol/src',
  'packages/signal/src',
  'packages/router/src',
  'packages/app/src',
];

const EXTENSIONS = new Set(['.ts', '.tsx']);

function stripComments(line: string, inBlock: boolean): { line: string; inBlock: boolean } {
  let text = line;

  if (inBlock) {
    const end = text.indexOf('*/');
    if (end === -1) return { line: '', inBlock: true };
    text = text.slice(end + 2);
    // The local parameter is reassigned only to keep the control-flow contract
    // explicit; callers consume the returned `inBlock` value, not this variable.
    return stripComments(text, false);
  }

  for (;;) {
    const start = text.indexOf('/*');
    if (start === -1) break;
    const end = text.indexOf('*/', start + 2);
    if (end === -1) {
      return { line: text.slice(0, start).replace(/\/\/.*/, ''), inBlock: true };
    }
    text = text.slice(0, start) + text.slice(end + 2);
  }

  return { line: text.replace(/\/\/.*/, ''), inBlock: false };
}

function scan(root: string): string[] {
  const violations: string[] = [];
  const files = walkFiles(root, {
    exclude: ({ name }) => name === '__tests__',
    include: ({ name }) => {
      if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) return false;
      const dot = name.lastIndexOf('.');
      if (dot === -1) return false;
      return EXTENSIONS.has(name.slice(dot));
    },
  });

  for (const path of files) {
    const text = Deno.readTextFileSync(path);
    if (text.includes('deno-api-free:ignore')) continue;
    const lines = text.split('\n');
    let inBlockComment = false;
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const { line, inBlock } = stripComments(raw, inBlockComment);
      inBlockComment = inBlock;

      if (/'node:[^']*'/.test(line) || /"node:[^"]*"/.test(line)) {
        violations.push(`${path}:${i + 1}: node import: ${raw.trim()}`);
      }
      if (/\bDeno\.[a-zA-Z_]/.test(line)) {
        violations.push(`${path}:${i + 1}: Deno API: ${raw.trim()}`);
      }
    }
  }
  return violations;
}

const violations: string[] = [];
for (const root of RESTRICTED_ROOTS) {
  try {
    violations.push(...scan(root));
  } catch (error) {
    console.error(`Failed to scan ${root}: ${error}`);
    Deno.exit(1);
  }
}

if (violations.length > 0) {
  console.error('Deno API usage detected in runtime-free product packages:');
  for (const v of violations) console.error(`  ${v}`);
  Deno.exit(1);
}

console.log('No Deno API usage in runtime-free product packages.');
