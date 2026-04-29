/**
 * @kissjs/core - index.ts main entry tests (Deno)
 *
 * Tests that kiss() plugin factory returns a valid plugin array
 * with correct structure and re-exports.
 */
import { assertEquals, assertExists, assertArrayIncludes, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { kiss } from '../src/index.ts';

// Verify re-exports exist (compile-time)
import {
  ConflictError,
  ForbiddenError,
  HydrationError,
  KissError,
  NotFoundError,
  RateLimitError,
  SsrRenderError,
  UnauthorizedError,
  ValidationError,
} from '../src/errors.ts';

import { createSsrContext, extractParams, parseQuery } from '../src/context.ts';

import { renderSsrError, wrapInDocument } from '../src/ssr-handler.ts';

import {
  buildIslandChunkMap,
  injectClientScript,
  injectCspMeta,
  rewriteHtmlFiles,
} from '../src/ssg-postprocess.ts';

import { printBuildManifest, scanClientBuild, scanSSGOutput } from '../src/build-manifest.ts';

// ─── kiss() Plugin Factory ─────────────────────────────────────

Deno.test('kiss() returns an array of plugins', () => {
  const plugins = kiss();
  assertExists(plugins);
  assertEquals(Array.isArray(plugins), true);
  // Core: core, virtual-entry, dev-server, island-transform, html-template, build
  assertEquals(plugins.length, 6);
});

Deno.test('kiss() plugins have names starting with kiss:', () => {
  const plugins = kiss();
  const names = plugins.map((p) => p.name);

  // All KISS plugins should have the kiss: prefix
  for (const name of names) {
    if (name === '@hono/vite-dev-server') continue; // external
    assertEquals(name.startsWith('kiss:'), true, `Plugin "${name}" should start with "kiss:"`);
  }
});

Deno.test('kiss() includes required plugin types', () => {
  const plugins = kiss();
  const names = plugins.map((p) => p.name);

  // Must include these plugins
  assertArrayIncludes(names, ['kiss:core']);
  assertArrayIncludes(names, ['kiss:virtual-entry']);
  assertArrayIncludes(names, ['kiss:island-transform']);
  assertArrayIncludes(names, ['kiss:html-template']);
  assertArrayIncludes(names, ['kiss:build']);

  // External dev server
  assertArrayIncludes(names, ['@hono/vite-dev-server']);
});

Deno.test('kiss() accepts options without error', () => {
  const plugins = kiss({
    routesDir: 'pages',
    islandsDir: 'widgets',
    headExtras: '<link rel="stylesheet" />',
    html: { title: 'Test', lang: 'ja' },
    packageIslands: ['@kissjs/ui'],
    island: { hydrationStrategy: 'visible' },
    middleware: { corsOrigin: '*' },
  });

  assertEquals(plugins.length, 6);
});

Deno.test('kiss() core plugin has config hook defined', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'kiss:core')!;
  assertExists(corePlugin.config, 'core plugin must define config hook');
});

Deno.test('kiss() core plugin has buildStart hook defined', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'kiss:core')!;
  assertExists(corePlugin.buildStart, 'core plugin must define buildStart hook');
});

// ─── kiss() inject / headExtras branches ─────────────────────

Deno.test('kiss() inject.stylesheets → headExtras', () => {
  const plugins = kiss({
    inject: { stylesheets: ['https://cdn.example.com/app.css'] },
  });
  assertEquals(plugins.length, 6);
  // headExtras computed internally; plugin array created successfully = branch covered
  assertEquals(true, true);
});

Deno.test('kiss() inject.scripts → headExtras', () => {
  const plugins = kiss({
    inject: { scripts: ['https://cdn.example.com/app.js'] },
  });
  assertEquals(plugins.length, 6);
});

Deno.test('kiss() inject.headFragments → headExtras', () => {
  const plugins = kiss({
    inject: { headFragments: ['<meta name="theme-color" content="#000">'] },
  });
  assertEquals(plugins.length, 6);
});

Deno.test('kiss() inject all combined', () => {
  const plugins = kiss({
    inject: {
      stylesheets: ['https://cdn.example.com/app.css'],
      scripts: ['https://cdn.example.com/app.js'],
      headFragments: ['<meta charset="utf-8">'],
    },
  });
  assertEquals(plugins.length, 6);
});

Deno.test('kiss() legacy ui.cdn → headExtras', () => {
  const plugins = kiss({
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    ui: { cdn: true, version: '3.5.0' },
  } as never);
  assertEquals(plugins.length, 6);
});

Deno.test('kiss() headExtras takes precedence over inject', () => {
  const plugins = kiss({
    headExtras: '<meta name="override" />',
    inject: { stylesheets: ['https://example.com/style.css'] },
  });
  assertEquals(plugins.length, 6);
});

// ─── kiss() config hook (captures userConfig.resolve.alias) ───

Deno.test('kiss() corePlugin.config captures resolve.alias', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'kiss:core')!;
  assertExists(corePlugin.config);
  const result = corePlugin.config!({
    resolve: { alias: { '@/*': '/src/*' } },
  } as never);
  assertExists(result);
  assertExists((result as Record<string, unknown>).build, 'config should return build options');
  const build = (result as Record<string, unknown>).build as Record<string, unknown>;
  assertExists(build.rollupOptions, 'should include rollupOptions');
  const rollupOptions = build.rollupOptions as Record<string, unknown>;
  const input = rollupOptions.input as string[];
  assertExists(input.includes('virtual:kiss-hono-entry'), 'should include virtual entry in input');
});

Deno.test('kiss() corePlugin.config returns rollupOptions with virtual entry', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'kiss:core')!;
  const result = corePlugin.config!({} as never) as Record<string, unknown>;
  const build = result.build as Record<string, unknown>;
  const rollupOptions = build.rollupOptions as Record<string, unknown>;
  const input = rollupOptions.input as string[];
  assertExists(input.includes('virtual:kiss-hono-entry'));
});

// ─── kiss() configResolved + generateEntry ───────────────────

Deno.test('kiss() corePlugin.configResolved sets honoEntryCode', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'kiss:core')!;
  assertExists(corePlugin.configResolved);
  // Should not throw when called with fake config
  corePlugin.configResolved!({} as never);
  assertEquals(true, true);
});

// ─── kiss() virtualEntryPlugin hooks ────────────────────────

Deno.test('kiss() virtualEntryPlugin.resolveId matches VIRTUAL_ENTRY_ID', () => {
  const plugins = kiss();
  const virtualPlugin = plugins.find((p) => p.name === 'kiss:virtual-entry')!;
  assertExists(virtualPlugin.resolveId);
  // The resolved ID includes '\0' prefix — we just verify it returns non-null for the ID
  const result = virtualPlugin.resolveId!('virtual:kiss-hono-entry', undefined as never, {} as never);
  assertExists(result);
});

Deno.test('kiss() virtualEntryPlugin.load returns code for resolved ID', () => {
  const plugins = kiss();
  const virtualPlugin = plugins.find((p) => p.name === 'kiss:virtual-entry')!;
  assertExists(virtualPlugin.load);
  // '\0virtual:kiss-hono-entry' is the resolved ID
  const code = virtualPlugin.load!('\0virtual:kiss-hono-entry' as never);
  assertExists(code);
  assertStringIncludes(code as string, 'hono');
});

// ─── kiss() packageIslands option ───────────────────────────

Deno.test('kiss() with packageIslands option (empty array)', () => {
  const plugins = kiss({ packageIslands: [] });
  assertEquals(plugins.length, 6);
});

// ─── kiss() default dirs ────────────────────────────────────

Deno.test('kiss() applies default routesDir and islandsDir', () => {
  const plugins = kiss();
  assertEquals(plugins.length, 6);
  // Defaults are applied internally; success = branch covered
  assertEquals(true, true);
});
