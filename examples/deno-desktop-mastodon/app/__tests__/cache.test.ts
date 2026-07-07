import { assertEquals } from '@std/assert';
import { clearCache, getCache, removeCache, setCache } from '../cache.ts';

Deno.test('setCache and getCache round-trip', () => {
  const key = 'test-roundtrip';
  removeCache(key);
  setCache(key, { hello: 'world' });
  const value = getCache<{ hello: string }>(key, 60_000);
  assertEquals(value, { hello: 'world' });
});

Deno.test('getCache returns undefined for missing key', () => {
  removeCache('missing');
  const value = getCache('missing', 60_000);
  assertEquals(value, undefined);
});

Deno.test('getCache returns undefined after TTL', () => {
  const key = 'test-ttl';
  setCache(key, 'value');
  const value = getCache<string>(key, -1);
  assertEquals(value, undefined);
});

Deno.test('clearCache removes all cache entries', () => {
  setCache('a', 1);
  setCache('b', 2);
  clearCache();
  assertEquals(getCache('a', 60_000), undefined);
  assertEquals(getCache('b', 60_000), undefined);
});
