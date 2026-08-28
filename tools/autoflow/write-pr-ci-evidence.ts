/**
 * Write the exact-SHA PR full-CI evidence record inside the authorized CI
 * workflow (#1156 R7). Every field derives from trusted workflow context
 * (github.* / needs.*) passed through the environment — never from
 * user-controlled inputs. The record is deterministic for a given run: stable
 * name, stable content, no timestamps. The aggregation job runs only after
 * every required full-matrix job succeeds, so any non-success need fails the
 * write loudly instead of emitting degraded evidence.
 */

import {
  PR_CI_ARTIFACT_PREFIX,
  PR_CI_WORKFLOW_FILE,
  REQUIRED_PR_CI_JOBS,
} from './loop-evidence.ts';

export interface PrCiWorkflowContext {
  headSha: string;
  runId: string;
  runAttempt: string;
  repository: string;
  eventName: string;
  /** Parsed value of the workflow `needs` context (job id -> { result }). */
  needs: Record<string, { result?: string }>;
  runUrl: string;
}

/** Build the schema-2 record from trusted workflow context, failing closed. */
export function buildPrCiEvidenceRecord(context: PrCiWorkflowContext): string {
  if (!/^[0-9a-f]{40}$/i.test(context.headSha)) {
    throw new Error(`refusing to write evidence: untrusted head SHA ${context.headSha}`);
  }
  if (context.eventName !== 'pull_request') {
    throw new Error(`refusing to write evidence outside a pull request (${context.eventName})`);
  }
  const runId = Number(context.runId);
  const runAttempt = Number(context.runAttempt);
  if (!Number.isInteger(runId) || runId <= 0 || !Number.isInteger(runAttempt) || runAttempt <= 0) {
    throw new Error('refusing to write evidence: unusable run identity');
  }
  const jobs = REQUIRED_PR_CI_JOBS.map((name) => {
    const need = context.needs[name];
    if (!need) throw new Error(`refusing to write evidence: needs context lacks ${name}`);
    if (need.result !== 'success') {
      throw new Error(
        `refusing to write evidence: required job ${name} ended ${String(need.result)}`,
      );
    }
    return { name, conclusion: 'success' as const };
  });
  const record = {
    schemaVersion: 2,
    kind: 'pr-full-ci',
    sha: context.headSha.toLowerCase(),
    workflow: PR_CI_WORKFLOW_FILE,
    tier: 'ci',
    conclusion: 'success',
    matrixComplete: true,
    repository: context.repository,
    runId,
    runAttempt,
    event: 'pull_request',
    artifactName: `${PR_CI_ARTIFACT_PREFIX}${context.headSha.toLowerCase()}`,
    jobs,
    url: context.runUrl,
  };
  return `${JSON.stringify(record, null, 2)}\n`;
}

async function main(): Promise<void> {
  const needsRaw = Deno.env.get('NEEDS_JSON') ?? '';
  const record = buildPrCiEvidenceRecord({
    headSha: Deno.env.get('HEAD_SHA') ?? '',
    runId: Deno.env.get('RUN_ID') ?? '',
    runAttempt: Deno.env.get('RUN_ATTEMPT') ?? '',
    repository: Deno.env.get('REPOSITORY') ?? '',
    eventName: Deno.env.get('EVENT_NAME') ?? '',
    needs: JSON.parse(needsRaw || '{}'),
    runUrl: Deno.env.get('RUN_URL') ?? '',
  });
  await Deno.writeTextFile('pr-full-ci-evidence.json', record);
  console.log('wrote pr-full-ci-evidence.json');
}

if (import.meta.main) await main();
