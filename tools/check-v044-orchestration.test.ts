import { assert, assertEquals } from '@std/assert';
import { loadV044RoleConfig, V044_ROLE_CONFIG_PATH } from './config/load-v044-roles.ts';
import {
  type ReleaseDoctrineTexts,
  validateAlphaWorkspaceConfig,
  validateAlphaWorkspaceTopology,
  validateExecutionState,
  validateExecutorContract,
  validateReleaseDoctrine,
} from './check-v044-orchestration.ts';

const config = await loadV044RoleConfig();

function validState(): Record<string, unknown> {
  return {
    schemaVersion: 2,
    train: '0.44.0',
    status: 'READY',
    currentIssue: 1193,
    executionMode: 'independent-alpha-workspaces',
    threeRoleLoopActive: false,
    integrationBaseSha: null,
    workspaces: Object.fromEntries([
      ...Array.from({ length: 7 }, (_, index) => [`alpha.${index + 1}`, 'PENDING_BASE']),
      ['alpha.8', 'WAITING_FOR_WORKSPACE_SHAS'],
    ]),
    authoritativeCiOwner: 'alpha.8 exact-SHA pull request',
    betaThreeRoleExecutorConfig: V044_ROLE_CONFIG_PATH,
    parallelReady: true,
    integrationBaseEvidenceIssue: 1193,
    workspaceConfig: 'tools/config/v044-alpha-workspaces.json',
    collaborationContract: 'docs/current/v0.44.0-ALPHA-CONTRACT.md',
  };
}

Deno.test('Alpha workspace execution state validates without three-role sessions', () => {
  assertEquals(validateExecutionState(validState(), config), []);
});

Deno.test('Alpha state rejects an active three-role loop or embedded role sessions', () => {
  const active = validState();
  active.threeRoleLoopActive = true;
  assert(validateExecutionState(active, config).some((failure) => failure.includes('disabled')));

  const embedded = validState();
  embedded.implementer = { sessionId: 'forbidden' };
  embedded.releaseVerifier = { sessionId: 'forbidden' };
  const failures = validateExecutionState(embedded, config);
  assert(failures.some((failure) => failure.includes('implementer')));
  assert(failures.some((failure) => failure.includes('releaseVerifier')));
});

Deno.test('Alpha state rejects a missing workspace or non-alpha.8 CI owner', () => {
  const missing = validState();
  delete (missing.workspaces as Record<string, unknown>)['alpha.4'];
  assert(validateExecutionState(missing, config).some((failure) => failure.includes('alpha.4')));

  const wrongOwner = validState();
  wrongOwner.authoritativeCiOwner = 'every workspace';
  assert(validateExecutionState(wrongOwner, config).some((failure) => failure.includes('alpha.8')));
});

Deno.test('Beta executor capability remains pinned but is not activated by Alpha state', () => {
  assertEquals(validateExecutorContract(config), []);
  const drifted = structuredClone(config);
  drifted.executor.contextTokens = 128000;
  drifted.executor.defaultEffort = 'low';
  assert(validateExecutorContract(drifted).length >= 2);
});

Deno.test('executable Alpha workspace config has seven disjoint writers and one aggregator', async () => {
  const workspaceConfig = JSON.parse(
    await Deno.readTextFile('tools/config/v044-alpha-workspaces.json'),
  );
  assertEquals(validateAlphaWorkspaceConfig(workspaceConfig), []);

  const overlap = structuredClone(workspaceConfig);
  overlap.workspaces[1].writePaths.push(overlap.workspaces[0].writePaths[0]);
  assert(
    validateAlphaWorkspaceConfig(overlap).some((failure) => failure.includes('overlaps')),
  );

  const missing = structuredClone(workspaceConfig);
  missing.workspaces = missing.workspaces.filter((entry: { id: string }) => entry.id !== 'alpha.6');
  assert(validateAlphaWorkspaceConfig(missing).some((failure) => failure.includes('alpha.6')));
});

Deno.test('alpha.8 integration whitelist is required, bounded and safe', async () => {
  const workspaceConfig = JSON.parse(
    await Deno.readTextFile('tools/config/v044-alpha-workspaces.json'),
  );

  const absent = structuredClone(workspaceConfig);
  delete absent.integration.writePaths;
  assert(
    validateAlphaWorkspaceConfig(absent).some((failure) =>
      failure.includes('write-path whitelist')
    ),
  );

  const bare = structuredClone(workspaceConfig);
  bare.integration.writePaths = ['packages/'];
  assert(
    validateAlphaWorkspaceConfig(bare).some((failure) => failure.includes('bare top-level')),
  );

  const unsafe = structuredClone(workspaceConfig);
  unsafe.integration.writePaths = ['../outside.ts'];
  assert(validateAlphaWorkspaceConfig(unsafe).some((failure) => failure.includes('unsafe')));

  const glob = structuredClone(workspaceConfig);
  glob.integration.writePaths = ['packages/element/**'];
  assert(validateAlphaWorkspaceConfig(glob).some((failure) => failure.includes('unsafe')));
});

function alphaPlan(): string {
  return [
    'The Alpha train uses parallel development in independent workspaces and one final integration workspace.',
    'It does not use the three-role release loop.',
    '| `alpha.0` | #1160 #1182 #1193 | common base |',
    '| alpha.1 | Compiler | #1161 #1162 #1163 |',
    '| alpha.2 | Runtime | #1164 #1165 #1166 #723 #1167 |',
    '| alpha.3 | SSR / Claim | #1168 #1169 #1170 |',
    '| alpha.4 | App / Delivery | #1088 #1171 #1172 #1173 #1163 |',
    '| alpha.5 | Migration | #1174 |',
    '| alpha.6 | Interoperability | #1175 |',
    '| alpha.7 | Qualification | #1176 |',
    '| alpha.8 | Final Integration | #1181 |',
    'One agent owns each alpha.1-alpha.7 workspace end-to-end.',
    'The alpha.8 integration agent is the only aggregator.',
    'The alpha.8 pull request to `dev` runs the only full matrix for its exact SHA.',
    'No internal Alpha ID causes a tag, npm publication, GitHub Release, dist-tag change, `main` promotion, three-role GO or fresh release-verifier run.',
    'Beta.1 activates the three-role release loop. Beta.3 owns #1192 #1156 #1187 #1188 #1189.',
    '#1150 #1157 #1158 #1159 #1177 #1178',
  ].join('\n');
}

Deno.test('internal Alpha workspace topology accepts alpha.1-alpha.8 and one aggregator', () => {
  assertEquals(validateAlphaWorkspaceTopology(alphaPlan()), []);
});

Deno.test('internal Alpha workspace topology matches the live execution plan', async () => {
  const plan = await Deno.readTextFile('docs/current/v0.44.0-EXECUTION-PLAN.md');
  assertEquals(validateAlphaWorkspaceTopology(plan), []);
});

Deno.test('workspace topology rejects missing workspaces and missing final aggregator', () => {
  const missing = alphaPlan().replace(
    '| alpha.4 | App / Delivery | #1088 #1171 #1172 #1173 #1163 |\n',
    '',
  );
  assert(validateAlphaWorkspaceTopology(missing).some((failure) => failure.includes('alpha.4')));

  const noAggregator = alphaPlan().replace('is the only aggregator', 'is an aggregator');
  assert(
    validateAlphaWorkspaceTopology(noAggregator).some((failure) =>
      failure.includes('only aggregator')
    ),
  );
});

Deno.test('workspace topology rejects three-role Alpha execution and per-workspace full matrices', () => {
  const roles = alphaPlan().replace(
    'It does not use the three-role release loop.',
    'Invoke the configured implementer and a fresh release verifier session for Alpha.',
  );
  assert(validateAlphaWorkspaceTopology(roles).some((failure) => failure.includes('three-role')));

  const matrices = alphaPlan().replace(
    'alpha.8 pull request to `dev` runs the only full matrix',
    'every workspace runs the full matrix',
  );
  assert(validateAlphaWorkspaceTopology(matrices).some((failure) => failure.includes('alpha.8')));
});

async function doctrineCorpus(): Promise<ReleaseDoctrineTexts> {
  return {
    issueMap: await Deno.readTextFile('docs/roadmap/v0.44.0-ISSUES.md'),
    versionPlan: await Deno.readTextFile('docs/current/VERSION_PLAN.md'),
    alphaSop: await Deno.readTextFile('docs/governance/V044_ALPHA_WORKSPACE_SOP.md'),
    alphaPrompt: await Deno.readTextFile(
      'docs/prompts/v0.44.0-ALPHA-SEVEN-SUBAGENTS.md',
    ),
    betaSop: await Deno.readTextFile('docs/governance/V044_AGENT_LOOP_SOP.md'),
    betaPrompt: await Deno.readTextFile('docs/prompts/v0.44.0-THINKER-ORCHESTRATOR.md'),
    plan: await Deno.readTextFile('docs/current/v0.44.0-EXECUTION-PLAN.md'),
  };
}

Deno.test('real doctrine disables three-role Alpha and activates it at Beta.1', async () => {
  assertEquals(validateReleaseDoctrine(await doctrineCorpus()), []);
});

Deno.test('doctrine rejects publishable Alpha, Alpha verifier use, executor preflight and missing Beta activation', async () => {
  const publishable = await doctrineCorpus();
  publishable.issueMap += '\nAlpha.4 may publish to npm.';
  assert(validateReleaseDoctrine(publishable).some((failure) => failure.includes('publishable')));

  const verifier = await doctrineCorpus();
  verifier.alphaSop += '\nStart a fresh release verifier for alpha.8.';
  assert(validateReleaseDoctrine(verifier).some((failure) => failure.includes('release verifier')));

  const preflight = await doctrineCorpus();
  preflight.alphaSop = preflight.alphaSop.replace(
    'Do not run `v044:executor:check` during Alpha',
    'The executor preflight is optional during Alpha',
  );
  assert(
    validateReleaseDoctrine(preflight).some((failure) => failure.includes('v044:executor:check')),
  );

  const noBeta = await doctrineCorpus();
  noBeta.versionPlan = noBeta.versionPlan.replace('It begins at Beta.1', 'It stays disabled');
  assert(validateReleaseDoctrine(noBeta).some((failure) => failure.includes('Beta.1')));
});

Deno.test('Beta SOP and prompt preserve exact-SHA fast-forward and #1178 stop', async () => {
  const texts = await doctrineCorpus();
  for (const text of [texts.betaSop, texts.betaPrompt]) {
    assert(text.includes('beta.1') || text.includes('Beta.1'));
    assert(text.includes('beta.3') || text.includes('Beta.3'));
    assert(text.includes('--ff-only'));
    assert(text.includes('#1178'));
  }
});
