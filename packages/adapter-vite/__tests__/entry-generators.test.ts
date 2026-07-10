import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { generateClientEntry, validateClientIslandEntry } from '@openelement/ssg';

const REJECTED_ISLAND_MODULE_PATHS = [
  'https://example.com/island.js',
  'data:text/javascript,alert(1)',
  'javascript:alert(1)',
  '../outside.ts',
  './nested/../../outside.ts',
  './bad path.ts',
  './bad\npath.ts',
  './bad\\path.ts',
  './bad%0a.ts',
  './bad<path.ts',
  './bad\u2028path.ts',
  '',
] as const;

Deno.test('empty -> zero JS', () => {
  assert(generateClientEntry([]).includes('zero client JS needed'));
});

Deno.test('client:load island loads immediately', () => {
  const code = generateClientEntry([
    {
      tagName: 'open-theme-toggle',
      modulePath: '@openelement/ui/open-theme-toggle',
      strategy: 'load',
    },
  ]);
  assert(code.includes('import("@openelement/ui/open-theme-toggle")'));
  assert(code.includes('client:load islands'));
  try {
    new Function(code);
  } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('client:idle island deferred to idle', () => {
  const code = generateClientEntry([
    { tagName: 'open-hero-ping', modulePath: './ping.ts', strategy: 'idle' },
  ]);
  assert(code.includes('requestIdleCallback'));
  assert(code.includes('import("./ping.ts")'));
  try {
    new Function(code);
  } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('mixed load+idle', () => {
  const code = generateClientEntry([
    {
      tagName: 'open-theme-toggle',
      modulePath: '@openelement/ui/open-theme-toggle',
      strategy: 'load',
    },
    { tagName: 'open-hero-ping', modulePath: '@openelement/ui/open-hero-ping', strategy: 'idle' },
  ]);
  assert(code.includes('requestIdleCallback'));
  assert(code.includes('open:ready'));
  try {
    new Function(code);
  } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('no legacy SSR client runtime', () => {
  const code = generateClientEntry([
    { tagName: 'my-counter', modulePath: './counter.ts', strategy: 'idle' },
  ]);
  assertEquals(code.includes('LitElement'), false);
  assertEquals(code.includes('lit-element-hydrate-support'), false);
});

Deno.test('open:ready event', () => {
  const code = generateClientEntry([
    { tagName: 'my-island', modulePath: './island.ts', strategy: 'idle' },
  ]);
  assert(code.includes('open:ready'));
  try {
    new Function(code);
  } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('client:only islands are scheduled with immediate load (not idle)', () => {
  const code = generateClientEntry([
    {
      tagName: 'client-only-widget',
      modulePath: './client-only-widget.ts',
      strategy: 'only',
      ssr: false,
      dsd: false,
    },
  ]);

  assert(code.includes('client:only islands - import immediately'));
  assert(code.includes('"client-only-widget"'));
  // v0.21: only uses immediate load, NOT idle deferral
  assertEquals(code.includes('client:idle and client:only'), false);
  new Function(code);
});

Deno.test('legacy eager/lazy strategies are not emitted by v0.21 runtime', () => {
  const code = generateClientEntry([
    { tagName: 'x-load', modulePath: './load.ts', strategy: 'load' },
    { tagName: 'x-idle', modulePath: './idle.ts', strategy: 'idle' },
  ]);

  assertEquals(code.includes('eager'), false);
  assertEquals(code.includes('lazy'), false);
});

// Section

Deno.test('package island strategy:load is preserved in client entry', () => {
  // Bug: buildClient used to drop strategy from packageIslands, so
  // open-theme-toggle (strategy: 'load') must stay in the immediate bucket.
  // Fix: strategy is now passed through from metadata.
  const code = generateClientEntry([
    {
      tagName: 'open-theme-toggle',
      modulePath: '@openelement/ui/open-theme-toggle',
      strategy: 'load',
      isPackage: true,
    },
    {
      tagName: 'open-button',
      modulePath: '@openelement/ui/open-button',
      strategy: 'idle',
      isPackage: true,
    },
  ]);

  // Load island must appear in the immediate-load array
  assert(code.includes('"open-theme-toggle"'));
  // Both must appear in the island map
  assert(code.includes('import("@openelement/ui/open-theme-toggle")'));
  assert(code.includes('import("@openelement/ui/open-button")'));
});

Deno.test('client entry safely escapes tag names and module paths', () => {
  const code = generateClientEntry([
    {
      tagName: 'x-safe',
      modulePath: './safe-module.ts',
      strategy: 'load',
    },
  ]);

  assert(code.includes('"x-safe": () => import("./safe-module.ts")'));
  new Function(code);
});

Deno.test('client entry admits only validated module specifiers before code generation', () => {
  const admitted = validateClientIslandEntry({
    tagName: 'x-safe',
    modulePath: '@openelement/ui/open-button',
    strategy: 'load',
  });

  assertEquals(admitted.modulePath, '@openelement/ui/open-button');
  assertEquals(admitted.tagName, 'x-safe');

  for (const modulePath of REJECTED_ISLAND_MODULE_PATHS) {
    assertThrows(
      () =>
        validateClientIslandEntry({
          tagName: 'x-safe',
          modulePath,
          strategy: 'load',
        }),
      Error,
      'Invalid island modulePath',
    );
  }
});

Deno.test('client entry rejects malicious package island metadata', () => {
  assertThrows(
    () =>
      generateClientEntry([
        {
          tagName: "x-bad');alert(1);//",
          modulePath: './safe.ts',
          strategy: 'idle',
        },
      ]),
    Error,
    'Invalid island tagName',
  );

  assertThrows(
    () =>
      generateClientEntry([
        {
          tagName: 'x-safe',
          modulePath: 'javascript:alert(1)',
          strategy: 'idle',
        },
      ]),
    Error,
    'Invalid island modulePath',
  );

  for (const modulePath of REJECTED_ISLAND_MODULE_PATHS) {
    assertThrows(
      () =>
        generateClientEntry([
          {
            tagName: 'x-safe',
            modulePath,
            strategy: 'idle',
          },
        ]),
      Error,
      'Invalid island modulePath',
    );
  }
});

Deno.test('client entry rejects legacy eager/lazy strategy values', () => {
  assertThrows(
    () =>
      generateClientEntry([
        {
          tagName: 'x-old',
          modulePath: './old.ts',
          strategy: 'eager',
        } as never,
      ]),
    Error,
    'Invalid island strategy',
  );
});
