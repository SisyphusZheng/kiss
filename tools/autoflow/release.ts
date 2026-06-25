import { AUTOFLOW3_POLICY_VERSION, isCI } from './policy.ts';

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
  const parsed = parseSemver(version);
  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}

export function releaseTag(version: string): string {
  return `v${version}`;
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
    // JSR publish removed in v0.41.0-alpha.1-cleanup (npm-only distribution).
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
          console.warn(
            `Tag ${tag} already exists at ${existing}; forcing to HEAD ${head}.`,
          );
          await runCaptured(['git', 'tag', '-f', tag]);
          return;
        }
        await runCaptured(['git', 'tag', tag]);
      },
    },
    {
      name: 'push tag',
      command: ['git', 'push', '--force', 'origin', tag],
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
            await runCaptured([
              'gh',
              'release',
              'create',
              tag,
              '--title',
              tag,
              '--notes-file',
              note,
            ]);
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
        name: 'push main',
        command: ['git', 'push', 'origin', 'main'],
      },
      ...tagSteps,
    ];
  }

  // Local/manual release: work on dev, then fast-forward main from dev.
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
      name: 'refresh main',
      command: ['git', 'pull', '--ff-only', 'origin', 'main'],
    },
    {
      name: 'sync dev to main',
      command: ['git', 'merge', '--ff-only', 'dev'],
    },
    {
      name: 'push main',
      command: ['git', 'push', 'origin', 'main'],
    },
    ...publishSteps,
    {
      name: 'deploy:pages',
      command: ['deno', 'run', '-A', 'tools/deploy-pages.ts'],
    },
    {
      name: 'smoke:deploy',
      command: ['deno', 'run', '-A', 'tools/smoke-deploy.ts'],
    },
    ...evidenceSteps,
    {
      name: 'push main evidence',
      command: ['git', 'push', 'origin', 'main'],
    },
    {
      name: 'checkout dev',
      command: ['git', 'checkout', 'dev'],
    },
    {
      name: 'sync main evidence to dev',
      command: ['git', 'merge', '--ff-only', 'main'],
    },
    {
      name: 'push dev evidence',
      command: ['git', 'push', 'origin', 'dev'],
    },
    ...tagSteps,
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

export async function assertCleanWorktree(): Promise<void> {
  const output = await runCaptured(['git', 'status', '--porcelain']);
  // Release evidence files are generated by the release flow itself; any
  // changes under docs/release/ should not block publishing.
  const nonEvidenceDirty = output
    .split(/\r?\n/)
    .filter((line) => line.trim() && !/^.{2} docs\/release\//.test(line))
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
  const tag = releaseTag(version);
  const text = await Deno.readTextFile(path);
  const updated = text
    .replace(/PACKAGE_VERSION = '[^']+'/u, `PACKAGE_VERSION = '${version}'`)
    .replace(/ACTIVE_VERSION = '[^']+'/u, `ACTIVE_VERSION = '${tag}'`);
  if (updated === text) {
    // ponytail: already at target version; do not treat as an error so a
    // release can be re-run or dispatched after the bump is already merged.
    return;
  }
  await Deno.writeTextFile(path, updated);
}

export async function updateCurrentVersionAnchors(version: string): Promise<void> {
  const tag = releaseTag(version);
  // ponytail: `from` strings below are hardcoded to the previous release line.
  // They must be manually bumped on each release cycle. If a source file drifts
  // before the `from` strings are updated, the replacement is silently skipped.
  // Consider extracting `previousVersion` as a second parameter.
  const replacements: Array<[string, string, string]> = [
    ['README.md', '`0.41.0-alpha.2` (`v0.41.0-alpha.2`', `\`${version}\` (\`${tag}\``],
    ['README.md', '**0.41.0-alpha.2** (`v0.41.0-alpha.2`)', `**${version}** (\`${tag}\`)`],
    ['README.md', '**v0.41.0-alpha.2**.', `**${tag}**.`],
    [
      'README.zh.md',
      '当前包线：`0.41.0-alpha.2`（`v0.41.0-alpha.2`）',
      `当前包线：\`${version}\`（\`${tag}\`）`,
    ],
    ['README.zh.md', '**0.41.0-alpha.2**（`v0.41.0-alpha.2`）', `**${version}**（\`${tag}\`）`],
    ['README.zh.md', '**v0.41.0-alpha.2**。', `**${tag}**。`],
    [
      'docs/current/VERSION_PLAN.md',
      'v0.41.0-alpha.2 removed the legacy',
      `${tag} removed the legacy`,
    ],
    [
      'docs/governance/PROJECT_WORKFLOW.md',
      'package line `v0.41.0-alpha.2`, active execution line\n`v0.41.0-alpha.2`',
      `package line \`${tag}\`, active execution line\n\`${tag}\``,
    ],
    [
      'docs/roadmap/ROADMAP.md',
      'Current package line: v0.41.0-alpha.2 Cleanup-Train Patch;',
      `Current package line: ${tag} Cleanup-Train Patch;`,
    ],
    [
      'docs/status/STATUS.md',
      'Current Version Line: v0.41.0-alpha.2 Active',
      `Current Version Line: ${tag} Active`,
    ],
    [
      'www/app/data/version.ts',
      "export const OPENELEMENT_VERSION = 'v0.41.0-alpha.2';",
      `export const OPENELEMENT_VERSION = '${tag}';`,
    ],
    [
      'www/app/routes/index/index.tsx',
      'Current public line: v0.41.0-alpha.2',
      `Current public line: ${tag}`,
    ],
    [
      'www/app/routes/index/index.tsx',
      'Current v0.41.0-alpha.2 direction',
      `Current ${tag} direction`,
    ],
    [
      'www/app/routes/guide/getting-started.tsx',
      'active line is v0.41.0-alpha.2,',
      `active line is ${tag},`,
    ],
  ];

  for (const [path, from, to] of replacements) {
    const text = await Deno.readTextFile(path);
    if (text.includes(from)) {
      await Deno.writeTextFile(path, text.replace(from, to));
    } else if (text.includes(to) || (text.includes(version) && text.includes(tag))) {
      // Already at target (exact to-substring or version/tag present) - skip
      continue;
    } else {
      throw new Error(`${path} does not contain expected version anchor: ${from}`);
    }
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
