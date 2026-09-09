import { assert, assertRejects, assertStringIncludes } from '@std/assert';
import {
  type GitHubRunInfo,
  type GitHubRunQuery,
  parsePrCiEvidence,
  PR_CI_ARTIFACT_PREFIX,
  PR_CI_EVIDENCE_JOB_NAME,
  PR_CI_WORKFLOW_FILE,
  REQUIRED_PR_CI_JOBS,
  verifyPrCiProvenance,
} from '../loop-evidence.ts';

const SHA = 'a'.repeat(40);
const RUN_ID = 8123456789;

function record(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 2,
    kind: 'pr-full-ci',
    sha: SHA,
    workflow: PR_CI_WORKFLOW_FILE,
    tier: 'ci',
    conclusion: 'success',
    matrixComplete: true,
    repository: 'open-element/openelement',
    runId: RUN_ID,
    runAttempt: 1,
    event: 'pull_request',
    artifactName: `${PR_CI_ARTIFACT_PREFIX}${SHA}`,
    jobs: REQUIRED_PR_CI_JOBS.map((name) => ({ name, conclusion: 'success' })),
    ...overrides,
  };
}

function recordText(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify(record(overrides));
}

function runInfo(overrides: Partial<GitHubRunInfo> = {}): GitHubRunInfo {
  return {
    repository: 'open-element/openelement',
    workflowPath: `.github/workflows/${PR_CI_WORKFLOW_FILE}`,
    event: 'pull_request',
    headSha: SHA,
    status: 'completed',
    conclusion: 'success',
    runAttempt: 1,
    jobs: [
      { name: 'dependency-review', status: 'completed', conclusion: 'success' },
      { name: 'autoflow-ci', status: 'completed', conclusion: 'success' },
      { name: 'dist/server Node smoke (Node 20)', status: 'completed', conclusion: 'success' },
      { name: 'dist/server Node smoke (Node 24)', status: 'completed', conclusion: 'success' },
      { name: 'dist/server Bun smoke', status: 'completed', conclusion: 'success' },
      { name: 'workspace-qualification', status: 'completed', conclusion: 'success' },
      { name: PR_CI_EVIDENCE_JOB_NAME, status: 'completed', conclusion: 'success' },
    ],
    artifactNames: [`${PR_CI_ARTIFACT_PREFIX}${SHA}`],
    ...overrides,
  };
}

function queryReturning(info: GitHubRunInfo): GitHubRunQuery {
  return () => Promise.resolve(info);
}

function queryFailing(): GitHubRunQuery {
  return () => Promise.reject(new Error('HTTP 404: run not found'));
}

Deno.test('R8 probe 1: a self-attested record without a resolvable GitHub run is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  const error = await assertRejects(
    () => verifyPrCiProvenance(evidence, SHA, queryFailing()),
    Error,
  );
  assertStringIncludes(error.message, 'not resolvable');
});

Deno.test('R8 probe 2: wrong repository is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  await assertRejects(
    () =>
      verifyPrCiProvenance(evidence, SHA, queryReturning(runInfo({ repository: 'other/fork' }))),
    Error,
    'repository',
  );
});

Deno.test('R8 probe 2: wrong workflow path is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  await assertRejects(
    () =>
      verifyPrCiProvenance(
        evidence,
        SHA,
        queryReturning(runInfo({ workflowPath: '.github/workflows/nightly-stress.yml' })),
      ),
    Error,
    'workflow',
  );
});

Deno.test('R8 probe 2: a non-pull-request event is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  await assertRejects(
    () => verifyPrCiProvenance(evidence, SHA, queryReturning(runInfo({ event: 'push' }))),
    Error,
    'event',
  );
});

Deno.test('R8 probe 2: a run whose head SHA differs from the candidate is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  await assertRejects(
    () => verifyPrCiProvenance(evidence, SHA, queryReturning(runInfo({ headSha: 'b'.repeat(40) }))),
    Error,
    'stale or mismatched',
  );
});

Deno.test('R8 probe 2: a re-run attempt mismatch is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  await assertRejects(
    () => verifyPrCiProvenance(evidence, SHA, queryReturning(runInfo({ runAttempt: 2 }))),
    Error,
    'run attempt',
  );
});

Deno.test('R8 probe 2: a missing evidence artifact on the run is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  await assertRejects(
    () => verifyPrCiProvenance(evidence, SHA, queryReturning(runInfo({ artifactNames: [] }))),
    Error,
    'artifact',
  );
});

Deno.test('R8 probe 2: ambiguous duplicate evidence artifacts are rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  await assertRejects(
    () =>
      verifyPrCiProvenance(
        evidence,
        SHA,
        queryReturning(
          runInfo({
            artifactNames: [`${PR_CI_ARTIFACT_PREFIX}${SHA}`, `${PR_CI_ARTIFACT_PREFIX}${SHA}`],
          }),
        ),
      ),
    Error,
    'artifact',
  );
});

Deno.test('R8 probe 3: a missing required job is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  const info = runInfo();
  info.jobs = info.jobs.filter((job) => job.name !== 'autoflow-ci');
  await assertRejects(
    () => verifyPrCiProvenance(evidence, SHA, queryReturning(info)),
    Error,
    'missing',
  );
});

Deno.test('R8 probe 3: a duplicate job display name is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  const info = runInfo();
  info.jobs.push({ name: 'autoflow-ci', status: 'completed', conclusion: 'success' });
  await assertRejects(
    () => verifyPrCiProvenance(evidence, SHA, queryReturning(info)),
    Error,
    'duplicate',
  );
});

Deno.test('R8 probe 3: a skipped required job is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  const info = runInfo();
  info.jobs[0] = { name: 'dependency-review', status: 'completed', conclusion: 'skipped' };
  await assertRejects(
    () => verifyPrCiProvenance(evidence, SHA, queryReturning(info)),
    Error,
    'skipped',
  );
});

Deno.test('R8 probe 3: a cancelled required job is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  const info = runInfo();
  info.jobs[1] = { name: 'autoflow-ci', status: 'completed', conclusion: 'cancelled' };
  await assertRejects(
    () => verifyPrCiProvenance(evidence, SHA, queryReturning(info)),
    Error,
    'cancelled',
  );
});

Deno.test('R8 probe 3: an unsuccessful required matrix leg is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  const info = runInfo();
  info.jobs[2] = {
    name: 'dist/server Node smoke (Node 20)',
    status: 'completed',
    conclusion: 'failure',
  };
  await assertRejects(
    () => verifyPrCiProvenance(evidence, SHA, queryReturning(info)),
    Error,
    'not successful',
  );
});

Deno.test('R8 probe 3: an unsupported job outside the required set is rejected', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  const info = runInfo();
  info.jobs.push({ name: 'experimental-lint', status: 'completed', conclusion: 'success' });
  await assertRejects(
    () => verifyPrCiProvenance(evidence, SHA, queryReturning(info)),
    Error,
    'unsupported',
  );
});

Deno.test('R8: the record must carry the complete required-job set from trusted context', () => {
  const drop = record();
  drop.jobs = (drop.jobs as unknown[]).slice(1);
  let message = '';
  try {
    parsePrCiEvidence(JSON.stringify(drop), SHA);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assertStringIncludes(message, 'missing');
  const duplicate = record();
  duplicate.jobs = [
    ...(duplicate.jobs as unknown[]),
    { name: 'autoflow-ci', conclusion: 'success' },
  ];
  message = '';
  try {
    parsePrCiEvidence(JSON.stringify(duplicate), SHA);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assertStringIncludes(message, 'duplicate');
  const weakened = record();
  weakened.jobs = [
    { name: 'dependency-review', conclusion: 'skipped' },
    { name: 'autoflow-ci', conclusion: 'success' },
    { name: 'node-serve-smoke', conclusion: 'success' },
  ];
  message = '';
  try {
    parsePrCiEvidence(JSON.stringify(weakened), SHA);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assertStringIncludes(message, 'not successful');
});

Deno.test('R8: a schema-less self-attested record (v1 shape) is rejected as stale schema', () => {
  const legacy = record({ schemaVersion: 1 });
  let message = '';
  try {
    parsePrCiEvidence(JSON.stringify(legacy), SHA);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assertStringIncludes(message, 'schemaVersion');
});

Deno.test('R8: valid evidence with a matching GitHub run verifies end to end', async () => {
  const evidence = parsePrCiEvidence(recordText(), SHA);
  await verifyPrCiProvenance(evidence, SHA, queryReturning(runInfo()));
  assert(evidence.runId === RUN_ID);
});
