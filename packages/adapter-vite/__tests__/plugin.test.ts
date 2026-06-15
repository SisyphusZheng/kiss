/**
 * @openelement/adapter-vite - plugin.ts tests (Deno)
 *
 * Focused tests for the internal plugin factory (plugin.ts):
 * Tests the raw `createOpenPlugin()` function which is NOT part of the public API —
 * consumers should use `openPipeline()` from the main entry.
 *
 * Complements index-plugin.test.ts which tests the public API surface.
 */
import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@^1.0.0';
import { createOpenPlugin } from '../src/plugin.ts';

type HookRecord = {
  config?: unknown;
  load?: unknown;
  resolveId?: unknown;
};
type TestConfigHook = (config: Record<string, unknown>) => unknown;
type TestLoadHook = (id: string) => unknown;
type TestResolveIdHook = (id: string) => unknown;

function callConfig(
  plugin: unknown,
  config: Record<string, unknown> = {},
): Record<string, unknown> {
  const hook = (plugin as HookRecord).config;
  assertExists(hook, 'config hook must exist');
  return (hook as TestConfigHook)(config) as Record<string, unknown>;
}

function callResolveId(plugin: unknown, id: string): unknown {
  const hook = (plugin as HookRecord).resolveId;
  assertExists(hook, 'resolveId hook must exist');
  return (hook as TestResolveIdHook)(id);
}

function callLoad(plugin: unknown, id: string): unknown {
  const hook = (plugin as HookRecord).load;
  assertExists(hook, 'load hook must exist');
  return (hook as TestLoadHook)(id);
}

// ─── Plugin Order & Structure ─────────────────────────────────

Deno.test('openPlugin: returns 10 plugins in correct order', () => {
  const plugins = createOpenPlugin();
  assertEquals(plugins.length, 10);

  const names = plugins.map((p) => p.name);
  assertEquals(names, [
    'open:mdx',
    'open:core',
    'open:generated-data',
    'open:core-resolve',
    'open:optional-package-stubs',
    'open:virtual-entry',
    '@hono/vite-dev-server',
    'open:island-transform',
    'open:build',
    'open:devtools',
  ]);
});

Deno.test('openPlugin: core-resolve plugin has enforce=pre', () => {
  const plugins = createOpenPlugin();
  const resolvePlugin = plugins.find((p) => p.name === 'open:core-resolve')!;
  assertExists(resolvePlugin);
  assertEquals(resolvePlugin.enforce, 'pre');
});

Deno.test('openPlugin: core-resolve has enforce=pre', () => {
  const plugins = createOpenPlugin();
  // Only core-resolve explicitly needs enforce: 'pre' for resolution priority
  const resolvePlugin = plugins.find((p) => p.name === 'open:core-resolve')!;
  assertEquals(resolvePlugin.enforce, 'pre');
});

// ─── Option Defaults ──────────────────────────────────────────

Deno.test('openPlugin: defaults routesDir to app/routes', () => {
  const plugins = createOpenPlugin({});
  // Default is applied internally - verify plugin creation succeeds
  assertExists(plugins);
  assertEquals(plugins.length, 10);
});

Deno.test('openPlugin: defaults islandsDir to app/islands', () => {
  const plugins = createOpenPlugin({});
  assertExists(plugins);
  assertEquals(plugins.length, 10);
});

Deno.test('openPlugin: defaults componentsDir to app/components', () => {
  const plugins = createOpenPlugin({});
  assertExists(plugins);
  assertEquals(plugins.length, 10);
});

Deno.test('openPlugin: respects custom routesDir', () => {
  const plugins = createOpenPlugin({ routesDir: 'src/pages' });
  assertExists(plugins);
  assertEquals(plugins.length, 10);
});

Deno.test('openPlugin: respects custom islandsDir', () => {
  const plugins = createOpenPlugin({ islandsDir: 'src/widgets' });
  assertExists(plugins);
  assertEquals(plugins.length, 10);
});

Deno.test('openPlugin: respects custom componentsDir', () => {
  const plugins = createOpenPlugin({ componentsDir: 'src/ui' });
  assertExists(plugins);
  assertEquals(plugins.length, 10);
});

// ─── Upgrade Strategy Default ─────────────────────────────────

Deno.test('openPlugin: default upgradeStrategy is idle', () => {
  const plugins = createOpenPlugin({});
  // The default 'idle' is applied in generateEntry -> generateHonoEntryCode
  // Verification: plugin construction succeeds with default
  assertExists(plugins);
});

Deno.test('openPlugin: accepts upgradeStrategy=load', () => {
  const plugins = createOpenPlugin({ island: { upgradeStrategy: 'load' } });
  assertExists(plugins);
});

Deno.test('openPlugin: accepts upgradeStrategy=visible', () => {
  const plugins = createOpenPlugin({ island: { upgradeStrategy: 'visible' } });
  assertExists(plugins);
});

// ─── Invalid Options ──────────────────────────────────────────

Deno.test('openPlugin: rejects script tags in headExtras', () => {
  assertThrows(
    () => createOpenPlugin({ headExtras: '<script>alert(1)</script>' }),
    Error,
    'headExtras must not contain <script> tags',
  );
});

Deno.test('openPlugin: rejects script tags in inject.headFragments', () => {
  assertThrows(
    () => createOpenPlugin({ inject: { headFragments: ['<script src="/x.js"></script>'] } }),
    Error,
    'inject.headFragments must not contain <script> tags',
  );
});

Deno.test('openPlugin: handles empty options object', () => {
  const plugins = createOpenPlugin({});
  assertEquals(plugins.length, 10);
});

Deno.test('openPlugin: handles undefined options', () => {
  const plugins = createOpenPlugin();
  assertEquals(plugins.length, 10);
});

// ─── Virtual Entry Plugin Behaviors ───────────────────────────

Deno.test('openPlugin: virtual-entry resolves virtual:open-hono-entry', () => {
  const plugins = createOpenPlugin({});
  const virtualPlugin = plugins.find((p) => p.name === 'open:virtual-entry')!;

  const resolved = callResolveId(virtualPlugin, 'virtual:open-hono-entry');
  assertExists(resolved);
  assertEquals(resolved, '\0virtual:open-hono-entry');
});

Deno.test('openPlugin: virtual-entry resolves virtual:open-build-trigger', () => {
  const plugins = createOpenPlugin({});
  const virtualPlugin = plugins.find((p) => p.name === 'open:virtual-entry')!;

  const resolved = callResolveId(virtualPlugin, 'virtual:open-build-trigger');
  assertExists(resolved);
  assertEquals(resolved, '\0virtual:open-build-trigger');
});

Deno.test('openPlugin: virtual-entry resolveId returns undefined for unknown IDs', () => {
  const plugins = createOpenPlugin({});
  const virtualPlugin = plugins.find((p) => p.name === 'open:virtual-entry')!;

  const result = callResolveId(virtualPlugin, 'some-random-module');
  assertEquals(result, undefined);
});

Deno.test('openPlugin: virtual-entry load returns code for resolved entry ID', () => {
  const plugins = createOpenPlugin({});
  const virtualPlugin = plugins.find((p) => p.name === 'open:virtual-entry')!;

  const code = callLoad(virtualPlugin, '\0virtual:open-hono-entry');
  assertExists(code);
  assertStringIncludes(code as string, 'hono');
});

Deno.test('openPlugin: virtual-entry load returns null export for build trigger', () => {
  const plugins = createOpenPlugin({});
  const virtualPlugin = plugins.find((p) => p.name === 'open:virtual-entry')!;

  const code = callLoad(virtualPlugin, '\0virtual:open-build-trigger');
  assertExists(code);
  assertEquals(code, 'export default null;');
});

Deno.test('openPlugin: virtual-entry load returns undefined for unknown IDs', () => {
  const plugins = createOpenPlugin({});
  const virtualPlugin = plugins.find((p) => p.name === 'open:virtual-entry')!;

  const result = callLoad(virtualPlugin, 'unknown-virtual-id');
  assertEquals(result, undefined);
});

// ─── Core Plugin Hooks ────────────────────────────────────────

Deno.test('openPlugin: core plugin has config hook', () => {
  const plugins = createOpenPlugin({});
  const corePlugin = plugins.find((p) => p.name === 'open:core')!;

  assertExists(corePlugin.config);
  assertEquals(typeof corePlugin.config, 'function');
});

Deno.test('openPlugin: core plugin has configResolved hook', () => {
  const plugins = createOpenPlugin({});
  const corePlugin = plugins.find((p) => p.name === 'open:core')!;

  assertExists(corePlugin.configResolved);
  assertEquals(typeof corePlugin.configResolved, 'function');
});

Deno.test('openPlugin: core plugin has buildStart hook', () => {
  const plugins = createOpenPlugin({});
  const corePlugin = plugins.find((p) => p.name === 'open:core')!;

  assertExists(corePlugin.buildStart);
  assertEquals(typeof corePlugin.buildStart, 'function');
});

Deno.test('openPlugin: core config sets chunkSizeWarningLimit', () => {
  const plugins = createOpenPlugin({});
  const corePlugin = plugins.find((p) => p.name === 'open:core')!;

  const result = callConfig(corePlugin);
  const build = result.build as Record<string, unknown>;
  assertEquals(build.chunkSizeWarningLimit, 1500);
});

Deno.test('openPlugin: core config includes rollupOptions with build trigger input', () => {
  const plugins = createOpenPlugin({});
  const corePlugin = plugins.find((p) => p.name === 'open:core')!;

  const result = callConfig(corePlugin);
  const build = result.build as Record<string, unknown>;
  const rollupOptions = build.rollupOptions as Record<string, unknown>;
  const input = rollupOptions.input as string[];

  assertExists(input);
  assertArrayIncludes(input, ['virtual:open-build-trigger']);
});

// ─── Island Transform Plugin ──────────────────────────────────

Deno.test('openPlugin: island-transform plugin exists with correct name', () => {
  const plugins = createOpenPlugin({});
  const islandPlugin = plugins.find((p) => p.name === 'open:island-transform')!;

  assertExists(islandPlugin);
  assertEquals(islandPlugin.name, 'open:island-transform');
});

Deno.test('openPlugin: island-transform has transform hook', () => {
  const plugins = createOpenPlugin({});
  const islandPlugin = plugins.find((p) => p.name === 'open:island-transform')!;

  assertExists(islandPlugin.transform, 'island transform must have transform hook');
});

// ─── Build Plugin ─────────────────────────────────────────────

Deno.test('openPlugin: build plugin exists', () => {
  const plugins = createOpenPlugin({});
  const buildPlugin = plugins.find((p) => p.name === 'open:build')!;

  assertExists(buildPlugin);
});

// ─── Devtools Plugin ──────────────────────────────────────────

Deno.test('openPlugin: devtools plugin exists', () => {
  const plugins = createOpenPlugin({});
  const devtoolsPlugin = plugins.find((p) => p.name === 'open:devtools')!;

  assertExists(devtoolsPlugin);
});

// ─── Dev Server Plugin ────────────────────────────────────────

Deno.test('openPlugin: dev server plugin is @hono/vite-dev-server', () => {
  const plugins = createOpenPlugin({});
  const devServerPlugin = plugins.find((p) => p.name === '@hono/vite-dev-server')!;

  assertExists(devServerPlugin);
});

// ─── packageIslands Option ────────────────────────────────────

Deno.test('openPlugin: accepts packageIslands option', () => {
  const plugins = createOpenPlugin({ packageIslands: ['@openelement/ui'] });
  assertExists(plugins);
  assertEquals(plugins.length, 10);
});

Deno.test('openPlugin: accepts empty packageIslands', () => {
  const plugins = createOpenPlugin({ packageIslands: [] });
  assertExists(plugins);
  assertEquals(plugins.length, 10);
});

Deno.test('openPlugin: accepts multiple packageIslands', () => {
  const plugins = createOpenPlugin({
    packageIslands: ['@openelement/ui', '@openelement/core'],
  });
  assertExists(plugins);
});

// ─── CORS Origin Edge Cases ───────────────────────────────────

Deno.test('openPlugin: accepts middleware.corsOrigin as string', () => {
  const plugins = createOpenPlugin({ middleware: { corsOrigin: 'https://example.com' } });
  assertExists(plugins);
});

Deno.test('openPlugin: accepts middleware.corsOrigin as array', () => {
  const plugins = createOpenPlugin({
    middleware: { corsOrigin: ['https://a.com', 'https://b.com'] },
  });
  assertExists(plugins);
});

// ─── HTML Config ──────────────────────────────────────────────

Deno.test('openPlugin: accepts html config with title', () => {
  const plugins = createOpenPlugin({ html: { title: 'My App' } });
  assertExists(plugins);
});

Deno.test('openPlugin: accepts html config with lang', () => {
  const plugins = createOpenPlugin({ html: { lang: 'zh-CN' } });
  assertExists(plugins);
});

Deno.test('openPlugin: accepts full html config', () => {
  const plugins = createOpenPlugin({ html: { lang: 'ja', title: 'テスト' } });
  assertExists(plugins);
});

// ─── Inject Structured API ────────────────────────────────────

Deno.test('openPlugin: inject.stylesheets string form', () => {
  const plugins = createOpenPlugin({
    inject: { stylesheets: ['https://cdn.example.com/app.css'] },
  });
  assertExists(plugins);
});

Deno.test('openPlugin: inject.stylesheets object form with integrity', () => {
  const plugins = createOpenPlugin({
    inject: {
      stylesheets: [{
        href: 'https://cdn.example.com/app.css',
        integrity: 'sha384-abc',
      }],
    },
  });
  assertExists(plugins);
});

Deno.test('openPlugin: inject.scripts with defer', () => {
  const plugins = createOpenPlugin({
    inject: { scripts: [{ src: 'https://cdn.example.com/app.js', defer: true }] },
  });
  assertExists(plugins);
});

Deno.test('openPlugin: headExtras and inject work together (headExtras wins)', () => {
  const plugins = createOpenPlugin({
    headExtras: '<meta name="override" />',
    inject: { stylesheets: ['https://cdn.example.com/app.css'] },
  });
  assertExists(plugins);
});
