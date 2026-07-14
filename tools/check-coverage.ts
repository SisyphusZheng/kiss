#!/usr/bin/env -S deno run --allow-read --allow-run
/** Run repository tests and enforce production-package LCOV thresholds. */

import { type CoverageMetric, parseLcov } from './coverage-summary.ts';

function getNumberArg(flag: string, fallback: number): number {
  const index = Deno.args.indexOf(flag);
  const value = Number(index >= 0 ? Deno.args[index + 1] : fallback);
  if (!Number.isFinite(value)) throw new Error(`${flag} must be a number`);
  return value;
}

async function runCoverage(): Promise<string> {
  const coverageDir = '.coverage-check';
  try {
    const test = await new Deno.Command(Deno.execPath(), {
      args: [
        'test',
        `--coverage=${coverageDir}`,
        '--allow-read',
        '--allow-write',
        '--allow-env',
        '--allow-net',
        '--allow-run',
        '--allow-ffi',
        '--allow-sys',
      ],
      stdout: 'inherit',
      stderr: 'inherit',
    }).spawn().status;
    if (!test.success) throw new Error(`tests failed with code ${test.code}`);

    const report = await new Deno.Command(Deno.execPath(), {
      args: ['coverage', coverageDir, '--lcov'],
      stdout: 'piped',
      stderr: 'inherit',
    }).output();
    if (!report.success) throw new Error(`coverage report failed with code ${report.code}`);
    return new TextDecoder().decode(report.stdout);
  } finally {
    await Deno.remove(coverageDir, { recursive: true }).catch(() => undefined);
  }
}

function formatMetric(name: string, metric: CoverageMetric, threshold: number): string {
  return `${name}: ${metric.covered}/${metric.total} ${
    metric.percentage.toFixed(2)
  }% (minimum ${threshold}%)`;
}

async function main(): Promise<void> {
  const thresholds = {
    lines: getNumberArg('--threshold', 80),
    branches: getNumberArg('--branch-threshold', 80),
    functions: getNumberArg('--function-threshold', 80),
  };
  console.log(
    'Running tests with enforced coverage scope: packages/*/src (publishable runtime source only).',
  );
  const summary = parseLcov(await runCoverage());
  const failures: string[] = [];
  for (const name of ['lines', 'branches', 'functions'] as const) {
    console.log(formatMetric(name, summary[name], thresholds[name]));
    if (summary[name].percentage < thresholds[name]) failures.push(name);
  }
  if (failures.length) {
    throw new Error(`coverage threshold failed: ${failures.join(', ')}`);
  }
  console.log('Coverage gate passed.');
}

if (import.meta.main) await main();
