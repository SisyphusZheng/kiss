import { evaluateStressReport, type StressReport, type StressThresholds } from './stress-gate.ts';

const root = new URL('../', import.meta.url);
const example = new URL('examples/deno-desktop-mastodon/', root);
const defaultReport = new URL('stress-report.json', example);

function envNumber(name: string, fallback: number): number {
  const value = Number(Deno.env.get(name) ?? fallback);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return value;
}

async function runHarness(): Promise<void> {
  const durationMinutes = envNumber('STRESS_DURATION_MINUTES', 30);
  const intervalMs = envNumber('STRESS_INTERVAL_MS', 5_000);
  const command = new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', 'tools/stress.ts'],
    cwd: example,
    env: {
      DURATION_MINUTES: String(durationMinutes),
      INTERVAL_MS: String(intervalMs),
    },
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await command.spawn().status;
  if (!status.success) throw new Error(`stress harness exited with code ${status.code}`);
}

async function main(): Promise<void> {
  const reportOnlyIndex = Deno.args.indexOf('--report-only');
  const reportUrl = reportOnlyIndex >= 0
    ? new URL(Deno.args[reportOnlyIndex + 1], root)
    : defaultReport;
  if (reportOnlyIndex < 0) await runHarness();

  const report = JSON.parse(await Deno.readTextFile(reportUrl)) as StressReport;
  const thresholds: StressThresholds = {
    maxErrors: envNumber('STRESS_MAX_ERRORS', 0),
    maxRssGrowthMb: envNumber('STRESS_MAX_RSS_GROWTH_MB', 64),
    maxLatencyMs: envNumber('STRESS_MAX_LATENCY_MS', 5_000),
  };
  const failures = evaluateStressReport(report, thresholds);
  console.log('[stress-gate] report:', reportUrl.pathname);
  console.log('[stress-gate] summary:', JSON.stringify(report.summary));
  if (failures.length > 0) throw new Error(`stress gate failed:\n- ${failures.join('\n- ')}`);
  console.log('[stress-gate] passed');
}

if (import.meta.main) await main();
