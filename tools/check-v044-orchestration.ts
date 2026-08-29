/**
 * v0.44 orchestration preflight (#1156, ADR-0146).
 *
 * Validates the control-plane files and the execution-state cursor. Exact
 * executor identity is never hardcoded here or read from documentation: the
 * executable configuration under tools/config/ is the single source, and the
 * execution state may only reference roles plus that configuration path.
 */

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
    'docs/current/v0.44.0-AUTONOMOUS-GOAL.md',
    'docs/current/v0.44.0-EXECUTION-PLAN.md',
    'docs/current/v0.44.0-EXECUTION-STATE.json',
    'docs/current/VERSION_PLAN.md',
    'docs/evidence/v0.44.0-agent-loops/README.md',
    'docs/evidence/v0.44.0-agent-loops/TEMPLATE.md',
    'docs/governance/V044_AGENT_LOOP_SOP.md',
    'docs/governance/V044_ISSUE_SOP.md',
    'docs/prompts/v0.44.0-THINKER-ORCHESTRATOR.md',
    'docs/roadmap/v0.44.0-ISSUES.md',
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

/** Executor identity keys that must live only in executable configuration. */
const FORBIDDEN_STATE_IDENTITY_KEYS = ['command', 'model', 'provider', 'agentFile'];

export function validateExecutionState(
  state: Record<string, unknown>,
  config: V044RoleConfig,
): string[] {
  const failures: string[] = [];
  if (state.schemaVersion !== 1) failures.push('execution state schemaVersion must be 1');
  if (state.train !== '0.44.0') failures.push('execution state train must be 0.44.0');
  if (typeof state.status !== 'string' || !allowedStatuses.has(state.status)) {
    failures.push(`execution state status is invalid: ${String(state.status)}`);
  }
  if (typeof state.currentIssue !== 'number' || !Number.isInteger(state.currentIssue)) {
    failures.push('execution state currentIssue must be an integer');
  }

  for (
    const [block, profileKey] of [
      ['implementer', 'implementer'],
      ['releaseVerifier', 'releaseVerifier'],
    ] as const
  ) {
    const value = state[block];
    if (!value || typeof value !== 'object') {
      failures.push(`execution state ${block} must be an object`);
      continue;
    }
    const record = value as Record<string, unknown>;
    for (const key of FORBIDDEN_STATE_IDENTITY_KEYS) {
      if (key in record) {
        failures.push(
          `execution state ${block}.${key} embeds executor identity; ` +
            `it must live only in ${V044_ROLE_CONFIG_PATH}`,
        );
      }
    }
    if (record.roleProfile !== profileKey) {
      failures.push(`execution state ${block}.roleProfile must be ${profileKey}`);
    } else if (!(profileKey in config.profiles)) {
      failures.push(
        `execution state ${block}.roleProfile is missing from the executable configuration`,
      );
    }
    if (record.executorConfig !== V044_ROLE_CONFIG_PATH) {
      failures.push(`execution state ${block}.executorConfig must be ${V044_ROLE_CONFIG_PATH}`);
    }
    if (!('sessionId' in record)) {
      failures.push(`execution state ${block}.sessionId must be present`);
    }
  }

  const verifier = state.releaseVerifier as Record<string, unknown> | undefined;
  if (verifier && verifier.sessionPolicy !== config.profiles.releaseVerifier.sessionPolicy) {
    failures.push(
      'execution state releaseVerifier.sessionPolicy must match the executable configuration',
    );
  }
  return failures;
}

/** The capability contract stays pinned even though identity moved to configuration. */
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

/** Accelerated Alpha topology: minimal alpha.0, parallel lanes, serial integration. */
const MINIMAL_ALPHA_ZERO_ISSUES = [1160, 1182, 1193] as const;
const BETA_THREE_ISSUES = [1192, 1156, 1187, 1188, 1189] as const;
const ACCELERATED_LANES = [
  { lane: 'Compiler', issues: [1161, 1162, 1163] },
  { lane: 'Runtime', issues: [1164, 1165, 1166, 723, 1167] },
  { lane: 'SSR', issues: [1168, 1169, 1170] },
  { lane: 'App', issues: [1088, 1171, 1172, 1173] },
] as const;
const FINAL_ALPHA_ISSUES = [1174, 1175, 1176, 1181] as const;

function sectionRange(plan: string, heading: RegExp): [number, number] | null {
  const match = heading.exec(plan);
  if (!match) return null;
  const end = plan.indexOf('\n## ', match.index + 1);
  return [match.index, end === -1 ? plan.length : end];
}

/**
 * Accelerated topology contract: alpha.0 is reduced to the accepted compiler
 * proof, exact-SHA baseline and branch safety; governance hardening moved to
 * Beta.3; lanes develop in parallel and integrate serially at Integration I
 * (gating broad App/Delivery work) and Integration II (gating Final Alpha
 * legacy removal).
 */
export function validateAcceleratedTopology(plan: string): string[] {
  const failures: string[] = [];
  const lines = plan.split('\n');

  const alphaZeroRow = lines.find((line) => line.startsWith('| `alpha.0`'));
  if (!alphaZeroRow) {
    failures.push('execution plan has no minimal alpha.0 phase row');
  } else {
    for (const issue of MINIMAL_ALPHA_ZERO_ISSUES) {
      if (!alphaZeroRow.includes(`#${issue}`)) {
        failures.push(`minimal alpha.0 phase omits #${issue}`);
      }
    }
    for (const issue of BETA_THREE_ISSUES) {
      if (alphaZeroRow.includes(`#${issue}`)) {
        failures.push(`minimal alpha.0 phase still carries deferred hardening issue #${issue}`);
      }
    }
  }

  const betaThreeLine = lines.find((line) => /Beta\.3\s*:/u.test(line));
  if (!betaThreeLine) {
    failures.push('execution plan has no Beta.3 hardening assignment');
  } else {
    for (const issue of BETA_THREE_ISSUES) {
      if (!betaThreeLine.includes(`#${issue}`)) {
        failures.push(`Beta.3 hardening omits #${issue}`);
      }
    }
  }

  for (const { lane, issues } of ACCELERATED_LANES) {
    const row = lines.find((line) => line.startsWith('|') && line.includes(lane));
    if (!row) {
      failures.push(`execution plan has no ${lane} lane row`);
      continue;
    }
    for (const issue of issues) {
      if (!row.includes(`#${issue}`)) failures.push(`${lane} lane omits #${issue}`);
    }
    if (lane === 'App' && !row.includes('Integration I')) {
      failures.push('App/Delivery lane starts broad work before Integration I');
    }
  }

  const integrationOne = sectionRange(plan, /^## Integration I\s*$/mu);
  const integrationTwo = sectionRange(plan, /^## Integration II\s*$/mu);
  const finalAlpha = sectionRange(plan, /^## Final Alpha\s*$/mu);
  if (!integrationOne) failures.push('execution plan omits the Integration I checkpoint');
  if (!integrationTwo) failures.push('execution plan omits the Integration II checkpoint');
  if (!finalAlpha) failures.push('execution plan omits the Final Alpha phase');
  if (integrationOne && finalAlpha && integrationOne[0] > finalAlpha[0]) {
    failures.push('Integration I must precede broad App/Delivery and Final Alpha work');
  }
  if (integrationTwo && finalAlpha && integrationTwo[0] > finalAlpha[0]) {
    failures.push('Integration II must precede Final Alpha legacy removal');
  }
  if (integrationTwo && !plan.slice(...integrationTwo).includes('#1174')) {
    failures.push('Integration II must gate Final Alpha legacy removal (#1174)');
  }
  if (finalAlpha) {
    const section = plan.slice(...finalAlpha);
    for (const issue of FINAL_ALPHA_ISSUES) {
      if (!section.includes(`#${issue}`)) failures.push(`Final Alpha omits #${issue}`);
    }
  }
  return failures;
}

/**
 * R12–R14 release-doctrine and integration-topology contract (#1156).
 *
 * Deterministically rejects the contradictions the repair-4 review found:
 * an alpha.0-publishable issue map (R12), a per-candidate human promotion GO
 * in the version plan (R13), and undocumented exact-SHA fast-forward
 * topology (R14). Anchors are exact phrases owned by the control-plane docs.
 */
export interface ReleaseDoctrineTexts {
  issueMap: string;
  versionPlan: string;
  sop: string;
  prompt: string;
  plan: string;
}

export function validateReleaseDoctrine(texts: ReleaseDoctrineTexts): string[] {
  const failures: string[] = [];
  // Markdown prose reflows under the formatter; match anchors on
  // whitespace-normalized text so wrapping never breaks the contract.
  const issueMap = texts.issueMap.replaceAll(/\s+/gu, ' ');
  const versionPlan = texts.versionPlan.replaceAll(/\s+/gu, ' ');
  const sop = texts.sop.replaceAll(/\s+/gu, ' ');
  const prompt = texts.prompt.replaceAll(/\s+/gu, ' ');
  const plan = texts.plan.replaceAll(/\s+/gu, ' ');

  // R12: alpha.0 is internal-only and can never be published.
  if (/\balpha\.0`?\s+may\s+publish/iu.test(issueMap)) {
    failures.push(
      'issue map still describes `alpha.0` as publishable; it is an internal-only baseline',
    );
  }
  for (
    const required of [
      '`alpha.0` is internal-only',
      'no tag',
      'no npm publication',
      'no GitHub Release',
      'no dist-tag',
      'no `main` promotion',
      'no external release action',
    ]
  ) {
    if (!issueMap.includes(required)) {
      failures.push(`issue map omits "${required}"`);
    }
  }

  // R13: alpha.1–beta.3 close on the unanimous three-role GO; the only human
  // stop on the prerelease train is #1178 RC admission.
  if (versionPlan.includes('exact human promotion GO')) {
    failures.push(
      'version plan still requires an exact human promotion GO for every alpha/beta candidate',
    );
  }
  for (
    const required of [
      'implementer/release-verifier/thinker GO',
      'only prerelease human promotion stop is #1178 RC admission',
    ]
  ) {
    if (!versionPlan.includes(required)) {
      failures.push(`version plan omits "${required}"`);
    }
  }

  // R14: the proved PR head SHA is preserved through `dev` and `main` by
  // fast-forward only; a moved base refreezes the candidate with new PR CI.
  for (
    const [name, text] of [
      ['agent loop SOP', sop],
      ['bootstrap prompt', prompt],
    ] as const
  ) {
    for (
      const required of [
        '--ff-only',
        'fast-forward is impossible',
        'new exact-SHA PR CI',
        'merge commits, squash',
        'evidence relabeling',
      ]
    ) {
      if (!text.includes(required)) failures.push(`${name} omits "${required}"`);
    }
  }
  for (const required of ['fast-forward', '--ff-only']) {
    if (!plan.includes(required)) {
      failures.push(`execution plan omits "${required}"`);
    }
  }

  // Beta.3 publication boundary: the authorized public prerelease range runs
  // through the Beta.3 governance/release-hardening wave, not beta.2.
  for (
    const [name, text] of [
      ['agent loop SOP', sop],
      ['bootstrap prompt', prompt],
    ] as const
  ) {
    if (!text.includes('`beta.1` through `beta.3`')) {
      failures.push(`${name} omits the Beta.3 publication boundary`);
    }
  }

  // Probe 4: alpha.0 stays excluded from version closure and publication.
  if (!sop.includes('stays strictly unpublished')) {
    failures.push('agent loop SOP omits the `alpha.0` unpublished exclusion');
  }
  if (!versionPlan.includes('internal integration baseline')) {
    failures.push('version plan omits the `alpha.0` internal integration baseline');
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

  const files = requiredFiles(config);
  for (const file of files) await read(file);

  let state: Record<string, unknown> = {};
  try {
    state = JSON.parse(await read('docs/current/v0.44.0-EXECUTION-STATE.json'));
  } catch (error) {
    failures.push(`execution state is not valid JSON: ${String(error)}`);
  }
  failures.push(...validateExecutionState(state, config));
  failures.push(...validateExecutorContract(config));

  const plan = await read('docs/current/v0.44.0-EXECUTION-PLAN.md');
  const issueMap = await read('docs/roadmap/v0.44.0-ISSUES.md');
  for (const issue of REQUIRED_ISSUES) {
    if (!plan.includes(`#${issue}`)) failures.push(`execution plan omits #${issue}`);
    if (!issueMap.includes(`#${issue}`)) failures.push(`issue map omits #${issue}`);
  }
  failures.push(...validateAcceleratedTopology(plan));
  for (
    const required of [
      'CI evidence tier',
      'parallel development',
      'serial integration',
      'Integration I',
      'Integration II',
      'Beta.3',
    ]
  ) {
    if (!plan.includes(required)) failures.push(`execution plan omits "${required}"`);
  }

  const versionPlan = await read('docs/current/VERSION_PLAN.md');
  for (const required of ['internal integration baseline', 'release closure']) {
    if (!versionPlan.toLowerCase().includes(required.toLowerCase())) {
      failures.push(`version plan omits "${required}"`);
    }
  }

  const prompt = await read('docs/prompts/v0.44.0-THINKER-ORCHESTRATOR.md');
  for (
    const required of [
      'thinker',
      'implementer',
      'release verifier',
      'deno task v044:role',
      'AWAITING_HUMAN_GO',
      V044_ROLE_CONFIG_PATH,
    ]
  ) {
    if (!prompt.includes(required)) failures.push(`bootstrap prompt omits ${required}`);
  }

  const sop = await read('docs/governance/V044_AGENT_LOOP_SOP.md');
  for (
    const required of [
      'test-first',
      'fresh',
      'production code',
      'deno task v044:executor:check',
      'deno task v044:role',
      'CI evidence tier',
      V044_ROLE_CONFIG_PATH,
    ]
  ) {
    if (!sop.toLowerCase().includes(required.toLowerCase())) {
      failures.push(`agent loop SOP omits ${required}`);
    }
  }

  failures.push(...validateReleaseDoctrine({ issueMap, versionPlan, sop, prompt, plan }));

  if (failures.length > 0) {
    console.error('v0.44 orchestration check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    Deno.exit(1);
  }

  console.log(
    `v0.44 orchestration check passed (${files.length} control files, ${REQUIRED_ISSUES.length} scheduled issues, role-neutral executor configuration).`,
  );
}

if (import.meta.main) await main();
