// deno-lint-ignore no-unversioned-import
import { assertEquals } from 'jsr:@std/assert';
import { join } from 'node:path';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { createBlogPlugin } from '../src/blog/plugin.ts';
import { createNavPlugin } from '../src/nav/plugin.ts';
import type { FileSystemAdapter } from '../src/fs-adapter.ts';
import type { OpenElementBuildContextLike } from '@openelement/protocol/framework';

const TMP_DIR = join(import.meta.dirname!, '__tmp_content_plugin_test__');

function setup() {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });
}

function cleanup() {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
}

function createFakeFs(cwd: string): FileSystemAdapter & { files: Map<string, string> } {
  const files = new Map<string, string>();
  return {
    cwd: () => cwd,
    mkdirSync: () => {},
    writeFileSync: (path, data) => {
      files.set(path, data);
    },
    files,
  };
}

function callBuildStart(plugin: Plugin): Promise<void> | void {
  const hook = plugin.buildStart;
  if (!hook) return;
  if (typeof hook === 'function') {
    return hook.call({} as never, {} as never);
  }
  return hook.handler.call({} as never, {} as never);
}

function createTestCtx(): OpenElementBuildContextLike {
  return {
    plugins: {
      blogOptions: null,
      navSections: [],
      headerNav: [],
      sitemapOptions: null,
      i18nOptions: null,
    },
    registerPlugin(name: string, instance: unknown) {
      this.plugins[name] = instance;
    },
  };
}

Deno.test('createBlogPlugin writes generated blog data module via adapter', async () => {
  setup();

  const postsDir = join(TMP_DIR, 'posts');
  mkdirSync(postsDir, { recursive: true });
  writeFileSync(
    join(postsDir, 'hello.md'),
    `---\ntitle: Hello World\ndate: 2026-01-01\n---\n\nHello content.\n`,
  );

  const fakeFs = createFakeFs(TMP_DIR);
  const plugin = createBlogPlugin({ contentDir: postsDir }, undefined, fakeFs);
  await callBuildStart(plugin);

  const expectedPath = join(TMP_DIR, 'app', 'data', '_generated-blog-data.ts');
  assertEquals(fakeFs.files.has(expectedPath), true);

  const content = fakeFs.files.get(expectedPath)!;
  assertEquals(content.includes('export const posts'), true);
  assertEquals(content.includes('Hello World'), true);
  assertEquals(content.includes('hello'), true);

  cleanup();
});

Deno.test('createNavPlugin writes nav module and search index via adapter', async () => {
  setup();

  const routesDir = join(TMP_DIR, 'routes');
  mkdirSync(join(routesDir, 'guide'), { recursive: true });
  writeFileSync(
    join(routesDir, 'guide', 'getting-started.ts'),
    `export const meta = { section: 'Start Here', label: 'Getting Started', order: 10 };\nexport class Page {}`,
  );

  const fakeFs = createFakeFs(TMP_DIR);
  const plugin = createNavPlugin(
    { routesDir, headerNav: [{ href: '/', label: 'Home' }] },
    undefined,
    fakeFs,
  );
  await callBuildStart(plugin);

  const navPath = join(TMP_DIR, 'app', 'data', '_generated-nav.ts');
  const searchPath = join(TMP_DIR, 'public', 'search-index.json');

  assertEquals(fakeFs.files.has(navPath), true);
  assertEquals(fakeFs.files.has(searchPath), true);

  const navContent = fakeFs.files.get(navPath)!;
  assertEquals(navContent.includes('export const headerNav'), true);
  assertEquals(navContent.includes('Getting Started'), true);

  const searchContent = fakeFs.files.get(searchPath)!;
  assertEquals(searchContent.includes('Getting Started'), true);

  cleanup();
});

Deno.test('createBlogPlugin passes blog options to ctx', async () => {
  const fakeFs = createFakeFs(TMP_DIR);
  const ctx = createTestCtx();

  const plugin = createBlogPlugin(
    { contentDir: '/nonexistent', basePath: '/journal' },
    ctx,
    fakeFs,
  );
  await callBuildStart(plugin);

  assertEquals(ctx.plugins.blogOptions, { contentDir: '/nonexistent', basePath: '/journal' });
});
