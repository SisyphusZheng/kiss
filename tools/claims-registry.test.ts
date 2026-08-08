import { assertEquals } from '@std/assert';
import { checkClaim, CODE_CLAIMS, type CodeClaim } from './claims-registry.ts';

Deno.test('claims registry: every registered claim holds against the repo', () => {
  for (const claim of CODE_CLAIMS) {
    assertEquals(checkClaim(claim), null, `claim ${claim.id} is no longer satisfied`);
  }
});

Deno.test('claims registry: pattern regression is detected (target disappears)', () => {
  const broken: CodeClaim = {
    id: 'test-broken',
    claimFile: 'tools/claims-registry.ts',
    claimLine: '1',
    description: 'fixture',
    targetFile: 'tools/claims-registry.ts',
    pattern: 'does-not-exist-anywhere',
  };
  const failure = checkClaim(broken);
  assertEquals(
    failure,
    'claim in tools/claims-registry.ts:1 not satisfied by code in tools/claims-registry.ts',
  );
});

Deno.test('claims registry: missing target file fails the gate, does not crash', () => {
  const missingTarget: CodeClaim = {
    id: 'test-missing-target',
    claimFile: 'tools/claims-registry.ts',
    claimLine: '1',
    description: 'fixture',
    targetFile: 'tools/no-such-file.ts',
    pattern: 'x',
  };
  assertEquals(checkClaim(missingTarget) !== null, true);
});
