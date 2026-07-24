import { assert, assertEquals } from '@std/assert';
import { findVersionAnchorFailures, versionAnchors } from './check-version-anchors.ts';
import {
  ACTIVE_EXECUTION_VERSION,
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
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

Deno.test('version anchors: real repo docs are in sync with project constants', () => {
  // The checker main() runs this against disk; asserting it here keeps the
  // anchor snippets honest when docs are edited.
  const failures = findVersionAnchorFailures((path) => Deno.readTextFileSync(path));
  assertEquals(failures, []);
});
