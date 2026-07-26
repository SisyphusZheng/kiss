import { AUTOFLOW3_POLICY_VERSION, isCI } from './policy.ts';
import {
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
  PREVIOUS_PACKAGE_VERSION,
} from '../project-constants.ts';
import { assertCleanWorktree } from '../lib/git-cleanliness.ts';
import { formatJson } from '../lib/format-json.ts';
import type { ReleaseClosureRecord } from '../lib/release-evidence-consistency.ts';

export type { ReleaseClosureRecord };

export interface ReleaseStepEvidence {
  name: string;
  command?: string[];
  cwd?: string;
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  exitCode?: number;
}

export interface ReleaseEvidence {
  id: string;
  kind: 'patch-release' | 'approved-release' | 'release-prepare' | 'publish-existing';
  policyVersion: string;
  currentVersion: string;
  targetVersion: string;
  status: 'planned' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  approvalId?: string;
  /**
   * Successful CI run that gates this release. Set by the
   * 'verify main CI success for HEAD' step on the local publish-existing
   * path; CI releases use GITHUB_RUN_ID instead (see currentWorkflowRunUrl).
   */
  releaseRunUrl?: string;
  steps: ReleaseStepEvidence[];
}

/**
 * The package line a release replaces. publish-existing runs after the bump
 * is already merged, so PACKAGE_VERSION equals the target; the true previous
 * line is the bump-maintained PREVIOUS_PACKAGE_VERSION.
 */
export function evidenceCurrentVersion(kind: ReleaseEvidence['kind']): string {
  return kind === 'publish-existing' ? PREVIOUS_PACKAGE_VERSION : PACKAGE_VERSION;
}

export interface ReleaseCommandStep {
  name: string;
  command?: string[];
  cwd?: string;
  run?: (evidence: ReleaseEvidence) => Promise<void>;
}

interface Semver {
  major: number;
  minor: number;
  patch: number;
}

export function parseSemver(version: string): Semver {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/);
  if (!match) throw new Error(`Invalid semver version: ${version}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function nextPatchVersion(version: string): string {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z]+)\.(\d+))?$/);
  if (!match) throw new Error(`Invalid semver version: ${version}`);
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  const preName = match[4];
  const preNum = match[5];

  // Pre-release line: bump the pre-release counter, not the patch, so a
  // version like 0.41.0-alpha.6 advances to 0.41.0-alpha.7 instead of
  // the stable 0.41.1 (which would silently leave pre-release scope).
  if (preName !== undefined && preNum !== undefined) {
    return `${major}.${minor}.${patch}-${preName}.${Number(preNum) + 1}`;
  }

  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Re-derive the patch-release target from recorded evidence instead of the
 * (possibly already-bumped) current package line. A failed patch attempt
 * leaves its evidence at running/failed under the *target* version — which,
 * once the bump step ran, equals PACKAGE_VERSION. Resuming must reuse that
 * target; recomputing nextPatchVersion(PACKAGE_VERSION) skips a patch (the
 * 0.41.1 → 0.41.2 incident, reverted in 10038c4d).
 */
export function resolvePatchTargetVersion(
  currentVersion: string,
  prior: Pick<ReleaseEvidence, 'kind' | 'status'> | undefined,
): { targetVersion: string; resumed: boolean } {
  if (
    prior?.kind === 'patch-release' &&
    (prior.status === 'running' || prior.status === 'failed')
  ) {
    return { targetVersion: currentVersion, resumed: true };
  }
  return { targetVersion: nextPatchVersion(currentVersion), resumed: false };
}

/**
 * Read the evidence record for a version regardless of release kind, so the
 * patch-release entrypoint can detect an in-flight release before deriving
 * its target. Missing file means no prior attempt; a corrupt file is
 * rejected loudly, matching readPriorReleaseEvidence's trust model.
 */
export async function readReleaseEvidenceForVersion(
  version: string,
): Promise<ReleaseEvidence | undefined> {
  const path = evidenceFile(version);
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
  try {
    return JSON.parse(text) as ReleaseEvidence;
  } catch (error) {
    throw new Error(
      `Release evidence ${path} is not readable JSON; repair or remove it before ` +
        `re-running: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function releaseTag(version: string): string {
  return `v${version}`;
}

export function githubReleaseCreateCommand(tag: string, note: string): string[] {
  const command = ['gh', 'release', 'create', tag, '--title', tag, '--notes-file', note];
  if (/^v?\d+\.\d+\.\d+-/u.test(tag)) {
    command.push('--prerelease');
  }
  return command;
}

export function evidenceFile(version: string): string {
  return `docs/release/autoflow3/${releaseTag(version)}.json`;
}

export function releaseNoteFile(version: string): string {
  return `docs/release/${releaseTag(version)}.md`;
}

export function closureFile(version: string): string {
  return `docs/release/${releaseTag(version)}-closure.json`;
}

export type EnvLookup = (name: string) => string | undefined;

/** URL of the workflow run currently executing the release (CI path only). */
export function currentWorkflowRunUrl(env: EnvLookup): string | undefined {
  const server = env('GITHUB_SERVER_URL');
  const repo = env('GITHUB_REPOSITORY');
  const runId = env('GITHUB_RUN_ID');
  if (!server || !repo || !runId) return undefined;
  return `${server}/${repo}/actions/runs/${runId}`;
}

export function githubReleaseUrl(tag: string, env: EnvLookup): string {
  const server = env('GITHUB_SERVER_URL') ?? 'https://github.com';
  const repo = env('GITHUB_REPOSITORY') ?? 'open-element/openelement';
  return `${server}/${repo}/releases/tag/${tag}`;
}

/** Durable closure section appended to the release note at finalize time. */
export function renderClosureSection(record: ReleaseClosureRecord): string {
  return [
    '## Durable closure',
    '',
    `- Immutable tag commit: \`${record.tagCommit}\``,
    `- Final completed evidence commit: \`${record.finalEvidenceCommit}\``,
    `- Successful release run: ${record.successfulReleaseRun}`,
    `- GitHub release: ${record.releaseUrl}`,
    '',
  ].join('\n');
}

const CLOSURE_SECTION_MARKER = '## Durable closure';

/** Insert or replace the Durable closure section of a release note (idempotent). */
export function mergeClosureSection(noteText: string, record: ReleaseClosureRecord): string {
  const markerIndex = noteText.indexOf(CLOSURE_SECTION_MARKER);
  const base = markerIndex === -1 ? noteText : noteText.slice(0, markerIndex);
  return `${base.trimEnd()}\n\n${renderClosureSection(record)}`;
}

/** Write the closure record JSON and fold its section into the release note. */
export async function writeReleaseClosure(
  version: string,
  record: ReleaseClosureRecord,
): Promise<void> {
  await Deno.writeTextFile(closureFile(version), formatJson(record));
  const notePath = releaseNoteFile(version);
  const note = await Deno.readTextFile(notePath);
  await Deno.writeTextFile(notePath, mergeClosureSection(note, record));
}

export function createReleaseEvidence(
  kind: ReleaseEvidence['kind'],
  currentVersion: string,
  targetVersion: string,
  approvalId?: string,
): ReleaseEvidence {
  const now = new Date().toISOString();
  return {
    id: `${kind}-${releaseTag(targetVersion)}-${now.replace(/[:.]/g, '-')}`,
    kind,
    policyVersion: AUTOFLOW3_POLICY_VERSION,
    currentVersion,
    targetVersion,
    status: 'planned',
    startedAt: now,
    approvalId,
    steps: createReleasePlan(targetVersion, approvalId).map((step) => ({
      name: step.name,
      command: step.command,
      cwd: step.cwd,
      status: 'pending',
    })),
  };
}

export function createReleasePlan(
  targetVersion: string,
  approvalId?: string,
): ReleaseCommandStep[] {
  if (approvalId && !/^[A-Za-z0-9._/-]+$/.test(approvalId)) {
    throw new Error(`Invalid approval id: ${approvalId}`);
  }
  const tag = releaseTag(targetVersion);
  const note = releaseNoteFile(targetVersion);
  const commitMessage = approvalId
    ? `chore(release): ${tag} (${approvalId})`
    : `chore(release): ${tag}`;
  const evidenceSteps: ReleaseCommandStep[] = [
    {
      name: 'stage release evidence',
      command: ['git', 'add', evidenceFile(targetVersion), note],
    },
    {
      name: 'commit release evidence',
      // Guarded like the bump commit: a resume whose earlier attempt already
      // committed the evidence stages nothing, and an empty commit exits 1.
      run: () => commitIfStaged(`docs(release): record ${tag} evidence`),
    },
  ];
  const publishSteps: ReleaseCommandStep[] = [
    {
      name: 'package artifact gate',
      command: ['deno', 'task', 'package-artifacts:check'],
    },
    ...(canPublishNpm()
      ? [
        {
          name: 'publish npm packages',
          command: ['deno', 'task', 'publish:npm'],
        },
        {
          name: 'verify npm versions and dist-tags',
          command: ['deno', 'run', '-A', 'tools/verify-npm-release.ts', targetVersion],
        },
        {
          name: 'post-publish npm consumer smoke',
          command: ['deno', 'run', '-A', 'tools/consumer-smoke.ts', '--version', targetVersion],
        },
        {
          name: 'post-publish third-party Web Component smoke',
          command: ['deno', 'task', 'third-party-wc:smoke'],
        },
      ]
      : []),
  ];
  const tagSteps: ReleaseCommandStep[] = [
    {
      name: 'tag release',
      run: async (evidence) => {
        const head = (await runCaptured(['git', 'rev-parse', 'HEAD'])).trim();
        let existing: string | undefined;
        try {
          existing = (await runCaptured(['git', 'rev-parse', '--verify', tag])).trim();
        } catch {
          // Tag does not exist yet.
        }
        // Only gather the resume signals when the tag actually conflicts.
        let existingIsAncestor = false;
        let existingEvidenceId: string | undefined;
        if (existing !== undefined && existing !== head) {
          existingIsAncestor = await isAncestorCommit(existing, head);
          existingEvidenceId = await tagEvidenceId(tag, targetVersion);
        }
        const action = decideTagAction({
          tag,
          head,
          existing,
          publishPassed: publishEvidencePassed(evidence),
          existingIsAncestor,
          existingEvidenceId,
          evidenceId: evidence.id,
        });
        if (action === 'skip-at-head') {
          console.log(`Tag ${tag} already exists at HEAD; skipping.`);
          return;
        }
        if (action === 'keep-existing') {
          console.warn(
            `[release] tag ${tag} already exists at ancestor ${existing} and the publish ` +
              'steps passed; keeping the immutable tag and continuing without re-tagging.',
          );
          return;
        }
        await runCaptured(['git', 'tag', tag]);
      },
    },
    {
      name: 'push tag',
      // Tags are immutable release evidence. A conflicting remote tag fails.
      command: ['git', 'push', 'origin', tag],
    },
    ...(canCreateGitHubRelease()
      ? [
        {
          name: 'create GitHub release',
          run: async () => {
            try {
              await runCaptured(['gh', 'release', 'view', tag]);
              console.log(`GitHub release ${tag} already exists; skipping.`);
              return;
            } catch {
              // Release does not exist; create it.
            }
            await runCaptured(githubReleaseCreateCommand(tag, note));
          },
        },
      ]
      : []),
  ];
  const baseSteps: ReleaseCommandStep[] = [
    {
      name: 'bump patch version',
      command: [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        'tools/bump-version.ts',
        '--to',
        targetVersion,
      ],
    },
    {
      name: 'update project constants',
      run: () => updateProjectConstants(targetVersion),
    },
    {
      name: 'update current version anchors',
      run: () => updateCurrentVersionAnchors(targetVersion),
    },
    {
      name: 'regenerate versioned artifacts',
      command: ['deno', 'task', 'generate:ui-manifest'],
    },
    {
      name: 'format release bump',
      command: ['deno', 'task', 'fmt'],
    },
    {
      name: 'stage release bump',
      command: [
        'git',
        'add',
        'deno.json',
        'packages/*/deno.json',
        'packages/create/src/version.ts',
        'packages/ui/src/generated-manifest.json',
        'tools/project-constants.ts',
        'README.md',
        'README.zh.md',
        'docs/current/VERSION_PLAN.md',
        'docs/governance/PROJECT_WORKFLOW.md',
        'docs/roadmap/ROADMAP.md',
        'docs/status/STATUS.md',
        'www/app/data/version.ts',
        'www/app/routes/index/index.tsx',
        'www/app/routes/guide/getting-started.tsx',
        'www/app/routes/roadmap.tsx',
      ],
    },
    {
      name: 'commit release bump',
      // Guarded: on a re-run the bump commit already exists and the stage is
      // empty; an empty `git commit` exits 1 and would block the resume.
      run: () => commitIfStaged(commitMessage),
    },
  ];

  if (isCI()) {
    // In CI, the workflow checks out main directly. Bump, publish, and tag all
    // on main; do not touch the dev branch.
    return [
      ...baseSteps,
      ...publishSteps,
      ...evidenceSteps,
      {
        name: 'pull latest main',
        run: () => pullLatestMainWithRecovery(),
      },
      {
        name: 'push main evidence',
        command: ['git', 'push', 'origin', 'main'],
      },
      ...tagSteps,
    ];
  }

  // Local/manual release: bump on dev, fast-forward main from dev in a single
  // transition, then publish, record evidence, and tag on main. The plan
  // deliberately ends on main: the executor lands the final completed evidence
  // and closure commits there (main CI validates the release closure), then
  // returns to dev and fast-forwards it (see finalizeReleaseOnReleaseBranch).
  return [
    ...baseSteps,
    {
      name: 'run release gates after bump',
      command: ['deno', 'task', 'autoflow:ci'],
    },
    {
      name: 'push dev',
      command: ['git', 'push', 'origin', 'dev'],
    },
    {
      name: 'checkout main',
      command: ['git', 'checkout', 'main'],
    },
    {
      name: 'sync main from dev (fast-forward)',
      command: ['git', 'merge', '--ff-only', 'dev'],
    },
    ...publishSteps,
    ...evidenceSteps,
    {
      name: 'push main (release + evidence)',
      command: ['git', 'push', 'origin', 'main'],
    },
    ...tagSteps,
  ];
}

const PREPARE_STEP_NAMES = new Set([
  'bump patch version',
  'update project constants',
  'update current version anchors',
  'regenerate versioned artifacts',
  'format release bump',
  'stage release bump',
  'commit release bump',
  'run release gates after bump',
]);

/**
 * Prepare a reviewable release commit without publishing, tagging, or pushing.
 * The resulting commit must pass dev and main CI before publish-existing runs.
 */
export function createPreparePlan(
  targetVersion: string,
  approvalId?: string,
): ReleaseCommandStep[] {
  const steps = createReleasePlan(targetVersion, approvalId)
    .filter((step) => PREPARE_STEP_NAMES.has(step.name));
  if (!steps.some((step) => step.name === 'run release gates after bump')) {
    steps.push({
      name: 'run release gates after bump',
      command: ['deno', 'task', 'autoflow:ci'],
    });
  }
  return steps;
}

async function verifyPublishedSourceVersion(targetVersion: string): Promise<void> {
  if (PACKAGE_VERSION !== targetVersion) {
    throw new Error(
      `Refusing publish-existing for ${targetVersion}; source is ${PACKAGE_VERSION}.`,
    );
  }
  await assertBranch('main');
  await assertCleanWorktree('Refusing release from a dirty worktree');
}

async function verifyMainCiSuccessForHead(): Promise<string | undefined> {
  const head = (await runCaptured(['git', 'rev-parse', 'HEAD'])).trim();
  const raw = await runCaptured([
    'gh',
    'run',
    'list',
    '--repo',
    'open-element/openelement',
    '--branch',
    'main',
    '--workflow',
    'autoflow-ci.yml',
    '--limit',
    '20',
    '--json',
    'headSha,status,conclusion,url',
  ]);
  const runs = JSON.parse(raw) as Array<{
    headSha?: string;
    status?: string;
    conclusion?: string;
    url?: string;
  }>;
  const run = runs.find((candidate) => candidate.headSha === head);
  if (!run || run.status !== 'completed' || run.conclusion !== 'success') {
    throw new Error(`Refusing publish-existing: main CI is not successful for HEAD ${head}.`);
  }
  console.log(`Verified main CI for ${head}: ${run.url ?? 'success'}`);
  return run.url;
}

const PUBLISH_STEP_NAMES = new Set([
  'package artifact gate',
  'publish npm packages',
  'verify npm versions and dist-tags',
  'post-publish npm consumer smoke',
  'post-publish third-party Web Component smoke',
  'stage release evidence',
  'commit release evidence',
  'tag release',
  'push tag',
  'create GitHub release',
]);

/** Publish an already-reviewed version from a clean, CI-green main HEAD. */
export function createPublishExistingPlan(targetVersion: string): ReleaseCommandStep[] {
  const releaseSteps = createReleasePlan(targetVersion)
    .filter((step) => PUBLISH_STEP_NAMES.has(step.name));
  return [
    {
      name: 'verify published source version',
      run: () => verifyPublishedSourceVersion(targetVersion),
    },
    {
      name: 'verify main CI success for HEAD',
      run: async (evidence) => {
        // The verified run URL becomes the closure record's
        // successfulReleaseRun on the local publish-existing path.
        evidence.releaseRunUrl = await verifyMainCiSuccessForHead();
      },
    },
    ...releaseSteps,
  ];
}

function isTruthyEnv(name: string): boolean {
  const value = Deno.env.get(name);
  return value !== undefined && value !== '' && value !== 'false';
}

function canCreateGitHubRelease(): boolean {
  // gh release create needs a GitHub token. In CI it is provided automatically.
  return isTruthyEnv('GITHUB_TOKEN') || isTruthyEnv('GH_TOKEN') ||
    Deno.env.get('GITHUB_ACTIONS') === 'true';
}

function canPublishNpm(): boolean {
  // npm publish needs an access token. In CI it comes from secrets.NPM_TOKEN.
  return isTruthyEnv('NPM_TOKEN') || isTruthyEnv('NODE_AUTH_TOKEN');
}

// JSR is no longer a release channel (see #322). The hook is kept exported but
// disabled so no release plan wires a JSR step back in by accident.
export function canPublishJsr(): boolean {
  return false;
}

/**
 * CI evidence step: rebase the release commits onto the latest main. If the
 * pull stops mid-rebase the run cannot self-heal (a re-run fails with
 * "unmerged files"), so print the same style of manual recovery as
 * syncBackToStartBranch before failing the step.
 */
async function pullLatestMainWithRecovery(): Promise<void> {
  try {
    await runCaptured(['git', 'pull', '--rebase', '--autostash', 'origin', 'main']);
  } catch (error) {
    let rebaseInProgress = false;
    try {
      await runCaptured(['git', 'rev-parse', '--verify', 'REBASE_HEAD']);
      rebaseInProgress = true;
    } catch {
      // No rebase in progress.
    }
    const cause = error instanceof Error ? error.message.split('\n')[0] : String(error);
    if (rebaseInProgress) {
      console.error(
        `[release] pull latest main stopped mid-rebase (${cause}); recover manually: ` +
          'resolve the conflicts, then `git rebase --continue && git push origin main` ' +
          '(or `git rebase --abort` to drop the rebase and re-run the release).',
      );
    } else {
      console.error(
        `[release] pull latest main failed (${cause}); recover manually: ` +
          '`git pull --rebase --autostash origin main && git push origin main`, ' +
          'then re-run the release.',
      );
    }
    throw error;
  }
}

export async function assertBranch(expected: string): Promise<void> {
  const branch = (await runCaptured(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  if (branch !== expected) {
    throw new Error(`Refusing release from branch ${branch}; expected ${expected}.`);
  }
}

/**
 * Apply a version bump to the project-constants source text. Returns
 * `undefined` when the file is already at the target (idempotent re-run:
 * PREVIOUS_PACKAGE_VERSION must keep recording the true previous line).
 *
 * ACTIVE_EXECUTION_VERSION is maintained mechanically: the active execution
 * target is the version the active plan is delivering, so after bumping the
 * package line to X it equals X. It only advances past X when a new version
 * plan is written, which is a deliberate human act — setting it to the patch
 * successor here left every post-bump document anchor failing the gates.
 */
export function bumpProjectConstantsText(text: string, version: string): string | undefined {
  const m = text.match(/PACKAGE_VERSION = '([^']+)'/u);
  const current = m ? m[1] : version;
  if (current === version) return undefined;
  let updated = text.replace(/PACKAGE_VERSION = '[^']+'/u, `PACKAGE_VERSION = '${version}'`);
  // Preserve the previous line for historical diagnostics. Anchor replacement
  // uses the module-loaded PACKAGE_VERSION so it always matches the source.
  updated = updated.replace(
    /PREVIOUS_PACKAGE_VERSION = '[^']+'/u,
    `PREVIOUS_PACKAGE_VERSION = '${current}'`,
  );
  updated = updated.replace(
    /ACTIVE_EXECUTION_VERSION = '[^']+'/u,
    `ACTIVE_EXECUTION_VERSION = '${releaseTag(version)}'`,
  );
  return updated;
}

export async function updateProjectConstants(version: string): Promise<void> {
  const path = 'tools/project-constants.ts';
  const text = await Deno.readTextFile(path);
  const updated = bumpProjectConstantsText(text, version);
  if (updated === undefined) {
    // Already at target version; keep reruns idempotent but make the no-op visible.
    // release can be re-run or dispatched after the bump is already merged.
    console.warn(`[release] ${path}: version anchor already equals ${version}; no change made.`);
    return;
  }
  await Deno.writeTextFile(path, updated);
}

/**
 * Extract the theme of the www roadmap timeline entry for a version tag.
 * The entry keeps `version` and `theme` on adjacent lines; anything else
 * means the file shape changed and the release line-prose gate needs an
 * update too, so no match is a loud undefined for the bump side to warn on.
 */
export function roadmapEntryTheme(text: string, versionTag: string): string | undefined {
  const escaped = versionTag.replaceAll('.', '\\.');
  return text.match(new RegExp(`version:\\s*'${escaped}',\\s*theme:\\s*'([^']+)'`, 'u'))?.[1];
}

/**
 * Record the superseded current-line theme into the project-constants
 * source text. Returns `undefined` when already recorded (idempotent).
 */
export function bumpPreviousReleaseThemeText(text: string, theme: string): string | undefined {
  const m = text.match(/PREVIOUS_RELEASE_THEME = '([^']+)'/u);
  if (!m) throw new Error('tools/project-constants.ts: PREVIOUS_RELEASE_THEME anchor missing.');
  if (m[1] === theme) return undefined;
  return text.replace(
    /PREVIOUS_RELEASE_THEME = '[^']+'/u,
    `PREVIOUS_RELEASE_THEME = '${theme}'`,
  );
}

export function buildVersionAnchorReplacements(
  version: string,
): Array<[string, string, string]> {
  const tag = releaseTag(version);
  // The module is loaded before updateProjectConstants() writes the target.
  // PACKAGE_VERSION is therefore the actual source line being replaced.
  const pv = PACKAGE_VERSION;
  const pvTag = PACKAGE_VERSION_TAG;
  // Placeholders keep these entries as plain single-quoted strings (the
  // previous line is a single source of truth via PREVIOUS_*). Resolved below.
  // Entries are kept in sync with the real anchor text in each target file.
  // README.md wraps `**<pv>** (<pvTag>)` across a line break, so that anchor
  // carries an embedded newline. Anchors that no longer exist in a file (e.g.
  // the legacy "removed the legacy" line) are intentionally omitted so the
  // bump never throws on documentation drift. Currency claims that are not
  // head anchors (README/Roadmap "published as" lines, the workflow
  // implementation anchor) are listed here too: the bump must maintain every
  // line the version-anchor and strategic-docs gates enforce, or the gates
  // fail on the release's own post-bump gate run.
  const raw: Array<[string, string, string]> = [
    ['README.md', '`$PV` (`$PVT`', '`$VER` (`$TAG`'],
    [
      'README.md',
      'convergence is published as `$PV`',
      'convergence is published as `$VER`',
    ],
    [
      'README.zh.md',
      '已发布包线为 `$PV`（`$PVT`）',
      '已发布包线为 `$VER`（`$TAG`）',
    ],
    [
      'README.zh.md',
      '五包收敛已作为 `$PV` 发布',
      '五包收敛已作为 `$VER` 发布',
    ],
    [
      'docs/governance/PROJECT_WORKFLOW.md',
      'package line `$PVT`',
      'package line `$TAG`',
    ],
    [
      'docs/governance/PROJECT_WORKFLOW.md',
      'implementation anchor `$PVT`',
      'implementation anchor `$TAG`',
    ],
    [
      'docs/current/VERSION_PLAN.md',
      'Current source package line: `$PVT`',
      'Current source package line: `$TAG`',
    ],
    [
      'docs/current/VERSION_PLAN.md',
      'Current npm registry line: `$PVT`',
      'Current npm registry line: `$TAG`',
    ],
    [
      'www/app/data/version.ts',
      "export const OPENELEMENT_VERSION = '$PVT';",
      "export const OPENELEMENT_VERSION = '$TAG';",
    ],
    [
      'docs/roadmap/ROADMAP.md',
      'Published package line: `$PVT`',
      'Published package line: `$TAG`',
    ],
    [
      'docs/roadmap/ROADMAP.md',
      '`$PV` is the published package line',
      '`$VER` is the published package line',
    ],
    [
      'docs/status/STATUS.md',
      'Repository package line: `$PVT`',
      'Repository package line: `$TAG`',
    ],
    [
      'docs/status/STATUS.md',
      'npm registry line: `$PVT`',
      'npm registry line: `$TAG`',
    ],
    [
      'docs/status/STATUS.md',
      'Active release target: `$PVT`',
      'Active release target: `$TAG`',
    ],
    [
      'docs/roadmap/ROADMAP.md',
      'Active execution target: `$PVT`.',
      'Active execution target: `$TAG`.',
    ],
    [
      'www/app/routes/roadmap.tsx',
      "version: '$PVT'",
      "version: '$TAG'",
    ],
    [
      'www/app/routes/roadmap.tsx',
      "phase.version === '$PVT'",
      "phase.version === '$TAG'",
    ],
  ];
  const resolve = (s: string): string =>
    s
      .replaceAll('$PVT', pvTag)
      .replaceAll('$PV', pv)
      .replaceAll('$TAG', tag)
      .replaceAll('$VER', version);
  return raw.map(([path, from, to]) => [path, resolve(from), resolve(to)]);
}

export async function updateCurrentVersionAnchors(version: string): Promise<void> {
  const replacements = buildVersionAnchorReplacements(version);

  for (const [path, from, to] of replacements) {
    const text = await Deno.readTextFile(path);
    if (text.includes(from)) {
      // Replace the first occurrence only: it is the head-zone declaration the
      // gates enforce. Later occurrences are historical quotes (release notes,
      // roadmap tables) that must keep the old version string.
      if (path === 'www/app/routes/roadmap.tsx' && from.startsWith('version: ')) {
        // The bump rewrites the current-line entry's version but cannot
        // invent the new release's theme. Record the superseded theme so
        // check-www-current-truth fails until a human writes the new one
        // (the 0.41.1 bump shipped alpha.19's theme under the v0.41.1 entry).
        const oldTag = from.match(/version: '([^']+)'/u)?.[1];
        const supersededTheme = oldTag ? roadmapEntryTheme(text, oldTag) : undefined;
        if (supersededTheme) {
          const constantsPath = 'tools/project-constants.ts';
          const constants = await Deno.readTextFile(constantsPath);
          const bumped = bumpPreviousReleaseThemeText(constants, supersededTheme);
          if (bumped !== undefined) await Deno.writeTextFile(constantsPath, bumped);
        }
      }
      await Deno.writeTextFile(path, text.replace(from, to));
      continue;
    }
    if (text.includes(to)) {
      // Already at target - skip. Note there is deliberately no looser
      // "file mentions the version anywhere" skip: that heuristic let a head
      // anchor stay stale whenever the new version appeared elsewhere in the
      // file (e.g. a release-notes link), which is exactly the drift the
      // stale-anchor gate now rejects.
      continue;
    }
    // Anchor drifted (doc no longer carries the expected from-string). Rather
    // than abort the whole release, skip with a warning so a release is never
    // blocked by stale documentation references.
    console.warn(
      `updateCurrentVersionAnchors: ${path} does not contain expected anchor ` +
        `"${from}"; skipping (version bump continues).`,
    );
  }
}

export async function writeReleaseEvidence(evidence: ReleaseEvidence): Promise<void> {
  await Deno.mkdir('docs/release/autoflow3', { recursive: true });
  await Deno.writeTextFile(
    evidenceFile(evidence.targetVersion),
    formatJson(evidence),
  );
}

export function renderReleaseNote(evidence: ReleaseEvidence, manualSections = ''): string {
  const manual = manualSections.trim();
  const lines = [
    `# ${releaseTag(evidence.targetVersion)}`,
    '',
    // Hand-written sections (e.g. curated migration notes) sit between the
    // title and the evidence header; writeReleaseNote preserves them across
    // rewrites instead of clobbering them.
    ...(manual === '' ? [] : [manual, '']),
    `AutoFlow3 patch release evidence: \`${evidence.id}\`.`,
    '',
    `- Previous package line: \`${evidence.currentVersion}\``,
    `- Released package line: \`${evidence.targetVersion}\``,
    `- Policy version: \`${evidence.policyVersion}\``,
    `- Status: \`${evidence.status}\``,
    '',
    '`/@fs/` Windows verification status: see `docs/current/HYDRATION_CONTRACT.md` ' +
    '(Known limitations).',
    '',
    '## Evidence',
    '',
    ...evidence.steps.map((step) =>
      `- ${step.status}: ${step.name}${
        step.exitCode === undefined ? '' : ` (exit ${step.exitCode})`
      }`
    ),
    '',
  ];
  return lines.join('\n');
}

const EVIDENCE_HEADER_MARKER = 'AutoFlow3 patch release evidence:';

/**
 * Extract the hand-written sections of an existing release note: everything
 * between the `# <tag>` title and the evidence header line. Returns '' when
 * the note carries no manual content.
 */
export function extractManualNoteSections(noteText: string): string {
  const lines = noteText.split('\n');
  const titleIndex = lines.findIndex((line) => line.startsWith('# '));
  const headerIndex = lines.findIndex((line) => line.startsWith(EVIDENCE_HEADER_MARKER));
  if (titleIndex === -1 || headerIndex === -1 || headerIndex <= titleIndex + 1) return '';
  return lines.slice(titleIndex + 1, headerIndex).join('\n').trim();
}

export async function writeReleaseNote(evidence: ReleaseEvidence): Promise<void> {
  const path = releaseNoteFile(evidence.targetVersion);
  // Preserve curated sections written between the title and the evidence
  // header (e.g. migration notes); a re-run only regenerates the evidence
  // part of the note.
  let manual = '';
  try {
    manual = extractManualNoteSections(await Deno.readTextFile(path));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  await Deno.writeTextFile(path, renderReleaseNote(evidence, manual));
}

export async function runReleaseStep(
  evidence: ReleaseEvidence,
  step: ReleaseCommandStep,
): Promise<void> {
  const record = evidence.steps.find((item) => item.name === step.name);
  if (!record) throw new Error(`Missing release evidence step: ${step.name}`);

  console.log(
    step.command
      ? `$ ${step.command.join(' ')}${step.cwd ? ` # cwd=${step.cwd}` : ''}`
      : `$ ${step.name}`,
  );
  record.status = 'pending';
  record.startedAt = new Date().toISOString();

  if (!step.command) {
    if (!step.run) throw new Error(`Release step has no command or runner: ${step.name}`);
    await step.run(evidence);
    record.completedAt = new Date().toISOString();
    record.exitCode = 0;
    record.status = 'passed';
    return;
  }

  const command = new Deno.Command(step.command[0], {
    args: step.command.slice(1),
    cwd: step.cwd,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await command.spawn().status;
  record.completedAt = new Date().toISOString();
  record.exitCode = status.code;
  record.status = status.success ? 'passed' : 'failed';
  if (!status.success) {
    throw new Error(`Release step failed: ${step.name} (${status.code})`);
  }
}

export async function runCaptured(command: string[]): Promise<string> {
  const output = await new Deno.Command(command[0], {
    args: command.slice(1),
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  if (!output.success) {
    throw new Error(`${command.join(' ')} failed with exit ${output.code}\n${stdout}${stderr}`);
  }
  return stdout;
}

export async function hasStagedChanges(): Promise<boolean> {
  const status = await new Deno.Command('git', {
    args: ['diff', '--cached', '--quiet'],
  }).spawn().status;
  if (status.code === 0) return false;
  if (status.code === 1) return true;
  throw new Error(`git diff --cached --quiet failed with exit ${status.code}`);
}

/**
 * Commit only when the staged tree differs from HEAD. A re-run whose earlier
 * attempt already created the commit stages nothing; an empty `git commit`
 * exits 1 and would block the resume.
 */
export async function commitIfStaged(message: string): Promise<void> {
  if (!(await hasStagedChanges())) {
    console.log('Nothing staged; skipping commit (already committed or unchanged).');
    return;
  }
  await runCaptured(['git', 'commit', '-m', message]);
}

export async function isAncestorCommit(ancestor: string, descendant: string): Promise<boolean> {
  const result = await new Deno.Command('git', {
    args: ['merge-base', '--is-ancestor', ancestor, descendant],
    stdout: 'null',
    stderr: 'null',
  }).output();
  return result.success;
}

/** Branch the worktree is on, with a sane fallback for detached CI checkouts. */
export async function currentBranchName(fallback: string): Promise<string> {
  const branch = (await runCaptured(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  // A release plan checks out branches explicitly when it switches, so a
  // detached HEAD means the plan never switched: the expected branch applies.
  return branch === 'HEAD' ? fallback : branch;
}

function stepCheckoutTarget(step: ReleaseCommandStep): string | undefined {
  const command = step.command;
  if (command && command[0] === 'git' && command[1] === 'checkout') return command[2];
  return undefined;
}

/** Branches a plan checks out, in plan order. */
export function planCheckoutTargets(plan: ReleaseCommandStep[]): string[] {
  const targets: string[] = [];
  for (const step of plan) {
    const target = stepCheckoutTarget(step);
    if (target !== undefined) targets.push(target);
  }
  return targets;
}

/**
 * Branch the finalize commits (final evidence + closure) must land on. The
 * local plan switches to main for publish/tag and stays there; plans without
 * checkout steps (CI, publish-existing) never leave the expected branch.
 */
export function planFinalizeBranch(plan: ReleaseCommandStep[], fallback: string): string {
  const targets = planCheckoutTargets(plan);
  return targets.length > 0 ? targets[targets.length - 1] : fallback;
}

/**
 * Branches a run may start from. A fresh run must start on the expected
 * branch. A resume reskips the contiguous passed prefix without re-executing
 * it, so it must start on the branch that prefix left behind (the local plan
 * fails mid-run on main, not dev). A fully passed plan only retries the
 * finalize phase, which itself checks out the release branch, so either side
 * of the branch switch is acceptable.
 */
export function planStartBranches(
  plan: ReleaseCommandStep[],
  priorSteps: ReleaseStepEvidence[] | undefined,
  expectedBranch: string,
): string[] {
  if (priorSteps === undefined) return [expectedBranch];
  let branch = expectedBranch;
  let passed = 0;
  for (const step of plan) {
    const prior = priorSteps.find((item) => item.name === step.name);
    if (prior?.status !== 'passed') break;
    passed += 1;
    const target = stepCheckoutTarget(step);
    if (target !== undefined) branch = target;
  }
  if (passed === plan.length && branch !== expectedBranch) {
    return [expectedBranch, branch];
  }
  return [branch];
}

/**
 * Rebuild an evidence record for a re-run from the prior one on disk. The id,
 * startedAt, currentVersion and releaseRunUrl are preserved (the release
 * closure validator compares the tag-time and final evidence ids), passed
 * steps keep their status and timestamps so the executor can skip them, and
 * everything else is reset to pending. Step command/cwd are re-recorded from
 * the current plan — including for passed steps, so a passed step's recorded
 * command describes the current plan, not necessarily the command that
 * actually ran in the earlier attempt.
 */
export function resumeEvidenceFromPrior(
  prior: ReleaseEvidence,
  plan: ReleaseCommandStep[],
): ReleaseEvidence {
  const steps = plan.map((step): ReleaseStepEvidence => {
    const old = prior.steps.find((item) => item.name === step.name);
    if (old?.status === 'passed') {
      return {
        name: step.name,
        command: step.command,
        cwd: step.cwd,
        status: 'passed',
        startedAt: old.startedAt,
        completedAt: old.completedAt,
        exitCode: old.exitCode,
      };
    }
    return { name: step.name, command: step.command, cwd: step.cwd, status: 'pending' };
  });
  return { ...prior, steps, status: 'running', completedAt: undefined };
}

/** Publish-side step names whose passed status proves the publish succeeded. */
const PUBLISH_EVIDENCE_STEP_NAMES = new Set([
  'publish npm packages',
  'verify npm versions and dist-tags',
  'post-publish npm consumer smoke',
  'post-publish third-party Web Component smoke',
]);

/**
 * Whether the evidence shows a successful publish. A release without publish
 * steps (no npm/JSR tokens) has no published artifact to protect, so the
 * check is vacuously true there; the tag-ancestor rule still applies.
 */
export function publishEvidencePassed(evidence: ReleaseEvidence): boolean {
  return evidence.steps
    .filter((step) => PUBLISH_EVIDENCE_STEP_NAMES.has(step.name))
    .every((step) => step.status === 'passed');
}

export type TagAction = 'create' | 'skip-at-head' | 'keep-existing';

export interface TagDecisionInput {
  tag: string;
  head: string;
  existing: string | undefined;
  publishPassed: boolean;
  existingIsAncestor: boolean;
  existingEvidenceId: string | undefined;
  evidenceId: string;
}

/**
 * Decide what the tag step does. Tags are immutable release evidence, so an
 * existing tag is never moved. A conflicting tag may only be kept (not
 * re-created) on the resume path: the previous attempt tagged an ancestor of
 * HEAD after the publish steps passed, and the tag's evidence snapshot belongs
 * to the same release run. The closure validator accepts that because it only
 * requires the tag to be an ancestor of the final evidence commit with a
 * matching evidence id.
 */
export function decideTagAction(input: TagDecisionInput): TagAction {
  if (input.existing === undefined) return 'create';
  if (input.existing === input.head) return 'skip-at-head';
  const resumable = input.publishPassed && input.existingIsAncestor &&
    input.existingEvidenceId === input.evidenceId;
  if (resumable) return 'keep-existing';
  throw new Error(
    `Refusing to overwrite existing tag ${input.tag} at ${input.existing}; HEAD is ${input.head}.`,
  );
}

/** Evidence id recorded at a tag's commit, if the tag carries an evidence file. */
export async function tagEvidenceId(tag: string, version: string): Promise<string | undefined> {
  try {
    const raw = await runCaptured(['git', 'show', `${tag}:${evidenceFile(version)}`]);
    const parsed = JSON.parse(raw) as { id?: unknown };
    return typeof parsed.id === 'string' ? parsed.id : undefined;
  } catch {
    return undefined;
  }
}

// ─── Release executor ────────────────────────────────────────────────────────
// The executor core lives here next to the plan/evidence primitives; mod3.ts
// is only the CLI parser and dispatcher.

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
 * A finalize failure (checkout, commit or push) does not flip the release to
 * failed: publish and tag already succeeded, the evidence on disk stays
 * completed, and re-running the same command resumes at the finalize phase.
 */
export async function finalizeReleaseOnReleaseBranch(
  evidence: ReleaseEvidence,
  plan: ReleaseCommandStep[],
  expectedBranch: string,
): Promise<void> {
  const current = await currentBranchName(expectedBranch);
  const finalizeBranch = planFinalizeBranch(plan, current);
  try {
    if (current !== finalizeBranch) {
      // A resume that skipped every checkout step restarts on the start
      // branch; move to the release branch explicitly before committing.
      // Inside the try so a checkout failure cannot flip a completed release.
      await runCaptured(['git', 'checkout', finalizeBranch]);
    }
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
 *
 * Trust model: the evidence file is written by the operator's own previous
 * run on the same machine, so well-formed JSON with a matching kind/target
 * and a steps array is trusted as-is — there is no integrity check on
 * statuses or provenance. A corrupt (unparseable) file is rejected loudly
 * instead of being silently discarded.
 */
export async function readPriorReleaseEvidence(
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

export async function executeReleasePlan(
  kind: ReleaseEvidence['kind'],
  targetVersion: string,
  approvalId: string | undefined,
  dryRun: boolean,
  plan = createReleasePlan(targetVersion, approvalId),
  expectedBranch = isCI() ? 'main' : 'dev',
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
  await assertCleanWorktree('Refusing release from a dirty worktree');
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
    // finalize lands on the release branch (main), not the start branch. The
    // completed record hits the disk first: a finalize downgrade (checkout,
    // commit or push failure) must not leave the local evidence at "running".
    if (persistsEvidence) {
      await writeReleaseEvidence(evidence);
      await writeReleaseNote(evidence);
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
