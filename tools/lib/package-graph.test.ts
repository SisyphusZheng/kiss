import { assert, assertEquals, assertThrows } from '@std/assert';
import {
  detectCycles,
  extractOpenImports,
  type PackageInfo,
  releasePublishOrder,
  topologicalSort,
} from './package-graph.ts';

function pkg(name: string, version: string, deps: string[] = []): PackageInfo {
  return {
    name,
    version,
    dir: `packages/${name.replace('@openelement/', '')}`,
    deps,
    exports: {},
    importKeys: new Set(),
    importValues: {},
  };
}

Deno.test('extractOpenImports finds static, type and dynamic imports', () => {
  const source = `
    import { foo } from '@openelement/element';
    import type { Bar } from '@openelement/app';
    export { Baz } from '@openelement/ui';
    const x = await import('@openelement/adapter-vite');
    // not an open import:
    import { y } from 'npm:react';
  `;
  const imports = extractOpenImports(source).sort();
  assertEquals(imports, [
    '@openelement/adapter-vite',
    '@openelement/app',
    '@openelement/element',
    '@openelement/ui',
  ]);
});

Deno.test('extractOpenImports ignores comments and nested template text', () => {
  const source = `
    // import '@openelement/comment';
    const sample = \`text \${\`import('@openelement/string')\`}\`;
    const actual = import(\`@openelement/ui/theme\`);
  `;
  assertEquals(extractOpenImports(source), ['@openelement/ui/theme']);
});

Deno.test('detectCycles reports a cycle in the dependency graph', () => {
  const graph = new Map<string, string[]>([
    ['a', ['b']],
    ['b', ['c']],
    ['c', ['a']],
  ]);
  const cycles = detectCycles(graph);
  assertEquals(cycles.length, 1);
  const cycle = cycles[0];
  assertEquals([...new Set(cycle)].sort(), ['a', 'b', 'c']);
  assertEquals(cycle[0], 'a');
  assertEquals(cycle[cycle.length - 1], 'a');
});

Deno.test('detectCycles returns nothing for a DAG', () => {
  const graph = new Map<string, string[]>([
    ['a', ['b', 'c']],
    ['b', []],
    ['c', []],
  ]);
  assertEquals(detectCycles(graph), []);
});

Deno.test('topologicalSort orders dependencies before dependents', () => {
  const graph = new Map<string, string[]>([
    ['app', ['element', 'ui']],
    ['ui', ['element']],
    ['element', []],
    ['adapter-vite', ['element']],
  ]);
  const order = topologicalSort(graph);
  const pos = (n: string) => order.indexOf(n);
  assert(pos('element') < pos('ui'));
  assert(pos('ui') < pos('app'));
  assert(pos('element') < pos('adapter-vite'));
  assertEquals(order.length, graph.size);
});

Deno.test('topologicalSort throws on a cycle', () => {
  const graph = new Map<string, string[]>([
    ['a', ['b']],
    ['b', ['a']],
  ]);
  assertThrows(() => topologicalSort(graph), Error, 'cycle');
});

Deno.test('releasePublishOrder respects dependency and priority constraints', () => {
  const packages = [
    pkg('@openelement/element', '1.0.0'),
    pkg('@openelement/ui', '1.0.0', ['@openelement/element']),
    pkg('@openelement/app', '1.0.0', ['@openelement/element']),
    pkg('@openelement/adapter-vite', '1.0.0', ['@openelement/element']),
    pkg('@openelement/create', '1.0.0', ['@openelement/app']),
  ];
  const order = releasePublishOrder(packages).map((p) => p.name);
  const pos = (n: string) => order.indexOf(n);
  // dependencies before dependents
  assert(pos('@openelement/element') < pos('@openelement/app'));
  assert(pos('@openelement/element') < pos('@openelement/ui'));
  assert(pos('@openelement/app') < pos('@openelement/create'));
  // release priority: app before adapter-vite before ui
  assert(pos('@openelement/app') < pos('@openelement/adapter-vite'));
  assert(pos('@openelement/adapter-vite') < pos('@openelement/ui'));
  assertEquals(order.length, packages.length);
});
