/**
 * @kissjs/core - island-transform.ts tests (Deno)
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { islandTransformPlugin } from '../src/island-transform.ts';
import { generateClientEntry } from '../src/entry-generators.ts';

type TransformFn = (code: string, id: string) => string | null;

Deno.test('island-transform - islandTransformPlugin', async (t) => {
  const plugin = islandTransformPlugin('app/islands');

  await t.step('returns a Vite plugin', () => {
    assertEquals(plugin.name, 'kiss:island-transform');
    assertEquals(typeof plugin.transform, 'function');
  });

  await t.step('injects __island marker and __tagName for island files', () => {
    const transform = plugin.transform as unknown as TransformFn;
    const result = transform(
      'export default class MyCounter extends LitElement {}',
      '/project/app/islands/my-counter.ts',
    );
    assertEquals(result!.includes('export const __island = true'), true);
    assertEquals(result!.includes("export const __tagName = 'my-counter'"), true);
  });

  await t.step('does NOT inject CJS-style registration code', () => {
    const transform = plugin.transform as unknown as TransformFn;
    const result = transform(
      'export default class MyCounter extends LitElement {}',
      '/project/app/islands/my-counter.ts',
    );
    // Should NOT contain the old CJS patterns
    assertEquals(result!.includes('exports.default'), false);
    assertEquals(result!.includes('module.exports'), false);
  });

  await t.step('skips non-island files', () => {
    const transform = plugin.transform as unknown as TransformFn;
    const result = transform(
      'export default class Header extends LitElement {}',
      '/project/app/components/header.ts',
    );
    assertEquals(result, null);
  });

  await t.step('warns for tag names without hyphen', () => {
    const transform = plugin.transform as unknown as TransformFn;
    // When called with proper context, it returns null for no-hyphen names
    const result = transform.call(
      { warn: () => {} },
      'export default class Counter extends LitElement {}',
      '/project/app/islands/counter.ts',
    );
    assertEquals(result, null);
  });
});

Deno.test('entry-generators - generateClientEntry (v0.3.0 hydration)', async (t) => {
  await t.step('imports lit-element-hydrate-support from @lit-labs/ssr-client', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'lazy');
    assertEquals(code.includes("import '@lit-labs/ssr-client/lit-element-hydrate-support.js'"), true);
  });

  await t.step('registers custom elements', () => {
    const islands = [
      { tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' },
      { tagName: 'theme-toggle', modulePath: '@kissjs/ui/kiss-theme-toggle' },
    ];
    const code = generateClientEntry(islands, 'lazy');
    assertEquals(code.includes("customElements.define('my-counter'"), true);
    assertEquals(code.includes("customElements.define('theme-toggle'"), true);
  });

  await t.step('waits for customElements.whenDefined before hydrating', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'lazy');
    assertEquals(code.includes('customElements.whenDefined'), true);
    assertEquals(code.includes('Promise.all'), true);
  });

  await t.step('removes defer-hydration to trigger LitElement hydration', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'eager');
    assertEquals(code.includes('[defer-hydration]'), true);
    assertEquals(code.includes("removeAttribute('defer-hydration')"), true);
    // We do NOT call hydrate(el) directly — lit-element-hydrate-support handles it
    assertEquals(code.includes('hydrate(el)'), false);
  });

  await t.step('supports eager strategy', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'eager');
    assertEquals(code.includes('hydrate all islands immediately'), true);
  });

  await t.step('supports lazy strategy', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'lazy');
    assertEquals(code.includes('requestIdleCallback'), true);
  });

  await t.step('supports visible strategy', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'visible');
    assertEquals(code.includes('IntersectionObserver'), true);
  });

  await t.step('supports idle strategy', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'idle');
    assertEquals(code.includes('requestIdleCallback'), true);
  });

  await t.step('returns no-client-JS comment for empty islands', () => {
    const code = generateClientEntry([]);
    assertEquals(code.includes('No islands detected'), true);
    assertEquals(code.includes('hydrate'), false);
  });
});
