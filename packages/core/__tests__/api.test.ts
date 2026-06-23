import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import type { OpenElementApiContext } from '@openelement/protocol/framework';

Deno.test('OpenElementApiContext type has correct shape', () => {
  // Verify the type is importable and has the expected structure.
  // Runtime construction is done inline by the build pipeline.
  const ctx: OpenElementApiContext = {
    request: new Request('https://example.com/api/items/1'),
    params: { id: '1' },
    env: { MODE: 'test' },
    platform: { runtime: 'test' },
  };

  assertEquals(ctx.request.url, 'https://example.com/api/items/1');
  assertEquals(ctx.params.id, '1');
  assertEquals(ctx.env.MODE, 'test');
  assertEquals(ctx.platform, { runtime: 'test' });
});

Deno.test('OpenElementApiContext optional platform defaults to undefined', () => {
  const ctx: OpenElementApiContext = {
    request: new Request('https://example.com/api/health'),
    params: {},
    env: {},
  };

  assertEquals(ctx.platform, undefined);
});
