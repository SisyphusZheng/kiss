/**
 * @kissjs/create - cli.ts tests (Deno)
 *
 * Tests template correctness by reading the source directly.
 * We do NOT call main() because it invokes Deno.exit() which
 * kills the Deno test process.
 */
// deno-lint-ignore-file no-unused-vars prefer-const
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliSource = readFileSync(join(__dirname, '..', 'cli.ts'), 'utf-8');

// Extract each template by splitting on known keys
function extractTemplate(key: string): string {
  const marker = `'${key}': \``;
  const startIdx = cliSource.indexOf(marker);
  if (startIdx === -1) throw new Error(`Template '${key}' not found`);

  let contentStart = startIdx + marker.length;
  let depth = 1;
  let i = contentStart;

  while (i < cliSource.length && depth > 0) {
    if (cliSource[i] === '`') {
      // Check if escaped
      const backslashCount = countTrailingBackslashes(cliSource, i - 1);
      if (backslashCount % 2 === 0) {
        depth--;
        if (depth === 0) break;
      }
    }
    i++;
  }

  return cliSource.slice(contentStart, i);
}

function countTrailingBackslashes(s: string, pos: number): number {
  let count = 0;
  while (pos >= 0 && s[pos] === '\\') {
    count++;
    pos--;
  }
  return count;
}

// ─── Scaffold Tests ────────────────────────────────────────

Deno.test('create-kiss: deno.json has all required tasks', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));

  assertExists(denoJson.tasks['dev'], 'Missing dev task');
  assertExists(denoJson.tasks['build'], 'Missing build task');
  assertExists(denoJson.tasks['build:client'], 'Missing build:client task');
  assertExists(denoJson.tasks['build:ssg'], 'Missing build:ssg task');
  assertExists(denoJson.tasks['preview'], 'Missing preview task');
});

Deno.test('create-kiss: deno.json build:client uses @kissjs/core', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));
  assertExists(denoJson.tasks['build:client'].includes('@kissjs/core'));
});

Deno.test('create-kiss: deno.json build:ssg uses @kissjs/core', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));
  assertExists(denoJson.tasks['build:ssg'].includes('@kissjs/core'));
});

Deno.test('create-kiss: vite.config.ts imports kiss plugin', () => {
  const viteConfig = extractTemplate('vite.config.ts');
  assertExists(viteConfig.includes("import { kiss } from '@kissjs/core'"));
  assertExists(viteConfig.includes('kiss({'));
});

Deno.test('create-kiss: vite.config.ts includes packageIslands config', () => {
  const viteConfig = extractTemplate('vite.config.ts');
  assertExists(viteConfig.includes('@kissjs/ui'));
});

Deno.test('create-kiss: route index imports from @kissjs/core', () => {
  const routeIndex = extractTemplate('app/routes/index.ts');
  assertExists(routeIndex.includes('@kissjs/core'));
  assertExists(routeIndex.includes('LitElement'));
  assertExists(routeIndex.includes('tagName'));
});

Deno.test('create-kiss: island counter imports from @kissjs/core', () => {
  const islandCounter = extractTemplate('app/islands/my-counter.ts');
  assertExists(islandCounter.includes('@kissjs/core'));
  assertExists(islandCounter.includes('LitElement'));
  assertExists(islandCounter.includes("tagName = 'my-counter'"));
});
