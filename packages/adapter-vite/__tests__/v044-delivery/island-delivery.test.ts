import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { buildCriticalHeadExtras } from '../../src/internal/ssg/critical-assets.ts';
import { createCompiledElementSourceMap } from '../../src/internal/compiler/plugin.ts';
import { generateClientEntry } from '../../src/internal/ssg/entry-client-codegen.ts';
import { readIslandConfig } from '../../src/internal/ssg/island-scanner.ts';
import { buildSsrAdmissionPlan } from '../../src/internal/ssg/entry-descriptor.ts';

Deno.test('v0.44 island delivery emits one scheduler for multi-element media islands', () => {
  const entries = [
    {
      tagName: 'oe-clock',
      modulePath: './clock.ts',
      strategy: 'media',
      media: '(prefers-reduced-motion: no-preference)',
    },
    {
      tagName: 'oe-calendar',
      modulePath: './calendar.ts',
      strategy: 'media',
      media: '(prefers-reduced-motion: no-preference)',
    },
  ] as unknown as Parameters<typeof generateClientEntry>[0];

  const code = generateClientEntry(entries);

  assertEquals((code.match(/createIslandScheduler/g) ?? []).length, 1);
  assertStringIncludes(code, "media: ['oe-clock', 'oe-calendar']");
  assertStringIncludes(code, "matchMedia('(prefers-reduced-motion: no-preference)')");
  assertStringIncludes(code, 'oe-clock');
  assertStringIncludes(code, 'oe-calendar');
});

Deno.test('v0.44 one capability module registers many native element constructors once', () => {
  const code = generateClientEntry([{
    tagName: 'oe-clock',
    tags: ['oe-clock', 'oe-calendar'],
    modulePath: './clock.ts',
    strategy: 'load',
    exportNames: { 'oe-clock': 'Clock', 'oe-calendar': 'Calendar' },
  }]);

  assertEquals((code.match(/import\(["']\.\/clock\.ts["']\)/g) ?? []).length, 1);
  assertStringIncludes(code, 'mod["Clock"]');
  assertStringIncludes(code, 'mod["Calendar"]');
  assertStringIncludes(code, 'customElements.define("oe-clock"');
  assertStringIncludes(code, 'customElements.define("oe-calendar"');
  assertEquals((code.match(/createIslandScheduler/g) ?? []).length, 1);
});

Deno.test('v0.44 island metadata remains static and carries delivery aliases', () => {
  const meta = readIslandConfig(`
    export const openElement = defineIslandConfig({
      hydrate: 'media',
      media: '(min-width: 40rem)',
      tags: ['oe-clock', 'oe-calendar'],
      exportNames: { 'oe-clock': 'Clock', 'oe-calendar': 'Calendar' },
    });
  `);
  assertEquals(meta, {
    hydrate: 'media',
    media: '(min-width: 40rem)',
    tags: ['oe-clock', 'oe-calendar'],
    exportNames: { 'oe-clock': 'Clock', 'oe-calendar': 'Calendar' },
  });

  assertThrows(
    () =>
      readIslandConfig(
        'export const openElement = defineIslandConfig({ tags: dynamicTags });',
      ),
    Error,
    'openElement.tags must be an array of string literals',
  );
});

Deno.test('v0.44 SSR admission expands one capability declaration per delivered tag', () => {
  const plan = buildSsrAdmissionPlan([
    {
      tagName: 'oe-clock',
      modulePath: './clock.ts',
      source: 'local',
      tags: ['oe-clock', 'oe-calendar'],
    } as unknown as Parameters<typeof buildSsrAdmissionPlan>[0][number],
  ]);

  assertEquals(plan.renderableTags, ['oe-clock', 'oe-calendar']);
  assertEquals(plan.clientOnlyTags, []);
  assertEquals(plan.decisions.map((decision) => decision.tagName), ['oe-clock', 'oe-calendar']);
});

Deno.test('v0.44 compiler source records pass through the Vite source map', () => {
  const records = {
    version: 1,
    file: '/src/clock.tsx',
    records: [{
      id: 'root',
      kind: 'root',
      source: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 1, line: 1, column: 2 } },
    }],
  };
  const map = createCompiledElementSourceMap(
    'const source = true;',
    'const generated = true;',
    '/src/clock.tsx',
    { sourceMap: records },
  );
  assertEquals(map.x_openElement, records);
});

Deno.test('v0.44 critical assets serialize deterministic head resources and reject unsafe blocking URLs', () => {
  const result = buildCriticalHeadExtras({
    criticalAssets: {
      fonts: [{ href: '/font.woff2', type: 'font/woff2' }],
      styles: [{ css: '/* comment */ .card { color: red; }' }],
      inlineScripts: ['window.__ready = true;'],
    },
  });
  assertStringIncludes(result.headExtras!, '<link rel="preload" as="font"');
  assertStringIncludes(result.headExtras!, '<style>.card{color:red;}</style>');
  assertStringIncludes(result.headExtras!, '<script>window.__ready = true;</script>');
  assertEquals(result.allowHeadExtrasScripts, true);

  assertThrows(
    () =>
      buildCriticalHeadExtras({
        criticalAssets: { styles: [{ href: 'https://cdn.example.test/app.css' }] },
      }),
    Error,
    'cross-origin render-blocking stylesheet',
  );
});
