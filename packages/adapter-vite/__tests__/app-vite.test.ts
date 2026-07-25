/**
 * @openelement/adapter-vite/app-vite - Unified entry tests
 *
 * Tests that openElement() correctly combines openPipeline() + openContent() + openI18n()
 * with a shared OpenElementBuildContext. This is the primary user-facing API.
 */
import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertRejects,
  assertStringIncludes,
} from 'jsr:@std/assert@^1.0.0';
import { join } from 'node:path';
import { openElement } from '../src/app-vite.ts';

// ─── Plugin structure ──────────────────────────────────────────

Deno.test('openElement() returns an array of plugins', () => {
  const plugins = openElement();
  assertExists(plugins);
  assertEquals(Array.isArray(plugins), true);
});

Deno.test('openElement() plugins have names starting with open:', () => {
  const plugins = openElement();
  for (const p of plugins) {
    if (p.name === '@hono/vite-dev-server') continue;
    assertEquals(
      p.name.startsWith('open:'),
      true,
      `Plugin "${p.name}" should start with "open:"`,
    );
  }
});

Deno.test('openElement() minimal includes open:core, open:build, open:virtual-entry', () => {
  const names = openElement().map((p) => p.name);
  assertArrayIncludes(names, ['open:core']);
  assertArrayIncludes(names, ['open:build']);
  assertArrayIncludes(names, ['open:virtual-entry']);
});

Deno.test('openElement() minimal includes dev server', () => {
  const names = openElement().map((p) => p.name);
  assertArrayIncludes(names, ['@hono/vite-dev-server']);
});

// ─── Content plugin integration ────────────────────────────────

Deno.test('openElement() with content adds open:content:blog plugin', () => {
  const names = openElement({ content: { blog: { contentDir: 'posts', basePath: '/blog' } } })
    .map((p) => p.name);
  assertArrayIncludes(names, ['open:content:blog']);
  assertArrayIncludes(names, ['open:generated-data']);
});

Deno.test('openElement() with content has more plugins than without', () => {
  const without = openElement();
  const withContent = openElement({ content: { blog: { contentDir: 'posts' } } });
  assertEquals(withContent.length > without.length, true);
});

Deno.test('openElement() with content blog: false excludes open:content:blog plugin', () => {
  const names = openElement({ content: {} }).map((p) => p.name);
  // Empty content config enables no content modules.
  assertEquals(names.includes('open:content:blog'), false);
});

// ─── i18n plugin integration ──────────────────────────────────

Deno.test('openElement() with i18n adds open:i18n plugin', () => {
  const names = openElement({ i18n: { locales: ['en', 'zh'], defaultLocale: 'en' } })
    .map((p) => p.name);
  assertArrayIncludes(names, ['open:i18n']);
});

Deno.test('openElement() with i18n uses framework generated data resolver', () => {
  const names = openElement({ i18n: { locales: ['en', 'zh'], defaultLocale: 'en' } })
    .map((p) => p.name);
  assertArrayIncludes(names, ['open:generated-data']);
});

// ─── Content + i18n combined ──────────────────────────────────

Deno.test('openElement() with both content and i18n includes all plugins', () => {
  const names = openElement({
    content: { blog: { contentDir: 'posts' } },
    i18n: { locales: ['en'], defaultLocale: 'en' },
  }).map((p) => p.name);
  assertArrayIncludes(names, ['open:content:blog']);
  assertArrayIncludes(names, ['open:i18n']);
  assertArrayIncludes(names, ['open:core']);
  assertArrayIncludes(names, ['open:build']);
});

// ─── Plugin count sanity ──────────────────────────────────────

Deno.test('openElement() returns at least 8 plugins', () => {
  const plugins = openElement();
  assertEquals(plugins.length >= 8, true);
});

Deno.test('openElement() with content returns more plugins', () => {
  const base = openElement().length;
  const withContent = openElement({ content: { blog: { contentDir: 'posts' } } }).length;
  assertEquals(withContent >= base, true);
});

// ─── Options propagation ─────────────────────────────────────

/**
 * Drive the umbrella plugins the way Vite does — config, configResolved,
 * buildStart, then virtual-entry load — against a temp working directory and
 * return the generated SSR entry code.
 */
async function renderUmbrellaEntry(
  options: Parameters<typeof openElement>[0],
  setup?: (tmp: string) => void,
): Promise<string> {
  const tmp = Deno.makeTempDirSync({ prefix: 'open-app-vite-' });
  const origCwd = Deno.cwd();
  try {
    setup?.(tmp);
    Deno.chdir(tmp);
    const plugins = openElement(options);
    const corePlugin = plugins.find((p) => p.name === 'open:core')!;
    const virtualPlugin = plugins.find((p) => p.name === 'open:virtual-entry')!;
    const config = (corePlugin as { config?: unknown }).config;
    assertExists(config, 'config hook must exist');
    (config as (c: Record<string, unknown>) => unknown)({});
    const configResolved = (corePlugin as { configResolved?: unknown }).configResolved;
    assertExists(configResolved, 'configResolved hook must exist');
    (configResolved as (config: never) => void)({} as never);
    const buildStart = (corePlugin as { buildStart?: unknown }).buildStart;
    assertExists(buildStart, 'buildStart hook must exist');
    await (buildStart as () => Promise<void>)();
    const load = (virtualPlugin as { load?: unknown }).load;
    assertExists(load, 'load hook must exist');
    const code = (load as (id: string) => unknown)('\0virtual:open-hono-entry');
    assertExists(code, 'virtual entry load must return code');
    return String(code);
  } finally {
    Deno.chdir(origCwd);
    try {
      Deno.removeSync(tmp, { recursive: true });
    } catch { /* ignore */ }
  }
}

Deno.test('openElement() html config reaches the generated entry document', async () => {
  // The document title/lang are only rendered once at least one route exists.
  const code = await renderUmbrellaEntry({ html: { title: 'Test', lang: 'ja' } }, (tmp) => {
    Deno.mkdirSync(join(tmp, 'app', 'routes'), { recursive: true });
    Deno.writeTextFileSync(
      join(tmp, 'app', 'routes', 'index.ts'),
      'export default () => "<h1>Hello</h1>"',
    );
  });
  assertStringIncludes(code, '"Test"');
  assertStringIncludes(code, '"ja"');
});

Deno.test('openElement() middleware.corsOrigin reaches the generated entry', async () => {
  const code = await renderUmbrellaEntry({ middleware: { corsOrigin: ['https://example.com'] } });
  assertStringIncludes(code, 'https://example.com');
});

Deno.test('openElement() packageIslands are scanned during buildStart', async () => {
  const tmp = Deno.makeTempDirSync({ prefix: 'open-app-vite-' });
  const origCwd = Deno.cwd();
  try {
    Deno.chdir(tmp);
    const plugins = openElement({ packageIslands: ['@nonexistent/package'] });
    const corePlugin = plugins.find((p) => p.name === 'open:core')!;
    const buildStart = (corePlugin as { buildStart?: unknown }).buildStart;
    assertExists(buildStart, 'buildStart hook must exist');
    // A configured packageIsland that cannot be imported must surface as a
    // route-scan failure, proving the option is wired into buildStart.
    await assertRejects(
      () => (buildStart as () => Promise<void>)(),
      Error,
      '@nonexistent/package',
    );
  } finally {
    Deno.chdir(origCwd);
    try {
      Deno.removeSync(tmp, { recursive: true });
    } catch { /* ignore */ }
  }
});
