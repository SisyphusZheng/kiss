/**
 * @openelement/ssg - Helper utility tests
 *
 * Tests for stableHash, resolveDynamicRoutePath, joinUrlPath, findHtmlFiles,
 * and collectPageOutput from ssg-helpers.ts
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  buildIsrManifestEntries,
  collectPageOutput,
  findHtmlFiles,
  type PageDiagnostic,
  resolveDynamicRoutePath,
  stableHash,
} from '../src/ssg-helpers.ts';
import { join } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

// ─── stableHash ────────────────────────────────────────────────

Deno.test('stableHash produces deterministic output', async () => {
  const hash1 = await stableHash('hello');
  const hash2 = await stableHash('hello');
  assertEquals(hash1, hash2);
});

Deno.test('stableHash different for different inputs', async () => {
  assertEquals(await stableHash('hello') !== await stableHash('world'), true);
});

Deno.test('stableHash handles empty string', async () => {
  assertEquals(typeof await stableHash(''), 'string');
  assertEquals((await stableHash('')).length > 0, true);
});

Deno.test('stableHash handles unicode', async () => {
  assertEquals(typeof await stableHash('héllo wörld 🔥'), 'string');
});

// ─── resolveDynamicRoutePath ───────────────────────────────────

Deno.test('resolveDynamicRoutePath substitutes single param', () => {
  assertEquals(
    resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: 'hello-world' }),
    '/blog/hello-world',
  );
});

Deno.test('resolveDynamicRoutePath substitutes multiple params', () => {
  assertEquals(
    resolveDynamicRoutePath('/:year/:month/:slug', ['year', 'month', 'slug'], {
      year: '2026',
      month: '06',
      slug: 'my-post',
    }),
    '/2026/06/my-post',
  );
});

Deno.test('resolveDynamicRoutePath throws on missing param', () => {
  let threw = false;
  try {
    resolveDynamicRoutePath('/blog/:slug', ['slug'], {});
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

Deno.test('resolveDynamicRoutePath throws on empty param', () => {
  let threw = false;
  try {
    resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: '' });
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

Deno.test('resolveDynamicRoutePath throws on path traversal dot', () => {
  let threw = false;
  try {
    resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: '..' });
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

Deno.test('resolveDynamicRoutePath encodes spaces', () => {
  assertEquals(
    resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: 'my post' }),
    '/blog/my%20post',
  );
});

// ─── findHtmlFiles ──────────────────────────────────────────────

let testDir: string;

Deno.test({
  name: 'findHtmlFiles: setup temp dir',
  fn() {
    testDir = Deno.makeTempDirSync({ prefix: 'ssg-helpers-test-' });
    mkdirSync(join(testDir, 'sub'), { recursive: true });
    writeFileSync(join(testDir, 'index.html'), '', 'utf-8');
    writeFileSync(join(testDir, 'about.html'), '', 'utf-8');
    writeFileSync(join(testDir, 'sub', 'post.html'), '', 'utf-8');
    writeFileSync(join(testDir, 'script.js'), '', 'utf-8');
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test('findHtmlFiles finds html files in directory tree', () => {
  const files = findHtmlFiles(testDir);
  assertEquals(files.length, 3);
  assertEquals(files.some((f: string) => f.endsWith('index.html')), true);
  assertEquals(files.some((f: string) => f.endsWith('about.html')), true);
  assertEquals(files.some((f: string) => f.endsWith('post.html')), true);
  assertEquals(files.some((f: string) => f.endsWith('script.js')), false);
});

Deno.test('findHtmlFiles returns empty for nonexistent dir', () => {
  const files = findHtmlFiles(join(testDir, 'nonexistent'));
  assertEquals(files, []);
});

// ─── collectPageOutput ──────────────────────────────────────────

Deno.test('collectPageOutput handles string output', () => {
  const diagnostics: PageDiagnostic[] = [];
  const html = collectPageOutput('/test', '<html>hello</html>', diagnostics);
  assertEquals(html, '<html>hello</html>');
  assertEquals(diagnostics.length, 0);
});

Deno.test('collectPageOutput handles object output', () => {
  const diagnostics: PageDiagnostic[] = [];
  const html = collectPageOutput('/test', {
    html: '<html>hello</html>',
    errors: [],
    hydrationHints: [],
    componentCount: 3,
    renderTimeMs: 42,
  }, diagnostics);
  assertEquals(html, '<html>hello</html>');
  assertEquals(diagnostics.length, 1);
  assertEquals(diagnostics[0].path, '/test');
  assertEquals(diagnostics[0].componentCount, 3);
  assertEquals(diagnostics[0].renderTimeMs, 42);
});

// ─── buildIsrManifestEntries ────────────────────────────────────

Deno.test('buildIsrManifestEntries builds ISR entries for routes with revalidate', () => {
  const routeInfo = [
    {
      path: '/',
      tagName: 'home-page',
      isDynamic: false,
      paramNames: [] as string[],
      revalidate: 300,
    },
    { path: '/about', tagName: 'about-page', isDynamic: false, paramNames: [] as string[] },
  ];
  const entries = buildIsrManifestEntries(routeInfo, new Map());
  assertEquals(entries.length, 1);
  assertEquals(entries[0].path, '/');
  assertEquals(entries[0].revalidate, 300);
});

Deno.test('buildIsrManifestEntries skips routes without revalidate', () => {
  const routeInfo = [
    { path: '/', tagName: 'home-page', isDynamic: false, paramNames: [] as string[] },
    {
      path: '/about',
      tagName: 'about-page',
      isDynamic: false,
      paramNames: [] as string[],
      revalidate: 0,
    },
  ];
  const entries = buildIsrManifestEntries(routeInfo, new Map());
  assertEquals(entries.length, 0);
});

// Cleanup
Deno.test({
  name: 'findHtmlFiles: cleanup temp dir',
  fn() {
    if (testDir) rmSync(testDir, { recursive: true, force: true });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
