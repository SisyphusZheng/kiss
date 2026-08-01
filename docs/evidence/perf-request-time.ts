/**
 * ARCHIVED (#742): one-shot baseline script, kept as historical evidence of
 * how the 0.42.0-alpha.5 request-time latency numbers were measured. It is not
 * an active tool — the baseline it produced lives at
 * docs/release/v0.42.0-alpha.5-performance.json.
 *
 * Request-time render latency baseline (0.42.0-alpha.5, TP-5.5).
 *
 * Boots the request-time fixture server and measures /live latency: the
 * first request after boot (cold, best of 3 fresh boots with all samples
 * recorded) and a warm series. Writes the result to
 * docs/release/v0.42.0-alpha.5-performance.json as the 0.44 stream/abort/
 * timeout baseline, including the environment it was measured on.
 *
 * Usage: deno run -A docs/evidence/perf-request-time.ts [--out <path>]
 * (run from the repository root)
 */

import { join } from 'node:path';

const fixture = 'packages/adapter-vite/__fixtures__/request-time';
const port = 4387;
const COLD_SAMPLES = 3;
const WARM_SAMPLES = 50;

const outFlagIndex = Deno.args.indexOf('--out');
const outPath = outFlagIndex >= 0 && Deno.args[outFlagIndex + 1]
  ? Deno.args[outFlagIndex + 1]
  : 'docs/release/v0.42.0-alpha.5-performance.json';

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

function startServer(): Deno.ChildProcess {
  return new Deno.Command('deno', {
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
}

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

async function fetchLive(query: string): Promise<number> {
  const start = performance.now();
  const res = await fetch(`http://127.0.0.1:${port}/live?x=${query}`);
  await res.text();
  return performance.now() - start;
}

async function measureCold(): Promise<number> {
  const server = startServer();
  try {
    await waitForServer();
    return await fetchLive('perf-cold');
  } finally {
    server.kill('SIGTERM');
    await server.status.catch(() => {});
  }
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

async function cpuModel(): Promise<string | undefined> {
  try {
    const cmd = Deno.build.os === 'darwin'
      ? new Deno.Command('sysctl', { args: ['-n', 'machdep.cpu.brand_string'] })
      : new Deno.Command('sh', {
        args: ['-c', "grep -m1 'model name' /proc/cpuinfo | cut -d: -f2-"],
      });
    const out = await cmd.output();
    if (out.code !== 0) return undefined;
    const text = new TextDecoder().decode(out.stdout).trim();
    return text || undefined;
  } catch {
    return undefined;
  }
}

await build();

const round = (n: number) => Math.round(n * 100) / 100;

// Cold: first request after a fresh server boot, 3 boots, all samples kept.
const coldSamples: number[] = [];
for (let i = 0; i < COLD_SAMPLES; i++) {
  coldSamples.push(await measureCold());
}

// Warm series on one more fresh server.
const server = startServer();
try {
  await waitForServer();

  const warm: number[] = [];
  for (let i = 0; i < WARM_SAMPLES; i++) {
    warm.push(await fetchLive(`perf-${i}`));
  }

  const result = {
    version: '0.42.0-alpha.5',
    date: new Date().toISOString(),
    route: '/live (request-time, loader + DSD render)',
    environment: {
      os: Deno.build.os,
      arch: Deno.build.arch,
      cpu: await cpuModel(),
      deno: Deno.version.deno,
      v8: Deno.version.v8,
    },
    samples: { cold: COLD_SAMPLES, warm: WARM_SAMPLES },
    cold: { ms: round(Math.min(...coldSamples)), samplesMs: coldSamples.map(round) },
    warm: {
      samples: warm.length,
      p50: round(stats(warm).p50),
      p95: round(stats(warm).p95),
      mean: round(stats(warm).mean),
    },
    note:
      'Buffered per-request DSD render via the generated dist/server entry on Deno.serve; the 0.44 stream/abort/timeout work compares against this. Cold is the best of 3 fresh-boot first requests; all samples are recorded.',
  };
  await Deno.writeTextFile(outPath, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  console.log(`written -> ${outPath}`);
} finally {
  server.kill('SIGTERM');
}
