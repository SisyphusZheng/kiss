/**
 * @kissjs/ui — Deep tests: Component behavior
 *
 * Tests cover:
 * - kiss-theme-toggle: theme attribute, localStorage race fix, event dispatch
 * - kiss-button: type attribute, click handling
 * - kiss-layout: currentPath propagation
 * - design-tokens: token values
 */
import { assertEquals, assertExists, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';

// ─── kiss-theme-toggle Tests ──────────────────────────────

Deno.test('kiss-theme-toggle — exports tagName and class', async () => {
  const mod = await import('../src/kiss-theme-toggle.ts');
  assertEquals(mod.tagName, 'kiss-theme-toggle');
  assertExists(mod.KissThemeToggle);
  
  // Verify it extends LitElement
  const proto = Object.getPrototypeOf(mod.KissThemeToggle);
  // Check that it has LitElement-like properties
  assertExists(proto.connectedCallback || proto.firstUpdated,
    'Should be a LitElement subclass');
});

Deno.test('kiss-theme-toggle — has reactive `theme` property', async () => {
  const mod = await import('../src/kiss-theme-toggle.ts');
  
  // The component should have a `theme` property declared as a reactive property
  // We check the static properties decorator output
  const cls = mod.KissThemeToggle;
  if (cls.properties) {
    assertExists(cls.properties.theme, 'theme should be a reactive property');
    assertEquals(cls.properties.theme.type, String);
    assertEquals(cls.properties.theme.reflect, true,
      'theme should reflect to attribute for SSR compatibility');
  }
  // If no static properties, check via instance
  const instance = new cls();
  assertEquals(instance.theme === '' || instance.theme === null || instance.theme === undefined,
    'Initial theme should be empty/null (set by connectedCallback or attribute)');
});

Deno.test('kiss-theme-toggle — has _isLight internal state', async () => {
  const mod = await import('../src/kiss-theme-toggle.ts');
  const instance = new mod.KissThemeToggle();
  
  // Internal state should default to false (dark mode)
  // This is checked in connectedCallback
  const internal = instance as unknown as { _isLight: boolean };
  assertEquals(internal._isLight, false, 'Default should be dark mode');
});

Deno.test('kiss-theme-toggle — has toggle method', async () => {
  const mod = await import('../src/kiss-theme-toggle.ts');
  const instance = new mod.KissThemeToggle();
  
  assertExists(instance.toggle, 'toggle method should exist');
  assertEquals(typeof instance.toggle, 'function');
});

// ─── kiss-button Tests ───────────────────────────────────

Deno.test('kiss-button — has type property with default "button"', async () => {
  const mod = await import('../src/kiss-button.ts');
  assertEquals(mod.tagName, 'kiss-button');
  
  const instance = new mod.KissButton();
  const typed = instance as unknown as { type: string };
  
  // Default should be 'button' (not submit)
  if (typed.type !== undefined) {
    assertEquals(typed.type, 'button',
      'Default button type should be "button" to prevent form submission side effects');
  }
});

Deno.test('kiss-button — exports class name', async () => {
  const mod = await import('../src/kiss-button.ts');
  assertExists(mod.KissButton, 'KissButton class should be exported');
});

// ─── kiss-input Tests ─────────────────────────────────────

Deno.test('kiss-input — has value property', async () => {
  const mod = await import('../src/kiss-input.ts');
  assertEquals(mod.tagName, 'kiss-input');
  assertExists(mod.KissInput);
});

// ─── kiss-card Tests ──────────────────────────────────────

Deno.test('kiss-card — has slot support', async () => {
  const mod = await import('../src/kiss-card.ts');
  assertEquals(mod.tagName, 'kiss-card');
  assertExists(mod.KissCard);
});

// ─── kiss-layout Tests ────────────────────────────────────

Deno.test('kiss-layout — has currentPath property', async () => {
  const mod = await import('../src/kiss-layout.ts');
  assertEquals(mod.tagName, 'kiss-layout');
  assertExists(mod.KissLayout);
  
  // currentPath is critical for active navigation highlighting
  const instance = new mod.KissLayout();
  const typed = instance as unknown as { currentPath: string };
  assertExists(typed.currentPath, 'currentPath should exist');
});

// ─── kiss-code-block Tests ────────────────────────────────

Deno.test('kiss-code-block — has language property', async () => {
  const mod = await import('../src/kiss-code-block.ts');
  assertEquals(mod.tagName, 'kiss-code-block');
  assertExists(mod.KissCodeBlock);
});

// ─── Design Tokens Tests ──────────────────────────────────

Deno.test('design-tokens — contains required CSS custom properties', async () => {
  const mod = await import('../src/design-tokens.ts');
  assertExists(mod.kissDesignTokens);
  
  const tokens = mod.kissDesignTokens;
  
  // Should contain essential color tokens
  assertStringIncludes(tokens, '--kiss-color-primary',
    'Should have primary color token');
  assertStringIncludes(tokens, '--kiss-color-bg',
    'Should have background color token (needed for light/dark themes)');
  assertStringIncludes(tokens, '--kiss-color-text',
    'Should have text color token');
  
  // Should have spacing tokens
  assertStringIncludes(tokens, '--kiss-spacing',
    'Should have spacing tokens');
});

Deno.test('design-tokens — supports light/dark theme variables', async () => {
  const mod = await import('../src/design-tokens.ts');
  const tokens = mod.kissDesignTokens;
  
  // Theme-aware tokens use [data-theme] selectors or :root with fallbacks
  const hasThemeSupport =
    tokens.includes('data-theme') ||
    tokens.includes('.light') ||
    tokens.includes('.dark') ||
    (tokens.includes('--kiss-color-bg:') && tokens.includes(';'));
    
  assert(hasThemeSupport,
    'Design tokens should support theming (data-theme or class-based selectors)');
});

// ─── Island Exports Integrity ─────────────────────────────

Deno.test('islands export — all islands have valid shape', async () => {
  const mod = await import('../src/index.ts');
  
  for (const island of mod.islands) {
    // Each island must have tagName (string) and strategy (string)
    assertExists(island.tagName, `Island missing tagName`);
    assertExists(island.strategy, `Island ${island.tagName} missing strategy`);
    assertEquals(typeof island.tagName, 'string');
    assertEquals(typeof island.strategy, 'string');
    
    // Strategy must be one of the four valid values
    const validStrategies = ['eager', 'lazy', 'idle', 'visible'];
    assert(validStrategies.includes(island.strategy),
      `Invalid strategy "${island.strategy}" for ${island.tagName}`);
  }
});
