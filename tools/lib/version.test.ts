import { assert, assertEquals, assertThrows } from '@std/assert';
import {
  assertPublicReleaseVersion,
  compareVersions,
  FIRST_TAGGED_VERSION,
  formatLineVersion,
  isInternalAlphaWorkspace,
  nextCheckpointVersion,
  nextPatchVersion,
  nextProductStageVersion,
  normalizeReleaseVersion,
  parseLineVersion,
  prereleaseChannel,
  prereleaseParts,
  previousPrereleaseVersion,
  tryParseLineVersion,
} from './version.ts';

Deno.test('parseLineVersion parses stable and prerelease line versions', () => {
  assertEquals(parseLineVersion('1.2.3'), {
    major: 1,
    minor: 2,
    patch: 3,
    prereleaseNumber: 0,
  });
  assertEquals(parseLineVersion('0.44.0-beta.1'), {
    major: 0,
    minor: 44,
    patch: 0,
    prerelease: 'beta',
    identifiers: ['beta', '1'],
    prereleaseNumber: 1,
  });
});

Deno.test('parseLineVersion rejects non-line versions', () => {
  for (
    const bad of ['1.2', 'v1.2.3', '1.2.3+build', '1.2.3-alpha..1', '1.2.3-alpha.01', '01.2.3']
  ) {
    assertThrows(() => parseLineVersion(bad), Error, 'Invalid semver', bad);
    assertEquals(tryParseLineVersion(bad), undefined, bad);
  }
});

Deno.test('prereleaseParts splits base, label and sequence', () => {
  assertEquals(prereleaseParts('0.41.0-alpha.14'), { base: '0.41.0', name: 'alpha', num: 14 });
  assertEquals(prereleaseParts('0.43.3'), undefined);
  assertEquals(prereleaseParts('not-a-version'), undefined);
});

Deno.test('compareVersions orders numerically, release above prerelease', () => {
  assertEquals(compareVersions('0.41.0-alpha.13', '0.41.0-alpha.14'), -1);
  assertEquals(compareVersions('0.41.0-alpha.14', '0.41.0-alpha.14'), 0);
  assertEquals(compareVersions('0.42.0-alpha.1', '0.41.0-alpha.14'), 1);
  assertEquals(compareVersions('0.41.0', '0.41.0-alpha.14'), 1);
  assertEquals(compareVersions('0.41.0-alpha.1', '0.41.0-beta.1'), -1);
  assertEquals(compareVersions('0.41.0-rc.1', '0.41.0-beta.99'), 1);
});

Deno.test('nextPatchVersion advances the prerelease counter or the patch', () => {
  assertEquals(nextPatchVersion('0.39.0'), '0.39.1');
  assertEquals(nextPatchVersion('0.41.0-alpha.6'), '0.41.0-alpha.7');
  assertEquals(nextPatchVersion('1.2.3-rc.1'), '1.2.3-rc.2');
  assertThrows(() => nextPatchVersion('v1.2.3'), Error, 'Invalid semver');
});

Deno.test('normalizeReleaseVersion inserts the prerelease dot', () => {
  assertEquals(normalizeReleaseVersion('0.41.0-alpha5'), '0.41.0-alpha.5');
  assertEquals(normalizeReleaseVersion('0.41.0-beta12'), '0.41.0-beta.12');
  assertEquals(normalizeReleaseVersion('0.41.0-rc1'), '0.41.0-rc.1');
  assertEquals(normalizeReleaseVersion('0.44.0-beta.1'), '0.44.0-beta.1');
});

Deno.test('prereleaseChannel names only publishable channels', () => {
  assertEquals(prereleaseChannel('0.44.0-beta.1'), 'beta');
  assertEquals(prereleaseChannel('0.41.0-rc.2'), 'rc');
  assertEquals(prereleaseChannel('0.43.3'), undefined);
  assertEquals(prereleaseChannel('0.44.0-custom.1'), undefined);
});

Deno.test('FIRST_TAGGED_VERSION is the immutable-tag policy boundary (#855)', () => {
  assertEquals(FIRST_TAGGED_VERSION, '0.41.0-alpha.14');
  assert(tryParseLineVersion(FIRST_TAGGED_VERSION) !== undefined);
});

Deno.test('Beta checkpoint SemVer precedence includes all identifiers', () => {
  const chain = [
    '0.44.0-beta.2',
    '0.44.0-beta.2.1',
    '0.44.0-beta.2.9',
    '0.44.0-beta.2.10',
    '0.44.0-beta.3',
    '0.44.0',
    '1.0.0-alpha.1',
  ];
  for (let i = 1; i < chain.length; i++) assertEquals(compareVersions(chain[i - 1], chain[i]), -1);
  assertEquals(prereleaseChannel('0.44.0-beta.2.1'), 'beta');
  assertEquals(prereleaseChannel('1.0.0-alpha.1'), 'alpha');
});

Deno.test('checkpoint and product stage succession are different operations', () => {
  assertEquals(nextCheckpointVersion('0.44.0-beta.2'), '0.44.0-beta.2.1');
  assertEquals(nextCheckpointVersion('0.44.0-beta.2.1'), '0.44.0-beta.2.2');
  assertEquals(nextCheckpointVersion('0.44.0-beta.2.2'), '0.44.0-beta.2.3');
  assertThrows(() => nextPatchVersion('0.44.0-beta.2.3'));
  assertEquals(nextProductStageVersion('0.44.0-beta.2.3'), '1.0.0-alpha.1');
  assertEquals(isInternalAlphaWorkspace('0.44.0-alpha.10'), true);
  assertEquals(isInternalAlphaWorkspace('1.0.0-alpha.1'), false);
  for (
    const version of [
      '1.2.3-alpha',
      '1.2.3-alpha.1.x',
      '0.44.0-beta.2.10',
      '1.2.3-12345678901234567890',
    ]
  ) assertEquals(formatLineVersion(parseLineVersion(version)), version);
  assertEquals(compareVersions('1.2.3-9', '1.2.3-10'), -1);
  assertEquals(compareVersions('1.2.3-1', '1.2.3-a'), -1);
});

Deno.test('release predecessor retains checkpoint identifiers and historic workspace prohibition is scoped', () => {
  assertEquals(previousPrereleaseVersion('0.44.0-beta.2.2'), '0.44.0-beta.2.1');
  assertEquals(previousPrereleaseVersion('0.44.0-beta.2.1'), '0.44.0-beta.2');
  assertEquals(previousPrereleaseVersion('1.0.0-alpha.1'), null);
  assertThrows(() => assertPublicReleaseVersion('0.44.0-alpha.10'));
  assertPublicReleaseVersion('1.0.0-alpha.1');
});
