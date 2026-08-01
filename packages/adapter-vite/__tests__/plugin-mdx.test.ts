import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { mdxPlugin } from '../src/plugin-mdx.ts';

Deno.test('mdxPlugin exposes a pre-transform Vite plugin', () => {
  const plugin = mdxPlugin();
  assertEquals(plugin.name, 'open:mdx');
  assertEquals(plugin.enforce, 'pre');
});

Deno.test('mdxPlugin transforms MDX with openElement JSX runtime', async () => {
  const plugin = mdxPlugin();
  const transform = plugin.transform;
  if (typeof transform !== 'function') {
    throw new Error('MDX plugin did not expose transform hook');
  }
  const result = await transform.call(
    {} as never,
    '# Hello\n\n<open-counter client:idle />',
    '/content/example.mdx',
  );
  const code = String(typeof result === 'string' ? result : result?.code ?? '');
  assertStringIncludes(code, '@openelement/element');
  assertStringIncludes(code, 'open-counter');
});

Deno.test({
  name: 'mdxPlugin: Phase 3-style SSR viteBuild (configFile:false, noExternal) handles .mdx routes',
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    // Regression for the Phase 3 (build-ssg) break: .mdx routes were
    // imported by the generated SSG entry but the Phase 3 plugin table had
    // no mdxPlugin, so esbuild parsed .mdx as JS and the build failed.
    const dir = mkdtempSync(join(tmpdir(), 'openelement-mdx-ssg-'));
    const entry = join(dir, 'entry.ts');
    writeFileSync(entry, `import Page from './page.mdx';\nconsole.log(Page);\n`);
    writeFileSync(
      join(dir, 'page.mdx'),
      `# Title\n\n<open-callout>Hello</open-callout>\n`,
    );
    // Stand-in for the Deno import-map plugin used by real Phase 3 builds:
    // the MDX JSX runtime resolves to @openelement/element/jsx-runtime.
    writeFileSync(
      join(dir, 'jsx-runtime-stub.ts'),
      `export const jsx = () => null;\nexport const jsxs = () => null;\nexport const Fragment = Symbol('Fragment');\n`,
    );

    const { build } = await import('vite');
    const result = await build({
      configFile: false,
      root: dir,
      logLevel: 'error',
      build: {
        ssr: true,
        outDir: join(dir, 'dist'),
        rollupOptions: { input: { entry } },
        target: 'esnext',
        minify: false,
      },
      ssr: { noExternal: true },
      esbuild: {
        jsx: 'automatic',
        jsxImportSource: '@openelement/element',
      },
      resolve: {
        alias: {
          '@openelement/element/jsx-runtime': join(dir, 'jsx-runtime-stub.ts'),
          '@openelement/element/jsx-dev-runtime': join(dir, 'jsx-runtime-stub.ts'),
        },
      },
      plugins: [mdxPlugin()],
    });
    const outputs = Array.isArray(result) ? result : [result];
    // ponytail: watch-mode typing noise; build() in this test never returns a watcher.
    const bundle = outputs.flatMap((o) => {
      if (typeof o === 'object' && o !== null && 'output' in o) {
        return (o as { output: unknown[] }).output;
      }
      return [];
    });
    const chunk = bundle.find((c) => {
      const file = (c as { fileName?: string }).fileName;
      return file?.startsWith('entry');
    });
    assert(chunk && typeof chunk === 'object' && 'code' in chunk, 'expected entry.js chunk output');
    const code = (chunk as { code: string }).code;
    assertStringIncludes(code, 'Title');
  },
});
