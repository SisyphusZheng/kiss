/**
 * v0.44 executor capability preflight (#1156, ADR-0146).
 *
 * Proves the locally configured executor matches the executable configuration
 * (tools/config/v044-roles.json): exact command, provider/model alias, 262144
 * context, provider-default high effort, thinking + tool_use capabilities, and
 * loadable role profiles. Identity is never hardcoded here; a mismatch fails
 * closed as BLOCKED_EXECUTOR_UNAVAILABLE rather than substituting another
 * executor.
 */

import { loadV044RoleConfig, type V044RoleConfig } from './config/load-v044-roles.ts';

export type ExecutorModel = {
  provider?: string;
  model?: string;
  alias?: string;
  displayName?: string;
  maxContextSize?: number;
  defaultEffort?: string;
  supportEfforts?: string[];
  capabilities?: string[];
};

/** Capability contract for one already-located executor model record. */
export function evaluateExecutorModel(model: ExecutorModel, config: V044RoleConfig): string[] {
  const failures: string[] = [];
  if (model.maxContextSize !== config.executor.contextTokens) {
    failures.push(
      `expected maxContextSize ${config.executor.contextTokens}, got ${
        String(model.maxContextSize)
      }`,
    );
  }
  if (model.defaultEffort !== config.executor.defaultEffort) {
    failures.push(
      `expected defaultEffort ${config.executor.defaultEffort}, got ${String(model.defaultEffort)}`,
    );
  }
  if (!model.supportEfforts?.includes(config.executor.defaultEffort)) {
    failures.push(`${config.executor.defaultEffort} effort is unsupported`);
  }
  for (const capability of config.executor.requiredCapabilities) {
    if (!model.capabilities?.includes(capability)) {
      failures.push(`missing capability ${capability}`);
    }
  }
  return failures;
}

/** Locate the configured provider/model record in the executor's provider list. */
export function findConfiguredModel(
  models: ExecutorModel[],
  config: V044RoleConfig,
): ExecutorModel | undefined {
  return models.find((candidate) =>
    candidate.provider === config.executor.provider && candidate.model === config.executor.model &&
    (candidate.alias === undefined || candidate.alias === config.executor.modelAlias)
  );
}

export function buildProfileSmokeArgs(
  config: V044RoleConfig,
  role: 'implementer' | 'releaseVerifier',
): string[] {
  const profile = config.profiles[role];
  return [
    '--model',
    config.executor.modelAlias,
    '--agent-file',
    profile.agentFile,
    '--output-format',
    'stream-json',
    '--prompt',
    `Profile-load preflight only. Do not use tools or edit files. Include ${profile.smokeMarker} in your response.`,
  ];
}

async function run(command: string, args: string[]): Promise<string> {
  const child = new Deno.Command(command, {
    args,
    stdout: 'piped',
    stderr: 'piped',
  });
  let output: Deno.CommandOutput;
  try {
    output = await child.output();
  } catch (error) {
    throw new Error(`configured executor command is unavailable: ${String(error)}`);
  }
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  if (!output.success) {
    throw new Error(
      `executor ${args.join(' ')} failed (${output.code}): ${stderr.trim()}`,
    );
  }
  return stdout;
}

async function smokeAgentProfile(
  config: V044RoleConfig,
  role: 'implementer' | 'releaseVerifier',
): Promise<void> {
  const profile = config.profiles[role];
  const output = await run(config.executor.command, buildProfileSmokeArgs(config, role));
  const assistantContent = output.split(/\r?\n/).flatMap((line) => {
    if (!line.trim()) return [];
    try {
      const event = JSON.parse(line) as { role?: string; content?: unknown };
      return event.role === 'assistant' && typeof event.content === 'string' ? [event.content] : [];
    } catch {
      return [];
    }
  });
  if (!assistantContent.some((content) => content.includes(profile.smokeMarker))) {
    throw new Error(
      `${profile.agentFile} loaded but did not return the required ${profile.smokeMarker} marker`,
    );
  }
}

async function main(): Promise<void> {
  const config = await loadV044RoleConfig(new URL('../', import.meta.url));
  const command = config.executor.command;

  const version = (await run(command, ['--version'])).trim();
  const providerJson = JSON.parse(await run(command, ['provider', 'list', '--json'])) as {
    models?: Record<string, ExecutorModel> | ExecutorModel[];
  };
  const models = Array.isArray(providerJson.models)
    ? providerJson.models
    : Object.entries(providerJson.models ?? {}).map(([alias, model]) => ({ ...model, alias }));

  const model = findConfiguredModel(models, config);
  if (!model) {
    throw new Error('the configured executor provider/model is not configured locally');
  }

  const failures = evaluateExecutorModel(model, config);
  if (failures.length > 0) {
    throw new Error(`executor capability mismatch:\n${failures.map((x) => `- ${x}`).join('\n')}`);
  }

  await smokeAgentProfile(config, 'implementer');
  await smokeAgentProfile(config, 'releaseVerifier');

  console.log(
    `v0.44 executor check passed (configured executor CLI ${version}, configured model alias, ` +
      `context ${config.executor.contextTokens}, default effort ${config.executor.defaultEffort}, ` +
      'both required role profiles loaded).',
  );
}

if (import.meta.main) await main();
