/**
 * Canonical release-gate verdict contract tests (#1216, A10.8).
 *
 * A release gate is production code: only PASS admits a release; UNKNOWN
 * (infra uncertainty) and FAIL always fail closed; SKIP_ALLOWED admits only
 * when release policy explicitly allows a skip.
 */

import { assertEquals } from '@std/assert';
import {
  admitsRelease,
  fail,
  pass,
  releaseGateExitCode,
  skipAllowed,
  unknown,
} from './gate-verdict.ts';

Deno.test('gate-verdict: only PASS admits a release by default', () => {
  assertEquals(admitsRelease(pass('confirmed')), true);
  assertEquals(admitsRelease(fail('confirmed absence')), false);
  assertEquals(admitsRelease(unknown('registry timeout')), false);
  assertEquals(admitsRelease(skipAllowed('infra absent locally')), false);
});

Deno.test('gate-verdict: SKIP_ALLOWED admits only when release policy explicitly allows skips', () => {
  const skip = skipAllowed('policy-sanctioned skip');
  assertEquals(admitsRelease(skip, { allowSkip: false }), false);
  assertEquals(admitsRelease(skip, { allowSkip: true }), true);
  // Policy never rescues FAIL or UNKNOWN.
  assertEquals(admitsRelease(fail('x'), { allowSkip: true }), false);
  assertEquals(admitsRelease(unknown('x'), { allowSkip: true }), false);
});

Deno.test('gate-verdict: exit code is 0 only for admitted verdicts', () => {
  assertEquals(releaseGateExitCode(pass('ok')), 0);
  assertEquals(releaseGateExitCode(fail('no')), 1);
  assertEquals(releaseGateExitCode(unknown('timeout')), 1);
  assertEquals(releaseGateExitCode(skipAllowed('skip')), 1);
  assertEquals(releaseGateExitCode(skipAllowed('skip'), { allowSkip: true }), 0);
});

Deno.test('gate-verdict: decisions carry a human-readable reason', () => {
  assertEquals(pass('p').reason, 'p');
  assertEquals(fail('f').reason, 'f');
  assertEquals(unknown('u').reason, 'u');
  assertEquals(skipAllowed('s').reason, 's');
});
