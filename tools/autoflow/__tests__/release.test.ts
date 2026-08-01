import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertThrows,
} from 'jsr:@std/assert@^1.0.0';
import { existsSync } from 'node:fs';
import {
  buildVersionAnchorReplacements,
  bumpProjectConstantsText,
  commitIfStaged,
  createPreparePlan,
  createPublishExistingPlan,
  createReleaseEvidence,
  createReleasePlan,
  currentWorkflowRunUrl,
  decideTagAction,
  evidenceCurrentVersion,
  finalizeReleaseOnReleaseBranch,
  githubReleaseUrl,
  mergeClosureSection,
  planFinalizeBranch,
  planStartBranches,
  prepareRecordFile,
  publishEvidencePassed,
  type ReleaseCommandStep,
  type ReleaseEvidence,
  renderClosureSection,
  renderReleaseNote,
  resumeEvidenceFromPrior,
  verifyPrepareRecord,
  writeReleaseEvidence,
  writeReleaseNote,
} from '../release.ts';
import {
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
  PREVIOUS_PACKAGE_VERSION,
  PREVIOUS_PACKAGE_VERSION_TAG,
} from '../../project-constants.ts';

Deno.test('buildVersionAnchorReplacements: covers all live versioned files', () => {
  const version = '9.9.9';
  const tag = `v${version}`;
  const reps = buildVersionAnchorReplacements(version);

  // Anchors are kept in sync with the real anchor text in each file. Dead
  // anchors (doc drift) are intentionally omitted, so this count reflects the
  // files that currently carry the previous package line.
  assertEquals(reps.length, 18);

  const seen = new Set<string>();
  for (const [path, from, to] of reps) {
    assert(existsSync(path), `versioned file must exist: ${path}`);
    const text = Deno.readTextFileSync(path);
    // Either the from-anchor is present (will be replaced on bump) or the file
    // already carries the target (idempotent re-run is safe).
    assert(
      text.includes(from) || text.includes(to) ||
        (text.includes(version) && text.includes(tag)) ||
        text.includes(PACKAGE_VERSION) || text.includes(PACKAGE_VERSION_TAG),
      `${path} must contain anchor or already be at target: ${from}`,
    );
    assert(
      to.includes(version) || to.includes(tag),
      `to must target ${version}: ${to}`,
    );
    seen.add(path);
  }

  assert(seen.has('README.md'));
  assert(seen.has('README.zh.md'));
  assert(seen.has('www/app/data/version.ts'));
});

Deno.test('buildVersionAnchorReplacements: from side derives from the loaded source version', () => {
  const reps = buildVersionAnchorReplacements('1.2.3');
  for (const [, from] of reps) {
    assert(
      from.includes(PACKAGE_VERSION) || from.includes(PACKAGE_VERSION_TAG),
      `from must derive from PACKAGE_VERSION: ${from}`,
    );
  }
  assertEquals(PREVIOUS_PACKAGE_VERSION_TAG, `v${PREVIOUS_PACKAGE_VERSION}`);
});

Deno.test('buildVersionAnchorReplacements: every target carries the previous or current line', () => {
  // Coverage gate: every file that is a replacement target must still carry
  // the previous package line (or its tag), so the bump has something to
  // replace and no versioned file silently drifts out of coverage.
  const reps = buildVersionAnchorReplacements(PACKAGE_VERSION);
  const targets = new Set(reps.map(([path]) => path));
  for (const path of targets) {
    const text = Deno.readTextFileSync(path);
    assert(
      text.includes(PREVIOUS_PACKAGE_VERSION) ||
        text.includes(PREVIOUS_PACKAGE_VERSION_TAG) ||
        text.includes(PACKAGE_VERSION) || text.includes(PACKAGE_VERSION_TAG),
      `${path} is a replacement target but carries neither the previous nor current line`,
    );
  }
  // README carries one head package-line anchor plus the currency claim the
  // strategic-docs gate enforces ("convergence is published as").
  const readmeReps = reps.filter(([p]) => p === 'README.md');
  assertEquals(readmeReps.length, 2);
});

Deno.test('createReleasePlan: rejects shell metacharacters in approval ids', () => {
  assertThrows(
    () => createReleasePlan('0.41.0-beta.4', 'approval; touch /tmp/pwned'),
    Error,
    'Invalid approval id',
  );
});

const CONSTANTS_FIXTURE = [
  "export const PACKAGE_VERSION = '0.41.0-alpha.16';",
  'export const PACKAGE_VERSION_TAG = `v${PACKAGE_VERSION}`;',
  "export const ACTIVE_EXECUTION_VERSION = 'v0.41.0-alpha.17';",
  "export const PREVIOUS_PACKAGE_VERSION = '0.41.0-alpha.15';",
  '',
].join('\n');

Deno.test('bumpProjectConstantsText: bump maintains previous line and active execution target', () => {
  const updated = bumpProjectConstantsText(CONSTANTS_FIXTURE, '0.41.0-alpha.17');
  assert(updated !== undefined);
  assert(updated.includes("PACKAGE_VERSION = '0.41.0-alpha.17'"));
  assert(updated.includes("PREVIOUS_PACKAGE_VERSION = '0.41.0-alpha.16'"));
  // The active execution target is the version the active plan is delivering:
  // the bump target itself, until a new plan advances it.
  assert(updated.includes("ACTIVE_EXECUTION_VERSION = 'v0.41.0-alpha.17'"));
});

Deno.test('bumpProjectConstantsText: stable bump sets the active target to the bump target', () => {
  const fromPrevious = bumpProjectConstantsText(CONSTANTS_FIXTURE, '0.41.0');
  assert(fromPrevious !== undefined);
  assert(fromPrevious.includes("PACKAGE_VERSION = '0.41.0'"));
  assert(fromPrevious.includes("PREVIOUS_PACKAGE_VERSION = '0.41.0-alpha.16'"));
  assert(fromPrevious.includes("ACTIVE_EXECUTION_VERSION = 'v0.41.0'"));
});

Deno.test('bumpProjectConstantsText: re-running a bump is a no-op and keeps the true previous line', () => {
  const once = bumpProjectConstantsText(CONSTANTS_FIXTURE, '0.41.0-alpha.17');
  assert(once !== undefined);
  // A second bump to the same target must not clobber PREVIOUS_PACKAGE_VERSION
  // with the target itself (the old idempotency hole).
  assertEquals(bumpProjectConstantsText(once, '0.41.0-alpha.17'), undefined);
  assert(once.includes("PREVIOUS_PACKAGE_VERSION = '0.41.0-alpha.16'"));
});

Deno.test('two-phase release: prepare never publishes, tags, or pushes main', () => {
  const steps = createPreparePlan('0.41.0-alpha.11', 'docs/current/VERSION_PLAN.md');
  const names = steps.map((step) => step.name);
  const commands = steps.map((step) => step.command?.join(' ') ?? '');
  assert(names.includes('bump patch version'));
  assert(names.includes('regenerate versioned artifacts'));
  assert(names.includes('run release gates after bump'));
  assertFalse(names.includes('publish npm packages'));
  assertFalse(names.includes('tag release'));
  assertFalse(commands.some((command) => command.includes('git push')));
  const stage = steps.find((step) => step.name === 'stage release bump');
  assert(stage?.command?.includes('packages/create/src/version.ts'));
});

Deno.test('two-phase release: publish-existing never bumps and verifies main CI first', () => {
  const originalNpmToken = Deno.env.get('NPM_TOKEN');
  const originalGitHubToken = Deno.env.get('GITHUB_TOKEN');
  Deno.env.set('NPM_TOKEN', 'test-token');
  Deno.env.set('GITHUB_TOKEN', 'test-token');
  try {
    const steps = createPublishExistingPlan('0.41.0-alpha.11');
    const names = steps.map((step) => step.name);
    assertEquals(names[0], 'verify published source version');
    assertEquals(names[1], 'verify main CI success for HEAD');
    assert(names.includes('publish npm packages'));
    assert(names.includes('verify npm versions and dist-tags'));
    assert(names.includes('post-publish npm consumer smoke'));
    assert(names.includes('post-publish third-party Web Component smoke'));
    assert(names.indexOf('tag release') > names.indexOf('post-publish npm consumer smoke'));
    assert(
      names.indexOf('tag release') > names.indexOf('post-publish third-party Web Component smoke'),
    );
    assertFalse(names.includes('bump patch version'));
  } finally {
    if (originalNpmToken === undefined) Deno.env.delete('NPM_TOKEN');
    else Deno.env.set('NPM_TOKEN', originalNpmToken);
    if (originalGitHubToken === undefined) Deno.env.delete('GITHUB_TOKEN');
    else Deno.env.set('GITHUB_TOKEN', originalGitHubToken);
  }
});

Deno.test('two-phase release: prepare leaves a durable gated prepare record (#684)', () => {
  const steps = createPreparePlan('0.41.0-alpha.11', 'docs/current/VERSION_PLAN.md');
  const names = steps.map((step) => step.name);
  const gates = names.indexOf('run release gates after bump');
  // The record is written only after the release gates passed, then staged and
  // committed so publish-existing can verify it from a main checkout.
  assert(gates !== -1);
  assert(names.indexOf('record prepare evidence') > gates);
  assert(names.indexOf('stage prepare record') > names.indexOf('record prepare evidence'));
  assert(names.indexOf('commit prepare record') > names.indexOf('stage prepare record'));
  const stage = steps.find((step) => step.name === 'stage prepare record');
  assertEquals(stage?.command, ['git', 'add', prepareRecordFile('0.41.0-alpha.11')]);
});

Deno.test('two-phase release: publish-existing verifies the prepare record before publishing (#684)', () => {
  const steps = createPublishExistingPlan('0.41.0-alpha.11');
  const names = steps.map((step) => step.name);
  assertEquals(names[0], 'verify published source version');
  assertEquals(names[1], 'verify main CI success for HEAD');
  assertEquals(names[2], 'verify prepare record');
  // The proof is checked before any publish-side step runs.
  assert(names.indexOf('verify prepare record') < names.indexOf('package artifact gate'));
});

function completedPrepareRecord(overrides: Partial<ReleaseEvidence> = {}): ReleaseEvidence {
  return {
    id: `release-prepare-v${PACKAGE_VERSION}-test-run`,
    kind: 'release-prepare',
    policyVersion: 'autoflow3-v0',
    currentVersion: PREVIOUS_PACKAGE_VERSION,
    targetVersion: PACKAGE_VERSION,
    status: 'completed',
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T00:10:00.000Z',
    steps: [
      { name: 'bump patch version', status: 'passed' },
      { name: 'run release gates after bump', status: 'passed' },
      { name: 'record prepare evidence', status: 'passed' },
    ],
    ...overrides,
  };
}

async function withPrepareRecordDir(
  body: string | undefined,
  fn: () => Promise<unknown>,
): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'prepare-record-verify-' });
  const previousCwd = Deno.cwd();
  try {
    Deno.chdir(root);
    if (body !== undefined) {
      await Deno.mkdir('docs/release/autoflow3', { recursive: true });
      await Deno.writeTextFile(prepareRecordFile(PACKAGE_VERSION), body);
    }
    await fn();
  } finally {
    Deno.chdir(previousCwd);
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('verifyPrepareRecord: a valid completed record passes, including the backfill shape', async () => {
  // Normal flow: the prepare ran before the bump, so it started from the line
  // the current source records as its previous line.
  await withPrepareRecordDir(
    JSON.stringify(completedPrepareRecord()),
    () => verifyPrepareRecord(PACKAGE_VERSION),
  );
  // Backfill flow: a prepare re-run against an already-bumped source records
  // the bumped line as its starting point (how a missing record is repaired).
  await withPrepareRecordDir(
    JSON.stringify(completedPrepareRecord({ currentVersion: PACKAGE_VERSION })),
    () => verifyPrepareRecord(PACKAGE_VERSION),
  );
});

Deno.test('verifyPrepareRecord: a missing record refuses with the remedy', async () => {
  await withPrepareRecordDir(undefined, async () => {
    const error = await assertRejects(
      () => verifyPrepareRecord(PACKAGE_VERSION),
      Error,
      'no prepare record',
    );
    assert(error.message.includes('autoflow:release-prepare'));
  });
});

Deno.test('verifyPrepareRecord: a corrupt record is rejected loudly', async () => {
  await withPrepareRecordDir('{ not json', async () => {
    const error = await assertRejects(
      () => verifyPrepareRecord(PACKAGE_VERSION),
      Error,
      'is not readable JSON',
    );
    assert(error.message.includes(prepareRecordFile(PACKAGE_VERSION)));
  });
});

Deno.test('verifyPrepareRecord: kind, status, and target must match the release', async () => {
  await withPrepareRecordDir(
    JSON.stringify(completedPrepareRecord({ kind: 'patch-release' })),
    () => assertRejects(() => verifyPrepareRecord(PACKAGE_VERSION), Error, 'not a completed'),
  );
  await withPrepareRecordDir(
    JSON.stringify(completedPrepareRecord({ status: 'running' })),
    () => assertRejects(() => verifyPrepareRecord(PACKAGE_VERSION), Error, 'not a completed'),
  );
  await withPrepareRecordDir(
    JSON.stringify(completedPrepareRecord({ targetVersion: '9.9.9' })),
    () => assertRejects(() => verifyPrepareRecord(PACKAGE_VERSION), Error, 'not a completed'),
  );
});

Deno.test('verifyPrepareRecord: the recorded source line must match the current source', async () => {
  // A record that started from a line the current source never knew proves the
  // bump on main was not produced by the recorded prepare.
  await withPrepareRecordDir(
    JSON.stringify(completedPrepareRecord({ currentVersion: '9.9.9' })),
    () =>
      assertRejects(
        () => verifyPrepareRecord(PACKAGE_VERSION),
        Error,
        'not produced by the recorded prepare',
      ),
  );
});

Deno.test('verifyPrepareRecord: the record must prove the release gates ran', async () => {
  await withPrepareRecordDir(
    JSON.stringify(
      completedPrepareRecord({
        steps: [{ name: 'run release gates after bump', status: 'failed' }],
      }),
    ),
    () =>
      assertRejects(
        () => verifyPrepareRecord(PACKAGE_VERSION),
        Error,
        'does not record a passed run of the release gates',
      ),
  );
});

Deno.test('evidenceCurrentVersion: publish-existing records the true previous line', () => {
  // publish-existing runs after the bump: PACKAGE_VERSION already equals the
  // target, so the previous line must come from PREVIOUS_PACKAGE_VERSION.
  assertEquals(evidenceCurrentVersion('publish-existing'), PREVIOUS_PACKAGE_VERSION);
  assertEquals(evidenceCurrentVersion('patch-release'), PACKAGE_VERSION);
  assertEquals(evidenceCurrentVersion('approved-release'), PACKAGE_VERSION);
  assertEquals(evidenceCurrentVersion('release-prepare'), PACKAGE_VERSION);
});

Deno.test('renderReleaseNote: publish-existing head names previous and released lines', () => {
  const target = '9.9.9';
  const evidence = createReleaseEvidence(
    'publish-existing',
    evidenceCurrentVersion('publish-existing'),
    target,
  );
  const note = renderReleaseNote(evidence);
  assert(note.includes(`Previous package line: \`${PREVIOUS_PACKAGE_VERSION}\``));
  assert(note.includes(`Released package line: \`${target}\``));
  assert(!note.includes(`Previous package line: \`${target}\``));
});

Deno.test('currentWorkflowRunUrl: builds the run URL only from full CI env', () => {
  const env = (values: Record<string, string>) => (name: string) => values[name];
  assertEquals(
    currentWorkflowRunUrl(env({
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_REPOSITORY: 'open-element/openelement',
      GITHUB_RUN_ID: '12345',
    })),
    'https://github.com/open-element/openelement/actions/runs/12345',
  );
  assertEquals(
    currentWorkflowRunUrl(env({ GITHUB_REPOSITORY: 'open-element/openelement' })),
    undefined,
  );
  assertEquals(currentWorkflowRunUrl(() => undefined), undefined);
});

Deno.test('githubReleaseUrl: defaults to the project origin and honors CI env', () => {
  assertEquals(
    githubReleaseUrl('v1.2.3', () => undefined),
    'https://github.com/open-element/openelement/releases/tag/v1.2.3',
  );
  assertEquals(
    githubReleaseUrl(
      'v1.2.3',
      (name) => ({ GITHUB_SERVER_URL: 'https://ghe.example', GITHUB_REPOSITORY: 'a/b' })[name],
    ),
    'https://ghe.example/a/b/releases/tag/v1.2.3',
  );
});

const CLOSURE_RECORD = {
  tagCommit: 'aaa111',
  finalEvidenceCommit: 'bbb222',
  successfulReleaseRun: 'https://github.com/open-element/openelement/actions/runs/42',
  releaseUrl: 'https://github.com/open-element/openelement/releases/tag/v9.9.9',
};

Deno.test('renderClosureSection: carries every closure field the validator requires', () => {
  const section = renderClosureSection(CLOSURE_RECORD);
  assert(section.includes('## Durable closure'));
  assert(section.includes(CLOSURE_RECORD.tagCommit));
  assert(section.includes(CLOSURE_RECORD.finalEvidenceCommit));
  assert(section.includes(CLOSURE_RECORD.successfulReleaseRun));
  assert(section.includes(CLOSURE_RECORD.releaseUrl));
});

Deno.test('mergeClosureSection: appends once and replaces on rerun (idempotent)', () => {
  const note = '# v9.9.9\n\n- Status: `completed`\n';
  const once = mergeClosureSection(note, CLOSURE_RECORD);
  assert(once.startsWith(note.trimEnd()));
  assert(once.includes(CLOSURE_RECORD.finalEvidenceCommit));

  const updated = { ...CLOSURE_RECORD, finalEvidenceCommit: 'ccc333' };
  const twice = mergeClosureSection(once, updated);
  assert(!twice.includes('bbb222'));
  assert(twice.includes('ccc333'));
  assertEquals(twice.match(/## Durable closure/g)?.length, 1);
});

Deno.test('buildVersionAnchorReplacements: bump updates the VERSION_PLAN head lines', () => {
  const version = '9.9.9';
  const reps = buildVersionAnchorReplacements(version)
    .filter(([path]) => path === 'docs/current/VERSION_PLAN.md');
  assertEquals(reps.length, 2);

  // Simulate the bump against the plan's real head shape: the two header
  // lines move to the target while the active release target is untouched.
  const head = [
    `# v${version} — plan`,
    '',
    `> Current source package line: \`${PACKAGE_VERSION_TAG}\`\\`,
    `> Current npm registry line: \`${PACKAGE_VERSION_TAG}\`\\`,
    `> Active release target: \`v${version}\`\\`,
  ].join('\n');
  let updated = head;
  for (const [, from, to] of reps) updated = updated.replace(from, to);
  assert(updated.includes(`Current source package line: \`v${version}\``));
  assert(updated.includes(`Current npm registry line: \`v${version}\``));
  assert(!updated.includes(`Current source package line: \`${PACKAGE_VERSION_TAG}\``));
});

Deno.test('buildVersionAnchorReplacements: covers the currency claims the gates enforce', () => {
  const reps = buildVersionAnchorReplacements(PACKAGE_VERSION);
  const byPath = (path: string) => reps.filter(([p]) => p === path).length;
  // Every head anchor and every "published as"-style currency claim the
  // version-anchor and strategic-docs gates check must be bump-maintained.
  assert(byPath('docs/current/VERSION_PLAN.md') >= 2);
  assert(byPath('README.md') >= 2);
  assert(byPath('README.zh.md') >= 2);
  assert(byPath('docs/roadmap/ROADMAP.md') >= 2);
  assert(byPath('docs/governance/PROJECT_WORKFLOW.md') >= 2);
});

const RESUME_PLAN: ReleaseCommandStep[] = [
  { name: 'bump patch version', command: ['deno', 'run', 'tools/bump-version.ts'] },
  { name: 'commit release bump' },
  { name: 'push dev', command: ['git', 'push', 'origin', 'dev'] },
  { name: 'checkout main', command: ['git', 'checkout', 'main'] },
  { name: 'publish npm packages', command: ['deno', 'task', 'publish:npm'] },
  { name: 'tag release' },
];

function priorSteps(passed: number): ReleaseEvidence['steps'] {
  return RESUME_PLAN.map((step, index) => ({
    name: step.name,
    status: index < passed ? 'passed' as const : 'pending' as const,
  }));
}

Deno.test('planStartBranches: fresh runs start on the expected branch', () => {
  assertEquals(planStartBranches(RESUME_PLAN, undefined, 'dev'), ['dev']);
  assertEquals(planStartBranches(RESUME_PLAN, [], 'dev'), ['dev']);
});

Deno.test('planStartBranches: a resume must start where the passed prefix stopped', () => {
  // Failed before the branch switch: dev.
  assertEquals(planStartBranches(RESUME_PLAN, priorSteps(2), 'dev'), ['dev']);
  // Failed after checkout main: the resume only works from main.
  assertEquals(planStartBranches(RESUME_PLAN, priorSteps(4), 'dev'), ['main']);
  assertEquals(planStartBranches(RESUME_PLAN, priorSteps(5), 'dev'), ['main']);
});

Deno.test('planStartBranches: a fully passed plan accepts either side of the switch', () => {
  assertEquals(planStartBranches(RESUME_PLAN, priorSteps(RESUME_PLAN.length), 'dev'), [
    'dev',
    'main',
  ]);
  // Plans that never switch branches only accept the expected branch.
  const mainPlan = RESUME_PLAN.filter((step) => step.name !== 'checkout main');
  assertEquals(planStartBranches(mainPlan, priorSteps(2).slice(0, 2), 'main'), ['main']);
});

Deno.test('planFinalizeBranch: the last checkout target wins, else the fallback', () => {
  assertEquals(planFinalizeBranch(RESUME_PLAN, 'dev'), 'main');
  assertEquals(planFinalizeBranch([], 'main'), 'main');
  assertEquals(
    planFinalizeBranch(RESUME_PLAN.filter((step) => step.name !== 'checkout main'), 'main'),
    'main',
  );
});

Deno.test('resumeEvidenceFromPrior: identity and passed steps carry over, the rest resets', () => {
  const prior: ReleaseEvidence = {
    id: 'patch-release-v9.9.9-run-1',
    kind: 'patch-release',
    policyVersion: 'autoflow3-v0',
    currentVersion: '9.9.8',
    targetVersion: '9.9.9',
    status: 'failed',
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T00:10:00.000Z',
    releaseRunUrl: 'https://example.test/run/1',
    steps: [
      {
        name: 'bump patch version',
        status: 'passed',
        startedAt: 's1',
        completedAt: 'e1',
        exitCode: 0,
      },
      {
        name: 'commit release bump',
        status: 'passed',
        startedAt: 's2',
        completedAt: 'e2',
        exitCode: 0,
      },
      { name: 'push dev', status: 'failed', startedAt: 's3', completedAt: 'e3', exitCode: 128 },
      { name: 'checkout main', status: 'pending' },
      { name: 'publish npm packages', status: 'pending' },
      { name: 'tag release', status: 'pending' },
    ],
  };
  const resumed = resumeEvidenceFromPrior(prior, RESUME_PLAN);
  // Identity, previous line and run URL are preserved: the closure validator
  // compares the tag-time and final evidence ids.
  assertEquals(resumed.id, prior.id);
  assertEquals(resumed.startedAt, prior.startedAt);
  assertEquals(resumed.currentVersion, '9.9.8');
  assertEquals(resumed.releaseRunUrl, prior.releaseRunUrl);
  assertEquals(resumed.status, 'running');
  assertEquals(resumed.completedAt, undefined);
  // Passed steps keep status and timestamps; failed/pending steps reset.
  assertEquals(resumed.steps.map((step) => step.status), [
    'passed',
    'passed',
    'pending',
    'pending',
    'pending',
    'pending',
  ]);
  assertEquals(resumed.steps[0].startedAt, 's1');
  assertEquals(resumed.steps[0].exitCode, 0);
  // Commands come from the current plan, not the stale record.
  assertEquals(resumed.steps[0].command, RESUME_PLAN[0].command);
});

Deno.test('publishEvidencePassed: publish steps must all be passed; vacuous without them', () => {
  const evidence = (
    statuses: Array<[string, 'passed' | 'failed' | 'pending']>,
  ): ReleaseEvidence => ({
    id: 'e',
    kind: 'patch-release',
    policyVersion: 'v',
    currentVersion: '9.9.8',
    targetVersion: '9.9.9',
    status: 'running',
    startedAt: 't',
    steps: statuses.map(([name, status]) => ({ name, status })),
  });
  assertEquals(publishEvidencePassed(evidence([['bump patch version', 'passed']])), true);
  assertEquals(publishEvidencePassed(evidence([['publish npm packages', 'passed']])), true);
  assertEquals(
    publishEvidencePassed(
      evidence([['publish npm packages', 'passed'], [
        'verify npm versions and dist-tags',
        'pending',
      ]]),
    ),
    false,
  );
  assertEquals(publishEvidencePassed(evidence([['publish npm packages', 'failed']])), false);
});

Deno.test('decideTagAction: create, skip at HEAD, keep on proven resume, refuse otherwise', () => {
  const base = {
    tag: 'v9.9.9',
    head: 'bbb',
    existing: undefined,
    publishPassed: false,
    existingIsAncestor: false,
    existingEvidenceId: undefined,
    existingEvidenceKind: undefined,
    evidenceId: 'run-1',
  };
  assertEquals(decideTagAction({ ...base, existing: undefined }), 'create');
  assertEquals(decideTagAction({ ...base, existing: 'bbb' }), 'skip-at-head');
  // Resume: the tag points at an ancestor, publish passed, and the tag's
  // evidence snapshot belongs to the same run.
  assertEquals(
    decideTagAction({
      ...base,
      existing: 'aaa',
      publishPassed: true,
      existingIsAncestor: true,
      existingEvidenceId: 'run-1',
    }),
    'keep-existing',
  );
  // Two-phase flow: a local patch-release created the tag for the same
  // version, the CI publish-existing run owns a different evidence id — the
  // patch-release provenance still keeps the tag (the 0.41.2 refusal).
  assertEquals(
    decideTagAction({
      ...base,
      existing: 'aaa',
      publishPassed: true,
      existingIsAncestor: true,
      existingEvidenceId: 'patch-run',
      existingEvidenceKind: 'patch-release',
    }),
    'keep-existing',
  );
  // Same shape but a different run owns the tag: refuse.
  assertThrows(
    () =>
      decideTagAction({
        ...base,
        existing: 'aaa',
        publishPassed: true,
        existingIsAncestor: true,
        existingEvidenceId: 'other-run',
      }),
    Error,
    'Refusing to overwrite existing tag v9.9.9',
  );
  // Publish not proven: refuse even with patch-release provenance.
  assertThrows(
    () =>
      decideTagAction({
        ...base,
        existing: 'aaa',
        publishPassed: false,
        existingIsAncestor: true,
        existingEvidenceId: 'patch-run',
        existingEvidenceKind: 'patch-release',
      }),
    Error,
    'Refusing to overwrite',
  );
  // Publish not proven: refuse.
  assertThrows(
    () =>
      decideTagAction({
        ...base,
        existing: 'aaa',
        publishPassed: false,
        existingIsAncestor: true,
        existingEvidenceId: 'run-1',
      }),
    Error,
    'Refusing to overwrite',
  );
  // Tag moved sideways (not an ancestor): refuse.
  assertThrows(
    () =>
      decideTagAction({
        ...base,
        existing: 'aaa',
        publishPassed: true,
        existingIsAncestor: false,
        existingEvidenceId: 'run-1',
      }),
    Error,
    'Refusing to overwrite',
  );
});

async function git(cwd: string, args: string[]): Promise<string> {
  const output = await new Deno.Command('git', {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.code !== 0) {
    throw new Error(
      `git ${args.join(' ')} failed (${output.code}): ${new TextDecoder().decode(output.stderr)}`,
    );
  }
  return new TextDecoder().decode(output.stdout).trim();
}

/** A work repo on main+dev with a bare origin, mirroring the release topology. */
async function initReleaseRepo(): Promise<{ root: string; work: string }> {
  const root = await Deno.makeTempDir({ prefix: 'release-executor-test-' });
  const origin = `${root}/origin.git`;
  const work = `${root}/work`;
  await git(root, ['init', '--bare', origin]);
  await git(root, ['init', work]);
  await git(work, ['config', 'user.email', 'release-test@example.com']);
  await git(work, ['config', 'user.name', 'Release Test']);
  await git(work, ['checkout', '-b', 'main']);
  await Deno.writeTextFile(`${work}/seed.txt`, 'seed\n');
  await git(work, ['add', 'seed.txt']);
  await git(work, ['commit', '-m', 'seed']);
  await git(work, ['checkout', '-b', 'dev']);
  await git(work, ['remote', 'add', 'origin', origin]);
  await git(work, ['push', '-u', 'origin', 'main']);
  await git(work, ['push', '-u', 'origin', 'dev']);
  return { root, work };
}

function completedEvidence(target: string): ReleaseEvidence {
  const evidence = createReleaseEvidence('patch-release', '9.9.8', target);
  for (const step of evidence.steps) step.status = 'passed';
  return evidence;
}

/**
 * Simulate the local plan's branch sequence (bump on dev, ff main, running
 * evidence committed on main, tag) and return on main with a passed evidence.
 */
async function simulateLocalPlanToTag(work: string, target: string): Promise<ReleaseEvidence> {
  const tag = `v${target}`;
  await git(work, ['checkout', 'dev']);
  await Deno.writeTextFile(`${work}/version.txt`, `${target}\n`);
  await git(work, ['add', 'version.txt']);
  await git(work, ['commit', '-m', `chore(release): ${tag}`]);
  await git(work, ['push', 'origin', 'dev']);
  await git(work, ['checkout', 'main']);
  await git(work, ['merge', '--ff-only', 'dev']);

  const evidence = completedEvidence(target);
  evidence.status = 'running';
  await writeReleaseEvidence(evidence);
  await writeReleaseNote(evidence);
  await git(work, ['add', 'docs/release']);
  await git(work, ['commit', '-m', `docs(release): record ${tag} evidence`]);
  await git(work, ['push', 'origin', 'main']);
  await git(work, ['tag', tag]);

  evidence.status = 'completed';
  evidence.completedAt = new Date().toISOString();
  return evidence;
}

const LOCAL_PLAN_TAIL: ReleaseCommandStep[] = [
  { name: 'checkout main', command: ['git', 'checkout', 'main'] },
  { name: 'tag release' },
];

Deno.test('local release finalize: evidence and closure land on main, dev is synced back', async () => {
  const { root, work } = await initReleaseRepo();
  const previousCwd = Deno.cwd();
  try {
    Deno.chdir(work);
    const evidence = await simulateLocalPlanToTag(work, '9.9.9');

    await finalizeReleaseOnReleaseBranch(evidence, LOCAL_PLAN_TAIL, 'dev');

    // The operator is returned to dev, synced with main.
    assertEquals(await git(work, ['rev-parse', '--abbrev-ref', 'HEAD']), 'dev');
    assertEquals(await git(work, ['rev-parse', 'main']), await git(work, ['rev-parse', 'dev']));
    // The finalize commits were pushed to origin/main.
    assertEquals(
      await git(work, ['rev-parse', 'origin/main']),
      await git(work, ['rev-parse', 'main']),
    );

    const closure = JSON.parse(
      await git(work, ['show', 'main:docs/release/v9.9.9-closure.json']),
    ) as { tagCommit: string; finalEvidenceCommit: string };
    // The final evidence commit is on main's ancestry; the tag is an ancestor
    // of the final evidence commit (the release closure validator's contract).
    await git(work, ['merge-base', '--is-ancestor', closure.finalEvidenceCommit, 'main']);
    await git(work, [
      'merge-base',
      '--is-ancestor',
      closure.tagCommit,
      closure.finalEvidenceCommit,
    ]);
    // The evidence on main is the completed record, not a running snapshot.
    const mainEvidence = JSON.parse(
      await git(work, ['show', 'main:docs/release/autoflow3/v9.9.9.json']),
    ) as { status: string };
    assertEquals(mainEvidence.status, 'completed');
    // The release note on main carries the Durable closure section.
    const note = await git(work, ['show', 'main:docs/release/v9.9.9.md']);
    assert(note.includes('## Durable closure'));
  } finally {
    Deno.chdir(previousCwd);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('commitIfStaged: an empty stage is skipped instead of failing (resume breakpoint 1)', async () => {
  const { root, work } = await initReleaseRepo();
  const previousCwd = Deno.cwd();
  try {
    Deno.chdir(work);
    const head = await git(work, ['rev-parse', 'HEAD']);
    // Nothing staged: the old `git commit` step exited 1 here.
    await commitIfStaged('must not be created');
    assertEquals(await git(work, ['rev-parse', 'HEAD']), head);

    await Deno.writeTextFile(`${work}/change.txt`, 'change\n');
    await git(work, ['add', 'change.txt']);
    await commitIfStaged('test commit');
    assertEquals(await git(work, ['log', '-1', '--format=%s']), 'test commit');
  } finally {
    Deno.chdir(previousCwd);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('finalize failure keeps the release completed and only warns (resume breakpoint 3)', async () => {
  const { root, work } = await initReleaseRepo();
  const previousCwd = Deno.cwd();
  try {
    Deno.chdir(work);
    const evidence = await simulateLocalPlanToTag(work, '9.9.9');
    // Break every push from here on: the finalize commit lands locally but
    // cannot reach the origin.
    await git(work, ['remote', 'set-url', 'origin', `${root}/does-not-exist.git`]);

    // Must not throw: publish and tag already succeeded.
    await finalizeReleaseOnReleaseBranch(evidence, LOCAL_PLAN_TAIL, 'dev');

    assertEquals(evidence.status, 'completed');
    // The finalize commit still landed on the local main, and the sync-back
    // fast-forwarded dev to it locally.
    assertEquals(await git(work, ['rev-parse', '--abbrev-ref', 'HEAD']), 'dev');
    assertEquals(await git(work, ['rev-parse', 'main']), await git(work, ['rev-parse', 'dev']));
    const subject = await git(work, ['log', '-1', '--format=%s', 'main']);
    assert(subject.includes('finalize v9.9.9 evidence'));
  } finally {
    Deno.chdir(previousCwd);
    await Deno.remove(root, { recursive: true });
  }
});
