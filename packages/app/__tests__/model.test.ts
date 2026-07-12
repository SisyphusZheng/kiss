import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { createRequestContext } from '../src/model.ts';

Deno.test('request context normalizes Web Request details', () => {
  const context = createRequestContext({
    request: new Request('https://example.test/notes/42?tab=reader', { method: 'POST' }),
    params: { id: '42' },
    env: { stage: 'test' },
    platform: { runtime: 'node' },
    route: { kind: 'page', path: 'notes/:id/', paramNames: ['id'] },
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

Deno.test('request context defaults optional route and params', () => {
  const context = createRequestContext({
    request: new Request('https://example.test/freeform'),
  });

  assertEquals(context.path, '/freeform');
  assertEquals(context.method, 'GET');
  assertEquals(context.params, {});
  assertEquals(context.route, undefined);
  assertEquals(context.platform, undefined);
});
