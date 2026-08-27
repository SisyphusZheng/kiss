const root = new URL('../', import.meta.url);

const requiredFiles = [
  '.agents/v044-kimi-implementer.md',
  '.agents/v044-kimi-release-verifier.md',
  'docs/adr/ADR-0146-three-role-agent-execution-control-plane.md',
  'docs/current/v0.44.0-AUTONOMOUS-GOAL.md',
  'docs/current/v0.44.0-EXECUTION-PLAN.md',
  'docs/current/v0.44.0-EXECUTION-STATE.json',
  'docs/evidence/v0.44.0-agent-loops/README.md',
  'docs/evidence/v0.44.0-agent-loops/TEMPLATE.md',
  'docs/governance/V044_AGENT_LOOP_SOP.md',
  'docs/governance/V044_ISSUE_SOP.md',
  'docs/prompts/v0.44.0-SOL-ORCHESTRATOR.md',
  'docs/roadmap/v0.44.0-ISSUES.md',
];

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

const failures: string[] = [];

async function read(path: string): Promise<string> {
  try {
    return await Deno.readTextFile(new URL(path, root));
  } catch (error) {
    failures.push(`missing or unreadable ${path}: ${String(error)}`);
    return '';
  }
}

for (const file of requiredFiles) await read(file);

const stateText = await read('docs/current/v0.44.0-EXECUTION-STATE.json');
let state: Record<string, unknown> = {};
try {
  state = JSON.parse(stateText);
} catch (error) {
  failures.push(`execution state is not valid JSON: ${String(error)}`);
}

if (state.schemaVersion !== 1) failures.push('execution state schemaVersion must be 1');
if (state.train !== '0.44.0') failures.push('execution state train must be 0.44.0');
if (typeof state.status !== 'string' || !allowedStatuses.has(state.status)) {
  failures.push(`execution state status is invalid: ${String(state.status)}`);
}
if (typeof state.currentIssue !== 'number' || !Number.isInteger(state.currentIssue)) {
  failures.push('execution state currentIssue must be an integer');
}

for (const role of ['implementer', 'releaseVerifier'] as const) {
  const value = state[role];
  if (!value || typeof value !== 'object') {
    failures.push(`execution state ${role} must be an object`);
    continue;
  }
  const config = value as Record<string, unknown>;
  if (config.model !== 'kimi-code/k3-256k') {
    failures.push(`${role}.model must be kimi-code/k3-256k`);
  }
  if (config.contextTokens !== 262144) {
    failures.push(`${role}.contextTokens must be 262144`);
  }
  if (config.effort !== 'high') failures.push(`${role}.effort must be high`);
}

const plan = await read('docs/current/v0.44.0-EXECUTION-PLAN.md');
const issueMap = await read('docs/roadmap/v0.44.0-ISSUES.md');
const requiredIssues = [
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
];
for (const issue of requiredIssues) {
  if (!plan.includes(`#${issue}`)) failures.push(`execution plan omits #${issue}`);
  if (!issueMap.includes(`#${issue}`)) failures.push(`issue map omits #${issue}`);
}

const prompt = await read('docs/prompts/v0.44.0-SOL-ORCHESTRATOR.md');
for (
  const required of [
    'gpt-5.6-sol',
    'reasoning effort `low`',
    'kimi-code/k3-256k',
    '.agents/v044-kimi-implementer.md',
    '.agents/v044-kimi-release-verifier.md',
    'AWAITING_HUMAN_GO',
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
    'kimi-code/k3-256k',
  ]
) {
  if (!sop.toLowerCase().includes(required.toLowerCase())) {
    failures.push(`agent loop SOP omits ${required}`);
  }
}

if (failures.length > 0) {
  console.error('v0.44 orchestration check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  Deno.exit(1);
}

console.log(
  `v0.44 orchestration check passed (${requiredFiles.length} control files, ${requiredIssues.length} scheduled issues).`,
);
