import { assert, assertEquals } from '@std/assert';
import {
  findIntegrationSpecifierFailures,
  packageSurfaceSpecifiers,
} from './check-public-docs-integrity.ts';

const surfaceText = `<!-- package-surface-map
{
  "@openelement/element": {
    "supported": [".", "jsx-runtime", "build-utils"],
    "internal": []
  },
  "@openelement/app": {
    "supported": [".", "model", "spa", "preact"],
    "internal": ["i18n"]
  },
  "@openelement/ui": {
    "supported": [".", "open-button"],
    "internal": ["open-props-tokens.js"]
  }
}
-->`;

function readerFrom(files: Record<string, string>): (path: string) => string {
  return (path) => {
    const text = files[path];
    if (text === undefined) throw new Deno.errors.NotFound(path);
    return text;
  };
}

Deno.test('package surface specifiers: map expands root, subpaths and internal aliases', () => {
  const specifiers = packageSurfaceSpecifiers(surfaceText);
  assert(specifiers.has('@openelement/element'));
  assert(specifiers.has('@openelement/element/jsx-runtime'));
  assert(specifiers.has('@openelement/app/preact'));
  // Internal subpaths stay importable for optional integrations.
  assert(specifiers.has('@openelement/app/i18n'));
  assert(specifiers.has('@openelement/ui/open-props-tokens.js'));
  assert(!specifiers.has('@openelement/core'));
  assert(!specifiers.has('@openelement/ui/open-dialog'));
});

Deno.test('package surface specifiers: missing map block is a loud failure', () => {
  let threw = false;
  try {
    packageSurfaceSpecifiers('# no map here');
  } catch {
    threw = true;
  }
  assert(threw);
});

Deno.test('integration specifiers: current-surface imports pass', () => {
  const files = {
    'docs/current/PACKAGE_SURFACE.md': surfaceText,
    'docs/integrations/preact-islands.md': "import { definePage } from '@openelement/app';\n" +
      '/** @jsxImportSource @openelement/element */\n' +
      'Use `@openelement/app/preact` or `@openelement/element/build-utils`.\n',
  };
  assertEquals(
    findIntegrationSpecifierFailures(readerFrom(files), ['docs/integrations/preact-islands.md']),
    [],
  );
});

Deno.test('integration specifiers: retired packages and unknown subpaths are rejected', () => {
  const files = {
    'docs/current/PACKAGE_SURFACE.md': surfaceText,
    'docs/integrations/stale.md': "import { signal } from '@openelement/signal';\n" +
      'The old `@openelement/core/hydrate` entry and `@openelement/app/router` subpath.\n',
  };
  const failures = findIntegrationSpecifierFailures(readerFrom(files), [
    'docs/integrations/stale.md',
  ]);
  assertEquals(failures.length, 3);
  assert(failures.every((f) => f.file === 'docs/integrations/stale.md'));
  assert(failures.some((f) => f.message.includes('@openelement/signal')));
  assert(failures.some((f) => f.message.includes('@openelement/core/hydrate')));
  assert(failures.some((f) => f.message.includes('@openelement/app/router')));
});

Deno.test('integration specifiers: unreadable integration doc is a failure, not a crash', () => {
  const files = { 'docs/current/PACKAGE_SURFACE.md': surfaceText };
  const failures = findIntegrationSpecifierFailures(readerFrom(files), [
    'docs/integrations/missing.md',
  ]);
  assertEquals(failures.length, 1);
  assert(failures[0].message.includes('cannot read file'));
});

Deno.test('integration specifiers: real repo docs stay inside the current package surface', () => {
  // main() runs this against disk; asserting it here keeps integration docs
  // honest when the package surface shrinks (#737).
  const read = (path: string) => Deno.readTextFileSync(path);
  const docs: string[] = [];
  for (const entry of Deno.readDirSync('docs/integrations')) {
    if (entry.isFile && entry.name.endsWith('.md')) docs.push(`docs/integrations/${entry.name}`);
  }
  assert(docs.length > 0);
  assertEquals(findIntegrationSpecifierFailures(read, docs), []);
});
