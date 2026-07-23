import { assert, assertEquals } from '@std/assert';
import {
  evaluateSuiteOutcome,
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
  );
  assertEquals(outcome, { verdict: 'fail', reason: 'suite failed (exit 1)' });
});

Deno.test('a failed suite skips only when the infra probe reports absence', () => {
  const outcome = evaluateSuiteOutcome(
    suite,
    { code: 1, out: 'anything' },
    'playwright chromium executable not installed (probe exit 3)',
  );
  assertEquals(outcome.verdict, 'skip');
});

Deno.test('a runner that cannot be spawned at all is infra absence', () => {
  const outcome = evaluateSuiteOutcome(
    suite,
    { code: -1, out: '', spawnError: 'NotFound: deno' },
    undefined,
  );
  assertEquals(outcome.verdict, 'skip');
});

Deno.test('passing output still requires the named evidence fragments', () => {
  assertEquals(missingEvidence('alpha and beta', suite.expect), []);
  assertEquals(missingEvidence('only alpha', suite.expect), ['beta']);
  const outcome = evaluateSuiteOutcome(suite, { code: 0, out: 'only alpha' }, undefined);
  assertEquals(outcome.verdict, 'fail');
  assert(outcome.verdict === 'fail' && outcome.reason.includes("'beta'"));
});

Deno.test('nitro infra probe uses fs error types, not output matching', async () => {
  // This repo installs node_modules, so the probe must pass here; the probe
  // contract (undefined vs reason string) is what the gate consumes.
  assertEquals(await probeNitroPackage(), undefined);
});

Deno.test('playwright browser probe returns undefined or a typed reason', async () => {
  const result = await probePlaywrightBrowser('chromium');
  if (result !== undefined) {
    assert(result.includes('playwright chromium executable not installed'));
  }
});
