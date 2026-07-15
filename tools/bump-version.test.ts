import { assertEquals, assertThrows } from '@std/assert';
import { parseVersion, replaceEmbeddedCreateVersion, validateVersionStep } from './bump-version.ts';

Deno.test('parseVersion parses stable and prerelease versions', () => {
  assertEquals(parseVersion('1.2.3'), {
    major: 1,
    minor: 2,
    patch: 3,
    prereleaseNumber: 0,
  });
  assertEquals(parseVersion('0.41.0-alpha.7'), {
    major: 0,
    minor: 41,
    patch: 0,
    prerelease: 'alpha',
    prereleaseNumber: 7,
  });
});

Deno.test('replaceEmbeddedCreateVersion updates the exact embedded release anchor', () => {
  assertEquals(
    replaceEmbeddedCreateVersion(
      "export const CREATE_VERSION = '0.41.0-alpha.12';\n",
      '0.41.0-alpha.12',
      '0.41.0-alpha.13',
    ),
    "export const CREATE_VERSION = '0.41.0-alpha.13';\n",
  );
});

Deno.test('replaceEmbeddedCreateVersion rejects a missing or stale anchor', () => {
  assertThrows(
    () =>
      replaceEmbeddedCreateVersion(
        "export const CREATE_VERSION = '0.41.0-alpha.11';\n",
        '0.41.0-alpha.12',
        '0.41.0-alpha.13',
      ),
    Error,
    'does not contain expected version 0.41.0-alpha.12',
  );
});

Deno.test('parseVersion rejects invalid semver', () => {
  assertThrows(() => parseVersion('1.2'), Error, 'Invalid semver');
  assertThrows(() => parseVersion('v1.2.3'), Error, 'Invalid semver');
});

Deno.test('validateVersionStep allows forward and same-base bumps', () => {
  validateVersionStep('0.41.0-alpha.6', '0.41.0-alpha.7');
  validateVersionStep('0.41.0-alpha.6', '0.41.0-beta.1');
  validateVersionStep('0.41.0-alpha.6', '0.41.0');
  validateVersionStep('0.40.0', '0.41.0');
});

Deno.test('validateVersionStep rejects a regressing base', () => {
  assertThrows(
    () => validateVersionStep('0.41.0', '0.40.9'),
    Error,
    'regresses the release base',
  );
});

Deno.test('validateVersionStep rejects a regressing prerelease', () => {
  assertThrows(
    () => validateVersionStep('0.41.0-beta.1', '0.41.0-alpha.1'),
    Error,
    'Prerelease step regresses',
  );
  assertThrows(
    () => validateVersionStep('0.41.0-alpha.7', '0.41.0-alpha.6'),
    Error,
    'Prerelease step regresses',
  );
});
