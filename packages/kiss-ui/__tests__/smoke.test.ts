/**
 * @kissjs/ui — Smoke tests
 *
 * Minimal tests to verify components can be imported and registered.
 * CI should never use continue-on-error — if tests fail, the build fails.
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';

Deno.test('kiss-ui — index exports islands array', async () => {
  const mod = await import('../src/index.ts');
  assertExists(mod.islands, 'islands export should exist');
  assertEquals(Array.isArray(mod.islands), true);
  assertEquals(mod.islands.length, 3);
  assertEquals(mod.islands[0].tagName, 'kiss-theme-toggle');
  assertEquals(mod.islands[0].strategy, 'eager');
  assertEquals(mod.islands[1].tagName, 'kiss-button');
  assertEquals(mod.islands[2].tagName, 'kiss-layout');
});

Deno.test('kiss-ui — kiss-theme-toggle exports tagName', async () => {
  const mod = await import('../src/kiss-theme-toggle.ts');
  assertEquals(mod.tagName, 'kiss-theme-toggle');
  assertExists(mod.KissThemeToggle, 'KissThemeToggle class should be exported');
});

Deno.test('kiss-ui — design-tokens exports kissDesignTokens', async () => {
  const mod = await import('../src/design-tokens.ts');
  assertExists(mod.kissDesignTokens, 'kissDesignTokens should be exported');
});

Deno.test('kiss-ui — all components export tagName', async () => {
  const components = [
    'kiss-button',
    'kiss-card',
    'kiss-input',
    'kiss-code-block',
    'kiss-layout',
  ];
  for (const name of components) {
    const mod = await import(`../src/${name}.ts`);
    assertExists(mod.tagName, `${name} should export tagName`);
  }
});
