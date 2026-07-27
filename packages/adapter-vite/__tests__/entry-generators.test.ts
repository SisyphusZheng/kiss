import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { generateClientEntry, validateClientIslandEntry } from '../src/internal/ssg/index.ts';

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

Deno.test('zero islands + enhancedForms emits the enhancement layer (#569)', () => {
  const code = generateClientEntry([], { enhancedForms: true });
  assert(!code.includes('zero client JS needed'));
  assert(code.includes('data-open-enhance'), 'enhancement submit handler is emitted');
  assert(code.includes('__onSubmit'), 'submit interception is emitted');
  assert(code.includes('__morphDocument'), 'document morph is emitted');
});

Deno.test('zero islands without enhancedForms keeps the stub (#569)', () => {
  assert(generateClientEntry([], { enhancedForms: false }).includes('zero client JS needed'));
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

Deno.test('client entry includes the ADR-0120 form enhancement layer', () => {
  const code = generateClientEntry(
    [{ tagName: 'x-counter', modulePath: './counter.ts', strategy: 'load' }],
    { enhancedForms: true },
  );
  // ADR-0121: submit is not reliably composed across engines, so listeners
  // attach per shadow root, not only on the document.
  assert(code.includes('__attachSubmit'));
  assert(code.includes('__scanSubmitRoots'));
  assert(code.includes('data-open-enhance'));
  assert(code.includes("'x-openelement-action': 'enhance'"));
  // Morph continuity: preserve escape hatch, intact-island survival and the
  // no-re-execute rule for the client entry script.
  assert(code.includes('data-open-preserve'));
  assert(code.includes('__islandIntact'));
  assert(code.includes("oldEl.tagName === 'SCRIPT'"));
  assert(code.includes('history.pushState'));
  // ADR-0121 hardening: shadow-content morph, region scoping, failure hook,
  // submitter-preserving body, popstate reload, response gating.
  assert(code.includes('__shadowTemplate'));
  assert(code.includes('data-open-region-target'));
  assert(code.includes('open:action-failure'));
  assert(code.includes('new FormData(form, submitter)'));
  assert(code.includes("window.addEventListener('popstate'"));
  assert(code.includes('result.status === 200 || result.status === 422'));
});

Deno.test('islands without enhancedForms omit the enhancement layer (#569 complement)', () => {
  // Static sites with islands but no data-open-enhance forms keep a lean
  // client bundle (ADR-0120 zero-upgrade-cost consequence) and, critically,
  // no popstate listener that could interfere with their own routing JS.
  const code = generateClientEntry([
    { tagName: 'x-counter', modulePath: './counter.ts', strategy: 'load' },
  ]);
  assert(code.includes('live-counter') === false); // sanity: only x-counter
  assert(!code.includes('__attachSubmit'));
  assert(!code.includes("window.addEventListener('popstate'"));
  assert(code.includes('the form enhancement layer is omitted'));
});
