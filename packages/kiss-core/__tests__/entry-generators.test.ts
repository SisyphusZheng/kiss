/**
 * @kissjs/core - entry-generators.ts tests (Deno)
 *
 * Tests generateClientEntry code generation for all hydration strategies.
 */
import { assertEquals, assertExists, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { generateClientEntry } from '../src/entry-generators.ts';

const LOCAL_ISLAND = {
  tagName: 'my-counter',
  modulePath: './islands/my-counter.ts',
  isPackage: false as const,
};

const PACKAGE_ISLAND = {
  tagName: 'kiss-theme-toggle',
  modulePath: '@kissjs/ui/kiss-theme-toggle',
  isPackage: true as const,
};

// ─── Empty Islands ──────────────────────────────────────────

Deno.test('generateClientEntry returns no-op for empty islands', () => {
  const code = generateClientEntry([]);
  assertExists(code.includes('zero client JS needed'));
});

// ─── Eager Strategy ────────────────────────────────────────

Deno.test('generateClientEntry eager strategy hydrates immediately', () => {
  const code = generateClientEntry([LOCAL_ISLAND], 'eager');
  assertExists(code.includes('__kissHydrateAll()'));
  // Should not have idle callback
  assertEquals(code.includes('requestIdleCallback'), false);
});

// ─── Lazy Strategy ─────────────────────────────────────────

Deno.test('generateClientEntry lazy strategy uses requestIdleCallback', () => {
  const code = generateClientEntry([LOCAL_ISLAND], 'lazy');
  assertExists(code.includes('requestIdleCallback'));
  assertExists(code.includes('__kissHydrateAll'));
});

// ─── Idle Strategy ──────────────────────────────────────────

Deno.test('generateClientEntry idle strategy waits for page idle', () => {
  const code = generateClientEntry([LOCAL_ISLAND], 'idle');
  assertExists(
    code.includes('requestIdleCallback') || code.includes('window.addEventListener("load"'),
  );
});

// ─── Visible Strategy ──────────────────────────────────────

Deno.test('generateClientEntry visible strategy uses IntersectionObserver', () => {
  const code = generateClientEntry([LOCAL_ISLAND], 'visible');
  assertExists(code.includes('IntersectionObserver'));
  assertExists(code.includes('__kissFindDeferred')); // Must traverse Shadow DOM
  assertExists(code.includes('__kissHydrateElement'));
  // Should NOT use document.querySelectorAll (doesn't pierce Shadow DOM)
  assertEquals(
    code.includes("document.querySelectorAll('[defer-hydration]')"),
    false,
    'visible strategy must NOT use document.querySelectorAll',
  );
});

// ─── Local Island Registration ─────────────────────────────

Deno.test('generateClientEntry registers local island with customElements.define', () => {
  const code = generateClientEntry([LOCAL_ISLAND]);
  assertExists(code.includes("customElements.define('my-counter'"));
  assertExists(code.includes("import Island_0 from './islands/my-counter.ts'"));
});

// ─── Package Island Dynamic Import ─────────────────────────

Deno.test('generateClientEntry uses dynamic import for package islands', () => {
  const code = generateClientEntry([PACKAGE_ISLAND]);
  assertExists(code.includes("import('@kissjs/ui/kiss-theme-toggle')"));
  // Should be dynamic import(), not static import
  assertExists(code.match(/import\s*\(/));
  // Should NOT be in static imports
  assertFalse(
    code.includes(`import '${PACKAGE_ISLAND.modulePath}'`),
    'Package islands must use dynamic import()',
  );
});

// ─── Mixed Islands ─────────────────────────────────────────

Deno.test('generateClientEntry handles mixed local and package islands', () => {
  const code = generateClientEntry([LOCAL_ISLAND, PACKAGE_ISLAND]);

  // Local island: static import + define
  assertExists(code.includes("customElements.define('my-counter'"));

  // Package island: dynamic import
  assertExists(code.includes("import('@kissjs/ui/kiss-theme-toggle')"));
});

// ─── Hydration Support Import ──────────────────────────────

Deno.test('generateClientEntry always imports lit-element-hydrate-support', () => {
  const code = generateClientEntry([LOCAL_ISLAND]);
  assertExists(code.includes('lit-element-hydrate-support'));
  assertExists(code.includes('litElementHydrateSupport({ LitElement })'));
});

// ─── Shadow DOM Traversal ──────────────────────────────────

Deno.test('generateClientEntry includes __kissFindDeferred for Shadow DOM traversal', () => {
  const code = generateClientEntry([LOCAL_ISLAND]);

  // Must define the recursive traversal function
  assertExists(code.includes('function __kissFindDeferred'));

  // Must recurse into shadow roots
  assertExists(code.includes('el.shadowRoot'));
  assertExists(code.includes('__kissFindDeferred(el.shadowRoot)'));

  // Must find elements with defer-hydration attribute
  assertExists(code.includes('[defer-hydration]'));
});

// ─── whenDefined List ──────────────────────────────────────

Deno.test('generateClientEntry creates whenDefined list for all islands', () => {
  const code = generateClientEntry([
    LOCAL_ISLAND,
    { ...PACKAGE_ISLAND },
    { tagName: 'code-block', modulePath: './islands/code-block.ts', isPackage: false },
  ]);

  assertExists(code.includes("customElements.whenDefined('my-counter')"));
  assertExists(code.includes("customElements.whenDefined('kiss-theme-toggle')"));
  assertExists(code.includes("'code-block'"));
});

// ─── No package islands (packageImportBlock empty) ────────

Deno.test('generateClientEntry local-only islands have no dynamic import block', () => {
  const code = generateClientEntry([LOCAL_ISLAND, {
    tagName: 'code-block',
    modulePath: './islands/code-block.ts',
    isPackage: false,
  }]);
  // No "Dynamic import for package islands" comment when no package islands
  assertEquals(code.includes('Dynamic import for package islands'), false);
});

// ─── Multiple package islands ─────────────────────────────

Deno.test('generateClientEntry multiple package islands all use dynamic import', () => {
  const code = generateClientEntry([
    { tagName: 'kiss-button', modulePath: '@kissjs/ui/kiss-button', isPackage: true },
    { tagName: 'kiss-card', modulePath: '@kissjs/ui/kiss-card', isPackage: true },
  ]);
  assertExists(code.includes("import('@kissjs/ui/kiss-button')"));
  assertExists(code.includes("import('@kissjs/ui/kiss-card')"));
  // No static customElements.define() call for package islands
  // (they self-register via side-effect import)
  assertEquals(code.includes("customElements.define('kiss-"), false);
  assertEquals(code.includes("customElements.define('kiss-card"), false);
});
