type KimiModel = {
  provider?: string;
  model?: string;
  displayName?: string;
  maxContextSize?: number;
  defaultEffort?: string;
  supportEfforts?: string[];
  capabilities?: string[];
};

async function run(args: string[]): Promise<string> {
  const command = new Deno.Command('kimi', {
    args,
    stdout: 'piped',
    stderr: 'piped',
  });
  let output: Deno.CommandOutput;
  try {
    output = await command.output();
  } catch (error) {
    throw new Error(`kimi is unavailable: ${String(error)}`);
  }
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  if (!output.success) {
    throw new Error(`kimi ${args.join(' ')} failed (${output.code}): ${stderr.trim()}`);
  }
  return stdout;
}

const version = (await run(['--version'])).trim();
const providerJson = JSON.parse(await run(['provider', 'list', '--json'])) as {
  models?: Record<string, KimiModel> | KimiModel[];
};
const models = Array.isArray(providerJson.models)
  ? providerJson.models
  : Object.entries(providerJson.models ?? {}).map(([alias, model]) => ({
    ...model,
    alias,
  }));
const model = models.find((candidate) =>
  candidate.provider === 'managed:kimi-code' && candidate.model === 'k3-256k' &&
  ('alias' in candidate ? candidate.alias === 'kimi-code/k3-256k' : true)
);

if (!model) {
  throw new Error('managed:kimi-code k3-256k is not configured');
}

const failures: string[] = [];
if (model.maxContextSize !== 262144) {
  failures.push(`expected maxContextSize 262144, got ${String(model.maxContextSize)}`);
}
if (model.defaultEffort !== 'high') {
  failures.push(`expected defaultEffort high, got ${String(model.defaultEffort)}`);
}
if (!model.supportEfforts?.includes('high')) failures.push('high effort is unsupported');
for (const capability of ['thinking', 'tool_use']) {
  if (!model.capabilities?.includes(capability)) {
    failures.push(`missing capability ${capability}`);
  }
}

if (failures.length > 0) {
  throw new Error(`K3-256k capability mismatch:\n${failures.map((x) => `- ${x}`).join('\n')}`);
}

console.log(
  `v0.44 executor check passed (kimi ${version}, alias kimi-code/k3-256k, context 262144, default effort high).`,
);
