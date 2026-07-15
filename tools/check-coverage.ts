#!/usr/bin/env -S deno run --allow-read --allow-run
/** Run repository tests and enforce production-package LCOV thresholds. */

import {
  type CoverageMetric,
  isPackageSource,
  isToolsLibSource,
  parseLcov,
} from './coverage-summary.ts';

function getNumberArg(flag: string, fallback: number): number {
  const index = Deno.args.indexOf(flag);
  const value = Number(index >= 0 ? Deno.args[index + 1] : fallback);
  if (!Number.isFinite(value)) throw new Error(`${flag} must be a number`);
  return value;
}

async function runCoverage(): Promise<string> {
  const coverageDir = '.coverage-check';
  const preservedFiles = ['examples/deno-desktop-mastodon/deno.lock'];
  const snapshots = new Map(
    await Promise.all(
      preservedFiles.map(async (path) => [path, await Deno.readFile(path)] as const),
    ),
  );
  try {
    const test = await new Deno.Command(Deno.execPath(), {
      args: [
        'test',
        '--no-lock',
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
    for (const [path, bytes] of snapshots) await Deno.writeFile(path, bytes);
  }
}

function formatMetric(name: string, metric: CoverageMetric, threshold: number): string {
  return `${name}: ${metric.covered}/${metric.total} ${
    metric.percentage.toFixed(2)
  }% (minimum ${threshold}%)`;
}

async function main(): Promise<void> {
  const lcov = await runCoverage();

  const scopes: Array<{
    label: string;
    include: (path: string) => boolean;
    thresholds: { lines: number; branches: number; functions: number };
  }> = [
    {
      label: 'packages/*/src',
      include: isPackageSource,
      thresholds: {
        lines: getNumberArg('--threshold', 69),
        branches: getNumberArg('--branch-threshold', 81),
        functions: getNumberArg('--function-threshold', 72),
      },
    },
    {
      label: 'tools/lib',
      include: isToolsLibSource,
      thresholds: {
        lines: getNumberArg('--tools-threshold', 50),
        branches: getNumberArg('--tools-branch-threshold', 50),
        functions: getNumberArg('--tools-function-threshold', 50),
      },
    },
  ];

  const failures: string[] = [];
  for (const scope of scopes) {
    console.log(`\nCoverage scope: ${scope.label}`);
    const summary = parseLcov(lcov, scope.include);
    for (const name of ['lines', 'branches', 'functions'] as const) {
      console.log(formatMetric(name, summary[name], scope.thresholds[name]));
      if (summary[name].percentage < scope.thresholds[name]) {
        failures.push(`${scope.label} ${name}`);
      }
    }
  }

  if (failures.length) {
    throw new Error(`coverage threshold failed: ${failures.join(', ')}`);
  }
  console.log('\nCoverage gate passed.');
}

if (import.meta.main) await main();
