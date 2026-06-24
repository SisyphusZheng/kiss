#!/usr/bin/env -S deno run --allow-read --allow-run
/**
 * check-coverage — v0.35.6 (Cell 003)
 *
 * Runs test coverage and checks against a minimum threshold.
 *
 * Usage:
 *   deno run --allow-read --allow-run tools/check-coverage.ts
 *   deno run --allow-read --allow-run tools/check-coverage.ts --threshold 70
 *   deno run --allow-read --allow-run tools/check-coverage.ts --report
 */

function getArg(flag: string): string | null {
  const idx = Deno.args.indexOf(flag);
  if (idx !== -1 && idx + 1 < Deno.args.length) {
    return Deno.args[idx + 1];
  }
  return null;
}

interface CoverageSummary {
  totalLines: number;
  coveredLines: number;
  percentage: number;
}

async function runCoverage(): Promise<CoverageSummary> {
  const coverageDir = '.coverage-check';

  // Run tests with coverage
  const testCmd = new Deno.Command('deno', {
    args: [
      'test',
      `--coverage=${coverageDir}`,
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-net',
      '--allow-run',
    ],
    stdout: 'piped',
    stderr: 'piped',
  });

  const testResult = await testCmd.output();
  if (!testResult.success) {
    const stderr = new TextDecoder().decode(testResult.stderr);
    console.error(`Tests failed:\n${stderr.slice(0, 1000)}`);
    Deno.exit(1);
  }

  // Generate coverage summary
  const summaryCmd = new Deno.Command('deno', {
    args: ['coverage', coverageDir, '--lcov'],
    stdout: 'piped',
    stderr: 'piped',
  });

  const summaryResult = await summaryCmd.output();
  const lcov = new TextDecoder().decode(summaryResult.stdout);

  // Parse LCOV to compute overall coverage
  let totalLines = 0;
  let coveredLines = 0;

  for (const line of lcov.split('\n')) {
    if (line.startsWith('LF:')) {
      totalLines += parseInt(line.slice(3), 10);
    } else if (line.startsWith('LH:')) {
      coveredLines += parseInt(line.slice(3), 10);
    }
  }

  const percentage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;

  // Cleanup
  try {
    await Deno.remove(coverageDir, { recursive: true });
  } catch { /* ok */ }

  return { totalLines, coveredLines, percentage };
}

async function main(): Promise<void> {
  const threshold = parseInt(getArg('--threshold') ?? '50', 10);
  const reportOnly = Deno.args.includes('--report');

  console.log('🔍 Running test coverage...');
  console.log('');

  const summary = await runCoverage();

  console.log(`   Lines: ${summary.coveredLines}/${summary.totalLines}`);
  console.log(`   Coverage: ${summary.percentage.toFixed(1)}%`);
  console.log(`   Threshold: ${threshold}%`);
  console.log('');

  if (reportOnly) {
    console.log('📊 Coverage report complete.');
    return;
  }

  if (summary.percentage >= threshold) {
    console.log(`✅ Coverage ${summary.percentage.toFixed(1)}% >= ${threshold}%`);
  } else {
    console.error(
      `❌ Coverage ${summary.percentage.toFixed(1)}% < ${threshold}% threshold`,
    );
    Deno.exit(1);
  }
}

main();
