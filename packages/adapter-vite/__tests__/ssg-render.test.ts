/**
 * @openelement/adapter-vite - ssg-render.ts tests
 */
import { assert, assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { Hono } from 'hono';
import { resolveDynamicRoutePath, ssgRender } from '../src/internal/ssg/index.ts';
import type { SsgPageOutput, SsgRenderOptions, SsrBundle } from '../src/internal/ssg/index.ts';

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

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

// ─── alpha.18 R2-H3: static-route non-200 outcomes ─────────────

Deno.test('ssgRender - static non-200 routes surface in the build summary and are not written', async () => {
  const outDir = './dist-test-ssg-render-non200';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const app = new Hono();
  app.get('/', (c) => c.html('<html><body>ok</body></html>'));
  app.get('/missing', (c) => c.html('<html><body>not found</body></html>', 404));
  app.get('/boom', (c) => c.html('<html><body>error</body></html>', 500));
  app.get('/moved', (c) => c.redirect('/'));
  const bundle = createMockBundle({
    default: app,
    routeInfo: [
      { path: '/', tagName: 'index-page', isDynamic: false, paramNames: [] },
      { path: '/missing', tagName: 'missing-page', isDynamic: false, paramNames: [] },
      { path: '/boom', tagName: 'boom-page', isDynamic: false, paramNames: [] },
      { path: '/moved', tagName: 'moved-page', isDynamic: false, paramNames: [] },
    ],
  });

  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(' '));
  };
  let summary;
  try {
    summary = await ssgRender(bundle, { ...defaultOptions, outDir });
  } finally {
    console.warn = originalWarn;
  }

  // The summary lists every non-200 static route with its status.
  const non200 = new Map(summary.staticNon200.map((r) => [r.path, r.status]));
  assertEquals(non200.get('/missing'), 404);
  assertEquals(non200.get('/boom'), 500);
  assertEquals(non200.get('/moved'), 302);
  assertEquals(non200.has('/'), false);
  assertEquals(summary.staticNon200.length, 3);

  // The build log surfaces the same count + paths.
  const summaryLine = warnings.find((w) => w.includes('non-200'));
  assert(summaryLine !== undefined, 'expected a non-200 summary warning in the build log');
  assert(summaryLine.includes('3'), 'summary must include the non-200 count');
  for (const path of ['/missing', '/boom', '/moved']) {
    assert(
      warnings.some((w) => w.includes(path)),
      `summary must list ${path}`,
    );
  }

  // Non-200 pages are not persisted; the 200 page is.
  assertEquals(await pathExists(`${outDir}/index.html`), true);
  assertEquals(await pathExists(`${outDir}/missing.html`), false);
  assertEquals(await pathExists(`${outDir}/missing/index.html`), false);
  assertEquals(await pathExists(`${outDir}/boom.html`), false);
  assertEquals(await pathExists(`${outDir}/boom/index.html`), false);
  assertEquals(await pathExists(`${outDir}/moved.html`), false);
  assertEquals(await pathExists(`${outDir}/moved/index.html`), false);
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});

Deno.test('ssgRender - dynamic-route defined 500 output fails the pipeline and writes nothing', async () => {
  const outDir = './dist-test-ssg-render-dyn500';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/', tagName: 'index-page', isDynamic: false, paramNames: [] },
      {
        path: '/blog/:slug',
        tagName: 'blog-page',
        isDynamic: true,
        paramNames: ['slug'],
        revalidate: 60,
      },
    ],
    renderRoute: (() =>
      Promise.resolve({
        html: '<html><body>500 Internal Server Error</body></html>',
        status: 500,
        errors: [{
          code: 'OPEN_ELEMENT_RENDER_RENDER_FAILED',
          severity: 'error',
          phase: 'render',
          tagName: 'blog-page',
          message: 'render exploded',
          recoverable: false,
        }],
        componentCount: 0,
        renderTimeMs: 0,
      } as SsgPageOutput)) as SsrBundle['renderRoute'],
    getStaticPaths: (() => Promise.resolve([{ slug: 'a' }])) as SsrBundle['getStaticPaths'],
  });

  await assertRejects(
    () => ssgRender(bundle, { ...defaultOptions, outDir }),
    Error,
    '/blog/a',
  );
  assertEquals(await pathExists(`${outDir}/blog/a/index.html`), false);
  // The ISR manifest must not register the failed page.
  assertEquals(await pathExists(`${outDir}/isr-manifest.json`), false);
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});

Deno.test('ssgRender - dynamic-route failure in warn mode skips the page and the ISR entry', async () => {
  const outDir = './dist-test-ssg-render-dynwarn';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/', tagName: 'index-page', isDynamic: false, paramNames: [] },
      {
        path: '/blog/:slug',
        tagName: 'blog-page',
        isDynamic: true,
        paramNames: ['slug'],
        revalidate: 60,
      },
    ],
    renderRoute: ((_path: string, opts?: Record<string, unknown>) => {
      const slug = (opts?.params as Record<string, string>).slug;
      return Promise.resolve(
        slug === 'a'
          ? {
            html: '<html><body>ok</body></html>',
            errors: [],
            componentCount: 0,
            renderTimeMs: 0,
          } as SsgPageOutput
          : {
            html: '<html><body>500 Internal Server Error</body></html>',
            status: 500,
            errors: [{
              code: 'OPEN_ELEMENT_RENDER_RENDER_FAILED',
              severity: 'error',
              phase: 'render',
              tagName: 'blog-page',
              message: 'render exploded',
              recoverable: false,
            }],
            componentCount: 0,
            renderTimeMs: 0,
          } as SsgPageOutput,
      );
    }) as SsrBundle['renderRoute'],
    getStaticPaths: (() =>
      Promise.resolve([{ slug: 'a' }, { slug: 'b' }])) as SsrBundle['getStaticPaths'],
  });

  await ssgRender(bundle, { ...defaultOptions, outDir, dynamicRouteFailure: 'warn' });
  assertEquals(await pathExists(`${outDir}/blog/a/index.html`), true);
  assertEquals(await pathExists(`${outDir}/blog/b/index.html`), false);
  // The ISR manifest registers only the successfully rendered page.
  const manifest = JSON.parse(await Deno.readTextFile(`${outDir}/isr-manifest.json`)) as Array<
    { path: string; revalidate: number; cacheKey: string; params: Record<string, string> }
  >;
  assertEquals(manifest, [
    {
      path: '/blog/:slug',
      revalidate: 60,
      cacheKey: 'openelement:isr:/blog/%3Aslug?slug=a',
      params: { slug: 'a' },
    },
  ]);
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});

// ─── 0.42.0-alpha.1 (ADR-0120): request-time route partition ──────────────

Deno.test('ssgRender - request-time routes skip prerender and emit server artifacts', async () => {
  const outDir = './dist-test-ssg-render-request-time';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const app = new Hono();
  app.get('/', (c) => c.html('<html><body>static home</body></html>'));
  app.get('/live', (c) => c.html('<html><body>request time</body></html>'));
  const bundle = createMockBundle({
    default: app,
    routeInfo: [
      { path: '/', tagName: 'index-page', isDynamic: false, paramNames: [] },
      {
        path: '/live',
        tagName: 'live-page',
        isDynamic: false,
        paramNames: [],
        rendering: 'dynamic',
        hasAction: true,
      },
    ],
  });

  await ssgRender(bundle, { ...defaultOptions, outDir });

  // The static route is prerendered; the request-time route is not.
  assert(await pathExists(`${outDir}/index.html`), 'static route should be prerendered');
  assert(
    !(await pathExists(`${outDir}/live/index.html`)) && !(await pathExists(`${outDir}/live.html`)),
    'request-time route must not be prerendered',
  );

  // Server artifacts land next to the SSR bundle.
  const manifest = JSON.parse(await Deno.readTextFile(`${outDir}/server/server-manifest.json`));
  assertEquals(manifest, {
    version: 1,
    requestTimeRoutes: [{ path: '/live', paramNames: [], hasAction: true }],
  });
  const serverEntry = await Deno.readTextFile(`${outDir}/server/index.js`);
  assert(serverEntry.includes('createOpenElementNitroHandler'));
  assert(serverEntry.includes("from './entry.js'"));

  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});

Deno.test('ssgRender - pages with actions cannot be prerendered (hard rule)', async () => {
  const outDir = './dist-test-ssg-render-action-rule';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/', tagName: 'index-page', isDynamic: false, paramNames: [] },
      {
        path: '/form',
        tagName: 'form-page',
        isDynamic: false,
        paramNames: [],
        hasAction: true,
      },
    ],
  });

  await assertRejects(
    () => ssgRender(bundle, { ...defaultOptions, outDir }),
    Error,
    'Pages with actions cannot be prerendered',
  );
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});

Deno.test('ssgRender - pure-static projects emit no server artifacts', async () => {
  const outDir = './dist-test-ssg-render-pure-static';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const bundle = createMockBundle();

  await ssgRender(bundle, { ...defaultOptions, outDir });

  assert(
    !(await pathExists(`${outDir}/server/server-manifest.json`)),
    'pure-static build must not emit a server manifest',
  );
  assert(
    !(await pathExists(`${outDir}/server/index.js`)),
    'pure-static build must not emit a server entry',
  );
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});
