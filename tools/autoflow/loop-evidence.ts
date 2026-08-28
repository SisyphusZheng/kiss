/**
 * CI evidence-tier contract for the v0.44 three-role loop (#1156, ADR-0146).
 *
 * One exact-SHA full CI matrix exists and it belongs to the pull request
 * (the autoflow `ci` tier). The implementer runs only its packet RED/GREEN
 * commands plus the fast `push` tier; the reviewer independently replays the
 * packet harness only; release closure consumes the exact-SHA PR CI result
 * and adds just the release-only/adversarial/version-exit checks. No role may
 * claim a full-matrix PASS from a different SHA, and absent, stale, failing
 * or mismatched CI evidence fails closed.
 */

import { type AutoFlowTier, type GateDefinition, selectGates } from './policy.ts';

export type LoopRole = 'implementer' | 'reviewer' | 'pull-request' | 'release-closure';

export interface LoopEvidenceContract {
  role: LoopRole;
  /** Whether the role executes the packet-specific RED/GREEN commands. */
  runsPacketCommands: boolean;
  /** AutoFlow tiers the role may run locally. The `ci` tier is never one of them. */
  autoflowTiers: AutoFlowTier[];
  /** Only the pull request owns the exact-SHA full CI matrix. */
  ownsFullCiMatrix: boolean;
  description: string;
}

const CONTRACTS: Record<LoopRole, LoopEvidenceContract> = {
  implementer: {
    role: 'implementer',
    runsPacketCommands: true,
    autoflowTiers: ['push'],
    ownsFullCiMatrix: false,
    description:
      'Runs the packet RED/GREEN commands plus the fast push tier; never runs autoflow:ci.',
  },
  reviewer: {
    role: 'reviewer',
    runsPacketCommands: true,
    autoflowTiers: [],
    ownsFullCiMatrix: false,
    description: 'Independently replays the bounded packet harness only; no shared matrix replay.',
  },
  'pull-request': {
    role: 'pull-request',
    runsPacketCommands: false,
    autoflowTiers: ['ci'],
    ownsFullCiMatrix: true,
    description:
      'The single full-matrix authority; the CI workflow runs the ci tier on the exact PR SHA.',
  },
  'release-closure': {
    role: 'release-closure',
    runsPacketCommands: false,
    autoflowTiers: ['release'],
    ownsFullCiMatrix: false,
    description:
      'Consumes/links the exact-SHA PR CI result and runs only release-only, adversarial, packed-artifact or version-exit checks.',
  },
};

export function loopEvidenceContract(role: LoopRole): LoopEvidenceContract {
  return CONTRACTS[role];
}

export interface ExactShaCiEvidence {
  /** Exact commit SHA the full CI matrix ran against. */
  sha: string;
  /** Workflow conclusion; only `success` is acceptable. */
  conclusion: string;
  /** Optional link to the workflow run for the closure record. */
  url?: string;
}

/**
 * Fail closed unless the PR full-CI evidence names the exact candidate SHA and
 * concluded successfully. Absent, stale, mismatched or failing evidence is a
 * hard error — there is no compatibility path that skips missing CI evidence.
 */
export function assertExactShaPrCi(
  evidence: ExactShaCiEvidence | undefined,
  candidateSha: string,
): asserts evidence is ExactShaCiEvidence {
  if (!evidence) {
    throw new Error(
      'release closure requires the PR full-CI result for the exact candidate SHA; the evidence is absent',
    );
  }
  if (evidence.sha !== candidateSha) {
    throw new Error(
      `PR full-CI evidence is stale or mismatched: evidence SHA ${evidence.sha} != candidate SHA ${candidateSha}`,
    );
  }
  if (evidence.conclusion !== 'success') {
    throw new Error(
      `PR full-CI result for ${candidateSha} is not green (conclusion: ${evidence.conclusion})`,
    );
  }
}

/**
 * Gates that exist only at release closure (never in the ci tier): the
 * release state machine replay, scheduled-evidence freshness, nitro proofs
 * and the publish dry-run. Release closure runs these plus packet-specific
 * adversarial/version-exit checks on top of the consumed PR CI result.
 */
export function releaseOnlyGateNames(): string[] {
  return selectGates('release', [])
    .filter((gate) => !gate.tiers.includes('ci'))
    .map((gate) => gate.name);
}

/** The one workflow authorized to produce full-matrix PR CI evidence. */
export const PR_CI_WORKFLOW_FILE = 'autoflow-ci.yml';

/** Display name of the workflow job that aggregates and uploads the record. */
export const PR_CI_EVIDENCE_JOB_NAME = 'pr-full-ci-evidence';

/** Deterministic artifact name prefix; the full name appends the exact SHA. */
export const PR_CI_ARTIFACT_PREFIX = 'pr-full-ci-evidence-';

/**
 * The workflow job ids that constitute the required full-matrix set. Every one
 * must be present and successful — in the record (from the trusted `needs`
 * context) and in the independently resolved GitHub run.
 */
export const REQUIRED_PR_CI_JOBS = [
  'dependency-review',
  'autoflow-ci',
  'node-serve-smoke',
] as const;

/** Map a GitHub API job display name back to its workflow job id. */
export function jobIdForDisplayName(name: string): string {
  if (name === PR_CI_EVIDENCE_JOB_NAME) return PR_CI_EVIDENCE_JOB_NAME;
  // Matrix legs expand the display name, e.g. "dist/server Node smoke (Node 24)".
  if (name.startsWith('dist/server Node smoke')) return 'node-serve-smoke';
  return name;
}

/**
 * Durable record of the exact-SHA PR full-CI result. The authorized workflow
 * writes it from trusted workflow context (github.* and needs.*, never user
 * inputs); release closure loads it, then independently resolves the named
 * GitHub run before trusting any field.
 */
export interface PrCiEvidenceRecord {
  schemaVersion: 2;
  kind: 'pr-full-ci';
  /** Exact commit SHA the full matrix ran against. */
  sha: string;
  /** Must be PR_CI_WORKFLOW_FILE; any other workflow is rejected. */
  workflow: string;
  /** Must be 'ci'; push/dev tier records are not full-matrix evidence. */
  tier: string;
  conclusion: string;
  /** Must be true; a partial/trigger-scoped matrix is weakened evidence. */
  matrixComplete: boolean;
  /** Repository full name (owner/repo) the run belongs to. */
  repository: string;
  /** GitHub Actions run id that produced this record. */
  runId: number;
  /** Exact run attempt; re-runs do not silently replace evidence. */
  runAttempt: number;
  /** Must be 'pull_request'; the PR is the only full-matrix authority. */
  event: string;
  /** Must be exactly PR_CI_ARTIFACT_PREFIX + sha. */
  artifactName: string;
  /** Required-job conclusions captured from the trusted needs context. */
  jobs: Array<{ name: string; conclusion: string }>;
  url?: string;
}

function requireString(raw: Record<string, unknown>, field: string): string {
  const value = raw[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`PR CI evidence is missing a usable ${field}`);
  }
  return value;
}

function requirePositiveInteger(raw: Record<string, unknown>, field: string): number {
  const value = raw[field];
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`PR CI evidence is missing a usable ${field}`);
  }
  return value;
}

/**
 * Parse and validate a PR CI evidence record for an exact candidate SHA. Every
 * defect — unreadable JSON, stale schema, wrong kind, wrong workflow,
 * unsupported tier, weakened (partial) matrix, stale/mismatched SHA, non-green
 * conclusion, missing run identity, wrong event or artifact name, or an
 * incomplete/unsuccessful required-job set — is a hard error. There is no
 * fallback that accepts absent or degraded evidence.
 */
export function parsePrCiEvidence(text: string, expectedSha: string): PrCiEvidenceRecord {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`PR CI evidence is not readable JSON: ${String(error)}`);
  }
  if (raw.schemaVersion !== 2) throw new Error('PR CI evidence schemaVersion must be 2');
  if (raw.kind !== 'pr-full-ci') {
    throw new Error(`PR CI evidence kind must be pr-full-ci, got ${String(raw.kind)}`);
  }
  if (raw.workflow !== PR_CI_WORKFLOW_FILE) {
    throw new Error(
      `PR CI evidence must come from workflow ${PR_CI_WORKFLOW_FILE}, got ${String(raw.workflow)}`,
    );
  }
  if (raw.tier !== 'ci') {
    throw new Error(`PR CI evidence tier is unsupported: ${String(raw.tier)} (must be ci)`);
  }
  if (raw.matrixComplete !== true) {
    throw new Error('PR CI evidence is weakened: matrixComplete must be true (full matrix)');
  }
  if (raw.sha !== expectedSha) {
    throw new Error(
      `PR CI evidence is stale or mismatched: evidence SHA ${
        String(raw.sha)
      } != candidate SHA ${expectedSha}`,
    );
  }
  if (raw.conclusion !== 'success') {
    throw new Error(
      `PR CI result for ${expectedSha} is not green (conclusion: ${String(raw.conclusion)})`,
    );
  }
  const repository = requireString(raw, 'repository');
  if (!repository.includes('/')) {
    throw new Error(`PR CI evidence repository is malformed: ${repository}`);
  }
  const runId = requirePositiveInteger(raw, 'runId');
  const runAttempt = requirePositiveInteger(raw, 'runAttempt');
  if (raw.event !== 'pull_request') {
    throw new Error(
      `PR CI evidence event must be pull_request, got ${String(raw.event)}`,
    );
  }
  const artifactName = requireString(raw, 'artifactName');
  if (artifactName !== `${PR_CI_ARTIFACT_PREFIX}${expectedSha}`) {
    throw new Error(
      `PR CI evidence artifact identity is wrong: ${artifactName} ` +
        `(must be ${PR_CI_ARTIFACT_PREFIX}${expectedSha})`,
    );
  }
  const jobs = raw.jobs;
  if (!Array.isArray(jobs)) throw new Error('PR CI evidence is missing the required-job set');
  const seen = new Set<string>();
  for (const job of jobs as Array<{ name?: unknown; conclusion?: unknown }>) {
    const name = typeof job?.name === 'string' ? job.name : '';
    if (!(REQUIRED_PR_CI_JOBS as readonly string[]).includes(name)) {
      throw new Error(`PR CI evidence carries an unsupported required-job entry: ${name}`);
    }
    if (seen.has(name)) {
      throw new Error(`PR CI evidence has a duplicate required-job entry: ${name}`);
    }
    seen.add(name);
    if (job.conclusion !== 'success') {
      throw new Error(
        `PR CI evidence required job ${name} is not successful (conclusion: ${
          String(job.conclusion)
        })`,
      );
    }
  }
  for (const required of REQUIRED_PR_CI_JOBS) {
    if (!seen.has(required)) {
      throw new Error(`PR CI evidence is missing required job ${required}`);
    }
  }
  return {
    schemaVersion: 2,
    kind: 'pr-full-ci',
    sha: expectedSha,
    workflow: PR_CI_WORKFLOW_FILE,
    tier: 'ci',
    conclusion: 'success',
    matrixComplete: true,
    repository,
    runId,
    runAttempt,
    event: 'pull_request',
    artifactName,
    jobs: jobs as Array<{ name: string; conclusion: string }>,
    url: typeof raw.url === 'string' ? raw.url : undefined,
  };
}

/** Load the durable PR CI evidence record; a missing file fails closed. */
export async function loadPrCiEvidence(
  path: string,
  expectedSha: string,
): Promise<PrCiEvidenceRecord> {
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch {
    throw new Error(`PR CI evidence is absent at ${path}; release closure fails closed`);
  }
  return parsePrCiEvidence(text, expectedSha);
}

/** One job of a resolved GitHub Actions run, as reported by the API. */
export interface GitHubRunJob {
  name: string;
  status: string;
  conclusion: string | null;
}

/** Trusted run facts resolved independently through the GitHub API. */
export interface GitHubRunInfo {
  repository: string;
  workflowPath: string;
  event: string;
  headSha: string;
  status: string;
  conclusion: string | null;
  runAttempt: number;
  jobs: GitHubRunJob[];
  artifactNames: string[];
}

/**
 * Injectable seam for resolving a workflow run through the GitHub API. Tests
 * inject deterministic answers; production uses the gh CLI transport in
 * pr-ci-github.ts. No test may depend on network or credentials.
 */
export type GitHubRunQuery = (runId: number) => Promise<GitHubRunInfo>;

/**
 * Injectable seam for fetching the content of one named artifact of a workflow
 * run (closure role GO evidence, #1187). Throws when the artifact cannot be
 * resolved; the consumer fails closed. Production uses the gh CLI transport.
 */
export type ArtifactContentQuery = (runId: number, artifactName: string) => Promise<string>;

/**
 * Independently verify the record against the resolved GitHub run (#1156 R8).
 * Repository, workflow path, pull-request event, exact head SHA, completed /
 * success state, run attempt, artifact identity and the complete required-job
 * set must all match; unresolvable, unsupported, duplicate, skipped, cancelled
 * or unsuccessful jobs fail closed. Returns the resolved run so consumers
 * (#1187 closure evidence) can bind further evidence to its artifact list.
 */
export async function verifyPrCiProvenance(
  evidence: PrCiEvidenceRecord,
  candidateSha: string,
  queryRun: GitHubRunQuery,
): Promise<GitHubRunInfo> {
  let run: GitHubRunInfo;
  try {
    run = await queryRun(evidence.runId);
  } catch (error) {
    throw new Error(
      `PR CI evidence run ${evidence.runId} is not resolvable through the GitHub API: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (run.repository !== evidence.repository) {
    throw new Error(
      `PR CI evidence repository mismatch: run belongs to ${run.repository}, ` +
        `record claims ${evidence.repository}`,
    );
  }
  if (run.workflowPath !== `.github/workflows/${PR_CI_WORKFLOW_FILE}`) {
    throw new Error(
      `PR CI evidence workflow mismatch: run used ${run.workflowPath}`,
    );
  }
  if (run.event !== 'pull_request') {
    throw new Error(`PR CI evidence event mismatch: run event is ${run.event}`);
  }
  if (run.headSha !== evidence.sha || evidence.sha !== candidateSha) {
    throw new Error(
      `PR CI evidence is stale or mismatched: run head SHA ${run.headSha} != candidate SHA ${candidateSha}`,
    );
  }
  if (run.status !== 'completed' || run.conclusion !== 'success') {
    throw new Error(
      `PR CI run ${evidence.runId} is not green (status: ${run.status}, conclusion: ${
        String(run.conclusion)
      })`,
    );
  }
  if (run.runAttempt !== evidence.runAttempt) {
    throw new Error(
      `PR CI evidence run attempt mismatch: record ${evidence.runAttempt} != run ${run.runAttempt}`,
    );
  }
  const artifactHits = run.artifactNames.filter((name) => name === evidence.artifactName);
  if (artifactHits.length !== 1) {
    throw new Error(
      `PR CI evidence artifact identity check failed: expected exactly one artifact named ` +
        `${evidence.artifactName} on run ${evidence.runId}, found ${artifactHits.length}`,
    );
  }
  const displayNames = run.jobs.map((job) => job.name);
  const duplicate = displayNames.find((name, index) => displayNames.indexOf(name) !== index);
  if (duplicate !== undefined) {
    throw new Error(`PR CI run ${evidence.runId} has a duplicate job display name: ${duplicate}`);
  }
  for (const job of run.jobs) {
    const id = jobIdForDisplayName(job.name);
    if (id === PR_CI_EVIDENCE_JOB_NAME) continue;
    if (!(REQUIRED_PR_CI_JOBS as readonly string[]).includes(id)) {
      throw new Error(
        `PR CI run ${evidence.runId} carries an unsupported job outside the required set: ${job.name}`,
      );
    }
    if (job.status !== 'completed' || job.conclusion !== 'success') {
      const verdict = job.conclusion ?? `uncompleted ${job.status}`;
      throw new Error(
        `PR CI run ${evidence.runId} required job ${job.name} is not successful (${verdict})`,
      );
    }
  }
  for (const required of REQUIRED_PR_CI_JOBS) {
    const present = run.jobs.some((job) => jobIdForDisplayName(job.name) === required);
    if (!present) {
      throw new Error(`PR CI run ${evidence.runId} is missing required job ${required}`);
    }
  }
  return run;
}

/**
 * Release-closure gate selection given validated exact-SHA PR CI evidence: the
 * full ci-tier matrix is already proven for this SHA, so only complementary
 * gates run — every release-only gate is preserved and no ci-tier gate is
 * replayed. Callers must pass a record from parsePrCiEvidence/loadPrCiEvidence.
 */
export function selectComplementaryReleaseGates(
  evidence: PrCiEvidenceRecord,
  changedPaths: string[],
): GateDefinition[] {
  if (!evidence.matrixComplete || evidence.tier !== 'ci') {
    throw new Error(
      'selectComplementaryReleaseGates requires validated full-matrix PR CI evidence',
    );
  }
  return selectGates('release', changedPaths).filter((gate) => !gate.tiers.includes('ci'));
}
