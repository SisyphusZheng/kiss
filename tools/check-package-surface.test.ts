import { assertEquals, assertStringIncludes } from '@std/assert';
import {
  EXPORT_STABILITY_CLASSES,
  exportClassDrift,
  extractExportClassMap,
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
