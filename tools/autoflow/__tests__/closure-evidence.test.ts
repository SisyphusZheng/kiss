import {
  assert,
  assertEquals,
  assertNotEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import {
  CLOSURE_ROLES,
  CLOSURE_WORKFLOW_EVENT,
  CLOSURE_WORKFLOW_FILE,
  type ClosureExpectation,
  type ClosureRole,
  closureRoleArtifactName,
  loadClosureEvidence,
  parseClosureEvidence,
  RELEASE_REPOSITORY,
  verifyPublishClosureEvidence,
} from '../closure-evidence.ts';
import {
  type ArtifactContentQuery,
  type GitHubRunInfo,
  type GitHubRunQuery,
  PR_CI_ARTIFACT_PREFIX,
  PR_CI_EVIDENCE_JOB_NAME,
  PR_CI_WORKFLOW_FILE,
  REQUIRED_PR_CI_JOBS,
} from '../loop-evidence.ts';
import {
  createPublishExistingPlan,
  executeReleasePlan,
  type ReleaseCommandStep,
  type ReleaseEvidence,
} from '../release.ts';
import { parseArgs } from '../cli.ts';

const VERSION = '9.9.9';
const SHA = 'a'.repeat(40);
const OTHER_SHA = 'b'.repeat(40);
const PR_CI_RUN_ID = 8123456789;
// Each role's GO is proven by its own closure-evidence workflow run, produced
// after the authoritative PR CI run completed — never by an artifact appended
// to the (already completed) PR CI run.
const CLOSURE_RUN_IDS: Record<ClosureRole, number> = {
  implementer: 9000000001,
  'release-verifier': 9000000002,
  thinker: 9000000003,
};

const EXPECTED: ClosureExpectation = {
  version: VERSION,
  repository: RELEASE_REPOSITORY,
  candidateSha: SHA,
};

async function sha256Hex(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function prCiRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 2,
    kind: 'pr-full-ci',
    sha: SHA,
    workflow: PR_CI_WORKFLOW_FILE,
    tier: 'ci',
    conclusion: 'success',
    matrixComplete: true,
    repository: RELEASE_REPOSITORY,
    runId: PR_CI_RUN_ID,
    runAttempt: 1,
    event: 'pull_request',
    artifactName: `${PR_CI_ARTIFACT_PREFIX}${SHA}`,
    jobs: REQUIRED_PR_CI_JOBS.map((name) => ({ name, conclusion: 'success' })),
    ...overrides,
  };
}

/** The GitHub-hosted per-role GO record carried as a closure-run artifact. */
function roleGoRecord(role: ClosureRole, overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    kind: 'closure-role-go',
    role,
    decision: 'GO',
    version: VERSION,
    repository: RELEASE_REPOSITORY,
    sha: SHA,
    runId: CLOSURE_RUN_IDS[role],
    runAttempt: 1,
    ...overrides,
  };
}

interface Fixture {
  text: string;
  artifacts: Map<string, string>;
}

/**
 * Build a valid unanimous closure record plus the per-role artifact contents it
 * pins by digest. Role-record overrides let tests produce content that no
 * longer matches the pinned closure record.
 */
async function buildFixture(options: {
  closureOverrides?: Record<string, unknown>;
  roleOverrides?: Partial<Record<ClosureRole, Record<string, unknown>>>;
} = {}): Promise<Fixture> {
  const artifacts = new Map<string, string>();
  const votes = [];
  for (const role of CLOSURE_ROLES) {
    const content = JSON.stringify(roleGoRecord(role, options.roleOverrides?.[role]));
    const artifactName = closureRoleArtifactName(role, SHA);
    artifacts.set(artifactName, content);
    votes.push({
      role,
      decision: 'GO',
      runId: CLOSURE_RUN_IDS[role],
      runAttempt: 1,
      artifactName,
      digest: await sha256Hex(content),
    });
  }
  const record = {
    schemaVersion: 1,
    kind: 'unanimous-release-closure',
    version: VERSION,
    repository: RELEASE_REPOSITORY,
    candidateSha: SHA,
    prCi: prCiRecord(),
    votes,
    ...options.closureOverrides,
  };
  return { text: JSON.stringify(record), artifacts };
}

/** The authoritative PR CI run (sole complete exact-SHA matrix). */
function prCiRunInfo(overrides: Partial<GitHubRunInfo> = {}): GitHubRunInfo {
  return {
    repository: RELEASE_REPOSITORY,
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
      { name: PR_CI_EVIDENCE_JOB_NAME, status: 'completed', conclusion: 'success' },
    ],
    artifactNames: [`${PR_CI_ARTIFACT_PREFIX}${SHA}`],
    ...overrides,
  };
}

/** A role's closure-evidence workflow run, distinct from the PR CI run. */
function closureRunInfo(role: ClosureRole, overrides: Partial<GitHubRunInfo> = {}): GitHubRunInfo {
  return {
    repository: RELEASE_REPOSITORY,
    workflowPath: `.github/workflows/${CLOSURE_WORKFLOW_FILE}`,
    event: CLOSURE_WORKFLOW_EVENT,
    headSha: SHA,
    status: 'completed',
    conclusion: 'success',
    runAttempt: 1,
    jobs: [{ name: 'record-closure-go', status: 'completed', conclusion: 'success' }],
    artifactNames: [closureRoleArtifactName(role, SHA)],
    ...overrides,
  };
}

function queryRuns(runs: Map<number, GitHubRunInfo>): GitHubRunQuery {
  return (runId) => {
    const info = runs.get(runId);
    if (info === undefined) return Promise.reject(new Error(`HTTP 404: run ${runId} not found`));
    return Promise.resolve(info);
  };
}

function defaultRuns(): Map<number, GitHubRunInfo> {
  const runs = new Map<number, GitHubRunInfo>();
  runs.set(PR_CI_RUN_ID, prCiRunInfo());
  for (const role of CLOSURE_ROLES) runs.set(CLOSURE_RUN_IDS[role], closureRunInfo(role));
  return runs;
}

function queryArtifacts(artifacts: Map<string, string>): ArtifactContentQuery {
  return (_runId, artifactName) => {
    const content = artifacts.get(artifactName);
    if (content === undefined) return Promise.reject(new Error(`artifact ${artifactName} absent`));
    return Promise.resolve(content);
  };
}

async function withClosureFile(
  body: string | undefined,
  fn: (path: string) => Promise<unknown>,
): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'closure-evidence-test-' });
  try {
    const path = `${root}/closure.json`;
    if (body !== undefined) await Deno.writeTextFile(path, body);
    await fn(path);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

// ─── valid evidence ──────────────────────────────────────────────────────────

Deno.test('closure evidence: a unanimous exact-SHA record parses and normalizes', async () => {
  const fixture = await buildFixture();
  const record = parseClosureEvidence(fixture.text, EXPECTED);
  assertEquals(record.schemaVersion, 1);
  assertEquals(record.kind, 'unanimous-release-closure');
  assertEquals(record.version, VERSION);
  assertEquals(record.repository, RELEASE_REPOSITORY);
  assertEquals(record.candidateSha, SHA);
  assertEquals(record.prCi.sha, SHA);
  assertEquals(record.prCi.workflow, PR_CI_WORKFLOW_FILE);
  assertEquals(record.prCi.runId, PR_CI_RUN_ID);
  assertEquals(record.votes.map((vote) => vote.role), [...CLOSURE_ROLES]);
  for (const vote of record.votes) {
    assertEquals(vote.decision, 'GO');
    assertEquals(vote.runId, CLOSURE_RUN_IDS[vote.role]);
    assertEquals(vote.artifactName, closureRoleArtifactName(vote.role, SHA));
    assert(/^[0-9a-f]{64}$/u.test(vote.digest));
  }
});

Deno.test('closure evidence: distinct post-CI closure runs verify end to end', async () => {
  // The role GO runs are separate workflow runs produced after the PR CI run
  // completed; they are never artifacts of the PR CI run itself.
  for (const role of CLOSURE_ROLES) assertNotEquals(CLOSURE_RUN_IDS[role], PR_CI_RUN_ID);
  const fixture = await buildFixture();
  await withClosureFile(fixture.text, async (path) => {
    const verified = await verifyPublishClosureEvidence(VERSION, path, {
      candidateSha: SHA,
      queryRun: queryRuns(defaultRuns()),
      artifactQuery: queryArtifacts(fixture.artifacts),
    });
    assertEquals(verified.prCi.runId, PR_CI_RUN_ID);
  });
});

Deno.test('closure evidence: publish-existing names no record at all and fails closed', async () => {
  await assertRejects(
    () => verifyPublishClosureEvidence(VERSION, undefined, { candidateSha: SHA }),
    Error,
    'requires --closure-evidence',
  );
});

// ─── absent / malformed ─────────────────────────────────────────────────────

Deno.test('closure evidence: an absent record fails closed', async () => {
  await withClosureFile(undefined, async (path) => {
    const error = await assertRejects(() => loadClosureEvidence(path, EXPECTED), Error, 'absent');
    assertStringIncludes(error.message, path);
  });
  await withClosureFile(undefined, (path) =>
    assertRejects(
      () => verifyPublishClosureEvidence(VERSION, path, { candidateSha: SHA }),
      Error,
      'absent',
    ));
});

Deno.test('closure evidence: malformed JSON is rejected', () => {
  assertThrows(() => parseClosureEvidence('{ not json', EXPECTED), Error, 'not readable JSON');
});

Deno.test('closure evidence: a non-object document is rejected', () => {
  assertThrows(() => parseClosureEvidence('null', EXPECTED), Error, 'not a JSON object');
  assertThrows(() => parseClosureEvidence('[]', EXPECTED), Error, 'not a JSON object');
});

Deno.test('closure evidence: an unsupported schema version is rejected', async () => {
  const fixture = await buildFixture({ closureOverrides: { schemaVersion: 2 } });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'schemaVersion');
});

Deno.test('closure evidence: an unsupported kind is rejected', async () => {
  const fixture = await buildFixture({ closureOverrides: { kind: 'pr-full-ci' } });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'kind');
});

// ─── wrong binding ───────────────────────────────────────────────────────────

Deno.test('closure evidence: a record for another version is rejected', async () => {
  const fixture = await buildFixture({ closureOverrides: { version: '9.9.8' } });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'version');
});

Deno.test('closure evidence: a record for another repository is rejected', async () => {
  const fixture = await buildFixture({
    closureOverrides: {
      repository: 'other/fork',
      prCi: prCiRecord({ repository: 'other/fork' }),
    },
  });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'repository');
});

Deno.test('closure evidence: a malformed repository is rejected', async () => {
  const fixture = await buildFixture({ closureOverrides: { repository: 'no-slash' } });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'repository');
});

Deno.test('closure evidence: a record/PR-CI repository split is rejected', async () => {
  const fixture = await buildFixture({
    closureOverrides: { prCi: prCiRecord({ repository: 'other/fork' }) },
  });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'repository');
});

Deno.test('closure evidence: a malformed candidate SHA is rejected', async () => {
  const bad = await buildFixture({ closureOverrides: { candidateSha: 'not-a-sha' } });
  assertThrows(() => parseClosureEvidence(bad.text, EXPECTED), Error, 'candidate SHA');
  const short = await buildFixture({ closureOverrides: { candidateSha: SHA.slice(0, 39) } });
  assertThrows(() => parseClosureEvidence(short.text, EXPECTED), Error, 'candidate SHA');
});

Deno.test('closure evidence: a stale or mismatched candidate SHA is rejected', async () => {
  const fixture = await buildFixture({ closureOverrides: { candidateSha: OTHER_SHA } });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'stale or mismatched');
});

// ─── embedded PR CI evidence defects ─────────────────────────────────────────

Deno.test('closure evidence: a missing embedded PR CI record is rejected', async () => {
  const fixture = await buildFixture({ closureOverrides: { prCi: undefined } });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'PR CI');
});

Deno.test('closure evidence: PR CI from a non-authoritative workflow is rejected', async () => {
  const fixture = await buildFixture({
    closureOverrides: { prCi: prCiRecord({ workflow: 'nightly-stress.yml' }) },
  });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'workflow');
});

Deno.test('closure evidence: a weakened (partial) PR CI matrix is rejected', async () => {
  const fixture = await buildFixture({
    closureOverrides: { prCi: prCiRecord({ matrixComplete: false }) },
  });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'weakened');
});

Deno.test('closure evidence: an unsupported PR CI tier is rejected', async () => {
  const fixture = await buildFixture({
    closureOverrides: { prCi: prCiRecord({ tier: 'push' }) },
  });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'unsupported');
});

Deno.test('closure evidence: embedded PR CI for another SHA is rejected', async () => {
  const fixture = await buildFixture({
    closureOverrides: {
      prCi: prCiRecord({ sha: OTHER_SHA, artifactName: `${PR_CI_ARTIFACT_PREFIX}${OTHER_SHA}` }),
    },
  });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'stale or mismatched');
});

Deno.test('closure evidence: a non-green PR CI result is rejected', async () => {
  const fixture = await buildFixture({
    closureOverrides: { prCi: prCiRecord({ conclusion: 'failure' }) },
  });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'not green');
});

// ─── unanimous vote set ─────────────────────────────────────────────────────

/** Build a fixture, then mutate the parsed record's votes before re-serializing. */
async function fixtureWithVotes(
  mutate: (votes: Array<Record<string, unknown>>) => unknown,
): Promise<string> {
  const fixture = await buildFixture();
  const record = JSON.parse(fixture.text) as Record<string, unknown>;
  record.votes = mutate(record.votes as Array<Record<string, unknown>>);
  return JSON.stringify(record);
}

Deno.test('closure evidence: a missing vote set is rejected', async () => {
  const fixture = await buildFixture({ closureOverrides: { votes: undefined } });
  assertThrows(() => parseClosureEvidence(fixture.text, EXPECTED), Error, 'vote');
});

Deno.test('closure evidence: a NO-GO vote is non-unanimous and rejected', async () => {
  for (const role of CLOSURE_ROLES) {
    const text = await fixtureWithVotes((votes) =>
      votes.map((vote) => vote.role === role ? { ...vote, decision: 'NO-GO' } : vote)
    );
    const error = assertThrows(() => parseClosureEvidence(text, EXPECTED), Error, 'non-unanimous');
    assertStringIncludes(error.message, role);
  }
});

Deno.test('closure evidence: a missing role vote is non-unanimous and rejected', async () => {
  for (const role of CLOSURE_ROLES) {
    const text = await fixtureWithVotes((votes) => votes.filter((vote) => vote.role !== role));
    const error = assertThrows(() => parseClosureEvidence(text, EXPECTED), Error, 'non-unanimous');
    assertStringIncludes(error.message, role);
  }
});

Deno.test('closure evidence: a lowercase or non-GO decision is rejected', async () => {
  const text = await fixtureWithVotes((votes) =>
    votes.map((vote) => vote.role === 'thinker' ? { ...vote, decision: 'go' } : vote)
  );
  assertThrows(() => parseClosureEvidence(text, EXPECTED), Error, 'non-unanimous');
});

Deno.test('closure evidence: a duplicate role vote is rejected', async () => {
  const text = await fixtureWithVotes((votes) => [...votes, { ...votes[2] }]);
  assertThrows(() => parseClosureEvidence(text, EXPECTED), Error, 'duplicate');
});

Deno.test('closure evidence: an unsupported vote role is rejected', async () => {
  const text = await fixtureWithVotes((votes) => [
    ...votes,
    {
      role: 'maintainer',
      decision: 'GO',
      runId: 9000000004,
      runAttempt: 1,
      artifactName: 'x',
      digest: '0'.repeat(64),
    },
  ]);
  assertThrows(() => parseClosureEvidence(text, EXPECTED), Error, 'unsupported');
});

Deno.test('closure evidence: a vote with a malformed run identity is rejected', async () => {
  const badRunId = await fixtureWithVotes((votes) =>
    votes.map((vote) => vote.role === 'implementer' ? { ...vote, runId: -1 } : vote)
  );
  assertThrows(() => parseClosureEvidence(badRunId, EXPECTED), Error, 'runId');
  const badAttempt = await fixtureWithVotes((votes) =>
    votes.map((vote) => vote.role === 'thinker' ? { ...vote, runAttempt: 0 } : vote)
  );
  assertThrows(() => parseClosureEvidence(badAttempt, EXPECTED), Error, 'runAttempt');
});

Deno.test('closure evidence: a vote artifact name not bound to role and SHA is rejected', async () => {
  const renamed = await fixtureWithVotes((votes) =>
    votes.map((vote) =>
      vote.role === 'implementer' ? { ...vote, artifactName: 'some-other-artifact' } : vote
    )
  );
  assertThrows(() => parseClosureEvidence(renamed, EXPECTED), Error, 'artifact identity');
  const wrongSha = await fixtureWithVotes((votes) =>
    votes.map((vote) =>
      vote.role === 'thinker'
        ? { ...vote, artifactName: closureRoleArtifactName('thinker', OTHER_SHA) }
        : vote
    )
  );
  assertThrows(() => parseClosureEvidence(wrongSha, EXPECTED), Error, 'artifact identity');
});

Deno.test('closure evidence: a malformed vote digest is rejected', async () => {
  const text = await fixtureWithVotes((votes) =>
    votes.map((vote) => vote.role === 'implementer' ? { ...vote, digest: 'not-a-digest' } : vote)
  );
  assertThrows(() => parseClosureEvidence(text, EXPECTED), Error, 'digest');
});

// ─── provenance against the resolved GitHub runs ────────────────────────────

async function assertProvenanceRejects(
  mutateRuns: (runs: Map<number, GitHubRunInfo>) => void,
  message: string,
): Promise<void> {
  const fixture = await buildFixture();
  const runs = defaultRuns();
  mutateRuns(runs);
  await withClosureFile(fixture.text, (path) =>
    assertRejects(
      () =>
        verifyPublishClosureEvidence(VERSION, path, {
          candidateSha: SHA,
          queryRun: queryRuns(runs),
          artifactQuery: queryArtifacts(fixture.artifacts),
        }),
      Error,
      message,
    ));
}

Deno.test('closure evidence: an unresolvable PR CI run is rejected', async () => {
  await assertProvenanceRejects((runs) => runs.delete(PR_CI_RUN_ID), 'not resolvable');
});

Deno.test('closure evidence: a PR CI run in another repository is rejected', async () => {
  await assertProvenanceRejects(
    (runs) => runs.set(PR_CI_RUN_ID, prCiRunInfo({ repository: 'other/fork' })),
    'repository',
  );
});

Deno.test('closure evidence: a PR CI run of another workflow is rejected', async () => {
  await assertProvenanceRejects(
    (runs) =>
      runs.set(PR_CI_RUN_ID, prCiRunInfo({ workflowPath: '.github/workflows/nightly.yml' })),
    'workflow',
  );
});

Deno.test('closure evidence: a PR CI run whose head SHA differs is stale and rejected', async () => {
  await assertProvenanceRejects(
    (runs) => runs.set(PR_CI_RUN_ID, prCiRunInfo({ headSha: OTHER_SHA })),
    'stale or mismatched',
  );
});

Deno.test('closure evidence: a PR CI re-run attempt mismatch is rejected', async () => {
  await assertProvenanceRejects(
    (runs) => runs.set(PR_CI_RUN_ID, prCiRunInfo({ runAttempt: 2 })),
    'run attempt',
  );
});

Deno.test('closure evidence: an unresolvable role closure run is rejected', async () => {
  await assertProvenanceRejects(
    (runs) => runs.delete(CLOSURE_RUN_IDS['release-verifier']),
    'not resolvable',
  );
});

Deno.test('closure evidence: a role closure run in another repository is rejected', async () => {
  await assertProvenanceRejects(
    (runs) =>
      runs.set(
        CLOSURE_RUN_IDS.thinker,
        closureRunInfo('thinker', { repository: 'other/fork' }),
      ),
    'repository',
  );
});

Deno.test('closure evidence: a role GO claimed on a non-closure workflow run is rejected', async () => {
  // The vote points at the authoritative PR CI run — whose workflow is not the
  // supported closure workflow — so the claim is rejected even though the run
  // itself is green and the artifact name is present there.
  const fixture = await buildFixture();
  const record = JSON.parse(fixture.text) as Record<string, unknown>;
  const votes = record.votes as Array<Record<string, unknown>>;
  for (const vote of votes) {
    if (vote.role === 'implementer') vote.runId = PR_CI_RUN_ID;
  }
  const runs = defaultRuns();
  runs.set(
    PR_CI_RUN_ID,
    prCiRunInfo({
      artifactNames: [
        `${PR_CI_ARTIFACT_PREFIX}${SHA}`,
        closureRoleArtifactName('implementer', SHA),
      ],
    }),
  );
  await withClosureFile(JSON.stringify(record), (path) =>
    assertRejects(
      () =>
        verifyPublishClosureEvidence(VERSION, path, {
          candidateSha: SHA,
          queryRun: queryRuns(runs),
          artifactQuery: queryArtifacts(fixture.artifacts),
        }),
      Error,
      'workflow',
    ));
});

Deno.test('closure evidence: a role closure run with an unsupported event is rejected', async () => {
  await assertProvenanceRejects(
    (runs) =>
      runs.set(CLOSURE_RUN_IDS.thinker, closureRunInfo('thinker', { event: 'pull_request' })),
    'event',
  );
});

Deno.test('closure evidence: a role closure run whose head SHA differs is rejected', async () => {
  await assertProvenanceRejects(
    (runs) => runs.set(CLOSURE_RUN_IDS.thinker, closureRunInfo('thinker', { headSha: OTHER_SHA })),
    'stale or mismatched',
  );
});

Deno.test('closure evidence: a non-green role closure run is rejected', async () => {
  await assertProvenanceRejects(
    (runs) =>
      runs.set(CLOSURE_RUN_IDS.thinker, closureRunInfo('thinker', { conclusion: 'failure' })),
    'not green',
  );
  await assertProvenanceRejects(
    (runs) =>
      runs.set(CLOSURE_RUN_IDS.thinker, closureRunInfo('thinker', { status: 'in_progress' })),
    'not green',
  );
});

Deno.test('closure evidence: a role closure run attempt mismatch is rejected', async () => {
  await assertProvenanceRejects(
    (runs) => runs.set(CLOSURE_RUN_IDS.thinker, closureRunInfo('thinker', { runAttempt: 2 })),
    'run attempt',
  );
});

// ─── role GO artifact evidence defects ───────────────────────────────────────

Deno.test('closure evidence: a role GO artifact missing from its run is rejected', async () => {
  const fixture = await buildFixture();
  const runs = defaultRuns();
  runs.set(CLOSURE_RUN_IDS.thinker, closureRunInfo('thinker', { artifactNames: [] }));
  await withClosureFile(fixture.text, (path) =>
    assertRejects(
      () =>
        verifyPublishClosureEvidence(VERSION, path, {
          candidateSha: SHA,
          queryRun: queryRuns(runs),
          artifactQuery: queryArtifacts(fixture.artifacts),
        }),
      Error,
      'artifact identity',
    ));
});

Deno.test('closure evidence: a duplicated role GO artifact on its run is rejected', async () => {
  const fixture = await buildFixture();
  const runs = defaultRuns();
  const name = closureRoleArtifactName('thinker', SHA);
  runs.set(CLOSURE_RUN_IDS.thinker, closureRunInfo('thinker', { artifactNames: [name, name] }));
  await withClosureFile(fixture.text, (path) =>
    assertRejects(
      () =>
        verifyPublishClosureEvidence(VERSION, path, {
          candidateSha: SHA,
          queryRun: queryRuns(runs),
          artifactQuery: queryArtifacts(fixture.artifacts),
        }),
      Error,
      'artifact identity',
    ));
});

Deno.test('closure evidence: an unresolvable role GO artifact is rejected', async () => {
  const fixture = await buildFixture();
  await withClosureFile(fixture.text, (path) =>
    assertRejects(
      () =>
        verifyPublishClosureEvidence(VERSION, path, {
          candidateSha: SHA,
          queryRun: queryRuns(defaultRuns()),
          artifactQuery: () => Promise.reject(new Error('download failed')),
        }),
      Error,
      'not resolvable',
    ));
});

Deno.test('closure evidence: role GO content whose digest does not match is rejected', async () => {
  const fixture = await buildFixture();
  // Tamper with the artifact content after the closure record pinned its digest.
  fixture.artifacts.set(
    closureRoleArtifactName('release-verifier', SHA),
    JSON.stringify(roleGoRecord('release-verifier', { note: 'tampered' })),
  );
  await withClosureFile(fixture.text, (path) =>
    assertRejects(
      () =>
        verifyPublishClosureEvidence(VERSION, path, {
          candidateSha: SHA,
          queryRun: queryRuns(defaultRuns()),
          artifactQuery: queryArtifacts(fixture.artifacts),
        }),
      Error,
      'digest',
    ));
});

Deno.test('closure evidence: role GO content claiming another role is rejected', async () => {
  // Content matches its own pinned digest, but the pinned artifact for the
  // implementer carries a thinker record: digest pins bytes, not semantics.
  const content = JSON.stringify(roleGoRecord('thinker'));
  const digest = await sha256Hex(content);
  const text = await fixtureWithVotes((votes) =>
    votes.map((vote) => vote.role === 'implementer' ? { ...vote, digest } : vote)
  );
  const fixture = await buildFixture();
  fixture.artifacts.set(closureRoleArtifactName('implementer', SHA), content);
  await withClosureFile(text, (path) =>
    assertRejects(
      () =>
        verifyPublishClosureEvidence(VERSION, path, {
          candidateSha: SHA,
          queryRun: queryRuns(defaultRuns()),
          artifactQuery: queryArtifacts(fixture.artifacts),
        }),
      Error,
      'role',
    ));
});

Deno.test('closure evidence: role GO content with a non-GO decision is rejected', async () => {
  const content = JSON.stringify(roleGoRecord('thinker', { decision: 'NO-GO' }));
  const digest = await sha256Hex(content);
  const text = await fixtureWithVotes((votes) =>
    votes.map((vote) => vote.role === 'thinker' ? { ...vote, digest } : vote)
  );
  const fixture = await buildFixture();
  fixture.artifacts.set(closureRoleArtifactName('thinker', SHA), content);
  await withClosureFile(text, (path) =>
    assertRejects(
      () =>
        verifyPublishClosureEvidence(VERSION, path, {
          candidateSha: SHA,
          queryRun: queryRuns(defaultRuns()),
          artifactQuery: queryArtifacts(fixture.artifacts),
        }),
      Error,
      'not a GO',
    ));
});

Deno.test('closure evidence: role GO content bound to another SHA or run is rejected', async () => {
  for (
    const overrides of [{ sha: OTHER_SHA }, { runId: CLOSURE_RUN_IDS.implementer + 1 }, {
      runAttempt: 2,
    }]
  ) {
    const content = JSON.stringify(roleGoRecord('implementer', overrides));
    const digest = await sha256Hex(content);
    const text = await fixtureWithVotes((votes) =>
      votes.map((vote) => vote.role === 'implementer' ? { ...vote, digest } : vote)
    );
    const fixture = await buildFixture();
    fixture.artifacts.set(closureRoleArtifactName('implementer', SHA), content);
    await withClosureFile(text, (path) =>
      assertRejects(
        () =>
          verifyPublishClosureEvidence(VERSION, path, {
            candidateSha: SHA,
            queryRun: queryRuns(defaultRuns()),
            artifactQuery: queryArtifacts(fixture.artifacts),
          }),
        Error,
      ));
  }
});

Deno.test('closure evidence: role GO content for another version or repository is rejected', async () => {
  for (const overrides of [{ version: '9.9.8' }, { repository: 'other/fork' }]) {
    const content = JSON.stringify(roleGoRecord('release-verifier', overrides));
    const digest = await sha256Hex(content);
    const text = await fixtureWithVotes((votes) =>
      votes.map((vote) => vote.role === 'release-verifier' ? { ...vote, digest } : vote)
    );
    const fixture = await buildFixture();
    fixture.artifacts.set(closureRoleArtifactName('release-verifier', SHA), content);
    await withClosureFile(text, (path) =>
      assertRejects(
        () =>
          verifyPublishClosureEvidence(VERSION, path, {
            candidateSha: SHA,
            queryRun: queryRuns(defaultRuns()),
            artifactQuery: queryArtifacts(fixture.artifacts),
          }),
        Error,
      ));
  }
});

// ─── publish-existing plan wiring ────────────────────────────────────────────

Deno.test('publish-existing requires unanimous closure evidence before any publish step', () => {
  const originalNpmToken = Deno.env.get('NPM_TOKEN');
  const originalGitHubToken = Deno.env.get('GITHUB_TOKEN');
  Deno.env.set('NPM_TOKEN', 'test-token');
  Deno.env.set('GITHUB_TOKEN', 'test-token');
  try {
    const steps = createPublishExistingPlan(VERSION, 'closure.json');
    const names = steps.map((step) => step.name);
    const closure = names.indexOf('verify unanimous closure evidence');
    assert(closure !== -1, 'publish-existing must verify unanimous closure evidence');
    assertEquals(names[0], 'verify published source version');
    assertEquals(names[1], 'verify main CI success for HEAD');
    assertEquals(names[2], 'verify prepare record');
    assertEquals(names[3], 'verify unanimous closure evidence');
    // Fail-closed ordering: no publish-side step may run before the closure proof.
    assert(closure < names.indexOf('package artifact gate'));
    assert(closure < names.indexOf('publish npm packages'));
    assert(closure < names.indexOf('tag release'));
    // #1187: the authorization gate is re-proven on every attempt, including resumes.
    assertEquals(steps[closure].revalidateOnResume, true);
  } finally {
    if (originalNpmToken === undefined) Deno.env.delete('NPM_TOKEN');
    else Deno.env.set('NPM_TOKEN', originalNpmToken);
    if (originalGitHubToken === undefined) Deno.env.delete('GITHUB_TOKEN');
    else Deno.env.set('GITHUB_TOKEN', originalGitHubToken);
  }
});

Deno.test('cli: publish-existing parses --closure-evidence', () => {
  const options = parseArgs(['publish-existing', '--to', VERSION, '--closure-evidence', 'c.json']);
  assertEquals(options.closureEvidence, 'c.json');
  assertEquals(parseArgs(['publish-existing', '--to', VERSION]).closureEvidence, undefined);
});

// ─── resume revalidation (#1187) ─────────────────────────────────────────────

async function git(cwd: string, args: string[]): Promise<string> {
  const output = await new Deno.Command('git', {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.code !== 0) {
    throw new Error(
      `git ${args.join(' ')} failed (${output.code}): ${new TextDecoder().decode(output.stderr)}`,
    );
  }
  return new TextDecoder().decode(output.stdout).trim();
}

/** A work repo on main with a bare origin, mirroring the publish-existing topology. */
async function initPublishRepo(): Promise<{ root: string; work: string }> {
  const root = await Deno.makeTempDir({ prefix: 'closure-resume-test-' });
  const origin = `${root}/origin.git`;
  const work = `${root}/work`;
  await git(root, ['init', '--bare', origin]);
  await git(root, ['init', '-b', 'main', work]);
  await git(work, ['config', 'user.email', 'release-test@example.com']);
  await git(work, ['config', 'user.name', 'Release Test']);
  await Deno.writeTextFile(`${work}/seed.txt`, 'seed\n');
  await git(work, ['add', 'seed.txt']);
  await git(work, ['commit', '-m', 'seed']);
  await git(work, ['remote', 'add', 'origin', origin]);
  await git(work, ['push', '-u', 'origin', 'main']);
  return { root, work };
}

interface ResumeHarness {
  counts: { closure: number; publish: number };
  plan: ReleaseCommandStep[];
}

/**
 * The publish-existing closure tail wired like createPublishExistingPlan: the
 * revalidate-on-resume closure gate, then a publish step that fails on its
 * first invocation (so a second run is a resume with a passed closure record).
 */
function resumeHarness(fixturePath: string, artifacts: Map<string, string>): ResumeHarness {
  const counts = { closure: 0, publish: 0 };
  const plan: ReleaseCommandStep[] = [
    {
      name: 'verify unanimous closure evidence',
      revalidateOnResume: true,
      run: async () => {
        counts.closure += 1;
        await verifyPublishClosureEvidence(VERSION, fixturePath, {
          candidateSha: SHA,
          queryRun: queryRuns(defaultRuns()),
          artifactQuery: queryArtifacts(artifacts),
        });
      },
    },
    {
      name: 'publish npm packages',
      run: () => {
        counts.publish += 1;
        return counts.publish === 1
          ? Promise.reject(new Error('simulated publish failure'))
          : Promise.resolve();
      },
    },
  ];
  return { counts, plan };
}

/**
 * First attempt: closure passes, publish fails. Resume attempt after `mutate`
 * made the closure evidence invalid: the closure gate must re-run and block
 * before publish is attempted again.
 */
async function assertResumeBlocksBeforePublish(
  mutate: (context: { fixturePath: string; artifacts: Map<string, string> }) => Promise<void>,
  message: string,
): Promise<void> {
  const { root, work } = await initPublishRepo();
  const previousCwd = Deno.cwd();
  try {
    Deno.chdir(work);
    const fixture = await buildFixture();
    const fixturePath = `${root}/closure.json`;
    await Deno.writeTextFile(fixturePath, fixture.text);
    const artifacts = new Map(fixture.artifacts);
    const harness = resumeHarness(fixturePath, artifacts);

    await assertRejects(
      () => executeReleasePlan('publish-existing', VERSION, undefined, false, harness.plan, 'main'),
      Error,
      'simulated publish failure',
    );
    assertEquals(harness.counts, { closure: 1, publish: 1 });

    await mutate({ fixturePath, artifacts });

    const error = await assertRejects(
      () => executeReleasePlan('publish-existing', VERSION, undefined, false, harness.plan, 'main'),
      Error,
    );
    assertStringIncludes(error.message, message);
    // The gate re-ran (revalidateOnResume) and publish was never re-attempted.
    assertEquals(harness.counts.closure, 2);
    assertEquals(harness.counts.publish, 1);
  } finally {
    Deno.chdir(previousCwd);
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('publish-existing resume: missing closure evidence blocks before publish', async () => {
  await assertResumeBlocksBeforePublish(({ fixturePath }) => Deno.remove(fixturePath), 'absent');
});

Deno.test('publish-existing resume: stale closure evidence blocks before publish', async () => {
  await assertResumeBlocksBeforePublish(async ({ fixturePath }) => {
    const stale = await buildFixture({ closureOverrides: { candidateSha: OTHER_SHA } });
    await Deno.writeTextFile(fixturePath, stale.text);
  }, 'stale or mismatched');
});

Deno.test('publish-existing resume: changed role GO content blocks before publish', async () => {
  await assertResumeBlocksBeforePublish(({ artifacts }) => {
    // The pinned digest in the closure record no longer matches the content.
    artifacts.set(
      closureRoleArtifactName('thinker', SHA),
      JSON.stringify(roleGoRecord('thinker', { note: 'changed after GO' })),
    );
    return Promise.resolve();
  }, 'digest');
});

Deno.test('publish-existing resume: unchanged valid evidence revalidates and resumes publish', async () => {
  const { root, work } = await initPublishRepo();
  const previousCwd = Deno.cwd();
  try {
    Deno.chdir(work);
    const fixture = await buildFixture();
    const fixturePath = `${root}/closure.json`;
    await Deno.writeTextFile(fixturePath, fixture.text);
    const harness = resumeHarness(fixturePath, new Map(fixture.artifacts));

    await assertRejects(
      () => executeReleasePlan('publish-existing', VERSION, undefined, false, harness.plan, 'main'),
      Error,
      'simulated publish failure',
    );
    // Resume: the closure gate re-runs (not skipped), passes, and publish retries.
    await executeReleasePlan('publish-existing', VERSION, undefined, false, harness.plan, 'main');
    assertEquals(harness.counts, { closure: 2, publish: 2 });
    const persisted = JSON.parse(
      await Deno.readTextFile(`docs/release/autoflow3/v${VERSION}.json`),
    ) as ReleaseEvidence;
    assertEquals(persisted.status, 'completed');
    assertNotEquals(
      persisted.steps.find((step) => step.name === 'verify unanimous closure evidence'),
      undefined,
    );
  } finally {
    Deno.chdir(previousCwd);
    await Deno.remove(root, { recursive: true });
  }
});
