import { LitElement, html, css } from '@kissjs/core'

/**
 * Shared page styles for all doc content pages.
 */
export const pageStyles = css`
  :host { display: block; }

  .container {
    max-width: 720px;
    padding: 2.5rem 2.5rem 4rem;
  }

  h1 {
    font-size: 2.25rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin: 0 0 0.5rem;
    color: #fff;
    line-height: 1.15;
  }

  .subtitle {
    color: #666;
    margin-bottom: 2.5rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    letter-spacing: 0.01em;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 2.5rem 0 0.75rem;
    color: #fff;
    letter-spacing: -0.01em;
  }

  h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem;
    color: #ccc;
  }

  p {
    line-height: 1.7;
    margin: 0.5rem 0;
    color: #999;
  }

  strong {
    color: #ccc;
    font-weight: 600;
  }

  em {
    color: #bbb;
    font-style: italic;
  }

  a {
    color: #ccc;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.15s;
  }

  a:hover {
    color: #fff;
  }

  /* Code blocks */
  pre {
    background: #111;
    color: #c8c8c8;
    padding: 1.25rem 1.5rem;
    border-radius: 3px;
    overflow-x: auto;
    font-size: 0.8125rem;
    line-height: 1.65;
    margin: 1rem 0;
    border: 1px solid #1a1a1a;
  }

  code {
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  }

  p code, li code {
    background: #111;
    padding: 0.125rem 0.375rem;
    border-radius: 2px;
    font-size: 0.8125rem;
    color: #ccc;
    border: 1px solid #1a1a1a;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0 1.5rem;
    font-size: 0.8125rem;
  }

  th, td {
    border: 1px solid #1a1a1a;
    padding: 0.625rem 0.875rem;
    text-align: left;
  }

  th {
    background: #111;
    font-weight: 600;
    color: #ccc;
  }

  td {
    color: #888;
  }

  /* Pillar blocks */
  .pillar {
    padding: 1.25rem 1.5rem;
    margin: 1rem 0;
    border-left: 3px solid #333;
    background: #0f0f0f;
    border-radius: 0 3px 3px 0;
  }

  .pillar .num {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #555;
    margin-bottom: 0.375rem;
  }

  .pillar h3 {
    margin: 0 0 0.5rem;
    font-size: 1.0625rem;
    color: #fff;
  }

  /* Hard constraint tags */
  .hard-constraint {
    display: inline-block;
    background: #111;
    border: 1px solid #222;
    padding: 0.25rem 0.625rem;
    border-radius: 2px;
    font-size: 0.75rem;
    color: #888;
    margin: 0.125rem 0.125rem;
  }

  /* Lists */
  ul, ol {
    padding-left: 1.25rem;
    color: #888;
    line-height: 1.7;
  }

  li {
    margin: 0.25rem 0;
  }

  /* Warning/callout boxes */
  .callout {
    padding: 1rem 1.25rem;
    margin: 1rem 0;
    border-left: 3px solid #333;
    background: #0f0f0f;
    border-radius: 0 3px 3px 0;
  }

  .callout.warn {
    border-left-color: #555;
  }

  /* Page navigation */
  .nav-row {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid #1a1a1a;
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
    color: #888;
    text-decoration: none;
    border: 1px solid #1a1a1a;
    border-radius: 2px;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    letter-spacing: 0.01em;
  }

  .nav-link:hover {
    color: #fff;
    border-color: #333;
    background: #111;
  }
`
