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
    identifiers: ['alpha', '7'],
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

// Beta.2.1 qualification: the bump stepper must accept the admitted v0.44
// checkpoint chain and product-stage transition, and reject any reverse step.
const CHECKPOINT_STEPS_FORWARD: ReadonlyArray<readonly [string, string]> = [
  ['0.44.0-beta.2', '0.44.0-beta.2.1'],
  ['0.44.0-beta.2.1', '0.44.0-beta.2.2'],
  ['0.44.0-beta.2.2', '0.44.0-beta.2.3'],
  ['0.44.0-beta.2.3', '1.0.0-alpha.1'],
  ['0.44.0-alpha.10', '0.44.0-beta.1'],
  ['0.44.0-beta.3', '0.44.0-rc.1'],
  ['0.44.0-rc.1', '0.44.0'],
];

Deno.test('validateVersionStep admits the v0.44 checkpoint chain and stage transitions', () => {
  for (const [from, to] of CHECKPOINT_STEPS_FORWARD) {
    validateVersionStep(from, to);
  }
});

Deno.test('validateVersionStep rejects every reverse checkpoint step', () => {
  for (const [to, from] of CHECKPOINT_STEPS_FORWARD) {
    assertThrows(() => validateVersionStep(from, to), Error, 'regress');
  }
});
