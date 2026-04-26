import { css } from '@kissjs/core';

/**
 * KISS Docs — Shared Page Styles
 *
 * Academic, modern, restrained.
 * Typography drives hierarchy. Borders are whispers.
 *
 * These styles are the SINGLE SOURCE OF TRUTH for all doc pages.
 * Route files should NOT re-define .container, h1, .subtitle, h2, p, pre,
 * code, .inline-code, table/th/td, or .nav-row — they're all here.
 * Only page-specific components (e.g. .step, .constraint, .platform-card)
 * should have local styles.
 */
export const pageStyles = css`
  :host {
    display: block;
  }

  .container {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.5rem 3rem;
  }

  h1 {
    font-size: 2.25rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin: 0 0 0.5rem;
    color: var(--kiss-text-primary);
    line-height: 1.2;
  }

  .subtitle {
    color: var(--kiss-text-tertiary);
    margin-bottom: 3rem;
    font-size: 0.9375rem;
    line-height: 1.7;
  }

  h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 1.5rem 0 0.75rem;
    color: var(--kiss-text-primary);
  }

  h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem;
    color: var(--kiss-accent-dim);
  }

  p {
    line-height: 1.7;
    margin: 0.5rem 0;
    color: var(--kiss-text-secondary);
    font-size: 0.9375rem;
  }

  strong {
    color: var(--kiss-text-primary);
    font-weight: 600;
  }

  em {
    color: var(--kiss-accent-dim);
    font-style: italic;
  }

  a {
    color: var(--kiss-text-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--kiss-border-hover);
    text-decoration-thickness: 1px;
    transition: text-decoration-color 0.15s;
  }

  a:hover {
    text-decoration-color: var(--kiss-text-primary);
  }

  /* Code blocks */
  pre {
    background: var(--kiss-code-bg);
    color: var(--kiss-text-secondary);
    padding: 1rem 1.25rem;
    border-radius: 3px;
    overflow-x: auto;
    font-size: 0.8125rem;
    line-height: 1.6;
    margin: 0.75rem 0;
  }

  code {
    font-family: "SF Mono", "Fira Code", "Consolas", monospace;
  }

  .inline-code {
    background: var(--kiss-code-bg);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.875em;
  }

  p code, li code {
    background: var(--kiss-code-bg);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-size: 0.8125rem;
    color: var(--kiss-accent-dim);
    border: 1px solid var(--kiss-code-border);
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.75rem 0 1.5rem;
    font-size: 0.875rem;
  }

  th, td {
    border: 1px solid var(--kiss-border);
    padding: 0.5rem 0.75rem;
    text-align: left;
  }

  th {
    background: var(--kiss-code-bg);
    font-weight: 600;
    color: var(--kiss-accent-dim);
  }

  td {
    color: var(--kiss-text-secondary);
  }

  /* Callout blocks */
  .pillar {
    padding: 1.25rem 1.5rem;
    margin: 1rem 0;
    border-left: 3px solid var(--kiss-border-hover);
    background: var(--kiss-bg-surface);
    border-radius: 0 3px 3px 0;
  }

  .pillar .num {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--kiss-text-muted);
    margin-bottom: 0.25rem;
  }

  .pillar h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: var(--kiss-text-primary);
  }

  .hard-constraint {
    display: inline-block;
    background: var(--kiss-code-bg);
    border: 1px solid var(--kiss-border-hover);
    padding: 0.25rem 0.625rem;
    border-radius: 4px;
    font-size: 0.8125rem;
    margin: 0.125rem 0;
  }

  .callout {
    padding: 1rem 1.25rem;
    margin: 1rem 0;
    border-left: 3px solid var(--kiss-border-hover);
    background: var(--kiss-bg-surface);
    border-radius: 0 3px 3px 0;
  }

  .callout.warn {
    border-left-color: var(--kiss-text-tertiary);
  }

  /* Lists */
  ul, ol {
    padding-left: 1.25rem;
    color: var(--kiss-text-secondary);
    line-height: 1.7;
  }

  li {
    margin: 0.375rem 0;
  }

  /* Page nav */
  .nav-row {
    margin-top: 2.5rem;
    display: flex;
    justify-content: space-between;
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--kiss-text-secondary);
    text-decoration: none;
    border: 1px solid var(--kiss-border);
    border-radius: 4px;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    letter-spacing: 0.01em;
  }

  .nav-link:hover {
    color: var(--kiss-text-primary);
    border-color: var(--kiss-border-hover);
    background: var(--kiss-accent-subtle);
  }

  /* === Responsive === */
  @media (max-width: 900px) {
    .container {
      padding: 2rem 1.25rem 3rem;
    }

    h1 {
      font-size: 1.625rem;
    }

    .subtitle {
      margin-bottom: 2rem;
    }

    h2 {
      margin: 1.5rem 0 0.5rem;
    }

    pre {
      padding: 0.875rem 1rem;
      font-size: 0.75rem;
      border-radius: 4px;
    }

    table {
      font-size: 0.75rem;
    }

    th, td {
      padding: 0.5rem 0.625rem;
    }

    .pillar, .callout {
      padding: 1rem;
    }

    .nav-row {
      flex-direction: column;
      gap: 0.75rem;
    }

    .nav-link {
      text-align: center;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .container {
      padding: 1.5rem 1rem 2.5rem;
    }

    h1 {
      font-size: 1.375rem;
    }

    .subtitle {
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }

    h2 {
      font-size: 1rem;
    }

    p {
      font-size: 0.875rem;
    }

    pre {
      padding: 0.75rem;
      font-size: 0.6875rem;
      margin: 0.5rem 0;
    }

    code {
      font-size: 0.75rem;
    }

    ul, ol {
      padding-left: 1rem;
    }

    .hard-constraint {
      font-size: 0.6875rem;
      padding: 0.125rem 0.5rem;
    }
  }
`;
