/**
 * @openelement/adapter-vite - i18n-plugin.ts tests (Deno)
 *
 * Verifies that openI18n() routes file-system access through the injected
 * FileSystemAdapter, so buildStart() can be unit-tested without touching
 * the real disk (parity with the blog/nav content plugins, #847).
 */
import { assertEquals, assertExists, assertStringIncludes } from '@std/assert';
import { openI18n } from '../src/i18n-plugin.ts';
import type { FileSystemAdapter } from '../src/internal/content/fs-adapter.ts';
import type { OpenElementBuildContextLike } from '../src/internal/protocol/framework.ts';

type MemoryFs = FileSystemAdapter & {
  dirs: string[];
  writes: Map<string, string>;
};

function createMemoryFs(cwd = '/virtual'): MemoryFs {
  const dirs: string[] = [];
  const writes = new Map<string, string>();
  return {
    dirs,
    writes,
    cwd: () => cwd,
    mkdirSync: (path: string) => {
      dirs.push(path);
    },
    writeFileSync: (path: string, data: string) => {
      writes.set(path, data);
    },
  };
}

function callBuildStart(plugin: unknown): void {
  const hook = (plugin as { buildStart?: unknown }).buildStart;
  assertExists(hook, 'buildStart hook must exist');
  (hook as () => void)();
}

Deno.test('openI18n: writes generated data module through injected fs adapter', () => {
  const fs = createMemoryFs('/virtual');
  const plugin = openI18n({ locales: ['en', 'zh'], defaultLocale: 'en', fs });

  assertEquals(plugin.name, 'open:i18n');
  callBuildStart(plugin);

  const dataDir = '/virtual/app/data';
  assertEquals(fs.dirs, [dataDir]);

  const written = fs.writes.get(`${dataDir}/_generated-i18n-data.ts`);
  assertExists(written, 'generated i18n data module must be written via the adapter');
  assertStringIncludes(written, 'export const locales = ["en","zh"];');
  assertStringIncludes(written, 'export const defaultLocale = "en";');
});

Deno.test('openI18n: registers i18n options on the shared build context', () => {
  const fs = createMemoryFs();
  const registered: Record<string, unknown> = {};
  const ctx: OpenElementBuildContextLike = {
    plugins: {
      blogOptions: null,
      navSections: [],
      headerNav: [],
      sitemapOptions: null,
      i18nOptions: null,
    },
    registerPlugin: (name: string, value: unknown) => {
      registered[name] = value;
    },
  };
  const plugin = openI18n({
    locales: ['en', 'zh'],
    defaultLocale: 'zh',
    ctx,
    fs,
  });

  callBuildStart(plugin);

  assertEquals(registered.i18nOptions, {
    locales: ['en', 'zh'],
    defaultLocale: 'zh',
  });
});
