/**
 * @openelement/adapter-vite — standalone server entry contract (#959).
 *
 * The build emits dist/server/serve.mjs next to the request-time entry so a
 * built project serves itself without the CLI and without a hand-written
 * Nitro bootstrap:
 *
 *   node dist/server/serve.mjs
 *
 * This test boots the generated entry (Deno here; the module uses node:
 * builtins only, so Node.js >= 24 and Bun run the same file — the runtime
 * floor is WHATWG URLPattern, #969) against the
 * request-time fixture and asserts both channels: request-time routes and
 * prerendered static files.
 *
 * Prerequisite: the fixture must be built first —
 *   deno task fixture:request-time:build
 */

import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';

const fixtureDir = join(import.meta.dirname!, '../__fixtures__/request-time');
const serveEntryPath = join(fixtureDir, 'dist/server/serve.mjs');
const serverDir = join(fixtureDir, 'dist/server');

/** The fixture dist is gitignored — build it on demand (same pattern as
 *  request-time-parity.test.ts). */
async function ensureFixtureBuilt(): Promise<void> {
  try {
    await Deno.stat(serveEntryPath);
  } catch {
    const build = await new Deno.Command(Deno.execPath(), {
      args: ['task', 'fixture:request-time:build'],
      cwd: join(fixtureDir, '../../../..'),
      stdout: 'inherit',
      stderr: 'inherit',
    }).output();
    if (!build.success) throw new Error('fixture build failed');
  }
}

Deno.test({
  name: 'standalone serve.mjs: dist/server is marked as ESM for Node (#969)',
  fn: async () => {
    await ensureFixtureBuilt();
    // index.js/entry.js are ESM .js files; Node.js has no module-syntax
    // detection before v20.19/v22.12, so the directory needs an explicit
    // marker or Node dies with a misleading SyntaxError.
    const marker = JSON.parse(
      await Deno.readTextFile(join(serverDir, 'package.json')),
    );
    assertEquals(marker.type, 'module');
  },
});

Deno.test({
  name: 'standalone serve.mjs: dynamic + static channels over HTTP (#959)',
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    await ensureFixtureBuilt();

    const probe = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    const freePort = (probe.addr as Deno.NetAddr).port;
    probe.close();

    let server: Deno.ChildProcess | undefined;
    try {
      server = new Deno.Command(Deno.execPath(), {
        // The workspace import map resolves @openelement/adapter-vite/nitro-mount
        // for the generated index.js import; in an installed project that
        // specifier resolves from node_modules instead.
        args: [
          'run',
          '--config',
          join(fixtureDir, '../../../../deno.json'),
          '-A',
          serveEntryPath,
        ],
        cwd: fixtureDir,
        env: { OPEN_ELEMENT_PORT: String(freePort), OPEN_ELEMENT_HOST: '127.0.0.1' },
        stdout: 'null',
        stderr: 'null',
      }).spawn();

      const base = `http://127.0.0.1:${freePort}`;
      let response: Response | undefined;
      for (let attempt = 0; attempt < 50; attempt++) {
        try {
          response = await fetch(`${base}/live`);
          break;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      assert(response, 'serve.mjs did not come up');
      assertEquals(response.status, 200, 'request-time route must render');
      assertStringIncludes(await response.text(), 'request-time fixture — live');

      const home = await fetch(`${base}/`);
      assertEquals(home.status, 200, 'prerendered static page must be served');
      assertStringIncludes(await home.text(), 'request-time fixture home');
    } finally {
      try {
        server?.kill('SIGTERM');
      } catch {
        // The process may have already exited.
      }
      await server?.status.catch(() => undefined);
    }
  },
});

Deno.test({
  name: 'standalone serve.mjs: a malformed PORT fails fast with a friendly error',
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    await ensureFixtureBuilt();

    const run = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--config',
        join(fixtureDir, '../../../../deno.json'),
        '-A',
        serveEntryPath,
      ],
      cwd: fixtureDir,
      env: { OPEN_ELEMENT_PORT: 'not-a-port' },
      stdout: 'null',
      stderr: 'piped',
    }).output();
    const { code, stderr } = await run;
    assertEquals(code, 1, 'malformed PORT must exit non-zero');
    assertStringIncludes(
      new TextDecoder().decode(stderr),
      'Invalid port "not-a-port"',
    );
  },
});
