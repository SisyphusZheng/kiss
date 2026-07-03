import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import {
  createAssetManifestFromViteManifest,
  createHonoRequestDriver,
  createRouteGraphFromEntries,
  createViteAssetDriver,
} from '../src/drivers.ts';

Deno.test('ssg drivers: maps scanned routes into OpenElement RouteGraph', () => {
  const graph = createRouteGraphFromEntries(
    [
      {
        type: 'page',
        path: '/docs/:slug',
        filePath: '/project/routes/docs/[slug].tsx',
        varName: 'route0',
        tagName: 'docs-page',
        params: ['slug'],
      },
      {
        type: 'api',
        path: '/api/search',
        filePath: '/project/routes/api/search.ts',
        varName: 'route1',
      },
      {
        type: 'island',
        path: '/islands/counter',
        filePath: '/project/islands/counter.tsx',
        varName: 'island0',
      },
    ],
    '/docs/',
  );

  assertEquals(graph, {
    basePath: '/docs',
    routes: [
      {
        kind: 'page',
        path: '/docs/:slug',
        filePath: '/project/routes/docs/[slug].tsx',
        importPath: '/project/routes/docs/[slug].tsx',
        tagName: 'docs-page',
        paramNames: ['slug'],
      },
      {
        kind: 'api',
        path: '/api/search',
        filePath: '/project/routes/api/search.ts',
        importPath: '/project/routes/api/search.ts',
      },
    ],
  });
});

Deno.test('ssg drivers: Hono is an explicit request driver over route entries', () => {
  const driver = createHonoRequestDriver();
  const code = driver.entryCode([
    {
      type: 'page',
      path: '/',
      filePath: '/project/routes/index.tsx',
      varName: 'route0',
      tagName: 'home-page',
    },
  ]);

  assertEquals(driver.name, 'hono');
  assertEquals(driver.routeGraph([]), { basePath: '/', routes: [] });
  assertEquals(driver.routeGraph([], '/docs/'), { basePath: '/docs', routes: [] });
  assertStringIncludes(code, "import { Hono } from 'hono'");
  assertStringIncludes(code, 'const app = new Hono()');
});

Deno.test('ssg drivers: Vite manifest becomes an OpenElement AssetManifest', () => {
  const manifest = createAssetManifestFromViteManifest(
    {
      'src/main.ts': {
        file: 'assets/main.js',
        css: ['assets/main.css'],
        assets: ['assets/logo.svg'],
      },
    },
    '/docs/',
  );

  assertEquals(manifest, {
    basePath: '/docs/',
    entries: [
      { fileName: 'assets/main.js', href: '/docs/assets/main.js', kind: 'script' },
      { fileName: 'assets/main.css', href: '/docs/assets/main.css', kind: 'style' },
      { fileName: 'assets/logo.svg', href: '/docs/assets/logo.svg', kind: 'asset' },
    ],
  });

  assertEquals(createViteAssetDriver().name, 'vite');
});

Deno.test('ssg drivers: Vite asset manifest handles empty and CSS-only entries', () => {
  assertEquals(createAssetManifestFromViteManifest({}), {
    basePath: '/',
    entries: [],
  });

  assertEquals(
    createAssetManifestFromViteManifest(
      {
        'src/styles.css': {
          css: ['/assets/critical.css'],
          assets: ['assets/font.woff2'],
        },
      },
      '/docs',
    ),
    {
      basePath: '/docs/',
      entries: [
        { fileName: '/assets/critical.css', href: '/docs/assets/critical.css', kind: 'style' },
        { fileName: 'assets/font.woff2', href: '/docs/assets/font.woff2', kind: 'asset' },
      ],
    },
  );
});
