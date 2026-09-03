import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { parse } from 'yaml';

const CI_WORKFLOW_PATH = '.github/workflows/autoflow-ci.yml';
const RELEASE_WORKFLOW_PATH = '.github/workflows/autoflow-release.yml';

interface WorkflowJob {
  if?: string;
  needs?: string[];
  steps?: Array<Record<string, unknown>>;
}

function jobsOf(doc: unknown): Record<string, WorkflowJob> {
  return (doc as { jobs: Record<string, WorkflowJob> }).jobs;
}

/**
 * The one trusted expression for checkout and attestation (#1156 R11): the PR
 * head SHA on pull-request events, github.sha on push / workflow_call /
 * workflow_dispatch. checkout's default synthetic merge ref is never tested
 * while the evidence attests the head SHA.
 */
const TRUSTED_REF = '${{ github.event.pull_request.head.sha || github.sha }}';

Deno.test('R7 probe 4: the PR workflow aggregates exact-SHA evidence after the full matrix', async () => {
  const source = await Deno.readTextFile(CI_WORKFLOW_PATH);
  const doc = parse(source);
  const job = jobsOf(doc)['pr-full-ci-evidence'];
  assert(job, 'autoflow-ci.yml lacks the pr-full-ci-evidence aggregation job');
  assertEquals(
    job.if,
    "github.event_name == 'pull_request'",
    'the aggregation job must run only for pull requests',
  );
  assertEquals(
    job.needs,
    ['dependency-review', 'autoflow-ci', 'node-serve-smoke', 'workspace-qualification'],
    'the aggregation job must depend on every required full-matrix job (and therefore run only after successful needs)',
  );
  const steps = job.steps ?? [];
  const upload = steps.find((step) =>
    String(step.uses ?? '').startsWith('actions/upload-artifact@')
  );
  assert(upload, 'the aggregation job must upload the evidence artifact');
  const withBlock = upload.with as Record<string, unknown>;
  assertEquals(
    withBlock.name,
    `pr-full-ci-evidence-${TRUSTED_REF}`,
    'the artifact name must be the deterministic exact-SHA name',
  );
  assertEquals(withBlock['if-no-files-found'], 'error', 'a missing record must fail the job');
  // The record is derived from trusted workflow context, never user inputs.
  assertStringIncludes(source, 'github.event.pull_request.head.sha');
  assertStringIncludes(source, 'github.run_id');
  assertStringIncludes(source, 'github.run_attempt');
  assertStringIncludes(source, 'toJSON(needs)');
  const aggregation = source.slice(source.indexOf('pr-full-ci-evidence:'));
  assert(
    !aggregation.includes('inputs.'),
    'the aggregation job must not consume workflow_dispatch inputs',
  );
});

Deno.test('R11: every repository-dependent required job checks out and attests the same exact SHA', async () => {
  const source = await Deno.readTextFile(CI_WORKFLOW_PATH);
  const doc = parse(source);
  const jobs = jobsOf(doc);
  // dependency-review is not a repository-checkout job and is excluded by the
  // packet; every other required job must check out the attested SHA.
  for (
    const jobId of [
      'autoflow-ci',
      'node-serve-smoke',
      'workspace-qualification',
      'pr-full-ci-evidence',
    ]
  ) {
    const job = jobs[jobId];
    assert(job, `required job ${jobId} is missing`);
    const checkout = (job.steps ?? []).find((step) =>
      String(step.uses ?? '').startsWith('actions/checkout@')
    );
    assert(checkout, `${jobId} must check out the repository with an explicit ref`);
    const withBlock = (checkout.with ?? {}) as Record<string, unknown>;
    assertEquals(
      withBlock.ref,
      TRUSTED_REF,
      `${jobId} must check out the attested exact SHA on every event, not ` +
        "checkout's default synthetic merge ref",
    );
  }
  // The matrix gate job keeps its full-history checkout (fetch-depth is
  // preserved where it was already required).
  const autoflowCheckout = (jobs['autoflow-ci'].steps ?? []).find((step) =>
    String(step.uses ?? '').startsWith('actions/checkout@')
  );
  assertEquals(
    ((autoflowCheckout?.with ?? {}) as Record<string, unknown>)['fetch-depth'],
    0,
    'autoflow-ci must keep fetch-depth: 0',
  );
  // The writer attestation and the artifact name use the identical expression.
  assertStringIncludes(source, `HEAD_SHA: ${TRUSTED_REF}`);
  assertStringIncludes(source, `name: pr-full-ci-evidence-${TRUSTED_REF}`);
  // Push, workflow-call and manual-dispatch support is preserved via the
  // github.sha fallback.
  const on = (doc as { on: Record<string, unknown> }).on;
  for (const event of ['push', 'pull_request', 'workflow_call', 'workflow_dispatch']) {
    assert(event in on, `the workflow must keep supporting ${event}`);
  }
});

Deno.test('R7 probe 5: the publication workflow retrieves the named artifact and wires --pr-ci', async () => {
  const source = await Deno.readTextFile(RELEASE_WORKFLOW_PATH);
  const doc = parse(source);
  const on =
    (doc as { on: { workflow_dispatch: { inputs: Record<string, { required?: boolean }> } } })
      .on;
  const runId = on.workflow_dispatch.inputs.pr_ci_run_id;
  assert(runId, 'autoflow-release.yml lacks the mandatory pr_ci_run_id input');
  assertEquals(runId.required, true, 'the source run identifier must be required');
  // Exactly the named artifact is downloaded from that explicit run.
  assertStringIncludes(source, 'gh run download');
  assertStringIncludes(source, '--name "$PR_CI_ARTIFACT"');
  // The artifact name is derived from the exact HEAD the release publishes.
  assertStringIncludes(source, 'pr-full-ci-evidence-$(git rev-parse HEAD)');
  // The release CLI receives the downloaded record through --pr-ci.
  assertStringIncludes(source, '--pr-ci "$PR_CI_EVIDENCE"');
  // Provenance is verified before publication: the download precedes the publish step.
  assert(
    source.indexOf('gh run download') < source.indexOf('autoflow:publish-existing'),
    'the evidence artifact must be downloaded before publication runs',
  );
});
