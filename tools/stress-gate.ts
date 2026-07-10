export interface StressSample {
  t: number;
  n: number;
  latencyMs: number;
  rssMb?: number;
  error?: string;
}

export interface StressReport {
  durationMinutes: number;
  totalRequests: number;
  errors: number;
  samples: StressSample[];
  summary: {
    startRssMb?: number;
    endRssMb?: number;
    minLatencyMs: number;
    maxLatencyMs: number;
    avgLatencyMs: number;
  };
}

export interface StressThresholds {
  maxErrors: number;
  maxRssGrowthMb: number;
  maxLatencyMs: number;
}

export function evaluateStressReport(
  report: StressReport,
  thresholds: StressThresholds,
): string[] {
  const failures: string[] = [];
  if (report.totalRequests === 0) failures.push('stress run produced no requests');
  if (report.samples.length === 0) failures.push('stress run produced no samples');
  if (report.errors > thresholds.maxErrors) {
    failures.push(`error count ${report.errors} exceeds ${thresholds.maxErrors}`);
  }

  const { startRssMb, endRssMb, maxLatencyMs } = report.summary;
  if (startRssMb !== undefined && endRssMb !== undefined) {
    const growth = endRssMb - startRssMb;
    if (growth > thresholds.maxRssGrowthMb) {
      failures.push(`RSS grew by ${growth}MB, exceeding ${thresholds.maxRssGrowthMb}MB`);
    }
  }
  if (maxLatencyMs > thresholds.maxLatencyMs) {
    failures.push(
      `maximum render latency ${maxLatencyMs}ms exceeds ${thresholds.maxLatencyMs}ms`,
    );
  }
  return failures;
}
