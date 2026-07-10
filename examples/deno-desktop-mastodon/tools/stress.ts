/**
 * Mastodon Desktop — long-running stress runner.
 *
 * Exercises the local backend endpoints on a loop to surface memory growth
 * and latency drift over time. Outputs a JSON report suitable for archiving
 * as alpha.7 release evidence.
 *
 * Usage:
 *   DURATION_MINUTES=30 deno run -A tools/stress.ts
 *   DURATION_MINUTES=5 deno run -A tools/stress.ts   # short smoke
 */

import {
  fetchAccount,
  fetchAccountStatuses,
  fetchPublicTimeline,
  fetchStatus,
  fetchStatusContext,
} from '../app/api.ts';

const DURATION_MS = Number(Deno.env.get('DURATION_MINUTES') ?? '30') * 60 * 1000;
const INTERVAL_MS = Number(Deno.env.get('INTERVAL_MS') ?? '5000');
const INSTANCE = 'mastodon.social';

interface Sample {
  t: number; // elapsed ms
  n: number; // request number
  latencyMs: number;
  rssMb?: number;
  error?: string;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

async function getRssMb(pid: number): Promise<number | undefined> {
  try {
    const cmd = new Deno.Command('ps', {
      args: ['-o', 'rss=', '-p', String(pid)],
      stdout: 'piped',
      stderr: 'piped',
    });
    const { stdout } = await cmd.output();
    const kb = Number(new TextDecoder().decode(stdout).trim());
    return Number.isNaN(kb) ? undefined : Math.round(kb / 1024);
  } catch {
    return undefined;
  }
}

async function runScenario(): Promise<{ latencyMs: number; error?: string }> {
  const start = performance.now();
  try {
    const timeline = await fetchPublicTimeline({
      instance: INSTANCE,
      timeline: 'public',
      limit: 5,
    });
    if (!timeline.ok) throw new Error(timeline.error.message);
    const status = timeline.data[0];
    if (!status) throw new Error('empty timeline');

    const acct = status.account.acct;
    const [profile, statusDetail, context] = await Promise.all([
      fetchAccount({ instance: INSTANCE, acct }),
      fetchStatus({ instance: INSTANCE, id: status.id }),
      fetchStatusContext({ instance: INSTANCE, id: status.id }),
    ]);

    if (!profile.ok) throw new Error(profile.error.message);
    if (!statusDetail.ok) throw new Error(statusDetail.error.message);
    if (!context.ok) throw new Error(context.error.message);

    const statuses = await fetchAccountStatuses({ instance: INSTANCE, acct });
    if (!statuses.ok) throw new Error(statuses.error.message);

    return { latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    return {
      latencyMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  console.log(`[stress] duration: ${formatDuration(DURATION_MS)}`);
  console.log(`[stress] interval: ${INTERVAL_MS}ms`);

  const serverCmd = new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', 'main.ts'],
    cwd: new URL('../', import.meta.url).pathname,
    env: { PORT: '0' },
    stdout: 'piped',
    stderr: 'piped',
  });
  const server = serverCmd.spawn();

  // Drain stdout so the pipe does not back-pressure the server, and surface
  // any early stderr if the process exits before the stress loop.
  const serverStderr: string[] = [];
  const stderrReader = server.stderr.getReader();
  const stdoutReader = server.stdout.getReader();
  void (async () => {
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await stderrReader.read();
      if (done) break;
      serverStderr.push(decoder.decode(value));
    }
  })();
  void (async () => {
    while (true) {
      const { done } = await stdoutReader.read();
      if (done) break;
    }
  })();

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const startTime = performance.now();
  const samples: Sample[] = [];
  let requestCount = 0;
  let errorCount = 0;

  const intervalId = setInterval(async () => {
    const elapsed = performance.now() - startTime;
    if (elapsed >= DURATION_MS) {
      clearInterval(intervalId);
      return;
    }

    requestCount++;
    const { latencyMs, error } = await runScenario();
    if (error) errorCount++;

    const rssMb = await getRssMb(server.pid);
    samples.push({ t: Math.round(elapsed), n: requestCount, latencyMs, rssMb, error });

    const progress = `${formatDuration(elapsed)} / ${formatDuration(DURATION_MS)}`;
    const rss = rssMb !== undefined ? `${rssMb}MB` : 'n/a';
    if (error) {
      console.log(
        `[stress] ${progress} | req=${requestCount} | rss=${rss} | latency=${latencyMs}ms | ERROR: ${error}`,
      );
    } else {
      console.log(
        `[stress] ${progress} | req=${requestCount} | rss=${rss} | latency=${latencyMs}ms`,
      );
    }
  }, INTERVAL_MS);

  // Wait for duration
  await new Promise((resolve) => setTimeout(resolve, DURATION_MS + INTERVAL_MS));
  clearInterval(intervalId);

  try {
    server.kill('SIGTERM');
  } catch (err) {
    // Process may have already exited.
    if (!(err instanceof TypeError && String(err).includes('already terminated'))) {
      console.error('[stress] failed to signal server:', err);
    }
  }
  const status = await server.status;
  if (!status.success && status.code !== 143 && status.code !== 0) {
    const stderr = serverStderr.join('').trim();
    if (stderr) console.error('[stress] server stderr:', stderr);
  }

  const elapsed = performance.now() - startTime;
  const report = {
    durationMinutes: Math.round(elapsed / 60 / 1000),
    totalRequests: requestCount,
    errors: errorCount,
    samples,
    summary: {
      startRssMb: samples[0]?.rssMb,
      endRssMb: samples[samples.length - 1]?.rssMb,
      minLatencyMs: Math.min(...samples.map((s) => s.latencyMs)),
      maxLatencyMs: Math.max(...samples.map((s) => s.latencyMs)),
      avgLatencyMs: Math.round(samples.reduce((a, s) => a + s.latencyMs, 0) / samples.length),
    },
  };

  const reportPath = new URL('../stress-report.json', import.meta.url);
  await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));
  console.log('\n[stress] report written to', reportPath.pathname);
  console.log('[stress] summary:', JSON.stringify(report.summary, null, 2));
}

if (import.meta.main) {
  await main();
}
