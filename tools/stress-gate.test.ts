import { assertEquals } from '@std/assert';
import { evaluateStressReport, type StressReport } from './stress-gate.ts';

const healthyReport: StressReport = {
  durationMinutes: 30,
  totalRequests: 360,
  errors: 0,
  samples: [{ t: 0, n: 1, latencyMs: 10, rssMb: 40 }],
  summary: {
    startRssMb: 40,
    endRssMb: 48,
    minLatencyMs: 8,
    maxLatencyMs: 30,
    avgLatencyMs: 12,
  },
};

Deno.test('stress gate accepts a responsive run with bounded memory growth', () => {
  assertEquals(
    evaluateStressReport(healthyReport, {
      maxErrors: 0,
      maxRssGrowthMb: 64,
      maxLatencyMs: 5_000,
    }),
    [],
  );
});

Deno.test('stress gate reports errors, memory growth, and freeze-like latency', () => {
  const failures = evaluateStressReport({
    ...healthyReport,
    errors: 2,
    summary: { ...healthyReport.summary, endRssMb: 120, maxLatencyMs: 7_000 },
  }, {
    maxErrors: 0,
    maxRssGrowthMb: 64,
    maxLatencyMs: 5_000,
  });

  assertEquals(failures, [
    'error count 2 exceeds 0',
    'RSS grew by 80MB, exceeding 64MB',
    'maximum render latency 7000ms exceeds 5000ms',
  ]);
});

Deno.test('stress gate rejects reports without meaningful samples', () => {
  assertEquals(
    evaluateStressReport({
      ...healthyReport,
      totalRequests: 0,
      samples: [],
    }, {
      maxErrors: 0,
      maxRssGrowthMb: 64,
      maxLatencyMs: 5_000,
    }),
    ['stress run produced no requests', 'stress run produced no samples'],
  );
});
