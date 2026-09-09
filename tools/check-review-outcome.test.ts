import { assert, assertEquals } from '@std/assert';
import {
  classifyReviewComment,
  evaluateReviewOutcome,
  type ReviewCommentSummary,
  runReviewOutcomeCheck,
} from './check-review-outcome.ts';

function comment(body: string): ReviewCommentSummary {
  return { body, createdAt: '2026-09-09T00:00:00Z' };
}

const FOOTER = '[opencode session](https://opencode.ai/s/abc)  |  ' +
  '[github run](/open-element/openelement/actions/runs/123)';

const GENUINE_REVIEW = [
  '## Review summary',
  '',
  'The route-table change looks correct. A few observations:',
  '',
  '- `match()` merges conservative and indexed candidates in registration order — good.',
  '- Consider documenting the `baseURL` behavior for relative inputs.',
  '- Nit: the `sequence` field could use a tighter type.',
  '',
  FOOTER,
].join('\n');

Deno.test('review-outcome: genuine review comment passes', () => {
  const verdict = evaluateReviewOutcome({
    stepOutcome: 'success',
    comments: [comment(GENUINE_REVIEW)],
  });
  assertEquals(verdict.ok, true);
});

Deno.test('review-outcome: observed #1343 insufficient-balance comment fails', () => {
  const verdict = evaluateReviewOutcome({
    stepOutcome: 'success',
    comments: [comment(`APIError: Insufficient Balance\n\n${FOOTER}`)],
  });
  assertEquals(verdict.ok, false);
  assert(verdict.reasons.some((reason) => reason.includes('provider')));
});

Deno.test('review-outcome: each provider error category fails', () => {
  const bodies = [
    'APIError: upstream rejected the request',
    'Error: HTTP 429 Too Many Requests from provider',
    'rate_limit exceeded for this API key',
    'Authentication failed: invalid api key',
    'HTTP 401 returned by the provider',
    'HTTP 503 Service Unavailable',
    'The model request timed out after 30s',
    'Error: model deepseek-v9-pro not found',
    'context length exceeded for this model',
  ];
  for (const body of bodies) {
    assertEquals(
      classifyReviewComment(`${body}\n\n${FOOTER}`).ok,
      false,
      `expected failure for: ${body}`,
    );
  }
});

Deno.test('review-outcome: long review mentioning rate limits deep in the body passes', () => {
  const body = '## Review\n\nThe rate-limit binding correctly fails closed. ' +
    'Detailed notes follow. '.repeat(20) + FOOTER;
  assertEquals(classifyReviewComment(body).ok, true);
});

Deno.test('review-outcome: missing review comment fails closed', () => {
  const verdict = evaluateReviewOutcome({ stepOutcome: 'success', comments: [] });
  assertEquals(verdict.ok, false);
  assert(verdict.reasons.some((reason) => reason.includes('no review comment')));
});

Deno.test('review-outcome: failed step outcome fails even with a genuine review comment', () => {
  const verdict = evaluateReviewOutcome({
    stepOutcome: 'failure',
    comments: [comment(GENUINE_REVIEW)],
  });
  assertEquals(verdict.ok, false);
  assert(verdict.reasons.some((reason) => reason.includes('"failure"')));
});

Deno.test('review-outcome: empty payload after the footer fails closed', () => {
  assertEquals(classifyReviewComment(FOOTER).ok, false);
});

Deno.test('review-outcome: an earlier error is superseded by a later genuine review', () => {
  const verdict = evaluateReviewOutcome({
    stepOutcome: 'success',
    comments: [comment(`APIError: Insufficient Balance\n\n${FOOTER}`), comment(GENUINE_REVIEW)],
  });
  assertEquals(verdict.ok, true);
});

Deno.test('review-outcome: run check fails without run identity', async () => {
  const errors: string[] = [];
  const code = await runReviewOutcomeCheck({
    env: () => undefined,
    error: (message) => errors.push(message),
  });
  assertEquals(code, 1);
  assert(errors.some((message) => message.includes('GITHUB_REPOSITORY')));
});

Deno.test('review-outcome: run check fails without a token', async () => {
  const errors: string[] = [];
  const env = (name: string) =>
    ({ GITHUB_REPOSITORY: 'open-element/openelement', PR_NUMBER: '1343', RUN_ID: '1' })[name];
  const code = await runReviewOutcomeCheck({
    env,
    error: (message) => errors.push(message),
  });
  assertEquals(code, 1);
  assert(errors.some((message) => message.includes('GITHUB_TOKEN')));
});

Deno.test('review-outcome: run check passes with injected genuine review', async () => {
  const logs: string[] = [];
  const env = (name: string) =>
    ({
      GITHUB_REPOSITORY: 'open-element/openelement',
      PR_NUMBER: '1343',
      RUN_ID: '1',
      REVIEW_STEP_OUTCOME: 'success',
      GITHUB_TOKEN: 'test-token',
    })[name];
  const code = await runReviewOutcomeCheck({
    env,
    fetchComments: () => Promise.resolve([comment(GENUINE_REVIEW)]),
    log: (message) => logs.push(message),
  });
  assertEquals(code, 0);
  assert(logs.some((message) => message.includes('executed review')));
});

Deno.test('review-outcome: run check fails when comment fetch throws', async () => {
  const errors: string[] = [];
  const env = (name: string) =>
    ({
      GITHUB_REPOSITORY: 'open-element/openelement',
      PR_NUMBER: '1343',
      RUN_ID: '1',
      REVIEW_STEP_OUTCOME: 'success',
      GITHUB_TOKEN: 'test-token',
    })[name];
  const code = await runReviewOutcomeCheck({
    env,
    fetchComments: () => Promise.reject(new Error('HTTP 403')),
    error: (message) => errors.push(message),
  });
  assertEquals(code, 1);
  assert(errors.some((message) => message.includes('HTTP 403')));
});
