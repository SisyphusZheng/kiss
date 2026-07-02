import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
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

  assertEquals(createRenderPipeline([{ phase: 'route', name: 'match route' }]), {
    steps: [{ phase: 'route', name: 'match route' }],
  });
});
