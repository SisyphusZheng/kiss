/**
 * @openelement/ui - openElement UI Component Library
 *
 * Swiss International Style: Pure B&W, minimal, typography-driven.
 * Zero Lit dependency - built on DsdElement (native HTMLElement).
 *
 * Components:
 * - open-button: Button with variants (default, primary, ghost, accent)
 * - open-button-linear: Linear.app-style button (compact, no box-shadow)
 * - open-card: Card container with optional header/footer
 * - open-card-linear: Linear.app-style card with edge highlight
 * - open-input: Input field with label and error states
 * - open-input-linear: Linear.app-style input (standard, cli, search variants)
 * - open-nav-linear: Linear.app-style sticky navigation bar
 * - open-badge-linear: Linear.app-style pill badge component
 * - open-code-block: Code block with copy button
 * - open-badge: Open Props status badge
 * - open-lab-panel: Standards-lab artifact/spec panel
 * - open-lab-stage: Kinetic standards-lab hero primitive
 * - open-standards-visual: Product-art standards diagrams
 * - open-layout: App layout with header, sidebar, footer
 * - open-theme-toggle: Theme toggle Island (Dark/Light)
 * - open-dialog: Dialog component using native <dialog>
 * - open-callout: Callout/notice box (info/warning/danger/tip)
 * - open-step-card: Step card with numbered indicator
 * - open-hero-ping: Hero ping Island (API health check)
 *
 * Usage:
 * ```ts
 * // Import all components
 * import '@openelement/ui';
 *
 * // Or import specific components
 * import { OpenButton } from '@openelement/ui/open-button';
 * ```
 *
 * @module @openelement/ui
 */

// Design tokens (CSSStyleSheet, zero Lit dependency)
export { openPropsTokenSheet } from './open-props-tokens.js';
export { linearTokenSheet } from './linear-token-sheet.js';

// daisyUI forked class sheet (Pure CSS, Open Props tokens)
export { daisyClassSheet } from './daisy-classes.js';

// Components
export { OpenButton, tagName as openButtonTagName } from './open-button.js';
export { OpenCard, tagName as openCardTagName } from './open-card.js';
export { OpenInput, tagName as openInputTagName } from './open-input.js';
export { OpenCodeBlock, tagName as openCodeBlockTagName } from './open-code-block.js';
export { OpenBadge, tagName as openBadgeTagName } from './open-badge.js';
export { OpenLabPanel, tagName as openLabPanelTagName } from './open-lab-panel.js';
export { OpenLabStage, tagName as openLabStageTagName } from './open-lab-stage.js';
export {
  OpenStandardsVisual,
  tagName as openStandardsVisualTagName,
} from './open-standards-visual.js';
export { OpenLayout, tagName as openLayoutTagName } from './open-layout.js';
export type { HeaderNavLink, NavItem, NavSection } from './open-layout.js';
export { OpenThemeToggle, tagName as openThemeToggleTagName } from './open-theme-toggle.js';
export { default as OpenHeroPing, tagName as openHeroPingTagName } from './open-hero-ping.js';
export { OpenDialog, tagName as openDialogTagName } from './open-dialog.js';
export { OpenCallout, tagName as openCalloutTagName } from './open-callout.js';
export { OpenStepCard, tagName as openStepCardTagName } from './open-step-card.js';
export { OpenDropdown, tagName as openDropdownTagName } from './open-dropdown.js';
export { OpenModal, tagName as openModalTagName } from './open-modal.js';
export { OpenTabs, tagName as openTabsTagName } from './open-tabs.js';

// Linear components
export { OpenButtonLinear, tagName as openButtonLinearTagName } from './open-button-linear.js';
export { OpenCardLinear, tagName as openCardLinearTagName } from './open-card-linear.js';
export { OpenInputLinear, tagName as openInputLinearTagName } from './open-input-linear.js';
export { OpenNavLinear, tagName as openNavLinearTagName } from './open-nav-linear.js';
export { OpenBadgeLinear, tagName as openBadgeLinearTagName } from './open-badge-linear.js';

// Package manifest (WC Package Protocol)
// Consumers (adapter-vite) read manifest.declarations to derive island metadata.
export { manifest } from './manifest.js';
