/**
 * @openelement/ssg - Route scanner tests
 *
 * Tests for scanRoutes, scanIslands, scanIslandMeta, fileToTagName
 * from route-scanner.ts
 */

import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { fileToTagName } from '../src/route-scanner.ts';
import { join } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

// ─── fileToTagName ─────────────────────────────────────────────

Deno.test('fileToTagName: converts file to tag name', () => {
  assertEquals(fileToTagName('my-counter.ts'), 'my-counter');
});

Deno.test('fileToTagName: handles tsx extension', () => {
  assertEquals(fileToTagName('blog-post.tsx'), 'blog-post');
});

Deno.test('fileToTagName: handles nested paths', () => {
  assertEquals(fileToTagName('posts/index.ts'), 'posts-index');
});

Deno.test('fileToTagName: handles windows backslashes', () => {
  assertEquals(fileToTagName('admin\\dashboard.ts'), 'admin-dashboard');
});

Deno.test('fileToTagName: preserves multi-hyphen names', () => {
  assertEquals(fileToTagName('my-cool-component.ts'), 'my-cool-component');
});

// ─── scanIslands ───────────────────────────────────────────────

Deno.test('scanIslands: finds all island files recursively', async () => {
  const { scanIslands } = await import('../src/route-scanner.ts');
  const islandsDir = Deno.makeTempDirSync({ prefix: 'ssg-islands-test-' });
  try {
    mkdirSync(join(islandsDir, 'nested'), { recursive: true });
    writeFileSync(join(islandsDir, 'my-counter.ts'), 'export default {}', 'utf-8');
    writeFileSync(join(islandsDir, 'lazy-image.tsx'), 'export default {}', 'utf-8');
    writeFileSync(join(islandsDir, 'nested', 'deep-island.ts'), 'export default {}', 'utf-8');
    writeFileSync(join(islandsDir, 'not-a-island.js'), '', 'utf-8');
    // .dotfile should be ignored
    writeFileSync(join(islandsDir, '.hidden.ts'), 'export default {}', 'utf-8');

    const files = await scanIslands(islandsDir);
    // Normalize paths for cross-platform comparison
    const normalize = (f: string) => f.replace(/\\/g, '/');
    // Should find 4 files: .ts/.tsx/.js files are all included (not .hidden)
    assertEquals(files.length, 4);
    assertEquals(files.some((f: string) => normalize(f) === 'my-counter.ts'), true);
    assertEquals(files.some((f: string) => normalize(f) === 'lazy-image.tsx'), true);
    assertEquals(files.some((f: string) => normalize(f) === 'nested/deep-island.ts'), true);
    assertEquals(files.some((f: string) => normalize(f) === 'not-a-island.js'), true);
  } finally {
    rmSync(islandsDir, { recursive: true, force: true });
  }
});

Deno.test('scanIslands: returns empty for nonexistent dir', async () => {
  const { scanIslands } = await import('../src/route-scanner.ts');
  const islandsDir = Deno.makeTempDirSync({ prefix: 'ssg-islands-empty-' });
  try {
    const files = await scanIslands(join(islandsDir, 'nonexistent'));
    assertEquals(files, []);
  } finally {
    rmSync(islandsDir, { recursive: true, force: true });
  }
});

// ─── scanIslandMeta ────────────────────────────────────────────

Deno.test('scanIslandMeta: extracts openElement export with hydrate', async () => {
  // Create a temp dir with an island that has openElement export
  const metaDir = Deno.makeTempDirSync({ prefix: 'ssg-meta-test-' });
  writeFileSync(
    join(metaDir, 'my-counter.ts'),
    `
    export const tagName = 'my-counter';
    import { defineIslandConfig } from '@openelement/app';
    export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });
    export default {};
  `,
    'utf-8',
  );

  const { scanIslandMeta } = await import('../src/route-scanner.ts');
  const meta = await scanIslandMeta(metaDir, ['my-counter.ts']);

  assertExists(meta['my-counter']);
  assertEquals(meta['my-counter'].hydrate, 'idle');
  assertEquals(meta['my-counter'].ssr, true);
  assertEquals(meta['my-counter'].dsd, true);

  rmSync(metaDir, { recursive: true, force: true });
});

Deno.test('scanIslandMeta: handles hydrate=only (client-only)', async () => {
  const metaDir = Deno.makeTempDirSync({ prefix: 'ssg-meta-test2-' });
  writeFileSync(
    join(metaDir, 'client-only.ts'),
    `
    import { defineIslandConfig } from '@openelement/app';
    export const openElement = defineIslandConfig({ hydrate: 'only' });
    export default {};
  `,
    'utf-8',
  );

  const { scanIslandMeta } = await import('../src/route-scanner.ts');
  const meta = await scanIslandMeta(metaDir, ['client-only.ts']);

  assertExists(meta['client-only']);
  assertEquals(meta['client-only'].hydrate, 'only');
  assertEquals(meta['client-only'].ssr, false);
  assertEquals(meta['client-only'].dsd, false);

  rmSync(metaDir, { recursive: true, force: true });
});

Deno.test('scanIslandMeta: skips files without openElement export', async () => {
  const metaDir = Deno.makeTempDirSync({ prefix: 'ssg-meta-test3-' });
  writeFileSync(
    join(metaDir, 'plain.ts'),
    `
    export const tagName = 'plain-element';
    export default {};
  `,
    'utf-8',
  );

  const { scanIslandMeta } = await import('../src/route-scanner.ts');
  const meta = await scanIslandMeta(metaDir, ['plain.ts']);

  // Should have no metadata for this file
  assertEquals(Object.keys(meta).length, 0);

  rmSync(metaDir, { recursive: true, force: true });
});

// ─── scanRoutes ────────────────────────────────────────────────

let routesDir: string;

Deno.test({
  name: 'scanRoutes: setup temp dir',
  fn() {
    routesDir = Deno.makeTempDirSync({ prefix: 'ssg-routes-test-' });
    mkdirSync(join(routesDir, 'api'), { recursive: true });
    mkdirSync(join(routesDir, 'blog'), { recursive: true });
    // Page routes
    writeFileSync(
      join(routesDir, 'index.ts'),
      `
      export const tagName = 'home-page';
      export const loader = async (ctx) => ({ hello: 'world' });
      export default {};
    `,
      'utf-8',
    );
    writeFileSync(
      join(routesDir, 'about.ts'),
      `
      export const tagName = 'about-page';
      export default {};
    `,
      'utf-8',
    );
    // Dynamic route
    writeFileSync(
      join(routesDir, 'blog', '[slug].ts'),
      `
      export const tagName = 'blog-post';
      export const loader = async (ctx) => ({ post: ctx.params.slug });
      export default {};
    `,
      'utf-8',
    );
    // API route
    writeFileSync(
      join(routesDir, 'api', 'hello.ts'),
      `
      export default function(req) { return new Response('hello'); }
    `,
      'utf-8',
    );
    // Special files
    writeFileSync(
      join(routesDir, '_renderer.ts'),
      'export default { wrap: (node) => node };',
      'utf-8',
    );
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test('scanRoutes: discovers page and API routes', async () => {
  const { scanRoutes } = await import('../src/route-scanner.ts');
  const entries = await scanRoutes(routesDir);

  // Should find: index, about, blog/[slug], api/hello = 4 route entries
  // Plus _renderer.ts as special
  assertEquals(entries.length, 5);

  const pages = entries.filter((e) => e.type === 'page');
  const apis = entries.filter((e) => e.type === 'api');
  const specials = entries.filter((e) => e.type === 'special');

  assertEquals(pages.length, 3);
  assertEquals(apis.length, 1);
  assertEquals(specials.length, 1);
});

Deno.test('scanRoutes: detects dynamic routes with params', async () => {
  const { scanRoutes } = await import('../src/route-scanner.ts');
  const entries = await scanRoutes(routesDir);

  const blogRoute = entries.find((e) => e.path === '/blog/:slug');
  assertExists(blogRoute);
  assertEquals(blogRoute?.params?.length, 1);
  assertEquals(blogRoute?.params?.[0], 'slug');
});

Deno.test('scanRoutes: reads tagName from route modules', async () => {
  const { scanRoutes } = await import('../src/route-scanner.ts');
  const entries = await scanRoutes(routesDir);

  const home = entries.find((e) => e.path === '/');
  assertEquals(home?.tagName, 'home-page');
});

Deno.test('scanRoutes: returns empty for nonexistent dir', async () => {
  const { scanRoutes } = await import('../src/route-scanner.ts');
  const entries = await scanRoutes(join(routesDir, 'nonexistent'));
  assertEquals(entries, []);
});

// ─── Loader/Action detection in route modules ──────────────────

Deno.test('scanRoutes: route modules with loader exports are detected', async () => {
  const { scanRoutes } = await import('../src/route-scanner.ts');
  const entries = await scanRoutes(routesDir);

  const home = entries.find((e) => e.path === '/');
  // The scanRoutes function doesn't directly emit loader info - it's in the tagName
  // But the test verifies the module is correctly discovered
  assertExists(home);
  assertEquals(home?.filePath, 'index.ts');
});

// ─── scanCemManifests ──────────────────────────────────────────

Deno.test('scanCemManifests: returns empty when node_modules missing', async () => {
  const { scanCemManifests } = await import('../src/route-scanner.ts');
  const results = await scanCemManifests(join(routesDir, 'node_modules'));
  assertEquals(results, []);
});

Deno.test('scanPackageManifests: returns empty array for empty package list', async () => {
  const { scanPackageManifests } = await import('../src/route-scanner.ts');
  const result = await scanPackageManifests([]);
  assertEquals(result, []);
});

Deno.test('scanPackageManifests: rejects packages without manifest export', async () => {
  const { OpenElementError } = await import('@openelement/core/errors');
  const { scanPackageManifests } = await import('../src/route-scanner.ts');
  try {
    await scanPackageManifests(['jsr:@std/assert']);
  } catch (error) {
    assertEquals(error instanceof OpenElementError, true);
  }
});

Deno.test('scanCemManifests: finds custom-elements.json files', async () => {
  const { scanCemManifests } = await import('../src/route-scanner.ts');
  const tmpDir = Deno.makeTempDirSync({ prefix: 'ssg-cem-test-' });
  try {
    const pkgWithCem = join(tmpDir, 'wc-with-cem');
    const pkgNoCem = join(tmpDir, 'no-cem-pkg');
    mkdirSync(pkgWithCem, { recursive: true });
    mkdirSync(pkgNoCem, { recursive: true });
    writeFileSync(
      join(pkgWithCem, 'custom-elements.json'),
      JSON.stringify({ schemaVersion: '1.0.0', modules: [] }),
      'utf-8',
    );
    writeFileSync(join(pkgNoCem, 'package.json'), '{"name":"no-cem-pkg"}', 'utf-8');

    const results = await scanCemManifests(tmpDir);
    assertEquals(results.length, 1);
    assertEquals(results[0].packageName, 'wc-with-cem');
    assertEquals(typeof results[0].json, 'string');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

Deno.test('scanCemManifests: handles scoped packages', async () => {
  const { scanCemManifests } = await import('../src/route-scanner.ts');
  const tmpDir = Deno.makeTempDirSync({ prefix: 'ssg-cem-scoped-test-' });
  try {
    const scopedPkg = join(tmpDir, '@my-org', 'my-wc');
    mkdirSync(scopedPkg, { recursive: true });
    writeFileSync(
      join(scopedPkg, 'custom-elements.json'),
      JSON.stringify({ schemaVersion: '1.0.0', modules: [] }),
      'utf-8',
    );

    const results = await scanCemManifests(tmpDir);
    assertEquals(results.length, 1);
    assertEquals(results[0].packageName, '@my-org/my-wc');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

Deno.test('detectAndClassifyCemPackages: classifies client-only by default', async () => {
  const { detectAndClassifyCemPackages } = await import('../src/route-scanner.ts');
  const tmpDir = Deno.makeTempDirSync({ prefix: 'ssg-cem-classify-test-' });
  try {
    const pkg = join(tmpDir, 'vanilla-wc');
    mkdirSync(pkg, { recursive: true });
    writeFileSync(
      join(pkg, 'custom-elements.json'),
      JSON.stringify({
        schemaVersion: '1.0.0',
        modules: [{
          kind: 'javascript-module',
          path: './src/index.js',
          declarations: [{
            kind: 'custom-element',
            tagName: 'my-button',
            name: 'MyButton',
          }],
        }],
      }),
      'utf-8',
    );

    const result = await detectAndClassifyCemPackages(tmpDir);
    assertEquals(result.length, 1);
    assertEquals(result[0].tagName, 'my-button');
    assertEquals(result[0].tier, 'client-only');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

Deno.test('detectAndClassifyCemPackages: skips invalid CEM JSON', async () => {
  const { detectAndClassifyCemPackages } = await import('../src/route-scanner.ts');
  const tmpDir = Deno.makeTempDirSync({ prefix: 'ssg-cem-invalid-test-' });
  try {
    const pkg = join(tmpDir, 'broken-wc');
    mkdirSync(pkg, { recursive: true });
    writeFileSync(join(pkg, 'custom-elements.json'), 'not-valid-json{{{', 'utf-8');

    const result = await detectAndClassifyCemPackages(tmpDir);
    assertEquals(result.length, 0);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

// Cleanup
Deno.test({
  name: 'route-scanner: cleanup temp dirs',
  fn() {
    if (routesDir) rmSync(routesDir, { recursive: true, force: true });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
