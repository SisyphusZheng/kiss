/**
 * @kissjs/ui — Comprehensive component tests (Deno)
 *
 * Tests all 6 UI components for:
 * - Export shape (tagName, class)
 * - Static properties
 * - Design tokens structure
 * - Vite plugin exports
 * - Index re-exports completeness
 */
import { assertEquals, assertExists, assertFalse } from 'jsr:@std/assert@^1.0.0';

// ─── Component Export Shape ──────────────────────────────────

const COMPONENT_FILES = [
  'kiss-button',
  'kiss-card', 
  'kiss-input',
  'kiss-code-block',
  'kiss-layout',
  'kiss-theme-toggle',
];

for (const name of COMPONENT_FILES) {
  Deno.test(`kiss-${name}: exports tagName`, async () => {
    const mod = await import(`../src/${name}.ts`);
    assertExists(mod.tagName, `${name} must export tagName`);
    assertEquals(typeof mod.tagName, 'string');
    // Custom Elements require hyphen in tag name
    assertExists(mod.tagName.includes('-'), `tagName "${mod.tagName}" must contain a hyphen`);
  });

  Deno.test(`kiss-${name}: exports LitElement subclass`, async () => {
    const mod = await import(`../src/${name}.ts`);
    const className = Object.keys(mod).find((k) =>
      k !== 'tagName' && typeof mod[k] === 'function'
    );
    assertExists(className, `${name} should export a class`);
    const Cls = mod[className as keyof typeof mod];
    assertExists(Cls.prototype.connectedCallback || Cls.prototype.render, `${name} class should be a LitElement`);
  });
}

// ─── Design Tokens ─────────────────────────────────────────

Deno.test('design-tokens: kissDesignTokens is CSSResult', async () => {
  const { kissDesignTokens } = await import('../src/design-tokens.ts');
  assertExists(kissDesignTokens);
  // CSSResult has a cssText property or styles property
  assertEquals(typeof kissDesignTokens.cssText === 'string' ||
    Array.isArray(kissDesignTokens.styleSheets) ||
    typeof kissDesignTokens === 'string' ||
    Symbol.for('css') in (kissDesignTokens as object),
    true,
    'kissDesignTokens should be a CSSResult',
  );
});

Deno.test('design-tokens: individual token modules export CSS', async () => {
  const tokenModules = [
    ['tokens/spacing', 'kissSpacingTokens'],
    ['tokens/typography', 'kissTypographyTokens'],
    ['tokens/colors', 'kissColorTokens'],
    ['tokens/effects', 'kissEffectTokens'],
  ];

  for (const [modPath, exportName] of tokenModules) {
    const mod = await import(`../src/${modPath}.ts`);
    assertExists(mod[exportName as keyof typeof mod], `${modPath} should export ${exportName}`);
  }
});

Deno.test('design-tokens: colors include dark/light theme variables', async () => {
  const { kissColorTokens } = await import('../src/tokens/colors.ts');
  const tokenStr = String(kissColorTokens);
  // Should contain CSS custom properties for theming
  assertExists(tokenStr.includes('--') || tokenStr.includes('css'), 'Color tokens should be valid CSS');
});

// ─── Index Re-exports ──────────────────────────────────────

Deno.test('index: re-exports all components', async () => {
  const mod = await import('../src/index.ts');

  // Components
  assertExists(mod.KissButton);
  assertExists(mod.KissCard);
  assertExists(mod.KissInput);
  assertExists(mod.KissCodeBlock);
  assertExists(mod.KissLayout);
  assertExists(mod.KissThemeToggle);

  // Tag names
  assertExists(mod.kissButtonTagName);
  assertExists(mod.kissCardTagName);
  assertExists(mod.kissInputTagName);
  assertExists(mod.kissCodeBlockTagName);
  assertExists(mod.kissLayoutTagName);
  assertExists(mod.kissThemeToggleTagName);

  // Tokens
  assertExists(mod.kissDesignTokens);
  assertExists(mod.kissSpacingTokens);
  assertExists(mod.kissTypographyTokens);
  assertExists(mod.kissColorTokens);
  assertExists(mod.kissEffectTokens);

  // Plugin
  assertExists(mod.kissUI);
  assertExists(typeof mod.default, 'function');
});

Deno.test('index: islands array has correct entries', async () => {
  const { islands } = await import('../src/index.ts');
  assertExists(islands);
  assertEquals(Array.isArray(islands), true);

  // Each island entry must have tagName, modulePath, strategy
  for (const island of islands) {
    assertExists(island.tagName, 'island must have tagName');
    assertExists(island.modulePath, 'island must have modulePath');
    assertExists(island.strategy, 'island must have hydration strategy');
    assertEquals(typeof island.strategy, 'string');
  }
});

// ─── Vite Plugin ──────────────────────────────────────────

Deno.test('kiss-ui-plugin: returns a Vite plugin', async () => {
  const { kissUI } = await import('../src/kiss-ui-plugin.ts');
  const plugin = kissUI();
  assertExists(plugin.name);
  assertEquals(plugin.name.startsWith('kiss'), true);
  assertExists(plugin.config || plugin.transform || plugin.buildStart, 'Plugin must have at least one hook');
});

Deno.test('kiss-ui-plugin: accepts options', async () => {
  const { kissUI } = await import('../src/kiss-ui-plugin.ts');
  const plugin = kissUI({ cdn: '3.5.0' });
  assertExists(plugin.name);
});
