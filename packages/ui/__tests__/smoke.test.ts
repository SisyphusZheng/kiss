/**
 * @openelement/ui - Smoke tests
 *
 * Minimal tests to verify components can be imported and registered.
 * CI should never use continue-on-error - if tests fail, the build fails.
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';

Deno.test('open-ui - index exports manifest (WC Package Protocol)', async () => {
  const mod = await import('../src/index.ts');
  const expectedTags = [
    'open-card',
    'open-callout',
    'open-step-card',
    'open-button',
    'open-input',
    'open-theme-toggle',
    'open-code-block',
    'open-badge',
    'open-brand-mark',
    'open-lab-panel',
    'open-standards-visual',
    'open-lab-stage',
    'open-dialog',
    'open-layout',
    'open-dropdown',
    'open-modal',
    'open-tabs',
    'open-hero-ping',
    'open-button-linear',
    'open-card-linear',
    'open-input-linear',
    'open-nav-linear',
    'open-badge-linear',
  ];
  assertExists(mod.manifest, 'manifest export should exist');
  assertEquals(typeof mod.manifest, 'object');
  assertEquals(mod.manifest.packageName, '@openelement/ui');
  assertEquals(mod.manifest.declarations.map((decl) => decl.tagName), expectedTags);
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
    'open-brand-mark',
    'open-lab-panel',
    'open-lab-stage',
    'open-standards-visual',
    'open-hero-ping',
    'open-input',
    'open-layout',
    'open-modal',
    'open-step-card',
    'open-tabs',
    'open-theme-toggle',
    'open-button-linear',
    'open-card-linear',
    'open-input-linear',
    'open-nav-linear',
    'open-badge-linear',
  ];
  for (const name of components) {
    const mod = await import(`../src/${name}.tsx`);
    assertExists(mod.tagName, `${name} should export tagName`);
  }
});

Deno.test('open-ui - linear components export class and tagName', async () => {
  const button = await import('../src/open-button-linear.tsx');
  assertEquals(button.tagName, 'open-button-linear');
  assertExists(button.OpenButtonLinear, 'OpenButtonLinear class should be exported');

  const card = await import('../src/open-card-linear.tsx');
  assertEquals(card.tagName, 'open-card-linear');
  assertExists(card.OpenCardLinear, 'OpenCardLinear class should be exported');

  const input = await import('../src/open-input-linear.tsx');
  assertEquals(input.tagName, 'open-input-linear');
  assertExists(input.OpenInputLinear, 'OpenInputLinear class should be exported');

  const nav = await import('../src/open-nav-linear.tsx');
  assertEquals(nav.tagName, 'open-nav-linear');
  assertExists(nav.OpenNavLinear, 'OpenNavLinear class should be exported');

  const badge = await import('../src/open-badge-linear.tsx');
  assertEquals(badge.tagName, 'open-badge-linear');
  assertExists(badge.OpenBadgeLinear, 'OpenBadgeLinear class should be exported');
});
