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

// Design tokens (CSS custom properties)
export { kissDesignTokens } from './design-tokens.js';

// Components
export { KissButton, tagName as kissButtonTagName } from './kiss-button.js';
export { KissCard, tagName as kissCardTagName } from './kiss-card.js';
export { KissInput, tagName as kissInputTagName } from './kiss-input.js';
export { KissCodeBlock, tagName as kissCodeBlockTagName } from './kiss-code-block.js';
export { KissLayout, tagName as kissLayoutTagName } from './kiss-layout.js';

// Vite plugin for Web Awesome CDN injection
export { kissUI, KissUIOptions } from './kiss-ui-plugin.js';

// Default export: plugin
export { kissUI as default } from './kiss-ui-plugin.js';