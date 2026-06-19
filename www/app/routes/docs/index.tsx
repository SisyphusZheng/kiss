/**
 * Docs landing page - Web Standards Lab reference desk.
 */
export const meta = { section: 'Quick Start', label: 'Docs', order: 0 };
export const tagName = 'page-docs';

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-card';
import '@openelement/ui/open-input';
import '@openelement/ui/open-lab-panel';
import '@openelement/ui/open-standards-visual';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
  }

  * {
    box-sizing: border-box;
  }

  .desk {
    width: 100%;
    margin-inline: auto;
    padding-block: 0 var(--site-section-block);
  }

  .hero {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, .56fr) minmax(360px, .44fr);
    gap: 0;
    align-items: stretch;
    min-height: 480px;
    padding-block-end: 0;
    border-block-end: var(--border-size-1) solid var(--border);
    background:
      linear-gradient(126deg, color-mix(in srgb, var(--violet-2) 42%, transparent), transparent 54%),
      color-mix(in srgb, var(--bg-base) 86%, var(--violet-0));
    overflow: hidden;
  }

  .hero::after {
    content: "";
    position: absolute;
    inset-inline-end: var(--size-8);
    inset-block: 50% auto;
    width: 360px;
    aspect-ratio: 1;
    transform: translateY(-50%);
    border: var(--size-6) solid color-mix(in srgb, var(--brand) 24%, transparent);
    border-radius: var(--radius-round);
    opacity: .32;
    pointer-events: none;
    z-index: 0;
  }

  .hero > div:first-child {
    display: grid;
    align-content: end;
    position: relative;
    z-index: 1;
    padding: var(--size-10) var(--size-8);
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .hero open-lab-panel {
    position: relative;
    z-index: 1;
  }

  .kicker,
  .index {
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .kicker,
  .index {
    color: var(--brand);
  }

  .kicker {
    margin: 0 0 var(--size-4);
  }

  h1,
  h2,
  h3,
  p {
    margin-block-start: 0;
  }

  h1 {
    margin-block-end: 0;
    font-size: var(--font-size-6);
    line-height: .92;
    letter-spacing: 0;
    font-weight: var(--font-weight-9);
  }

  .lede {
    max-width: 720px;
    margin-block: var(--size-6) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-2);
    line-height: 1.24;
    font-weight: var(--font-weight-5);
  }

  .spec-list,
  .workflow-list,
  .command-list {
    display: grid;
    gap: var(--size-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .spec-list li,
  .workflow-item,
  .command-list li {
    display: grid;
    grid-template-columns: minmax(110px, .34fr) minmax(0, 1fr);
    gap: var(--size-3);
    padding-block: var(--size-3);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .spec-list li:last-child,
  .workflow-item:last-child,
  .command-list li:last-child {
    border-block-end: 0;
  }

  .spec-list strong,
  .workflow-item strong,
  .command-list strong {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .spec-list span,
  .workflow-item span,
  .command-list span {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .command {
    display: grid;
    gap: var(--size-4);
  }

  .command__header {
    display: grid;
    gap: var(--size-3);
  }

  .paths {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    width: min(1120px, calc(100% - var(--size-10)));
    margin-inline: auto;
    margin-block-start: 0;
    border-block-end: var(--border-size-1) solid var(--border);
    gap: var(--size-4);
    padding: var(--size-8) 0 var(--size-5);
  }

  .path-link {
    color: inherit;
    text-decoration: none;
  }

  .path-link:focus-visible {
    outline: var(--border-size-2) solid var(--brand);
    outline-offset: var(--size-1);
    border-radius: var(--radius-2);
  }

  .path-card {
    min-height: 230px;
    background: color-mix(in srgb, var(--bg-card) 84%, transparent);
  }

  .path-card h2,
  .panel-title {
    margin-block: var(--size-5) var(--size-3);
    color: var(--text-primary);
    font-size: var(--font-size-3);
    line-height: 1.05;
    letter-spacing: 0;
  }

  .path-card p,
  .panel-copy {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
    margin-block-end: 0;
  }

  .reference {
    display: grid;
    grid-template-columns: minmax(0, .92fr) minmax(0, 1fr);
    gap: var(--size-5);
    width: min(1120px, calc(100% - var(--size-10)));
    margin-inline: auto;
    padding: var(--size-5) 0 var(--size-10);
    margin-block-start: 0;
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .route-panel {
    --panel-min-height: 420px;
  }

  .workflow-panel h2 {
    margin-block: 0 var(--size-4);
    font-size: var(--font-size-3);
    letter-spacing: 0;
  }

  @media (max-width: 1120px) {
    .hero,
    .reference {
      grid-template-columns: 1fr;
    }

    .paths {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: min(100% - var(--size-8), 1120px);
    }

    .reference {
      width: min(100% - var(--size-8), 1120px);
    }
  }

  @media (max-width: 640px) {
    .desk {
      padding-block-start: var(--size-5);
    }

    .hero {
      padding-block-end: var(--size-5);
    }

    h1 {
      font-size: var(--font-size-6);
    }

    .lede {
      margin-block-start: var(--size-4);
      font-size: var(--font-size-1);
    }

    .paths {
      margin-block-start: var(--size-5);
    }

    .paths,
    .spec-list li,
    .workflow-item,
    .command-list li {
      grid-template-columns: 1fr;
    }
  }
`);

const paths = [
  ['01', 'Build an app', 'Project, routes, layouts, islands, content, i18n, and deployment.', '/guide/getting-started'],
  ['02', 'Read the API', 'Package exports, framework helpers, and public contracts.', '/apilist'],
  ['03', 'Inspect architecture', 'Package boundaries, DSD, islands, adapters, and product doctrine.', '/architecture/architecture'],
  ['04', 'Check roadmap truth', 'Shipped, current, planned, and intentionally out-of-scope work.', '/roadmap'],
];

const workflow = [
  ['Build', 'Start with the guide when the question is how to ship a page.'],
  ['Verify', 'Use API and architecture pages for contract-level precision.'],
  ['Decide', 'Use roadmap and changelog pages to avoid stale assumptions.'],
  ['Contribute', 'Read architecture before changing package boundaries.'],
];

const commands = [
  ['route', '/guide/getting-started'],
  ['api', '/apilist'],
  ['graph', '/architecture/architecture'],
];

export class DocsPage extends OpenElement {
  static override styles = [openPropsTokenSheet, pageSheet];

  override render() {
    return (
      <main class='desk'>
        <section class='hero'>
          <div>
            <p class='kicker'>Documentation entry desk</p>
            <h1>Find the contract, then follow the route.</h1>
            <p class='lede'>
              openElement docs are organized like an engineering workspace:
              build paths, API surface, architecture decisions, and release
              truth sit next to each other.
            </p>
          </div>
          <open-lab-panel label='command palette' meta='docs nav'>
            <div class='command'>
              <div class='command__header'>
                <open-input value='Search routes, APIs, package graph' readonly></open-input>
                <open-badge tone='brand'>reference desk</open-badge>
              </div>
              <ul class='command-list'>
                {commands.map(([label, href]) => (
                  <li>
                    <strong>{label}</strong>
                    <span>{href}</span>
                  </li>
                ))}
              </ul>
            </div>
          </open-lab-panel>
        </section>

        <nav class='paths' aria-label='Documentation paths'>
          {paths.map(([index, title, copy, href]) => (
            <a class='path-link' href={href}>
              <open-card class='path-card'>
                <span class='index'>{index}</span>
                <h2>{title}</h2>
                <p>{copy}</p>
              </open-card>
            </a>
          ))}
        </nav>

        <section class='reference'>
          <open-lab-panel class='route-panel' variant='artifact' label='route graph' meta='fast paths'>
            <open-standards-visual variant='routes' emphasis='high' motion='auto'></open-standards-visual>
          </open-lab-panel>

          <open-lab-panel class='workflow-panel' label='usage workflow' meta='docs as product'>
            <h2>How to use this site</h2>
            <div class='workflow-list'>
              {workflow.map(([label, copy]) => (
                <div class='workflow-item'>
                  <strong>{label}</strong>
                  <span>{copy}</span>
                </div>
              ))}
            </div>
          </open-lab-panel>
        </section>
      </main>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, DocsPage);
}

export default DocsPage;
