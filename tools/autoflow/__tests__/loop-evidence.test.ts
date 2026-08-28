import { assert, assertEquals, assertThrows } from '@std/assert';
import { selectGates } from '../policy.ts';
import {
  assertExactShaPrCi,
  loopEvidenceContract,
  releaseOnlyGateNames,
} from '../loop-evidence.ts';

Deno.test('implementer runs packet commands plus the fast push tier, never the CI matrix', () => {
  const contract = loopEvidenceContract('implementer');
  assert(contract.runsPacketCommands);
  assertEquals(contract.autoflowTiers, ['push']);
  assert(!contract.ownsFullCiMatrix);
  assert(!contract.autoflowTiers.includes('ci'));
});

Deno.test('reviewer replays only the packet harness, not the shared matrix', () => {
  const contract = loopEvidenceContract('reviewer');
  assert(contract.runsPacketCommands);
  assertEquals(contract.autoflowTiers, []);
  assert(!contract.ownsFullCiMatrix);
});

Deno.test('the pull request is the single full-matrix authority for its exact SHA', () => {
  const contract = loopEvidenceContract('pull-request');
  assert(contract.ownsFullCiMatrix);
  assertEquals(contract.autoflowTiers, ['ci']);
  for (const role of ['implementer', 'reviewer', 'release-closure'] as const) {
    assert(!loopEvidenceContract(role).ownsFullCiMatrix, `${role} must not own the matrix`);
  }
});

Deno.test('release closure consumes exact-SHA PR CI evidence and never replays the matrix', () => {
  const contract = loopEvidenceContract('release-closure');
  assert(!contract.ownsFullCiMatrix);
  assert(!contract.autoflowTiers.includes('ci'));
});

Deno.test('exact-SHA PR CI evidence rejects absent, stale, mismatched and failing results', () => {
  const sha = 'a'.repeat(40);
  assertThrows(() => assertExactShaPrCi(undefined, sha), Error, 'absent');
  assertThrows(
    () => assertExactShaPrCi({ sha: 'b'.repeat(40), conclusion: 'success' }, sha),
    Error,
    'stale or mismatched',
  );
  assertThrows(
    () => assertExactShaPrCi({ sha, conclusion: 'failure' }, sha),
    Error,
    'not green',
  );
  assertExactShaPrCi({ sha, conclusion: 'success' }, sha);
});

Deno.test('release-only gates exist beyond the CI matrix and stay out of the ci tier', () => {
  const names = releaseOnlyGateNames();
  assert(names.includes('release:state-machine:check'));
  const ciNames = new Set(selectGates('ci', []).map((gate) => gate.name));
  for (const name of names) assert(!ciNames.has(name), `${name} leaked into the ci tier`);
});

Deno.test('the ci tier is the full matrix regardless of changed paths', () => {
  const all = selectGates('ci', []);
  const triggered = selectGates('ci', ['docs/current/VERSION_PLAN.md']);
  assertEquals(all.length, triggered.length);
  assert(all.length > 0);
});

Deno.test('the PR workflow statically maps to the full-matrix ci tier', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/autoflow-ci.yml');
  assert(
    workflow.includes('deno task autoflow:ci'),
    'autoflow-ci.yml must invoke the ci tier',
  );
});
