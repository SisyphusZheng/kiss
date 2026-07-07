/**
 * @openelement/ssg - SSG render pipeline tests
 *
 * Tests for ssgRender, expandDynamicRoutes, and expandI18nLocales.
 * Uses mock SSR bundles and temporary filesystem.
 */

import { assertEquals, assertExists, assertRejects } from 'jsr:@std/assert@^1.0.0';
import { join } from 'node:path';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolveDynamicRoutePath } from '../src/ssg-helpers.ts';
import type { SsgRenderOptions } from '@openelement/ssg';

// ─── expandDynamicRoutes ───────────────────────────────────────

Deno.test('expandDynamicRoutes: renders dynamic routes via getStaticPaths', async () => {
  const { expandDynamicRoutes } = await import('../src/ssg-dynamic.ts');
  const root = Deno.makeTempDirSync({ prefix: 'ssg-dynamic-test-' });
  const outDir = 'dist';
  const outputDir = join(root, outDir);
  mkdirSync(outputDir, { recursive: true });

  const dynamicRoutes = [
    { path: '/blog/:slug', tagName: 'blog-post', isDynamic: true, paramNames: ['slug'] },
  ];

  const result = await expandDynamicRoutes(
    dynamicRoutes,
    (_path, opts) =>
      Promise.resolve({
        html: `\u003chtml\u003e\u003cbody\u003eBlog: ${
          (opts?.params as Record<string, string>)?.slug
        }\u003c/body\u003e\u003c/html\u003e`,
        errors: [],
        hydrationHints: [],
        componentCount: 1,
        renderTimeMs: 5,
      }),
    (_path) => Promise.resolve([{ slug: 'hello' }, { slug: 'world' }]),
    {} as SsgRenderOptions,
    root,
    outDir,
  );

  // Check that static path params were collected
  assertExists(result.get('/blog/:slug'));
  assertEquals(result.get('/blog/:slug')?.length, 2);

  // Check that HTML files were written
  assertEquals(existsSync(join(outputDir, 'blog', 'hello', 'index.html')), true);
  assertEquals(existsSync(join(outputDir, 'blog', 'world', 'index.html')), true);

  // Read content to verify render was called
  const content = Deno.readTextFileSync(join(outputDir, 'blog', 'hello', 'index.html'));
  assertEquals(content.includes('Blog: hello'), true);

  rmSync(root, { recursive: true, force: true });
});

Deno.test('expandDynamicRoutes: handles empty getStaticPaths', async () => {
  const { expandDynamicRoutes } = await import('../src/ssg-dynamic.ts');
  const root = Deno.makeTempDirSync({ prefix: 'ssg-dynamic-empty-' });
  const outDir = 'dist';
  mkdirSync(join(root, outDir), { recursive: true });

  const dynamicRoutes = [
    { path: '/blog/:slug', tagName: 'blog-post', isDynamic: true, paramNames: ['slug'] },
  ];

  const result = await expandDynamicRoutes(
    dynamicRoutes,
    () =>
      Promise.resolve({
        html: '',
        errors: [],
        hydrationHints: [],
        componentCount: 0,
        renderTimeMs: 0,
      }),
    () => Promise.resolve([]),
    {} as SsgRenderOptions,
    root,
    outDir,
  );

  assertEquals(result.get('/blog/:slug')?.length, 0);

  rmSync(root, { recursive: true, force: true });
});

Deno.test('expandDynamicRoutes: handles missing getStaticPaths', async () => {
  const { expandDynamicRoutes } = await import('../src/ssg-dynamic.ts');
  const root = Deno.makeTempDirSync({ prefix: 'ssg-dynamic-nogsp-' });

  const result = await expandDynamicRoutes(
    [{ path: '/blog/:slug', tagName: 'blog-post', isDynamic: true, paramNames: ['slug'] }],
    undefined,
    undefined,
    {} as SsgRenderOptions,
    root,
    'dist',
  );

  assertEquals(result.size, 0);
  rmSync(root, { recursive: true, force: true });
});

// ─── expandI18nLocales ─────────────────────────────────────────

Deno.test('expandI18nLocales: renders locale-prefixed output', async () => {
  const { expandI18nLocales } = await import('../src/ssg-dynamic.ts');
  const root = Deno.makeTempDirSync({ prefix: 'ssg-i18n-test-' });
  const outDir = 'dist';
  mkdirSync(join(root, outDir), { recursive: true });

  // First, write a base page
  writeFileSync(join(root, outDir, 'index.html'), '<html><body>Home</body></html>', 'utf-8');

  await expandI18nLocales(
    {
      i18nOptions: { locales: ['en', 'zh-CN'], defaultLocale: 'en' },
    },
    (path, opts) =>
      Promise.resolve({
        html: `<html><body>${path} (${opts?.locale})</body></html>`,
        errors: [],
        hydrationHints: [],
        componentCount: 1,
        renderTimeMs: 5,
      }),
    [
      { path: '/', tagName: 'home-page', isDynamic: false, paramNames: [] },
      { path: '/about', tagName: 'about-page', isDynamic: false, paramNames: [] },
    ],
    undefined,
    {} as SsgRenderOptions,
    root,
    outDir,
  );

  // Check locale output exists
  assertEquals(existsSync(join(root, outDir, 'en', 'index.html')), true);
  assertEquals(existsSync(join(root, outDir, 'en', 'about', 'index.html')), true);
  assertEquals(existsSync(join(root, outDir, 'zh-CN', 'index.html')), true);
  assertEquals(existsSync(join(root, outDir, 'zh-CN', 'about', 'index.html')), true);

  rmSync(root, { recursive: true, force: true });
});

Deno.test('expandI18nLocales: skips when no i18n options', async () => {
  const { expandI18nLocales } = await import('../src/ssg-dynamic.ts');
  const root = Deno.makeTempDirSync({ prefix: 'ssg-i18n-skip-' });
  await expandI18nLocales(
    {},
    undefined,
    [],
    undefined,
    {} as SsgRenderOptions,
    root,
    'dist',
  );
  // Should not throw - just returns early
  rmSync(root, { recursive: true, force: true });
});

Deno.test('expandI18nLocales: skips when single locale', async () => {
  const { expandI18nLocales } = await import('../src/ssg-dynamic.ts');
  const root = Deno.makeTempDirSync({ prefix: 'ssg-i18n-single-' });

  await expandI18nLocales(
    { i18nOptions: { locales: ['en'], defaultLocale: 'en' } },
    undefined,
    [],
    undefined,
    {} as SsgRenderOptions,
    root,
    'dist',
  );
  // Should not throw - just returns early
  rmSync(root, { recursive: true, force: true });
});

// ─── ssgRender ─────────────────────────────────────────────────

Deno.test('ssgRender: exists and has correct signature', async () => {
  const { ssgRender } = await import('../src/ssg-render.ts');
  assertEquals(typeof ssgRender, 'function');
  // At least 2 required params (module, options). evidence has default value.
  assertEquals(ssgRender.length >= 2, true);
});

Deno.test('ssgRender: throws when no default export', async () => {
  const { ssgRender } = await import('../src/ssg-render.ts');
  const root = Deno.makeTempDirSync({ prefix: 'ssg-render-test-' });

  await assertRejects(
    () =>
      ssgRender(
        {
          default: null,
          routeInfo: [{ path: '/', tagName: 'home', isDynamic: false, paramNames: [] }],
        },
        { root, outDir: 'dist' },
      ),
    Error,
    'no Hono app found',
  );

  rmSync(root, { recursive: true, force: true });
});

// ─── helper: resolveDynamicRoutePath ───────────────────────────

Deno.test('resolveDynamicRoutePath: expands dynamic path correctly', () => {
  assertEquals(
    resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: 'hello-world' }),
    '/blog/hello-world',
  );
});

Deno.test('resolveDynamicRoutePath: handles multiple params', () => {
  assertEquals(
    resolveDynamicRoutePath('/:year/:month/:slug', ['year', 'month', 'slug'], {
      year: '2026',
      month: '01',
      slug: 'post',
    }),
    '/2026/01/post',
  );
});

Deno.test('resolveDynamicRoutePath: rejects path traversal', () => {
  let threw = false;
  try {
    resolveDynamicRoutePath('/:slug', ['slug'], { slug: '..' });
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

Deno.test('ssgRender: throws when routeInfo is empty', async () => {
  const { ssgRender } = await import('../src/ssg-render.ts');
  const root = Deno.makeTempDirSync({ prefix: 'ssg-empty-routes-' });

  const app = {
    fetch: () => Promise.resolve(new Response('ok')),
  };

  await assertRejects(
    () =>
      ssgRender(
        { default: app, routeInfo: [] },
        { root, outDir: 'dist' },
      ),
    Error,
    'routeInfo is empty',
  );

  rmSync(root, { recursive: true, force: true });
});
