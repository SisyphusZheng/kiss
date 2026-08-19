import { assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { scanDenoApiSource } from './check-deno-api-free.ts';
import { isAllowedDependencyDirection } from './check-package-graph.ts';
import { findSignalBoundaryImports } from './check-signal-protocol-boundary.ts';
import { inspectWorkflowSource } from './check-action-pins.ts';
import { discoverScannerFiles } from './check-architecture-contract.ts';

Deno.test('deno-api-free uses syntax nodes for node imports and Deno access', () => {
  const issues = scanDenoApiSource(
    'fixture.ts',
    `
    import fs from \`node:fs\`;
    Deno.readTextFile('x');
    Deno['writeTextFile']('x', 'y');
    const harmless = "Deno.remove('not code')";
  `,
  );
  assertEquals(issues.length, 3);
  assertStringIncludes(issues.join('\n'), 'node import');
  assertStringIncludes(issues.join('\n'), 'Deno API');
});

Deno.test('deno-api-free catches globalThis.Deno, destructuring, aliases, and npm specifiers', () => {
  const issues = scanDenoApiSource(
    'fixture.ts',
    `
    globalThis.Deno.env.get('X');
    const { readTextFile } = Deno;
    const D = Deno;
    D.mkdir('x');
    import pad from 'npm:left-pad@1.0.0';
    import { signal } from 'npm:@preact/signals-core@1.12.1';
  `,
  );
  // env.get, destructured readTextFile, aliased mkdir, and the npm: import;
  // @preact/signals-core is the chartered exception.
  assertEquals(issues.length, 4);
  const text = issues.join('\n');
  assertStringIncludes(text, 'Deno.env');
  assertStringIncludes(text, 'Deno.readTextFile');
  assertStringIncludes(text, 'Deno.mkdir');
  assertStringIncludes(text, 'npm import: npm:left-pad@1.0.0');
  assertFalse(text.includes('signals-core'));
});

Deno.test('package graph direction rules encode the package layering', () => {
  assertEquals(isAllowedDependencyDirection('@openelement/ui', '@openelement/element'), true);
  assertEquals(isAllowedDependencyDirection('@openelement/app', '@openelement/element'), true);
  assertEquals(isAllowedDependencyDirection('@openelement/adapter-vite', '@openelement/app'), true);
  assertEquals(isAllowedDependencyDirection('@openelement/adapter-vite', '@openelement/ui'), true);
  assertEquals(isAllowedDependencyDirection('@openelement/element', '@openelement/app'), false);
  assertEquals(isAllowedDependencyDirection('@openelement/element', '@openelement/ui'), false);
  assertEquals(isAllowedDependencyDirection('@openelement/ui', '@openelement/app'), false);
  assertEquals(isAllowedDependencyDirection('@openelement/app', '@openelement/ui'), false);
  assertEquals(isAllowedDependencyDirection('@openelement/create', '@openelement/element'), false);
});

Deno.test('signal boundary only reports real static and dynamic imports', () => {
  assertEquals(
    findSignalBoundaryImports(`
      // import '@preact/signals-core';
      const text = "@preact/signals";
      import { signal } from '@preact/signals-core';
      await import('@preact/signals');
    `),
    ['@preact/signals-core', '@preact/signals'],
  );
});

Deno.test('action checker parses actual uses steps, not comments', () => {
  const result = inspectWorkflowSource(
    'ci.yml',
    `
    jobs:
      test:
        steps:
          # uses: actions/dependency-review-action@deadbeef
          # v7.0.1
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
  `,
  );
  assertEquals(result.hasDependencyReview, false);
  assertEquals(result.failures, []);
});

Deno.test('action checker rejects an unpinned real uses step', () => {
  const result = inspectWorkflowSource(
    'ci.yml',
    `
    jobs:
      test:
        steps:
          - uses: actions/dependency-review-action@v4
  `,
  );
  assertEquals(result.hasDependencyReview, true);
  assertEquals(result.failures.length, 1);
});

Deno.test('action checker rejects a stale version comment for a known pinned action', () => {
  const result = inspectWorkflowSource(
    'ci.yml',
    `
    jobs:
      test:
        steps:
          # v4.2.2
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
  `,
  );
  assertEquals(result.failures.length, 1);
  assertStringIncludes(result.failures[0], 'immediately preceded by # v7.0.1');
});

Deno.test('action checker rejects an unregistered SHA for a pinned action repo (#1065)', () => {
  const result = inspectWorkflowSource(
    'ci.yml',
    `
    jobs:
      test:
        steps:
          # v7.0.1
          - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
  `,
  );
  assertEquals(result.failures.length, 1);
  assertStringIncludes(result.failures[0], 'not an approved pin for actions/checkout');
});

Deno.test('scanner discovery follows directory and filename conventions after moves', () => {
  const paths = [
    'packages/adapter-vite/src/internal/ssg/island-scanner.ts',
    'packages/adapter-vite/src/internal/content/nav/new-scanner.ts',
    'packages/adapter-vite/src/not-a-scanner.test.ts',
    'packages/app/src/scanner.ts',
  ];
  assertEquals(discoverScannerFiles(paths), paths.slice(0, 2));
});
