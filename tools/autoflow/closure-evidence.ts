/**
 * Unanimous closure evidence for publish-existing (#1187).
 *
 * publish-existing may publish only a candidate the three loop roles
 * unanimously closed on. Trust model: the closure record is operator-supplied
 * (passed via --closure-evidence) and is NEVER committed into the candidate
 * tree — a record carrying GO votes for candidate SHA S cannot live inside S
 * without changing S. Its authority comes entirely from GitHub-hosted
 * exact-SHA evidence:
 *
 * - the embedded schema-2 PR full-CI record names the authoritative workflow
 *   run, which is independently resolved through the GitHub API before any
 *   field is trusted (loop-evidence.ts verifyPrCiProvenance);
 * - each role vote (implementer, release-verifier, thinker) references a
 *   SEPARATE closure-evidence workflow run produced after the PR CI run
 *   completed — GitHub Actions artifacts cannot be appended to a completed
 *   run, so role GO evidence never rides the PR CI run. Each closure run is
 *   independently resolved and must match repository, the supported closure
 *   workflow path, the supported event, the exact candidate SHA, a completed /
 *   successful state and the recorded run attempt; each vote names exactly one
 *   artifact on its run — `closure-go-<role>-<sha>` — and pins the SHA-256
 *   digest of its content; the content is fetched through the artifact seam
 *   and must re-prove role, GO decision, version, repository, exact candidate
 *   SHA and run identity.
 *
 * A bare role/GO string authored by a contributor proves nothing: without the
 * matching GitHub-hosted artifact content and digest, verification fails.
 * Every defect class fails closed: absent, malformed, unsupported schema or
 * kind, wrong version, wrong or split repository, malformed/stale/mismatched
 * candidate SHA, wrong workflow, weakened (partial) matrix, non-green result,
 * non-unanimous or duplicate or unsupported votes, wrong artifact identity,
 * unresolvable artifacts, digest/content mismatch, and any run that cannot be
 * resolved and matched through the GitHub API. There is no fallback that
 * accepts absent or degraded closure evidence.
 */

import {
  type ArtifactContentQuery,
  type GitHubRunInfo,
  type GitHubRunQuery,
  parsePrCiEvidence,
  type PrCiEvidenceRecord,
  verifyPrCiProvenance,
} from './loop-evidence.ts';
import { createGhCliArtifactQuery, createGhCliRunQuery } from './pr-ci-github.ts';
import { runCaptured } from '../lib/process.ts';
import { releaseTag } from './version-anchors.ts';

/** The only repository authorized to carry release closure evidence. */
export const RELEASE_REPOSITORY = 'open-element/openelement';

/** The roles whose explicit GO the closure record must carry, without extras. */
export const CLOSURE_ROLES = ['implementer', 'release-verifier', 'thinker'] as const;
export type ClosureRole = (typeof CLOSURE_ROLES)[number];

/**
 * The only workflow authorized to produce role GO closure evidence, and the
 * only event it may run on. The workflow itself is wired by a later #1187
 * packet; the consumer contract is fixed here so any other workflow or event
 * fails closed.
 */
export const CLOSURE_WORKFLOW_FILE = 'closure-evidence.yml';
export const CLOSURE_WORKFLOW_EVENT = 'workflow_dispatch';

/** Deterministic artifact name prefix for per-role GO records on a closure run. */
export const CLOSURE_ROLE_ARTIFACT_PREFIX = 'closure-go-';

/** Artifact name binding a role's GO record to the exact candidate SHA. */
export function closureRoleArtifactName(role: ClosureRole, candidateSha: string): string {
  return `${CLOSURE_ROLE_ARTIFACT_PREFIX}${role}-${candidateSha}`;
}

/**
 * One role's vote inside the closure record. The vote is only a pointer: the
 * authoritative statement is the GitHub-hosted artifact content it names and
 * pins by SHA-256 digest, hosted on the vote's own closure-evidence run
 * (produced after the authoritative PR CI run completed).
 */
export interface ClosureVote {
  role: ClosureRole;
  decision: 'GO';
  /** The role's closure-evidence workflow run (distinct from the PR CI run). */
  runId: number;
  runAttempt: number;
  /** Must be closureRoleArtifactName(role, candidateSha). */
  artifactName: string;
  /** Lowercase hex SHA-256 of the artifact's content. */
  digest: string;
}

/**
 * The GitHub-hosted per-role GO record (artifact content). Produced by the
 * closure evidence pipeline; consumed here only after its digest matches the
 * vote that pinned it.
 */
export interface ClosureRoleGoRecord {
  schemaVersion: 1;
  kind: 'closure-role-go';
  role: ClosureRole;
  decision: 'GO';
  version: string;
  repository: string;
  /** Exact candidate SHA this GO applies to. */
  sha: string;
  /** The role's closure-evidence run this GO was produced by. */
  runId: number;
  runAttempt: number;
}

/**
 * Validated unanimous closure record. `prCi` is the schema-2 exact-SHA PR
 * full-CI record (already passed through parsePrCiEvidence for the candidate
 * SHA); `votes` carries exactly one GO per closure role, each bound to a
 * digest-pinned artifact on its own closure-evidence run.
 */
export interface UnanimousClosureRecord {
  schemaVersion: 1;
  kind: 'unanimous-release-closure';
  version: string;
  repository: string;
  candidateSha: string;
  prCi: PrCiEvidenceRecord;
  votes: ClosureVote[];
}

/** The exact binding the closure evidence must prove. */
export interface ClosureExpectation {
  version: string;
  repository: string;
  candidateSha: string;
}

function requireClosureString(raw: Record<string, unknown>, field: string): string {
  const value = raw[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Unanimous closure evidence is missing a usable ${field}`);
  }
  return value;
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Parse and validate a unanimous closure record against the exact expectation.
 * Every rejection is a hard error; there is no compatibility path for absent,
 * stale, weakened or non-unanimous evidence.
 */
export function parseClosureEvidence(
  text: string,
  expected: ClosureExpectation,
): UnanimousClosureRecord {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new Error(`Unanimous closure evidence is not readable JSON: ${String(error)}`);
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Unanimous closure evidence is not a JSON object');
  }
  const record = raw as Record<string, unknown>;

  if (record.schemaVersion !== 1) {
    throw new Error(
      `Unanimous closure evidence schemaVersion must be 1 (unsupported schema: ${
        String(record.schemaVersion)
      })`,
    );
  }
  if (record.kind !== 'unanimous-release-closure') {
    throw new Error(
      `Unanimous closure evidence kind must be unanimous-release-closure, got ${
        String(record.kind)
      }`,
    );
  }

  const version = requireClosureString(record, 'version');
  if (version !== expected.version) {
    throw new Error(
      `Unanimous closure evidence is for version ${version}, not the publish target ` +
        expected.version,
    );
  }

  const repository = requireClosureString(record, 'repository');
  if (!repository.includes('/')) {
    throw new Error(`Unanimous closure evidence repository is malformed: ${repository}`);
  }
  if (repository !== expected.repository) {
    throw new Error(
      `Unanimous closure evidence repository mismatch: record claims ${repository}, ` +
        `expected ${expected.repository}`,
    );
  }

  const candidateSha = requireClosureString(record, 'candidateSha');
  if (!/^[0-9a-f]{40}$/i.test(candidateSha)) {
    throw new Error(`Unanimous closure evidence candidate SHA is malformed: ${candidateSha}`);
  }
  const normalizedSha = candidateSha.toLowerCase();
  const expectedSha = expected.candidateSha.toLowerCase();
  if (normalizedSha !== expectedSha) {
    throw new Error(
      `Unanimous closure evidence is stale or mismatched: evidence SHA ${normalizedSha} != ` +
        `candidate SHA ${expectedSha}`,
    );
  }

  const prCiRaw = record.prCi;
  if (prCiRaw === null || typeof prCiRaw !== 'object' || Array.isArray(prCiRaw)) {
    throw new Error('Unanimous closure evidence is missing the embedded PR CI record');
  }
  let prCi: PrCiEvidenceRecord;
  try {
    prCi = parsePrCiEvidence(JSON.stringify(prCiRaw), normalizedSha);
  } catch (error) {
    throw new Error(
      `Unanimous closure evidence PR CI record is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (prCi.repository !== repository) {
    throw new Error(
      `Unanimous closure evidence repository mismatch: record claims ${repository} but the ` +
        `embedded PR CI evidence claims ${prCi.repository}`,
    );
  }

  const votes = record.votes;
  if (!Array.isArray(votes)) {
    throw new Error('Unanimous closure evidence is missing the unanimous vote set');
  }
  const seen = new Set<string>();
  const normalizedVotes: ClosureVote[] = [];
  for (const vote of votes as Array<Record<string, unknown>>) {
    const role = typeof vote?.role === 'string' ? vote.role : '';
    if (!(CLOSURE_ROLES as readonly string[]).includes(role)) {
      throw new Error(`Unanimous closure evidence carries an unsupported vote role: ${role}`);
    }
    if (seen.has(role)) {
      throw new Error(`Unanimous closure evidence has a duplicate vote role: ${role}`);
    }
    seen.add(role);
    if (vote?.decision !== 'GO') {
      throw new Error(
        `Unanimous closure evidence is non-unanimous: ${role} decision is ${
          String(vote?.decision)
        } (must be GO)`,
      );
    }
    const runId = vote?.runId;
    if (typeof runId !== 'number' || !Number.isInteger(runId) || runId <= 0) {
      throw new Error(
        `Unanimous closure evidence vote for ${role} is missing a usable runId`,
      );
    }
    const runAttempt = vote?.runAttempt;
    if (typeof runAttempt !== 'number' || !Number.isInteger(runAttempt) || runAttempt <= 0) {
      throw new Error(
        `Unanimous closure evidence vote for ${role} is missing a usable runAttempt`,
      );
    }
    const artifactName = requireClosureString(
      vote,
      'artifactName',
    );
    const expectedArtifact = closureRoleArtifactName(role as ClosureRole, normalizedSha);
    if (artifactName !== expectedArtifact) {
      throw new Error(
        `Unanimous closure evidence artifact identity is wrong for ${role}: ${artifactName} ` +
          `(must be ${expectedArtifact})`,
      );
    }
    const digest = requireClosureString(vote, 'digest');
    if (!/^[0-9a-f]{64}$/.test(digest)) {
      throw new Error(
        `Unanimous closure evidence digest for ${role} is malformed: ${digest}`,
      );
    }
    normalizedVotes.push({
      role: role as ClosureRole,
      decision: 'GO',
      runId,
      runAttempt,
      artifactName,
      digest,
    });
  }
  for (const role of CLOSURE_ROLES) {
    if (!seen.has(role)) {
      throw new Error(
        `Unanimous closure evidence is non-unanimous: missing GO from ${role}`,
      );
    }
  }

  return {
    schemaVersion: 1,
    kind: 'unanimous-release-closure',
    version,
    repository,
    candidateSha: normalizedSha,
    prCi,
    votes: normalizedVotes,
  };
}

/** Load the operator-supplied closure record; a missing file fails closed. */
export async function loadClosureEvidence(
  path: string,
  expected: ClosureExpectation,
): Promise<UnanimousClosureRecord> {
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch {
    throw new Error(
      `Unanimous closure evidence is absent at ${path}; publish-existing fails closed`,
    );
  }
  return parseClosureEvidence(text, expected);
}

/**
 * Resolve a role's closure-evidence run through the GitHub API and enforce the
 * strict closure workflow contract: exact repository, the supported closure
 * workflow path, the supported event, the exact candidate SHA, a completed /
 * successful state and the recorded run attempt. A role GO claimed on any
 * other run — including the authoritative PR CI run, whose workflow is not the
 * closure workflow — fails closed.
 */
async function resolveClosureRun(
  vote: ClosureVote,
  record: UnanimousClosureRecord,
  queryRun: GitHubRunQuery,
): Promise<GitHubRunInfo> {
  const label = `closure GO evidence for ${vote.role}`;
  let run: GitHubRunInfo;
  try {
    run = await queryRun(vote.runId);
  } catch (error) {
    throw new Error(
      `Unanimous ${label} run ${vote.runId} is not resolvable through the GitHub API: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (run.repository !== record.repository) {
    throw new Error(
      `Unanimous ${label} repository mismatch: run belongs to ${run.repository}, ` +
        `record claims ${record.repository}`,
    );
  }
  if (run.workflowPath !== `.github/workflows/${CLOSURE_WORKFLOW_FILE}`) {
    throw new Error(
      `Unanimous ${label} workflow mismatch: run ${vote.runId} used ${run.workflowPath} ` +
        `(must be .github/workflows/${CLOSURE_WORKFLOW_FILE})`,
    );
  }
  if (run.event !== CLOSURE_WORKFLOW_EVENT) {
    throw new Error(
      `Unanimous ${label} event mismatch: run event is ${run.event} ` +
        `(must be ${CLOSURE_WORKFLOW_EVENT})`,
    );
  }
  if (run.headSha !== record.candidateSha) {
    throw new Error(
      `Unanimous ${label} is stale or mismatched: run head SHA ${run.headSha} != ` +
        `candidate SHA ${record.candidateSha}`,
    );
  }
  if (run.status !== 'completed' || run.conclusion !== 'success') {
    throw new Error(
      `Unanimous ${label} run ${vote.runId} is not green (status: ${run.status}, ` +
        `conclusion: ${String(run.conclusion)})`,
    );
  }
  if (run.runAttempt !== vote.runAttempt) {
    throw new Error(
      `Unanimous ${label} run attempt mismatch: record ${vote.runAttempt} != ` +
        `run ${run.runAttempt}`,
    );
  }
  return run;
}

/**
 * Verify one role's GO against the GitHub-hosted artifact the vote pins. The
 * artifact must appear exactly once on the role's provenance-verified closure
 * run, its content must match the pinned digest, and the content must re-prove
 * the role, the GO decision, the target version, the repository, the exact
 * candidate SHA and the closure run identity.
 */
async function verifyRoleGoEvidence(
  vote: ClosureVote,
  record: UnanimousClosureRecord,
  run: GitHubRunInfo,
  artifactQuery: ArtifactContentQuery,
): Promise<void> {
  const label = `closure GO evidence for ${vote.role}`;
  const hits = run.artifactNames.filter((name) => name === vote.artifactName);
  if (hits.length !== 1) {
    throw new Error(
      `Unanimous ${label} artifact identity check failed: expected exactly one artifact ` +
        `named ${vote.artifactName} on run ${vote.runId}, found ${hits.length}`,
    );
  }
  let content: string;
  try {
    content = await artifactQuery(vote.runId, vote.artifactName);
  } catch (error) {
    throw new Error(
      `Unanimous ${label} is not resolvable from run ${vote.runId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const digest = await sha256Hex(content);
  if (digest !== vote.digest) {
    throw new Error(
      `Unanimous ${label} digest mismatch: pinned ${vote.digest}, content hashes to ${digest}`,
    );
  }
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch (error) {
    throw new Error(`Unanimous ${label} is not readable JSON: ${String(error)}`);
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Unanimous ${label} is not a JSON object`);
  }
  const go = raw as Record<string, unknown>;
  if (go.schemaVersion !== 1) {
    throw new Error(`Unanimous ${label} schemaVersion must be 1, got ${String(go.schemaVersion)}`);
  }
  if (go.kind !== 'closure-role-go') {
    throw new Error(`Unanimous ${label} kind must be closure-role-go, got ${String(go.kind)}`);
  }
  if (go.role !== vote.role) {
    throw new Error(
      `Unanimous ${label} role mismatch: artifact ${vote.artifactName} claims role ${
        String(go.role)
      }`,
    );
  }
  if (go.decision !== 'GO') {
    throw new Error(
      `Unanimous closure evidence is non-unanimous: ${vote.role} artifact is not a GO ` +
        `(decision: ${String(go.decision)})`,
    );
  }
  if (go.version !== record.version) {
    throw new Error(
      `Unanimous ${label} is for version ${String(go.version)}, not ${record.version}`,
    );
  }
  if (go.repository !== record.repository) {
    throw new Error(
      `Unanimous ${label} repository mismatch: content claims ${String(go.repository)}`,
    );
  }
  if (go.sha !== record.candidateSha) {
    throw new Error(
      `Unanimous ${label} is stale or mismatched: content SHA ${String(go.sha)} != ` +
        `candidate SHA ${record.candidateSha}`,
    );
  }
  if (go.runId !== vote.runId || go.runAttempt !== vote.runAttempt) {
    throw new Error(
      `Unanimous ${label} run identity mismatch: content claims run ${String(go.runId)} ` +
        `attempt ${String(go.runAttempt)}, expected run ${vote.runId} attempt ` +
        vote.runAttempt,
    );
  }
}

/** Injectable seams; production defaults resolve git, GitHub and artifacts. */
export interface PublishClosureOptions {
  /** Exact candidate SHA; defaults to `git rev-parse HEAD`. */
  candidateSha?: string;
  /** Run resolver; defaults to the gh CLI transport (pr-ci-github.ts). */
  queryRun?: GitHubRunQuery;
  /** Artifact content resolver; defaults to the gh CLI transport. */
  artifactQuery?: ArtifactContentQuery;
}

/**
 * The publish-existing closure gate (#1187): load the operator-supplied
 * unanimous closure record for the target version bound to the exact candidate
 * SHA and the authorized repository, independently resolve the recorded PR CI
 * run through the GitHub API (the sole complete exact-SHA matrix), then
 * resolve each role's own closure-evidence run and authenticate its
 * digest-pinned GO artifact. Fails closed on every defect class.
 */
export async function verifyPublishClosureEvidence(
  targetVersion: string,
  closurePath: string | undefined,
  options: PublishClosureOptions = {},
): Promise<UnanimousClosureRecord> {
  if (!closurePath) {
    throw new Error(
      'publish-existing requires --closure-evidence <path> naming the unanimous closure ' +
        'record; absent evidence fails closed',
    );
  }
  const candidateSha = options.candidateSha ??
    (await runCaptured(['git', 'rev-parse', 'HEAD'])).trim();
  const record = await loadClosureEvidence(closurePath, {
    version: targetVersion,
    repository: RELEASE_REPOSITORY,
    candidateSha,
  });
  const queryRun = options.queryRun ?? await createGhCliRunQuery(record.prCi.runAttempt);
  await verifyPrCiProvenance(record.prCi, record.candidateSha, queryRun);
  const artifactQuery = options.artifactQuery ?? createGhCliArtifactQuery();
  for (const vote of record.votes) {
    const closureRun = await resolveClosureRun(vote, record, queryRun);
    await verifyRoleGoEvidence(vote, record, closureRun, artifactQuery);
  }
  console.log(
    `Verified unanimous closure evidence for ${releaseTag(targetVersion)}: ` +
      `${CLOSURE_ROLES.join('/')} GO on ${record.candidateSha} ` +
      `(PR CI run ${record.prCi.runId} attempt ${record.prCi.runAttempt}).`,
  );
  return record;
}
