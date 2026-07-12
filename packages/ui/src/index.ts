/**
 * @openelement/ui - openElement UI Component Library
 *
 * Swiss International Style: Pure B&W, minimal, typography-driven.
 * Zero Lit dependency - built on DsdElement (native HTMLElement).
 *
 * Components:
 * - open-button: Button with variants (default, primary, ghost, accent)
 * - open-card: Card container with optional header/footer
 * - open-input: Input field with label and error states
 * - open-code-block: Code block with copy button
 * - open-badge: Open Props status badge
 * - open-theme-toggle: Theme toggle Island (Dark/Light)
 * - open-dialog: Dialog component using native <dialog>
 * - open-callout: Callout/notice box (info/warning/danger/tip)
 * - open-step-card: Step card with numbered indicator
 * - open-dropdown: Dropdown toggle with trigger slot and content slot
 * - open-modal: Modal dialog using signal-driven open attribute
 * - open-tabs: Tab interface with tab and panel slots
 *
 * Usage:
 * ```ts
 * // Import all components
 * import { registerOpenUi } from '@openelement/ui';
 * registerOpenUi();
 *
 * // Or import specific components
 * import { OpenButton } from '@openelement/ui/open-button';
 * ```
 *
 * @module @openelement/ui
 */

// Design tokens (CSSStyleSheet, zero Lit dependency)
export { openPropsRootSheet, openPropsTokenSheet } from './open-props-tokens.ts';

// daisyUI forked class sheet (Pure CSS, Open Props tokens)
export { daisyClassSheet } from './daisy-classes.ts';

// Components
export { OpenButton, tagName as openButtonTagName } from './open-button.tsx';
export { OpenCard, tagName as openCardTagName } from './open-card.tsx';
export { OpenInput, tagName as openInputTagName } from './open-input.tsx';
export { OpenCodeBlock, tagName as openCodeBlockTagName } from './open-code-block.tsx';
export { OpenBadge, tagName as openBadgeTagName } from './open-badge.tsx';
export { OpenThemeToggle, tagName as openThemeToggleTagName } from './open-theme-toggle.tsx';
export { OpenDialog, tagName as openDialogTagName } from './open-dialog.tsx';
export { OpenCallout, tagName as openCalloutTagName } from './open-callout.tsx';
export { OpenStepCard, tagName as openStepCardTagName } from './open-step-card.tsx';
export { OpenDropdown, tagName as openDropdownTagName } from './open-dropdown.tsx';
export { OpenModal, tagName as openModalTagName } from './open-modal.tsx';
export { OpenTabs, tagName as openTabsTagName } from './open-tabs.tsx';

// Package manifest (WC Package Protocol)
// Consumers (adapter-vite) read manifest.declarations to derive island metadata.
export { manifest } from './manifest.ts';
export { registerOpenUi } from './register.ts';
