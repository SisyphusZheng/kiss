import { AUTOFLOW3_POLICY_VERSION, isCI } from './policy.ts';
import { PREVIOUS_PACKAGE_VERSION, PREVIOUS_PACKAGE_VERSION_TAG } from '../project-constants.ts';

export { isCI as isCIEnv };

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
  kind: 'patch-release' | 'approved-release';
  policyVersion: string;
  currentVersion: string;
  targetVersion: string;
  status: 'planned' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  approvalId?: string;
  steps: ReleaseStepEvidence[];
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
      command: ['git', 'commit', '-m', `docs(release): record ${tag} evidence`],
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
          name: 'post-publish npm consumer smoke',
          command: ['deno', 'run', '-A', 'tools/consumer-smoke.ts', '--version', targetVersion],
        },
      ]
      : []),
    ...(canPublishJsr()
      ? [
        {
          name: 'publish jsr packages',
          command: ['deno', 'task', 'publish:jsr:release'],
        },
      ]
      : []),
  ];
  const tagSteps: ReleaseCommandStep[] = [
    {
      name: 'tag release',
      run: async () => {
        const head = (await runCaptured(['git', 'rev-parse', 'HEAD'])).trim();
        let existing: string | undefined;
        try {
          existing = (await runCaptured(['git', 'rev-parse', '--verify', tag])).trim();
        } catch {
          // Tag does not exist yet.
        }
        if (existing === head) {
          console.log(`Tag ${tag} already exists at HEAD; skipping.`);
          return;
        }
        if (existing) {
          throw new Error(
            `Refusing to overwrite existing tag ${tag} at ${existing}; HEAD is ${head}.`,
          );
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
      ],
    },
    {
      name: 'commit release bump',
      command: [
        'sh',
        '-c',
        `git diff --cached --quiet || git commit -m '${commitMessage.replace(/'/g, "'\\''")}'`,
      ],
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
        command: ['git', 'pull', '--rebase', '--autostash', 'origin', 'main'],
      },
      {
        name: 'push main evidence',
        command: ['git', 'push', 'origin', 'main'],
      },
      ...tagSteps,
    ];
  }

  // Local/manual release: bump on dev, fast-forward main from dev in a single
  // transition, then keep dev in sync with main. This removes the redundant
  // pull/push round-trips that previously bounced between dev and main and
  // reduces the chance of a half-released state.
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
    {
      name: 'checkout dev',
      command: ['git', 'checkout', 'dev'],
    },
    {
      name: 'sync dev from main (fast-forward)',
      command: ['git', 'merge', '--ff-only', 'main'],
    },
    {
      name: 'push dev',
      command: ['git', 'push', 'origin', 'dev'],
    },
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

function canPublishJsr(): boolean {
  // JSR is no longer a release channel (see #322). Keep the hook present but
  // disabled so the release flow cannot publish to JSR by accident.
  return false;
}

export async function assertCleanWorktree(): Promise<void> {
  const output = await runCaptured(['git', 'status', '--porcelain']);
  // Release evidence files are generated by the release flow itself; any
  // changes under docs/release/ should not block publishing.
  const nonEvidenceDirty = output
    .split(/\r?\n/)
    .filter((line) => {
      if (!line.trim()) return false;
      const path = line.slice(3);
      return !path.startsWith('docs/release/') &&
        !path.startsWith('vendor/') &&
        !path.startsWith('www/app/data/_generated-') &&
        path !== 'www/public/search-index.json' &&
        path !== 'deno.lock' &&
        path !== 'examples/deno-desktop-mastodon/deno.lock';
    })
    .join('\n');
  if (nonEvidenceDirty) {
    throw new Error(`Refusing release from a dirty worktree:\n${nonEvidenceDirty}`);
  }
}

export async function assertBranch(expected: string): Promise<void> {
  const branch = (await runCaptured(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  if (branch !== expected) {
    throw new Error(`Refusing release from branch ${branch}; expected ${expected}.`);
  }
}

export async function updateProjectConstants(version: string): Promise<void> {
  const path = 'tools/project-constants.ts';
  const text = await Deno.readTextFile(path);
  const m = text.match(/PACKAGE_VERSION = '([^']+)'/u);
  const previous = m ? m[1] : version;
  let updated = text.replace(/PACKAGE_VERSION = '[^']+'/u, `PACKAGE_VERSION = '${version}'`);
  // Keep PREVIOUS_PACKAGE_VERSION in sync so buildVersionAnchorReplacements()
  // knows which line to replace on the next bump (single source of truth).
  updated = updated.replace(
    /PREVIOUS_PACKAGE_VERSION = '[^']+'/u,
    `PREVIOUS_PACKAGE_VERSION = '${previous}'`,
  );
  if (updated === text) {
    // ponytail: already at target version; do not treat as an error so a
    // release can be re-run or dispatched after the bump is already merged.
    return;
  }
  await Deno.writeTextFile(path, updated);
}

export function buildVersionAnchorReplacements(
  version: string,
): Array<[string, string, string]> {
  const tag = releaseTag(version);
  const pv = PREVIOUS_PACKAGE_VERSION;
  const pvTag = PREVIOUS_PACKAGE_VERSION_TAG;
  // Placeholders keep these entries as plain single-quoted strings (the
  // previous line is a single source of truth via PREVIOUS_*). Resolved below.
  // Entries are kept in sync with the real anchor text in each target file.
  // README.md wraps `**<pv>** (<pvTag>)` across a line break, so that anchor
  // carries an embedded newline. Anchors that no longer exist in a file (e.g.
  // the legacy "removed the legacy" line) are intentionally omitted so the
  // bump never throws on documentation drift.
  const raw: Array<[string, string, string]> = [
    ['README.md', '`$PV` (`$PVT`', '`$VER` (`$TAG`'],
    [
      'README.md',
      '**$PV**\n(`$PVT`)',
      '**$VER**\n(`$TAG`)',
    ],
    [
      'README.zh.md',
      '当前包线：`$PV`（`$PVT` 发布）',
      '当前包线：`$VER`（`$TAG` 发布）',
    ],
    [
      'docs/governance/PROJECT_WORKFLOW.md',
      'package line `$PVT`',
      'package line `$TAG`',
    ],
    [
      'www/app/data/version.ts',
      "export const OPENELEMENT_VERSION = '$PVT';",
      "export const OPENELEMENT_VERSION = '$TAG';",
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
  const tag = releaseTag(version);
  const replacements = buildVersionAnchorReplacements(version);

  for (const [path, from, to] of replacements) {
    const text = await Deno.readTextFile(path);
    if (text.includes(from)) {
      await Deno.writeTextFile(path, text.replace(from, to));
      continue;
    }
    if (text.includes(to) || (text.includes(version) && text.includes(tag))) {
      // Already at target (exact to-substring or version/tag present) - skip
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
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
}

export async function writeReleaseNote(evidence: ReleaseEvidence): Promise<void> {
  const lines = [
    `# ${releaseTag(evidence.targetVersion)}`,
    '',
    `AutoFlow3 patch release evidence: \`${evidence.id}\`.`,
    '',
    `- Previous package line: \`${evidence.currentVersion}\``,
    `- Released package line: \`${evidence.targetVersion}\``,
    `- Policy version: \`${evidence.policyVersion}\``,
    `- Status: \`${evidence.status}\``,
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
  await Deno.writeTextFile(releaseNoteFile(evidence.targetVersion), lines.join('\n'));
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
