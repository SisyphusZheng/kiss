/**
 * @openelement/adapter-vite — Tests for external-resolver.ts.
 *
 * ADR-0047: Verifies Deno pre-resolution, fallback behavior, and
 * cache invalidation logic.
 * ADR-0054: Verifies AST-based exports resolution.
 */
import { join } from 'node:path';
import { assert, assertArrayIncludes, assertEquals, assertNotEquals } from 'jsr:@std/assert@1';
import {
  buildFallbackManifest,
  completeExternalSpecifiers,
  extractExternalSpecifiers,
  resolvePackageExports,
  walkExports,
} from '../src/internal/ssg/index.ts';

// Non-existent root to force AST fallback to bare package names
const NO_MODULES_ROOT = join(Deno.cwd(), 'no-node-modules-here');

// ─── walkExports (ADR-0054) ────────────────────────────────────────

Deno.test('walkExports: simple string export', () => {
  const result = walkExports('./index.js', 'test-pkg', '.');
  assertEquals(result, ['test-pkg']);
});

Deno.test('walkExports: subpath exports', () => {
  const result = walkExports(
    { '.': './src/index.ts', './sub': './src/sub.ts', './deep/nested': './src/deep.ts' },
    'test-pkg',
  );
  assertEquals(result, ['test-pkg', 'test-pkg/sub', 'test-pkg/deep/nested']);
});

Deno.test('walkExports: conditional exports (import/require)', () => {
  const result = walkExports(
    { import: './esm/index.mjs', require: './cjs/index.cjs' },
    'test-pkg',
    '.',
  );
  assertEquals(result, ['test-pkg']);
});

Deno.test('walkExports: wildcard export', () => {
  const result = walkExports(
    { './*': './dist/*.js' },
    'test-pkg',
  );
  assertEquals(result, ['test-pkg/*']);
});

Deno.test('walkExports: mixed subpath + conditional', () => {
  const result = walkExports(
    {
      '.': { import: './esm/index.mjs', require: './cjs/index.cjs' },
      './feature': { import: './esm/feature.mjs', require: './cjs/feature.cjs' },
    },
    'test-pkg',
  );
  assertArrayIncludes(result, ['test-pkg', 'test-pkg/feature']);
});

Deno.test('walkExports: null/undefined gracefully', () => {
  assertEquals(walkExports(null, 'x'), []);
  assertEquals(walkExports(undefined, 'x'), []);
  assertEquals(walkExports({}, 'x'), []);
});

// ─── resolvePackageExports (ADR-0054) ──────────────────────────────

Deno.test('resolvePackageExports: missing package returns base name', () => {
  const result = resolvePackageExports('not-a-real-package-xyz', NO_MODULES_ROOT);
  assertEquals(result, ['not-a-real-package-xyz']);
});

// ─── completeExternalSpecifiers (ADR-0054) ─────────────────────────

Deno.test('completeExternalSpecifiers: supplements base specifiers with exports', () => {
  const result = completeExternalSpecifiers(
    ['hono'],
    ['hono', 'entities'],
    NO_MODULES_ROOT,
  );
  // Even without node_modules, base specifiers are preserved
  assertArrayIncludes(result, ['hono']);
});

Deno.test('completeExternalSpecifiers: deduplication', () => {
  const result = completeExternalSpecifiers(
    ['hono'],
    ['hono'],
    NO_MODULES_ROOT,
  );
  assertEquals(result.filter((s: string) => s === 'hono').length, 1);
});

// ─── extractExternalSpecifiers ──────────────────────────────────────

Deno.test('extractExternalSpecifiers: returns empty for no modules', () => {
  const result = extractExternalSpecifiers(
    { modules: [], roots: [] },
    ['marked', 'entities', 'hono'],
  );
  assertEquals(result, []);
});

Deno.test('extractExternalSpecifiers: extracts exact npm package match', () => {
  const result = extractExternalSpecifiers(
    {
      modules: [
        { specifier: 'npm:hono@4.12.23' },
        { specifier: 'npm:marked@12.0.0' },
      ],
      roots: [],
    },
    ['hono', 'marked'],
  );
  assertEquals(result, ['hono', 'marked']);
});

Deno.test('extractExternalSpecifiers: extracts subpath imports', () => {
  const result = extractExternalSpecifiers(
    {
      modules: [
        { specifier: 'npm:entities@^4.5.0/lib/escape.js' },
        { specifier: 'npm:entities@^4.5.0/lib/decode.js' },
      ],
      roots: [],
    },
    ['entities'],
  );
  assertArrayIncludes(result, ['entities/lib/escape.js', 'entities/lib/decode.js']);
});

Deno.test('extractExternalSpecifiers: ignores non-npm specifiers', () => {
  const result = extractExternalSpecifiers(
    {
      modules: [
        { specifier: 'jsr:@openelement/core@0.21/logger.ts' },
        { specifier: 'https://esm.sh/react@18' },
        { specifier: 'npm:hono@4.12.23' },
      ],
      roots: [],
    },
    ['hono'],
  );
  assertEquals(result, ['hono']);
});

Deno.test('extractExternalSpecifiers: skips modules with errors', () => {
  const result = extractExternalSpecifiers(
    {
      modules: [
        { specifier: 'npm:marked@12.0.0', error: 'Download failed' },
        { specifier: 'npm:hono@4.12.23' },
      ],
      roots: [],
    },
    ['marked', 'hono'],
  );
  assertEquals(result, ['hono']);
});

Deno.test('extractExternalSpecifiers: returns sorted result', () => {
  const result = extractExternalSpecifiers(
    {
      modules: [
        { specifier: 'npm:hono@4.12.23' },
        { specifier: 'npm:entities@^4.5.0/lib/escape.js' },
        { specifier: 'npm:marked@12.0.0' },
      ],
      roots: [],
    },
    ['hono', 'entities', 'marked'],
  );
  assertEquals(result, ['entities/lib/escape.js', 'hono', 'marked']);
});

// ─── buildFallbackManifest (ADR-0054 updated) ──────────────────────

Deno.test('buildFallbackManifest: returns specifiers for known packages', () => {
  const result = buildFallbackManifest(['marked', 'entities', 'hono'], NO_MODULES_ROOT);
  // Without node_modules, falls back to base package names
  assert(result.specifiers.length >= 3);
  assertArrayIncludes(result.specifiers, ['marked', 'entities', 'hono']);
  assertEquals(result.importMap, {});
  assertEquals(result.lockHash, 'fallback');
  assertNotEquals(result.generatedAt, '');
});

Deno.test('buildFallbackManifest: handles empty package list', () => {
  const result = buildFallbackManifest([], NO_MODULES_ROOT);
  assertEquals(result.specifiers, []);
  assertEquals(result.lockHash, 'fallback');
});

Deno.test('buildFallbackManifest: generatedAt is valid ISO string', () => {
  const result = buildFallbackManifest(['hono'], NO_MODULES_ROOT);
  const parsed = new Date(result.generatedAt);
  assertEquals(isNaN(parsed.getTime()), false);
});

// ─── Type exports ───────────────────────────────────────────────────

Deno.test('external-resolver: module exports resolveExternalManifest as function', async () => {
  const mod = await import('../src/internal/ssg/index.ts');
  assertEquals(typeof mod.resolveExternalManifest, 'function');
});

Deno.test('external-resolver: buildFallbackManifest is exported', () => {
  assertEquals(typeof buildFallbackManifest, 'function');
});

Deno.test('external-resolver: extractExternalSpecifiers is exported', () => {
  assertEquals(typeof extractExternalSpecifiers, 'function');
});

Deno.test('external-resolver: walkExports is exported (ADR-0054)', () => {
  assertEquals(typeof walkExports, 'function');
});

Deno.test('external-resolver: resolvePackageExports is exported (ADR-0054)', () => {
  assertEquals(typeof resolvePackageExports, 'function');
});

Deno.test('external-resolver: completeExternalSpecifiers is exported (ADR-0054)', () => {
  assertEquals(typeof completeExternalSpecifiers, 'function');
});
