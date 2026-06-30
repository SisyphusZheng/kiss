/**
 * @openelement/ssg - Resolver contract tests
 *
 * These tests exercise the protocol resolver shapes imported by @openelement/ssg.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import type {
  OpenElementPackageExports,
  OpenElementPackageResolver,
  PackageResolverInput,
  PackageResolverResult,
  ResolvedSpecifier,
} from '@openelement/ssg';

const fakeResolver: OpenElementPackageResolver = (input) => {
  if (input.id === '@openelement/core/logger') {
    const resolution: ResolvedSpecifier = {
      specifier: input.registry === 'jsr'
        ? 'https://jsr.io/@openelement/core/0.41.0/src/logger.ts'
        : '@openelement/core/logger',
      isRemote: input.registry === 'jsr',
    };
    return { resolution, errors: [], warnings: [] };
  }
  if (input.id === '@openelement/core/unknown') {
    return {
      resolution: null,
      errors: ['Unknown @openelement/core subpath: unknown'],
      warnings: [],
    };
  }
  return { resolution: null, errors: [], warnings: [] };
};

Deno.test('resolver contract returns a remote JSR resolution', async () => {
  const input: PackageResolverInput = {
    id: '@openelement/core/logger',
    registry: 'jsr',
    version: '0.41.0',
  };
  const result = await fakeResolver(input) as PackageResolverResult;
  assertEquals(result.resolution?.isRemote, true);
  assertEquals(
    result.resolution?.specifier,
    'https://jsr.io/@openelement/core/0.41.0/src/logger.ts',
  );
  assertEquals(result.errors.length, 0);
});

Deno.test('resolver contract returns a local npm-style resolution', async () => {
  const input: PackageResolverInput = {
    id: '@openelement/core/logger',
    registry: 'npm',
  };
  const result = await fakeResolver(input) as PackageResolverResult;
  assertEquals(result.resolution?.isRemote, false);
  assertEquals(result.resolution?.specifier, '@openelement/core/logger');
});

Deno.test('resolver contract reports unknown subpath errors', async () => {
  const input: PackageResolverInput = {
    id: '@openelement/core/unknown',
    registry: 'npm',
  };
  const result = await fakeResolver(input) as PackageResolverResult;
  assertEquals(result.resolution, null);
  assertEquals(result.errors[0], 'Unknown @openelement/core subpath: unknown');
});

Deno.test('OpenElementPackageExports shape is serializable', () => {
  const pkg: OpenElementPackageExports = {
    packageName: 'core',
    exports: {
      '.': 'src/index.ts',
      'logger': 'src/logger.ts',
    },
  };
  assertEquals(JSON.parse(JSON.stringify(pkg)).exports['logger'], 'src/logger.ts');
});
