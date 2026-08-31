#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-sys
/**
 * Fail-closed alpha.7 performance qualification gate for issue #1176.
 *
 * The benchmark owns observations; this module owns the acceptance policy.
 * Critical comparisons are against the frozen 0.43.3 proxy and use the
 * documented ten-percent ceiling. Timing is emitted for diagnosis, while
 * deterministic structure, transfer size and resource ownership gate exit.
 */

import {
  type BrowserName,
  type DomMetricSet,
  loadV044Definition,
  runV044Qualification,
  type V044PerformanceReport,
} from './benchmark-v044.ts';

export { loadV044Definition, runV044Qualification } from './benchmark-v044.ts';
export type { V044PerformanceReport } from './benchmark-v044.ts';

const expectedScenarioIds = ['fixed-only', 'conditional', 'keyed-list', 'nested-real-app'];
const defaultCriticalMetrics = [
  'initialAllocations',
  'claimAllocations',
  'updateAllocations',
  'updateWalkVisits',
  'transferBytes',
] as const;
const defaultBrowsers: BrowserName[] = ['chromium', 'firefox', 'webkit'];
const defaultBudgets = {
  maxCriticalRegressionPercent: 10,
  maxHeapGrowthBytes: 67108864,
  maxRetainedSubscriptions: 0,
  maxRetainedListeners: 0,
  maxClaimAllocations: 0,
  maxStaticRuntimeBytes: 0,
  maxBrowserPageErrors: 0,
};

interface PerformanceBudgets {
  maxCriticalRegressionPercent: number;
  maxHeapGrowthBytes: number;
  maxRetainedSubscriptions: number;
  maxRetainedListeners: number;
  maxClaimAllocations: number;
  maxStaticRuntimeBytes: number;
  maxBrowserPageErrors: number;
}

export interface PerformanceCheckOptions {
  requireBrowsers?: boolean;
}

function percentDelta(candidate: number, baseline: number): number {
  if (baseline === 0) return candidate === 0 ? 0 : Number.POSITIVE_INFINITY;
  return ((candidate - baseline) / baseline) * 100;
}

function formatPercent(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : 'infinite%';
}

function pushRegression(
  failures: string[],
  scenarioId: string,
  metric: keyof DomMetricSet,
  candidate: number,
  baseline: number,
  limit: number,
): void {
  const delta = percentDelta(candidate, baseline);
  if (delta > limit) {
    failures.push(
      `${scenarioId} ${metric} regression ${formatPercent(delta)} exceeds ${limit}% ` +
        `(candidate=${candidate}, baseline=${baseline})`,
    );
  }
}

function budgetsFromDefinition(definition: unknown): PerformanceBudgets {
  if (!definition || typeof definition !== 'object') return defaultBudgets;
  const candidate = (definition as { budgets?: Partial<PerformanceBudgets> }).budgets;
  return { ...defaultBudgets, ...candidate };
}

export function evaluateV044Performance(
  report: V044PerformanceReport,
  definition?: unknown,
  options: PerformanceCheckOptions = {},
): string[] {
  const failures: string[] = [];
  const budgets = budgetsFromDefinition(definition);
  const criticalMetrics = definition && typeof definition === 'object' &&
      Array.isArray((definition as { criticalMetrics?: unknown }).criticalMetrics)
    ? (definition as { criticalMetrics: Array<keyof DomMetricSet> }).criticalMetrics
    : [...defaultCriticalMetrics];

  if (report.schemaVersion !== 1) failures.push('report schemaVersion must be 1');
  if (report.source !== 'tools/benchmark-v044.ts') {
    failures.push('report source is not benchmark-v044');
  }
  if (report.staticOutput.runtimeBytes > budgets.maxStaticRuntimeBytes) {
    failures.push(
      `static output runtime bytes ${report.staticOutput.runtimeBytes} exceeds ` +
        `${budgets.maxStaticRuntimeBytes}`,
    );
  }
  if (report.staticOutput.scriptTags !== 0) {
    failures.push(`static output contains ${report.staticOutput.scriptTags} script tag(s)`);
  }
  if (
    report.candidate.interactiveProgramBytes >= report.baseline.interactiveProgramBytes
  ) {
    failures.push(
      `interactive Part Program payload did not improve: candidate=${report.candidate.interactiveProgramBytes}B ` +
        `baseline=${report.baseline.interactiveProgramBytes}B`,
    );
  }
  if (report.resources.maxHeapGrowthBytes > budgets.maxHeapGrowthBytes) {
    failures.push(
      `heap growth ${report.resources.maxHeapGrowthBytes}B exceeds ` +
        `${budgets.maxHeapGrowthBytes}B`,
    );
  }
  if (report.resources.maxRetainedSubscriptions > budgets.maxRetainedSubscriptions) {
    failures.push(
      `retained subscriptions ${report.resources.maxRetainedSubscriptions} exceeds ` +
        `${budgets.maxRetainedSubscriptions}`,
    );
  }
  if (report.resources.maxRetainedListeners > budgets.maxRetainedListeners) {
    failures.push(
      `retained listeners ${report.resources.maxRetainedListeners} exceeds ` +
        `${budgets.maxRetainedListeners}`,
    );
  }

  const scenarioIds = report.scenarios.map((scenario) => scenario.id);
  if (scenarioIds.join('|') !== expectedScenarioIds.join('|')) {
    failures.push(`scenario matrix must be ${expectedScenarioIds.join(', ')}`);
  }
  for (const scenario of report.scenarios) {
    for (const metric of criticalMetrics) {
      pushRegression(
        failures,
        scenario.id,
        metric,
        scenario.candidate[metric],
        scenario.baseline[metric],
        budgets.maxCriticalRegressionPercent,
      );
    }
    if (scenario.candidate.claimAllocations > budgets.maxClaimAllocations) {
      failures.push(
        `${scenario.id} claim allocations ${scenario.candidate.claimAllocations} exceeds ` +
          `${budgets.maxClaimAllocations}`,
      );
    }
    if (scenario.retainedSubscriptions > budgets.maxRetainedSubscriptions) {
      failures.push(
        `${scenario.id} retained subscriptions ${scenario.retainedSubscriptions} exceeds ` +
          `${budgets.maxRetainedSubscriptions}`,
      );
    }
    if (scenario.retainedListeners > budgets.maxRetainedListeners) {
      failures.push(
        `${scenario.id} retained listeners ${scenario.retainedListeners} exceeds ` +
          `${budgets.maxRetainedListeners}`,
      );
    }
  }

  const requireBrowsers = options.requireBrowsers ?? true;
  if (requireBrowsers) {
    const required = definition && typeof definition === 'object' &&
        Array.isArray(
          (definition as { environment?: { browserMatrix?: unknown } }).environment?.browserMatrix,
        )
      ? (definition as { environment: { browserMatrix: BrowserName[] } }).environment.browserMatrix
      : defaultBrowsers;
    for (const browserName of required) {
      const evidence = report.browser.find((entry) => entry.browser === browserName);
      if (!evidence) {
        failures.push(`browser evidence missing for ${browserName}`);
        continue;
      }
      if (!evidence.passed) failures.push(`browser evidence failed for ${browserName}`);
      if (!evidence.claimReady) {
        failures.push(`${browserName} browser claim readiness failed`);
      }
      if (!evidence.identityPreserved) {
        failures.push(`${browserName} browser identity preservation failed`);
      }
      if (!evidence.liveValuePreserved) {
        failures.push(`${browserName} browser live value preservation failed`);
      }
      if (evidence.pageErrors.length > budgets.maxBrowserPageErrors) {
        failures.push(
          `${browserName} browser page errors ${evidence.pageErrors.length} exceeds ` +
            `${budgets.maxBrowserPageErrors}`,
        );
      }
    }
  }
  return failures;
}

function summary(report: V044PerformanceReport): Record<string, unknown> {
  return {
    fixtureId: report.fixtureId,
    versions: report.versions,
    artifact: report.artifact,
    staticOutput: report.staticOutput,
    baseline: report.baseline,
    candidate: report.candidate,
    resources: report.resources,
    browser: report.browser.map((entry) => ({
      browser: entry.browser,
      passed: entry.passed,
      pageErrors: entry.pageErrors.length,
    })),
    scenarios: report.scenarios.map((scenario) => ({
      id: scenario.id,
      baseline: scenario.baseline,
      candidate: scenario.candidate,
      timing: scenario.timing,
      heapGrowthBytes: scenario.heapGrowthBytes,
    })),
  };
}

async function main(): Promise<void> {
  const definition = await loadV044Definition();
  const report = await runV044Qualification({ writeEvidence: true });
  const failures = evaluateV044Performance(report, definition, { requireBrowsers: true });
  console.log(JSON.stringify(summary(report), null, 2));
  if (failures.length > 0) {
    console.error('v0.44 alpha.7 performance qualification FAILED:');
    for (const failure of failures) console.error(`- ${failure}`);
    Deno.exit(1);
  }
  console.log('v0.44 alpha.7 performance qualification passed');
}

if (import.meta.main) await main();
