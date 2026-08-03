import {
  AUTOFLOW3_POLICY_VERSION,
  type AutoFlowTier,
  evaluatePatchEligibility,
  evaluateVersionAuthority,
  type GateDefinition,
  selectGates,
} from './policy.ts';
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

export interface CliOptions {
  command: string;
  dryRun: boolean;
  approvedPlan?: string;
  targetVersion?: string;
}

export interface GateResult {
  name: string;
  passed: boolean;
  output: string;
}

export function normalizeReleaseVersion(version: string | undefined): string | undefined {
  if (!version) return undefined;
  return version.replace(/-(alpha|beta|rc)(\d+)$/u, '-$1.$2');
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
  return { command, dryRun, approvedPlan, targetVersion };
}

export type GitOutput = (args: string[]) => Promise<string | undefined>;

async function gitOutput(args: string[]): Promise<string | undefined> {
  const command = new Deno.Command('git', {
    args,
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  if (output.code !== 0) return undefined;
  return new TextDecoder().decode(output.stdout);
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

  const command = new Deno.Command(gate.command[0], {
    args: gate.command.slice(1),
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  const text = `${new TextDecoder().decode(output.stdout)}${
    new TextDecoder().decode(output.stderr)
  }`
    .trim();
  return { name: gate.name, passed: output.code === 0, output: text };
}

async function runTier(tier: AutoFlowTier, dryRun: boolean): Promise<void> {
  const changedPaths = await gitChangedPaths(tier);
  const gates = selectGates(tier, changedPaths);
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

async function runReleasePrepare(
  approvedPlan: string | undefined,
  targetVersion: string | undefined,
  dryRun: boolean,
): Promise<void> {
  if (!targetVersion || !approvedPlan) {
    throw new Error('release-prepare requires --to and --approved-plan');
  }
  const decision = evaluateVersionAuthority('minor', approvedPlan);
  if (!decision.allowed) throw new Error(decision.reason);
  await runTier('release', dryRun);
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
): Promise<void> {
  if (!targetVersion) throw new Error('publish-existing requires --to');
  // Same gate tier as every other release path: the CI workflow that invokes
  // publish-existing must not publish from an unvalidated main HEAD.
  await runTier('release', dryRun);
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
): Promise<void> {
  const changedPaths = await gitChangedPaths('release');
  const decision = evaluatePatchEligibility({ changedPaths, approvedPlanId: approvedPlan });
  console.log(`AutoFlow3 patch-release (${AUTOFLOW3_POLICY_VERSION})`);
  console.log(`Policy: ${decision.allowed ? 'allowed' : 'blocked'}`);
  console.log(`Reason: ${decision.reason}`);
  console.log(`Required evidence: ${decision.requiredEvidence.join(', ')}`);
  if (!decision.allowed) Deno.exit(1);

  await runTier('release', dryRun);
  await executePatchRelease(dryRun);
}

async function runApprovedRelease(
  approvedPlan: string | undefined,
  targetVersion: string | undefined,
  dryRun: boolean,
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

  await runTier('release', dryRun);
  await executeReleasePlan('approved-release', targetVersion, approvedPlan, dryRun);
}

export async function main(args: string[]): Promise<void> {
  const options = parseArgs(args);

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
      await runPatchRelease(options.dryRun, options.approvedPlan);
      break;
    case 'release':
      await runApprovedRelease(options.approvedPlan, options.targetVersion, options.dryRun);
      break;
    case 'release-prepare':
      await runReleasePrepare(options.approvedPlan, options.targetVersion, options.dryRun);
      break;
    case 'publish-existing':
      await runPublishExisting(options.targetVersion, options.dryRun);
      break;
    case 'release-record':
      await runReleaseRecord(options.targetVersion, options.dryRun);
      break;
    default:
      console.error(
        'Usage: deno run tools/autoflow/cli.ts <dev|push|ci|patch-release|release|release-prepare|publish-existing|release-record> [--dry-run] [--approved-plan ID] [--to VERSION]',
      );
      Deno.exit(1);
  }
}

if (import.meta.main) {
  await main(Deno.args);
}
