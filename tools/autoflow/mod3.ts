import {
  AUTOFLOW3_POLICY_VERSION,
  type AutoFlowTier,
  evaluatePatchEligibility,
  evaluateVersionAuthority,
  type GateDefinition,
  selectGates,
} from './policy.ts';
import {
  assertBranch,
  assertCleanWorktree,
  createReleaseEvidence,
  createReleasePlan,
  isCIEnv,
  nextPatchVersion,
  releaseTag,
  runReleaseStep,
  writeReleaseEvidence,
  writeReleaseNote,
} from './release.ts';
import { PACKAGE_VERSION } from '../project-constants.ts';

export interface CliOptions {
  command: string;
  dryRun: boolean;
  dispatch: boolean;
  approvedPlan?: string;
  targetVersion?: string;
}

export interface GateResult {
  name: string;
  passed: boolean;
  output: string;
}

export function parseArgs(args: string[]): CliOptions {
  const command = args[0] ?? 'dev';
  const dryRun = args.includes('--dry-run');
  const dispatch = args.includes('--dispatch') || command === 'release-dispatch';
  const approvalIndex = args.indexOf('--approved-plan');
  const approvedPlan = approvalIndex === -1 ? undefined : args[approvalIndex + 1];
  const targetIndex = args.indexOf('--to');
  const targetVersion = targetIndex === -1 ? undefined : args[targetIndex + 1];
  return { command, dryRun, dispatch, approvedPlan, targetVersion };
}

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

export async function gitChangedPaths(tier: AutoFlowTier): Promise<string[]> {
  const paths = new Set<string>();

  if (tier === 'dev') {
    addPaths(paths, await gitOutput(['diff', '--cached', '--name-only']));
    return [...paths].sort();
  }

  if (tier === 'ci') {
    addPaths(paths, await gitOutput(['diff', '--name-only', 'HEAD^', 'HEAD']));
    return [...paths].sort();
  }

  addPaths(paths, await gitOutput(['diff', '--name-only', '@{u}...HEAD']));
  addPaths(paths, await gitOutput(['diff', '--cached', '--name-only']));
  addPaths(paths, await gitOutput(['diff', '--name-only']));
  addPaths(paths, await gitOutput(['ls-files', '--others', '--exclude-standard']));

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
      console.log(result.output.split(/\r?\n/).slice(0, 20).join('\n'));
    }
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    console.error(`AutoFlow3 ${tier} failed: ${failed.map((result) => result.name).join(', ')}`);
    Deno.exit(1);
  }
}

async function executeReleasePlan(
  kind: 'patch-release' | 'approved-release',
  targetVersion: string,
  approvalId: string | undefined,
  dryRun: boolean,
): Promise<void> {
  const evidence = createReleaseEvidence(kind, PACKAGE_VERSION, targetVersion, approvalId);
  const plan = createReleasePlan(targetVersion, approvalId);

  if (dryRun) {
    console.log(
      `${kind} dry-run complete for ${releaseTag(targetVersion)}; planned steps:`,
    );
    for (const step of plan) {
      console.log(`- ${step.name}${step.command ? `: ${step.command.join(' ')}` : ''}`);
    }
    console.log(
      'Dry-run complete; no version bump, push, tag, publish, or evidence write occurred.',
    );
    return;
  }

  const expectedBranch = isCIEnv() ? 'main' : 'dev';
  await assertBranch(expectedBranch);
  await assertCleanWorktree();

  evidence.status = 'running';
  await writeReleaseEvidence(evidence);
  await writeReleaseNote(evidence);

  try {
    for (const step of plan) {
      await runReleaseStep(evidence, step);
      await writeReleaseEvidence(evidence);
      await writeReleaseNote(evidence);
    }
    evidence.status = 'completed';
    evidence.completedAt = new Date().toISOString();
    await writeReleaseEvidence(evidence);
    await writeReleaseNote(evidence);
  } catch (error) {
    evidence.status = 'failed';
    evidence.completedAt = new Date().toISOString();
    await writeReleaseEvidence(evidence);
    await writeReleaseNote(evidence);
    throw error;
  }
}

async function executePatchRelease(dryRun: boolean): Promise<void> {
  const targetVersion = nextPatchVersion(PACKAGE_VERSION);
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

function runMinorPlan(): void {
  const decision = evaluateVersionAuthority('minor');
  console.log(`AutoFlow3 minor-plan (${AUTOFLOW3_POLICY_VERSION})`);
  console.log(`Policy: ${decision.allowed ? 'allowed' : 'blocked'}`);
  console.log(`Reason: ${decision.reason}`);
  console.log(`Required evidence: ${decision.requiredEvidence.join(', ')}`);
  console.log('Drafting is allowed; release execution requires ADR plus approved version plan.');
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

async function runReleaseDispatch(
  approvedPlan: string | undefined,
  targetVersion: string | undefined,
): Promise<void> {
  if (!targetVersion) {
    console.error('Release dispatch requires a target version: --to <version>');
    Deno.exit(1);
  }
  if (!approvedPlan) {
    console.error('Release dispatch requires an approved plan: --approved-plan <id>');
    Deno.exit(1);
  }

  // ponytail: gates and release plan validation happen in dry-run mode first.
  // Only when --dispatch is given and the local repo is on a clean main branch
  // do we push and trigger the real workflow.
  await runApprovedRelease(approvedPlan, targetVersion, true);

  if (isCIEnv()) {
    console.error('Release dispatch is not supported inside CI; use the autoflow-release workflow directly.');
    Deno.exit(1);
  }

  await assertBranch('main');
  await assertCleanWorktree();

  console.log('Pushing main and dispatching AutoFlow Release workflow...');
  const push = new Deno.Command('git', { args: ['push', 'origin', 'main'] });
  const pushResult = await push.output();
  if (pushResult.code !== 0) {
    console.error(new TextDecoder().decode(pushResult.stderr));
    Deno.exit(1);
  }

  const dispatch = new Deno.Command('gh', {
    args: [
      'workflow',
      'run',
      'autoflow-release.yml',
      '-R',
      'open-element/openelement',
      '-f',
      `version=${targetVersion}`,
      '-f',
      'plan=minor',
      '-f',
      `approvedPlan=${approvedPlan}`,
    ],
  });
  const dispatchResult = await dispatch.output();
  const dispatchOutput = new TextDecoder().decode(dispatchResult.stdout);
  if (dispatchResult.code !== 0) {
    console.error(new TextDecoder().decode(dispatchResult.stderr));
    Deno.exit(1);
  }
  console.log(dispatchOutput.trim());
  console.log(`Release dispatch triggered for ${releaseTag(targetVersion)}.`);
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
    case 'minor-plan':
      runMinorPlan();
      break;
    case 'release':
      if (options.dispatch) {
        await runReleaseDispatch(options.approvedPlan, options.targetVersion);
      } else {
        await runApprovedRelease(options.approvedPlan, options.targetVersion, options.dryRun);
      }
      break;
    case 'release-dispatch':
      await runReleaseDispatch(options.approvedPlan, options.targetVersion);
      break;
    default:
      console.error(
        'Usage: deno run tools/autoflow/mod3.ts <dev|push|ci|patch-release|minor-plan|release|release-dispatch> [--dry-run] [--dispatch] [--approved-plan ID] [--to VERSION]',
      );
      Deno.exit(1);
  }
}

if (import.meta.main) {
  await main(Deno.args);
}
