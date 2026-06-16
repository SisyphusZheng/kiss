/**
 * @openelement/ui - Linear Token Sheet
 *
 * CSSStyleSheet with Linear.app-style design tokens.
 * Dark mode by default; light mode via [data-theme="light"] overrides.
 * Uses Inter (sans) and JetBrains Mono (mono).
 *
 * Backward compatible — existing Open Props tokens unchanged.
 */

import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';

export const linearTokenSheet: StyleSheetLike = createLinearTokenSheet();

function createLinearTokenSheet(): StyleSheetLike {
  const sheet: StyleSheetLike = new StyleSheet();
  sheet.replaceSync(`:root {
  /* ═══════════════════════════════════════════════
     Font Family
     ═══════════════════════════════════════════════ */
  --font-sans: 'Inter', 'SF Pro Display', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Fira Mono', ui-monospace, monospace;

  /* ═══════════════════════════════════════════════
     Typography Scale
     ═══════════════════════════════════════════════ */
  --font-size-display-xl: 5rem;
  --font-size-display-lg: 3.5rem;
  --font-size-display-md: 2.5rem;
  --font-size-headline: 1.75rem;
  --font-size-card-title: 1.375rem;
  --font-size-subhead: 1.25rem;
  --font-size-body-lg: 1.125rem;
  --font-size-body: 1rem;
  --font-size-body-sm: 0.875rem;
  --font-size-button: 0.875rem;
  --font-size-eyebrow: 0.8125rem;
  --font-size-caption: 0.75rem;
  --font-size-mono: 0.8125rem;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  --line-height-tight: 0.95;
  --line-height-headline: 1.05;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;

  --letter-spacing-tight: -0.04em;
  --letter-spacing-tight-sm: -0.03em;
  --letter-spacing-tight-xs: -0.02em;
  --letter-spacing-normal: -0.01em;
  --letter-spacing-wide: 0.04em;
  --letter-spacing-wider: 0.08em;

  /* ═══════════════════════════════════════════════
     Spacing Scale
     ═══════════════════════════════════════════════ */
  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
  --space-section: 96px;

  /* ═══════════════════════════════════════════════
     Border Radius
     ═══════════════════════════════════════════════ */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 9999px;

  /* ═══════════════════════════════════════════════
     Dark Mode (Default)
     ═══════════════════════════════════════════════ */
  --bg-canvas: #08080a;
  --surface-1: #0d0f12;
  --surface-2: #16191d;
  --surface-3: #212529;

  --color-brand: #4263eb;
  --color-brand-hover: #3b5bdb;
  --color-brand-light: #5c7cfa;
  --color-brand-pale: #748ffc;
  --color-brand-deep: #26215c;

  --color-text-primary: #e9ecef;
  --color-text-secondary: #adb5bd;
  --color-text-muted: #868e96;

  --color-border: rgba(255, 255, 255, 0.06);
  --color-border-hover: rgba(255, 255, 255, 0.10);
  --color-border-strong: rgba(255, 255, 255, 0.14);
  --color-edge-highlight: rgba(255, 255, 255, 0.08);

  --color-overlay: rgba(0, 0, 0, 0.5);

  --color-success: #4ade80;
  --color-success-subtle: rgba(74, 222, 128, 0.1);
  --color-error: #f87171;
  --color-error-subtle: rgba(248, 113, 113, 0.12);
  --color-warning: #fbbf24;
  --color-warning-subtle: rgba(251, 191, 36, 0.1);
  --color-info: #60a5fa;
  --color-info-subtle: rgba(96, 165, 250, 0.1);

  --shadow-none: none;
  --shadow-elevated: 0 0 0 1px rgba(255, 255, 255, 0.06);

  /* ═══════════════════════════════════════════════
     Component Tokens
     ═══════════════════════════════════════════════ */
  --card-padding: var(--space-lg);
  --card-radius: var(--radius-lg);
  --card-border: var(--color-border);
  --card-bg: var(--surface-2);
  --card-edge-highlight: var(--color-edge-highlight);

  --input-padding-y: var(--space-xs);
  --input-padding-x: 12px;
  --input-radius: var(--radius-md);
  --input-border-color: var(--color-border);
  --input-bg: var(--surface-1);
  --input-focus-ring: var(--color-brand);

  --badge-padding-x: 8px;
  --badge-padding-y: 2px;
  --badge-radius: var(--radius-pill);
  --badge-font-size: var(--font-size-caption);
  --badge-bg: var(--surface-1);
  --badge-color: var(--color-text-muted);

  /* ═══════════════════════════════════════════════
     Breakpoints
     ═══════════════════════════════════════════════ */
  --bp-mobile: 0;
  --bp-tablet: 768px;
  --bp-desktop: 1024px;

  /* ═══════════════════════════════════════════════
     Nav Tokens
     ═══════════════════════════════════════════════ */
  --nav-height: 56px;
  --nav-bg: var(--bg-canvas);
  --nav-link-color: var(--color-text-secondary);
  --nav-link-hover: var(--color-text-primary);
  --nav-link-size: var(--font-size-body-sm);

  /* ═══════════════════════════════════════════════
     Backward-Compatible Aliases (Open Props naming)
     ═══════════════════════════════════════════════ */
  --brand: var(--color-brand);
  --brand-hover: var(--color-brand-hover);
  --brand-light: var(--color-brand-light);
  --brand-pale: var(--color-brand-pale);
  --brand-deep: var(--color-brand-deep);
  --text-primary: var(--color-text-primary);
  --text-secondary: var(--color-text-secondary);
  --text-muted: var(--color-text-muted);
  --bg-base: var(--bg-canvas);
  --bg-surface: var(--surface-1);
  --bg-card: var(--surface-2);
  --bg-elevated: var(--surface-1);
  --bg-hover: var(--surface-3);
  --border: var(--color-border);
  --border-hover: var(--color-border-hover);
  --border-strong: var(--color-border-strong);
  --edge-highlight: var(--color-edge-highlight);
  --overlay: var(--color-overlay);
  --error: var(--color-error);
  --error-subtle: var(--color-error-subtle);
  --success: var(--color-success);
  --success-subtle: var(--color-success-subtle);
  --warning: var(--color-warning);
  --warning-subtle: var(--color-warning-subtle);
  --info: var(--color-info);
  --info-subtle: var(--color-info-subtle);
}

/* ═══════════════════════════════════════════════
   Light Mode
   ═══════════════════════════════════════════════ */
[data-theme="light"] {
  --bg-canvas: #f8f9fa;
  --surface-1: #ffffff;
  --surface-2: #f1f3f5;
  --surface-3: #e9ecef;

  --color-brand: #4263eb;
  --color-brand-hover: #3b5bdb;
  --color-brand-light: #5c7cfa;
  --color-brand-pale: #748ffc;
  --color-brand-deep: #e7e9fb;

  --color-text-primary: #12131a;
  --color-text-secondary: #626676;
  --color-text-muted: #8e92a2;

  --color-border: rgba(18, 19, 26, 0.08);
  --color-border-hover: rgba(18, 19, 26, 0.12);
  --color-border-strong: rgba(18, 19, 26, 0.16);
  --color-edge-highlight: rgba(255, 255, 255, 0.5);

  --color-overlay: rgba(0, 0, 0, 0.3);

  --color-success: #16a34a;
  --color-success-subtle: rgba(22, 163, 74, 0.08);
  --color-error: #dc2626;
  --color-error-subtle: rgba(220, 38, 38, 0.08);
  --color-warning: #d97706;
  --color-warning-subtle: rgba(217, 119, 6, 0.08);
  --color-info: #2563eb;
  --color-info-subtle: rgba(37, 99, 235, 0.08);

  --shadow-elevated: 0 0 0 1px rgba(18, 19, 26, 0.08);
}
`);
  return sheet;
}
