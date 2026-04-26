import { css } from '@kissjs/core';

/**
 * KISS Docs — Shared Page Styles
 *
 * Academic, modern, restrained.
 * Typography drives hierarchy. Borders are whispers.
 */
export const pageStyles = css`
  :host {
    display: block;
  }

  .container {
    max-width: 720px;
    padding: 3rem 3rem 5rem;
  }

  h1 {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin: 0 0 0.5rem;
    color: var(--text-primary);
    line-height: 1.2;
  }

  .subtitle {
    color: var(--text-secondary);
    margin-bottom: 3rem;
    font-size: 0.9375rem;
    line-height: 1.7;
    letter-spacing: 0.01em;
  }

  h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 3rem 0 0.75rem;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    margin: 2rem 0 0.5rem;
    color: var(--accent-dim);
  }

  p {
    line-height: 1.75;
    margin: 0.75rem 0;
    color: var(--text-secondary);
    font-size: 0.9375rem;
  }

  strong {
    color: var(--text-primary);
    font-weight: 600;
  }

  em {
    color: var(--accent-dim);
    font-style: italic;
  }

  a {
    color: var(--text-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--border-hover);
    text-decoration-thickness: 1px;
    transition: text-decoration-color 0.15s;
  }

  a:hover {
    text-decoration-color: var(--text-primary);
  }

  /* Code */
  pre {
    background: var(--code-bg);
    color: var(--text-secondary);
    padding: 1.25rem 1.5rem;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 0.8125rem;
    line-height: 1.7;
    margin: 1.25rem 0;
    border: 1px solid var(--code-border);
  }

  code {
    font-family: "SF Mono", "Fira Code", "Consolas", monospace;
  }

  p code, li code {
    background: var(--code-bg);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-size: 0.8125rem;
    color: var(--accent-dim);
    border: 1px solid var(--code-border);
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.25rem 0 1.5rem;
    font-size: 0.8125rem;
  }

  th, td {
    border: 1px solid var(--border);
    padding: 0.75rem 1rem;
    text-align: left;
  }

  th {
    background: var(--bg-elevated);
    font-weight: 600;
    color: var(--accent-dim);
    font-size: 0.75rem;
    letter-spacing: 0.02em;
  }

  td {
    color: var(--text-secondary);
  }

  /* Callout blocks */
  .pillar {
    padding: 1.25rem 1.5rem;
    margin: 1.25rem 0;
    border-left: 2px solid var(--border-hover);
    background: var(--bg-surface);
    border-radius: 0 6px 6px 0;
  }

  .pillar .num {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
  }

  .pillar h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: var(--text-primary);
  }

  .hard-constraint {
    display: inline-block;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    padding: 0.25rem 0.625rem;
    border-radius: 3px;
    font-size: 0.6875rem;
    color: var(--text-secondary);
    margin: 0.125rem;
  }

  /* Lists */
  ul, ol {
    padding-left: 1.25rem;
    color: var(--text-secondary);
    line-height: 1.75;
  }

  li {
    margin: 0.375rem 0;
  }

  .callout {
    padding: 1rem 1.25rem;
    margin: 1.25rem 0;
    border-left: 2px solid var(--border-hover);
    background: var(--bg-surface);
    border-radius: 0 6px 6px 0;
  }

  .callout.warn {
    border-left-color: var(--text-tertiary);
  }

  /* Page nav */
  .nav-row {
    margin-top: 4rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-secondary);
    text-decoration: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    letter-spacing: 0.01em;
  }

  .nav-link:hover {
    color: var(--text-primary);
    border-color: var(--border-hover);
    background: var(--accent-subtle);
  }
`;
