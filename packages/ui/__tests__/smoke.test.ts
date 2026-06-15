/**
 * @openelement/ui - Smoke tests
 *
 * Minimal tests to verify components can be imported and registered.
 * CI should never use continue-on-error - if tests fail, the build fails.
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';

Deno.test('open-ui - index exports manifest (WC Package Protocol)', async () => {
  const mod = await import('../src/index.ts');
  assertExists(mod.manifest, 'manifest export should exist');
  assertEquals(typeof mod.manifest, 'object');
  assertEquals(mod.manifest.packageName, '@openelement/ui');
  assertEquals(mod.manifest.declarations.length, 13);
  assertEquals(mod.manifest.declarations[0].tagName, 'open-card');
  assertEquals(mod.manifest.declarations[1].tagName, 'open-callout');
  assertEquals(mod.manifest.declarations[2].tagName, 'open-step-card');
  assertEquals(mod.manifest.declarations[3].tagName, 'open-button');
  assertEquals(mod.manifest.declarations[4].tagName, 'open-input');
  assertEquals(mod.manifest.declarations[5].tagName, 'open-theme-toggle');
  assertEquals(mod.manifest.declarations[6].tagName, 'open-code-block');
  assertEquals(mod.manifest.declarations[7].tagName, 'open-dialog');
  assertEquals(mod.manifest.declarations[8].tagName, 'open-layout');
  assertEquals(mod.manifest.declarations[9].tagName, 'open-dropdown');
  assertEquals(mod.manifest.declarations[10].tagName, 'open-modal');
  assertEquals(mod.manifest.declarations[11].tagName, 'open-tabs');
  assertEquals(mod.manifest.declarations[12].tagName, 'open-hero-ping');
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
    'open-hero-ping',
    'open-input',
    'open-layout',
    'open-modal',
    'open-step-card',
    'open-tabs',
    'open-theme-toggle',
  ];
  for (const name of components) {
    const mod = await import(`../src/${name}.tsx`);
    assertExists(mod.tagName, `${name} should export tagName`);
  }
});
