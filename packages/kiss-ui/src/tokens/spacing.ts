/**
 * @kissjs/ui - Design Tokens: Spacing & Layout
 *
 * KISS spacing scale based on 4px base unit (Swiss grid).
 * Consistent rhythm across all components.
 */

import { css } from 'lit';

/** Spacing & layout CSS custom properties */
export const kissSpacingTokens = css`
  :host {
    /* === Spacing Scale (4px base unit) === */
    --kiss-size-1: 0.25rem; /* 4px */
    --kiss-size-2: 0.375rem; /* 6px */
    --kiss-size-3: 0.5rem; /* 8px */
    --kiss-size-4: 0.75rem; /* 12px */
    --kiss-size-5: 1rem; /* 16px */
    --kiss-size-6: 1.25rem; /* 20px */
    --kiss-size-7: 1.5rem; /* 24px */
    --kiss-size-8: 2rem; /* 32px */
    --kiss-size-9: 2.5rem; /* 40px */
    --kiss-size-10: 3rem; /* 48px */

    /* === Border Radius (Swiss: minimal) === */
    --kiss-radius-sm: 2px;
    --kiss-radius-md: 4px;
    --kiss-radius-lg: 6px;

    /* === Transitions === */
    --kiss-transition-fast: 0.1s ease;
    --kiss-transition-normal: 0.15s ease;
    --kiss-transition-slow: 0.25s ease;

    /* === Z-Index Scale === */
    --kiss-z-dropdown: 100;
    --kiss-z-sticky: 200;
    --kiss-z-fixed: 300;
    --kiss-z-modal-backdrop: 400;
    --kiss-z-modal: 500;
    --kiss-z-popover: 600;
    --kiss-z-tooltip: 700;
  }
`;
