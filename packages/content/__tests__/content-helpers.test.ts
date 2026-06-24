/**
 * @openelement/content - Direct unit tests for small helper modules.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { writeJson } from '../src/write-json.ts';
import { createSitemapPlugin } from '../src/sitemap/plugin.ts';
import { type FileSystemAdapter, nodeFsAdapter } from '../src/fs-adapter.ts';

Deno.test('writeJson serializes value with trailing newline', () => {
  assertEquals(writeJson({ a: 1 }), '{\n  "a": 1\n}\n');
  assertEquals(writeJson([1, 2]), '[\n  1,\n  2\n]\n');
});

Deno.test('createSitemapPlugin records options on build context', () => {
  const ctx = {
    plugins: {} as Record<string, unknown>,
  } as import('@openelement/protocol/framework').OpenElementBuildContextLike;
  const plugin = createSitemapPlugin({ hostname: 'https://example.com' }, ctx);
  assertEquals(plugin.name, 'open:content:sitemap');

  const start = plugin.buildStart as (() => void) | undefined;
  start?.();
  assertEquals(ctx.plugins.sitemapOptions, { hostname: 'https://example.com' });
});

Deno.test('createSitemapPlugin works without context', () => {
  const plugin = createSitemapPlugin({ hostname: 'https://example.com' });
  // Should not throw when no context is provided.
  const start = plugin.buildStart as (() => void) | undefined;
  start?.();
});

Deno.test('nodeFsAdapter exposes expected file-system surface', () => {
  assertEquals(typeof nodeFsAdapter.cwd, 'function');
  assertEquals(typeof nodeFsAdapter.mkdirSync, 'function');
  assertEquals(typeof nodeFsAdapter.writeFileSync, 'function');
});

Deno.test('FileSystemAdapter can be implemented in memory', () => {
  const writes: Array<{ path: string; data: string }> = [];
  const adapter: FileSystemAdapter = {
    cwd: () => '/mock',
    mkdirSync: (_path, _options) => {},
    writeFileSync: (path, data) => {
      writes.push({ path, data: data as string });
    },
  };

  adapter.writeFileSync('out.json', '{"ok":true}');
  assertEquals(writes, [{ path: 'out.json', data: '{"ok":true}' }]);
});
