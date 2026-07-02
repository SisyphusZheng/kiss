type Failure = {
  file: string;
  message: string;
};

const requiredFiles = [
  'docs/governance/PROJECT_WORKFLOW.md',
  'docs/current/VERSION_PLAN.md',
  'docs/current/PACKAGE_SURFACE.md',
  'docs/archive/README.md',
  'CONTRIBUTING.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/ISSUE_TEMPLATE/bug.yml',
  '.github/ISSUE_TEMPLATE/feature.yml',
  '.github/ISSUE_TEMPLATE/architecture.yml',
  '.github/ISSUE_TEMPLATE/release-task.yml',
  '.github/ISSUE_TEMPLATE/docs.yml',
  '.github/agents/README.md',
  '.github/agents/adr-reviewer.agent.md',
  '.github/agents/test-quality.agent.md',
];

const requiredAnchors: Record<string, string[]> = {
  'README.md': ['docs/governance/PROJECT_WORKFLOW.md'],
  'CONTRIBUTING.md': ['docs/governance/PROJECT_WORKFLOW.md'],
  'docs/status/STATUS.md': ['docs/governance/PROJECT_WORKFLOW.md', 'docs/current/VERSION_PLAN.md'],
  'docs/roadmap/ROADMAP.md': ['docs/governance/PROJECT_WORKFLOW.md'],
  'docs/current/VERSION_PLAN.md': [
    'openElement = Web Components Fullstack Framework + Basic Element',
    'docs/current/PACKAGE_SURFACE.md',
    'ADR-0101',
    'ADR-0104',
    'ADR-0105',
    'AutoFlow3',
    'Preact',
    'SignalEngine',
    'cleanup train',
    'nitro:proof:node',
    'nitro:proof:workers',
    'Package Graph Collapse',
    'Test Matrix',
  ],
  'docs/current/PACKAGE_SURFACE.md': [
    'openElement = Web Components Fullstack Framework + Basic Element',
    'supporting packages = Protocols + UI + official stack adapters',
    'product',
    'supporting',
    '11-package',
    '@openelement/element',
    'ADR-0101',
    'ADR-0105',
  ],
  'docs/archive/README.md': ['git history', 'legacy docs'],
  '.github/PULL_REQUEST_TEMPLATE.md': ['docs/governance/PROJECT_WORKFLOW.md'],
  '.github/agents/README.md': ['docs/governance/PROJECT_WORKFLOW.md'],
};

const failures: Failure[] = [];

async function tracked(path: string): Promise<boolean> {
  const command = new Deno.Command('git', {
    args: ['ls-files', path],
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  if (!output.success) {
    failures.push({ file: path, message: 'could not inspect git tracking state' });
    return false;
  }
  return new TextDecoder().decode(output.stdout).trim().length > 0;
}

async function read(file: string): Promise<string | undefined> {
  try {
    return await Deno.readTextFile(file);
  } catch {
    failures.push({ file, message: 'missing required workflow file' });
    return undefined;
  }
}

for (const file of requiredFiles) {
  await read(file);
}

for (const forbidden of ['docs/sop/v0.40.0', 'docs/next/v0.40.0']) {
  if (await tracked(forbidden)) {
    failures.push({
      file: forbidden,
      message: 'v0.40 must use docs/current/VERSION_PLAN.md instead of SOP/NextVersion docs',
    });
  }
}

for (const [file, anchors] of Object.entries(requiredAnchors)) {
  const text = await read(file);
  if (text === undefined) continue;
  for (const anchor of anchors) {
    if (!text.includes(anchor)) {
      failures.push({ file, message: `missing workflow anchor: ${anchor}` });
    }
  }
}

if (failures.length > 0) {
  console.error('Project workflow check failed:');
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.message}`);
  }
  Deno.exit(1);
}

console.log('Project workflow check passed for the current Version Plan.');
