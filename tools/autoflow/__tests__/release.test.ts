import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import { existsSync } from 'node:fs';
import { buildVersionAnchorReplacements } from '../release.ts';
import { PREVIOUS_PACKAGE_VERSION, PREVIOUS_PACKAGE_VERSION_TAG } from '../../project-constants.ts';

Deno.test('buildVersionAnchorReplacements: covers all live versioned files', () => {
  const version = '9.9.9';
  const tag = `v${version}`;
  const reps = buildVersionAnchorReplacements(version);

  // Anchors are kept in sync with the real anchor text in each file. Dead
  // anchors (doc drift) are intentionally omitted, so this count reflects the
  // files that currently carry the previous package line.
  assertEquals(reps.length, 7);

  const seen = new Set<string>();
  for (const [path, from, to] of reps) {
    assert(existsSync(path), `versioned file must exist: ${path}`);
    const text = Deno.readTextFileSync(path);
    // Either the from-anchor is present (will be replaced on bump) or the file
    // already carries the target (idempotent re-run is safe).
    assert(
      text.includes(from) || text.includes(to) ||
        (text.includes(version) && text.includes(tag)),
      `${path} must contain anchor or already be at target: ${from}`,
    );
    assert(
      to.includes(version) || to.includes(tag),
      `to must target ${version}: ${to}`,
    );
    seen.add(path);
  }

  assert(seen.has('README.md'));
  assert(seen.has('README.zh.md'));
  assert(seen.has('www/app/data/version.ts'));
});

Deno.test('buildVersionAnchorReplacements: from side derives from single source of truth', () => {
  const reps = buildVersionAnchorReplacements('1.2.3');
  for (const [, from] of reps) {
    // Every `from` anchor must be derived from PREVIOUS_* constants, not a
    // repeated hard-coded previous-line literal.
    assert(
      from.includes(PREVIOUS_PACKAGE_VERSION) ||
        from.includes(PREVIOUS_PACKAGE_VERSION_TAG),
      `from must derive from PREVIOUS_*: ${from}`,
    );
  }
  assertEquals(PREVIOUS_PACKAGE_VERSION, '0.41.0-alpha.5');
  assertEquals(PREVIOUS_PACKAGE_VERSION_TAG, 'v0.41.0-alpha.5');
});

Deno.test('buildVersionAnchorReplacements: every target still carries the previous line', () => {
  // Coverage gate: every file that is a replacement target must still carry
  // the previous package line (or its tag), so the bump has something to
  // replace and no versioned file silently drifts out of coverage.
  const reps = buildVersionAnchorReplacements('0.41.0-alpha.6');
  const targets = new Set(reps.map(([path]) => path));
  for (const path of targets) {
    const text = Deno.readTextFileSync(path);
    assert(
      text.includes(PREVIOUS_PACKAGE_VERSION) ||
        text.includes(PREVIOUS_PACKAGE_VERSION_TAG),
      `${path} is a replacement target but no longer carries the previous line`,
    );
  }
  // README has two distinct anchor formats (inline and line-wrapped).
  const readmeReps = reps.filter(([p]) => p === 'README.md');
  assertEquals(readmeReps.length, 2);
});
