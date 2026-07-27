/**
 * Request-time render latency baseline (0.42.0-alpha.4, TP-5).
 *
 * Boots the request-time fixture server and measures /live latency: the
 * first request after boot (cold) and a warm series. Writes the result to
 * docs/release/v0.42.0-alpha.4-performance.json as the 0.44 stream/abort/
 * timeout baseline.
 *
 * Usage: deno run -A tools/perf-request-time.ts
 */

import { join } from 'node:path';

const fixture = 'packages/adapter-vite/__fixtures__/request-time';
const port = 4387;

async function build(): Promise<void> {
  const out = await new Deno.Command('deno', {
    args: ['task', 'fixture:request-time:build'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (out.code !== 0) {
    console.error(new TextDecoder().decode(out.stderr));
    Deno.exit(out.code);
  }
}

await build();

const server = new Deno.Command('deno', {
  args: [
    'run',
    '-A',
    join(fixture, 'e2e/server.ts'),
    '--port',
    String(port),
    '--dir',
    join(fixture, 'dist'),
  ],
  stdout: 'piped',
  stderr: 'piped',
}).spawn();

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('fixture server did not start');
}

function stats(samples: number[]): { p50: number; p95: number; mean: number } {
  const sorted = [...samples].sort((a, b) => a - b);
  const pick = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return {
    p50: pick(0.5),
    p95: pick(0.95),
    mean: samples.reduce((a, b) => a + b, 0) / samples.length,
  };
}

try {
  await waitForServer();

  const coldStart = performance.now();
  const coldRes = await fetch(`http://127.0.0.1:${port}/live?x=perf`);
  await coldRes.text();
  const coldMs = performance.now() - coldStart;

  const warm: number[] = [];
  for (let i = 0; i < 50; i++) {
    const start = performance.now();
    const res = await fetch(`http://127.0.0.1:${port}/live?x=perf-${i}`);
    await res.text();
    warm.push(performance.now() - start);
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  const result = {
    version: '0.42.0-alpha.4',
    date: new Date().toISOString(),
    route: '/live (request-time, loader + DSD render)',
    cold: { ms: round(coldMs) },
    warm: {
      samples: warm.length,
      p50: round(stats(warm).p50),
      p95: round(stats(warm).p95),
      mean: round(stats(warm).mean),
    },
    note:
      'Buffered per-request DSD render via the generated dist/server entry on Deno.serve; the 0.44 stream/abort/timeout work compares against this.',
  };
  const path = 'docs/release/v0.42.0-alpha.4-performance.json';
  await Deno.writeTextFile(path, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  console.log(`written -> ${path}`);
} finally {
  server.kill('SIGTERM');
}
