import { createCloudflareHandlers } from '../examples/supabase-cloudflare-starter/lib/cloudflare-handlers.ts';
import { WORKSPACE_HTML_BUDGET_BYTES } from '../lib/workspace-pagination.ts';

interface HandlerModule {
  openElementHandler(request: Request, env: Record<string, string>): Promise<Response>;
}

const built = await import(
  '../examples/supabase-cloudflare-starter/dist/server/entry.js'
) as HandlerModule;
const worker = createCloudflareHandlers({
  fetch: (request: Request) => built.openElementHandler(request, {}),
});
const url = 'https://qualification.test/workspace-records';

async function sample(
  runtime: 'generated-handler' | 'cloudflare-composition',
  fetcher: (request: Request) => Promise<Response>,
) {
  const latencies: number[] = [];
  let shape:
    | { status: number; cache: string | null; contentType: string | null; body: string }
    | null = null;
  for (let index = 0; index < 30; index++) {
    const started = performance.now();
    const response = await fetcher(new Request(url));
    const body = await response.text();
    latencies.push(performance.now() - started);
    const current = {
      status: response.status,
      cache: response.headers.get('cache-control'),
      contentType: response.headers.get('content-type'),
      body,
    };
    if (shape && JSON.stringify(current) !== JSON.stringify(shape)) {
      throw new Error(`${runtime} response changed across identical requests`);
    }
    shape = current;
  }
  latencies.sort((a, b) => a - b);
  const bytes = new TextEncoder().encode(shape!.body).byteLength;
  if (bytes > WORKSPACE_HTML_BUDGET_BYTES) {
    throw new Error(`${runtime} emitted ${bytes} bytes (budget ${WORKSPACE_HTML_BUDGET_BYTES})`);
  }
  return {
    runtime,
    status: shape!.status,
    cacheControl: shape!.cache,
    contentType: shape!.contentType,
    htmlBytes: bytes,
    p50Ms: Number(latencies[14].toFixed(3)),
    p95Ms: Number(latencies[28].toFixed(3)),
  };
}

const node = await sample('generated-handler', (request) => built.openElementHandler(request, {}));
const workers = await sample(
  'cloudflare-composition',
  (request) => worker.fetch(request, {} as never, { waitUntil: () => {} }),
);
for (const key of ['status', 'cacheControl', 'contentType', 'htmlBytes'] as const) {
  if (node[key] !== workers[key]) throw new Error(`runtime mismatch for ${key}`);
}

console.log(JSON.stringify(
  {
    environment: {
      deno: Deno.version.deno,
      v8: Deno.version.v8,
      os: Deno.build.os,
      arch: Deno.build.arch,
      logicalCpus: navigator.hardwareConcurrency,
      rssBytes: Deno.memoryUsage().rss,
    },
    samplesPerRuntime: 30,
    budgetBytes: WORKSPACE_HTML_BUDGET_BYTES,
    results: [node, workers],
  },
  null,
  2,
));
