/**
 * @kissjs/docs-kit - Typography Styles
 *
 * Shared typography and content styles for documentation pages.
 * Uses KISS design tokens (CSS custom properties).
 */
export const kissTypography = `
  :host { display: block; }

  .container {
    max-width: var(--kiss-content-max, 720px);
    padding: var(--kiss-space-10, 2.5rem) var(--kiss-space-10, 2.5rem) var(--kiss-space-16, 4rem);
  }

  h1 {
    font-size: var(--kiss-text-2xl, 2.25rem);
    font-weight: var(--kiss-weight-black, 800);
    letter-spacing: var(--kiss-tracking-tight, -0.03em);
    margin: 0 0 var(--kiss-space-2, 0.5rem);
    color: var(--kiss-text-bright, #fff);
    line-height: 1.15;
  }

  .subtitle {
    color: var(--kiss-text-muted, #666);
    margin-bottom: var(--kiss-space-10, 2.5rem);
    font-size: var(--kiss-text-md, 0.9375rem);
    line-height: var(--kiss-leading-relaxed, 1.7);
    letter-spacing: var(--kiss-tracking-normal, 0.01em);
  }

  h2 {
    font-size: var(--kiss-text-xl, 1.25rem);
    font-weight: var(--kiss-weight-semibold, 600);
    margin: var(--kiss-space-10, 2.5rem) 0 var(--kiss-space-3, 0.75rem);
    color: var(--kiss-text-bright, #fff);
    letter-spacing: -0.01em;
  }

  h3 {
    font-size: var(--kiss-text-lg, 1rem);
    font-weight: var(--kiss-weight-semibold, 600);
    margin: var(--kiss-space-6, 1.5rem) 0 var(--kiss-space-2, 0.5rem);
    color: var(--kiss-text, #ccc);
  }

  p {
    line-height: var(--kiss-leading-relaxed, 1.7);
    margin: var(--kiss-space-2, 0.5rem) 0;
    color: var(--kiss-text-dim, #999);
  }

  strong {
    color: var(--kiss-text, #ccc);
    font-weight: var(--kiss-weight-semibold, 600);
  }

  em {
    color: var(--kiss-text, #bbb);
    font-style: italic;
  }

  a {
    color: var(--kiss-text, #ccc);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color var(--kiss-transition-fast, 0.15s);
  }

  a:hover {
    color: var(--kiss-text-bright, #fff);
  }

  pre {
    background: var(--kiss-bg-elevated, #111);
    color: #c8c8c8;
    padding: var(--kiss-space-5, 1.25rem) var(--kiss-space-6, 1.5rem);
    border-radius: var(--kiss-radius-lg, 3px);
    overflow-x: auto;
    font-size: var(--kiss-text-base, 0.8125rem);
    line-height: 1.65;
    margin: var(--kiss-space-4, 1rem) 0;
    border: 1px solid var(--kiss-border, #1a1a1a);
    font-family: var(--kiss-font-mono);
  }

  code {
    font-family: var(--kiss-font-mono);
  }

  p code, li code {
    background: var(--kiss-bg-elevated, #111);
    padding: 0.125rem 0.375rem;
    border-radius: var(--kiss-radius, 2px);
    font-size: var(--kiss-text-base, 0.8125rem);
    color: var(--kiss-text, #ccc);
    border: 1px solid var(--kiss-border, #1a1a1a);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: var(--kiss-space-4, 1rem) 0 var(--kiss-space-6, 1.5rem);
    font-size: var(--kiss-text-base, 0.8125rem);
  }

  th, td {
    border: 1px solid var(--kiss-border, #1a1a1a);
    padding: 0.625rem 0.875rem;
    text-align: left;
  }

  th {
    background: var(--kiss-bg-elevated, #111);
    font-weight: var(--kiss-weight-semibold, 600);
    color: var(--kiss-text, #ccc);
  }

  td {
    color: var(--kiss-text-dim, #888);
  }

  ul, ol {
    padding-left: var(--kiss-space-5, 1.25rem);
    color: var(--kiss-text-dim, #888);
    line-height: var(--kiss-leading-relaxed, 1.7);
  }

  li {
    margin: var(--kiss-space-1, 0.25rem) 0;
  }

  /* Pillar/callout blocks */
  .pillar, .callout {
    padding: var(--kiss-space-5, 1.25rem) var(--kiss-space-6, 1.5rem);
    margin: var(--kiss-space-4, 1rem) 0;
    border-left: 3px solid var(--kiss-border-subtle, #333);
    background: var(--kiss-bg-surface, #0f0f0f);
    border-radius: 0 var(--kiss-radius-lg, 3px) var(--kiss-radius-lg, 3px) 0;
  }

  .callout.warn {
    border-left-color: #555;
  }

  .hard-constraint {
    display: inline-block;
    background: var(--kiss-bg-elevated, #111);
    border: 1px solid var(--kiss-border-subtle, #222);
    padding: var(--kiss-space-1, 0.25rem) 0.625rem;
    border-radius: var(--kiss-radius, 2px);
    font-size: var(--kiss-text-sm, 0.75rem);
    color: var(--kiss-text-dim, #888);
    margin: 0.125rem;
  }

  /* Page navigation */
  .nav-row {
    margin-top: var(--kiss-space-16, 4rem);
    padding-top: var(--kiss-space-6, 1.5rem);
    border-top: 1px solid var(--kiss-border, #1a1a1a);
    display: flex;
    justify-content: space-between;
    gap: var(--kiss-space-4, 1rem);
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    padding: var(--kiss-space-2, 0.5rem) var(--kiss-space-4, 1rem);
    font-size: var(--kiss-text-base, 0.8125rem);
    font-weight: var(--kiss-weight-medium, 500);
    color: var(--kiss-text-dim, #888);
    text-decoration: none;
    border: 1px solid var(--kiss-border, #1a1a1a);
    border-radius: var(--kiss-radius, 2px);
    transition: color var(--kiss-transition-fast, 0.15s), border-color var(--kiss-transition-fast, 0.15s);
    letter-spacing: var(--kiss-tracking-normal, 0.01em);
  }

  .nav-link:hover {
    color: var(--kiss-text-bright, #fff);
    border-color: var(--kiss-border-hover, #333);
    background: var(--kiss-bg-elevated, #111);
  }
`
