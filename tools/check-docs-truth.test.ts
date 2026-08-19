import { assertEquals } from '@std/assert';
import { isInEvidenceWindow } from './check-docs-truth.ts';

Deno.test('docs-truth evidence window: prerelease ordering is semver, not lexicographic', () => {
  // Lexicographic order ranks '0.41.0-alpha.2' above '0.41.0-alpha.14'; the
  // window must exclude every release before the first tagged one.
  assertEquals(isInEvidenceWindow('0.41.0-alpha.2'), false);
  assertEquals(isInEvidenceWindow('0.41.0-alpha.13'), false);
  assertEquals(isInEvidenceWindow('0.41.0-alpha.14'), true);
  assertEquals(isInEvidenceWindow('0.42.0-alpha.1'), true);
  assertEquals(isInEvidenceWindow('0.40.9'), false);
});
