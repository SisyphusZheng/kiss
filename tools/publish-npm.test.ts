import { assertEquals, assertThrows } from '@std/assert';
import { deriveDependencies, type DeriveDepsIo } from './publish-npm.ts';
import type { PackageInfo } from './lib/package-graph.ts';

function pkg(name: string, version: string): PackageInfo {
  return {
    name,
    version,
    dir: `packages/${name.replace('@openelement/', '')}`,
    deps: [],
    exports: {},
    importKeys: new Set(),
    importValues: {},
  };
}

const io: DeriveDepsIo = {
  readPkgJson: () => ({ imports: {} }),
  readRootJson: () => ({ imports: {} }),
  readSrcFiles: () => [],
};

Deno.test('deriveDependencies includes an external npm dependency with a version', () => {
  const localIo: DeriveDepsIo = {
    ...io,
    readPkgJson: () => ({ imports: { 'npm:react@^18.2.0': 'npm:react@^18.2.0' } }),
  };
  const deps = deriveDependencies(pkg('@openelement/element', '1.0.0'), [], localIo);
  assertEquals(deps, { react: '^18.2.0' });
});

Deno.test('deriveDependencies throws when an npm dependency has no version', () => {
  const localIo: DeriveDepsIo = {
    ...io,
    readPkgJson: () => ({ imports: { 'npm:react': 'npm:react' } }),
  };
  assertThrows(
    () => deriveDependencies(pkg('@openelement/element', '1.0.0'), [], localIo),
    Error,
    'no version',
  );
});

Deno.test('deriveDependencies resolves an internal workspace dependency from source', () => {
  const localIo: DeriveDepsIo = {
    ...io,
    readSrcFiles: () => [`import { x } from '@openelement/app';`],
  };
  const all = [pkg('@openelement/element', '1.0.0'), pkg('@openelement/app', '1.2.3')];
  const deps = deriveDependencies(pkg('@openelement/element', '1.0.0'), all, localIo);
  assertEquals(deps, { '@openelement/app': '1.2.3' });
});

Deno.test('deriveDependencies materializes a root-mapped npm dependency used by source', () => {
  const localIo: DeriveDepsIo = {
    ...io,
    readRootJson: () => ({ imports: { 'react': 'npm:react@^18.2.0' } }),
    readSrcFiles: () => [`import { y } from 'react';`],
  };
  const deps = deriveDependencies(pkg('@openelement/element', '1.0.0'), [], localIo);
  assertEquals(deps, { react: '^18.2.0' });
});

Deno.test('deriveDependencies throws when a root-mapped npm dependency has no version', () => {
  const localIo: DeriveDepsIo = {
    ...io,
    readRootJson: () => ({ imports: { 'react': 'npm:react' } }),
    readSrcFiles: () => [`import { y } from 'react';`],
  };
  assertThrows(
    () => deriveDependencies(pkg('@openelement/element', '1.0.0'), [], localIo),
    Error,
    'no version',
  );
});
