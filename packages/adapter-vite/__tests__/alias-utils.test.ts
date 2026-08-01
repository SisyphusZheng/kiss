import { assertEquals } from '@std/assert';
import { normalizeViteAliases } from '../src/alias-utils.ts';

Deno.test('normalizeViteAliases expands retained Element public subpaths', () => {
  const aliases = normalizeViteAliases({
    '@openelement/element': './packages/element/src/index.ts',
  }, '/repo') ?? [];

  assertEquals(
    aliases.find((alias) => alias.find === '@openelement/element/jsx-runtime')?.replacement,
    '/repo/packages/element/src/jsx-runtime.ts',
  );
  assertEquals(
    aliases.find((alias) => alias.find === '@openelement/element/jsx-dev-runtime')?.replacement,
    '/repo/packages/element/src/jsx-dev-runtime.ts',
  );
  assertEquals(
    aliases.find((alias) => alias.find === '@openelement/element/build-utils')?.replacement,
    '/repo/packages/element/src/build-utils.ts',
  );
  assertEquals(aliases.some((alias) => String(alias.find).includes('@openelement/core')), false);
});

Deno.test('normalizeViteAliases keeps explicit retained subpath aliases authoritative', () => {
  const aliases = normalizeViteAliases([
    { find: '@openelement/element', replacement: '/repo/packages/element/src/index.ts' },
    { find: '@openelement/element/jsx-runtime', replacement: '/custom/jsx-runtime.ts' },
  ], '/repo') ?? [];

  assertEquals(
    aliases.filter((alias) => alias.find === '@openelement/element/jsx-runtime').length,
    1,
  );
  assertEquals(
    aliases.find((alias) => alias.find === '@openelement/element/jsx-runtime')?.replacement,
    '/custom/jsx-runtime.ts',
  );
});

// #733: the subpath table derives from generated-export-files.ts (itself
// generated from each package's deno.json "exports"), so dropped export
// entries must not reappear here.
Deno.test('normalizeViteAliases drops subpaths removed from deno.json exports', () => {
  const aliases = normalizeViteAliases({
    '@openelement/app': './packages/app/src/index.ts',
    '@openelement/element': './packages/element/src/index.ts',
  }, '/repo') ?? [];
  const finds = aliases.map((alias) => String(alias.find));

  // packages/app/src/hono.ts was deleted; the export entry is gone too.
  assertEquals(finds.includes('@openelement/app/hono'), false);
  // open-element-render/open-element-hydration are no longer exported.
  assertEquals(finds.includes('@openelement/element/open-element-render'), false);
  assertEquals(finds.includes('@openelement/element/open-element-hydration'), false);
});

Deno.test('normalizeViteAliases expands App subpaths from the generated export map', () => {
  const aliases = normalizeViteAliases({
    '@openelement/app': './packages/app/src/index.ts',
  }, '/repo') ?? [];

  for (const subpath of ['spa', 'model', 'i18n', 'preact']) {
    assertEquals(
      aliases.find((alias) => alias.find === `@openelement/app/${subpath}`)?.replacement,
      `/repo/packages/app/src/${subpath}.ts`,
    );
  }
});

Deno.test('normalizeViteAliases preserves nested export subpaths', () => {
  const aliases = normalizeViteAliases({
    '@openelement/adapter-vite': './packages/adapter-vite/src/index.ts',
  }, '/repo') ?? [];

  assertEquals(
    aliases.find((alias) => alias.find === '@openelement/adapter-vite/cli/start')?.replacement,
    '/repo/packages/adapter-vite/src/cli/start.ts',
  );
});
