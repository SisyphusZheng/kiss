import { assertEquals, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { createHonoRequestContext } from '../src/hono.ts';

Deno.test('hono driver: maps Hono context into OpenElement RequestContext', () => {
  const request = new Request('https://example.test/docs/intro?tab=api', {
    method: 'POST',
  });

  const context = createHonoRequestContext({
    context: {
      req: {
        raw: request,
        param: () => ({ slug: 'intro' }),
      },
      env: { stage: 'test' },
      executionCtx: { runtime: 'hono' },
    },
    route: { kind: 'page', path: '/docs/:slug', paramNames: ['slug'] },
  });

  assertEquals(context.request, request);
  assertEquals(context.path, '/docs/intro');
  assertEquals(context.method, 'POST');
  assertEquals(context.params, { slug: 'intro' });
  assertEquals(context.searchParams.get('tab'), 'api');
  assertEquals(context.env, { stage: 'test' });
  assertEquals(context.platform, { runtime: 'hono' });
  assertEquals(context.route?.path, '/docs/:slug');
});

Deno.test('hono driver: explicit request supports test and non-standard Hono contexts', () => {
  const context = createHonoRequestContext({
    context: {},
    request: new Request('https://example.test/fallback'),
  });

  assertEquals(context.path, '/fallback');
  assertEquals(context.params, {});
});

Deno.test('hono driver: missing request fails with a clear diagnostic', () => {
  assertThrows(
    () => createHonoRequestContext({ context: {} }),
    Error,
    'Hono driver requires a Web Request',
  );
});
