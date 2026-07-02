import { assertEquals } from '@std/assert';
import { normalizeViteAliases } from '../src/alias-utils.ts';

Deno.test('normalizeViteAliases: expands OpenElement source root aliases to subpaths', () => {
  const aliases = normalizeViteAliases({
    '@openelement/core': './packages/core/src/index.ts',
  }, '/repo');

  const coreCsrIndex = aliases?.findIndex((alias) => alias.find === '@openelement/core/csr') ??
    -1;
  const coreRootIndex = aliases?.findIndex((alias) => alias.find === '@openelement/core') ??
    -1;

  assertEquals(coreCsrIndex >= 0, true);
  assertEquals(coreRootIndex >= 0, true);
  assertEquals(coreCsrIndex < coreRootIndex, true);
  assertEquals(
    aliases?.find((alias) => alias.find === '@openelement/core/csr')?.replacement,
    '/repo/packages/core/src/csr.ts',
  );
});

Deno.test('normalizeViteAliases: keeps explicit OpenElement subpath aliases authoritative', () => {
  const aliases = normalizeViteAliases([
    {
      find: '@openelement/core',
      replacement: '/repo/packages/core/src/index.ts',
    },
    {
      find: '@openelement/core/csr',
      replacement: '/custom/core-csr.ts',
    },
  ], '/repo') ?? [];

  assertEquals(
    aliases.filter((alias) => alias.find === '@openelement/core/csr').length,
    1,
  );
  assertEquals(
    aliases.find((alias) => alias.find === '@openelement/core/csr')?.replacement,
    '/custom/core-csr.ts',
  );
});

Deno.test('normalizeViteAliases: expands router root alias from its public entry', () => {
  const aliases = normalizeViteAliases({
    '@openelement/router': './packages/router/src/data-context.ts',
  }, '/repo') ?? [];

  assertEquals(
    aliases.find((alias) => alias.find === '@openelement/router/client-router')
      ?.replacement,
    '/repo/packages/router/src/client-router.ts',
  );
  assertEquals(
    aliases.find((alias) => alias.find === '@openelement/router/internal/data-context')
      ?.replacement,
    '/repo/packages/router/src/internal/data-context.ts',
  );
});
