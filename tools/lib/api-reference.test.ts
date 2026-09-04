/** API reference enumeration + generator tests (#1158). */
import { assert, assertEquals } from '@std/assert';
import {
  enumerateSubpathExports,
  parseExportClassMap,
  parseSurfaceMap,
  workspacePaths,
} from './api-reference.ts';
import { buildApiReference, renderApiReferenceModule } from '../generate-api-reference.ts';

Deno.test('parseSurfaceMap: extracts the machine block, rejects malformed docs', () => {
  const doc = 'prose\n<!-- package-surface-map\n' +
    JSON.stringify({
      '@openelement/x': { supported: ['.'], internal: ['i18n'] },
    }) +
    '\n-->\nmore prose';
  assertEquals(parseSurfaceMap(doc), {
    '@openelement/x': { supported: ['.'], internal: ['i18n'] },
  });
  assertEquals(parseSurfaceMap('no block here'), null);
  assertEquals(parseSurfaceMap('<!-- package-surface-map\n{oops\n-->'), null);
  assertEquals(
    parseSurfaceMap('<!-- package-surface-map\n{"a":{"supported":"."}}\n-->'),
    null,
  );
});

Deno.test('parseExportClassMap: extracts nested classes, rejects non-strings', () => {
  const doc = '<!-- package-export-classes\n' +
    JSON.stringify({ '@openelement/x': { '.': { definePage: 'stable-candidate' } } }) +
    '\n-->';
  assertEquals(parseExportClassMap(doc), {
    '@openelement/x': { '.': { definePage: 'stable-candidate' } },
  });
  assertEquals(parseExportClassMap('none'), null);
  assertEquals(
    parseExportClassMap('<!-- package-export-classes\n{"a":{".":{"x":1}}}\n-->'),
    null,
  );
});

Deno.test('workspacePaths: maps root and subpath specifiers to real files', () => {
  const paths = workspacePaths([
    {
      name: '@openelement/app',
      dir: 'packages/app',
      exports: { '.': './src/index.ts', './model': './src/model.ts' },
    },
    { name: '@openelement/create', dir: 'packages/create', exports: './src/cli.ts' },
  ]);
  assertEquals(paths['@openelement/app'], ['packages/app/src/index.ts']);
  assertEquals(paths['@openelement/app/model'], ['packages/app/src/model.ts']);
  assertEquals(paths['@openelement/create'], ['packages/create/src/cli.ts']);
});

Deno.test('enumerateSubpathExports: kind, JSDoc summary and repo-relative source', async () => {
  const dir = await Deno.makeTempDir();
  try {
    const entry = `${dir}/entry.ts`;
    await Deno.writeTextFile(
      entry,
      [
        '/** Adds two numbers. More prose follows. */',
        'export function add(a: number, b: number): number { return a + b; }',
        'export const ANSWER = 42;',
        '/** Options bag. */',
        'export interface AddOptions { carry?: boolean }',
        '',
      ].join('\n'),
    );
    const records = enumerateSubpathExports(entry, dir);
    assertEquals(records.map((record) => record.name), ['add', 'AddOptions', 'ANSWER']);
    const add = records[0];
    assertEquals(add.kind, 'function');
    assertEquals(add.summary, 'Adds two numbers. More prose follows.');
    assertEquals(add.source.path, 'entry.ts');
    assertEquals(add.source.line, 2);
    assertEquals(records[1].kind, 'interface');
    assertEquals(records[2].summary, '');
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('buildApiReference: real repo truth builds with zero failures', async () => {
  const build = await buildApiReference();
  assertEquals(build.failures, []);
  assertEquals(build.packages.length, 5);
  assertEquals(build.elements.length, 10);

  // Every documented export carries a unique anchor and no internal-leak;
  // stable-candidates are exactly the exports the generator requires JSDoc for.
  const anchors = new Set<string>();
  for (const pkg of build.packages) {
    for (const subpath of pkg.subpaths) {
      for (const exported of subpath.exports) {
        if (exported.stability === 'stable-candidate') {
          assert(exported.summary !== '', `${pkg.name}/${subpath.label} ${exported.name}`);
        }
        assert(exported.stability !== 'internal-importable');
        assert(!anchors.has(exported.anchor), `duplicate ${exported.anchor}`);
        anchors.add(exported.anchor);
      }
    }
  }

  // Determinism: identical inputs produce byte-identical module output.
  const first = renderApiReferenceModule(build);
  const second = renderApiReferenceModule(await buildApiReference());
  assertEquals(first, second);
});
