/**
 * @kissjs/ui - Design Tokens: Color Themes
 *
 * KISS Design System: Pure B&W (Swiss International Style).
 * Dark theme by default, Light via data-theme attribute.
 *
 * Token naming: --kiss-{category}-{variant}
 */

import { css } from 'lit';

/** Color theme CSS custom properties (dark + light) */
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

    color-scheme: light;
  }
`;
