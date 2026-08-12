/**
 * @openelement/adapter-vite — dev (hono) vs build (Nitro) semantic parity
 * contract test (0.42.0-alpha.5 TP-5.5, issue #557, VERSION_PLAN test matrix:
 * "Contract: dev (hono) vs build (Nitro) semantic parity").
 *
 * Boots BOTH servers against the same fixture and asserts the request-time
 * protocol is semantically identical:
 *   - dev:   vite dev server (@hono/vite-dev-server over the same virtual
 *            entry codegen as the build) serving the request-time fixture
 *   - build: the generated dist/server/index.js default export (the Nitro
 *            production entry) served by Deno.serve
 *
 * Status codes and the listed headers must match exactly; bodies may differ
 * in dev-only details (client script injection, stack traces) — the test
 * asserts shape, not bytes.
 *
 * The fixture also configures `middleware.use` (ADR-0123 item 2, #858): the
 * last step asserts the fetch middleware chain runs in onion order with
 * identical short-circuit semantics on both runtimes.
 *
 * Prerequisite: the fixture must be built first —
 *   deno task fixture:request-time:build
 */

import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { join, toFileUrl } from '@std/path';

const fixtureDir = join(import.meta.dirname!, '../__fixtures__/request-time');
const serverEntryPath = join(fixtureDir, 'dist/server/index.js');

type ServerHandle = { base: string; close: () => Promise<void> };

async function bootBuildServer(): Promise<ServerHandle> {
  const entry = await import(toFileUrl(serverEntryPath).href);
  const handle = entry.default as (event: { req: Request }) => Promise<Response>;
  const server = Deno.serve(
    { port: 0, hostname: '127.0.0.1' },
    (request) => handle({ req: request }),
  );
  const addr = server.addr as Deno.NetAddr;
  return {
    base: `http://127.0.0.1:${addr.port}`,
    close: async () => {
      await server.shutdown();
    },
  };
}

async function bootDevServer(): Promise<ServerHandle> {
  // The dev (hono) SSR entry imports the ADR-0044 customElements polyfill as
  // its first module (plugin.ts virtual:open-ssr-polyfill, fixed in alpha.5 —
  // dev SSR previously crashed with "customElements is not defined" on every
  // route, reproducible via `deno task dev` on www).
  const { createServer } = await import('vite');
  // The plugin scans routes relative to the process cwd, so boot from the
  // fixture directory (same shape as `deno task dev`, which cds into www).
  const previousCwd = Deno.cwd();
  Deno.chdir(fixtureDir);
  let server;
  try {
    server = await createServer({
      root: fixtureDir,
      logLevel: 'silent',
      server: { port: 0, strictPort: false },
    });
    await server.listen();
  } finally {
    Deno.chdir(previousCwd);
  }
  const address = server.httpServer?.address();
  assert(address && typeof address === 'object', 'vite dev server did not bind a port');
  return {
    base: `http://127.0.0.1:${address.port}`,
    close: () => server.close(),
  };
}

function formBody(fields: Record<string, string>): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
    redirect: 'manual',
  };
}

Deno.test({
  name: 'request-time parity: dev (hono) vs build (Nitro)',
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    // The fixture dist is not committed, and the coverage/test gates run
    // before any build gate — build it on demand (a no-op when it exists,
    // which is the common local case).
    let fixtureBuilt = true;
    try {
      await Deno.stat(serverEntryPath);
    } catch {
      fixtureBuilt = false;
    }
    if (!fixtureBuilt) {
      const build = await new Deno.Command(Deno.execPath(), {
        args: ['task', 'fixture:request-time:build'],
        cwd: join(fixtureDir, '../../../..'),
        stdout: 'inherit',
        stderr: 'inherit',
      }).output();
      if (!build.success) throw new Error('fixture build failed');
    }

    const build = await bootBuildServer();
    const dev = await bootDevServer();
    try {
      const both = { dev: dev.base, build: build.base };

      await t.step(
        'GET /live → 200, loader data present, Cache-Control: private,no-cache (#943)',
        async () => {
          for (const [name, base] of Object.entries(both)) {
            const response = await fetch(`${base}/live?x=parity`);
            assertEquals(response.status, 200, `${name}: GET /live status`);
            assertEquals(
              response.headers.get('cache-control'),
              'private, no-cache',
              `${name}: GET /live cache-control`,
            );
            const body = await response.text();
            assertStringIncludes(body, 'x=parity', `${name}: GET /live loader data`);
          }
        },
      );

      await t.step('GET /missing → styled 404 page with a 404 status (#923)', async () => {
        for (const [name, base] of Object.entries(both)) {
          const response = await fetch(`${base}/missing/route`);
          assertEquals(response.status, 404, `${name}: GET unmatched status`);
          assertEquals(
            response.headers.get('cache-control'),
            'no-store',
            `${name}: GET unmatched cache-control`,
          );
          const body = await response.text();
          assertStringIncludes(body, 'styled not found', `${name}: styled 404 page rendered`);
          assertStringIncludes(body, '404', `${name}: 404 title present`);
        }
      });

      await t.step('POST /form empty → 422 + Vary: x-openelement-action', async () => {
        for (const [name, base] of Object.entries(both)) {
          const response = await fetch(`${base}/form`, formBody({ message: '' }));
          assertEquals(response.status, 422, `${name}: POST /form empty status`);
          assertStringIncludes(
            response.headers.get('vary') ?? '',
            'x-openelement-action',
            `${name}: POST /form empty vary`,
          );
          const body = await response.text();
          assertStringIncludes(body, 'message is required', `${name}: POST /form failure echo`);
        }
      });

      await t.step('POST /form valid → 303 + Location', async () => {
        for (const [name, base] of Object.entries(both)) {
          const response = await fetch(`${base}/form`, formBody({ message: 'parity-check' }));
          assertEquals(response.status, 303, `${name}: POST /form valid status`);
          assertEquals(
            response.headers.get('location'),
            '/form?echoed=parity-check',
            `${name}: POST /form valid location`,
          );
          await response.body?.cancel();
        }
      });

      await t.step('POST /form?/nope → 404', async () => {
        for (const [name, base] of Object.entries(both)) {
          const response = await fetch(`${base}/form?/nope`, formBody({ message: 'x' }));
          assertEquals(response.status, 404, `${name}: POST /form?/nope status`);
          await response.body?.cancel();
        }
      });

      await t.step('POST /live (no action) → 404', async () => {
        for (const [name, base] of Object.entries(both)) {
          const response = await fetch(`${base}/live`, formBody({ x: '1' }));
          assertEquals(response.status, 404, `${name}: POST /live status`);
          await response.body?.cancel();
        }
      });

      await t.step('PUT /form → 405 + no-store', async () => {
        for (const [name, base] of Object.entries(both)) {
          const response = await fetch(`${base}/form`, { method: 'PUT', body: 'x=1' });
          assertEquals(response.status, 405, `${name}: PUT /form status`);
          assertEquals(
            response.headers.get('cache-control'),
            'no-store',
            `${name}: PUT /form cache-control`,
          );
          await response.body?.cancel();
        }
      });

      await t.step('fetch-header unknown action → RFC 9457 problem+json 404 (#863)', async () => {
        for (const [name, base] of Object.entries(both)) {
          const response = await fetch(`${base}/form?/nope`, {
            method: 'POST',
            headers: {
              'content-type': 'application/x-www-form-urlencoded',
              'x-openelement-action': 'true',
            },
            body: 'message=x',
          });
          assertEquals(response.status, 404, `${name}: JSON 404 status`);
          assertStringIncludes(
            response.headers.get('content-type') ?? '',
            'application/problem+json',
            `${name}: JSON 404 content-type`,
          );
          const body = await response.json() as {
            type?: string;
            title?: string;
            status?: number;
            detail?: string;
          };
          assertEquals(body.type, 'about:blank', `${name}: JSON 404 problem type`);
          assertEquals(body.title, 'Not Found', `${name}: JSON 404 problem title`);
          assertEquals(body.status, 404, `${name}: JSON 404 problem status`);
          assertEquals(
            body.detail,
            'No action named "nope" on this route.',
            `${name}: JSON 404 problem detail`,
          );
        }
      });

      await t.step('action returning a Response → 500 contract violation', async () => {
        for (const [name, base] of Object.entries(both)) {
          const response = await fetch(`${base}/ping?/raw`, formBody({}));
          assertEquals(response.status, 500, `${name}: /ping?/raw status`);
          const body = await response.text();
          assertEquals(body.includes('<h1>raw</h1>'), false, `${name}: raw HTML must not leak`);
        }
      });

      await t.step('malformed body (JSON content-type) → 400, both channels', async () => {
        for (const [name, base] of Object.entries(both)) {
          const response = await fetch(`${base}/form`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{"x":1}',
          });
          assertEquals(response.status, 400, `${name}: JSON body status`);
          const json = await fetch(`${base}/form`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-openelement-action': 'true' },
            body: '{"x":1}',
          });
          assertEquals(json.status, 400, `${name}: JSON body (fetch channel) status`);
          assertStringIncludes(
            json.headers.get('content-type') ?? '',
            'application/problem+json',
            `${name}: fetch channel errors speak problem+json`,
          );
        }
      });

      await t.step('303 PRG chain: POST → 303 → GET renders the target', async () => {
        for (const [name, base] of Object.entries(both)) {
          const post = await fetch(`${base}/form`, {
            ...formBody({ message: 'chain' }),
            redirect: 'manual',
          });
          assertEquals(post.status, 303, `${name}: PRG status`);
          const get = await fetch(`${base}${post.headers.get('location')}`);
          assertEquals(get.status, 200, `${name}: PRG target status`);
          assertStringIncludes(await get.text(), 'echo=chain', `${name}: PRG target body`);
        }
      });

      // ADR-0123 item 2 (#858): the fixture configures middleware.use with an
      // outer post-processor and an inner short-circuit. Both runtimes must
      // run the chain in onion order at the handler boundary.
      await t.step('fetch middleware: onion order + short-circuit parity (#858)', async () => {
        for (const [name, base] of Object.entries(both)) {
          const response = await fetch(`${base}/live?x=mw`);
          assertEquals(response.status, 200, `${name}: GET /live status`);
          // Onion order: the inner middleware post-processes the response
          // first, so 'inner' precedes 'outer'.
          assertEquals(
            response.headers.get('x-fixture-middleware'),
            'inner, outer',
            `${name}: middleware onion order`,
          );
          await response.body?.cancel();

          const short = await fetch(`${base}/live?mw-short=1`);
          assertEquals(short.status, 418, `${name}: short-circuit status`);
          assertEquals(await short.text(), 'fixture short-circuit', `${name}: short-circuit body`);
          // The outer middleware still wraps the short-circuit response.
          assertEquals(
            short.headers.get('x-fixture-middleware'),
            'outer',
            `${name}: short-circuit still passes the outer middleware`,
          );
        }
      });
    } finally {
      await dev.close();
      await build.close();
    }
  },
});
