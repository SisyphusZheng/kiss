import { assert, assertEquals, assertThrows } from '@std/assert';
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

Deno.test('generateSitemap creates deploy outputs with web-readable permissions', async () => {
  if (Deno.build.os === 'windows') return;
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(join(root, 'index.html'), 'home');
    const paths = generateSitemap(root, { hostname: 'https://example.com' });
    for (const path of paths) {
      assertEquals((await Deno.stat(path)).mode! & 0o777, 0o644);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('generateSitemap exclude matches path boundaries, not bare prefixes (#1039)', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(root, 'blog', 'post'), { recursive: true });
    await Deno.mkdir(join(root, 'blogroll'), { recursive: true });
    await Deno.writeTextFile(join(root, 'blog', 'index.html'), 'blog');
    await Deno.writeTextFile(join(root, 'blog', 'post', 'index.html'), 'post');
    await Deno.writeTextFile(join(root, 'blogroll', 'index.html'), 'blogroll');
    generateSitemap(root, { hostname: 'https://example.com', exclude: ['/blog'] });
    const xml = await Deno.readTextFile(join(root, 'sitemap.xml'));
    // /blog and everything below it are excluded…
    assert(!xml.includes('<loc>https://example.com/blog</loc>'));
    assert(!xml.includes('<loc>https://example.com/blog/post</loc>'));
    // …but a sibling that merely shares the prefix stays.
    assert(xml.includes('<loc>https://example.com/blogroll</loc>'));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
