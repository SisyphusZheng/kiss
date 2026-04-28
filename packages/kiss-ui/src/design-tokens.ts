/**
 * @kissjs/ui - Design Tokens (Combined)
 *
 * KISS Design System: Pure B&W, Swiss International Style.
 *
 * Built on Open Props (https://open-props.style) for consistent design tokens.
 * Custom properties map to KISS theme system (Dark/Light).
 *
 * Architecture:
 * - L1: CSS custom properties (design tokens)
 * - L3: Lit components consume these tokens
 * - Theme switching via data-theme attribute
 *
 * v0.3.1: Tokens are organized into sub-modules for maintainability:
 *   tokens/spacing.ts   — spacing scale, radius, z-index, transitions
 *   tokens/typography.ts — font families, sizes, weights, line-height
 *   tokens/colors.ts     — dark/light theme color palettes
 *   tokens/effects.ts    — box shadows
 *
 * This file combines all tokens into a single CSSResult for convenience.
 * Import individual token modules if you only need a subset:
 *   import { kissColorTokens } from '@kissjs/ui/tokens/colors.js';
 *
 * Usage:
 * ```css
 * .my-component {
 *   background: var(--kiss-bg-base);
 *   color: var(--kiss-text-primary);
 *   padding: var(--kiss-size-4);
 * }
 * ```
 */

import { css, type CSSResult } from 'lit';
import { kissSpacingTokens } from './tokens/spacing.js';
import { kissTypographyTokens } from './tokens/typography.js';
import { kissColorTokens } from './tokens/colors.js';
import { kissEffectTokens } from './tokens/effects.js';

/**
 * KISS Design Tokens CSS (all tokens combined)
 *
 * These tokens are injected into every KISS UI component.
 * They provide consistent spacing, colors, typography, and more.
 */
export const kissDesignTokens: CSSResult = css`
  ${kissSpacingTokens}
  ${kissTypographyTokens}
  ${kissColorTokens}
  ${kissEffectTokens}
`;

export default kissDesignTokens;
