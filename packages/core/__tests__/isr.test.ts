import { assertEquals, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { createIsrCacheKey, isIsrRouteConfig, MemoryIsrCache } from '../src/isr.ts';

Deno.test('createIsrCacheKey sorts and encodes params', () => {
  assertEquals(
    createIsrCacheKey('/blog/:slug', { slug: 'hello world', locale: 'en' }),
    'openelement:isr:/blog/%3Aslug?locale=en&slug=hello%20world',
  );
});

Deno.test('createIsrCacheKey encodes special characters in route path', () => {
  assertEquals(
    createIsrCacheKey('/foo/bar?a=1&b=2', {}),
    'openelement:isr:/foo/bar%3Fa%3D1%26b%3D2',
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

Deno.test('MemoryIsrCache evicts oldest entries when over capacity', () => {
  const cache = new MemoryIsrCache({ maxEntries: 3 });
  const entry = (k: string) => ({
    html: `<h1>${k}</h1>`,
    createdAt: 1_000,
    revalidate: 60,
  });

  cache.set('a', entry('a'));
  cache.set('b', entry('b'));
  cache.set('c', entry('c'));
  cache.set('d', entry('d'));

  assertEquals(cache.size, 3);
  assertEquals(cache.get('a', 1_000).state, 'miss');
  assertEquals(cache.get('b', 1_000).state, 'hit');
  assertEquals(cache.get('c', 1_000).state, 'hit');
  assertEquals(cache.get('d', 1_000).state, 'hit');
});

Deno.test('MemoryIsrCache updates LRU order on access', () => {
  const cache = new MemoryIsrCache({ maxEntries: 3 });
  const entry = (k: string) => ({
    html: `<h1>${k}</h1>`,
    createdAt: 1_000,
    revalidate: 60,
  });

  cache.set('a', entry('a'));
  cache.set('b', entry('b'));
  cache.set('c', entry('c'));

  // Access 'a' to make it most-recently-used.
  assertEquals(cache.get('a', 1_000).state, 'hit');

  // Inserting 'd' should evict 'b', the oldest after the access.
  cache.set('d', entry('d'));

  assertEquals(cache.size, 3);
  assertEquals(cache.get('a', 1_000).state, 'hit');
  assertEquals(cache.get('b', 1_000).state, 'miss');
  assertEquals(cache.get('c', 1_000).state, 'hit');
  assertEquals(cache.get('d', 1_000).state, 'hit');
});

Deno.test('MemoryIsrCache validates maxEntries', () => {
  assertThrows(() => new MemoryIsrCache({ maxEntries: 0 }), RangeError);
  assertThrows(() => new MemoryIsrCache({ maxEntries: -1 }), RangeError);
  assertThrows(() => new MemoryIsrCache({ maxEntries: 1.5 }), RangeError);
});
