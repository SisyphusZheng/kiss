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

  const thinker = raw.thinker as Record<string, unknown> | undefined;
  if (!thinker) fail('thinker block is required');
  requireString(thinker.model, 'thinker.model');
  requireString(thinker.reasoningEffort, 'thinker.reasoningEffort');

  const executor = raw.executor as Record<string, unknown> | undefined;
  if (!executor) fail('executor block is required');
  requireString(executor.command, 'executor.command');
  requireString(executor.provider, 'executor.provider');
  requireString(executor.model, 'executor.model');
  requireString(executor.modelAlias, 'executor.modelAlias');
  requireString(executor.defaultEffort, 'executor.defaultEffort');
  if (
    typeof executor.contextTokens !== 'number' || !Number.isInteger(executor.contextTokens) ||
    executor.contextTokens <= 0
  ) {
    fail('executor.contextTokens must be a positive integer');
  }
  requireStringArray(executor.requiredCapabilities, 'executor.requiredCapabilities');

  const profiles = raw.profiles as Record<string, Record<string, unknown>> | undefined;
  if (!profiles?.implementer || !profiles.releaseVerifier) {
    fail('profiles.implementer and profiles.releaseVerifier are required');
  }
  for (const key of ['implementer', 'releaseVerifier'] as const) {
    const profile = profiles[key];
    const agentFile = requireString(profile.agentFile, `profiles.${key}.agentFile`);
    if (agentFile.startsWith('docs/') || !agentFile.startsWith('.agents/')) {
      fail(`profiles.${key}.agentFile must live under .agents/, never under docs/`);
    }
    requireString(profile.smokeMarker, `profiles.${key}.smokeMarker`);
    requireString(profile.sessionPolicy, `profiles.${key}.sessionPolicy`);
  }

  requireString(raw.roleRunnerTask, 'roleRunnerTask');

  const prohibited = raw.prohibitedDocIdentifiers as ProhibitedDocIdentifiers | undefined;
  if (!prohibited) fail('prohibitedDocIdentifiers is required');
  requireStringArray(prohibited.literals, 'prohibitedDocIdentifiers.literals');
  requireStringArray(prohibited.tokens, 'prohibitedDocIdentifiers.tokens');

  // No allowlist escape for documentation: the configuration must not carry an
  // exemption facility at all.
  if ('docScanExemptions' in raw) {
    fail('docScanExemptions is not supported: documentation has no exemption facility');
  }

  return raw as unknown as V044RoleConfig;
}

export async function loadV044RoleConfig(
  root: URL = new URL('../../', import.meta.url),
): Promise<V044RoleConfig> {
  const text = await Deno.readTextFile(new URL(V044_ROLE_CONFIG_PATH, root));
  return parseV044RoleConfig(text);
}
