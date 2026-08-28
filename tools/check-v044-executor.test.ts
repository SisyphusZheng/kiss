import { assert, assertEquals } from '@std/assert';
import { loadV044RoleConfig } from './config/load-v044-roles.ts';
import { buildProfileSmokeArgs, evaluateExecutorModel } from './check-v044-executor.ts';

const config = await loadV044RoleConfig();

Deno.test('capability evaluation accepts a model matching the configured contract', () => {
  const model = {
    provider: config.executor.provider,
    model: config.executor.model,
    alias: config.executor.modelAlias,
    maxContextSize: config.executor.contextTokens,
    defaultEffort: config.executor.defaultEffort,
    supportEfforts: ['low', config.executor.defaultEffort],
    capabilities: [...config.executor.requiredCapabilities],
  };
  assertEquals(evaluateExecutorModel(model, config), []);
});

Deno.test('capability evaluation rejects context, effort and capability drift', () => {
  const drifted = {
    provider: config.executor.provider,
    model: config.executor.model,
    maxContextSize: 128000,
    defaultEffort: 'low',
    supportEfforts: ['low'],
    capabilities: [],
  };
  const failures = evaluateExecutorModel(drifted, config);
  assert(failures.length >= 3);
  assert(failures.some((failure) => failure.includes('262144')));
});

Deno.test('profile smoke invocation is built from configuration', () => {
  for (const role of ['implementer', 'releaseVerifier'] as const) {
    const args = buildProfileSmokeArgs(config, role);
    assertEquals(args[0], '--model');
    assertEquals(args[1], config.executor.modelAlias);
    assert(args.includes(config.profiles[role].agentFile));
    assert(args.includes('--agent-file'));
    assert(args.join(' ').includes(config.profiles[role].smokeMarker));
  }
});
