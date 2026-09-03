import { assertEquals, assertStringIncludes } from '@std/assert';
import {
  EXPORT_STABILITY_CLASSES,
  exportClassDrift,
  extractExportClassMap,
  extractWwwPackageSpecifiers,
  wwwImportBoundaryDrift,
} from './check-package-surface.ts';

const DOC = `# Package Surface Inventory

<!-- package-export-classes
{
  "@openelement/element": {
    ".": { "OpenElement": "stable-candidate", "element": "experimental" },
    "build-utils": { "formatJson": "internal-importable" }
  }
}
-->

prose mentioning \`OpenElement\`.
`;

Deno.test('export class vocabulary is the five Beta stability classes', () => {
  assertEquals(EXPORT_STABILITY_CLASSES, [
    'stable-candidate',
    'experimental',
    'internal-importable',
    'compatibility-only',
    'deprecated',
  ]);
});

Deno.test('extractExportClassMap parses the machine-readable block', () => {
  const map = extractExportClassMap(DOC);
  assertEquals(map, {
    '@openelement/element': {
      '.': { OpenElement: 'stable-candidate', element: 'experimental' },
      'build-utils': { formatJson: 'internal-importable' },
    },
  });
});

Deno.test('extractExportClassMap rejects a missing or invalid block', () => {
  assertEquals(extractExportClassMap('no block here'), null);
  assertEquals(extractExportClassMap('<!-- package-export-classes\n{bad json}\n-->'), null);
  assertEquals(
    extractExportClassMap('<!-- package-export-classes\n{"pkg": []}\n-->'),
    null,
  );
});

Deno.test('exportClassDrift passes when classification matches source exactly', () => {
  const map = extractExportClassMap(DOC)!;
  assertEquals(
    exportClassDrift(map, '@openelement/element', '.', ['OpenElement', 'element']),
    [],
  );
});

Deno.test('exportClassDrift reports unclassified exports and stale classifications', () => {
  const map = extractExportClassMap(DOC)!;
  const failures = exportClassDrift(map, '@openelement/element', '.', [
    'OpenElement',
    'element',
    'NewExport',
  ]);
  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'NewExport');
  const stale = exportClassDrift(map, '@openelement/element', '.', ['OpenElement']);
  assertEquals(stale.length, 1);
  assertStringIncludes(stale[0], 'element');
});

Deno.test('exportClassDrift rejects unknown stability classes and missing entries', () => {
  const map = extractExportClassMap(DOC)!;
  const unknown = exportClassDrift(
    { '@openelement/element': { '.': { OpenElement: 'stable-ish' } } },
    '@openelement/element',
    '.',
    ['OpenElement'],
  );
  assertStringIncludes(unknown.join('\n'), 'stable-ish');
  const missing = exportClassDrift(map, '@openelement/element', 'sanitize', []);
  assertStringIncludes(missing.join('\n'), 'sanitize');
});

// ─── www public-import boundary (#1177, B2.3) ─────────────
// The website must consume @openelement/* exactly as an external npm consumer
// would: every specifier resolves to a published export subpath of one of the
// five retained packages, never to a private source path. www-local import-map
// aliases declared in www/deno.json are the only permitted non-package
// @openelement specifiers.

const WWW_EXPORTS = new Map([
  ['@openelement/element', new Set(['.', 'jsx-runtime', 'jsx-dev-runtime', 'sanitize'])],
  ['@openelement/ui', new Set(['.', 'open-theme-toggle'])],
]);
const WWW_LOCAL_ALIASES = ['@openelement/site-ui/', '@openelement/generated/'];

Deno.test('wwwImportBoundaryDrift accepts published root and subpath specifiers', () => {
  assertEquals(
    wwwImportBoundaryDrift(
      [
        '@openelement/element',
        '@openelement/ui/open-theme-toggle',
        '@openelement/element/sanitize',
      ],
      WWW_EXPORTS,
      WWW_LOCAL_ALIASES,
    ),
    [],
  );
});

Deno.test('wwwImportBoundaryDrift accepts www-local aliases declared in www/deno.json', () => {
  assertEquals(
    wwwImportBoundaryDrift(
      ['@openelement/site-ui/locale.ts', '@openelement/generated/nav'],
      WWW_EXPORTS,
      WWW_LOCAL_ALIASES,
    ),
    [],
  );
});

Deno.test('wwwImportBoundaryDrift rejects unpublished subpaths and unknown packages', () => {
  const drift = wwwImportBoundaryDrift(
    ['@openelement/element/src/protocol/data.ts', '@openelement/content'],
    WWW_EXPORTS,
    WWW_LOCAL_ALIASES,
  );
  assertEquals(drift.length, 2);
  assertStringIncludes(drift[0], '@openelement/content');
  assertStringIncludes(drift[1], 'src/protocol/data.ts');
});

Deno.test('wwwImportBoundaryDrift ignores non-openelement specifiers', () => {
  assertEquals(
    wwwImportBoundaryDrift(['vite', './local.ts', 'npm:marked@15'], WWW_EXPORTS, []),
    [],
  );
});

Deno.test('extractWwwPackageSpecifiers collects imports, exports and jsxImportSource', () => {
  const source = `/** @jsxImportSource @openelement/element */
import { OpenElement } from '@openelement/element';
import '@openelement/ui/open-theme-toggle';
export { signal } from '@openelement/element';
const lazy = import('@openelement/element/sanitize');
import './relative.ts';
`;
  assertEquals(extractWwwPackageSpecifiers(source).sort(), [
    '@openelement/element',
    '@openelement/element/sanitize',
    '@openelement/ui/open-theme-toggle',
  ]);
});
