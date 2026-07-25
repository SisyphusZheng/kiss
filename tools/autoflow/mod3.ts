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
  closureFile,
  createPreparePlan,
  createPublishExistingPlan,
  createReleaseEvidence,
  createReleasePlan,
  currentBranchName,
  currentWorkflowRunUrl,
  evidenceCurrentVersion,
  evidenceFile,
  githubReleaseUrl,
  hasStagedChanges,
  isCIEnv,
  nextPatchVersion,
  planFinalizeBranch,
  planStartBranches,
  type ReleaseClosureRecord,
  type ReleaseCommandStep,
  type ReleaseEvidence,
  releaseNoteFile,
  releaseTag,
  resumeEvidenceFromPrior,
  runCaptured,
  runReleaseStep,
  writeReleaseClosure,
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

export function normalizeReleaseVersion(version: string | undefined): string | undefined {
  if (!version) return undefined;
  return version.replace(/-(alpha|beta|rc)(\d+)$/u, '-$1.$2');
}

export function parseArgs(args: string[]): CliOptions {
  const command = args[0] ?? 'dev';
  const dryRun = args.includes('--dry-run');
  const dispatch = args.includes('--dispatch') || command === 'release-dispatch';
  const approvalIndex = args.indexOf('--approved-plan');
  const approvedPlan = approvalIndex === -1 ? undefined : args[approvalIndex + 1];
  const targetIndex = args.indexOf('--to');
  const targetVersion = targetIndex === -1
    ? undefined
    : normalizeReleaseVersion(args[targetIndex + 1]);
  return { command, dryRun, dispatch, approvedPlan, targetVersion };
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

async function writeAndStageReleaseEvidence(evidence: ReleaseEvidence): Promise<void> {
  await writeReleaseEvidence(evidence);
  await writeReleaseNote(evidence);
  await runCaptured([
    'git',
    'add',
    evidenceFile(evidence.targetVersion),
    releaseNoteFile(evidence.targetVersion),
  ]);
}

async function amendReleaseEvidenceCommit(evidence: ReleaseEvidence): Promise<void> {
  await writeAndStageReleaseEvidence(evidence);
  if (await hasStagedChanges()) {
    await runCaptured(['git', 'commit', '--amend', '--no-edit']);
  }
}

async function commitFinalReleaseEvidence(
  evidence: ReleaseEvidence,
  branch: string,
): Promise<void> {
  await writeAndStageReleaseEvidence(evidence);
  if (await hasStagedChanges()) {
    await runCaptured([
      'git',
      'commit',
      '-m',
      `docs(release): finalize ${releaseTag(evidence.targetVersion)} evidence`,
    ]);
  }
  // Push even when there was nothing to commit: a previous attempt may have
  // committed locally and failed at the push, and the resume must retry it.
  await runCaptured(['git', 'push', 'origin', branch]);
}

/**
 * Generate the durable closure record (docs/release/<tag>-closure.json) plus
 * the Durable closure section of the release note, and commit both. Without
 * this the release:evidence:check gate on main turns red after every release.
 */
async function finalizeReleaseClosure(
  evidence: ReleaseEvidence,
  branch: string,
): Promise<void> {
  const tag = releaseTag(evidence.targetVersion);
  const env = (name: string) => Deno.env.get(name);
  const record: ReleaseClosureRecord = {
    tagCommit: (await runCaptured(['git', 'rev-parse', tag])).trim(),
    finalEvidenceCommit: (await runCaptured(['git', 'rev-parse', 'HEAD'])).trim(),
    // CI path: the workflow run executing this release. Local path: the main
    // CI run verified by publish-existing (stored on the evidence). Last
    // resort keeps the record honest instead of inventing a URL.
    successfulReleaseRun: currentWorkflowRunUrl(env) ??
      evidence.releaseRunUrl ??
      `local release without a recorded CI run (${evidence.id})`,
    releaseUrl: githubReleaseUrl(tag, env),
  };
  await writeReleaseClosure(evidence.targetVersion, record);
  await runCaptured([
    'git',
    'add',
    closureFile(evidence.targetVersion),
    releaseNoteFile(evidence.targetVersion),
  ]);
  if (await hasStagedChanges()) {
    await runCaptured(['git', 'commit', '-m', `docs(release): record ${tag} closure`]);
  }
  // Push unconditionally for the same resume reason as the final evidence.
  await runCaptured(['git', 'push', 'origin', branch]);
}

/**
 * The GitHub release is created from the running snapshot of the note; sync
 * the final note (status completed, Durable closure section) onto it. Editing
 * is idempotent. gh absence, missing token, or a missing release degrades to
 * a warning: the repository note remains the durable record.
 */
async function syncGitHubReleaseNotes(evidence: ReleaseEvidence): Promise<void> {
  const tag = releaseTag(evidence.targetVersion);
  try {
    await runCaptured([
      'gh',
      'release',
      'edit',
      tag,
      '--notes-file',
      releaseNoteFile(evidence.targetVersion),
    ]);
    console.log(`GitHub release ${tag} notes updated from final evidence.`);
  } catch (error) {
    console.warn(
      `[release] could not update GitHub release ${tag} notes ` +
        `(${error instanceof Error ? error.message.split('\n')[0] : String(error)}); ` +
        'the note committed to the repository is the durable record.',
    );
  }
}

/**
 * The local release plan starts on dev but publishes, tags and finalizes on
 * main. Return the worktree to the start branch and fast-forward it so the
 * next release cycle starts synced. A failure here does not undo the release
 * (main already has every release commit); warn with the manual recovery
 * instead of failing.
 */
export async function syncBackToStartBranch(
  startBranch: string,
  releaseBranch: string,
): Promise<void> {
  if (startBranch === releaseBranch) return;
  try {
    await runCaptured(['git', 'checkout', startBranch]);
    await runCaptured(['git', 'merge', '--ff-only', releaseBranch]);
    await runCaptured(['git', 'push', 'origin', startBranch]);
  } catch (error) {
    console.warn(
      `[release] could not sync ${startBranch} from ${releaseBranch} (${
        error instanceof Error ? error.message.split('\n')[0] : String(error)
      }); run manually: git checkout ${startBranch} && git merge --ff-only ${releaseBranch} ` +
        `&& git push origin ${startBranch}`,
    );
  }
}

/**
 * Land the final completed evidence and the closure record on the release
 * branch, then return to the start branch. The release branch is derived from
 * the plan (its last checkout target), not from expectedBranch: the local
 * plan starts on dev but publishes and tags on main, and main CI validates
 * the release closure, so finalize commits that landed on dev left main
 * evidence stuck at "running" with no closure.
 *
 * A finalize failure (commit or push) does not flip the release to failed:
 * publish and tag already succeeded, the evidence on disk stays completed,
 * and re-running the same command resumes at the finalize phase.
 */
export async function finalizeReleaseOnReleaseBranch(
  evidence: ReleaseEvidence,
  plan: ReleaseCommandStep[],
  expectedBranch: string,
): Promise<void> {
  const current = await currentBranchName(expectedBranch);
  const finalizeBranch = planFinalizeBranch(plan, current);
  if (current !== finalizeBranch) {
    // A resume that skipped every checkout step restarts on the start branch;
    // move to the release branch explicitly before committing.
    await runCaptured(['git', 'checkout', finalizeBranch]);
  }
  try {
    await commitFinalReleaseEvidence(evidence, finalizeBranch);
    await finalizeReleaseClosure(evidence, finalizeBranch);
  } catch (error) {
    console.warn(
      `[release] finalize on ${finalizeBranch} failed (${
        error instanceof Error ? error.message.split('\n')[0] : String(error)
      }); publish and tag already succeeded, so the release stays completed. ` +
        'Re-run the same command to retry the finalize commits.',
    );
  }
  await syncGitHubReleaseNotes(evidence);
  await syncBackToStartBranch(expectedBranch, finalizeBranch);
}

async function persistReleaseEvidenceAfterStep(
  evidence: ReleaseEvidence,
  stepName: string,
  executed: boolean,
): Promise<void> {
  if (stepName === 'stage release evidence') {
    // Staging is harmless on a skipped step and required when the matching
    // commit step re-runs after a failed attempt.
    await writeAndStageReleaseEvidence(evidence);
    return;
  }

  if (stepName === 'commit release evidence') {
    if (executed) {
      // HEAD is the commit this run just created; folding the latest step
      // states into it with an amend is safe.
      await amendReleaseEvidenceCommit(evidence);
      return;
    }
    // Skipped on a resume: the evidence commit may already be pushed, so it
    // must never be amended. Any status drift is persisted by the finalize
    // commit instead.
    await writeReleaseEvidence(evidence);
    await writeReleaseNote(evidence);
    return;
  }

  await writeReleaseEvidence(evidence);
  await writeReleaseNote(evidence);
}

/**
 * Load the evidence a previous attempt of the same release left behind, if
 * any. The file is only reused for the same kind and target version; anything
 * else starts a fresh run with a fresh evidence id.
 */
async function readPriorReleaseEvidence(
  kind: ReleaseEvidence['kind'],
  targetVersion: string,
): Promise<ReleaseEvidence | undefined> {
  const path = evidenceFile(targetVersion);
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
  let prior: ReleaseEvidence;
  try {
    prior = JSON.parse(text) as ReleaseEvidence;
  } catch (error) {
    throw new Error(
      `Prior release evidence ${path} is not readable JSON; repair or remove it before ` +
        `re-running: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (prior.kind !== kind || prior.targetVersion !== targetVersion || !Array.isArray(prior.steps)) {
    return undefined;
  }
  return prior;
}

async function executeReleasePlan(
  kind: ReleaseEvidence['kind'],
  targetVersion: string,
  approvalId: string | undefined,
  dryRun: boolean,
  plan = createReleasePlan(targetVersion, approvalId),
  expectedBranch = isCIEnv() ? 'main' : 'dev',
): Promise<void> {
  const persistsEvidence = kind !== 'release-prepare';
  const prior = persistsEvidence && !dryRun
    ? await readPriorReleaseEvidence(kind, targetVersion)
    : undefined;
  const evidence = prior ? resumeEvidenceFromPrior(prior, plan) : createReleaseEvidence(
    kind,
    evidenceCurrentVersion(kind),
    targetVersion,
    approvalId,
  );
  if (!prior) {
    evidence.steps = plan.map((step) => ({
      name: step.name,
      command: step.command,
      cwd: step.cwd,
      status: 'pending',
    }));
  }

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

  // A fresh run starts on the expected branch. A resume must start where the
  // passed prefix left the worktree: the local plan checks out main mid-run,
  // so a run that failed after that point only resumes from main.
  const startBranches = planStartBranches(plan, prior?.steps, expectedBranch);
  const branch = (await runCaptured(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  if (!startBranches.includes(branch)) {
    throw new Error(
      `Refusing release from branch ${branch}; expected ${startBranches.join(' or ')}.`,
    );
  }
  await assertCleanWorktree();
  if (prior) {
    console.log(
      `Resuming release run ${prior.id} (${prior.status}); already-passed steps are skipped.`,
    );
  }

  evidence.status = 'running';
  if (persistsEvidence) {
    await writeReleaseEvidence(evidence);
    await writeReleaseNote(evidence);
  }

  try {
    for (const step of plan) {
      const record = evidence.steps.find((item) => item.name === step.name);
      if (record?.status === 'passed') {
        console.log(`[resume] skipping already-passed step: ${step.name}`);
        if (persistsEvidence) await persistReleaseEvidenceAfterStep(evidence, step.name, false);
        continue;
      }
      await runReleaseStep(evidence, step);
      if (persistsEvidence) await persistReleaseEvidenceAfterStep(evidence, step.name, true);
    }
    evidence.status = 'completed';
    evidence.completedAt = new Date().toISOString();
    // The original evidence commit is intentionally created before tagging.
    // Persist completion in a follow-up commit after tag/npm/GitHub success so
    // the repository's durable evidence cannot remain stuck at "running". The
    // finalize lands on the release branch (main), not the start branch.
    if (persistsEvidence) {
      await finalizeReleaseOnReleaseBranch(evidence, plan, expectedBranch);
    }
  } catch (error) {
    evidence.status = 'failed';
    evidence.completedAt = new Date().toISOString();
    if (persistsEvidence) {
      await writeReleaseEvidence(evidence);
      await writeReleaseNote(evidence);
    }
    throw error;
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
  await executeReleasePlan(
    'publish-existing',
    targetVersion,
    undefined,
    dryRun,
    createPublishExistingPlan(targetVersion),
    'main',
  );
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

  // gates and release plan validation happen in dry-run mode first.
  // Only when --dispatch is given and the local repo is on a clean main branch
  // do we push and trigger the real workflow.
  await runApprovedRelease(approvedPlan, targetVersion, true);

  if (isCIEnv()) {
    console.error(
      'Release dispatch is not supported inside CI; use the autoflow-release workflow directly.',
    );
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
    case 'release-prepare':
      await runReleasePrepare(options.approvedPlan, options.targetVersion, options.dryRun);
      break;
    case 'publish-existing':
      await runPublishExisting(options.targetVersion, options.dryRun);
      break;
    default:
      console.error(
        'Usage: deno run tools/autoflow/mod3.ts <dev|push|ci|patch-release|minor-plan|release|release-dispatch|release-prepare|publish-existing> [--dry-run] [--dispatch] [--approved-plan ID] [--to VERSION]',
      );
      Deno.exit(1);
  }
}

if (import.meta.main) {
  await main(Deno.args);
}
