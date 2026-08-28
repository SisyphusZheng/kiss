import { assert, assertEquals } from '@std/assert';
import { loadV044RoleConfig } from './config/load-v044-roles.ts';
import { collectDocPaths, scanTextForProhibited } from './check-role-neutral-docs.ts';

const config = await loadV044RoleConfig();
const root = new URL('../', import.meta.url);

// The prohibited identifier set is intentionally never spelled out in this
// fixture: tests derive it from the executable configuration so the set lives
// in exactly one place (tools/config/v044-roles.json).

Deno.test('prohibited identifiers load from executable configuration', () => {
  assert(config.prohibitedDocIdentifiers.literals.length > 0);
  assert(config.prohibitedDocIdentifiers.tokens.length > 0);
});

Deno.test('R1: the executable configuration exposes no documentation exemption facility', () => {
  assert(
    !('docScanExemptions' in config),
    'docScanExemptions must not exist: no allowlist escape for documentation',
  );
});

Deno.test('R1: the scanner covers every docs/ text file, including every packet directory', async () => {
  const paths = await collectDocPaths(root);
  assert(paths.includes('docs/evidence/v0.44.0-agent-loops/a0-002-repair-1/dispatch.md'));
  assert(paths.includes('docs/evidence/v0.44.0-agent-loops/a0-002-repair-2/dispatch.md'));
  assert(paths.includes('docs/current/v0.44.0-EXECUTION-STATE.json'));
  assert(paths.includes('README.md'));
});

Deno.test('R2: the configured brand family covers repository-owned equivalents (branch prefix probe)', () => {
  const branchBrand = ['co', 'dex'].join('');
  assert(
    config.prohibitedDocIdentifiers.tokens.some((token) => token.toLowerCase() === branchBrand),
    'configured token set must cover the legacy brand-prefixed branch convention',
  );
  const fixture = `branch: ${branchBrand}/v044-0000-example`;
  assert(scanTextForProhibited(fixture, config).length > 0);
});

Deno.test('R10: the configured family covers the short standalone form of the compound capability label', () => {
  // Constructed at runtime so the short form is never spelled in fixtures.
  const shortForm = ['k', String(1 + 2)].join('');
  assert(
    config.prohibitedDocIdentifiers.literals.some((literal) =>
      literal.toLowerCase().startsWith(shortForm)
    ),
    'a configured compound literal anchors the family this probe extends',
  );
  assert(
    config.prohibitedDocIdentifiers.tokens.some((token) => token.toLowerCase() === shortForm),
    'configured token set must cover the short standalone form, not only the compound',
  );
  const fixture = `a fresh-session, test-driven ${shortForm.toUpperCase()} release verifier`;
  assert(scanTextForProhibited(fixture, config).length > 0);
});

Deno.test('scanner flags configured literals case-insensitively, including JSON and code fences', () => {
  const literal = config.prohibitedDocIdentifiers.literals.find((candidate) =>
    !config.prohibitedDocIdentifiers.tokens.some((token) =>
      candidate.toLowerCase().includes(token.toLowerCase())
    )
  );
  assert(literal, 'configuration must contain at least one token-free literal');
  const text = [
    'neutral opening line',
    `{"model": "${literal}"}`,
    '```sh',
    `run --model ${literal.toUpperCase()}`,
    '```',
  ].join('\n');
  const matches = scanTextForProhibited(text, config);
  assertEquals(matches.filter((match) => match.kind === 'literal').length, 2);
  assertEquals(matches[0].line, 2);
  assertEquals(matches[1].line, 4);
});

Deno.test('scanner flags configured tokens only as standalone tokens', () => {
  const token = config.prohibitedDocIdentifiers.tokens[0];
  const embedded = scanTextForProhibited(`pre${token}post x${token}y`, config);
  assertEquals(embedded.filter((match) => match.kind === 'token').length, 0);
  const standalone = scanTextForProhibited(`The ${token} session ran.`, config);
  assertEquals(standalone.filter((match) => match.kind === 'token').length, 1);
  const upper = scanTextForProhibited(`${token.toUpperCase()} thinker`, config);
  assertEquals(upper.filter((match) => match.kind === 'token').length, 1);
});

Deno.test('neutral role labels and ordinary prose pass', () => {
  const text = 'The thinker dispatches, the implementer edits, and the release verifier ' +
    'closes the candidate. Absolute and solution words are fine.';
  assertEquals(scanTextForProhibited(text, config), []);
});
