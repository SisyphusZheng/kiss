/**
 * @openelement/ui - Smoke tests
 *
 * Minimal tests to verify components can be imported and registered.
 * CI should never use continue-on-error - if tests fail, the build fails.
 */
import { assertEquals, assertExists } from '@std/assert';

Deno.test('open-ui - index exports manifest (WC Package Protocol)', async () => {
  const mod = await import('../src/index.ts');
  const expectedTags = [
    'open-card',
    'open-callout',
    'open-button',
    'open-input',
    'open-theme-toggle',
    'open-code-block',
    'open-badge',
    'open-dialog',
    'open-dropdown',
    'open-tabs',
  ];
  assertExists(mod.manifest, 'manifest export should exist');
  assertEquals(typeof mod.manifest, 'object');
  assertEquals(mod.manifest.packageName, '@openelement/ui');
  assertEquals(mod.manifest.declarations.map((decl) => decl.tagName), expectedTags);
});

Deno.test('open-ui - explicit registration is complete and idempotent', async () => {
  const { registerOpenUi } = await import('../src/index.ts');
  const definitions = new Map<string, CustomElementConstructor>();
  const registry = {
    get: (name: string) => definitions.get(name),
    define: (name: string, ctor: CustomElementConstructor) => definitions.set(name, ctor),
  } as unknown as CustomElementRegistry;

  registerOpenUi(registry);
  registerOpenUi(registry);
  assertEquals(definitions.size, 10);
});

Deno.test('open-ui - open-theme-toggle exports tagName', async () => {
  const mod = await import('../src/open-theme-toggle.tsx');
  assertEquals(mod.tagName, 'open-theme-toggle');
  assertExists(mod.OpenThemeToggle, 'OpenThemeToggle class should be exported');
});

Deno.test('open-ui - open-props-tokens exports openPropsTokenSheet', async () => {
  const mod = await import('../src/open-props-tokens.ts');
  assertExists(mod.openPropsTokenSheet, 'openPropsTokenSheet should be exported');
});

Deno.test('open-ui - all components export tagName', async () => {
  const components = [
    'open-button',
    'open-callout',
    'open-card',
    'open-code-block',
    'open-dialog',
    'open-dropdown',
    'open-badge',
    'open-input',
    'open-tabs',
    'open-theme-toggle',
  ];
  for (const name of components) {
    const mod = await import(`../src/${name}.tsx`);
    assertExists(mod.tagName, `${name} should export tagName`);
  }
});
