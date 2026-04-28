/**
 * @kissjs/ui - Design Tokens: Typography
 *
 * Swiss International Style: System font stack with precise sizing scale.
 * Line heights follow the golden ratio for optimal readability.
 */

import { css } from 'lit';

/** Typography CSS custom properties */
export const kissTypographyTokens = css`
  :host {
    /* === Font Families === */
    --kiss-font-sans:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      Arial,
      sans-serif;
    --kiss-font-mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;

    /* === Font Sizes (modular scale ~1.125) === */
    --kiss-font-size-xs: 0.6875rem; /* 11px */
    --kiss-font-size-sm: 0.75rem; /* 12px */
    --kiss-font-size-md: 0.875rem; /* 14px */
    --kiss-font-size-lg: 1rem; /* 16px */
    --kiss-font-size-xl: 1.125rem; /* 18px */
    --kiss-font-size-2xl: 1.25rem; /* 20px */
    --kiss-font-size-3xl: 1.5rem; /* 24px */

    /* === Font Weights === */
    --kiss-font-weight-normal: 400;
    --kiss-font-weight-medium: 500;
    --kiss-font-weight-semibold: 600;
    --kiss-font-weight-bold: 700;
    --kiss-font-weight-extrabold: 800;

    /* === Line Heights === */
    --kiss-line-height-tight: 1.2;
    --kiss-line-height-normal: 1.5;
    --kiss-line-height-relaxed: 1.7;

    /* === Letter Spacing === */
    --kiss-letter-spacing-tight: -0.03em;
    --kiss-letter-spacing-normal: 0;
    --kiss-letter-spacing-wide: 0.02em;
    --kiss-letter-spacing-wider: 0.05em;
    --kiss-letter-spacing-widest: 0.15em;
  }
`;
