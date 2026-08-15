/**
 * Fullstack spike (epic #981, alpha.3): prove or disprove two claims on the
 * real Nitro `cloudflare_module` output of the request-time fixture:
 *  1. the generated entry enforces the ADR-0121 CSRF floor on POST, and the
 *     floor can read `OPEN_ELEMENT_DISABLE_CSRF` from the Workers env;
 *  2. an action can write a Set-Cookie header back through the entry.
 *
 * Reuses the in-process worker fetch technique from tools/nitro-proof.ts:
 * build the fixture, build Nitro workers output, then call
 * `workerFetch(request, env, context)` directly — no wrangler/miniflare.
 *
 * Usage: deno run --allow-all tools/fullstack-spike-workers.ts
 */
import { assertCompatibilityDate } from './lib/compatibility-date.ts';
import { exists, readJson } from './lib/fs.ts';
import { runWithOutput } from './lib/process.ts';
import { NITRO_COMPATIBILITY_DATE } from './project-constants.ts';

const root = new URL('../', import.meta.url);
const fixture = new URL('packages/adapter-vite/__fixtures__/request-time/', root);
const output = new URL('.output-workers/', fixture);

type WorkerContext = {
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
};

type WorkerModule = {
  default?: {
    fetch?: (
      request: Request,
      env: Record<string, string>,
      context: WorkerContext,
    ) => Promise<Response> | Response;
  };
};

let failures = 0;

function spike(name: string, pass: boolean, detail: string): void {
  console.log(`SPIKE ${name}: ${pass ? 'PASS' : 'FAIL'} ${detail}`);
  if (!pass) failures += 1;
}

async function runInFixture(
  command: string,
  args: string[],
  env: Record<string, string> = {},
): Promise<void> {
  const result = await runWithOutput(command, args, { cwd: fixture, env });
  if (!result.success) {
    console.error(result.stdout);
    console.error(result.stderr);
    Deno.exit(result.code);
  }
}

assertCompatibilityDate(NITRO_COMPATIBILITY_DATE);

const buildResult = await runWithOutput('deno', ['task', 'fixture:request-time:build'], {
  cwd: root,
});
if (!buildResult.success) {
  console.error(buildResult.stdout);
  console.error(buildResult.stderr);
  console.error('request-time fixture build failed; aborting spike');
  Deno.exit(1);
}

if (await exists(output)) {
  await Deno.remove(output, { recursive: true });
}

await runInFixture(
  'deno',
  ['run', '--node-modules-dir=auto', '-A', 'npm:nitro@3.0.0', 'build'],
  {
    OPEN_ELEMENT_NITRO_PRESET: 'cloudflare_module',
  },
);

const manifest = await readJson<{ serverEntry?: string }>(new URL('nitro.json', output));
const serverEntry = new URL(manifest.serverEntry || 'server/index.mjs', output);
if (!(await exists(serverEntry))) {
  console.error(`Nitro server entry missing: ${serverEntry.pathname}`);
  Deno.exit(1);
}

const imported = await import(`${serverEntry.href}?t=${Date.now()}`) as WorkerModule;
const workerFetch = imported.default?.fetch;
if (!workerFetch) {
  console.error('Nitro workers output does not export default.fetch');
  Deno.exit(1);
}

const ctx: WorkerContext = {
  waitUntil: () => undefined,
  passThroughOnException: () => undefined,
};

const formPost = (): Request =>
  new Request('http://127.0.0.1/form', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin: 'https://evil.example.com',
    },
    body: 'message=hi',
  });

// Spike 1: the ADR-0121 CSRF floor rejects a cross-origin POST.
const crossOrigin = await workerFetch(formPost(), {}, ctx);
spike(
  'csrf-floor',
  crossOrigin.status === 403,
  `POST /form with Origin https://evil.example.com -> ${crossOrigin.status}`,
);

// Spike 2: OPEN_ELEMENT_DISABLE_CSRF=1 in the Workers env turns the floor off
// (the same request then reaches the action and redirects with 303).
const csrfOff = await workerFetch(formPost(), { OPEN_ELEMENT_DISABLE_CSRF: '1' }, ctx);
const csrfOffPass = csrfOff.status !== 403 && (csrfOff.status === 422 || csrfOff.status === 303);
spike(
  'env-csrf-off',
  csrfOffPass,
  `same POST with OPEN_ELEMENT_DISABLE_CSRF=1 -> ${csrfOff.status}`,
);

// Spike 3: can an action write a Set-Cookie header back? The request omits
// Origin (non-browser client), so it passes the CSRF floor and reaches the
// action protocol.
const cookiePost = await workerFetch(
  new Request('http://127.0.0.1/set-cookie', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: '',
  }),
  {},
  ctx,
);
const cookie = cookiePost.headers.get('set-cookie');
spike(
  'set-cookie',
  cookie !== null,
  `POST /set-cookie -> ${cookiePost.status}${
    cookie ? `, set-cookie=${cookie}` : ', no set-cookie header'
  }`,
);

if (failures > 0) {
  console.error(`fullstack spike: ${failures} assertion(s) FAILED`);
  Deno.exit(1);
}

console.log('fullstack spike: all assertions passed');
