import { assert, assertEquals } from '@std/assert';
import {
  classifyPlaywrightProbe,
  evaluateSuiteOutcome,
  isCiLikeEnv,
  missingEvidence,
  probeNitroPackage,
  probePlaywrightBrowser,
  type Suite,
} from './check-critical-path-tests.ts';

const suite: Suite = { file: 'x.spec.ts', kind: 'e2e', expect: ['alpha', 'beta'] };

Deno.test('a failed suite with working infra is a failure, never a skip', () => {
  // The old output-regex downgrade turned exactly this output ("[chromium] ›")
  // into a skip. It must now fail.
  const outcome = evaluateSuiteOutcome(
    suite,
    { code: 1, out: '1) [chromium] › dsd-layers.spec.ts:10 › layers render\n  Error: boom' },
    undefined,
    false,
  );
  assertEquals(outcome, { verdict: 'fail', reason: 'suite failed (exit 1)' });
});

Deno.test('a failed suite skips locally only when the probe reports genuine absence', () => {
  const outcome = evaluateSuiteOutcome(
    suite,
    { code: 1, out: 'anything' },
    { status: 'missing', reason: 'playwright chromium executable not installed (probe exit 3)' },
    false,
  );
  assertEquals(outcome.verdict, 'skip');
});

Deno.test('genuine infra absence is a failure under CI, never a skip', () => {
  // autoflow-ci.yml installs chromium explicitly; absence there means the
  // toolchain is broken and the gate must say so.
  const outcome = evaluateSuiteOutcome(
    suite,
    { code: 1, out: 'anything' },
    { status: 'missing', reason: 'playwright chromium executable not installed (probe exit 3)' },
    true,
  );
  assertEquals(outcome.verdict, 'fail');
  assert(outcome.verdict === 'fail' && outcome.reason.includes('under CI'));
});

Deno.test('a probe that failed itself is a failure even locally, never a skip', () => {
  const outcome = evaluateSuiteOutcome(
    suite,
    { code: 1, out: 'anything' },
    { status: 'error', reason: 'playwright chromium probe failed (exit 1): npm fetch error' },
    false,
  );
  assertEquals(outcome.verdict, 'fail');
  assert(outcome.verdict === 'fail' && outcome.reason.includes('infra probe failed'));
});

Deno.test('a runner that cannot be spawned at all is infra absence locally', () => {
  const outcome = evaluateSuiteOutcome(
    suite,
    { code: -1, out: '', spawnError: 'NotFound: deno' },
    undefined,
    false,
  );
  assertEquals(outcome.verdict, 'skip');
});

Deno.test('a runner spawn failure is a failure under CI', () => {
  const outcome = evaluateSuiteOutcome(
    suite,
    { code: -1, out: '', spawnError: 'NotFound: deno' },
    undefined,
    true,
  );
  assertEquals(outcome.verdict, 'fail');
});

Deno.test('passing output still requires the named evidence fragments', () => {
  assertEquals(missingEvidence('alpha and beta', suite.expect), []);
  assertEquals(missingEvidence('only alpha', suite.expect), ['beta']);
  const outcome = evaluateSuiteOutcome(suite, { code: 0, out: 'only alpha' }, undefined, false);
  assertEquals(outcome.verdict, 'fail');
  assert(outcome.verdict === 'fail' && outcome.reason.includes("'beta'"));
});

Deno.test('a passing suite is judged by evidence, not by a broken probe', () => {
  // The probe only explains a non-zero exit; it must not condemn a suite that
  // ran and produced its evidence.
  const outcome = evaluateSuiteOutcome(
    suite,
    { code: 0, out: 'alpha and beta' },
    { status: 'error', reason: 'probe exploded' },
    true,
  );
  assertEquals(outcome, { verdict: 'pass' });
});

Deno.test('playwright probe classification: 0 ok, 3 missing, anything else probe failure', () => {
  assertEquals(classifyPlaywrightProbe('chromium', 0, ''), undefined);
  const missing = classifyPlaywrightProbe('chromium', 3, '');
  assertEquals(missing?.status, 'missing');
  assert(missing?.reason.includes('not installed'));
  const error = classifyPlaywrightProbe('chromium', 1, 'error: npm registry unreachable\nstack');
  assertEquals(error?.status, 'error');
  assert(error?.reason.includes('exit 1'));
  assert(error?.reason.includes('npm registry unreachable'));
  // The old behaviour classified every non-zero exit as "not installed".
  assert(error?.status !== 'missing');
});

Deno.test('isCiLikeEnv honours CI and GITHUB_ACTIONS', () => {
  assertEquals(isCiLikeEnv(() => undefined), false);
  assertEquals(isCiLikeEnv((name) => name === 'CI' ? 'true' : undefined), true);
  assertEquals(isCiLikeEnv((name) => name === 'GITHUB_ACTIONS' ? 'true' : undefined), true);
  assertEquals(isCiLikeEnv((name) => name === 'CI' ? '1' : undefined), false);
});

Deno.test('nitro infra probe uses fs error types, not output matching', async () => {
  // This repo installs node_modules, so the probe must pass here; the probe
  // contract (undefined vs ProbeResult) is what the gate consumes.
  assertEquals(await probeNitroPackage(), undefined);
});

Deno.test('playwright browser probe returns undefined or a typed ProbeResult', async () => {
  const result = await probePlaywrightBrowser('chromium');
  if (result !== undefined) {
    assert(result.status === 'missing' || result.status === 'error');
    if (result.status === 'missing') {
      assert(result.reason.includes('playwright chromium executable not installed'));
    }
  }
});
