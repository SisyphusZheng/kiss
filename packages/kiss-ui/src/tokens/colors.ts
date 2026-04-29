/**
 * @kissjs/ui - Design Tokens: Color Themes
 *
 * KISS Design System: Pure B&W (Swiss International Style).
 * Dark theme by default, Light via data-theme attribute.
 *
 * Token naming: --kiss-{category}-{variant}
 *
 * ARCHITECTURE NOTE — Theme Propagation in Shadow DOM:
 *
 * CSS custom properties DO inherit through Shadow DOM. However,
 * when a component's `:host` rule declares a custom property,
 * it shadows (overrides) the inherited value from `:root`.
 *
 * KISS theme strategy:
 *   1. `:host` declares dark-theme defaults — provides fallback
 *      for standalone usage (without global <style>).
 *   2. `:host([data-theme="light"])` overrides for light theme.
 *   3. The kiss-theme-toggle Island propagates `data-theme` to
 *      both `<html>` AND every KISS component host element,
 *      so both `:root` vars (for light DOM) and `:host([data-theme])`
 *      selectors (for Shadow DOM) work correctly.
 *
 * This is the ONLY correct way to do theme switching with Shadow DOM
 * + CSS custom properties, without using `:host-context()` (which
 * Firefox doesn't support) or CSS `@layer` (which doesn't help here).
 */

import { css } from 'lit';

/** Color theme CSS custom properties (dark default + light override) */
export const kissColorTokens = css`
  :host,
  :host([data-theme="dark"]) {
    /* === Backgrounds === */
    --kiss-bg-base: #000;
    --kiss-bg-surface: #0a0a0a;
    --kiss-bg-elevated: #111;
    --kiss-bg-hover: #0e0e0e;
    --kiss-bg-card: #0a0a0a;

    /* === Borders === */
    --kiss-border: #1a1a1a;
    --kiss-border-hover: #333;

    /* === Text Colors === */
    --kiss-text-primary: #fff;
    --kiss-text-secondary: #999;
    --kiss-text-tertiary: #666;
    --kiss-text-muted: #444;

    /* === Accent (B&W) === */
    --kiss-accent: #fff;
    --kiss-accent-dim: #ccc;
    --kiss-accent-subtle: rgba(255, 255, 255, 0.05);

    /* === Code Block === */
    --kiss-code-bg: #111;
    --kiss-code-border: #1a1a1a;

    /* === Error === */
    --kiss-error: #e55;

    /* === Scrollbar === */
    --kiss-scrollbar-track: transparent;
    --kiss-scrollbar-thumb: #222;

    color-scheme: dark;
  }

  :host([data-theme="light"]) {
    /* === Backgrounds === */
    --kiss-bg-base: #fff;
    --kiss-bg-surface: #fafafa;
    --kiss-bg-elevated: #f5f5f5;
    --kiss-bg-hover: #f0f0f0;
    --kiss-bg-card: #fff;

    /* === Borders === */
    --kiss-border: #e5e5e5;
    --kiss-border-hover: #ccc;

    /* === Text Colors === */
    --kiss-text-primary: #000;
    --kiss-text-secondary: #555;
    --kiss-text-tertiary: #888;
    --kiss-text-muted: #aaa;

    /* === Accent (B&W inverted) === */
    --kiss-accent: #000;
    --kiss-accent-dim: #333;
    --kiss-accent-subtle: rgba(0, 0, 0, 0.03);

    /* === Code Block === */
    --kiss-code-bg: #f5f5f5;
    --kiss-code-border: #e5e5e5;

    /* === Error === */
    --kiss-error: #c44;

    /* === Scrollbar === */
    --kiss-scrollbar-track: transparent;
    --kiss-scrollbar-thumb: #ccc;

    color-scheme: light;
  }
`;
