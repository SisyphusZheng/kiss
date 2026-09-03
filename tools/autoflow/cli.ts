import {
  AUTOFLOW3_POLICY_VERSION,
  type AutoFlowTier,
  evaluatePatchEligibility,
  evaluateVersionAuthority,
  type GateDefinition,
  selectGates,
} from './policy.ts';
import {
  type GitHubRunQuery,
  loadPrCiEvidence,
  selectComplementaryReleaseGates,
  verifyPrCiProvenance,
} from './loop-evidence.ts';
import { createGhCliRunQuery } from './pr-ci-github.ts';
import {
  backfillPrepareRecordFromMain,
  createPreparePlan,
  createPublishExistingPlan,
  executeReleasePlan,
  readReleaseEvidenceForVersion,
  releaseTag,
  resolvePatchTargetVersion,
} from './release.ts';
import { PACKAGE_VERSION } from '../project-constants.ts';
import { normalizeReleaseVersion as normalizeLineVersion } from '../lib/version.ts';
import { acquireReleaseLock, RELEASE_LOCK_PATH, releaseLockSync } from './release-lock.ts';
import { runWithOutput } from '../lib/process.ts';

interface CliOptions {
  command: string;
  dryRun: boolean;
  approvedPlan?: string;
  targetVersion?: string;
  prCiEvidence?: string;
}

interface GateResult {
  name: string;
  passed: boolean;
  output: string;
}

export function normalizeReleaseVersion(version: string | undefined): string | undefined {
  if (!version) return undefined;
  // Canonical prerelease/version truth: tools/lib/version.ts (#1231 M16).
  return normalizeLineVersion(version);
}

export function parseArgs(args: string[]): CliOptions {
  const command = args[0] ?? 'dev';
  const dryRun = args.includes('--dry-run');
  const approvalIndex = args.indexOf('--approved-plan');
  const approvedPlan = approvalIndex === -1 ? undefined : args[approvalIndex + 1];
  const targetIndex = args.indexOf('--to');
  const targetVersion = targetIndex === -1
    ? undefined
    : normalizeReleaseVersion(args[targetIndex + 1]);
  const prCiIndex = args.indexOf('--pr-ci');
  const prCiEvidence = prCiIndex === -1 ? undefined : args[prCiIndex + 1];
  return { command, dryRun, approvedPlan, targetVersion, prCiEvidence };
}

type GitOutput = (args: string[]) => Promise<string | undefined>;

async function gitOutput(args: string[]): Promise<string | undefined> {
  const output = await runWithOutput('git', args);
  if (output.code !== 0) return undefined;
  return output.stdout;
}

export function addPaths(paths: Set<string>, output: string | undefined): void {
  for (const path of output?.split(/\r?\n/) ?? []) {
    if (path) paths.add(path);
  }
}

export async function gitChangedPaths(
  tier: AutoFlowTier,
  output: GitOutput = gitOutput,
): Promise<string[]> {
  const paths = new Set<string>();

  if (tier === 'dev') {
    const changed = await output(['diff', '--cached', '--name-only']);
    if (changed === undefined) throw new Error('Unable to determine changed paths for dev tier');
    addPaths(paths, changed);
    return [...paths].sort();
  }

  if (tier === 'ci') {
    const parentDiff = await output(['diff', '--name-only', 'HEAD^', 'HEAD']);
    if (parentDiff !== undefined) {
      addPaths(paths, parentDiff);
      return [...paths].sort();
    }
    const treeDiff = await output([
      'diff-tree',
      '--root',
      '--no-commit-id',
      '--name-only',
      '-r',
      'HEAD',
    ]);
    if (treeDiff === undefined) throw new Error('Unable to determine changed paths for ci tier');
    console.warn('HEAD^ is unavailable; using diff-tree --root for changed-path evidence.');
    addPaths(paths, treeDiff);
    return [...paths].sort();
  }

  const upstream = await output(['diff', '--name-only', '@{u}...HEAD']);
  const cached = await output(['diff', '--cached', '--name-only']);
  const working = await output(['diff', '--name-only']);
  const untracked = await output(['ls-files', '--others', '--exclude-standard']);
  if ([upstream, cached, working, untracked].every((value) => value === undefined)) {
    throw new Error(`Unable to determine changed paths for ${tier} tier`);
  }
  addPaths(paths, upstream);
  addPaths(paths, cached);
  addPaths(paths, working);
  addPaths(paths, untracked);

  return [...paths].sort();
}

async function runGate(gate: GateDefinition, dryRun: boolean): Promise<GateResult> {
  if (dryRun) {
    return { name: gate.name, passed: true, output: `[dry-run] ${gate.command.join(' ')}` };
  }

  const output = await runWithOutput(gate.command[0], gate.command.slice(1));
  const text = `${output.stdout}${output.stderr}`.trim();
  return { name: gate.name, passed: output.code === 0, output: text };
}

async function runGateList(
  tier: AutoFlowTier,
  gates: GateDefinition[],
  changedPaths: string[],
  dryRun: boolean,
): Promise<void> {
  console.log(`AutoFlow3 ${tier} (${AUTOFLOW3_POLICY_VERSION})`);
  console.log(`Changed paths: ${changedPaths.length}`);
  for (const path of changedPaths) console.log(`- ${path}`);
  console.log(`Selected gates: ${gates.map((gate) => gate.name).join(', ') || 'none'}`);

  const results: GateResult[] = [];
  for (const gate of gates) {
    const result = await runGate(gate, dryRun);
    results.push(result);
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${gate.name}`);
    if (!result.passed && result.output) {
      console.log(result.output);
    }
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    console.error(`AutoFlow3 ${tier} failed: ${failed.map((result) => result.name).join(', ')}`);
    Deno.exit(1);
  }
}

async function runTier(tier: AutoFlowTier, dryRun: boolean): Promise<void> {
  const changedPaths = await gitChangedPaths(tier);
  await runGateList(tier, selectGates(tier, changedPaths), changedPaths, dryRun);
}

/**
 * Release-closure gate resolution (#1156 R3/R8): the exact-SHA PR full-CI
 * record is a mandatory fail-closed input, and its fields are never trusted
 * directly — the recorded GitHub run is independently resolved through the
 * GitHub API (injectable for tests) and must match repository, workflow, event,
 * head SHA, run attempt, artifact identity and the complete required-job set.
 * When everything verifies, the release lane runs only complementary gates —
 * everything the PR matrix already proved for that SHA is skipped, and every
 * release-only gate is preserved. There is no environment-variable or argument
 * fallback that accepts absent evidence.
 */
export async function resolveReleaseGateSelection(
  prCiEvidencePath: string | undefined,
  candidateSha: string,
  changedPaths: string[],
  queryRun?: GitHubRunQuery,
): Promise<GateDefinition[]> {
  if (!prCiEvidencePath) {
    throw new Error(
      'release commands require --pr-ci <path> naming the exact-SHA PR full-CI evidence record',
    );
  }
  const evidence = await loadPrCiEvidence(prCiEvidencePath, candidateSha);
  const query = queryRun ?? await createGhCliRunQuery(evidence.runAttempt);
  await verifyPrCiProvenance(evidence, candidateSha, query);
  const gates = selectComplementaryReleaseGates(evidence, changedPaths);
  console.log(
    `PR CI evidence verified: run ${evidence.runId} (attempt ${evidence.runAttempt}) ` +
      `${evidence.conclusion} at ${evidence.sha}` +
      (evidence.url ? ` (${evidence.url})` : ''),
  );
  return gates;
}

async function runReleaseTier(
  prCiEvidence: string | undefined,
  dryRun: boolean,
): Promise<void> {
  const candidateSha = (await gitOutput(['rev-parse', 'HEAD']))?.trim();
  if (!candidateSha) throw new Error('Unable to determine the exact candidate SHA for release');
  const changedPaths = await gitChangedPaths('release');
  const gates = await resolveReleaseGateSelection(prCiEvidence, candidateSha, changedPaths);
  await runGateList('release', gates, changedPaths, dryRun);
}

/**
 * Release preparation (#1156 R9): creates the reviewable bump candidate only.
 * It consumes no PR CI evidence — the bump SHA does not exist yet, so any
 * prior evidence would name the wrong SHA — and it runs no local full matrix;
 * the prepare plan itself runs the fast tier after the bump, and the resulting
 * bump SHA must then pass the authoritative PR workflow. Publication
 * (publish-existing) is the first release entry that consumes the exact
 * bump-SHA PR CI evidence.
 */
export async function runReleasePrepare(
  approvedPlan: string | undefined,
  targetVersion: string | undefined,
  dryRun: boolean,
  prCiEvidence: string | undefined,
): Promise<void> {
  if (prCiEvidence) {
    throw new Error(
      'release-prepare does not consume PR CI evidence: the bump SHA it creates must pass ' +
        'the PR workflow first; pass --pr-ci to publish-existing instead',
    );
  }
  if (!targetVersion || !approvedPlan) {
    throw new Error('release-prepare requires --to and --approved-plan');
  }
  const decision = evaluateVersionAuthority('minor', approvedPlan);
  if (!decision.allowed) throw new Error(decision.reason);
  await executeReleasePlan(
    'release-prepare',
    targetVersion,
    approvedPlan,
    dryRun,
    createPreparePlan(targetVersion, approvedPlan),
    'dev',
  );
}

async function runPublishExisting(
  targetVersion: string | undefined,
  dryRun: boolean,
  prCiEvidence: string | undefined,
): Promise<void> {
  if (!targetVersion) throw new Error('publish-existing requires --to');
  // Same gate lane as every other release path, plus the mandatory exact-SHA
  // PR CI record: publish-existing must not publish from an unvalidated HEAD.
  await runReleaseTier(prCiEvidence, dryRun);
  await executeReleasePlan(
    'publish-existing',
    targetVersion,
    undefined,
    dryRun,
    createPublishExistingPlan(targetVersion),
    'main',
  );
}

async function runReleaseRecord(
  targetVersion: string | undefined,
  dryRun: boolean,
): Promise<void> {
  if (!targetVersion) throw new Error('release-record requires --to');
  if (dryRun) {
    console.log(
      `release-record dry-run: backfill prepare record for ${targetVersion} from main evidence.`,
    );
    return;
  }
  await backfillPrepareRecordFromMain(targetVersion);
}

async function executePatchRelease(dryRun: boolean): Promise<void> {
  // Re-derive the target from recorded evidence first: a previous attempt
  // that already bumped the package line must resume at the same target
  // instead of skipping a patch (the 0.41.1 → 0.41.2 incident).
  const prior = await readReleaseEvidenceForVersion(PACKAGE_VERSION);
  const { targetVersion, resumed } = resolvePatchTargetVersion(PACKAGE_VERSION, prior);
  if (resumed) {
    console.log(
      `Resuming in-flight patch release ${releaseTag(targetVersion)}; ` +
        'the target is not re-derived from the already-bumped package line.',
    );
  }
  await executeReleasePlan('patch-release', targetVersion, undefined, dryRun);
}

async function runPatchRelease(
  dryRun: boolean,
  approvedPlan: string | undefined,
  prCiEvidence: string | undefined,
): Promise<void> {
  const changedPaths = await gitChangedPaths('release');
  const decision = evaluatePatchEligibility({ changedPaths, approvedPlanId: approvedPlan });
  console.log(`AutoFlow3 patch-release (${AUTOFLOW3_POLICY_VERSION})`);
  console.log(`Policy: ${decision.allowed ? 'allowed' : 'blocked'}`);
  console.log(`Reason: ${decision.reason}`);
  console.log(`Required evidence: ${decision.requiredEvidence.join(', ')}`);
  if (!decision.allowed) Deno.exit(1);

  await runReleaseTier(prCiEvidence, dryRun);
  await executePatchRelease(dryRun);
}

async function runApprovedRelease(
  approvedPlan: string | undefined,
  targetVersion: string | undefined,
  dryRun: boolean,
  prCiEvidence: string | undefined,
): Promise<void> {
  if (!targetVersion) {
    console.error('Approved release requires a target version: --to <version>');
    Deno.exit(1);
  }

  const decision = evaluateVersionAuthority('minor', approvedPlan);
  console.log(`AutoFlow3 release (${AUTOFLOW3_POLICY_VERSION})`);
  console.log(`Policy: ${decision.allowed ? 'allowed' : 'blocked'}`);
  console.log(`Reason: ${decision.reason}`);
  console.log(`Required evidence: ${decision.requiredEvidence.join(', ')}`);
  if (!decision.allowed) Deno.exit(1);

  await runReleaseTier(prCiEvidence, dryRun);
  await executeReleasePlan('approved-release', targetVersion, approvedPlan, dryRun);
}

/**
 * Release-mutating commands (#1231 M14): the CI concurrency group in
 * autoflow-release.yml serializes the hosted lane; this set is the local
 * counterpart — each of these commands takes the deterministic repo-local
 * lock (release-lock.ts) before doing anything, so two local release
 * operations cannot interleave. Read-only tiers (dev/push/ci) never lock.
 */
const RELEASE_LOCK_COMMANDS = new Set([
  'patch-release',
  'release',
  'release-prepare',
  'publish-existing',
  'release-record',
]);

export async function main(args: string[]): Promise<void> {
  const options = parseArgs(args);

  let release: (() => Promise<void>) | undefined;
  if (RELEASE_LOCK_COMMANDS.has(options.command)) {
    const lock = await acquireReleaseLock(RELEASE_LOCK_PATH, options.command);
    if (!lock.acquired) {
      console.error(`Refusing to run ${options.command}: ${lock.reason}`);
      Deno.exit(1);
    }
    release = lock.release;
    // Gate failures inside the release plan Deno.exit(1) directly; the unload
    // hook (Deno.exit dispatches unload) plus the finally below release the
    // lock on every exit path short of a hard kill, which leaves a stale lock
    // the next run reports by name.
    globalThis.addEventListener('unload', () => releaseLockSync(RELEASE_LOCK_PATH));
  }

  try {
    switch (options.command) {
      case 'dev':
        await runTier('dev', options.dryRun);
        break;
      case 'push':
        await runTier('push', options.dryRun);
        break;
      case 'ci':
        await runTier('ci', options.dryRun);
        break;
      case 'patch-release':
        await runPatchRelease(options.dryRun, options.approvedPlan, options.prCiEvidence);
        break;
      case 'release':
        await runApprovedRelease(
          options.approvedPlan,
          options.targetVersion,
          options.dryRun,
          options.prCiEvidence,
        );
        break;
      case 'release-prepare':
        await runReleasePrepare(
          options.approvedPlan,
          options.targetVersion,
          options.dryRun,
          options.prCiEvidence,
        );
        break;
      case 'publish-existing':
        await runPublishExisting(options.targetVersion, options.dryRun, options.prCiEvidence);
        break;
      case 'release-record':
        await runReleaseRecord(options.targetVersion, options.dryRun);
        break;
      default:
        console.error(
          'Usage: deno run tools/autoflow/cli.ts <dev|push|ci|patch-release|release|release-prepare|publish-existing|release-record> [--dry-run] [--approved-plan ID] [--to VERSION] [--pr-ci PATH]',
        );
        Deno.exit(1);
    }
  } finally {
    await release?.();
  }
}

if (import.meta.main) {
  await main(Deno.args);
}
