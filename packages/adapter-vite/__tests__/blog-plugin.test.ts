/**
 * blog plugin: dev watcher regenerates the data module (#1028).
 *
 * Previously configureServer's watcher only sent a full-reload, so the browser
 * replayed imports against the stale _generated-blog-data.ts that buildStart()
 * had written. The watcher must regenerate the data module, invalidate its
 * module-graph entry, and only then reload.
 */
import { assertEquals, assertStringIncludes } from '@std/assert';
import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import { createBlogPlugin } from '../src/internal/content/blog/plugin.ts';
import type { FileSystemAdapter } from '../src/internal/content/fs-adapter.ts';

const POST_ONE = `---
title: First Post
date: 2026-01-01
---
First body.
`;

const POST_TWO = `---
title: Second Post
date: 2026-01-02
---
Second body.
`;

type Hooked = {
  buildStart?: () => Promise<void>;
  configureServer?: (server: unknown) => void;
};

function makeFakeServer(root: string) {
  const watcher = new EventEmitter() as EventEmitter & { add(path: string): void };
  watcher.add = () => {};
  const sent: unknown[] = [];
  const invalidated: string[] = [];
  const server = {
    config: { root },
    watcher,
    hot: { send: (payload: unknown) => sent.push(payload) },
    moduleGraph: {
      getModuleById: (id: string) => ({ id }),
      invalidateModule: (mod: { id: string }) => invalidated.push(mod.id),
    },
    httpServer: null,
  };
  return { server, watcher, sent, invalidated };
}

/** Wait until predicate() holds; fails the test after ~2s. */
async function waitFor(predicate: () => boolean, what: string): Promise<void> {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`Timed out waiting for: ${what}`);
    await new Promise((r) => setTimeout(r, 10));
  }
}

Deno.test('blog plugin: content change rewrites _generated-blog-data.ts before reload (#1028)', async () => {
  const dir = await Deno.makeTempDir({ prefix: 'oe-blog-watch-' });
  try {
    const postsDir = join(dir, 'posts');
    await Deno.mkdir(postsDir, { recursive: true });
    await Deno.writeTextFile(join(postsDir, 'post-one.md'), POST_ONE);

    const written = new Map<string, string>();
    const fs: FileSystemAdapter = {
      cwd: () => dir,
      mkdirSync: () => {},
      writeFileSync: (path, data) => written.set(path, String(data)),
    };

    const plugin = createBlogPlugin({ contentDir: postsDir }, undefined, fs) as Hooked;
    await plugin.buildStart!();

    const dataFile = join(dir, 'app', 'data', '_generated-blog-data.ts');
    assertStringIncludes(written.get(dataFile) ?? '', 'post-one');

    const { server, watcher, sent, invalidated } = makeFakeServer(dir);
    plugin.configureServer!(server);

    // A new post appears while dev is running.
    await Deno.writeTextFile(join(postsDir, 'post-two.md'), POST_TWO);
    watcher.emit('add', join(postsDir, 'post-two.md'));

    await waitFor(() => sent.length === 1, 'full-reload after regeneration');
    assertEquals(sent[0], { type: 'full-reload' });
    assertStringIncludes(written.get(dataFile) ?? '', 'post-two');
    // The stale module-graph entry must be dropped so the next SSR/dev pass
    // re-reads the regenerated file.
    assertEquals(invalidated, [dataFile]);

    // Unrelated files under the content dir must not trigger regeneration.
    const writesBefore = written.size;
    watcher.emit('change', join(postsDir, 'notes.txt'));
    await new Promise((r) => setTimeout(r, 50));
    assertEquals(sent.length, 1);
    assertEquals(written.size, writesBefore);
  } finally {
    await Deno.remove(dir, { recursive: true }).catch(() => {});
  }
});
