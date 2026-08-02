import { assert, assertEquals, assertFalse } from '@std/assert';
import { addPaths, gitChangedPaths, normalizeReleaseVersion, parseArgs } from '../cli.ts';
import { evaluatePatchEligibility, evaluateVersionAuthority, selectGates } from '../policy.ts';
import {
  bumpPreviousReleaseThemeText,
  createReleasePlan,
  evidenceFile,
  githubReleaseCreateCommand,
  nextPatchVersion,
  releaseTag,
  resolvePatchTargetVersion,
  roadmapEntryTheme,
  supersededThemeForBump,
} from '../release.ts';

Deno.test('policy: patch docs fix can be automated', () => {
  const decision = evaluatePatchEligibility({
    changedPaths: ['docs/guide/example.md'],
  });
  assert(decision.allowed);
});

Deno.test('policy: public package source changes require review for patch release', () => {
  const decision = evaluatePatchEligibility({
    changedPaths: ['docs/guide/example.md'],
    publicApiChanged: true,
  });
  assertFalse(decision.allowed);
  assert(decision.reason.includes('public API impact'));
});

Deno.test('policy: package topology changes require human review', () => {
  const decision = evaluatePatchEligibility({
    changedPaths: ['docs/guide/example.md'],
    packageTopologyChanged: true,
  });
  assertFalse(decision.allowed);
  assert(decision.reason.includes('package topology'));
});

Deno.test('policy: minor release without approved plan is blocked', () => {
  const decision = evaluateVersionAuthority('minor');
  assertFalse(decision.allowed);
  assertEquals(decision.requiredEvidence, ['ADR', 'approved version plan']);
});

Deno.test('policy: minor release with approved plan can execute', () => {
  const decision = evaluateVersionAuthority('minor', 'ADR-0101/docs-current-v040');
  assert(decision.allowed);
  assert(decision.requiredEvidence.includes('approval:ADR-0101/docs-current-v040'));
});

Deno.test('policy: dev tier remains fast', () => {
  const gates = selectGates('dev', ['packages/core/src/index.ts']).map((gate) => gate.name);
  assertEquals(gates, ['fmt:check', 'lint']);
});

Deno.test('policy: push tier stays fast for package source changes', () => {
  const gates = selectGates('push', ['packages/core/src/index.ts']).map((gate) => gate.name);
  assertFalse(gates.includes('arch:check'));
  assertFalse(gates.includes('test'));
  assert(gates.includes('package-surface:check'));
});

Deno.test('policy: ci tier includes architecture check for package source changes', () => {
  const gates = selectGates('ci', ['packages/core/src/index.ts']).map((gate) => gate.name);
  assert(gates.includes('arch:check'));
  assert(gates.includes('test:coverage:check'));
  assertFalse(gates.includes('test'));
});

Deno.test('policy: ci tier includes architecture check for tool and hook changes', () => {
  const toolGates = selectGates('ci', ['tools/autoflow/policy.ts']).map((gate) => gate.name);
  const hookGates = selectGates('ci', ['.githooks/pre-push']).map((gate) => gate.name);
  assert(toolGates.includes('arch:check'));
  assert(hookGates.includes('arch:check'));
});

Deno.test('policy: release tier includes pack dry-run and nitro proofs', () => {
  const gates = selectGates('release', ['packages/element/src/index.ts']).map((gate) => gate.name);
  assert(gates.includes('package-artifacts:check'));
  assert(gates.includes('pack:dry-run'));
  assert(gates.includes('nitro:proof:node'));
  assert(gates.includes('nitro:proof:workers'));
  assert(gates.includes('consumer:element-smoke'));
  assert(gates.includes('third-party-wc:smoke'));
});

Deno.test('cli: parse approved plan for release command', () => {
  assertEquals(parseArgs(['release', '--approved-plan', 'ADR-0101/v0.40', '--dry-run']), {
    command: 'release',
    dryRun: true,
    dispatch: false,
    approvedPlan: 'ADR-0101/v0.40',
    targetVersion: undefined,
  });
});

Deno.test('cli: parse dispatch flag for release command', () => {
  assertEquals(
    parseArgs(['release-dispatch', '--approved-plan', 'ADR-0101/v0.40', '--to', '0.41.0-alpha.1']),
    {
      command: 'release-dispatch',
      dryRun: false,
      dispatch: true,
      approvedPlan: 'ADR-0101/v0.40',
      targetVersion: '0.41.0-alpha.1',
    },
  );
});

Deno.test('cli: normalizes compact prerelease version input', () => {
  assertEquals(normalizeReleaseVersion('0.41.0-alpha5'), '0.41.0-alpha.5');
  assertEquals(normalizeReleaseVersion('0.41.0-beta12'), '0.41.0-beta.12');
  assertEquals(normalizeReleaseVersion('0.41.0-rc1'), '0.41.0-rc.1');
  assertEquals(
    parseArgs(['release', '--approved-plan', 'ADR-0101/v0.40', '--to', '0.41.0-alpha5'])
      .targetVersion,
    '0.41.0-alpha.5',
  );
});

Deno.test('cli: addPaths deduplicates multi-source diff output', () => {
  const paths = new Set<string>();
  addPaths(paths, 'README.md\npackages/core/src/index.ts\n');
  addPaths(paths, 'README.md\r\ndocs/current/VERSION_PLAN.md\r\n');
  assertEquals([...paths].sort(), [
    'README.md',
    'docs/current/VERSION_PLAN.md',
    'packages/core/src/index.ts',
  ]);
});

Deno.test('cli: ci changed paths fall back to diff-tree in a shallow clone', async () => {
  const calls: string[][] = [];
  const paths = await gitChangedPaths('ci', (args) => {
    calls.push(args);
    if (args[0] === 'diff') return Promise.resolve(undefined);
    return Promise.resolve('deno.lock\npackages/app/src/spa.ts\n');
  });
  assertEquals(paths, ['deno.lock', 'packages/app/src/spa.ts']);
  assertEquals(calls, [
    ['diff', '--name-only', 'HEAD^', 'HEAD'],
    ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', 'HEAD'],
  ]);
});

Deno.test('cli: changed-path discovery fails when every git strategy fails', async () => {
  let message = '';
  try {
    await gitChangedPaths('ci', () => Promise.resolve(undefined));
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assert(message.includes('Unable to determine changed paths'));
});

Deno.test('cli: parses two-phase release commands', () => {
  assertEquals(
    parseArgs([
      'release-prepare',
      '--approved-plan',
      'docs/current/VERSION_PLAN.md',
      '--to',
      '0.41.0-alpha.11',
      '--dry-run',
    ]),
    {
      command: 'release-prepare',
      dryRun: true,
      dispatch: false,
      approvedPlan: 'docs/current/VERSION_PLAN.md',
      targetVersion: '0.41.0-alpha.11',
    },
  );
  assertEquals(
    parseArgs(['publish-existing', '--to', '0.41.0-alpha.11']),
    {
      command: 'publish-existing',
      dryRun: false,
      dispatch: false,
      approvedPlan: undefined,
      targetVersion: '0.41.0-alpha.11',
    },
  );
});

Deno.test('release: next patch version and tag are deterministic', () => {
  assertEquals(nextPatchVersion('0.39.0'), '0.39.1');
  assertEquals(releaseTag('0.39.1'), 'v0.39.1');
  assertEquals(evidenceFile('0.39.1'), 'docs/release/autoflow3/v0.39.1.json');
});

Deno.test('release: next patch version preserves pre-release line', () => {
  assertEquals(nextPatchVersion('0.41.0-alpha.6'), '0.41.0-alpha.7');
  assertEquals(nextPatchVersion('1.2.3-rc.1'), '1.2.3-rc.2');
  assertEquals(nextPatchVersion('0.41.0'), '0.41.1');
});

Deno.test('release: patch target resumes the in-flight release instead of skipping a patch', () => {
  // The 0.41.1 → 0.41.2 incident: the first attempt bumped the package line
  // to 0.41.1 and failed; the resume recomputed nextPatchVersion(0.41.1).
  for (const status of ['failed', 'running'] as const) {
    assertEquals(
      resolvePatchTargetVersion('0.41.1', { kind: 'patch-release', status }),
      { targetVersion: '0.41.1', resumed: true },
    );
  }
});

Deno.test('release: patch target advances when no resume is pending', () => {
  assertEquals(resolvePatchTargetVersion('0.41.1', undefined), {
    targetVersion: '0.41.2',
    resumed: false,
  });
  assertEquals(
    resolvePatchTargetVersion('0.41.1', { kind: 'patch-release', status: 'completed' }),
    { targetVersion: '0.41.2', resumed: false },
  );
  // A failed publish-existing for the current line is not a patch bump to
  // resume: the version line is already published, so a patch advances.
  assertEquals(
    resolvePatchTargetVersion('0.41.1', { kind: 'publish-existing', status: 'failed' }),
    { targetVersion: '0.41.2', resumed: false },
  );
});

Deno.test('release: GitHub prerelease flag follows semver prerelease tags', () => {
  assert(githubReleaseCreateCommand('v0.41.0-alpha.5', 'notes.md').includes('--prerelease'));
  assert(githubReleaseCreateCommand('0.41.0-rc.1', 'notes.md').includes('--prerelease'));
  assertFalse(githubReleaseCreateCommand('v0.41.0', 'notes.md').includes('--prerelease'));
});

Deno.test('release: roadmap entry theme parses the version-adjacent theme line', () => {
  const text = "  {\n    version: 'v0.41.1',\n    theme: 'stable five-package line',\n";
  assertEquals(roadmapEntryTheme(text, 'v0.41.1'), 'stable five-package line');
  assertEquals(roadmapEntryTheme(text, 'v0.41.0'), undefined);
});

Deno.test('release: previous release theme bump records the superseded theme idempotently', () => {
  const constants = "export const PREVIOUS_RELEASE_THEME = 'old theme';\n";
  assertEquals(
    bumpPreviousReleaseThemeText(constants, 'new theme'),
    "export const PREVIOUS_RELEASE_THEME = 'new theme';\n",
  );
  assertEquals(bumpPreviousReleaseThemeText(constants, 'old theme'), undefined);
});

Deno.test('release: superseded theme is only recorded on a real version change', () => {
  const text =
    "  {\n    version: 'v0.42.0-alpha.1',\n    theme: 'request-time rendering foundation',\n";
  // Real bump: v0.41.2 -> v0.42.0-alpha.1 records the old entry's theme.
  const bumpedText = text.replace('v0.42.0-alpha.1', 'v0.41.2').replace(
    'request-time rendering foundation',
    'release tooling self-repair',
  );
  assertEquals(
    supersededThemeForBump(bumpedText, "version: 'v0.41.2'", "version: 'v0.42.0-alpha.1'"),
    'release tooling self-repair',
  );
  // Idempotent resume (from === to): nothing is superseded — recording the
  // new theme here made the 0.42.0-alpha.1 gate reject correct prose.
  assertEquals(
    supersededThemeForBump(text, "version: 'v0.42.0-alpha.1'", "version: 'v0.42.0-alpha.1'"),
    undefined,
  );
});

Deno.test('release: local plan includes publish, smoke, gates, and GitHub release when credentials are present', () => {
  // Simulate a local/manual environment that has the credentials required for
  // npm publish and GitHub release creation. Force CI off so the plan follows
  // the dev -> main path.
  const originalNpmToken = Deno.env.get('NPM_TOKEN');
  const originalGitHubToken = Deno.env.get('GITHUB_TOKEN');
  const originalCi = Deno.env.get('CI');
  Deno.env.set('NPM_TOKEN', 'test-token');
  Deno.env.set('GITHUB_TOKEN', 'test-token');
  Deno.env.delete('CI');
  try {
    const commands = createReleasePlan('0.39.1').map((step) => [
      step.name,
      step.command?.join(' ') ?? '',
    ]);
    assert(commands.some(([name]) => name === 'run release gates after bump'));
    assert(commands.some(([name]) => name === 'package artifact gate'));
    assert(commands.some(([name]) => name === 'push dev'));
    assert(commands.some(([name]) => name === 'sync main from dev (fast-forward)'));
    assert(
      commands.some(([, command]) => command.includes('deno task publish:npm')),
    );
    assert(
      commands.some(([, command]) => command.includes('tools/consumer-smoke.ts --version 0.39.1')),
    );
    assert(commands.some(([name]) => name === 'create GitHub release'));
  } finally {
    if (originalNpmToken === undefined) Deno.env.delete('NPM_TOKEN');
    else Deno.env.set('NPM_TOKEN', originalNpmToken);
    if (originalGitHubToken === undefined) Deno.env.delete('GITHUB_TOKEN');
    else Deno.env.set('GITHUB_TOKEN', originalGitHubToken);
    if (originalCi === undefined) Deno.env.delete('CI');
    else Deno.env.set('CI', originalCi);
  }
});

Deno.test('release: CI plan publishes from main without touching dev', () => {
  const originalNpmToken = Deno.env.get('NPM_TOKEN');
  const originalGitHubToken = Deno.env.get('GITHUB_TOKEN');
  const originalCi = Deno.env.get('CI');
  Deno.env.set('NPM_TOKEN', 'test-token');
  Deno.env.set('GITHUB_TOKEN', 'test-token');
  Deno.env.set('CI', 'true');
  try {
    const names = createReleasePlan('0.39.1').map((step) => step.name);
    assertFalse(names.includes('run release gates after bump'));
    assertFalse(names.includes('push dev'));
    assertFalse(names.includes('sync dev to main'));
    assertFalse(names.includes('checkout dev'));
    assert(names.includes('pull latest main'));
    assert(names.includes('push main evidence'));
    assert(names.includes('package artifact gate'));
    assert(names.includes('publish npm packages'));
    assert(names.includes('post-publish npm consumer smoke'));
    // JSR is no longer a release channel (see #322); the publish hook stays
    // present but disabled, so the CI plan must not include a jsr publish step.
    assertFalse(names.includes('publish jsr packages'));
    assert(names.includes('tag release'));
    assert(names.includes('push tag'));
    assert(names.includes('create GitHub release'));
  } finally {
    if (originalNpmToken === undefined) Deno.env.delete('NPM_TOKEN');
    else Deno.env.set('NPM_TOKEN', originalNpmToken);
    if (originalGitHubToken === undefined) Deno.env.delete('GITHUB_TOKEN');
    else Deno.env.set('GITHUB_TOKEN', originalGitHubToken);
    if (originalCi === undefined) Deno.env.delete('CI');
    else Deno.env.set('CI', originalCi);
  }
});

Deno.test('release: patch release plan omits publish and GitHub release without credentials', () => {
  const originalNpmToken = Deno.env.get('NPM_TOKEN');
  const originalGitHubToken = Deno.env.get('GITHUB_TOKEN');
  const originalGhToken = Deno.env.get('GH_TOKEN');
  const originalGitHubActions = Deno.env.get('GITHUB_ACTIONS');
  const originalCi = Deno.env.get('CI');
  Deno.env.delete('NPM_TOKEN');
  Deno.env.delete('NODE_AUTH_TOKEN');
  Deno.env.delete('GITHUB_TOKEN');
  Deno.env.delete('GH_TOKEN');
  Deno.env.delete('GITHUB_ACTIONS');
  Deno.env.delete('CI');
  try {
    const names = createReleasePlan('0.39.1').map((step) => step.name);
    assertFalse(names.includes('publish npm packages'));
    assertFalse(names.includes('create GitHub release'));
    assert(names.includes('tag release'));
    assert(names.includes('push tag'));
  } finally {
    if (originalNpmToken === undefined) Deno.env.delete('NPM_TOKEN');
    else Deno.env.set('NPM_TOKEN', originalNpmToken);
    if (originalGitHubToken === undefined) Deno.env.delete('GITHUB_TOKEN');
    else Deno.env.set('GITHUB_TOKEN', originalGitHubToken);
    if (originalGhToken === undefined) Deno.env.delete('GH_TOKEN');
    else Deno.env.set('GH_TOKEN', originalGhToken);
    if (originalGitHubActions === undefined) Deno.env.delete('GITHUB_ACTIONS');
    else Deno.env.set('GITHUB_ACTIONS', originalGitHubActions);
    if (originalCi === undefined) Deno.env.delete('CI');
    else Deno.env.set('CI', originalCi);
  }
});
