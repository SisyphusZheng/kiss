/**
 * Canonical release-gate verdict contract (#1216, A10.8; umbrella #1155;
 * ADR-0151).
 *
 * A release gate is production code. Ad-hoc boolean results collapse
 * confirmed failure and infrastructure uncertainty into the same value, which
 * is how `catch { return false }` once turned a registry outage into a
 * silently passing post-publish gate (H6). This module is the one shared
 * verdict vocabulary for release-critical gates under tools/:
 *
 * - PASS          — the gate's claim is positively confirmed by evidence.
 * - FAIL          — the gate's claim is positively refuted (e.g. a confirmed
 *                   registry 404, a missing release artifact, stale evidence).
 * - SKIP_ALLOWED  — the gate did not run and release policy explicitly
 *                   sanctions the skip (e.g. infra genuinely absent outside
 *                   CI, as in check-critical-path-tests.ts). Never produced
 *                   for uncertainty; requires an affirmative policy decision.
 * - UNKNOWN       — infrastructure uncertainty: timeout, DNS/network
 *                   failure, 5xx, malformed or inconsistent response. NOTHING
 *                   can be concluded about the gate's claim.
 *
 * Release admission is fail closed: only PASS admits by default; FAIL and
 * UNKNOWN always block; SKIP_ALLOWED blocks unless the caller passes an
 * explicit `{ allowSkip: true }` policy. There is no path from UNKNOWN to
 * PASS or SKIP.
 */

export type GateVerdict = 'PASS' | 'FAIL' | 'SKIP_ALLOWED' | 'UNKNOWN';

export interface GateDecision {
  readonly verdict: GateVerdict;
  /** Human-readable evidence or diagnostic behind the verdict. */
  readonly reason: string;
}

export function pass(reason: string): GateDecision {
  return { verdict: 'PASS', reason };
}

export function fail(reason: string): GateDecision {
  return { verdict: 'FAIL', reason };
}

export function skipAllowed(reason: string): GateDecision {
  return { verdict: 'SKIP_ALLOWED', reason };
}

export function unknown(reason: string): GateDecision {
  return { verdict: 'UNKNOWN', reason };
}

export interface ReleaseAdmissionPolicy {
  /**
   * Admit a SKIP_ALLOWED verdict. Defaults to false: a skip only ever admits
   * a release when the release policy for that gate explicitly says so.
   */
  readonly allowSkip?: boolean;
}

/**
 * Release admission, fail closed: PASS admits; SKIP_ALLOWED admits only under
 * an explicit allow-skip policy; FAIL and UNKNOWN never admit.
 */
export function admitsRelease(
  decision: GateDecision,
  policy: ReleaseAdmissionPolicy = {},
): boolean {
  switch (decision.verdict) {
    case 'PASS':
      return true;
    case 'SKIP_ALLOWED':
      return policy.allowSkip === true;
    case 'FAIL':
    case 'UNKNOWN':
      return false;
  }
}

/** Process exit code for a release gate: 0 only when the release is admitted. */
export function releaseGateExitCode(
  decision: GateDecision,
  policy: ReleaseAdmissionPolicy = {},
): 0 | 1 {
  return admitsRelease(decision, policy) ? 0 : 1;
}
