#!/usr/bin/env -S deno run --allow-read --allow-run
/** Run repository tests and enforce production-package LCOV thresholds. */

import {
  addUncoveredFiles,
  countCoverableElements,
  type CoverableCounts,
  type CoverageMetric,
  enumerateCoverageFiles,
  isPackageSource,
  isToolsLibSource,
  lcovFilePaths,
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
  }
}

async function ensureWwwBuildOutput(): Promise<void> {
  try {
    await Deno.stat('www/dist');
    return;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }

  // AutoFlow normally schedules the build gate before coverage. Keep this
  // fallback so a directly invoked/tools-only coverage gate remains valid on
  // a fresh checkout and still runs every build-output regression test.
  const build = await new Deno.Command(Deno.execPath(), {
    args: ['task', 'build'],
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn().status;
  if (!build.success) throw new Error(`WWW prerequisite build failed with code ${build.code}`);
}

function formatMetric(name: string, metric: CoverageMetric, threshold: number): string {
  return `${name}: ${metric.covered}/${metric.total} ${
    metric.percentage.toFixed(2)
  }% (minimum ${threshold}%)`;
}

async function main(): Promise<void> {
  await ensureWwwBuildOutput();
  const lcov = await runCoverage();
  const profiledFiles = lcovFilePaths(lcov);

  // Threshold baseline: 2026-08-04 (v0.42.0-alpha.14 cycle), measured with the
  // full-denominator logic below on a local `deno task test:coverage` run:
  //   packages/*/src: lines 81.46%, branches 85.24%, functions 87.66%
  //   tools/lib:      lines 72.97%, branches 83.47%, functions 70.31%
  // Thresholds sit one point under the measured floor to absorb platform
  // variance between local runs and CI. Raise them only after re-measuring.
  const scopes: Array<{
    label: string;
    include: (path: string) => boolean;
    thresholds: { lines: number; branches: number; functions: number };
  }> = [
    {
      label: 'packages/*/src',
      include: isPackageSource,
      thresholds: {
        lines: getNumberArg('--threshold', 73),
        branches: getNumberArg('--branch-threshold', 82),
        functions: getNumberArg('--function-threshold', 77),
      },
    },
    {
      label: 'tools/lib',
      include: isToolsLibSource,
      thresholds: {
        lines: getNumberArg('--tools-threshold', 72),
        branches: getNumberArg('--tools-branch-threshold', 82),
        functions: getNumberArg('--tools-function-threshold', 69),
      },
    },
  ];

  const failures: string[] = [];
  for (const scope of scopes) {
    console.log(`\nCoverage scope: ${scope.label}`);
    // Full denominator: every in-scope source file counts, even when no test
    // loaded it (Deno only profiles imported modules). Unloaded files are
    // folded in as fully uncovered via an AST estimate of their coverable
    // elements.
    const treeFiles = await enumerateCoverageFiles(Deno.cwd(), scope.include);
    const uncovered: CoverableCounts[] = [];
    const missing: string[] = [];
    for (const path of treeFiles) {
      if (profiledFiles.has(path)) continue;
      missing.push(path);
      uncovered.push(countCoverableElements(await Deno.readTextFile(path), path));
    }
    console.log(
      `Denominator: ${treeFiles.length} source files ` +
        `(${missing.length} never loaded by any test, counted at 0%).`,
    );
    for (const path of missing) console.log(`  not exercised: ${path}`);
    const summary = addUncoveredFiles(parseLcov(lcov, scope.include), uncovered);
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
