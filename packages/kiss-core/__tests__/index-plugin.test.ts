/**
 * @kissjs/core - index.ts main entry tests (Deno)
 *
 * Tests that kiss() plugin factory returns a valid plugin array
 * with correct structure and re-exports.
 */
import { assertEquals, assertExists, assertArrayIncludes } from 'jsr:@std/assert@^1.0.0';
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
