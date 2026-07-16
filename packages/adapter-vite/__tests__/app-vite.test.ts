/**
 * @openelement/adapter-vite unified entry tests.
 *
 * Tests that openElement() correctly combines openPipeline() + openContent() + openI18n()
 * with a shared OpenElementBuildContext. This is the primary user-facing API.
 */
import { assertArrayIncludes, assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
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

Deno.test('openElement() accepts html config', () => {
  const plugins = openElement({ html: { title: 'Test', lang: 'ja' } });
  assertExists(plugins);
});

Deno.test('openElement() accepts packageIslands config', () => {
  const plugins = openElement({ packageIslands: ['@openelement/ui'] });
  assertExists(plugins);
});

Deno.test('openElement() accepts middleware config', () => {
  const plugins = openElement({ middleware: { corsOrigin: '*' } });
  assertExists(plugins);
});
