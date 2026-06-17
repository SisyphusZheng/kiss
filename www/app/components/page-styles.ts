/**
 * Shared page styles for www documentation routes.
 *
 * Scope: docs typography, prose width, code, tables, callouts, and simple
 * content navigation. Product components still come from @openelement/ui.
 */
import { StyleSheet } from '@openelement/core/style-sheet';

export const pageStyles = `
  :host {
    display: block;
    --content-width: 760px;
    --content-max-width: 1120px;
    --toc-width: 228px;
    --underline-offset: 3px;
    --border-hairline: 1px;
    color: var(--text-primary, #101828);
  }

  * {
    box-sizing: border-box;
  }

  .container {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: var(--size-10) var(--size-6) var(--size-16);
    overflow-wrap: break-word;
    word-break: break-word;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-2);
  }

  .table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: var(--size-4) 0;
  }

  h1 {
    font-size: var(--font-size-7);
    font-weight: var(--font-weight-9);
    letter-spacing: 0;
    margin: 0 0 var(--size-3);
    color: var(--text-primary, #101828);
    line-height: 1.05;
  }

  h2 {
    font-size: var(--font-size-5);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    margin: var(--size-10) 0 var(--size-4);
    color: var(--text-primary, #101828);
    padding-bottom: var(--size-2);
    border-bottom: var(--border-hairline) solid var(--border, rgba(16,24,40,0.12));
    line-height: 1.12;
  }

  h3 {
    font-size: var(--font-size-4);
    font-weight: var(--font-weight-7);
    letter-spacing: 0;
    margin: var(--size-6) 0 var(--size-2);
    color: var(--text-primary, #101828);
    line-height: 1.22;
  }

  h4 {
    font-size: var(--font-size-3);
    font-weight: var(--font-weight-6);
    margin: var(--size-4) 0 var(--size-2);
    color: var(--text-primary, #101828);
    line-height: 1.3;
  }

  h5,
  h6 {
    font-size: var(--font-size-1);
    font-weight: var(--font-weight-6);
    margin: var(--size-3) 0 var(--size-1);
    color: var(--text-secondary, #475467);
    line-height: 1.35;
  }

  .subtitle {
    color: var(--text-secondary, #475467);
    margin-bottom: var(--size-10);
    font-size: var(--font-size-2);
    line-height: 1.6;
  }

  p {
    line-height: 1.72;
    margin: var(--size-2) 0;
    color: var(--text-primary, #101828);
    font-size: var(--font-size-1);
  }

  strong {
    color: var(--text-primary, #101828);
    font-weight: var(--font-weight-7);
  }

  em {
    font-style: italic;
  }

  a {
    color: var(--brand, #1d4ed8);
    text-decoration: underline;
    text-underline-offset: var(--underline-offset);
    text-decoration-color: rgba(29,78,216,0.34);
    text-decoration-thickness: var(--border-size-1);
    transition: color var(--ease-2) var(--duration-2), text-decoration-color var(--ease-2) var(--duration-2);
  }

  a:hover {
    color: var(--brand-hover, #1e40af);
    text-decoration-color: currentColor;
  }

  .section-label {
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    color: var(--brand, #1d4ed8);
    text-transform: uppercase;
    letter-spacing: 0;
    margin-bottom: var(--size-3);
  }

  .section-divider {
    border: none;
    height: 1px;
    background: var(--border, rgba(16,24,40,0.12));
    margin: var(--size-10) 0;
  }

  pre {
    background: var(--bg-code, #111827);
    color: #d1d5db;
    padding: var(--size-5) var(--size-6);
    border-radius: var(--radius-2);
    overflow-x: auto;
    font-size: var(--font-size-0);
    line-height: 1.7;
    margin: var(--size-4) 0;
    border: var(--border-hairline) solid var(--code-border, rgba(255,255,255,0.12));
    box-shadow: none;
  }

  code {
    font-family: var(--font-mono);
  }

  p code,
  li code,
  .inline-code {
    background: rgba(29,78,216,0.08);
    padding: 0.14rem 0.36rem;
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    color: var(--brand, #1d4ed8);
    border: var(--border-hairline) solid rgba(29,78,216,0.12);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: var(--size-3) 0 var(--size-6);
    font-size: var(--font-size-0);
    background: var(--surface-1, #ffffff);
  }

  th,
  td {
    border: var(--border-hairline) solid var(--border, rgba(16,24,40,0.12));
    padding: var(--size-2) var(--size-3);
    text-align: left;
    vertical-align: top;
  }

  th {
    font-weight: var(--font-weight-7);
    color: var(--text-primary, #101828);
    background: var(--surface-2, #eef2f7);
  }

  td {
    color: var(--text-secondary, #475467);
  }

  tr:nth-child(even) td {
    background: rgba(16,24,40,0.025);
  }

  .callout,
  .pillar {
    padding: var(--size-4) var(--size-5);
    margin: var(--size-4) 0;
    border: var(--border-hairline) solid var(--border, rgba(16,24,40,0.12));
    border-left: var(--border-size-3) solid var(--brand, #1d4ed8);
    background: var(--surface-1, #ffffff);
    border-radius: var(--radius-2);
  }

  .callout.warn {
    border-left-color: var(--warning, #b45309);
  }

  .callout.info {
    border-left-color: var(--info, #0369a1);
  }

  .pillar .num {
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
    letter-spacing: 0;
    color: var(--brand, #1d4ed8);
    margin-bottom: var(--size-1);
  }

  .pillar h3 {
    margin: 0 0 var(--size-2);
  }

  .hard-constraint {
    display: inline-block;
    background: rgba(29,78,216,0.08);
    border: var(--border-hairline) solid rgba(29,78,216,0.18);
    color: var(--brand, #1d4ed8);
    padding: var(--size-1) var(--size-2);
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    margin: var(--size-1) 0;
  }

  ul,
  ol {
    padding-left: var(--size-5);
    color: var(--text-secondary, #475467);
    line-height: 1.7;
    font-size: var(--font-size-1);
  }

  li {
    margin: var(--size-1) 0;
  }

  .nav-row {
    margin-top: var(--size-10);
    padding-top: var(--size-4);
    border-top: var(--border-hairline) solid var(--border, rgba(16,24,40,0.12));
    display: flex;
    justify-content: space-between;
    gap: var(--size-3);
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--toc-width);
    gap: var(--size-8);
    align-items: start;
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: var(--size-6) var(--size-4);
  }

  .content-grid .container {
    max-width: none;
    margin: 0;
    padding: 0;
  }

  @media (max-width: 1100px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 900px) {
    .container {
      padding: var(--size-8) var(--size-5) var(--size-12);
    }

    h1 {
      font-size: var(--font-size-6);
    }

    h2 {
      font-size: var(--font-size-4);
    }

    .subtitle {
      margin-bottom: var(--size-8);
      font-size: var(--font-size-1);
    }

    p {
      font-size: var(--font-size-0);
    }

    pre {
      padding: var(--size-4) var(--size-5);
      font-size: var(--font-size-00);
    }

    .nav-row {
      flex-direction: column;
    }
  }

  @media (max-width: 480px) {
    .container {
      padding: var(--size-6) var(--size-4) var(--size-10);
    }

    h1 {
      font-size: var(--font-size-5);
    }

    h2 {
      font-size: var(--font-size-3);
    }

    p,
    ul,
    ol {
      font-size: var(--font-size-0);
    }

    ul,
    ol {
      padding-left: var(--size-4);
    }
  }

  :focus-visible {
    outline: 2px solid var(--brand, #1d4ed8);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    a {
      transition: none;
    }
  }
`;

export const pageStylesSheet = new StyleSheet();
pageStylesSheet.replaceSync(pageStyles);
