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

  await t.step('errors for tag names with unsafe characters', () => {
    const transform = plugin.transform as unknown as TransformFn;
    let errorThrown = false;
    const mockContext = {
      error: (msg: string) => {
        errorThrown = true;
        // In Vite, this.error() throws — simulate by throwing
        throw new Error(msg);
      },
      warn: () => {},
    };
    try {
      // "UPPER.ts" → fileToTagName gives "UPPER" (no hyphen, but has uppercase)
      // Wait — no hyphen triggers warn first. Use "my-mod.ts" → "my.mod" (has dot)
      // Actually: "my-mod.ts" → fileToTagName strips .ts → "my-mod" which IS safe.
      // Let's use a filename that has a hyphen AND unsafe chars:
      // "my-MOD.ts" → "my-MOD" — has hyphen AND uppercase, triggers error()
      transform.call(
        mockContext,
        'export default class MyMod extends LitElement {}',
        '/project/app/islands/my-MOD.ts',
      );
    } catch (e) {
      // Expected: this.error() throws for uppercase chars
      assertEquals((e as Error).message.includes('unsafe characters'), true);
    }
    assertEquals(errorThrown, true, 'this.error() should have been called');
  });

  await t.step('handles Windows-style paths', () => {
    const winPlugin = islandTransformPlugin('app\\islands');
    const transform = winPlugin.transform as unknown as TransformFn;
    const result = transform(
      'export default class MyCounter extends LitElement {}',
      'C:\\project\\app\\islands\\my-counter.ts',
    );
    assertEquals(result!.includes('export const __island = true'), true);
  });
});

Deno.test('entry-generators - generateClientEntry (v0.3.0 hydration)', async (t) => {
  await t.step('imports lit-element-hydrate-support as side effect', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'lazy');
    // v0.3.1: side-effect import only (no manual litElementHydrateSupport() call)
    assertEquals(
      code.includes("import '@lit-labs/ssr-client/lit-element-hydrate-support.js'"),
      true,
    );
  });

  await t.step('registers custom elements via dynamic import', () => {
    const islands = [
      { tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' },
      { tagName: 'theme-toggle', modulePath: '@kissjs/ui/kiss-theme-toggle', isPackage: true },
    ];
    const code = generateClientEntry(islands, 'lazy');
    // All islands (local + package) use dynamic import() — they self-register
    assertEquals(code.includes("import('/app/islands/my-counter.ts')"), true);
    assertEquals(code.includes("import('@kissjs/ui/kiss-theme-toggle')"), true);
    // No explicit customElements.define() in generated entry
    assertEquals(code.includes("customElements.define('my-counter'"), false);
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
    // Must recursively find elements in Shadow DOM (querySelectorAll doesn't pierce)
    assertEquals(code.includes('shadowRoot'), true);
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
