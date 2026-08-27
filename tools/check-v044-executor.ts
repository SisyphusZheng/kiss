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

async function smokeAgentProfile(path: string, marker: string): Promise<void> {
  const output = await run([
    '--model',
    'kimi-code/k3-256k',
    '--agent-file',
    path,
    '--output-format',
    'stream-json',
    '--prompt',
    `Profile-load preflight only. Do not use tools or edit files. Include ${marker} in your response.`,
  ]);
  const assistantContent = output.split(/\r?\n/).flatMap((line) => {
    if (!line.trim()) return [];
    try {
      const event = JSON.parse(line) as { role?: string; content?: unknown };
      return event.role === 'assistant' && typeof event.content === 'string' ? [event.content] : [];
    } catch {
      return [];
    }
  });
  if (!assistantContent.some((content) => content.includes(marker))) {
    throw new Error(`${path} loaded but did not return the required ${marker} marker`);
  }
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

await smokeAgentProfile(
  '.agents/v044-kimi-implementer.md',
  'V044_IMPLEMENTER_PROFILE_OK',
);
await smokeAgentProfile(
  '.agents/v044-kimi-release-verifier.md',
  'V044_RELEASE_VERIFIER_PROFILE_OK',
);

console.log(
  `v0.44 executor check passed (kimi ${version}, alias kimi-code/k3-256k, context 262144, default effort high, both required Agent profiles loaded).`,
);
