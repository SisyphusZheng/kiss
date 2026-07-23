import { assert, assertEquals, assertFalse, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { existsSync } from 'node:fs';
import {
  buildVersionAnchorReplacements,
  bumpProjectConstantsText,
  createPreparePlan,
  createPublishExistingPlan,
  createReleaseEvidence,
  createReleasePlan,
  currentWorkflowRunUrl,
  evidenceCurrentVersion,
  githubReleaseUrl,
  mergeClosureSection,
  renderClosureSection,
  renderReleaseNote,
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
  assertEquals(reps.length, 8);

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
  // README carries one current package-line anchor.
  const readmeReps = reps.filter(([p]) => p === 'README.md');
  assertEquals(readmeReps.length, 1);
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
  // The active execution target is the version worked on next: the patch
  // successor of the bump target.
  assert(updated.includes("ACTIVE_EXECUTION_VERSION = 'v0.41.0-alpha.18'"));
});

Deno.test('bumpProjectConstantsText: stable bump advances the active target to the next patch', () => {
  const fromPrevious = bumpProjectConstantsText(CONSTANTS_FIXTURE, '0.41.0');
  assert(fromPrevious !== undefined);
  assert(fromPrevious.includes("PACKAGE_VERSION = '0.41.0'"));
  assert(fromPrevious.includes("PREVIOUS_PACKAGE_VERSION = '0.41.0-alpha.16'"));
  assert(fromPrevious.includes("ACTIVE_EXECUTION_VERSION = 'v0.41.1'"));
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
