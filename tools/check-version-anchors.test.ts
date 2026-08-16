import { assert, assertEquals } from '@std/assert';
import {
  findInflightVersionClaimFailures,
  findStaleAnchorFailures,
  findVersionAnchorFailures,
  headAnchorZone,
  staleClaimsAlternation,
  versionAnchors,
} from './check-version-anchors.ts';
import {
  ACTIVE_EXECUTION_VERSION,
  LATEST_LANDED_TRAIN,
  NEXT_EXECUTION_VERSION,
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
  PREVIOUS_PACKAGE_VERSION,
  PREVIOUS_PACKAGE_VERSION_TAG,
} from './project-constants.ts';

function readerFrom(files: Record<string, string>): (path: string) => string {
  return (path) => {
    const text = files[path];
    if (text === undefined) throw new Deno.errors.NotFound(path);
    return text;
  };
}

function goodFiles(): Record<string, string> {
  return {
    'docs/status/STATUS.md':
      `Repository package line: \`${PACKAGE_VERSION_TAG}\`\nnpm registry line: \`${PACKAGE_VERSION_TAG}\`\nLatest landed train: \`${LATEST_LANDED_TRAIN}\`\nActive release target: \`${ACTIVE_EXECUTION_VERSION}\`\nNext planned train: \`${NEXT_EXECUTION_VERSION}\``,
    'README.md':
      `Source package line: \`${PACKAGE_VERSION}\` (\`${PACKAGE_VERSION_TAG}\`).\nnpm registry line: \`${PACKAGE_VERSION_TAG}\``,
    'README.zh.md':
      `源码包行为 \`${PACKAGE_VERSION}\`（\`${PACKAGE_VERSION_TAG}\`）。\nnpm registry 行为 \`${PACKAGE_VERSION_TAG}\``,
    'docs/roadmap/ROADMAP.md':
      `Source package line: \`${PACKAGE_VERSION_TAG}\`.\nnpm registry line: \`${PACKAGE_VERSION_TAG}\`\nLatest landed train: \`${LATEST_LANDED_TRAIN}\`.\nActive execution target: \`${ACTIVE_EXECUTION_VERSION}\`.\nNext planned train: \`${NEXT_EXECUTION_VERSION}\`.`,
    'docs/governance/PROJECT_WORKFLOW.md':
      `package line \`${PACKAGE_VERSION_TAG}\`, npm registry line \`${PACKAGE_VERSION_TAG}\`, done`,
    'docs/current/VERSION_PLAN.md':
      `Current source package line: \`${PACKAGE_VERSION_TAG}\`\nCurrent npm registry line: \`${PACKAGE_VERSION_TAG}\`\nLatest landed train: \`${LATEST_LANDED_TRAIN}\`\nActive release target: \`${ACTIVE_EXECUTION_VERSION}\`\nNext planned train: \`${NEXT_EXECUTION_VERSION}\``,
    'examples/open-element-in-fresh/README.md':
      `Maintained against the current framework source line (\`${PACKAGE_VERSION}\`).`,
  };
}

Deno.test('version anchors: in-sync docs pass', () => {
  assertEquals(findVersionAnchorFailures(readerFrom(goodFiles())), []);
});

Deno.test('version anchors: drifted package line is reported per file', () => {
  const files = goodFiles();
  files['README.md'] =
    `Source package line: \`0.0.0\` (\`v0.0.0\`).\nnpm registry line: \`${PACKAGE_VERSION_TAG}\``;
  files['docs/roadmap/ROADMAP.md'] = files['docs/roadmap/ROADMAP.md'].replace(
    `Active execution target: \`${ACTIVE_EXECUTION_VERSION}\`.`,
    'Active execution target: `v9.9.9`.',
  );
  const failures = findVersionAnchorFailures(readerFrom(files));
  assertEquals(failures.length, 2);
  assert(failures.some((f) => f.startsWith('README.md: missing version anchor')));
  assert(failures.some((f) => f.startsWith('docs/roadmap/ROADMAP.md:')));
});

Deno.test('version anchors: unreadable file is a failure, not a crash', () => {
  const failures = findVersionAnchorFailures(readerFrom({}));
  assertEquals(failures.length, versionAnchors().length);
  assert(failures.every((f) => f.includes('cannot read file')));
});

Deno.test('stale claims: a previous registry line in the head zone is the legal lag', () => {
  const files = goodFiles();
  // The registry publishes at release time, one alpha after the source bump,
  // so the registry anchor may legitimately name the previous version.
  files['docs/status/STATUS.md'] = files['docs/status/STATUS.md'].replace(
    `npm registry line: \`${PACKAGE_VERSION_TAG}\``,
    `npm registry line: \`${PREVIOUS_PACKAGE_VERSION_TAG}\``,
  );
  assertEquals(findStaleAnchorFailures(readerFrom(files)), []);
});

Deno.test('stale claims: previous line in a head anchor zone is rejected', () => {
  const files = goodFiles();
  // The lag allowance covers the registry anchor only; a previous line
  // anywhere else in the head zone (e.g. a stale repo-line claim) fails.
  files['docs/status/STATUS.md'] = files['docs/status/STATUS.md'].replace(
    `Repository package line: \`${PACKAGE_VERSION_TAG}\``,
    `Repository package line: \`${PREVIOUS_PACKAGE_VERSION_TAG}\``,
  );
  const failures = findStaleAnchorFailures(readerFrom(files));
  assertEquals(failures.length, 1);
  assert(failures[0].startsWith('docs/status/STATUS.md: stale version claim'));
  assert(failures[0].includes(PREVIOUS_PACKAGE_VERSION_TAG));
});

Deno.test('stale claims: previous line in the history area is allowed', () => {
  const files = goodFiles();
  // The stale claim sits after the last head anchor, where release notes,
  // roadmap history tables and forward-version tables live.
  files['docs/roadmap/ROADMAP.md'] +=
    `\n\n## Release history\n\n| \`${PREVIOUS_PACKAGE_VERSION}\` | Previous release |\n`;
  files['README.md'] += `\n\nSee the \`${PREVIOUS_PACKAGE_VERSION_TAG}\` release notes.\n`;
  assertEquals(findStaleAnchorFailures(readerFrom(files)), []);
});

Deno.test('stale claims: a stale tag before the first head anchor is still in the zone', () => {
  const files = goodFiles();
  files['docs/current/VERSION_PLAN.md'] = `# ${PREVIOUS_PACKAGE_VERSION_TAG} — old plan\n\n${
    files['docs/current/VERSION_PLAN.md']
  }`;
  const failures = findStaleAnchorFailures(readerFrom(files));
  assert(failures.some((f) => f.startsWith('docs/current/VERSION_PLAN.md:')));
});

Deno.test('stale claims: the stale regex never flags the current line', () => {
  // A stale claim can be a string prefix of the current version
  // (`0.41.0-alpha.1` inside `0.41.0-alpha.17`) — but only sometimes
  // (alpha.1 inside alpha.2 is not one). The invariant that must hold for
  // every version shape is the boundary: the stale regex with numeric
  // boundaries must never match the current line, bare or v-tagged.
  const pattern = new RegExp(`(?<![\\d.])(?:${staleClaimsAlternation()})(?![\\d.])`, 'u');
  assert(!pattern.test(PACKAGE_VERSION), `stale regex matched ${PACKAGE_VERSION}`);
  assert(!pattern.test(PACKAGE_VERSION_TAG), `stale regex matched ${PACKAGE_VERSION_TAG}`);
  assertEquals(findStaleAnchorFailures(readerFrom(goodFiles())), []);
});

Deno.test('headAnchorZone: spans file start through the last present anchor', () => {
  const text = 'title\nfirst-anchor\nhistory second-anchor tail\nmore history';
  assertEquals(
    headAnchorZone(text, ['first-anchor', 'second-anchor']),
    'title\nfirst-anchor\nhistory second-anchor',
  );
  // Missing anchors do not extend the zone.
  assertEquals(headAnchorZone(text, ['first-anchor', 'absent']), 'title\nfirst-anchor');
  assertEquals(headAnchorZone(text, ['absent']), '');
});

Deno.test('version anchors: real repo docs are in sync with project constants', () => {
  // The checker main() runs this against disk; asserting it here keeps the
  // anchor snippets honest when docs are edited.
  const read = (path: string) => Deno.readTextFileSync(path);
  assertEquals(findVersionAnchorFailures(read), []);
  assertEquals(findStaleAnchorFailures(read), []);
});

Deno.test('in-flight claims: the interop example may lag to the npm-published line', () => {
  const files = goodFiles();
  files['examples/open-element-in-fresh/README.md'] =
    `Maintained against the current framework source line (\`${PREVIOUS_PACKAGE_VERSION}\`).`;
  assertEquals(findVersionAnchorFailures(readerFrom(files)), []);
  assertEquals(findStaleAnchorFailures(readerFrom(files)), []);
});

Deno.test('in-flight claims: published line bound to in-flight wording fails (#813)', () => {
  // The current line may be a stable cut (no -alpha suffix): then the prose
  // reference is the bare version, not an alpha.N shorthand.
  const currentAlpha = PACKAGE_VERSION.match(/-alpha\.(\d+)$/u)?.[1];
  const currentRef = currentAlpha ? `alpha.${currentAlpha}` : PACKAGE_VERSION;
  const cases = [
    `${currentRef} is the in-flight source line.`,
    `The in-flight source line is ${currentRef}.`,
    `Next alpha train: \`${PACKAGE_VERSION_TAG}\` (some theme — in flight; next is TP-9)`,
    `active train \`${PACKAGE_VERSION_TAG}\``,
  ];
  for (const prose of cases) {
    const files = goodFiles();
    // Completed publish evidence makes the current line count as published.
    files[`docs/release/autoflow3/${PACKAGE_VERSION_TAG}.json`] = '{"status": "completed"}';
    files['docs/roadmap/ROADMAP.md'] += `\n${prose}\n`;
    const failures = findInflightVersionClaimFailures(readerFrom(files));
    assert(failures.length >= 1, `expected a failure for: ${prose}`);
    assert(failures.every((f) => f.startsWith('docs/roadmap/ROADMAP.md:')));
  }
});

Deno.test('in-flight claims: superseded line bound to in-flight wording always fails', () => {
  const files = goodFiles();
  files['docs/roadmap/ROADMAP.md'] +=
    `\n${PREVIOUS_PACKAGE_VERSION} is the in-flight source line.\n`;
  const failures = findInflightVersionClaimFailures(readerFrom(files));
  assertEquals(failures.length, 1);
});

Deno.test('in-flight claims: prepare window — current line without publish evidence is exempt', () => {
  // After the version bump but before CI publishes, the current line IS the
  // in-flight train; flagging it would block the release flow itself.
  const files = goodFiles();
  files['docs/current/VERSION_PLAN.md'] +=
    `\nNext alpha train: \`${PACKAGE_VERSION_TAG}\` (round-6 audit remediation — in flight; next is TP-6)`;
  files['docs/governance/PROJECT_WORKFLOW.md'] +=
    `\nnext train \`${PACKAGE_VERSION_TAG}\` (round-6 audit remediation)`;
  assertEquals(findInflightVersionClaimFailures(readerFrom(files)), []);
});

Deno.test('in-flight claims: naming the NEXT train beside the published line is legal', () => {
  const files = goodFiles();
  // The healthy steady state: current line published, next version in flight.
  files['docs/roadmap/ROADMAP.md'] +=
    `\n${PACKAGE_VERSION} is published to npm and the next alpha is the in-flight source line.\n`;
  files['docs/status/STATUS.md'] += '\nCurrent maturity stage: stable; the next alpha in flight\n';
  files['docs/governance/PROJECT_WORKFLOW.md'] +=
    `\nnpm registry line \`${PACKAGE_VERSION_TAG}\` (published), active train \`v9.9.9-alpha.1\``;
  assertEquals(findInflightVersionClaimFailures(readerFrom(files)), []);
});
