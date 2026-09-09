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

// ---------------------------------------------------------------------------
// Beta.2.1 release qualification: table-driven acceptance for the v0.44
// checkpoint grammar. These tables are the mechanical contract a release
// verifier replays; extend the tables, never weaken an asserted row.
// ---------------------------------------------------------------------------

/** The admitted engineering-checkpoint chain: each from → its only successor. */
const CHECKPOINT_SUCCESSION: ReadonlyArray<readonly [from: string, to: string]> = [
  ['0.44.0-beta.2', '0.44.0-beta.2.1'],
  ['0.44.0-beta.2.1', '0.44.0-beta.2.2'],
  ['0.44.0-beta.2.2', '0.44.0-beta.2.3'],
];

Deno.test('v044 checkpoint chain: beta.2 → beta.2.1 → beta.2.2 → beta.2.3', () => {
  for (const [from, to] of CHECKPOINT_SUCCESSION) {
    assertEquals(nextCheckpointVersion(from), to, `nextCheckpointVersion(${from})`);
    // The generic patch advance must route through the checkpoint grammar for
    // the beta.2 line instead of producing an ordinary prerelease increment.
    assertEquals(nextPatchVersion(from), to, `nextPatchVersion(${from})`);
    assertEquals(previousPrereleaseVersion(to), from, `previousPrereleaseVersion(${to})`);
    assertEquals(compareVersions(from, to), -1, `${from} must precede ${to}`);
  }
  // The chain is finite: beta.2.3 has no checkpoint successor. Advancing past
  // it requires the admitted product-stage transition, never an implied
  // beta.2.4.
  assertThrows(() => nextCheckpointVersion('0.44.0-beta.2.3'), Error, 'No next Beta checkpoint');
  assertThrows(() => nextPatchVersion('0.44.0-beta.2.3'), Error, 'No next Beta checkpoint');
  assertEquals(nextProductStageVersion('0.44.0-beta.2.3'), '1.0.0-alpha.1');
});

interface LineSemanticsRow {
  readonly version: string;
  /** Lossless SemVer identifiers; undefined for stable lines. */
  readonly identifiers: readonly string[] | undefined;
  readonly channel: 'alpha' | 'beta' | 'rc' | undefined;
  /** Exact nextPatchVersion result, or 'throws' when succession needs admission. */
  readonly nextPatch: string | 'throws';
  readonly internalAlphaWorkspace: boolean;
}

/**
 * Checkpoint versions and ordinary prerelease stages must never collapse into
 * one parser interpretation: beta.2.1 is a three-identifier checkpoint while
 * beta.3 is a two-identifier ordinary prerelease with an ordinary successor.
 */
const LINE_SEMANTICS: readonly LineSemanticsRow[] = [
  {
    version: '0.44.0-alpha.1',
    identifiers: ['alpha', '1'],
    channel: 'alpha',
    nextPatch: '0.44.0-alpha.2',
    internalAlphaWorkspace: true,
  },
  {
    version: '0.44.0-beta.1',
    identifiers: ['beta', '1'],
    channel: 'beta',
    nextPatch: '0.44.0-beta.2',
    internalAlphaWorkspace: false,
  },
  {
    version: '0.44.0-beta.2',
    identifiers: ['beta', '2'],
    channel: 'beta',
    nextPatch: '0.44.0-beta.2.1',
    internalAlphaWorkspace: false,
  },
  {
    version: '0.44.0-beta.2.1',
    identifiers: ['beta', '2', '1'],
    channel: 'beta',
    nextPatch: '0.44.0-beta.2.2',
    internalAlphaWorkspace: false,
  },
  {
    version: '0.44.0-beta.2.2',
    identifiers: ['beta', '2', '2'],
    channel: 'beta',
    nextPatch: '0.44.0-beta.2.3',
    internalAlphaWorkspace: false,
  },
  {
    version: '0.44.0-beta.2.3',
    identifiers: ['beta', '2', '3'],
    channel: 'beta',
    nextPatch: 'throws',
    internalAlphaWorkspace: false,
  },
  {
    version: '0.44.0-beta.3',
    identifiers: ['beta', '3'],
    channel: 'beta',
    // An ordinary prerelease increments ordinarily; it must never auto-nest
    // into a beta.3.x checkpoint form.
    nextPatch: '0.44.0-beta.4',
    internalAlphaWorkspace: false,
  },
  {
    version: '0.44.0-rc.1',
    identifiers: ['rc', '1'],
    channel: 'rc',
    nextPatch: '0.44.0-rc.2',
    internalAlphaWorkspace: false,
  },
  {
    version: '0.44.0',
    identifiers: undefined,
    channel: undefined,
    nextPatch: '0.44.1',
    internalAlphaWorkspace: false,
  },
];

Deno.test('v044 line semantics table: checkpoint and stage identities stay distinct', () => {
  for (const row of LINE_SEMANTICS) {
    const parsed = parseLineVersion(row.version);
    assertEquals(parsed.identifiers, row.identifiers, `identifiers of ${row.version}`);
    assertEquals(prereleaseChannel(row.version), row.channel, `channel of ${row.version}`);
    assertEquals(
      isInternalAlphaWorkspace(row.version),
      row.internalAlphaWorkspace,
      `internal-alpha classification of ${row.version}`,
    );
    assertEquals(
      formatLineVersion(parsed),
      row.version,
      `formatLineVersion round-trip of ${row.version}`,
    );
    if (row.nextPatch === 'throws') {
      assertThrows(() => nextPatchVersion(row.version), Error, undefined);
    } else {
      assertEquals(
        nextPatchVersion(row.version),
        row.nextPatch,
        `nextPatchVersion(${row.version})`,
      );
    }
  }
});

Deno.test('beta.3 is an ordinary prerelease, never an alias for a beta.3.0 checkpoint', () => {
  // Distinct identities, correctly ordered: beta.3 < beta.3.0 in SemVer
  // precedence, and both sort above the entire beta.2.x checkpoint chain.
  assert(compareVersions('0.44.0-beta.2.3', '0.44.0-beta.3') === -1);
  assert(compareVersions('0.44.0-beta.3', '0.44.0-beta.3.0') === -1);
  assert(compareVersions('0.44.0-beta.3', '0.44.0-beta.3') === 0);
  // Neither spelling is an admitted engineering checkpoint.
  assertThrows(() => nextCheckpointVersion('0.44.0-beta.3'), Error, 'No next Beta checkpoint');
  assertThrows(() => nextCheckpointVersion('0.44.0-beta.3.0'), Error, 'No next Beta checkpoint');
  // An ordinary prerelease number is not a nested checkpoint: advancing beta.3
  // yields beta.4, and the beta.2-line special case must not leak onto it.
  assertEquals(nextPatchVersion('0.44.0-beta.3'), '0.44.0-beta.4');
  // Product-stage admission is exclusive to the end of the checkpoint chain.
  assertThrows(() => nextProductStageVersion('0.44.0-beta.3'), Error, 'No admitted');
});

Deno.test('stage transitions alpha → beta → rc → stable are ordered but never implicit', () => {
  const stages = ['0.44.0-alpha.10', '0.44.0-beta.1', '0.44.0-rc.1', '0.44.0'];
  for (let i = 1; i < stages.length; i++) {
    assertEquals(compareVersions(stages[i - 1], stages[i]), -1, `${stages[i - 1]} → ${stages[i]}`);
  }
  // Only the admitted product-stage successor exists; every other stage
  // transition is an operator-driven bump (validateVersionStep), not something
  // the checkpoint grammar grants.
  for (
    const version of [
      '0.44.0-alpha.10',
      '0.44.0-beta.1',
      '0.44.0-beta.2',
      '0.44.0-beta.2.2',
      '0.44.0-beta.3',
      '0.44.0-rc.1',
      '0.44.0',
    ]
  ) {
    assertThrows(() => nextProductStageVersion(version), Error, 'No admitted');
  }
  assertEquals(nextProductStageVersion('0.44.0-beta.2.3'), '1.0.0-alpha.1');
});

Deno.test('historical 0.44.0-alpha workspace versions stay flat and unpublishable', () => {
  for (let n = 1; n <= 10; n++) {
    const version = `0.44.0-alpha.${n}`;
    // Flat two-identifier identity: a historic alpha number must never be
    // reinterpreted as a nested checkpoint under the new grammar.
    assertEquals(parseLineVersion(version).identifiers, ['alpha', String(n)]);
    assertEquals(isInternalAlphaWorkspace(version), true, version);
    assertThrows(() => assertPublicReleaseVersion(version), Error, 'not publishable');
    assertThrows(() => nextCheckpointVersion(version), Error, 'No next Beta checkpoint');
  }
  // The internal-workspace classification is scoped to the actual history
  // (alpha.1..alpha.10); later alphas on the line are ordinary prereleases.
  assertEquals(isInternalAlphaWorkspace('0.44.0-alpha.11'), false);
  assertPublicReleaseVersion('0.44.0-beta.2.1');
  assertPublicReleaseVersion('0.44.0-rc.1');
  assertPublicReleaseVersion('0.44.0');
});
