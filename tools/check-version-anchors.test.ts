import { assert, assertEquals } from '@std/assert';
import {
  findStaleAnchorFailures,
  findVersionAnchorFailures,
  headAnchorZone,
  versionAnchors,
} from './check-version-anchors.ts';
import {
  ACTIVE_EXECUTION_VERSION,
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
  PREVIOUS_PACKAGE_VERSION,
  PREVIOUS_PACKAGE_VERSION_TAG,
  stalePackageVersionClaims,
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
      `Repository package line: \`${PACKAGE_VERSION_TAG}\`\nnpm registry line: \`${PACKAGE_VERSION_TAG}\`\nActive release target: \`${ACTIVE_EXECUTION_VERSION}\``,
    'README.md': `Published package line: \`${PACKAGE_VERSION}\` (\`${PACKAGE_VERSION_TAG}\`).`,
    'README.zh.md': `已发布包线为 \`${PACKAGE_VERSION}\`（\`${PACKAGE_VERSION_TAG}\`）。`,
    'docs/roadmap/ROADMAP.md':
      `Published package line: \`${PACKAGE_VERSION_TAG}\`.\nActive execution target: \`${ACTIVE_EXECUTION_VERSION}\`.`,
    'docs/governance/PROJECT_WORKFLOW.md': `package line \`${PACKAGE_VERSION_TAG}\`, done`,
    'docs/current/VERSION_PLAN.md':
      `Current source package line: \`${PACKAGE_VERSION_TAG}\`\nCurrent npm registry line: \`${PACKAGE_VERSION_TAG}\``,
  };
}

Deno.test('version anchors: in-sync docs pass', () => {
  assertEquals(findVersionAnchorFailures(readerFrom(goodFiles())), []);
});

Deno.test('version anchors: drifted package line is reported per file', () => {
  const files = goodFiles();
  files['README.md'] = 'Published package line: `0.0.0` (`v0.0.0`).';
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

Deno.test('stale claims: previous line in a head anchor zone is rejected', () => {
  const files = goodFiles();
  files['docs/status/STATUS.md'] = files['docs/status/STATUS.md'].replace(
    `npm registry line: \`${PACKAGE_VERSION_TAG}\``,
    `npm registry line: \`${PREVIOUS_PACKAGE_VERSION_TAG}\``,
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

Deno.test('stale claims: the current line never matches its own stale prefix', () => {
  // `0.41.0-alpha.1` (stale) is a prefix of a current prerelease like
  // `0.41.0-alpha.17`; the numeric boundary must keep the current line from
  // failing. On a stable current line there is no such prefix — the current
  // version simply never matches a stale claim either way.
  if (PACKAGE_VERSION.includes('-')) {
    assert(stalePackageVersionClaims().some((claim) => PACKAGE_VERSION.startsWith(claim)));
  } else {
    assert(!stalePackageVersionClaims().some((claim) => PACKAGE_VERSION.startsWith(claim)));
  }
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
