/**
 * #1332: outcome gate for the third-party AI review job (opencode-review.yml).
 *
 * The review is supplemental and non-blocking (maintainer decision 2026-09-09):
 * the workflow downgrades this gate's verdict to a warning annotation. What must
 * never happen is a silent green: the review action posts provider errors as PR
 * comments while exiting 0 — the observed #1343 failure posted `APIError:
 * Insufficient Balance` under a successful wrapper. A successful wrapper job is
 * therefore not review evidence, and a provider error contributes zero review
 * evidence. This gate fails its own exit code (the workflow chooses not to
 * propagate that to a job failure) when:
 *
 *   a) the review step's own outcome is not `success`;
 *   b) no review comment attributable to this workflow run exists on the PR
 *      (the action links its `actions/runs/<id>` URL);
 *   c) that comment matches provider/API error signatures.
 *
 * Unverifiable means reported, never assumed green. The token comes from
 * GITHUB_TOKEN or GH_TOKEN and is never printed. The workflow grants the job
 * `issues: read`/`pull-requests: write` via its existing permissions.
 *
 * Logic and IO are separated: evaluateReviewOutcome / classifyReviewComment are
 * pure; fetchRunReviewComments is the only network code. Import-free on
 * purpose: the review job installs Deno only, not the workspace graph.
 */

export interface ReviewCommentSummary {
  /** Comment body, verbatim. */
  body: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
}

export interface ReviewOutcomeVerdict {
  ok: boolean;
  reasons: string[];
}

const formatError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Provider/API error signatures. Several independent categories, not one
 * hard-coded string: a provider failure is an error even when its wording is
 * new, so each category anchors on the structural shape of a provider report.
 */
const PROVIDER_ERROR_PATTERNS: Array<{ category: string; re: RegExp }> = [
  { category: 'provider API error', re: /\bAPIError\b/i },
  { category: 'billing/balance', re: /\binsufficient\s+(?:balance|quota|funds)\b/i },
  { category: 'billing/balance', re: /\bbilling\b.{0,40}\b(?:error|failed|required)\b/i },
  { category: 'rate limit', re: /\brate[\s_-]?limit(?:ed|ing)?\b/i },
  { category: 'rate limit', re: /\bHTTP\s*429\b|\b429\s+Too\s+Many\s+Requests\b/i },
  {
    category: 'authentication',
    re: /\b(?:unauthorized|authentication\s+failed|invalid\s+api[\s_-]?key)\b/i,
  },
  { category: 'authentication', re: /\bHTTP\s*40[13]\b/i },
  {
    category: 'provider unavailable',
    re: /\b(?:service\s+unavailable|provider\s+(?:is\s+)?unavailable)\b/i,
  },
  { category: 'provider unavailable', re: /\bHTTP\s*5\d\d\b/ },
  {
    category: 'provider timeout',
    re: /\b(?:request\s+)?timed?\s*out\b.{0,40}\b(?:provider|api|model)\b/i,
  },
  { category: 'provider timeout', re: /\b(?:provider|api|model)\b.{0,40}\btimed?\s*out\b/i },
  {
    category: 'model error',
    re: /\bmodel\b.{0,40}\b(?:not\s+found|does\s+not\s+exist|unavailable)\b/i,
  },
  { category: 'model error', re: /\bcontext\s+(?:length|window)\s+exceeded\b/i },
  {
    category: 'generic provider exception',
    re:
      /^(?:Error|Exception|TypeError|FetchError)\b.{0,120}(?:provider|api|deepseek|openai|anthropic|model)/i,
  },
];

/**
 * Classification is structural, not one hard-coded string:
 *   - a payload that leads with a machine error marker (`APIError: …`,
 *     `Error: …`, `HTTP <4xx/5xx> …`) is a provider failure — genuine reviews
 *     lead with prose;
 *   - a payload too short to be a review that matches any provider-error
 *     category anywhere is a provider failure;
 *   - a payload with no letters at all (footer only) is empty and fails.
 * Quoting "rate limit" inside a long review body does not fail the gate.
 */
const HEAD_ERROR_MARKER = /^(?:[A-Za-z]*Error|Exception)\s*[:;]|^HTTP\s*[45]\d{2}\b/i;
const SHORT_PAYLOAD_MAX = 300;

/** The action's standard footer (session/run links) is attribution, not content. */
function reviewPayload(body: string): string {
  return body
    .replace(/\[[^\]]*(?:opencode session|github run)[^\]]*\]\([^)]*\)/giu, '')
    .replace(/ /g, ' ')
    .trim();
}

export function classifyReviewComment(body: string): { ok: boolean; category?: string } {
  const payload = reviewPayload(body).replace(/[|\s]+/g, ' ').trim();
  if (!/\p{L}/u.test(payload)) return { ok: false, category: 'empty review payload' };
  if (HEAD_ERROR_MARKER.test(payload)) {
    const category = PROVIDER_ERROR_PATTERNS.find(({ re }) => re.test(payload))?.category ??
      'provider error';
    return { ok: false, category };
  }
  if (payload.length <= SHORT_PAYLOAD_MAX) {
    for (const { category, re } of PROVIDER_ERROR_PATTERNS) {
      if (re.test(payload)) return { ok: false, category };
    }
  }
  return { ok: true };
}

export function evaluateReviewOutcome(input: {
  /** `steps.<review>.outcome` of the review action step. */
  stepOutcome: string;
  /** Review comments attributable to this run, oldest first. */
  comments: ReviewCommentSummary[];
}): ReviewOutcomeVerdict {
  const reasons: string[] = [];
  if (input.stepOutcome !== 'success') {
    reasons.push(
      `review step outcome is "${input.stepOutcome}", not success; a wrapped failure is not ` +
        'review evidence',
    );
  }
  const [latest] = input.comments.slice(-1);
  if (latest === undefined) {
    reasons.push(
      'no review comment attributable to this workflow run was found on the PR; the review ' +
        'did not produce evidence and the gate fails closed',
    );
  } else {
    const verdict = classifyReviewComment(latest.body);
    if (!verdict.ok) {
      reasons.push(
        `the run's review comment is a provider/API error (${verdict.category}), not a review; ` +
          'restore provider availability and rerun the review job',
      );
    }
  }
  return { ok: reasons.length === 0, reasons };
}

export function resolveToken(env: (name: string) => string | undefined): string | undefined {
  return env('GITHUB_TOKEN') || env('GH_TOKEN') || undefined;
}

/** The only network code in this tool. Never logs the token. */
export async function fetchRunReviewComments(
  repo: string,
  prNumber: string,
  runId: string,
  token: string,
): Promise<ReviewCommentSummary[]> {
  const attribution = `actions/runs/${runId}`;
  const comments: ReviewCommentSummary[] = [];
  // Issue comments, oldest first; a review PR accumulates few enough that a
  // bounded page walk suffices.
  for (let page = 1; page <= 10; page++) {
    const url =
      `https://api.github.com/repos/${repo}/issues/${prNumber}/comments?per_page=100&page=${page}`;
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${token}`,
          'x-github-api-version': '2022-11-28',
          'user-agent': 'openelement-review-outcome-gate',
        },
      });
    } catch (error) {
      throw new Error(
        `GitHub API unreachable while reading PR #${prNumber} comments (${formatError(error)}); ` +
          'review evidence requires readable PR comments and fails closed',
      );
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(
        `GitHub API returned HTTP ${response.status} for PR #${prNumber} comments; the token ` +
          'needs issues:read on the repository and review evidence fails closed',
      );
    }
    const body: unknown = await response.json();
    if (!Array.isArray(body)) {
      throw new Error(`unexpected GitHub API payload for PR #${prNumber} comments`);
    }
    for (const comment of body as Array<Record<string, unknown>>) {
      const user = comment.user as Record<string, unknown> | undefined;
      const text = typeof comment.body === 'string' ? comment.body : '';
      if (user?.login === 'github-actions[bot]' && text.includes(attribution)) {
        comments.push({ body: text, createdAt: String(comment.created_at ?? '') });
      }
    }
    if (body.length < 100) break;
  }
  return comments;
}

export interface ReviewOutcomeCheckDeps {
  env?: (name: string) => string | undefined;
  fetchComments?: typeof fetchRunReviewComments;
  log?: (message: string) => void;
  error?: (message: string) => void;
}

/** Returns the process exit code; kept Deno.exit-free so tests can drive it. */
export async function runReviewOutcomeCheck(deps: ReviewOutcomeCheckDeps = {}): Promise<number> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name));
  const log = deps.log ?? console.log;
  const error = deps.error ?? console.error;

  const repo = env('GITHUB_REPOSITORY');
  const prNumber = env('PR_NUMBER');
  const runId = env('RUN_ID');
  const stepOutcome = env('REVIEW_STEP_OUTCOME') ?? '';
  if (!repo || !prNumber || !runId) {
    error(
      'review outcome gate: GITHUB_REPOSITORY, PR_NUMBER and RUN_ID are required; without run ' +
        'identity the review evidence is unverifiable and the gate fails closed',
    );
    return 1;
  }
  const token = resolveToken(env);
  if (token === undefined) {
    error(
      'review outcome gate: neither GITHUB_TOKEN nor GH_TOKEN is set; review evidence is ' +
        'unverifiable and the gate fails closed',
    );
    return 1;
  }
  const fetchComments = deps.fetchComments ?? fetchRunReviewComments;
  let comments: ReviewCommentSummary[];
  try {
    comments = await fetchComments(repo, prNumber, runId, token);
  } catch (cause) {
    error(`review outcome gate: ${formatError(cause)}`);
    return 1;
  }
  const verdict = evaluateReviewOutcome({ stepOutcome, comments });
  if (!verdict.ok) {
    for (const reason of verdict.reasons) error(`review outcome gate: ${reason}`);
    return 1;
  }
  log(`review outcome gate: run ${runId} has an executed review on PR #${prNumber}.`);
  return 0;
}

if (import.meta.main) {
  Deno.exit(await runReviewOutcomeCheck());
}
