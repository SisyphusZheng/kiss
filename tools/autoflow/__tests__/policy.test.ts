import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { addPaths, parseArgs } from '../mod3.ts';
import {
  evaluatePatchEligibility,
  evaluateVersionAuthority,
  selectGates,
  V040_CLEANUP_TRAIN_APPROVAL_ID,
} from '../policy.ts';
import { createReleasePlan, evidenceFile, nextPatchVersion, releaseTag } from '../release.ts';

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

Deno.test('policy: v0.40.x cleanup train patch requires approved plan id', () => {
  const decision = evaluatePatchEligibility({
    changedPaths: ['packages/element/src/index.ts'],
  });
  assertFalse(decision.allowed);
  assert(decision.reason.includes('v0.40.x cleanup train'));
});

Deno.test('policy: v0.40.x cleanup train patch accepts explicit human approval id', () => {
  const decision = evaluatePatchEligibility({
    changedPaths: ['packages/element/src/index.ts'],
    approvedPlanId: V040_CLEANUP_TRAIN_APPROVAL_ID,
  });
  assert(decision.allowed);
  assert(decision.requiredEvidence.includes(`approval:${V040_CLEANUP_TRAIN_APPROVAL_ID}`));
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
});

Deno.test('policy: ci tier includes architecture check for tool and hook changes', () => {
  const toolGates = selectGates('ci', ['tools/autoflow/policy.ts']).map((gate) => gate.name);
  const hookGates = selectGates('ci', ['.githooks/pre-push']).map((gate) => gate.name);
  assert(toolGates.includes('arch:check'));
  assert(hookGates.includes('arch:check'));
});

Deno.test('policy: release tier includes pack dry-run and nitro proofs', () => {
  const gates = selectGates('release', ['packages/core/src/index.ts']).map((gate) => gate.name);
  assert(gates.includes('package-artifacts:check'));
  assert(gates.includes('pack:dry-run'));
  assert(gates.includes('nitro:proof:node'));
  assert(gates.includes('nitro:proof:workers'));
  assert(gates.includes('consumer:core-smoke'));
  assert(gates.includes('third-party-wc:smoke'));
});

Deno.test('mod3: parse approved plan for release command', () => {
  assertEquals(parseArgs(['release', '--approved-plan', 'ADR-0101/v0.40', '--dry-run']), {
    command: 'release',
    dryRun: true,
    dispatch: false,
    approvedPlan: 'ADR-0101/v0.40',
    targetVersion: undefined,
  });
});

Deno.test('mod3: parse dispatch flag for release command', () => {
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

Deno.test('mod3: addPaths deduplicates multi-source diff output', () => {
  const paths = new Set<string>();
  addPaths(paths, 'README.md\npackages/core/src/index.ts\n');
  addPaths(paths, 'README.md\r\ndocs/current/VERSION_PLAN.md\r\n');
  assertEquals([...paths].sort(), [
    'README.md',
    'docs/current/VERSION_PLAN.md',
    'packages/core/src/index.ts',
  ]);
});

Deno.test('release: next patch version and tag are deterministic', () => {
  assertEquals(nextPatchVersion('0.39.0'), '0.39.1');
  assertEquals(releaseTag('0.39.1'), 'v0.39.1');
  assertEquals(evidenceFile('0.39.1'), 'docs/release/autoflow3/v0.39.1.json');
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
    assert(commands.some(([name]) => name === 'sync dev to main'));
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
    assert(names.includes('push main'));
    assert(names.includes('package artifact gate'));
    assert(names.includes('publish npm packages'));
    assert(names.includes('post-publish npm consumer smoke'));
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
