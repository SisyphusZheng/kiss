import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { loadV044RoleConfig, V044_ROLE_CONFIG_PATH } from './config/load-v044-roles.ts';
import {
  type ReleaseDoctrineTexts,
  validateAcceleratedTopology,
  validateExecutionState,
  validateExecutorContract,
  validateReleaseDoctrine,
} from './check-v044-orchestration.ts';

const config = await loadV044RoleConfig();

function validState(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    train: '0.44.0',
    status: 'REPAIR',
    currentIssue: 1156,
    implementer: {
      roleProfile: 'implementer',
      executorConfig: V044_ROLE_CONFIG_PATH,
      sessionId: null,
    },
    releaseVerifier: {
      roleProfile: 'releaseVerifier',
      executorConfig: V044_ROLE_CONFIG_PATH,
      sessionPolicy: 'fresh-per-candidate-sha',
      sessionId: null,
    },
  };
}

Deno.test('execution state referencing the executable role configuration validates', () => {
  assertEquals(validateExecutionState(validState(), config), []);
});

Deno.test('execution state must not embed executor identity', () => {
  const state = validState();
  (state.implementer as Record<string, unknown>).model = 'embedded-model';
  (state.implementer as Record<string, unknown>).command = 'embedded-cli';
  const failures = validateExecutionState(state, config);
  assert(failures.some((failure) => failure.includes('implementer')));
});

Deno.test('execution state rejects unknown role profiles and stale config refs', () => {
  const state = validState();
  (state.releaseVerifier as Record<string, unknown>).roleProfile = 'thinker';
  (state.releaseVerifier as Record<string, unknown>).executorConfig = 'docs/current/elsewhere.json';
  const failures = validateExecutionState(state, config);
  assert(failures.some((failure) => failure.includes('roleProfile')));
  assert(failures.some((failure) => failure.includes('executorConfig')));
});

Deno.test('executor capability contract is pinned to 262144 context and high default effort', () => {
  assertEquals(validateExecutorContract(config), []);
  const drifted = structuredClone(config);
  drifted.executor.contextTokens = 128000;
  drifted.executor.defaultEffort = 'low';
  assert(validateExecutorContract(drifted).length >= 2);
});

function acceleratedPlan(): string {
  return [
    'The train uses parallel development and serial integration.',
    '',
    '| Phase | Work | Exit |',
    '| --- | --- | --- |',
    '| `alpha.0` | #1160 accepted -> #1182 accepted -> #1193 branch safety | one base SHA |',
    '',
    '| Lane | Issues | Input |',
    '| --- | --- | --- |',
    '| Compiler / Part Program | #1161 #1162 #1163 | frozen schema |',
    '| Element Runtime / Signals | #1164 #1165 #1166 #723 #1167 | frozen program |',
    '| SSR / DOM Claim | #1168 #1169 #1170 | marker contract |',
    '| App / Islands / Delivery | #1088 #1171 #1172 #1173 | Integration I program/runtime path |',
    '',
    '## Integration I',
    '',
    'one end-to-end vertical path.',
    '',
    '## Integration II',
    '',
    'Only after this checkpoint may #1174 aggressively remove replaced primary paths.',
    '',
    '## Final Alpha',
    '',
    '#1174, #1175, #1176 and #1181 prove legacy absence and migration.',
    '',
    '- Beta.3: #1192, #1156, #1187, #1188, #1189',
  ].join('\n');
}

Deno.test('accelerated topology accepts the minimal alpha.0 parallel-lane plan', () => {
  assertEquals(validateAcceleratedTopology(acceleratedPlan()), []);
});

Deno.test('accelerated topology matches the live execution plan', async () => {
  const plan = await Deno.readTextFile('docs/current/v0.44.0-EXECUTION-PLAN.md');
  assertEquals(validateAcceleratedTopology(plan), []);
});

Deno.test('accelerated topology rejects governance hardening moved back into alpha.0', () => {
  const stale = acceleratedPlan().replace(
    '#1193 branch safety',
    '#1193 branch safety -> #1156 loop hardening',
  );
  const failures = validateAcceleratedTopology(stale);
  assert(failures.some((failure) => failure.includes('#1156')));
});

Deno.test('accelerated topology rejects missing Runtime or SSR/Claim lane ownership', () => {
  const noRuntime = acceleratedPlan()
    .split('\n')
    .filter((line) => !line.includes('Runtime'))
    .join('\n');
  assert(
    validateAcceleratedTopology(noRuntime).some((failure) => failure.includes('Runtime')),
  );
  const noSsr = acceleratedPlan()
    .split('\n')
    .filter((line) => !line.includes('SSR'))
    .join('\n');
  assert(validateAcceleratedTopology(noSsr).some((failure) => failure.includes('SSR')));
});

Deno.test('accelerated topology rejects broad App/Delivery work before Integration I', () => {
  const early = acceleratedPlan().replace(
    'Integration I program/runtime path',
    'frozen program',
  );
  assert(
    validateAcceleratedTopology(early).some((failure) => failure.includes('Integration I')),
  );
});

Deno.test('accelerated topology rejects Final Alpha legacy removal before Integration II', () => {
  const plan = acceleratedPlan();
  const integrationTwo = plan.slice(
    plan.indexOf('## Integration II'),
    plan.indexOf('## Final Alpha'),
  );
  const reordered = plan
    .replace(integrationTwo, '')
    .replace('- Beta.3:', `${integrationTwo}\n- Beta.3:`);
  assert(
    validateAcceleratedTopology(reordered).some((failure) => failure.includes('Integration II')),
  );
});

Deno.test('R4: control-plane corpus records the authorized prerelease flow and the #1178 human stop', async () => {
  const sop = await Deno.readTextFile('docs/governance/V044_AGENT_LOOP_SOP.md');
  const prompt = await Deno.readTextFile('docs/prompts/v0.44.0-THINKER-ORCHESTRATOR.md');
  for (const [name, text] of [['SOP', sop], ['prompt', prompt]] as const) {
    assert(
      !text.includes('Always forbidden without a new human message'),
      `${name} still carries stale per-prerelease human-gate prose`,
    );
    assertStringIncludes(text, '`beta.1` through `beta.3`');
    assertStringIncludes(text, '#1178');
  }
  assertStringIncludes(sop, 'alpha.1');
  assertStringIncludes(sop, 'unanimous');
});

async function doctrineCorpus(): Promise<ReleaseDoctrineTexts> {
  return {
    issueMap: await Deno.readTextFile('docs/roadmap/v0.44.0-ISSUES.md'),
    versionPlan: await Deno.readTextFile('docs/current/VERSION_PLAN.md'),
    sop: await Deno.readTextFile('docs/governance/V044_AGENT_LOOP_SOP.md'),
    prompt: await Deno.readTextFile('docs/prompts/v0.44.0-THINKER-ORCHESTRATOR.md'),
    plan: await Deno.readTextFile('docs/current/v0.44.0-EXECUTION-PLAN.md'),
  };
}

Deno.test('R12: the issue map never describes alpha.0 as publishable and states the full internal-only prohibition', async () => {
  const failures = validateReleaseDoctrine(await doctrineCorpus());
  assertEquals(
    failures.filter((failure) => failure.startsWith('issue map')),
    [],
  );
});

Deno.test('R13: the version plan requires the unanimous three-role GO for alpha.1-beta.3, not a human GO per candidate', async () => {
  const failures = validateReleaseDoctrine(await doctrineCorpus());
  assertEquals(
    failures.filter((failure) => failure.startsWith('version plan')),
    [],
  );
});

Deno.test('R14: the SOP, bootstrap and execution plan enforce fast-forward-only exact-SHA integration', async () => {
  const failures = validateReleaseDoctrine(await doctrineCorpus());
  assertEquals(
    failures.filter((failure) =>
      failure.startsWith('agent loop SOP') ||
      failure.startsWith('bootstrap prompt') ||
      failure.startsWith('execution plan')
    ),
    [],
  );
});

Deno.test('alpha.0 stays excluded from version closure and publication across the corpus', async () => {
  const failures = validateReleaseDoctrine(await doctrineCorpus());
  assertEquals(
    failures.filter((failure) => failure.includes('alpha.0')),
    [],
  );
});

Deno.test('release doctrine validator rejects stale publishable, human-GO and non-fast-forward text', () => {
  const good: ReleaseDoctrineTexts = {
    issueMap: '`alpha.0` is internal-only: no tag, no npm publication, no GitHub Release, ' +
      'no dist-tag, no `main` promotion and no external release action.',
    versionPlan:
      'the unanimous implementer/release-verifier/thinker GO; the only prerelease human ' +
      'promotion stop is #1178 RC admission; `alpha.0` is an internal integration baseline.',
    sop: 'advance `dev` by fast-forward only (`git merge --ff-only`); merge commits, squash ' +
      'merges, rebase-created SHAs, force pushes and evidence relabeling are forbidden; if ' +
      'fast-forward is impossible the candidate is stale and needs a new exact-SHA PR CI run; ' +
      'the prerelease release flow covers alpha candidates and `beta.1` through `beta.3`; ' +
      '`alpha.0` stays strictly unpublished.',
    prompt: 'advance `main` by fast-forward only (`git merge --ff-only`); merge commits, squash ' +
      'merges, rebase-created SHAs, force pushes and evidence relabeling are forbidden; if ' +
      'fast-forward is impossible the candidate is stale and needs a new exact-SHA PR CI run; ' +
      'the prerelease release flow covers alpha candidates and `beta.1` through `beta.3`.',
    plan: 'integrate by fast-forward only (`git merge --ff-only`).',
  };
  assertEquals(validateReleaseDoctrine(good), []);

  const publishable = structuredClone(good);
  publishable.issueMap = '`alpha.0` may publish only after foundations land.';
  assert(
    validateReleaseDoctrine(publishable).some((failure) => failure.startsWith('issue map')),
  );

  const humanGo = structuredClone(good);
  humanGo.versionPlan = `${good.versionPlan} exact human promotion GO`;
  assert(
    validateReleaseDoctrine(humanGo).some((failure) => failure.startsWith('version plan')),
  );

  const mergey = structuredClone(good);
  mergey.sop = 'merge the PR into `dev` and integrate `dev` into `main`.';
  mergey.prompt = 'merge the PR into `dev` and integrate `dev` into `main`.';
  mergey.plan = 'integrate `dev` into `main`.';
  const topologyFailures = validateReleaseDoctrine(mergey);
  assert(topologyFailures.some((failure) => failure.startsWith('agent loop SOP')));
  assert(topologyFailures.some((failure) => failure.startsWith('bootstrap prompt')));
  assert(topologyFailures.some((failure) => failure.startsWith('execution plan')));

  // Deleting `beta.3` from either corpus fails closed on the publication boundary.
  const sopStale = structuredClone(good);
  sopStale.sop = good.sop.replace('`beta.1` through `beta.3`', '`beta.1` through `beta.2`');
  assert(
    validateReleaseDoctrine(sopStale).some((failure) => failure.startsWith('agent loop SOP')),
  );
  const promptStale = structuredClone(good);
  promptStale.prompt = good.prompt.replace(
    '`beta.1` through `beta.3`',
    '`beta.1` through `beta.2`',
  );
  assert(
    validateReleaseDoctrine(promptStale).some((failure) => failure.startsWith('bootstrap prompt')),
  );
});
