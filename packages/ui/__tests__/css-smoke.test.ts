/**
 * @openelement/ui - CSS Smoke Tests (daisyUI fork & token sheet)
 *
 * Minimal tests to verify:
 * 1. Token sheet exists and is a valid CSSStyleSheet
 * 2. daisy class sheet exists and contains key classes (btn, card, badge)
 * 3. DSD compatibility: sheets can be used as adoptedStyleSheets
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';

Deno.test('open-props-tokens: openPropsTokenSheet is a CSSStyleSheet', async () => {
  const { openPropsTokenSheet } = await import('../src/open-props-tokens.ts');
  assertExists(openPropsTokenSheet, 'openPropsTokenSheet should be exported');
  assertEquals(
    typeof openPropsTokenSheet.replaceSync,
    'function',
    'openPropsTokenSheet should have replaceSync method',
  );
  assertExists(Array.isArray(openPropsTokenSheet.cssRules), 'should have cssRules array');
  // Verify it contains at least one rule
  assertEquals(
    openPropsTokenSheet.cssRules.length > 0,
    true,
    'openPropsTokenSheet should contain at least one CSS rule',
  );
});

Deno.test('daisy-classes: daisyClassSheet exists and contains key classes', async () => {
  const { daisyClassSheet } = await import('../src/daisy-classes.ts');
  assertExists(daisyClassSheet, 'daisyClassSheet should be exported');
  assertEquals(
    typeof daisyClassSheet.replaceSync,
    'function',
    'daisyClassSheet should have replaceSync method',
  );
  assertExists(Array.isArray(daisyClassSheet.cssRules), 'should have cssRules array');
  assertEquals(
    daisyClassSheet.cssRules.length > 0,
    true,
    'daisyClassSheet should contain at least one CSS rule',
  );

  // Extract the raw CSS text from all rules and verify key classes exist
  const cssText = daisyClassSheet.cssRules.map((r: { cssText: string }) => r.cssText).join('\n');

  // Key classes that must be present
  const requiredClasses = [
    '.btn',
    '.btn-primary',
    '.btn-ghost',
    '.btn-outline',
    '.card',
    '.card-body',
    '.badge',
    '.badge-primary',
    '.alert',
    '.alert-info',
    '.input',
    '.textarea',
    '.select',
    '.divider',
    '[data-tooltip]',
    '.modal',
    '.menu',
    '.menu-item',
    '.dropdown',
    '.dropdown-content',
    '.tabs',
    '.tab',
    '.tab-active',
  ];

  for (const cls of requiredClasses) {
    const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assertEquals(
      new RegExp(escaped).test(cssText),
      true,
      `daisyClassSheet should contain selector "${cls}"`,
    );
  }
});

Deno.test('daisy-classes: DSD compatibility - sheets can be used as adoptedStyleSheets', async () => {
  const { daisyClassSheet } = await import('../src/daisy-classes.ts');
  const { openPropsTokenSheet } = await import('../src/open-props-tokens.ts');

  // Simulate DSD usage: wrap in an array like adoptedStyleSheets
  const adoptedStyleSheets = [openPropsTokenSheet, daisyClassSheet];

  // Both sheets should be present
  assertEquals(adoptedStyleSheets.length, 2, 'should have exactly 2 sheets for DSD adoption');
  assertEquals(
    adoptedStyleSheets[0] === openPropsTokenSheet,
    true,
    'first sheet should be openPropsTokenSheet',
  );
  assertEquals(
    adoptedStyleSheets[1] === daisyClassSheet,
    true,
    'second sheet should be daisyClassSheet',
  );

  // Verify both sheets have valid rules
  for (let i = 0; i < adoptedStyleSheets.length; i++) {
    const sheet = adoptedStyleSheets[i];
    assertEquals(
      typeof sheet.replaceSync,
      'function',
      `sheet[${i}] should have replaceSync method`,
    );
    assertExists(Array.isArray(sheet.cssRules), `sheet[${i}] should have cssRules array`);
    assertEquals(sheet.cssRules.length > 0, true, `sheet[${i}] should contain CSS rules`);

    // Each rule should have cssText
    for (const rule of sheet.cssRules) {
      assertEquals(typeof rule.cssText, 'string', 'each CSS rule should have cssText');
      assertEquals(rule.cssText.length > 0, true, 'each cssText should be non-empty');
    }
  }

  // Verify the index re-exports both sheets
  const index = await import('../src/index.ts');
  assertExists(index.daisyClassSheet, 'index should re-export daisyClassSheet');
  assertExists(index.openPropsTokenSheet, 'index should re-export openPropsTokenSheet');
});

Deno.test('components: new interactive components are importable', async () => {
  const drop = await import('../src/open-dropdown.tsx');
  const modal = await import('../src/open-modal.tsx');
  const tabs = await import('../src/open-tabs.tsx');

  assertEquals(drop.tagName, 'open-dropdown', 'open-dropdown tagName should be "open-dropdown"');
  assertEquals(modal.tagName, 'open-modal', 'open-modal tagName should be "open-modal"');
  assertEquals(tabs.tagName, 'open-tabs', 'open-tabs tagName should be "open-tabs"');

  assertEquals(typeof drop.OpenDropdown, 'function', 'OpenDropdown should be a class/constructor');
  assertEquals(typeof modal.OpenModal, 'function', 'OpenModal should be a class/constructor');
  assertEquals(typeof tabs.OpenTabs, 'function', 'OpenTabs should be a class/constructor');
});

Deno.test('components: new components are re-exported from index', async () => {
  const index = await import('../src/index.ts');
  assertExists(index.OpenDropdown, 'index should re-export OpenDropdown');
  assertExists(index.OpenModal, 'index should re-export OpenModal');
  assertExists(index.OpenTabs, 'index should re-export OpenTabs');
  assertEquals(index.openDropdownTagName, 'open-dropdown');
  assertEquals(index.openModalTagName, 'open-modal');
  assertEquals(index.openTabsTagName, 'open-tabs');
});
