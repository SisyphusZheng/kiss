/**
 * Docs landing page - Web Standards Lab entry desk.
 */
export const meta = { section: 'Quick Start', label: 'Docs', order: 0 };
export const tagName = 'page-docs';

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
    color: #101828;
  }

  * {
    box-sizing: border-box;
  }

  .shell {
    max-width: 1180px;
    margin: 0 auto;
    padding: 58px 32px 84px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 0.92fr) minmax(360px, 0.58fr);
    gap: 42px;
    align-items: end;
    padding-bottom: 32px;
    border-bottom: 1px solid rgba(16,24,40,0.12);
  }

  .kicker {
    margin: 0 0 14px;
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  h1 {
    margin: 0;
    color: #101828;
    font-size: 56px;
    line-height: 1.02;
    letter-spacing: 0;
  }

  .lede {
    max-width: 720px;
    margin: 18px 0 0;
    color: #475467;
    font-size: 18px;
    line-height: 1.62;
  }

  .spec {
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    padding: 18px;
  }

  .spec-row {
    display: grid;
    grid-template-columns: 118px 1fr;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(16,24,40,0.08);
    font-size: 13px;
  }

  .spec-row:last-child {
    border-bottom: 0;
  }

  .spec-key {
    color: #1d4ed8;
    font-weight: 800;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .spec-value {
    color: #475467;
    line-height: 1.45;
  }

  .paths {
    margin-top: 34px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .card-link {
    min-height: 196px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    padding: 22px;
    text-decoration: none;
    color: inherit;
  }

  .card-link:hover {
    border-color: rgba(29,78,216,0.34);
  }

  .num {
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 800;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .card-title {
    margin: 22px 0 10px;
    color: #101828;
    font-size: 21px;
    line-height: 1.16;
  }

  .card-desc {
    margin: 0;
    color: #667085;
    font-size: 14px;
    line-height: 1.56;
  }

  .reference {
    margin-top: 46px;
    display: grid;
    grid-template-columns: minmax(0, 0.72fr) minmax(0, 1fr);
    gap: 16px;
  }

  .panel {
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    padding: 24px;
  }

  .panel.dark {
    background: #111827;
    color: #e5e7eb;
    border-color: #111827;
  }

  .panel h2 {
    margin: 0 0 16px;
    color: inherit;
    font-size: 22px;
    letter-spacing: 0;
  }

  .panel p {
    margin: 0;
    color: #667085;
    font-size: 14px;
    line-height: 1.62;
  }

  .panel.dark p {
    color: #cbd5e1;
  }

  .route-list {
    display: grid;
    gap: 10px;
  }

  .route {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 14px;
    align-items: start;
    padding: 12px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    background: rgba(255,255,255,0.04);
  }

  .route code {
    color: #93c5fd;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 12px;
  }

  .route span {
    color: #d1d5db;
    font-size: 13px;
    line-height: 1.5;
  }

  .workflow {
    display: grid;
    gap: 12px;
  }

  .workflow-item {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid rgba(16,24,40,0.08);
  }

  .workflow-item:last-child {
    border-bottom: 0;
  }

  .workflow-item strong {
    color: #047857;
    font-size: 13px;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .workflow-item span {
    color: #475467;
    font-size: 14px;
    line-height: 1.55;
  }

  @media (max-width: 960px) {
    .hero,
    .reference {
      grid-template-columns: 1fr;
    }

    .paths {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 620px) {
    .shell {
      padding: 38px 18px 64px;
    }

    h1 {
      font-size: 42px;
      line-height: 1.06;
    }

    .paths,
    .route,
    .workflow-item,
    .spec-row {
      grid-template-columns: 1fr;
    }
  }
`);

export class DocsPage extends OpenElement {
  static override styles = [linearTokenSheet, sheet];

  override render() {
    return (
      <div class="shell">
        <section class="hero">
          <div>
            <p class="kicker">Documentation entry desk</p>
            <h1>Find the contract, then follow the route.</h1>
            <p class="lede">
              openElement docs are organized like an engineering workspace:
              build paths, API surface, architecture decisions, and release
              truth sit next to each other.
            </p>
          </div>
          <aside class="spec" aria-label="Documentation scope">
            <div class="spec-row">
              <span class="spec-key">Product</span>
              <span class="spec-value">Elements + UI + Framework + Protocols</span>
            </div>
            <div class="spec-row">
              <span class="spec-key">Current</span>
              <span class="spec-value">v0.40.7, 11-package public product line</span>
            </div>
            <div class="spec-row">
              <span class="spec-key">Default</span>
              <span class="spec-value">Static DSD first, islands when interaction is required</span>
            </div>
          </aside>
        </section>

        <nav class="paths" aria-label="Documentation paths">
          <a class="card-link" href="/guide/getting-started">
            <div>
              <span class="num">01</span>
              <h2 class="card-title">Build an app</h2>
              <p class="card-desc">Create a project and move through routes, layouts, islands, content, i18n, and deployment.</p>
            </div>
          </a>
          <a class="card-link" href="/apilist">
            <div>
              <span class="num">02</span>
              <h2 class="card-title">Read the API</h2>
              <p class="card-desc">Inspect package exports, framework helpers, component APIs, and public contracts.</p>
            </div>
          </a>
          <a class="card-link" href="/architecture/architecture">
            <div>
              <span class="num">03</span>
              <h2 class="card-title">Inspect architecture</h2>
              <p class="card-desc">Follow package boundaries, rendering decisions, adapter responsibilities, and product doctrine.</p>
            </div>
          </a>
          <a class="card-link" href="/roadmap">
            <div>
              <span class="num">04</span>
              <h2 class="card-title">Check roadmap truth</h2>
              <p class="card-desc">See what is shipped, active, planned, and intentionally outside the current scope.</p>
            </div>
          </a>
        </nav>

        <section class="reference">
          <div class="panel dark">
            <h2>Fast routes</h2>
            <div class="route-list">
              <div class="route">
                <code>/guide/getting-started</code>
                <span>first project, app shell, pages, and deployment path</span>
              </div>
              <div class="route">
                <code>/architecture/dsd</code>
                <span>Declarative Shadow DOM, static output, and hydration intent</span>
              </div>
              <div class="route">
                <code>/architecture/package-compatibility</code>
                <span>package graph and compatibility boundaries</span>
              </div>
              <div class="route">
                <code>/apilist</code>
                <span>current API index across public packages</span>
              </div>
            </div>
          </div>

          <div class="panel">
            <h2>How to use this site</h2>
            <div class="workflow">
              <div class="workflow-item">
                <strong>Build</strong>
                <span>Start with the guide when the question is "how do I ship a page?"</span>
              </div>
              <div class="workflow-item">
                <strong>Verify</strong>
                <span>Use API and architecture pages when you need contract-level precision.</span>
              </div>
              <div class="workflow-item">
                <strong>Decide</strong>
                <span>Use roadmap and changelog pages to avoid stale assumptions about scope.</span>
              </div>
              <div class="workflow-item">
                <strong>Contribute</strong>
                <span>Use architecture and contributing pages before changing package boundaries.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

customElements.define(tagName, DocsPage);
export default DocsPage;
