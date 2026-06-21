import { assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@1';
import {
  createOpenJsrPackageResolverPlugin,
  parseOpenPackageSpecifier,
  resolveOpenPackageExport,
  resolveVirtualOpenPackageRelative,
  toVirtualOpenPackageId,
} from '../src/ssg-package-resolver.ts';

Deno.test('parseOpenPackageSpecifier parses bare openElement package ids', () => {
  assertEquals(parseOpenPackageSpecifier('@openelement/core'), {
    packageName: 'core',
    subpath: '.',
  });
  assertEquals(parseOpenPackageSpecifier('@openelement/ui/open-card'), {
    packageName: 'ui',
    subpath: 'open-card',
  });
});

Deno.test('parseOpenPackageSpecifier parses JSR openElement package ids', () => {
  assertEquals(parseOpenPackageSpecifier('jsr:@openelement/signal@^0.21/framework'), {
    packageName: 'signal',
    range: '^0.21',
    subpath: 'framework',
  });
  assertEquals(parseOpenPackageSpecifier('jsr:@openelement/core@^0.21.9/logger'), {
    packageName: 'core',
    range: '^0.21.9',
    subpath: 'logger',
  });
});

Deno.test('resolveOpenPackageExport maps public subpaths to source files', () => {
  assertEquals(resolveOpenPackageExport('core', '.'), 'src/index.ts');
  assertEquals(resolveOpenPackageExport('core', 'logger'), 'src/logger.ts');
  assertEquals(resolveOpenPackageExport('core', 'style-sheet'), 'src/style-sheet.ts');
  assertEquals(resolveOpenPackageExport('core', 'data'), 'src/data.ts');
  assertEquals(resolveOpenPackageExport('core', 'runtime'), 'src/runtime.ts');
  assertEquals(resolveOpenPackageExport('ui', 'open-card'), 'src/open-card.tsx');
  assertEquals(resolveOpenPackageExport('signal', 'framework'), 'src/framework.ts');
  assertEquals(resolveOpenPackageExport('signal', 'preact-engine'), 'src/preact-engine.ts');
  assertEquals(resolveOpenPackageExport('app', '.'), 'src/index.ts');
  assertEquals(resolveOpenPackageExport('app', 'preact'), 'src/preact.ts');
  assertEquals(resolveOpenPackageExport('element', '.'), 'src/index.ts');
  assertEquals(resolveOpenPackageExport('router', '.'), 'src/data-context.ts');
  assertEquals(resolveOpenPackageExport('router', 'i18n'), 'src/i18n.ts');
});

Deno.test('resolveOpenPackageExport reports unknown openElement subpaths clearly', () => {
  assertThrows(
    () => resolveOpenPackageExport('core', 'missing'),
    Error,
    'Unknown @openelement/core export subpath',
  );
});

Deno.test('resolveVirtualOpenPackageRelative keeps relative imports in package namespace', () => {
  assertEquals(
    resolveVirtualOpenPackageRelative(
      './errors.ts',
      toVirtualOpenPackageId('core', 'src/index.ts'),
    ),
    toVirtualOpenPackageId('core', 'src/errors.ts'),
  );
  assertEquals(
    resolveVirtualOpenPackageRelative(
      '../shared.js',
      toVirtualOpenPackageId('content', 'src/sitemap/index.ts'),
    ),
    toVirtualOpenPackageId('content', 'src/shared.ts'),
  );
});

Deno.test('createOpenJsrPackageResolverPlugin resolves JSR and bare package ids', async () => {
  const plugin = createOpenJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.9',
    registry: 'jsr',
    fetchSource: (url) =>
      Promise.resolve(new Response(`export const url = ${JSON.stringify(url)};`)),
  });
  const resolveId = plugin.resolveId as unknown as (
    id: string,
    importer?: string,
  ) => string | null | Promise<string | null>;
  const load = plugin.load as unknown as (id: string) => string | null | Promise<string | null>;

  assertEquals(
    await resolveId('@openelement/ui/open-card'),
    toVirtualOpenPackageId('ui', 'src/open-card.tsx'),
  );
  assertEquals(
    await resolveId('jsr:@openelement/signal@^0.21/framework'),
    toVirtualOpenPackageId('signal', 'src/framework.ts'),
  );
  assertEquals(
    await load(toVirtualOpenPackageId('signal', 'src/framework.ts')),
    'export const url = "https://jsr.io/@openelement/signal/0.21.9/src/framework.ts";',
  );
});

Deno.test('createOpenJsrPackageResolverPlugin fails fetch misses before Vite unresolved import', async () => {
  const plugin = createOpenJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.9',
    registry: 'jsr',
    fetchSource: () => Promise.resolve(new Response('', { status: 404 })),
  });
  const load = plugin.load as unknown as (id: string) => string | null | Promise<string | null>;

  await assertRejects(
    () => Promise.resolve(load(toVirtualOpenPackageId('core', 'src/index.ts'))),
    Error,
    'Failed to fetch @openelement/core/src/index.ts',
  );
});

Deno.test('createOpenJsrPackageResolverPlugin can read local package sources before publish', async () => {
  const plugin = createOpenJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.9',
    registry: 'jsr',
    localPackageRoot: 'C:/repo',
    readLocalSource: (path) => `// ${path}`,
  });
  const load = plugin.load as unknown as (id: string) => string | null | Promise<string | null>;

  assertEquals(
    await load(toVirtualOpenPackageId('core', 'src/index.ts')),
    '// C:/repo/packages/core/src/index.ts',
  );
});

Deno.test('createOpenJsrPackageResolverPlugin resolves retained core packages but not optional data packages', async () => {
  const plugin = createOpenJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.9',
    registry: 'jsr',
  });
  const resolveId = plugin.resolveId as unknown as (
    id: string,
    importer?: string,
  ) => string | null | Promise<string | null>;

  assertEquals(
    await resolveId('@openelement/app'),
    toVirtualOpenPackageId('app', 'src/index.ts'),
  );
  assertEquals(
    await resolveId('@openelement/element'),
    toVirtualOpenPackageId('element', 'src/index.ts'),
  );
  assertEquals(
    await resolveId('@openelement/router'),
    toVirtualOpenPackageId('router', 'src/data-context.ts'),
  );

  // Optional retained data packages are handled by optionalPackageStubsPlugin
  // so SSG can run when the consumer did not install them.
  assertEquals(await resolveId('@openelement/content'), null);

  // i18n is now part of @openelement/app
  assertEquals(
    await resolveId('@openelement/app/i18n'),
    toVirtualOpenPackageId('app', 'src/i18n.ts'),
  );

  assertEquals(
    await resolveId('@openelement/core'),
    toVirtualOpenPackageId('core', 'src/index.ts'),
  );
});

Deno.test('createOpenJsrPackageResolverPlugin lets exact user aliases resolve first', async () => {
  const plugin = createOpenJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.9',
    registry: 'jsr',
    userAliases: {
      '@openelement/ui/open-layout': './app/components/site-layout.tsx',
    },
  });
  const resolveId = plugin.resolveId as unknown as (
    id: string,
    importer?: string,
  ) => string | null | Promise<string | null>;

  assertEquals(await resolveId('@openelement/ui/open-layout'), null);
  assertEquals(
    await resolveId('@openelement/ui/open-card'),
    toVirtualOpenPackageId('ui', 'src/open-card.tsx'),
  );
});

Deno.test('createOpenJsrPackageResolverPlugin rewrites npm: specifiers from JSR source', async () => {
  const jsrSource = [
    `import * as marked from 'npm:marked@12.0.0';`,
    `import type { Tokens } from 'npm:marked@12.0.0';`,
    `import { h } from 'npm:preact@10.29.2';`,
    `import { signal } from 'npm:@preact/signals-core@1.14.2';`,
    `import { ctx } from 'npm:@openelement/core@0.21.10/context';`,
    `import 'npm:marked@12.0.0';`,
    `const dynamic = import('npm:gray-matter@4.0.3');`,
    `const literal = 'npm:not-a-real-import@1.0.0';`,
    `export * from 'npm:@jsr/openelement__signals@0.21.10/framework';`,
    `import { helper } from 'npm:@scope/example-helper@0.21.10';`,
  ].join('\n');

  const plugin = createOpenJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.10',
    registry: 'jsr',
    fetchSource: () => Promise.resolve(new Response(jsrSource)),
  });
  const load = plugin.load as unknown as (id: string) => string | null | Promise<string | null>;

  const result = await load(toVirtualOpenPackageId('core', 'src/render-ir.ts')) as string;

  // npm: specifiers stripped to bare packages (version and prefix removed)
  assertEquals(result.includes("from 'marked'"), true);
  assertEquals(result.includes("from 'preact'"), true);
  assertEquals(result.includes("from '@preact/signals-core'"), true);
  assertEquals(result.includes("from '@openelement/core/context'"), true);
  assertEquals(result.includes("import 'marked'"), true);
  assertEquals(result.includes("import('gray-matter')"), true);
  assertEquals(result.includes("from '@jsr/openelement__signals/framework'"), true);
  assertEquals(result.includes("from '@scope/example-helper'"), true);
  assertEquals(result.includes("'npm:not-a-real-import@1.0.0'"), true);

  // npm: prefix and version should NOT remain
  assertEquals(result.replace("'npm:not-a-real-import@1.0.0'", '').includes('npm:'), false);
  assertEquals(result.includes('@12.0.0'), false);
  assertEquals(result.includes('@10.29.2'), false);
  assertEquals(result.includes('@1.14.2'), false);
});

Deno.test('createOpenJsrPackageResolverPlugin skips openElement resolution in npm mode', async () => {
  const plugin = createOpenJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.9',
    registry: 'npm',
  });
  const resolveId = plugin.resolveId as unknown as (
    id: string,
    importer?: string,
  ) => string | null | Promise<string | null>;
  const load = plugin.load as unknown as (id: string) => string | null | Promise<string | null>;

  assertEquals(await resolveId('@openelement/ui/open-card'), null);
  assertEquals(await load(toVirtualOpenPackageId('ui', 'src/open-card.tsx')), null);
});

Deno.test('createOpenJsrPackageResolverPlugin rewrites npm: specifiers during workspace transforms', async () => {
  const plugin = createOpenJsrPackageResolverPlugin({
    workspaceRoot: 'C:/repo',
    version: '0.28.5',
  });
  const transform = plugin.transform as unknown as (
    code: string,
    id?: string,
  ) => { code: string; map: null } | null | Promise<{ code: string; map: null } | null>;

  const result = await transform(
    [
      `import { marked } from 'npm:marked@^12.0.0';`,
      `const literal = 'npm:keep-me@1.0.0';`,
    ].join('\n'),
    'C:/repo/packages/core/src/security.ts',
  ) as { code: string; map: null };

  assertEquals(result.code.includes("from 'marked'"), true);
  assertEquals(result.code.includes("'npm:keep-me@1.0.0'"), true);
});
