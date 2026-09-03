import { assert, assertEquals } from '@std/assert';
import {
  findRemovedAuthoringVocabulary,
  isCurrentDocAllowed,
  isInEvidenceWindow,
} from './check-docs-truth.ts';
import { PACKAGE_VERSION, PACKAGE_VERSION_TAG } from './project-constants.ts';

Deno.test('docs-truth current: removed authoring vocabulary is flagged on current surfaces', () => {
  // A10.10/#1218: removed v0.43 authoring names must not survive in current
  // documentation surfaces (www content collections, package/root READMEs,
  // non-historical docs).
  const drift = "import { defineElement, useActionData } from '@openelement/app';\n" +
    "defineIsland('x-island', () => null);\n" +
    "bindSsrProps(el); registerSignal('count', count); useLoaderData();\n" +
    'const list = `<For each={items}>`;\n';
  const names = findRemovedAuthoringVocabulary('www/content/guide/routing-and-data.md', drift);
  assert(names.includes('removed defineElement authoring helper'), names.join(','));
  assert(names.includes('removed defineIsland() authoring helper'), names.join(','));
  assert(names.includes('removed render-scope useLoaderData() hook'), names.join(','));
  assert(names.includes('removed render-scope useActionData() hook'), names.join(','));
  assert(names.includes('removed bindSsrProps() SSR-props helper'), names.join(','));
  assert(names.includes('removed registerSignal() marker API'), names.join(','));
  assert(names.includes('removed For control-flow factory'), names.join(','));
});

Deno.test('docs-truth current: VNode is flagged on prose surfaces but not in docs/current negations', () => {
  assert(
    findRemovedAuthoringVocabulary('www/content/architecture/islands-deep.md', 'returns a VNode')
      .includes('removed VNode runtime vocabulary'),
  );
  assert(
    findRemovedAuthoringVocabulary('packages/element/README.md', 'VNode').includes(
      'removed VNode runtime vocabulary',
    ),
  );
  // Contract documents may name the removed renderer in negated statements
  // ("there is no VNode … fallback"); other removed authoring names are still
  // forbidden there.
  assertEquals(
    findRemovedAuthoringVocabulary(
      'docs/current/v0.44.0-ALPHA-CONTRACT.md',
      'There is no VNode, binding-discovery, generic-hydration or interpreter fallback.',
    ),
    [],
  );
  assert(
    findRemovedAuthoringVocabulary('docs/current/PACKAGE_SURFACE.md', 'defineElement').includes(
      'removed defineElement authoring helper',
    ),
  );
});

Deno.test('docs-truth current: www/app code surfaces are in removed-vocabulary scope (#1260)', () => {
  // www/app route data and component code samples must not present removed
  // v0.43 authoring vocabulary as current.
  const sampleDrift = "import { defineElement } from '@openelement/element';\n" +
    'const list = `<For each={items}>`;\n';
  const componentNames = findRemovedAuthoringVocabulary(
    'www/app/components/page-home.tsx',
    sampleDrift,
  );
  assert(
    componentNames.includes('removed defineElement authoring helper'),
    componentNames.join(','),
  );
  assert(componentNames.includes('removed For control-flow factory'), componentNames.join(','));
  const routeNames = findRemovedAuthoringVocabulary(
    'www/app/routes/apilist.tsx',
    "defineIsland('x-island', () => null);",
  );
  assert(routeNames.includes('removed defineIsland() authoring helper'), routeNames.join(','));
});

Deno.test('docs-truth current: lookalikes and out-of-scope surfaces are not flagged', () => {
  // defineIslandConfig stays: only the removed defineIsland( call is matched.
  assertEquals(
    findRemovedAuthoringVocabulary(
      'www/content/guide/islands-and-ssr.md',
      "defineIslandConfig({ hydrate: 'visible', ssr: true, dsd: true })",
    ),
    [],
  );
  // The canonical v0.44 authoring form is clean.
  assertEquals(
    findRemovedAuthoringVocabulary(
      'packages/app/README.md',
      "@element('home-page') class HomePage extends OpenElement",
    ),
    [],
  );
  assertEquals(
    findRemovedAuthoringVocabulary(
      'www/app/components/page-home.tsx',
      "@element('index-index') class PageHome extends OpenElement",
    ),
    [],
  );
  // Generated www/app content-data mirrors are build artifacts of the gated
  // www/content sources and stay out of scope (#1260).
  assertEquals(
    findRemovedAuthoringVocabulary('www/app/data/_generated-guide-data.ts', 'defineElement'),
    [],
  );
});

Deno.test('docs-truth evidence window: prerelease ordering is semver, not lexicographic', () => {
  // Lexicographic order ranks '0.41.0-alpha.2' above '0.41.0-alpha.14'; the
  // window must exclude every release before the first tagged one.
  assertEquals(isInEvidenceWindow('0.41.0-alpha.2'), false);
  assertEquals(isInEvidenceWindow('0.41.0-alpha.13'), false);
  assertEquals(isInEvidenceWindow('0.41.0-alpha.14'), true);
  assertEquals(isInEvidenceWindow('0.42.0-alpha.1'), true);
  assertEquals(isInEvidenceWindow('0.40.9'), false);
});

Deno.test('docs-truth current: whitelist matching is exact-path, not substring (#1231 M17)', () => {
  // Directory prefixes (trailing '/') allow everything below the named dir.
  assert(isCurrentDocAllowed('docs/release/v0.29.3.md'));
  assert(isCurrentDocAllowed('docs/adr/ADR-0151-v044-release-train-retopology.md'));
  // Exact file entries allow only that one path.
  assert(isCurrentDocAllowed('docs/current/v0.44.0-MIGRATION.md'));
  assert(isCurrentDocAllowed('www/content/guide/migration.md'));
  assert(isCurrentDocAllowed('www/app/routes/changelog.tsx'));
  // Substring lookalikes that the old `includes` matching exempted are now gated.
  assertEquals(isCurrentDocAllowed('docs/runbooks/supabase-migrations.md'), false);
  assertEquals(isCurrentDocAllowed('docs/runbooks/legacy-upgrade.md'), false);
  assertEquals(isCurrentDocAllowed('docs/current/CHANGELOG-notes.md'), false);
  assertEquals(isCurrentDocAllowed('docs/current/release-cadence.md'), false);
  assertEquals(isCurrentDocAllowed('www/app/routes/archived-posts.tsx'), false);
  // An exact entry is not a prefix: sibling files stay gated.
  assertEquals(isCurrentDocAllowed('www/content/guide/migration-notes.md'), false);
  // Current-truth surfaces remain gated.
  assertEquals(isCurrentDocAllowed('docs/current/VERSION_PLAN.md'), false);
});

const CHECK_SCRIPT = new URL('./check-docs-truth.ts', import.meta.url);

async function git(root: string, args: string[]): Promise<string> {
  const result = await new Deno.Command('git', {
    args,
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) {
    throw new Error(`git ${args.join(' ')} failed: ${new TextDecoder().decode(result.stderr)}`);
  }
  return new TextDecoder().decode(result.stdout).trim();
}

// Drives the evidence gate as a subprocess against a minimal git fixture: the
// closure record exists but the release note does not, so the gate must fail
// closed instead of silently skipping the note checks.
Deno.test('docs-truth evidence: missing release note fails the gate', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/docs/release/autoflow3`, { recursive: true });
    await git(root, ['init', '-q']);
    await git(root, ['config', 'user.email', 'test@example.com']);
    await git(root, ['config', 'user.name', 'test']);
    const evidencePath = `${root}/docs/release/autoflow3/${PACKAGE_VERSION_TAG}.json`;
    const tagEvidence = {
      id: 'run-1',
      kind: 'release',
      targetVersion: PACKAGE_VERSION,
      status: 'running',
      steps: [],
    };
    await Deno.writeTextFile(evidencePath, JSON.stringify(tagEvidence));
    await git(root, ['add', '-A']);
    await git(root, ['commit', '-q', '-m', 'tag evidence']);
    await git(root, ['tag', PACKAGE_VERSION_TAG]);
    const tagCommit = await git(root, ['rev-parse', PACKAGE_VERSION_TAG]);
    const finalEvidence = {
      id: 'run-1',
      kind: 'publish-existing',
      targetVersion: PACKAGE_VERSION,
      status: 'completed',
      completedAt: '2026-08-20T00:00:00.000Z',
      steps: [{ name: 'publish npm', status: 'passed' }],
    };
    await Deno.writeTextFile(evidencePath, JSON.stringify(finalEvidence));
    await git(root, ['add', '-A']);
    await git(root, ['commit', '-q', '-m', 'final evidence']);
    const finalEvidenceCommit = await git(root, ['rev-parse', 'HEAD']);
    await Deno.writeTextFile(
      `${root}/docs/release/${PACKAGE_VERSION_TAG}-closure.json`,
      JSON.stringify({
        tagCommit,
        finalEvidenceCommit,
        successfulReleaseRun: 'https://example.test/run/1',
        releaseUrl: 'https://example.test/release',
      }),
    );
    const result = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--allow-read', '--allow-run=git', CHECK_SCRIPT.pathname, '--check=evidence'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stderr = new TextDecoder().decode(result.stderr);
    assertEquals(result.code, 1);
    assert(stderr.includes('missing its release note'), stderr);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
