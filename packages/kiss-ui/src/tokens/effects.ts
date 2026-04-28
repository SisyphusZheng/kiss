/**
 * @kissjs/ui - Design Tokens: Effects
 *
 * Shadows and visual elevation for Swiss-style interfaces.
 * Minimal, purposeful — no decorative shadows.
 */

import { css } from 'lit';

/** Shadow/effect CSS custom properties */
export const kissEffectTokens = css`
  :host {
    /* === Box Shadows (subtle, Swiss restraint) === */
    --kiss-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
    --kiss-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.15);
    --kiss-shadow-lg: 0 4px 24px rgba(0, 0, 0, 0.2);
  }
`;
