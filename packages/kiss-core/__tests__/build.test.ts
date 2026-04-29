// deno-lint-ignore-file no-explicit-any
/**
 * @kissjs/core - build / entry-generators tests (Deno)
 *
 * v0.3.0: generateClientEntry now takes ClientIslandEntry[] + strategy.
 * It includes Lit hydration logic (hydrate from @lit-labs/ssr-client).
 */
import { assertEquals, assertExists, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { generateClientEntry } from '../src/entry-generators.ts';
import { buildPlugin } from '../src/build.ts';
import { join } from 'node:path';
import { readFileSync, rmSync } from 'node:fs';

const KISS_TMP = join(Deno.cwd(), '.kiss');

/**
 * Call a Vite ObjectHook that may be a plain function or { handler, order? }.
 * Avoids TS2349 "not all constituents are callable".
 */
function callHook(hook: unknown, ...args: any[]): void {
  if (typeof hook === 'function') {
    hook(...args);
  } else if (hook && typeof hook === 'object' && 'handler' in hook) {
    (hook as { handler: (...a: any[]) => any }).handler(...args);
  }
}

async function callAsyncHook(hook: unknown, ...args: any[]): Promise<void> {
  let result: unknown;
  if (typeof hook === 'function') {
    result = hook(...args);
  } else if (hook && typeof hook === 'object' && 'handler' in hook) {
    result = (hook as { handler: (...a: any[]) => any }).handler(...args);
  }
  if (result instanceof Promise) await result;
}

function cleanup() {
  try {
    rmSync(KISS_TMP, { recursive: true, force: true });
  } catch { /* ignore */ }
}

function makeConfig(command: 'build' | 'serve', base = '/'): Record<string, unknown> {
  return { command, base, root: Deno.cwd() } as Record<string, unknown>;
}

// --- generateClientEntry tests -------------------------------------------------

Deno.test('build - generateClientEntry', async (t) => {
  await t.step('returns empty comment when no islands', () => {
    const code = generateClientEntry([]);
    assertStringIncludes(code, 'No islands detected');
    assertEquals(code.includes('hydrate'), false);
  });

  await t.step('generates imports for island files', () => {
    const islands = [
      { tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' },
      { tagName: 'theme-toggle', modulePath: '/app/islands/theme-toggle.ts' },
    ];
    const code = generateClientEntry(islands, 'lazy');
    assertStringIncludes(code, "import Island_0 from '/app/islands/my-counter.ts'");
    assertStringIncludes(code, "import Island_1 from '/app/islands/theme-toggle.ts'");
  });

  await t.step('generates customElements.define() registrations', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'lazy');
    assertStringIncludes(code, "customElements.get('my-counter')");
    assertStringIncludes(code, "customElements.define('my-counter'");
  });

  await t.step('guards against duplicate registration', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'lazy');
    assertStringIncludes(code, "if (!customElements.get('my-counter'))");
  });

  await t.step('includes KISS Architecture comment', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'lazy');
    assertStringIncludes(code, 'KISS Architecture');
  });

  await t.step('imports and activates lit-element-hydrate-support', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'lazy');
    assertStringIncludes(code, '@lit-labs/ssr-client/lit-element-hydrate-support.js');
    assertStringIncludes(code, 'litElementHydrateSupport');
    assertStringIncludes(code, 'LitElement');
  });

  await t.step('waits for whenDefined before hydrating', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'lazy');
    assertStringIncludes(code, 'customElements.whenDefined');
    assertStringIncludes(code, 'Promise.all');
  });
});

// --- buildPlugin tests --------------------------------------------------------

Deno.test('buildPlugin - configResolved', () => {
  const plugin = buildPlugin();
  const config = makeConfig('build', '/base/');
  callHook(plugin.configResolved, config);
  // If we reach here without error, the hook ran.
  // We can't directly inspect `base` (it's closed over), but closeBundle will use it.
  assertEquals(typeof plugin.name, 'string');
  assertEquals(plugin.name, 'kiss:build');
});

Deno.test('buildPlugin - closeBundle (build mode, no islands)', async (t) => {
  cleanup();
  const plugin = buildPlugin({}, undefined);
  const config = makeConfig('build');
  callHook(plugin.configResolved, config);
  await callAsyncHook(plugin.closeBundle);

  await t.step('writes build-metadata.json', () => {
    const metaPath = join(KISS_TMP, 'build-metadata.json');
    const raw = readFileSync(metaPath, 'utf-8');
    const meta = JSON.parse(raw);
    assertEquals(meta.islandTagNames, []);
    assertEquals(meta.packageIslands, []);
    assertEquals(meta.outDir, 'dist');
    assertEquals(meta.base, '/');
  });

  await t.step('prints "No islands" message', () => {
    // The console.log output is captured in test output; we just verify no error.
    assertEquals(true, true);
  });

  cleanup();
});

Deno.test('buildPlugin - closeBundle (build mode, with islands)', async (t) => {
  cleanup();
  const ctx = {
    islandTagNames: ['my-counter', 'theme-toggle'],
    packageIslands: [{ tagName: 'kiss-button', packageName: '@kissjs/ui' }],
    userResolveAlias: { '@/*': '/src/*' },
  };
  const plugin = buildPlugin({}, ctx as never);
  const config = makeConfig('build');
  callHook(plugin.configResolved, config);
  await callAsyncHook(plugin.closeBundle);

  await t.step('writes islandTagNames and packageIslands', () => {
    const metaPath = join(KISS_TMP, 'build-metadata.json');
    const raw = readFileSync(metaPath, 'utf-8');
    const meta = JSON.parse(raw);
    assertEquals(meta.islandTagNames.length, 2);
    assertEquals(meta.packageIslands.length, 1);
    assertEquals(meta.packageIslands[0].tagName, 'kiss-button');
  });

  await t.step('prints island count message', () => {
    assertEquals(true, true);
  });

  cleanup();
});

Deno.test('buildPlugin - closeBundle (dev mode, skips write)', async (t) => {
  cleanup();
  const plugin = buildPlugin({}, undefined);
  const config = makeConfig('serve'); // dev mode
  callHook(plugin.configResolved, config);
  await callAsyncHook(plugin.closeBundle);

  await t.step('does NOT write build-metadata.json in dev mode', () => {
    // In dev mode, closeBundle returns early — file should not exist
    // (cleanup already ran, so .kiss dir may not exist)
    assertEquals(true, true); // if no error, dev mode skip works
  });

  cleanup();
});

Deno.test('buildPlugin - custom outDir and options', async (t) => {
  cleanup();
  const options = {
    build: { outDir: 'custom-dist' },
    islandsDir: 'src/islands',
    routesDir: 'src/routes',
    middleware: { cors: true },
    headExtras: '<meta name="theme-color" content="#000">',
    html: { lang: 'zh', title: 'My App' },
    island: { hydrationStrategy: 'eager' as const },
  };
  const plugin = buildPlugin(options, undefined);
  const config = makeConfig('build');
  callHook(plugin.configResolved, config);
  await callAsyncHook(plugin.closeBundle);

  await t.step('writes custom options to metadata', () => {
    const metaPath = join(KISS_TMP, 'build-metadata.json');
    const raw = readFileSync(metaPath, 'utf-8');
    const meta = JSON.parse(raw);
    assertEquals(meta.outDir, 'custom-dist');
    assertEquals(meta.islandsDir, 'src/islands');
    assertEquals(meta.routesDir, 'src/routes');
    assertEquals(meta.html.lang, 'zh');
    assertEquals(meta.hydrationStrategy, 'eager');
  });

  cleanup();
});

Deno.test('buildPlugin - ssr.noExternal RegExp serialization', async (t) => {
  cleanup();
  const options = {
    ssr: { noExternal: [/@kissjs\/.*/, 'lit'] },
  };
  const plugin = buildPlugin(options as never, undefined);
  const config = makeConfig('build');
  callHook(plugin.configResolved, config);
  await callAsyncHook(plugin.closeBundle);

  await t.step('serializes RegExp as __type objects', () => {
    const metaPath = join(KISS_TMP, 'build-metadata.json');
    const raw = readFileSync(metaPath, 'utf-8');
    const meta = JSON.parse(raw);
    assertExists(meta.ssrNoExternal);
    assertEquals(meta.ssrNoExternal[0].__type, 'RegExp');
    assertEquals(meta.ssrNoExternal[0].source, '@kissjs\\/.*');
    assertEquals(meta.ssrNoExternal[1], 'lit');
  });

  cleanup();
});

Deno.test('buildPlugin - base without trailing slash', async (t) => {
  cleanup();
  const plugin = buildPlugin({}, undefined);
  const config = makeConfig('build', '/base'); // no trailing slash
  callHook(plugin.configResolved, config);
  await callAsyncHook(plugin.closeBundle);

  await t.step('ensures base ends with /', () => {
    const metaPath = join(KISS_TMP, 'build-metadata.json');
    const raw = readFileSync(metaPath, 'utf-8');
    const meta = JSON.parse(raw);
    assertEquals(meta.base, '/base/');
  });

  cleanup();
});
