import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  createAppModel,
  createDefaultRenderPipeline,
  createRenderPipeline,
  createRequestContext,
  createRouteGraph,
} from '../src/model.ts';

Deno.test('app model: creates a route graph without host adapters', () => {
  const graph = createRouteGraph({
    basePath: 'docs/',
    routes: [
      {
        kind: 'page',
        path: 'docs/[slug]/',
        tagName: 'docs-page',
        paramNames: ['slug'],
        children: [{ kind: 'api', path: 'api/search/' }],
      },
    ],
  });

  assertEquals(graph.basePath, '/docs');
  assertEquals(graph.routes[0].path, '/docs/[slug]');
  assertEquals(graph.routes[0].paramNames, ['slug']);
  assertEquals(graph.routes[0].children?.[0].path, '/api/search');
});

Deno.test('app model: trims whitespace-only paths to root', () => {
  const graph = createRouteGraph({
    routes: [{ kind: 'page', path: '   ' }],
  });

  assertEquals(graph.routes[0].path, '/');
});

Deno.test('app model: creates an empty route graph with default base path', () => {
  assertEquals(createRouteGraph({ routes: [] }), {
    basePath: '/',
    routes: [],
  });
});

Deno.test('app model: normalizes deep route graph children and metadata', () => {
  const graph = createRouteGraph({
    routes: [{
      kind: 'page',
      path: '/docs',
      filePath: 'routes/docs.tsx',
      importPath: './routes/docs.tsx',
      meta: { section: 'docs' },
      children: [{
        kind: 'page',
        path: '/docs/guide',
        children: [{ kind: 'api', path: '/docs/guide/search/' }],
      }],
    }],
  });

  assertEquals(graph.routes[0].filePath, 'routes/docs.tsx');
  assertEquals(graph.routes[0].importPath, './routes/docs.tsx');
  assertEquals(graph.routes[0].meta, { section: 'docs' });
  assertEquals(graph.routes[0].children?.[0].children?.[0].path, '/docs/guide/search');
});

Deno.test('app model: request context normalizes Web Request details', () => {
  const route = { kind: 'page' as const, path: '/notes/:id', paramNames: ['id'] };
  const context = createRequestContext({
    request: new Request('https://example.test/notes/42?tab=reader', { method: 'POST' }),
    params: { id: '42' },
    env: { stage: 'test' },
    platform: { runtime: 'node' },
    route,
  });

  assertEquals(context.path, '/notes/42');
  assertEquals(context.method, 'POST');
  assertEquals(context.params, { id: '42' });
  assertEquals(context.searchParams.get('tab'), 'reader');
  assertEquals(context.env, { stage: 'test' });
  assertEquals(context.platform, { runtime: 'node' });
  assertEquals(context.route?.path, '/notes/:id');
  assertEquals(context.route?.paramNames, ['id']);
});

Deno.test('app model: request context defaults optional route and params', () => {
  const context = createRequestContext({
    request: new Request('https://example.test/freeform'),
  });

  assertEquals(context.path, '/freeform');
  assertEquals(context.method, 'GET');
  assertEquals(context.params, {});
  assertEquals(context.route, undefined);
  assertEquals(context.platform, undefined);
});

Deno.test('app model: render pipeline names OpenElement phases before driver details', () => {
  const pipeline = createDefaultRenderPipeline();

  assertEquals(pipeline.steps.map((step) => step.phase), [
    'route',
    'layout',
    'head',
    'assets',
    'islands',
    'serialize',
    'error',
  ]);
  assertEquals(
    pipeline.steps
      .filter((step) => step.optional)
      .map((step) => step.phase),
    ['layout', 'islands', 'error'],
  );

  assertEquals(createRenderPipeline([{ phase: 'route', name: 'match route' }]), {
    steps: [{ phase: 'route', name: 'match route' }],
  });
});

Deno.test('app model: creates a complete composite model with safe defaults', () => {
  const model = createAppModel();

  assertEquals(model.routes, { basePath: '/', routes: [] });
  assertEquals(model.assets, { basePath: '/', entries: [] });
  assertEquals(model.islands, { islands: [] });
  assertEquals(model.deployment, { runtime: 'static', adapter: 'custom' });
  assertEquals(model.renderPipeline.steps.map((step) => step.phase), [
    'route',
    'layout',
    'head',
    'assets',
    'islands',
    'serialize',
    'error',
  ]);
});
