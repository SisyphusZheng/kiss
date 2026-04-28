/**
 * @kissjs/core - build / entry-generators tests (Deno)
 *
 * v0.3.0: generateClientEntry now takes ClientIslandEntry[] + strategy.
 * It includes Lit hydration logic (hydrate from @lit-labs/ssr-client).
 */
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { generateClientEntry } from '../src/entry-generators.ts';

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

  await t.step('imports lit-element-hydrate-support from @lit-labs/ssr-client', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'lazy');
    assertStringIncludes(code, '@lit-labs/ssr-client/lit-element-hydrate-support.js');
  });

  await t.step('waits for whenDefined before hydrating', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }];
    const code = generateClientEntry(islands, 'lazy');
    assertStringIncludes(code, 'customElements.whenDefined');
    assertStringIncludes(code, 'Promise.all');
  });
});
