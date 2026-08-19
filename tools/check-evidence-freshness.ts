/**
 * #997 release-level evidence freshness gate for the real-provider smoke
 * workflows (tier 2: supabase-project-smoke.yml, tier 3:
 * fullstack-deploy-smoke.yml).
 *
 * The gate reads the SCHEDULED run history of both workflows through the
 * GitHub Actions API and fails closed:
 *
 *   a) two consecutive scheduled failures block release;
 *   b) the newest scheduled run failing blocks release — a newer failure is
 *      never masked by older green runs;
 *   c) the newest scheduled SUCCESS older than 14 days is stale evidence;
 *   d) no scheduled runs at all blocks release (release-level evidence
 *      requirement, fail-closed).
 *
 * A missing token or an unreachable API also exits 1: this is release-level
 * evidence, so unverifiable means blocked, never assumed green. The token
 * comes from GITHUB_TOKEN or GH_TOKEN and is never printed. The release
 * workflow grants the token `actions: read` (see autoflow-release.yml).
 *
 * Logic and IO are separated: evaluateScheduledRuns is pure and takes the
 * run list injected; fetchScheduledRuns is the only network code.
 */

import { formatError } from '@openelement/element';

export interface ScheduledRunSummary {
  /** GitHub run status; only `completed` runs count as evidence. */
  status: string;
  conclusion: string | null;
  /** ISO-8601 creation timestamp of the run. */
  createdAt: string;
}

export interface WorkflowFreshnessVerdict {
  workflow: string;
  ok: boolean;
  reasons: string[];
  /** Age of the newest scheduled success in days, when one exists. */
  newestSuccessAgeDays?: number;
}

export const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const EVIDENCE_WORKFLOWS = [
  { file: 'supabase-project-smoke.yml', label: 'tier-2 supabase-project-smoke' },
  { file: 'fullstack-deploy-smoke.yml', label: 'tier-3 fullstack-deploy-smoke' },
] as const;

export function evaluateScheduledRuns(
  workflow: string,
  runs: ScheduledRunSummary[],
  now: Date,
): WorkflowFreshnessVerdict {
  const completed = runs
    .filter((run) => run.status === 'completed')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  if (completed.length === 0) {
    return {
      workflow,
      ok: false,
      reasons: [
        `${workflow}: no completed scheduled runs on record; scheduled provider evidence is a ` +
        'release-level requirement and fails closed — let the weekly schedule run (or trigger ' +
        'the workflow and wait for the next scheduled slot) before releasing',
      ],
    };
  }

  const succeeded = (run: ScheduledRunSummary): boolean => run.conclusion === 'success';
  const [newest, previous] = completed;
  const reasons: string[] = [];

  if (!succeeded(newest) && previous !== undefined && !succeeded(previous)) {
    reasons.push(
      `${workflow}: two consecutive scheduled runs failed (newest ${newest.createdAt} ` +
        `conclusion=${newest.conclusion ?? 'none'}, previous ${previous.createdAt} ` +
        `conclusion=${
          previous.conclusion ?? 'none'
        }); two consecutive scheduled failures block release`,
    );
  }
  if (!succeeded(newest)) {
    reasons.push(
      `${workflow}: newest scheduled run (${newest.createdAt}) concluded ` +
        `${newest.conclusion ?? 'none'}; a newer failure is never masked by older green runs`,
    );
  }

  const newestSuccess = completed.find(succeeded);
  let newestSuccessAgeDays: number | undefined;
  if (newestSuccess !== undefined) {
    const ageMs = now.getTime() - Date.parse(newestSuccess.createdAt);
    newestSuccessAgeDays = ageMs / DAY_MS;
    if (ageMs > STALE_AFTER_MS) {
      reasons.push(
        `${workflow}: newest scheduled success (${newestSuccess.createdAt}) is ` +
          `${
            Math.floor(newestSuccessAgeDays)
          } days old; scheduled evidence older than 14 days is stale`,
      );
    }
  }

  return { workflow, ok: reasons.length === 0, reasons, newestSuccessAgeDays };
}

export function resolveToken(env: (name: string) => string | undefined): string | undefined {
  return env('GITHUB_TOKEN') || env('GH_TOKEN') || undefined;
}

/** The only network code in this tool. Never logs the token. */
export async function fetchScheduledRuns(
  repo: string,
  workflowFile: string,
  token: string,
): Promise<ScheduledRunSummary[]> {
  const url =
    `https://api.github.com/repos/${repo}/actions/workflows/${workflowFile}/runs?event=schedule&per_page=10`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2022-11-28',
        'user-agent': 'openelement-evidence-freshness-gate',
      },
    });
  } catch (error) {
    throw new Error(
      `GitHub Actions API unreachable for ${workflowFile} ` +
        `(${formatError(error)}); release-level evidence ` +
        'requires readable scheduled run history and fails closed',
    );
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(
      `GitHub Actions API returned HTTP ${response.status} for ${workflowFile}; the token needs ` +
        'actions:read on the repository and release-level evidence fails closed',
    );
  }
  const body: unknown = await response.json();
  if (
    typeof body !== 'object' || body === null ||
    !Array.isArray((body as { workflow_runs?: unknown }).workflow_runs)
  ) {
    throw new Error(`unexpected GitHub Actions API payload for ${workflowFile}`);
  }
  const runs = (body as { workflow_runs: Array<Record<string, unknown>> }).workflow_runs;
  return runs.map((run) => ({
    status: String(run.status ?? ''),
    conclusion: run.conclusion == null ? null : String(run.conclusion),
    createdAt: String(run.created_at ?? ''),
  }));
}

export interface FreshnessCheckDeps {
  env?: (name: string) => string | undefined;
  repo?: string;
  now?: Date;
  fetchRuns?: typeof fetchScheduledRuns;
  log?: (message: string) => void;
  error?: (message: string) => void;
}

/** Returns the process exit code; kept Deno.exit-free so tests can drive it. */
export async function runEvidenceFreshnessCheck(deps: FreshnessCheckDeps = {}): Promise<number> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name));
  const log = deps.log ?? console.log;
  const error = deps.error ?? console.error;
  const now = deps.now ?? new Date();
  const repo = deps.repo ?? env('GITHUB_REPOSITORY') ?? 'open-element/openelement';
  const fetchRuns = deps.fetchRuns ?? fetchScheduledRuns;

  const token = resolveToken(env);
  if (token === undefined) {
    error(
      'evidence freshness gate: neither GITHUB_TOKEN nor GH_TOKEN is set. This is a ' +
        'release-level evidence requirement (#997): the gate reads the scheduled run history of ' +
        'the tier-2/tier-3 provider smoke workflows through the GitHub Actions API and fails ' +
        'closed. Provide a token with actions:read on the repository (the release workflow ' +
        'grants it via `permissions: actions: read`).',
    );
    return 1;
  }

  const verdicts: WorkflowFreshnessVerdict[] = [];
  for (const workflow of EVIDENCE_WORKFLOWS) {
    let runs: ScheduledRunSummary[];
    try {
      runs = await fetchRuns(repo, workflow.file, token);
    } catch (cause) {
      error(`evidence freshness gate: ${cause instanceof Error ? cause.message : String(cause)}`);
      return 1;
    }
    const verdict = evaluateScheduledRuns(workflow.label, runs, now);
    verdicts.push(verdict);
    if (verdict.ok) {
      const age = verdict.newestSuccessAgeDays?.toFixed(1) ?? 'unknown';
      log(
        `${verdict.workflow}: fresh scheduled evidence (newest scheduled success ${age} days ago)`,
      );
    } else {
      for (const reason of verdict.reasons) error(reason);
    }
  }

  const failed = verdicts.filter((verdict) => !verdict.ok);
  if (failed.length > 0) {
    error(
      `evidence freshness gate FAILED for: ${failed.map((verdict) => verdict.workflow).join(', ')}`,
    );
    return 1;
  }
  log('Evidence freshness gate passed for tier-2 and tier-3 scheduled provider evidence.');
  return 0;
}

if (import.meta.main) {
  Deno.exit(await runEvidenceFreshnessCheck());
}
