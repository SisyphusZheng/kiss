/** Ensure alpha.7 critical runtime risks keep named behavioral evidence.
 *
 * alpha.12: actually execute the critical-path suites instead of only
 * text-matching their source. A suite that is commented out or missing now
 * fails (or skips only when its required runtime infra is absent).
 *
 * alpha.17: a failing suite is a failure, full stop. The old output-regex
 * downgrade (`/chromium|playwright|browser|network|nitro/i`) never let the
 * e2e branch fail, because every Playwright failure output contains
 * `[chromium] ›`. Infra absence is now established by dedicated probes with
 * explicit exit codes / fs error types, never by matching suite output.
 */

export interface Suite {
  file: string;
  kind: 'deno-test' | 'nitro-proof' | 'e2e';
  expect: string[];
  /** Returns a human-readable reason when required runtime infra is absent. */
  probeInfra?: () => Promise<string | undefined>;
}

export interface SuiteRun {
  code: number;
  out: string;
  /** The suite process could not be spawned at all (executable missing). */
  spawnError?: string;
}

export type SuiteOutcome =
  | { verdict: 'pass' }
  | { verdict: 'skip'; reason: string }
  | { verdict: 'fail'; reason: string };

/** Probe result classification: infra absence is a spawn error or a failed probe. */
export function evaluateSuiteOutcome(
  suite: Suite,
  run: SuiteRun,
  infraMissing: string | undefined,
): SuiteOutcome {
  if (run.spawnError !== undefined) {
    return { verdict: 'skip', reason: `suite runner unavailable: ${run.spawnError}` };
  }
  if (run.code !== 0) {
    if (infraMissing !== undefined) {
      return { verdict: 'skip', reason: infraMissing };
    }
    return { verdict: 'fail', reason: `suite failed (exit ${run.code})` };
  }
  const missing = missingEvidence(run.out, suite.expect);
  if (missing.length > 0) {
    return {
      verdict: 'fail',
      reason: `expected evidence not produced: ${missing.map((f) => `'${f}'`).join(', ')}`,
    };
  }
  return { verdict: 'pass' };
}

export function missingEvidence(out: string, expect: string[]): string[] {
  return expect.filter((fragment) => !out.includes(fragment));
}

/**
 * Playwright browser presence is probed by resolving the executable path and
 * stat-ing it. The probe's exit code is the classification signal: 0 means the
 * browser is installed, anything else means the e2e runtime infra is absent.
 */
export async function probePlaywrightBrowser(browser: string): Promise<string | undefined> {
  const probe = await new Deno.Command(Deno.execPath(), {
    args: [
      'eval',
      `import { ${browser} } from 'npm:playwright@1.59.1';` +
      `try { Deno.statSync(${browser}.executablePath()); } catch { Deno.exit(3); }`,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (probe.code === 0) return undefined;
  const detail = new TextDecoder().decode(probe.stderr).trim().split('\n')[0] ?? '';
  return `playwright ${browser} executable not installed (probe exit ${probe.code})${
    detail ? `: ${detail}` : ''
  }`;
}

/** nitro-proof builds a fixture with the locally installed nitro package. */
export async function probeNitroPackage(): Promise<string | undefined> {
  try {
    const stat = await Deno.stat('node_modules/nitro');
    if (stat.isDirectory) return undefined;
    return 'node_modules/nitro is not a directory';
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return 'nitro package not installed (node_modules/nitro missing)';
    }
    throw error;
  }
}

const suites: Suite[] = [
  {
    file: 'packages/adapter-vite/__tests__/build-plan.test.ts',
    kind: 'deno-test',
    expect: ['typed failure evidence', 'collects emitted artifacts'],
  },
  {
    file: 'packages/app/__tests__/client-router.test.ts',
    kind: 'deno-test',
    expect: [
      'dispose removes event listeners',
      'double dispose is safe',
      'redirect limit rejects redirect loops',
      'decodes path parameters',
    ],
  },
  {
    file: 'www/e2e/dsd-layers.spec.ts',
    kind: 'e2e',
    expect: ['custom elements have shadow roots', 'without an inline fallback'],
    probeInfra: () => probePlaywrightBrowser('chromium'),
  },
  {
    file: 'tools/nitro-proof.ts',
    kind: 'nitro-proof',
    expect: ['node-server', 'cloudflare-module'],
    probeInfra: probeNitroPackage,
  },
];

async function run(cmd: string[]): Promise<SuiteRun> {
  let proc: Deno.Command;
  try {
    proc = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdout: 'piped',
      stderr: 'piped',
    });
  } catch (error) {
    return {
      code: -1,
      out: '',
      spawnError: error instanceof Error ? error.message : String(error),
    };
  }
  try {
    const result = await proc.output();
    return {
      code: result.code,
      out: new TextDecoder().decode(result.stdout) +
        new TextDecoder().decode(result.stderr),
    };
  } catch (error) {
    return {
      code: -1,
      out: '',
      spawnError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main(): Promise<void> {
  const failures: string[] = [];
  const skips: string[] = [];

  for (const suite of suites) {
    const infraMissing = suite.probeInfra ? await suite.probeInfra() : undefined;

    let suiteRun: SuiteRun;
    if (suite.kind === 'nitro-proof') {
      let code = 0;
      let out = '';
      let spawnError: string | undefined;
      for (const preset of ['node', 'workers']) {
        const r = await run([Deno.execPath(), 'run', '--allow-all', suite.file, preset]);
        if (r.spawnError !== undefined) {
          spawnError = r.spawnError;
          break;
        }
        code = code || r.code;
        out += r.out;
      }
      suiteRun = { code, out, spawnError };
    } else {
      const cmd = suite.kind === 'deno-test'
        ? [Deno.execPath(), 'test', '--allow-all', suite.file]
        : [
          // Playwright specs must run under the Playwright runner, not
          // `deno test` (the old command always failed and the output-regex
          // skip masked it). The list reporter prints each test title so the
          // expected evidence fragments are observable in stdout.
          Deno.execPath(),
          'run',
          '-A',
          'npm:@playwright/test@1.59.1',
          'test',
          '--config',
          'www/e2e/playwright.config.ts',
          '--project=chromium',
          '--reporter=list',
          suite.file,
        ];
      suiteRun = await run(cmd);
    }

    const outcome = evaluateSuiteOutcome(suite, suiteRun, infraMissing);
    if (outcome.verdict === 'skip') {
      skips.push(`${suite.file}: skipped (${outcome.reason})`);
    } else if (outcome.verdict === 'fail') {
      failures.push(`${suite.file}: ${outcome.reason}`);
    }
  }

  if (skips.length > 0) {
    console.warn('Critical path suites skipped (missing infra):');
    for (const skip of skips) console.warn(`- ${skip}`);
  }
  if (failures.length > 0) {
    console.error('Critical path test gate failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    Deno.exit(1);
  }

  console.log(
    `Critical path test gate passed (${suites.length} suites, ${skips.length} skipped).`,
  );
}

if (import.meta.main) await main();
