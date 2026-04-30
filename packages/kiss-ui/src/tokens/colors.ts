/**
 * @kissjs/ui - Design Tokens: Color Themes
 *
 * KISS Design System: Pure B&W (Swiss International Style).
 * Light theme by default, Dark via data-theme attribute.
 *
 * Token naming: --kiss-{category}-{variant}
 *
 * SINGLE SOURCE OF TRUTH:
 * All color token values are defined in `kissColorValues` below.
 * The CSS outputs (:host and :root versions) are GENERATED from this object.
 * NEVER edit the CSS strings directly — always edit the values object.
 *
 * ARCHITECTURE NOTE — Theme Propagation in Shadow DOM:
 *
 * CSS custom properties DO inherit through Shadow DOM. However,
 * when a component's `:host` rule declares a custom property,
 * it shadows (overrides) the inherited value from `:root`.
 *
 * KISS theme strategy:
 *   1. `:host` declares light-theme defaults — provides fallback
 *      for standalone usage (without global <style>).
 *   2. `:host([data-theme="dark"])` overrides for dark theme.
 *   3. The kiss-theme-toggle Island propagates `data-theme` to
 *      both `<html>` AND every KISS component host element,
 *      so both `:root` vars (for light DOM) and `:host([data-theme])`
 *      selectors (for Shadow DOM) work correctly.
 *
 * DRY enforcement:
 *   - `kissColorValues` is the single source of truth
 *   - `kissColorTokens` generates `:host` CSS for Shadow DOM components
 *   - `kissRootColorCSS` generates `:root` CSS for page-level injection
 *   - Both MUST stay in sync — editing the object keeps them in sync
 */

// Import from 'lit' directly (not '@kissjs/core') to avoid circular dependency
// in Vite config bundling. This module is infrastructure — it must work in
// Node.js contexts (vite.config.ts) where @kissjs/core isn't resolvable.
import { css, unsafeCSS } from 'lit';

// ============================================================
// SINGLE SOURCE OF TRUTH — Color Token Values
// ============================================================
// Edit these values to change ALL color tokens everywhere.
// The CSS outputs are generated from these objects.

/** Dark theme color values (default) */
export const kissDarkColors = {
  '--kiss-bg-base': '#000',
  '--kiss-bg-surface': '#0a0a0a',
  '--kiss-bg-elevated': '#111',
  '--kiss-bg-hover': '#0e0e0e',
  '--kiss-bg-card': '#0a0a0a',
  '--kiss-border': '#1a1a1a',
  '--kiss-border-hover': '#333',
  '--kiss-text-primary': '#fff',
  '--kiss-text-secondary': '#999',
  '--kiss-text-tertiary': '#666',
  '--kiss-text-muted': '#444',
  '--kiss-accent': '#fff',
  '--kiss-accent-dim': '#ccc',
  '--kiss-accent-subtle': 'rgba(255, 255, 255, 0.05)',
  '--kiss-code-bg': '#111',
  '--kiss-code-border': '#1a1a1a',
  '--kiss-error': '#e55',
  '--kiss-scrollbar-track': 'transparent',
  '--kiss-scrollbar-thumb': '#222',
} as const;

/** Light theme color values */
export const kissLightColors = {
  '--kiss-bg-base': '#fff',
  '--kiss-bg-surface': '#fafafa',
  '--kiss-bg-elevated': '#f5f5f5',
  '--kiss-bg-hover': '#f0f0f0',
  '--kiss-bg-card': '#fff',
  '--kiss-border': '#e5e5e5',
  '--kiss-border-hover': '#ccc',
  '--kiss-text-primary': '#000',
  '--kiss-text-secondary': '#555',
  '--kiss-text-tertiary': '#888',
  '--kiss-text-muted': '#aaa',
  '--kiss-accent': '#000',
  '--kiss-accent-dim': '#333',
  '--kiss-accent-subtle': 'rgba(0, 0, 0, 0.03)',
  '--kiss-code-bg': '#f5f5f5',
  '--kiss-code-border': '#e5e5e5',
  '--kiss-error': '#c44',
  '--kiss-scrollbar-track': 'transparent',
  '--kiss-scrollbar-thumb': '#ccc',
} as const;

// ============================================================
// CSS GENERATORS — Do not edit CSS strings, edit values above
// ============================================================

/** Generate CSS declarations from a values object */
function declarations(values: Readonly<Record<string, string>>): string {
  return Object.entries(values)
    .map(([prop, value]) => `${prop}:${value}`)
    .join(';');
}

/** Color theme CSS custom properties for Shadow DOM components (:host) */
export const kissColorTokens = css`
  :host,
  :host([data-theme="light"]) {
    ${unsafeCSS(declarations(kissLightColors))};
    color-scheme: light;
  }

  :host([data-theme="dark"]) {
    ${unsafeCSS(declarations(kissDarkColors))};
    color-scheme: dark;
  }
`;

/**
 * Page-level CSS for :root injection (headFragments).
 * Use this in vite.config.ts `inject.headFragments` instead of
 * hand-writing the CSS values — ensures DRY with component tokens.
 *
 * Usage:
 * ```ts
 * import { kissRootColorCSS } from '@kissjs/ui/tokens/colors.js';
 * // or: import { kissRootColorCSS } from '@kissjs/ui/design-tokens.js';
 *
 * inject: {
 *   headFragments: [
 *     `<style>${kissRootColorCSS}</style>`,
 *   ]
 * }
 * ```
 */
export const kissRootColorCSS = `:root,[data-theme="light"]{${
  declarations(kissLightColors)
};color-scheme:light}[data-theme="dark"]{${declarations(kissDarkColors)};color-scheme:dark}`;

/**
 * Minified CSS for scaffolding (create-kiss template).
 * Same content as kissRootColorCSS but formatted for inline <style>.
 */
export const kissScaffoldColorCSS = kissRootColorCSS;
