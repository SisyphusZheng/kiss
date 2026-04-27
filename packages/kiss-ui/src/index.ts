/**
 * @kissjs/ui - KISS UI Component Library
 *
 * Swiss International Style: Pure B&W, minimal, typography-driven.
 * Built on Lit + Open Props design tokens.
 *
 * Components:
 * - kiss-button: Button with variants (default, primary, ghost)
 * - kiss-card: Card container with optional header/footer
 * - kiss-input: Input field with label and error states
 * - kiss-code-block: Code block with copy button
 * - kiss-layout: App layout with header, sidebar, footer
 * - kiss-theme-toggle: Theme toggle Island (Dark/Light)
 *
 * Usage:
 * ```ts
 * // Import all components
 * import '@kissjs/ui';
 *
 * // Or import specific components
 * import { KissButton } from '@kissjs/ui/kiss-button';
 * ```
 */

import type { PackageIslandMeta } from '@kissjs/core';

// Design tokens (CSS custom properties)
export { kissDesignTokens } from './design-tokens.js';

// Components
export { KissButton, tagName as kissButtonTagName } from './kiss-button.js';
export { KissCard, tagName as kissCardTagName } from './kiss-card.js';
export { KissInput, tagName as kissInputTagName } from './kiss-input.js';
export { KissCodeBlock, tagName as kissCodeBlockTagName } from './kiss-code-block.js';
export { KissLayout, tagName as kissLayoutTagName } from './kiss-layout.js';
export { KissThemeToggle, tagName as kissThemeToggleTagName } from './kiss-theme-toggle.js';

// Vite plugin for Web Awesome CDN injection
export { kissUI } from './kiss-ui-plugin.js';
export type { KissUIOptions } from './kiss-ui-plugin.js';

// Island metadata for auto-detection by @kissjs/core
// These components are Islands (have Shadow DOM + hydration)
export const islands: PackageIslandMeta[] = [
  {
    tagName: 'kiss-theme-toggle',
    modulePath: '@kissjs/ui/kiss-theme-toggle',
    strategy: 'eager', // Theme should be applied immediately
  },
];

// Default export: plugin
export { kissUI as default } from './kiss-ui-plugin.js';
