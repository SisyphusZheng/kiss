import { assertEquals, assertStringIncludes } from '@std/assert';
import {
  evaluateScheduledRuns,
  resolveToken,
  runEvidenceFreshnessCheck,
  type ScheduledRunSummary,
  STALE_AFTER_MS,
} from './check-evidence-freshness.ts';

const NOW = new Date('2026-08-17T06:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;

function run(
  daysAgo: number,
  conclusion: string | null,
  status = 'completed',
): ScheduledRunSummary {
  return {
    status,
    conclusion,
    createdAt: new Date(NOW.getTime() - daysAgo * DAY_MS).toISOString(),
  };
}

Deno.test('fresh evidence passes: newest scheduled run is a recent success', () => {
  const verdict = evaluateScheduledRuns(
    'tier-2',
    [run(2, 'success'), run(9, 'failure'), run(16, 'success')],
    NOW,
  );
  assertEquals(verdict.ok, true);
  assertEquals(verdict.reasons, []);
  assertEquals(verdict.newestSuccessAgeDays, 2);
});

Deno.test('(a) two consecutive scheduled failures block release', () => {
  const verdict = evaluateScheduledRuns(
    'tier-2',
    [run(1, 'failure'), run(8, 'failure'), run(15, 'success')],
    NOW,
  );
  assertEquals(verdict.ok, false);
  assertStringIncludes(verdict.reasons.join('\n'), 'two consecutive scheduled runs failed');
});

Deno.test('(b) a newer failure is never masked by older green runs', () => {
  const verdict = evaluateScheduledRuns(
    'tier-3',
    [run(1, 'failure'), run(8, 'success'), run(15, 'success')],
    NOW,
  );
  assertEquals(verdict.ok, false);
  const text = verdict.reasons.join('\n');
  assertStringIncludes(text, 'newest scheduled run');
  assertStringIncludes(text, 'never masked by older green runs');
  // A single failed run is not the two-consecutive-failures case.
  assertEquals(text.includes('two consecutive'), false);
});

Deno.test('(c) a newest scheduled success older than 14 days is stale', () => {
  const verdict = evaluateScheduledRuns('tier-2', [run(15, 'success')], NOW);
  assertEquals(verdict.ok, false);
  assertStringIncludes(verdict.reasons.join('\n'), 'stale');
});

Deno.test('boundary: a success exactly 14 days old is still fresh', () => {
  const exactly14 = new Date(NOW.getTime() - STALE_AFTER_MS).toISOString();
  const verdict = evaluateScheduledRuns(
    'tier-2',
    [{ status: 'completed', conclusion: 'success', createdAt: exactly14 }],
    NOW,
  );
  assertEquals(verdict.ok, true);
  assertEquals(verdict.reasons, []);
});

Deno.test('boundary: one millisecond past 14 days is stale', () => {
  const justOver = new Date(NOW.getTime() - STALE_AFTER_MS - 1).toISOString();
  const verdict = evaluateScheduledRuns(
    'tier-2',
    [{ status: 'completed', conclusion: 'success', createdAt: justOver }],
    NOW,
  );
  assertEquals(verdict.ok, false);
  assertStringIncludes(verdict.reasons.join('\n'), 'stale');
});

Deno.test('(d) no scheduled runs fails closed with a release-level message', () => {
  const verdict = evaluateScheduledRuns('tier-3', [], NOW);
  assertEquals(verdict.ok, false);
  const text = verdict.reasons.join('\n');
  assertStringIncludes(text, 'no completed scheduled runs');
  assertStringIncludes(text, 'fails closed');
});

Deno.test('one failure followed by a fresh success passes (no consecutive failures)', () => {
  const verdict = evaluateScheduledRuns('tier-2', [run(3, 'success'), run(10, 'failure')], NOW);
  assertEquals(verdict.ok, true);
});

Deno.test('in-progress scheduled runs are not evidence; newest completed decides', () => {
  const verdict = evaluateScheduledRuns(
    'tier-2',
    [run(0, null, 'in_progress'), run(2, 'success')],
    NOW,
  );
  assertEquals(verdict.ok, true);
  assertEquals(verdict.newestSuccessAgeDays, 2);
});

Deno.test('runs are ordered by createdAt, not injection order', () => {
  const verdict = evaluateScheduledRuns(
    'tier-2',
    [run(9, 'failure'), run(1, 'failure'), run(20, 'success')],
    NOW,
  );
  assertEquals(verdict.ok, false);
  assertStringIncludes(verdict.reasons.join('\n'), 'two consecutive scheduled runs failed');
});

Deno.test('cancelled newest run counts as not-success evidence', () => {
  const verdict = evaluateScheduledRuns('tier-3', [run(1, 'cancelled'), run(8, 'success')], NOW);
  assertEquals(verdict.ok, false);
  assertStringIncludes(verdict.reasons.join('\n'), 'cancelled');
});

Deno.test('resolveToken prefers GITHUB_TOKEN and falls back to GH_TOKEN', () => {
  const both = (name: string) => ({ GITHUB_TOKEN: 'aaa', GH_TOKEN: 'bbb' })[name];
  assertEquals(resolveToken(both), 'aaa');
  const ghOnly = (name: string) => ({ GH_TOKEN: 'bbb' })[name];
  assertEquals(resolveToken(ghOnly), 'bbb');
  const none = () => undefined;
  assertEquals(resolveToken(none), undefined);
});

Deno.test('no token fails closed without touching the API', async () => {
  const errors: string[] = [];
  const code = await runEvidenceFreshnessCheck({
    env: () => undefined,
    error: (message) => errors.push(message),
    fetchRuns: () => {
      throw new Error('fetch must not be called without a token');
    },
  });
  assertEquals(code, 1);
  const text = errors.join('\n');
  assertStringIncludes(text, 'release-level evidence requirement');
  assertStringIncludes(text, 'actions:read');
});

Deno.test('an unreachable API fails closed with the release-level wording', async () => {
  const errors: string[] = [];
  const code = await runEvidenceFreshnessCheck({
    env: (name) => (name === 'GITHUB_TOKEN' ? 'token' : undefined),
    error: (message) => errors.push(message),
    fetchRuns: () => Promise.reject(new Error('GitHub Actions API unreachable for x.yml')),
  });
  assertEquals(code, 1);
  assertStringIncludes(errors.join('\n'), 'unreachable');
});

Deno.test('aggregate: one stale workflow fails the gate even when the other is fresh', async () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const code = await runEvidenceFreshnessCheck({
    env: (name) => (name === 'GH_TOKEN' ? 'token' : undefined),
    now: NOW,
    log: (message) => logs.push(message),
    error: (message) => errors.push(message),
    fetchRuns: (_repo, file) =>
      Promise.resolve([
        file === 'supabase-project-smoke.yml' ? run(2, 'success') : run(30, 'success'),
      ]),
  });
  assertEquals(code, 1);
  assertStringIncludes(logs.join('\n'), 'fresh scheduled evidence');
  assertStringIncludes(errors.join('\n'), 'stale');
});

Deno.test('aggregate: both workflows fresh passes the gate', async () => {
  const logs: string[] = [];
  const code = await runEvidenceFreshnessCheck({
    env: (name) => (name === 'GITHUB_TOKEN' ? 'token' : undefined),
    now: NOW,
    log: (message) => logs.push(message),
    fetchRuns: () => Promise.resolve([run(2, 'success'), run(9, 'success')]),
  });
  assertEquals(code, 0);
  assertStringIncludes(logs.join('\n'), 'passed');
});
