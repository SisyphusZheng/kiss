/**
 * @kissjs/docs-kit - Design Tokens
 *
 * CSS custom properties for the KISS dark theme (Swiss Internationalism).
 * Based on Open Props token methodology.
 * These tokens are framework-agnostic — any CSS consumer can use them.
 */

/** KISS design tokens as CSS custom properties */
export const kissTokens = `
:root {
  /* === Colors === */
  --kiss-bg:          #0a0a0a;
  --kiss-bg-elevated: #111;
  --kiss-bg-surface:  #0f0f0f;
  --kiss-bg-hover:    rgba(255, 255, 255, 0.03);
  --kiss-bg-active:   rgba(255, 255, 255, 0.05);

  --kiss-text:        #e0e0e0;
  --kiss-text-dim:    #999;
  --kiss-text-muted:  #666;
  --kiss-text-faint:  #444;
  --kiss-text-bright: #fff;

  --kiss-border:      #1a1a1a;
  --kiss-border-subtle: #222;
  --kiss-border-hover: #333;

  /* === Typography === */
  --kiss-font-sans:   -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --kiss-font-mono:   'SF Mono', 'Fira Code', 'Consolas', monospace;

  --kiss-text-xs:     0.6875rem;
  --kiss-text-sm:     0.75rem;
  --kiss-text-base:   0.8125rem;
  --kiss-text-md:     0.9375rem;
  --kiss-text-lg:     1rem;
  --kiss-text-xl:     1.25rem;
  --kiss-text-2xl:    2.25rem;
  --kiss-text-4xl:    4.5rem;

  --kiss-weight-normal: 400;
  --kiss-weight-medium: 500;
  --kiss-weight-semibold: 600;
  --kiss-weight-bold:   700;
  --kiss-weight-black:  800;
  --kiss-weight-heavy:  900;

  --kiss-tracking-tight:  -0.03em;
  --kiss-tracking-normal: 0.01em;
  --kiss-tracking-wide:   0.02em;
  --kiss-tracking-wider:  0.1em;

  --kiss-leading-normal: 1.5;
  --kiss-leading-relaxed: 1.7;

  /* === Spacing === */
  --kiss-space-1: 0.25rem;
  --kiss-space-2: 0.5rem;
  --kiss-space-3: 0.75rem;
  --kiss-space-4: 1rem;
  --kiss-space-5: 1.25rem;
  --kiss-space-6: 1.5rem;
  --kiss-space-8: 2rem;
  --kiss-space-10: 2.5rem;
  --kiss-space-16: 4rem;

  /* === Layout === */
  --kiss-sidebar-width: 240px;
  --kiss-header-height: 56px;
  --kiss-content-max: 720px;
  --kiss-page-max: 1400px;
  --kiss-radius: 2px;
  --kiss-radius-lg: 3px;

  /* === Transitions === */
  --kiss-transition-fast: 0.15s;
  --kiss-transition-normal: 0.25s;
}
`
