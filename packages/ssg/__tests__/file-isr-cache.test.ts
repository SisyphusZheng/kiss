import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { createIsrCacheKey } from '@openelement/core/isr';
import { FileIsrCache } from '../src/file-isr-cache.ts';

Deno.test('FileIsrCache persists entries and reports hit, stale, and delete', async () => {
  const cacheDir = await Deno.makeTempDir({ prefix: 'openelement-file-isr-' });
  try {
    const cache = new FileIsrCache(cacheDir);
    const key = createIsrCacheKey('/docs/:slug', { slug: 'hello world' });
    const createdAt = 1_000;

    assertEquals(await cache.get(key, createdAt), { state: 'miss' });

    await cache.set(key, {
      html: '<h1>Docs</h1>',
      createdAt,
      revalidate: 60,
      headers: { 'content-type': 'text/html' },
    });

    const reloaded = new FileIsrCache(cacheDir);
    const hit = await reloaded.get(key, createdAt + 10_000);
    assertEquals(hit.state, 'hit');
    assertEquals(hit.entry?.html, '<h1>Docs</h1>');
    assertEquals(hit.entry?.headers?.['content-type'], 'text/html');

    const stale = await reloaded.get(key, createdAt + 60_000);
    assertEquals(stale.state, 'stale');

    await reloaded.delete(key);
    assertEquals(await reloaded.get(key, createdAt + 70_000), { state: 'miss' });
  } finally {
    await Deno.remove(cacheDir, { recursive: true });
  }
});
