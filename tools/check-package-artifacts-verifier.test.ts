/**
 * Independent release-verifier tests for tools/check-package-artifacts.ts
 * (v0.44 Beta.2 closure, stage #1288, carried risk 8 / PR #1310).
 *
 * The package-artifacts gate re-packs from source before scanning, so its
 * teeth cannot be demonstrated by poisoning a tarball on disk. These tests
 * exercise scanExtractedPackage directly against synthetic package trees to
 * prove the FORBIDDEN_LEGACY_PATHS / FORBIDDEN_LEGACY_SOURCE_PATTERNS rules
 * fire — and that a clean tree produces zero violations.
 */
import { assert, assertEquals } from '@std/assert';
import { scanExtractedPackage } from './check-package-artifacts.ts';

async function makePackageTree(
  files: Record<string, string>,
): Promise<string> {
  const root = await Deno.makeTempDir({ prefix: 'artifact-gate-verifier-' });
  for (const [relative, content] of Object.entries(files)) {
    const path = `${root}/${relative}`;
    await Deno.mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
    await Deno.writeTextFile(path, content);
  }
  return root;
}

const HONEST_PACKAGE_JSON = JSON.stringify({
  name: '@openelement/element',
  version: '0.44.0-beta.1',
  type: 'module',
  main: './src/index.js',
  exports: { '.': './src/index.js' },
});

Deno.test('artifact gate fires on a forbidden legacy v0.43 path (src/types.ts)', async () => {
  const root = await makePackageTree({
    'package.json': HONEST_PACKAGE_JSON,
    'src/index.js': 'export {};\n',
    'src/types.ts': 'export type VNode = { fake: true };\n',
  });
  try {
    const result = scanExtractedPackage('@openelement/element', root);
    assert(
      result.violations.some((v) => v.path.endsWith('src/types.ts')),
      `expected a src/types.ts violation, got: ${JSON.stringify(result.violations)}`,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('artifact gate fires on the dead data-ssr-props channel export', async () => {
  const root = await makePackageTree({
    'package.json': HONEST_PACKAGE_JSON,
    'src/index.js': 'export const DATA_SSR_PROPS = "data-ssr-props";\n',
  });
  try {
    const result = scanExtractedPackage('@openelement/element', root);
    assert(
      result.violations.some((v) => v.message.includes('data-ssr-props')),
      `expected a data-ssr-props violation, got: ${JSON.stringify(result.violations)}`,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('artifact gate fires on a legacy marker-hydration attribute literal', async () => {
  const root = await makePackageTree({
    'package.json': HONEST_PACKAGE_JSON,
    'src/index.js': 'el.setAttribute("data-signal-x", "1");\n',
  });
  try {
    const result = scanExtractedPackage('@openelement/element', root);
    assert(
      result.violations.some((v) => v.message.includes('marker-based hydration')),
      `expected a marker-hydration violation, got: ${JSON.stringify(result.violations)}`,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('artifact gate stays silent for a clean compiled package tree', async () => {
  const root = await makePackageTree({
    'package.json': HONEST_PACKAGE_JSON,
    'src/index.js': 'export const version = 1;\n',
  });
  try {
    const result = scanExtractedPackage('@openelement/element', root);
    assertEquals(result.violations, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
