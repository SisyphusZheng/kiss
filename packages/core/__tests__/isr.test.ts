import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { createIsrCacheKey, isIsrRouteConfig, MemoryIsrCache } from '../src/isr.ts';

Deno.test('createIsrCacheKey sorts and encodes params', () => {
  assertEquals(
    createIsrCacheKey('/blog/:slug', { slug: 'hello world', locale: 'en' }),
    'openelement:isr:/blog/:slug?locale=en&slug=hello%20world',
  );
});

Deno.test('isIsrRouteConfig accepts positive finite revalidate seconds', () => {
  assertEquals(isIsrRouteConfig({ revalidate: 60 }), true);
  assertEquals(isIsrRouteConfig({ revalidate: 0 }), false);
  assertEquals(isIsrRouteConfig({ revalidate: Number.POSITIVE_INFINITY }), false);
  assertEquals(isIsrRouteConfig({}), false);
});

Deno.test('MemoryIsrCache reports miss, hit, stale, and delete', () => {
  const cache = new MemoryIsrCache();
  const key = '/docs';
  const createdAt = 1_000;

  assertEquals(cache.get(key, createdAt), { state: 'miss' });

  cache.set(key, { html: '<h1>Docs</h1>', createdAt, revalidate: 60 });

  assertEquals(cache.get(key, createdAt + 10_000).state, 'hit');
  assertEquals(cache.get(key, createdAt + 60_000).state, 'stale');

  cache.delete(key);
  assertEquals(cache.get(key, createdAt + 70_000), { state: 'miss' });
});
