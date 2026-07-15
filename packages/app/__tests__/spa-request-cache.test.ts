import { assertEquals, assertNotEquals } from 'jsr:@std/assert@1';
import { SpaRequestCache } from '../src/internal/spa-request-cache.ts';

Deno.test('SPA request cache reuses GET by URL and rebuilds on URL, method, or body changes', () => {
  const cache = new SpaRequestCache();
  const first = cache.get('https://example.test/a');

  assertEquals(cache.get('https://example.test/a'), first);
  assertNotEquals(cache.get('https://example.test/b'), first);
  assertNotEquals(cache.get('https://example.test/a', { method: 'POST' }), first);
  assertNotEquals(
    cache.get('https://example.test/a', { method: 'POST', body: 'changed' }),
    first,
  );
});
