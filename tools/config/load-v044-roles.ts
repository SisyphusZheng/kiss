/**
 * Typed loader for the executable v0.44 three-role configuration
 * (tools/config/v044-roles.json). Exact executor identity, role-profile paths
 * and the prohibited documentation identifier set live in that JSON file so
 * that docs/ can stay role-neutral. Every consumer — the orchestration
 * preflight, the executor capability check, the role runner and the
 * role-neutral documentation scanner — must load the set from here instead of
 * duplicating it.
 */

export const V044_ROLE_CONFIG_PATH = 'tools/config/v044-roles.json';

export interface ProhibitedDocIdentifiers {
  /** Case-insensitive substrings that may not appear in documentation. */
  literals: string[];
  /** Case-insensitive standalone tokens (non-alphanumeric boundaries). */
  tokens: string[];
}

export interface RoleProfile {
  agentFile: string;
  smokeMarker: string;
  sessionPolicy: string;
}

export interface V044RoleConfig {
  schemaVersion: 1;
  purpose: string;
  thinker: {
    role: 'thinker';
    model: string;
    reasoningEffort: string;
  };
  executor: {
    command: string;
    provider: string;
    model: string;
    modelAlias: string;
    contextTokens: number;
    defaultEffort: string;
    requiredCapabilities: string[];
  };
  profiles: {
    implementer: RoleProfile;
    releaseVerifier: RoleProfile;
  };
  roleRunnerTask: string;
  prohibitedDocIdentifiers: ProhibitedDocIdentifiers;
}

function fail(message: string): never {
  throw new Error(`${V044_ROLE_CONFIG_PATH}: ${message}`);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) fail(`${field} must be a non-empty string`);
  return value;
}

function requireStringArray(value: unknown, field: string): string[] {
  if (
    !Array.isArray(value) || value.length === 0 ||
    value.some((item) => typeof item !== 'string' || item.length === 0)
  ) {
    fail(`${field} must be a non-empty string array`);
  }
  return value as string[];
}

export function parseV044RoleConfig(text: string): V044RoleConfig {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text) as Record<string, unknown>;
  } catch (error) {
    fail(`not valid JSON: ${String(error)}`);
  }

  if (raw.schemaVersion !== 1) fail('schemaVersion must be 1');
  const purpose = requireString(raw.purpose, 'purpose');

  const thinker = raw.thinker as Record<string, unknown> | undefined;
  if (!thinker) fail('thinker block is required');
  if (thinker.role !== 'thinker') fail('thinker.role must be "thinker"');
  const thinkerModel = requireString(thinker.model, 'thinker.model');
  const thinkerReasoningEffort = requireString(thinker.reasoningEffort, 'thinker.reasoningEffort');

  const executor = raw.executor as Record<string, unknown> | undefined;
  if (!executor) fail('executor block is required');
  const executorCommand = requireString(executor.command, 'executor.command');
  const executorProvider = requireString(executor.provider, 'executor.provider');
  const executorModel = requireString(executor.model, 'executor.model');
  const executorModelAlias = requireString(executor.modelAlias, 'executor.modelAlias');
  const executorDefaultEffort = requireString(executor.defaultEffort, 'executor.defaultEffort');
  if (
    typeof executor.contextTokens !== 'number' || !Number.isInteger(executor.contextTokens) ||
    executor.contextTokens <= 0
  ) {
    fail('executor.contextTokens must be a positive integer');
  }
  const executorContextTokens = executor.contextTokens;
  const executorRequiredCapabilities = requireStringArray(
    executor.requiredCapabilities,
    'executor.requiredCapabilities',
  );

  const profiles = raw.profiles as
    | Record<string, Record<string, unknown> | undefined>
    | undefined;
  const implementerProfile = profiles?.implementer;
  const releaseVerifierProfile = profiles?.releaseVerifier;
  if (!implementerProfile || !releaseVerifierProfile) {
    fail('profiles.implementer and profiles.releaseVerifier are required');
  }

  function parseProfile(profile: Record<string, unknown>, key: string): RoleProfile {
    const agentFile = requireString(profile.agentFile, `profiles.${key}.agentFile`);
    if (agentFile.startsWith('docs/') || !agentFile.startsWith('.agents/')) {
      fail(`profiles.${key}.agentFile must live under .agents/, never under docs/`);
    }
    return {
      agentFile,
      smokeMarker: requireString(profile.smokeMarker, `profiles.${key}.smokeMarker`),
      sessionPolicy: requireString(profile.sessionPolicy, `profiles.${key}.sessionPolicy`),
    };
  }

  const roleRunnerTask = requireString(raw.roleRunnerTask, 'roleRunnerTask');

  const prohibited = raw.prohibitedDocIdentifiers as Record<string, unknown> | undefined;
  if (!prohibited) fail('prohibitedDocIdentifiers is required');
  const prohibitedLiterals = requireStringArray(
    prohibited.literals,
    'prohibitedDocIdentifiers.literals',
  );
  const prohibitedTokens = requireStringArray(
    prohibited.tokens,
    'prohibitedDocIdentifiers.tokens',
  );

  // No allowlist escape for documentation: the configuration must not carry an
  // exemption facility at all.
  if ('docScanExemptions' in raw) {
    fail('docScanExemptions is not supported: documentation has no exemption facility');
  }

  return {
    schemaVersion: 1,
    purpose,
    thinker: {
      role: 'thinker',
      model: thinkerModel,
      reasoningEffort: thinkerReasoningEffort,
    },
    executor: {
      command: executorCommand,
      provider: executorProvider,
      model: executorModel,
      modelAlias: executorModelAlias,
      contextTokens: executorContextTokens,
      defaultEffort: executorDefaultEffort,
      requiredCapabilities: executorRequiredCapabilities,
    },
    profiles: {
      implementer: parseProfile(implementerProfile, 'implementer'),
      releaseVerifier: parseProfile(releaseVerifierProfile, 'releaseVerifier'),
    },
    roleRunnerTask,
    prohibitedDocIdentifiers: {
      literals: prohibitedLiterals,
      tokens: prohibitedTokens,
    },
  };
}

export async function loadV044RoleConfig(
  root: URL = new URL('../../', import.meta.url),
): Promise<V044RoleConfig> {
  const text = await Deno.readTextFile(new URL(V044_ROLE_CONFIG_PATH, root));
  return parseV044RoleConfig(text);
}
