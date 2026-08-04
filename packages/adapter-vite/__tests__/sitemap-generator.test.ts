import { assertEquals, assertThrows } from '@std/assert';
import { join } from '@std/path';
import { generateSitemap, scanHtmlFiles } from '../src/internal/content/sitemap/generator.ts';

Deno.test('generateSitemap reports a stable missing-hostname configuration error', () => {
  assertThrows(
    () => generateSitemap('/tmp/not-used', { hostname: '' }),
    Error,
    'SitemapOptions.hostname is required',
  );
});

Deno.test('scanHtmlFiles uses shared deterministic HTML walker', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(root, 'guide'), { recursive: true });
    await Deno.writeTextFile(join(root, 'index.html'), 'home');
    await Deno.writeTextFile(join(root, 'guide', 'index.html'), 'guide');
    await Deno.writeTextFile(join(root, 'guide', 'other.html'), 'ignored');
    assertEquals(scanHtmlFiles(root), ['/', '/guide']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('generateSitemap creates temporary-build outputs with owner-only permissions', async () => {
  if (Deno.build.os === 'windows') return;
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(join(root, 'index.html'), 'home');
    const paths = generateSitemap(root, { hostname: 'https://example.com' });
    for (const path of paths) {
      assertEquals((await Deno.stat(path)).mode! & 0o777, 0o600);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
