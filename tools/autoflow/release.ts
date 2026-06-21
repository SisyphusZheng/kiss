import { AUTOFLOW3_POLICY_VERSION } from './policy.ts';

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
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
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
  return [
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
      name: 'run release gates after bump',
      command: ['deno', 'task', 'autoflow:ci'],
    },
    {
      name: 'commit release bump',
      command: ['git', 'commit', '-m', commitMessage],
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
    {
      name: 'pack dry-run',
      command: ['deno', 'task', 'pack:dry-run'],
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
    {
      name: 'deploy:pages',
      command: ['deno', 'run', '-A', 'tools/deploy-pages.ts'],
    },
    {
      name: 'smoke:deploy',
      command: ['deno', 'run', '-A', 'tools/smoke-deploy.ts'],
    },
    {
      name: 'stage release evidence',
      command: ['git', 'add', evidenceFile(targetVersion), note],
    },
    {
      name: 'commit release evidence',
      command: ['git', 'commit', '-m', `docs(release): record ${tag} evidence`],
    },
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
    {
      name: 'tag release',
      command: ['git', 'tag', tag],
    },
    {
      name: 'push tag',
      command: ['git', 'push', 'origin', tag],
    },
    ...(canCreateGitHubRelease()
      ? [
        {
          name: 'create GitHub release',
          command: ['gh', 'release', 'create', tag, '--title', tag, '--notes-file', note],
        },
      ]
      : []),
  ];
}

export function createPatchReleasePlan(targetVersion: string): ReleaseCommandStep[] {
  return createReleasePlan(targetVersion);
}

function canCreateGitHubRelease(): boolean {
  // gh release create needs a GitHub token. In CI it is provided automatically.
  return Boolean(
    Deno.env.get('GITHUB_TOKEN') || Deno.env.get('GH_TOKEN') || Deno.env.get('GITHUB_ACTIONS'),
  );
}

function canPublishNpm(): boolean {
  // npm publish needs an access token. In CI it comes from secrets.NPM_TOKEN.
  return Boolean(Deno.env.get('NPM_TOKEN') || Deno.env.get('NODE_AUTH_TOKEN'));
}

export async function assertCleanWorktree(): Promise<void> {
  const output = await runCaptured(['git', 'status', '--porcelain']);
  if (output.trim()) {
    throw new Error(`Refusing release from a dirty worktree:\n${output}`);
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
    throw new Error(`${path} did not contain expected version constants.`);
  }
  await Deno.writeTextFile(path, updated);
}

export async function updateCurrentVersionAnchors(version: string): Promise<void> {
  const tag = releaseTag(version);
  const replacements: Array<[string, string, string]> = [
    ['README.md', '`0.39.0` (`v0.39.0`', `\`${version}\` (\`${tag}\``],
    ['README.md', '**0.39.0** (`v0.39.0`)', `**${version}** (\`${tag}\`)`],
    ['README.md', '**v0.39.0**.', `**${tag}**.`],
    ['README.zh.md', '`0.39.0`（`v0.39.0` release）', `\`${version}\`（\`${tag}\` release）`],
    ['README.zh.md', '**0.39.0**（`v0.39.0`）', `**${version}**（\`${tag}\`）`],
    ['README.zh.md', '**v0.39.0**。', `**${tag}**。`],
    ['docs/current/VERSION_PLAN.md', '`v0.39.0`', `\`${tag}\``],
    [
      'docs/governance/PROJECT_WORKFLOW.md',
      'package line `v0.39.0`, active execution line\n`v0.39.0`',
      `package line \`${tag}\`, active execution line\n\`${tag}\``,
    ],
    [
      'docs/roadmap/ROADMAP.md',
      'Current package line: v0.39.0 Framework RC + Four-Product Matrix Reset.',
      `Current package line: ${tag} Framework RC + Four-Product Matrix Reset.`,
    ],
    [
      'docs/status/STATUS.md',
      'package version `0.39.0`',
      `package version \`${version}\``,
    ],
    [
      'docs/status/STATUS.md',
      '`0.39.0` is complete',
      `\`${version}\` is complete`,
    ],
    [
      'docs/status/STATUS.md',
      'All 20 workspace packages are aligned to **0.39.0**',
      `All 20 workspace packages are aligned to **${version}**`,
    ],
    [
      'www/app/data/version.ts',
      "export const OPENELEMENT_VERSION = 'v0.39.0';",
      `export const OPENELEMENT_VERSION = '${tag}';`,
    ],
    [
      'www/app/routes/index/index.tsx',
      'Active execution: v0.39.0.',
      `Active execution: ${tag}.`,
    ],
    [
      'www/app/routes/index/index.tsx',
      'openElement 0.38.0 / v0.39.0 active',
      `openElement 0.38.0 / ${tag} active`,
    ],
    [
      'www/app/routes/guide/getting-started.tsx',
      'active line v0.39.0.',
      `active line ${tag}.`,
    ],
  ];

  for (const [path, from, to] of replacements) {
    const text = await Deno.readTextFile(path);
    if (!text.includes(from)) {
      throw new Error(`${path} does not contain expected version anchor: ${from}`);
    }
    await Deno.writeTextFile(path, text.replace(from, to));
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
