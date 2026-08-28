import { assert, assertEquals, assertThrows } from '@std/assert';
import { loadV044RoleConfig } from './config/load-v044-roles.ts';
import { buildRoleInvocation, parseRoleRunnerArgs } from './run-v044-role.ts';

const config = await loadV044RoleConfig();

Deno.test('implementer invocation uses the configured executor, model alias and profile', () => {
  const invocation = buildRoleInvocation(config, 'implementer', { prompt: 'run packet' });
  assertEquals(invocation.command, config.executor.command);
  assertEquals(invocation.args, [
    '--model',
    config.executor.modelAlias,
    '--agent-file',
    config.profiles.implementer.agentFile,
    '--output-format',
    'stream-json',
    '--prompt',
    'run packet',
  ]);
});

Deno.test('release verifier invocation is always a fresh session', () => {
  assertThrows(() =>
    buildRoleInvocation(config, 'release-verifier', { prompt: 'x', resumeSessionId: 'abc' })
  );
  const invocation = buildRoleInvocation(config, 'release-verifier', { prompt: 'verify' });
  assert(!invocation.args.includes('--session'));
  assert(invocation.args.includes(config.profiles.releaseVerifier.agentFile));
});

Deno.test('R5: implementer resume uses only the CLI-valid resume form (mutually exclusive flags)', () => {
  const invocation = buildRoleInvocation(config, 'implementer', {
    prompt: 'repair',
    resumeSessionId: 'sess-1',
  });
  const index = invocation.args.indexOf('--session');
  assert(index > -1);
  assertEquals(invocation.args[index + 1], 'sess-1');
  // The installed CLI rejects combining session resume with model/profile selection.
  assert(!invocation.args.includes('--model'), 'resume must not repeat --model');
  assert(!invocation.args.includes('--agent-file'), 'resume must not repeat --agent-file');
  assert(invocation.args.includes('--output-format'));
  assert(invocation.args.includes('--prompt'));
});

Deno.test('argument parser requires a known role and a prompt', () => {
  assertThrows(() => parseRoleRunnerArgs([]));
  assertThrows(() => parseRoleRunnerArgs(['thinker', '--prompt', 'x']));
  assertThrows(() => parseRoleRunnerArgs(['implementer']));
  assertEquals(parseRoleRunnerArgs(['implementer', '--prompt', 'do it']), {
    role: 'implementer',
    prompt: 'do it',
    resumeSessionId: undefined,
  });
  assertEquals(
    parseRoleRunnerArgs(['implementer', '--prompt', 'fix', '--session', 's-2']).resumeSessionId,
    's-2',
  );
});
