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
 *
 * alpha.18: probes distinguish "infra genuinely absent" from "the probe
 * itself failed". Only the Playwright probe's explicit exit 3 (browser
 * executable missing) and a NotFound nitro package count as absence, and only
 * a non-zero suite exit consults the probe at all. A broken probe (import
 * error, npm fetch failure, unexpected fs state) is a failure, never a skip.
 * Under CI (CI or GITHUB_ACTIONS env) every infra absence and runner spawn
 * failure is a failure too: the workflow installs the browsers explicitly
 * (autoflow-ci.yml), so a skip there would silently downgrade a broken
 * toolchain.
 */

import { formatError } from '@openelement/element';

export interface Suite {
  file: string;
  kind: 'deno-test' | 'nitro-proof' | 'e2e';
  expect: string[];
  /** Classifies the required runtime infra; undefined means it is present. */
  probeInfra?: () => Promise<ProbeResult | undefined>;
}

export interface SuiteRun {
  code: number;
  out: string;
  /** The suite process could not be spawned at all (executable missing). */
  spawnError?: string;
}

/**
 * Probe classification. `missing` means the infra is genuinely absent (a skip
 * is allowed outside CI); `error` means the probe itself failed and nothing
 * can be concluded about the infra (a failure, always). `undefined` means the
 * infra is present.
 */
export type ProbeResult =
  | { status: 'missing'; reason: string }
  | { status: 'error'; reason: string };

export type SuiteOutcome =
  | { verdict: 'pass' }
  | { verdict: 'skip'; reason: string }
  | { verdict: 'fail'; reason: string };

/** CI-like environment: GitHub Actions sets both CI and GITHUB_ACTIONS. */
export function isCiLikeEnv(env: (name: string) => string | undefined): boolean {
  return env('CI') === 'true' || env('GITHUB_ACTIONS') === 'true';
}

/**
 * Outcome classification. The infra probe only ever explains a non-zero suite
 * exit; a passing suite is judged by its evidence alone (a probe error beside
 * a passing suite is a probe false negative, not a broken suite).
 * - spawn failure of the suite runner: skip locally, fail under CI.
 * - probe error (the probe itself failed): always a failure, never a skip.
 * - probe missing (infra genuinely absent): skip locally, fail under CI.
 * - no probe finding: the suite's own exit code and evidence decide.
 */
export function evaluateSuiteOutcome(
  suite: Suite,
  run: SuiteRun,
  probe: ProbeResult | undefined,
  ciEnv: boolean,
): SuiteOutcome {
  if (run.spawnError !== undefined) {
    const reason = `suite runner unavailable: ${run.spawnError}`;
    return ciEnv ? { verdict: 'fail', reason } : { verdict: 'skip', reason };
  }
  if (run.code !== 0) {
    if (probe?.status === 'error') {
      return { verdict: 'fail', reason: `infra probe failed: ${probe.reason}` };
    }
    if (probe?.status === 'missing') {
      if (ciEnv) {
        return { verdict: 'fail', reason: `required infra missing under CI: ${probe.reason}` };
      }
      return { verdict: 'skip', reason: probe.reason };
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
 * Classify the browser probe's exit. Exit 0: the browser is installed. Exit 3
 * is the probe script's explicit "executable missing" signal (its
 * Deno.statSync failed). Any other non-zero exit means the probe itself
 * failed — the playwright import, the npm fetch, or the eval crashed — which
 * says nothing about browser presence.
 */
export function classifyPlaywrightProbe(
  browser: string,
  code: number,
  stderr: string,
): ProbeResult | undefined {
  if (code === 0) return undefined;
  const detail = stderr.trim().split('\n')[0] ?? '';
  if (code === 3) {
    return {
      status: 'missing',
      reason: `playwright ${browser} executable not installed (probe exit 3)${
        detail ? `: ${detail}` : ''
      }`,
    };
  }
  return {
    status: 'error',
    reason: `playwright ${browser} probe failed (exit ${code})${detail ? `: ${detail}` : ''}`,
  };
}

/**
 * Playwright browser presence is probed by resolving the executable path and
 * stat-ing it. The probe's exit code is the classification signal; see
 * classifyPlaywrightProbe.
 */
export async function probePlaywrightBrowser(browser: string): Promise<ProbeResult | undefined> {
  let probe: Deno.CommandOutput;
  try {
    probe = await new Deno.Command(Deno.execPath(), {
      args: [
        'eval',
        `import { ${browser} } from 'npm:playwright@1.59.1';` +
        `try { Deno.statSync(${browser}.executablePath()); } catch { Deno.exit(3); }`,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
  } catch (error) {
    return {
      status: 'error',
      reason: `playwright ${browser} probe could not spawn: ${formatError(error)}`,
    };
  }
  return classifyPlaywrightProbe(browser, probe.code, new TextDecoder().decode(probe.stderr));
}

/** nitro-proof builds a fixture with the locally installed nitro package. */
export async function probeNitroPackage(): Promise<ProbeResult | undefined> {
  try {
    const stat = await Deno.stat('node_modules/nitro');
    if (stat.isDirectory) return undefined;
    return { status: 'error', reason: 'node_modules/nitro exists but is not a directory' };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return {
        status: 'missing',
        reason: 'nitro package not installed (node_modules/nitro missing)',
      };
    }
    return {
      status: 'error',
      reason: `nitro probe failed: ${formatError(error)}`,
    };
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
      spawnError: formatError(error),
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
      spawnError: formatError(error),
    };
  }
}

async function main(): Promise<void> {
  const failures: string[] = [];
  const skips: string[] = [];
  const ciEnv = isCiLikeEnv((name) => Deno.env.get(name));

  for (const suite of suites) {
    const probe = suite.probeInfra ? await suite.probeInfra() : undefined;

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

    const outcome = evaluateSuiteOutcome(suite, suiteRun, probe, ciEnv);
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
