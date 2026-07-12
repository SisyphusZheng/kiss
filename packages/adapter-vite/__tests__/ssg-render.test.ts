/**
 * @openelement/adapter-vite - ssg-render.ts tests
 */
import { assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { Hono } from 'hono';
import { resolveDynamicRoutePath, ssgRender } from '../src/internal/ssg/index.ts';
import type { SsgPageOutput, SsgRenderOptions, SsrBundle } from '../src/internal/ssg/index.ts';

function createMockBundle(overrides: Partial<SsrBundle> = {}): SsrBundle {
  const app = new Hono();
  app.get('/', (c) => c.text('ok'));
  return {
    default: app,
    routeInfo: [
      { path: '/', tagName: 'index-page', isDynamic: false, paramNames: [] },
      { path: '/about', tagName: 'about-page', isDynamic: false, paramNames: [] },
    ],
    ...overrides,
  };
}

const defaultOptions: SsgRenderOptions = {
  root: Deno.cwd(),
  outDir: './dist-test-ssg-render',
};

Deno.test('resolveDynamicRoutePath encodes safe params', () => {
  assertEquals(
    resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: 'hello world' }),
    '/blog/hello%20world',
  );
});

Deno.test('resolveDynamicRoutePath rejects path traversal params', () => {
  assertThrows(
    () => resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: '../evil' }),
    Error,
    'Unsafe value',
  );
  assertThrows(
    () => resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: '..' }),
    Error,
    'Unsafe value',
  );
  assertThrows(
    () => resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: 'a/b' }),
    Error,
    'Unsafe value',
  );
});

Deno.test('resolveDynamicRoutePath rejects missing params', () => {
  assertThrows(
    () => resolveDynamicRoutePath('/blog/:slug', ['slug'], {}),
    Error,
    'Missing value',
  );
});

Deno.test('ssgRender - rejects when module has no default export', async () => {
  const bundle = createMockBundle({ default: undefined });
  await assertRejects(
    () => ssgRender(bundle as SsrBundle, defaultOptions),
    Error,
    'no Hono app found',
  );
});

Deno.test('ssgRender - throws when routeInfo is empty', async () => {
  const bundle = createMockBundle({ routeInfo: [] });
  await assertRejects(
    () => ssgRender(bundle, defaultOptions),
    Error,
    'routeInfo is empty',
  );
});

Deno.test('ssgRender - writes ISR manifest for revalidate routes', async () => {
  const outDir = './dist-test-ssg-render-isr';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/', tagName: 'index-page', isDynamic: false, paramNames: [], revalidate: 60 },
    ],
  });

  await ssgRender(bundle, { ...defaultOptions, outDir });

  const manifest = JSON.parse(await Deno.readTextFile(`${outDir}/isr-manifest.json`));
  assertEquals(manifest, [
    {
      path: '/',
      revalidate: 60,
      cacheKey: 'openelement:isr:/',
      params: {},
    },
  ]);
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});

Deno.test('ssgRender - handles dynamic routes with no getStaticPaths', async () => {
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/blog/:slug', tagName: 'blog-page', isDynamic: true, paramNames: ['slug'] },
    ],
    renderRoute: undefined,
    getStaticPaths: undefined,
  });
  await ssgRender(bundle, defaultOptions);
});

Deno.test('ssgRender - handles getStaticPaths failure gracefully', async () => {
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/blog/:slug', tagName: 'blog-page', isDynamic: true, paramNames: ['slug'] },
    ],
    renderRoute: (() =>
      Promise.resolve(
        {
          html: '<html><body>test</body></html>',
          errors: [],
          hydrationHints: [],
          componentCount: 0,
          renderTimeMs: 0,
        } as SsgPageOutput,
      )) as SsrBundle['renderRoute'],
    getStaticPaths: (() => Promise.reject(new Error('fail'))) as SsrBundle['getStaticPaths'],
  });
  await ssgRender(bundle, defaultOptions);
});

Deno.test('ssgRender - handles empty getStaticPaths gracefully', async () => {
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/blog/:slug', tagName: 'blog-page', isDynamic: true, paramNames: ['slug'] },
    ],
    renderRoute: (() =>
      Promise.resolve(
        {
          html: '<html><body>test</body></html>',
          errors: [],
          hydrationHints: [],
          componentCount: 0,
          renderTimeMs: 0,
        } as SsgPageOutput,
      )) as SsrBundle['renderRoute'],
    getStaticPaths: (() => Promise.resolve([])) as SsrBundle['getStaticPaths'],
  });
  await ssgRender(bundle, defaultOptions);
});

Deno.test('ssgRender - handles options with viewTransition disabled', async () => {
  const bundle = createMockBundle();
  await ssgRender(bundle, { ...defaultOptions, viewTransition: false });
});

Deno.test('ssgRender - handles options with speculation enabled', async () => {
  const bundle = createMockBundle();
  await ssgRender(bundle, { ...defaultOptions, speculation: true });
});
