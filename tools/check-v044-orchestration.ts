/** Deterministic v0.44 Alpha-workspace and Beta-release orchestration gate. */

import {
  loadV044RoleConfig,
  V044_ROLE_CONFIG_PATH,
  type V044RoleConfig,
} from './config/load-v044-roles.ts';

const root = new URL('../', import.meta.url);

function requiredFiles(config: V044RoleConfig): string[] {
  return [
    config.profiles.implementer.agentFile,
    config.profiles.releaseVerifier.agentFile,
    V044_ROLE_CONFIG_PATH,
    'tools/run-v044-role.ts',
    'tools/check-role-neutral-docs.ts',
    'docs/adr/ADR-0146-three-role-agent-execution-control-plane.md',
    'docs/adr/ADR-0147-internal-alpha-workspace-train.md',
    'docs/current/v0.44.0-ALPHA-CONTRACT.md',
    'docs/current/v0.44.0-AUTONOMOUS-GOAL.md',
    'docs/current/v0.44.0-EXECUTION-PLAN.md',
    'docs/current/v0.44.0-EXECUTION-STATE.json',
    'docs/current/VERSION_PLAN.md',
    'docs/governance/V044_ALPHA_WORKSPACE_SOP.md',
    'docs/governance/V044_AGENT_LOOP_SOP.md',
    'docs/governance/V044_ISSUE_SOP.md',
    'docs/prompts/v0.44.0-ALPHA-WORKSPACE-TRAIN.md',
    'docs/prompts/v0.44.0-ALPHA-SEVEN-SUBAGENTS.md',
    'docs/prompts/v0.44.0-THINKER-ORCHESTRATOR.md',
    'docs/roadmap/v0.44.0-ISSUES.md',
    'tools/config/v044-alpha-workspaces.json',
  ];
}

const allowedStatuses = new Set([
  'READY',
  'DISPATCHED',
  'IMPLEMENTED',
  'REVIEWED',
  'VERIFIED',
  'REPAIR',
  'VERSION_CLOSURE',
  'AWAITING_HUMAN_GO',
  'BLOCKED_DIRTY_WORKTREE',
  'BLOCKED_EXECUTOR_UNAVAILABLE',
  'BLOCKED_TRUTH_DRIFT',
  'BLOCKED_EXTERNAL',
  'COMPLETE',
]);

const ALPHA_WORKSPACES = Array.from({ length: 8 }, (_, index) => `alpha.${index + 1}`);

export function validateExecutionState(
  state: Record<string, unknown>,
  config: V044RoleConfig,
): string[] {
  const failures: string[] = [];
  if (state.schemaVersion !== 2) failures.push('execution state schemaVersion must be 2');
  if (state.train !== '0.44.0') failures.push('execution state train must be 0.44.0');
  if (typeof state.status !== 'string' || !allowedStatuses.has(state.status)) {
    failures.push(`execution state status is invalid: ${String(state.status)}`);
  }
  if (typeof state.currentIssue !== 'number' || !Number.isInteger(state.currentIssue)) {
    failures.push('execution state currentIssue must be an integer');
  }
  const alphaExecutionModes = new Set([
    'independent-alpha-workspaces',
    'alpha8-integration-plus-alpha9-semantic-convergence',
  ]);
  if (typeof state.executionMode !== 'string' || !alphaExecutionModes.has(state.executionMode)) {
    failures.push('Alpha executionMode must be the workspace or integration/convergence mode');
  }
  if (state.threeRoleLoopActive !== false) {
    failures.push('three-role loop must be disabled throughout Alpha');
  }
  for (const forbidden of ['implementer', 'releaseVerifier']) {
    if (forbidden in state) {
      failures.push(`Alpha execution state must not embed ${forbidden} session state`);
    }
  }
  const workspaces = state.workspaces;
  if (!workspaces || typeof workspaces !== 'object') {
    failures.push('execution state workspaces must be an object');
  } else {
    for (const workspace of ALPHA_WORKSPACES) {
      if (!(workspace in workspaces)) failures.push(`execution state omits ${workspace}`);
    }
    if (
      state.executionMode === 'alpha8-integration-plus-alpha9-semantic-convergence' &&
      !('alpha.9' in workspaces)
    ) {
      failures.push('Alpha integration/convergence state omits alpha.9');
    }
  }
  if (
    typeof state.authoritativeCiOwner !== 'string' ||
    !(state.authoritativeCiOwner.includes('alpha.8') ||
      state.authoritativeCiOwner.includes('PR #1199'))
  ) {
    failures.push('authoritative full CI owner must be PR #1199 exact head');
  }
  if (state.betaThreeRoleExecutorConfig !== V044_ROLE_CONFIG_PATH) {
    failures.push(`Beta executor configuration must reference ${V044_ROLE_CONFIG_PATH}`);
  }
  if (!config.profiles.implementer || !config.profiles.releaseVerifier) {
    failures.push('Beta role profiles must remain configured for post-Alpha release work');
  }
  if (state.parallelReady !== true) {
    failures.push('Alpha workspace state must be parallelReady after #1193 closes');
  }
  if (state.integrationBaseEvidenceIssue !== 1193) {
    failures.push('Alpha common-base evidence must resolve from issue #1193');
  }
  if (state.workspaceConfig !== 'tools/config/v044-alpha-workspaces.json') {
    failures.push('Alpha state must reference the executable workspace configuration');
  }
  if (state.collaborationContract !== 'docs/current/v0.44.0-ALPHA-CONTRACT.md') {
    failures.push('Alpha state must reference the collaboration contract');
  }
  return failures;
}

/** Beta capability contract remains available but is not activated by Alpha state. */
export function validateExecutorContract(config: V044RoleConfig): string[] {
  const failures: string[] = [];
  if (config.executor.contextTokens !== 262144) {
    failures.push(`executor contextTokens must be 262144, got ${config.executor.contextTokens}`);
  }
  if (config.executor.defaultEffort !== 'high') {
    failures.push(`executor defaultEffort must be high, got ${config.executor.defaultEffort}`);
  }
  for (const capability of ['thinking', 'tool_use']) {
    if (!config.executor.requiredCapabilities.includes(capability)) {
      failures.push(`executor requiredCapabilities must include ${capability}`);
    }
  }
  return failures;
}

const REQUIRED_ISSUES = [
  723,
  1088,
  1150,
  1156,
  1157,
  1158,
  1159,
  1160,
  1161,
  1162,
  1163,
  1164,
  1165,
  1166,
  1167,
  1168,
  1169,
  1170,
  1171,
  1172,
  1173,
  1174,
  1175,
  1176,
  1177,
  1178,
  1181,
  1182,
  1187,
  1188,
  1189,
  1192,
  1193,
];

const WORKSPACE_ISSUES = [
  { workspace: 'alpha.1', issues: [1161, 1162, 1163] },
  { workspace: 'alpha.2', issues: [1164, 1165, 1166, 723, 1167] },
  { workspace: 'alpha.3', issues: [1168, 1169, 1170] },
  { workspace: 'alpha.4', issues: [1088, 1171, 1172, 1173, 1163] },
  { workspace: 'alpha.5', issues: [1174] },
  { workspace: 'alpha.6', issues: [1175] },
  { workspace: 'alpha.7', issues: [1176] },
  { workspace: 'alpha.8', issues: [1181] },
] as const;

type AlphaWorkspaceConfig = {
  schemaVersion?: unknown;
  commonBase?: Record<string, unknown>;
  contract?: unknown;
  workspaces?: Array<Record<string, unknown>>;
  integration?: Record<string, unknown>;
};

export function validateAlphaWorkspaceConfig(raw: AlphaWorkspaceConfig): string[] {
  const failures: string[] = [];
  if (raw.schemaVersion !== 1) failures.push('Alpha workspace config schemaVersion must be 1');
  if (raw.commonBase?.branch !== 'dev' || raw.commonBase?.evidenceIssue !== 1193) {
    failures.push('Alpha workspace config common base must resolve from dev and issue #1193');
  }
  if (raw.contract !== 'docs/current/v0.44.0-ALPHA-CONTRACT.md') {
    failures.push('Alpha workspace config must reference the collaboration contract');
  }

  const workspaces = raw.workspaces ?? [];
  const owners = new Map<string, string>();
  for (const expected of WORKSPACE_ISSUES.slice(0, 7)) {
    const workspace = workspaces.find((entry) => entry.id === expected.workspace);
    if (!workspace) {
      failures.push(`Alpha workspace config omits ${expected.workspace}`);
      continue;
    }
    const issues = Array.isArray(workspace.issues) ? workspace.issues : [];
    for (const issue of expected.issues) {
      if (!issues.includes(issue)) failures.push(`${expected.workspace} config omits #${issue}`);
    }
    const writePaths = Array.isArray(workspace.writePaths) ? workspace.writePaths : [];
    if (writePaths.length === 0 || writePaths.some((path) => typeof path !== 'string')) {
      failures.push(`${expected.workspace} must own one or more string write paths`);
      continue;
    }
    for (const path of writePaths as string[]) {
      if (path.startsWith('/') || path.includes('..')) {
        failures.push(`${expected.workspace} has unsafe write path ${path}`);
      }
      for (const [ownedPath, owner] of owners) {
        const overlap = path === ownedPath ||
          (path.endsWith('/') && ownedPath.startsWith(path)) ||
          (ownedPath.endsWith('/') && path.startsWith(ownedPath));
        if (overlap) {
          failures.push(`${expected.workspace} write path ${path} overlaps ${owner}:${ownedPath}`);
        }
      }
      owners.set(path, expected.workspace);
    }
  }
  if (workspaces.length !== 7) {
    failures.push('Alpha workspace config must contain exactly 7 writers');
  }
  if (
    raw.integration?.id !== 'alpha.8' || raw.integration?.issue !== 1181 ||
    raw.integration?.role !== 'sole-aggregator' || raw.integration?.authoritativeFullCi !== true
  ) {
    failures.push('Alpha integration config must make alpha.8 the sole full-CI aggregator');
  }
  // #1181: the alpha.8 restricted integration permission must be recorded as an
  // executable write-path whitelist, not prose. Entries are repo-relative file
  // paths or '/'-suffixed directory prefixes; bare top-level directories and
  // glob/absolute/parent-escaping entries are rejected so the boundary stays
  // bounded and machine-checkable.
  const integrationPaths = raw.integration?.writePaths;
  if (
    !Array.isArray(integrationPaths) || integrationPaths.length === 0 ||
    integrationPaths.some((path) => typeof path !== 'string')
  ) {
    failures.push('Alpha integration config must record a non-empty string write-path whitelist');
  } else {
    const bareTopLevel = [
      'packages/',
      'tools/',
      'docs/',
      'www/',
      'examples/',
      'tests/',
      'benchmarks/',
      'e2e/',
    ];
    for (const path of integrationPaths as string[]) {
      if (
        path === '' || path === '.' || path.startsWith('/') || path.includes('..') ||
        path.includes('*')
      ) {
        failures.push(`Alpha integration has unsafe write path ${path}`);
      } else if (bareTopLevel.includes(path)) {
        failures.push(`Alpha integration write path ${path} is a bare top-level directory`);
      }
    }
  }
  return failures;
}

export function validateAlphaWorkspaceTopology(plan: string): string[] {
  const failures: string[] = [];
  const lines = plan.split('\n');
  const alphaZero = lines.find((line) => line.includes('`alpha.0`'));
  if (!alphaZero) {
    failures.push('execution plan omits alpha.0 foundation');
  } else {
    for (const issue of [1160, 1182, 1193]) {
      if (!alphaZero.includes(`#${issue}`)) failures.push(`alpha.0 foundation omits #${issue}`);
    }
  }

  for (const { workspace, issues } of WORKSPACE_ISSUES) {
    const row = lines.find((line) => line.startsWith('|') && line.includes(workspace));
    if (!row) {
      failures.push(`execution plan omits ${workspace} workspace`);
      continue;
    }
    for (const issue of issues) {
      if (!row.includes(`#${issue}`)) failures.push(`${workspace} workspace omits #${issue}`);
    }
  }

  const normalized = plan.replaceAll(/\s+/gu, ' ');
  for (
    const required of [
      'parallel development in independent workspaces',
      'one final integration workspace',
      'does not use the three-role release loop',
      'One agent owns each alpha.1-alpha.7 workspace end-to-end',
      'Alpha integration agent is the only aggregator',
      'PR #1199 runs the only full matrix',
      'No internal Alpha ID causes a tag',
      'Beta.1',
      'Beta.3',
    ]
  ) {
    if (!normalized.includes(required)) failures.push(`execution plan omits "${required}"`);
  }
  if (
    /invoke the configured implementer/iu.test(plan) ||
    /fresh release verifier session/iu.test(plan)
  ) {
    failures.push('execution plan activates a three-role Alpha implementation or verifier flow');
  }
  return failures;
}

export interface ReleaseDoctrineTexts {
  issueMap: string;
  versionPlan: string;
  alphaSop: string;
  alphaPrompt: string;
  betaSop: string;
  betaPrompt: string;
  plan: string;
}

export function validateReleaseDoctrine(texts: ReleaseDoctrineTexts): string[] {
  const failures: string[] = [];
  const normalize = (text: string) => text.replaceAll(/^>\s?/gmu, '').replaceAll(/\s+/gu, ' ');
  const issueMap = normalize(texts.issueMap);
  const versionPlan = normalize(texts.versionPlan);
  const alphaSop = normalize(texts.alphaSop);
  const alphaPrompt = normalize(texts.alphaPrompt);
  const betaSop = normalize(texts.betaSop);
  const betaPrompt = normalize(texts.betaPrompt);
  const plan = normalize(texts.plan);

  if (/alpha\.\d+\s+may\s+publish/iu.test(issueMap)) {
    failures.push('issue map describes an internal Alpha identifier as publishable');
  }
  for (
    const required of [
      'internal identifiers',
      'no tag',
      'no npm publication',
      'no GitHub Release',
      'no dist-tag',
      'no `main` promotion',
      'three-role loop is disabled',
    ]
  ) {
    if (!issueMap.includes(required)) failures.push(`issue map omits "${required}"`);
  }

  for (
    const required of [
      'internal work identifiers',
      'three-role release loop is disabled throughout Alpha',
      'It begins at Beta.1',
      'not npm versions',
    ]
  ) {
    if (!versionPlan.includes(required)) failures.push(`version plan omits "${required}"`);
  }

  for (
    const required of [
      'The three-role release SOP does not apply during this phase',
      'One worktree, branch and writing agent per Alpha workspace',
      'Alpha.8 is created as the integration workspace',
      'No three-role GO or release-verifier session',
      'Do not run `v044:executor:check` during Alpha',
      '`tools/config/v044-alpha-workspaces.json` is the executable write boundary',
    ]
  ) {
    if (!alphaSop.includes(required)) failures.push(`Alpha workspace SOP omits "${required}"`);
  }
  if (/start a fresh release verifier/iu.test(alphaSop)) {
    failures.push('Alpha workspace SOP starts a release verifier');
  }

  for (
    const required of [
      'Launch one subagent per workspace',
      'fewer than seven subagent slots',
      'source-to-integrated SHA mapping',
      'Only alpha.8 opens a pull request to `dev`',
      'does not use the thinker, implementer or release-verifier loop',
    ]
  ) {
    if (!alphaPrompt.includes(required)) failures.push(`seven-subagent prompt omits "${required}"`);
  }

  for (
    const [name, text] of [
      ['Beta agent loop SOP', betaSop],
      ['Beta bootstrap prompt', betaPrompt],
    ] as const
  ) {
    for (const required of ['Beta.1', 'Beta.3', '--ff-only', '#1178']) {
      if (!text.includes(required) && !text.includes(required.toLowerCase())) {
        failures.push(`${name} omits "${required}"`);
      }
    }
  }
  if (!betaSop.includes('does not govern the internal Alpha workspace train')) {
    failures.push('Beta agent loop SOP does not exclude Alpha');
  }
  if (!betaPrompt.includes('Do not use this prompt during Alpha')) {
    failures.push('Beta bootstrap prompt does not exclude Alpha');
  }

  for (
    const required of [
      'does not use the three-role release loop',
      'No internal Alpha ID causes a tag',
      'PR #1199 runs the only full matrix',
    ]
  ) {
    if (!plan.includes(required)) failures.push(`execution plan omits "${required}"`);
  }
  return failures;
}

async function main(): Promise<void> {
  const failures: string[] = [];
  const config = await loadV044RoleConfig(root);

  async function read(path: string): Promise<string> {
    try {
      return await Deno.readTextFile(new URL(path, root));
    } catch (error) {
      failures.push(`missing or unreadable ${path}: ${String(error)}`);
      return '';
    }
  }

  for (const file of requiredFiles(config)) await read(file);

  let state: Record<string, unknown> = {};
  try {
    state = JSON.parse(await read('docs/current/v0.44.0-EXECUTION-STATE.json'));
  } catch (error) {
    failures.push(`execution state is not valid JSON: ${String(error)}`);
  }
  failures.push(...validateExecutionState(state, config));
  failures.push(...validateExecutorContract(config));

  let alphaWorkspaceConfig: AlphaWorkspaceConfig = {};
  try {
    alphaWorkspaceConfig = JSON.parse(
      await read('tools/config/v044-alpha-workspaces.json'),
    ) as AlphaWorkspaceConfig;
  } catch (error) {
    failures.push(`Alpha workspace config is not valid JSON: ${String(error)}`);
  }
  failures.push(...validateAlphaWorkspaceConfig(alphaWorkspaceConfig));

  const plan = await read('docs/current/v0.44.0-EXECUTION-PLAN.md');
  const issueMap = await read('docs/roadmap/v0.44.0-ISSUES.md');
  for (const issue of REQUIRED_ISSUES) {
    if (!plan.includes(`#${issue}`)) failures.push(`execution plan omits #${issue}`);
    if (!issueMap.includes(`#${issue}`)) failures.push(`issue map omits #${issue}`);
  }
  failures.push(...validateAlphaWorkspaceTopology(plan));

  failures.push(...validateReleaseDoctrine({
    issueMap,
    versionPlan: await read('docs/current/VERSION_PLAN.md'),
    alphaSop: await read('docs/governance/V044_ALPHA_WORKSPACE_SOP.md'),
    alphaPrompt: await read('docs/prompts/v0.44.0-ALPHA-SEVEN-SUBAGENTS.md'),
    betaSop: await read('docs/governance/V044_AGENT_LOOP_SOP.md'),
    betaPrompt: await read('docs/prompts/v0.44.0-THINKER-ORCHESTRATOR.md'),
    plan,
  }));

  if (failures.length > 0) {
    console.error('v0.44 orchestration check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    Deno.exit(1);
  }

  console.log(
    `v0.44 orchestration check passed (${requiredFiles(config).length} control files, ` +
      `${REQUIRED_ISSUES.length} scheduled issues, 8 internal Alpha workspaces, ` +
      'three-role release loop deferred to Beta.1).',
  );
}

if (import.meta.main) await main();
