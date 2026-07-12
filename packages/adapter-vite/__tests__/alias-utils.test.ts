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
