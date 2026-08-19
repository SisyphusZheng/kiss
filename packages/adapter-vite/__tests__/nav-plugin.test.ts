/**
 * nav plugin: dev watcher regenerates the data module (#1028).
 *
 * Previously the nav plugin only ran in buildStart, so editing a route file's
 * `meta` export during dev never rewrote _generated-nav.ts — the browser kept
 * replaying imports against the stale file until the dev server restarted.
 * The watcher must regenerate the data module, invalidate its module-graph
 * entry, and only then reload.
 */
import { assertEquals, assertStringIncludes } from '@std/assert';
import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import { createNavPlugin } from '../src/internal/content/nav/plugin.ts';
import type { FileSystemAdapter } from '../src/internal/content/fs-adapter.ts';

const ROUTE_ONE = `export const meta = { section: 'Guide', label: 'Home' } as const;
export default function Home() {}
`;

const ROUTE_TWO = `export const meta = { section: 'Guide', label: 'About' } as const;
export default function About() {}
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

Deno.test('nav plugin: route meta change rewrites _generated-nav.ts before reload (#1028)', async () => {
  const dir = await Deno.makeTempDir({ prefix: 'oe-nav-watch-' });
  try {
    const routesDir = join(dir, 'app', 'routes');
    await Deno.mkdir(routesDir, { recursive: true });
    await Deno.writeTextFile(join(routesDir, 'index.tsx'), ROUTE_ONE);

    const written = new Map<string, string>();
    const fs: FileSystemAdapter = {
      cwd: () => dir,
      mkdirSync: () => {},
      writeFileSync: (path, data) => written.set(path, String(data)),
    };

    const plugin = createNavPlugin({ routesDir }, undefined, fs) as Hooked;
    await plugin.buildStart!();

    const dataFile = join(dir, 'app', 'data', '_generated-nav.ts');
    assertStringIncludes(written.get(dataFile) ?? '', 'Home');

    const { server, watcher, sent, invalidated } = makeFakeServer(dir);
    plugin.configureServer!(server);

    // A new route with a meta export appears while dev is running.
    await Deno.writeTextFile(join(routesDir, 'about.tsx'), ROUTE_TWO);
    watcher.emit('add', join(routesDir, 'about.tsx'));

    await waitFor(() => sent.length === 1, 'full-reload after regeneration');
    assertEquals(sent[0], { type: 'full-reload' });
    assertStringIncludes(written.get(dataFile) ?? '', 'About');
    // The stale module-graph entry must be dropped so the next SSR/dev pass
    // re-reads the regenerated file.
    assertEquals(invalidated, [dataFile]);

    // A meta edit on an existing route must also regenerate (change event).
    await Deno.writeTextFile(
      join(routesDir, 'index.tsx'),
      ROUTE_ONE.replace("'Home'", "'Start'"),
    );
    watcher.emit('change', join(routesDir, 'index.tsx'));
    await waitFor(() => sent.length === 2, 'full-reload after meta edit');
    assertStringIncludes(written.get(dataFile) ?? '', 'Start');

    // Unrelated files under the routes dir must not trigger regeneration.
    const writesBefore = written.size;
    watcher.emit('change', join(routesDir, 'notes.txt'));
    await new Promise((r) => setTimeout(r, 50));
    assertEquals(sent.length, 2);
    assertEquals(written.size, writesBefore);
  } finally {
    await Deno.remove(dir, { recursive: true }).catch(() => {});
  }
});
