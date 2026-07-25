import { assertEquals, assertStringIncludes } from '@std/assert';
import { scanDenoApiSource } from './check-deno-api-free.ts';
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
          - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
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
          - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0
  `,
  );
  assertEquals(result.failures.length, 1);
  assertStringIncludes(result.failures[0], 'immediately preceded by # v7.0.0');
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
