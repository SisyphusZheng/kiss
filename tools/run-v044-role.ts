/**
 * Single repository-owned v0.44 role runner (#1156, ADR-0146).
 *
 * The thinker never spells out executor identity, model aliases or profile
 * paths; it invokes one role through this runner, which loads the exact
 * invocation from executable configuration (tools/config/v044-roles.json):
 *
 *   deno task v044:role -- implementer --prompt "Execute the dispatch packet at <abs-path>."
 *   deno task v044:role -- release-verifier --prompt "Verify the closure packet at <abs-path>."
 *
 * The release verifier is always a fresh session: --session is rejected for
 * it. The implementer may resume only an explicitly recorded session id for a
 * repair of the same packet.
 */

import { loadV044RoleConfig, type V044RoleConfig } from './config/load-v044-roles.ts';

export type RunnableRole = 'implementer' | 'release-verifier';

export interface RoleInvocation {
  command: string;
  args: string[];
}

const PROFILE_KEYS: Record<RunnableRole, 'implementer' | 'releaseVerifier'> = {
  implementer: 'implementer',
  'release-verifier': 'releaseVerifier',
};

export function buildRoleInvocation(
  config: V044RoleConfig,
  role: RunnableRole,
  options: { prompt: string; resumeSessionId?: string },
): RoleInvocation {
  const profileKey = PROFILE_KEYS[role];
  if (!profileKey) throw new Error(`unknown runnable role: ${role}`);
  if (role === 'release-verifier' && options.resumeSessionId) {
    throw new Error(
      'release-verifier runs are always fresh sessions; --session is forbidden for release verification',
    );
  }
  const profile = config.profiles[profileKey];
  if (options.resumeSessionId) {
    // The installed CLI rejects combining session resume with model/profile
    // selection: a resume carries only the session id plus prompt/output flags.
    return {
      command: config.executor.command,
      args: [
        '--session',
        options.resumeSessionId,
        '--output-format',
        'stream-json',
        '--prompt',
        options.prompt,
      ],
    };
  }
  const args = [
    '--model',
    config.executor.modelAlias,
    '--agent-file',
    profile.agentFile,
    '--output-format',
    'stream-json',
    '--prompt',
    options.prompt,
  ];
  return { command: config.executor.command, args };
}

export function parseRoleRunnerArgs(args: string[]): {
  role: RunnableRole;
  prompt: string;
  resumeSessionId?: string;
} {
  const role = args[0] as RunnableRole | undefined;
  if (role !== 'implementer' && role !== 'release-verifier') {
    throw new Error(
      'usage: v044:role -- <implementer|release-verifier> --prompt <text> [--session <id>]',
    );
  }
  const promptIndex = args.indexOf('--prompt');
  const prompt = promptIndex === -1 ? undefined : args[promptIndex + 1];
  if (!prompt) throw new Error('a non-empty --prompt is required');
  const sessionIndex = args.indexOf('--session');
  const resumeSessionId = sessionIndex === -1 ? undefined : args[sessionIndex + 1];
  return { role, prompt, resumeSessionId };
}

async function main(): Promise<void> {
  const options = parseRoleRunnerArgs(Deno.args);
  const config = await loadV044RoleConfig(new URL('../', import.meta.url));
  const invocation = buildRoleInvocation(config, options.role, options);
  const command = new Deno.Command(invocation.command, {
    args: invocation.args,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const child = command.spawn();
  const status = await child.status;
  Deno.exit(status.code);
}

if (import.meta.main) await main();
