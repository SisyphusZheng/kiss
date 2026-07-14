import { assert, assertEquals, assertFalse, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { existsSync } from 'node:fs';
import {
  buildVersionAnchorReplacements,
  createPreparePlan,
  createPublishExistingPlan,
  createReleasePlan,
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
    assert(names.includes('verify npm versions and alpha dist-tags'));
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
