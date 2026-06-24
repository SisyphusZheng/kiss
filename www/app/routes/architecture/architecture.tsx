export const meta = { section: 'Principles', label: 'Architecture', order: 10 };
export const tagName = 'engine-architecture';

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-card';
import { OPENELEMENT_VERSION } from '../../data/version.ts';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host { display: block; }
  .shell { max-width: 1160px; margin: 0 auto; padding: 58px 32px 84px; }
  .hero { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr); gap: 34px; align-items: start; padding-bottom: var(--size-8); border-bottom: 1px solid var(--color-border); }
  .eyebrow { display: flex; flex-wrap: wrap; gap: var(--size-2); margin-bottom: 20px; }
  h1 { margin: 0; color: var(--text); font-size: 58px; line-height: 1.02; letter-spacing: 0; }
  h2 { margin: 0; color: var(--text); font-size: 34px; line-height: 1.12; letter-spacing: 0; }
  h3 { margin: 0 0 var(--size-2); color: var(--text); }
  p { color: var(--text-secondary); line-height: var(--line-height-relaxed); }
  .lede { margin: 20px 0 0; font-size: var(--font-size-subhead); max-width: 650px; }
  .artifact, .layer-map { border: 1px solid var(--color-border); border-radius: var(--radius-1); overflow: hidden; background: var(--surface-1); }
  .artifact-head { display: flex; justify-content: space-between; gap: var(--size-3); padding: 14px var(--size-4); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-0); color: var(--text-muted); }
  pre { margin: 0; padding: var(--size-4); overflow-x: auto; background: var(--code-bg); color: var(--code-text); font-size: var(--font-size-0); line-height: 1.65; }
  code { font-family: "JetBrains Mono", "SF Mono", "Consolas", monospace; }
  .section { padding: 40px 0 0; }
  .section-head { display: flex; justify-content: space-between; gap: var(--size-6); margin-bottom: 20px; }
  .kicker { margin: 0 0 var(--size-2); color: var(--color-brand); font-size: var(--font-size-0); font-weight: 800; text-transform: uppercase; }
  .section-copy { max-width: 460px; margin: 0; font-size: var(--font-size-2); }
  .layer { display: grid; grid-template-columns: 170px 1fr 180px; gap: var(--size-4); padding: 14px var(--size-4); border-bottom: 1px solid var(--color-border); align-items: start; }
  .layer:last-child { border-bottom: 0; }
  .layer strong { color: var(--text); font-size: var(--font-size-1); }
  .layer span, .layer p { margin: 0; color: var(--text-secondary); font-size: var(--font-size-0); line-height: 1.55; }
  .cards, .gate-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--size-3); }
  .gate-grid { grid-template-columns: 1fr 1fr; }
  .gate { display: grid; grid-template-columns: 120px 1fr; gap: var(--size-3); align-items: start; padding: var(--size-4); border: 1px solid var(--color-border); border-radius: var(--radius-1); background: var(--surface-1); }
  .gate strong { color: var(--color-brand); font-size: var(--font-size-1); }
  .gate span { color: var(--text-secondary); font-size: var(--font-size-0); line-height: 1.55; }
  .nav-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: var(--size-8); }
  @media (max-width: 900px) {
    .hero, .cards, .gate-grid { grid-template-columns: 1fr; }
    .layer { grid-template-columns: 1fr; gap: var(--size-2); }
    h1 { font-size: 42px; line-height: 1.06; }
    h2 { font-size: 28px; }
  }
  @media (max-width: 560px) {
    .shell { padding: var(--size-8) var(--size-4) 56px; }
    .section-head, .gate { grid-template-columns: 1fr; display: grid; }
  }
`);

const PACKAGE_GRAPH = `product surfaces
  @openelement/element
  @openelement/ui
  @openelement/app
  @openelement/create
  @openelement/protocol

foundation
  @openelement/core
  @openelement/signal
  @openelement/router
  @openelement/content
  @openelement/ssg
  @openelement/adapter-vite`;

export class ArchitecturePage extends OpenElement {
  declare locale?: string;

  static override styles = [pageSheet];

  override render() {
    return (
      <div class='shell'>
        <section class='hero'>
          <div>
            <div class='eyebrow'>
              <open-badge>ADR-0105</open-badge>
              <open-badge>{OPENELEMENT_VERSION}</open-badge>
              <open-badge tone='success'>11-package graph</open-badge>
            </div>
            <h1>Current Architecture</h1>
            <p class='lede'>
              openElement is organized as Elements + UI + Framework + Protocols. The v0.41
              package graph is intentionally small: five product-facing packages and six
              foundation packages. SSG is retained as an adapter-agnostic engine; Vite and Nitro
              stay behind the Framework boundary.
            </p>
          </div>
          <div class='artifact'>
            <div class='artifact-head'>
              <strong>package graph</strong>
              <span>v0.41.0-alpha.2 current truth</span>
            </div>
            <pre><code>{PACKAGE_GRAPH}</code></pre>
          </div>
        </section>

        <section class='section'>
          <div class='section-head'>
            <div>
              <p class='kicker'>layers</p>
              <h2>Package ownership is part of the API.</h2>
            </div>
            <p class='section-copy'>
              {OPENELEMENT_VERSION} keeps user-facing imports narrow and moves supporting behavior
              behind explicit foundation packages.
            </p>
          </div>
          <div class='layer-map'>
            <div class='layer'>
              <strong>authoring</strong>
              <span>@openelement/element</span>
              <p>Canonical component facade for OpenElement, StyleSheet, signals, and islands.</p>
            </div>
            <div class='layer'>
              <strong>framework</strong>
              <span>@openelement/app, @openelement/create</span>
              <p>Pages, layouts, islands, starter generation, Vite bridge, and app i18n plugin.</p>
            </div>
            <div class='layer'>
              <strong>ui</strong>
              <span>@openelement/ui</span>
              <p>First-party open-* components built on the Elements model.</p>
            </div>
            <div class='layer'>
              <strong>protocols</strong>
              <span>@openelement/protocol</span>
              <p>Runtime-free contracts and conformance boundaries.</p>
            </div>
            <div class='layer'>
              <strong>foundation</strong>
              <span>core, signal, router, content, ssg, adapter-vite</span>
              <p>Implementation packages that support the four products without becoming products.</p>
            </div>
          </div>
        </section>

        <section class='section'>
          <div class='section-head'>
            <div>
              <p class='kicker'>current decisions</p>
              <h2>Small graph, explicit defaults.</h2>
            </div>
            <p class='section-copy'>
              Removed package names live only in history and release evidence, not in the current
              product graph.
            </p>
          </div>
          <div class='cards'>
            <open-card>
              <h3 slot='header' style='margin:0;font-size:var(--font-size-card-title);font-weight:var(--font-weight-5);color:var(--text)'>Why element?</h3>
              <p style='margin:0;font-size:var(--font-size-1);color:var(--text-secondary)'>
                Component authors import from one singular facade: @openelement/element. The facade
                exports OpenElement, StyleSheet, signal helpers, and authoring types.
              </p>
            </open-card>
            <open-card>
              <h3 slot='header' style='margin:0;font-size:var(--font-size-card-title);font-weight:var(--font-weight-5);color:var(--text)'>Why SSG?</h3>
              <p style='margin:0;font-size:var(--font-size-1);color:var(--text-secondary)'>
                @openelement/ssg owns route scanning, entry descriptors, rendering, and HTML
                postprocess. @openelement/adapter-vite keeps only Vite-specific glue.
              </p>
            </open-card>
            <open-card>
              <h3 slot='header' style='margin:0;font-size:var(--font-size-card-title);font-weight:var(--font-weight-5);color:var(--text)'>Why signal?</h3>
              <p style='margin:0;font-size:var(--font-size-1);color:var(--text-secondary)'>
                @preact/signals-core is the engine behind @openelement/signal.
              </p>
            </open-card>
          </div>
        </section>

        <section class='section'>
          <div class='section-head'>
            <div>
              <p class='kicker'>release gates</p>
              <h2>The architecture is checked mechanically.</h2>
            </div>
            <p class='section-copy'>
              The graph and hygiene gates reject package drift, stale current-truth language, and
              generated root residue.
            </p>
          </div>
          <div class='gate-grid'>
            <div class='gate'>
              <strong>11 packages</strong>
              <span>Release order, package surface, and workspace graph must agree.</span>
            </div>
            <div class='gate'>
              <strong>0 cycles</strong>
              <span>Internal openElement package dependencies must remain acyclic.</span>
            </div>
            <div class='gate'>
              <strong>4 workflows</strong>
              <span>CI enters through AutoFlow3, with npm publishing and monitoring separated.</span>
            </div>
            <div class='gate'>
              <strong>0 any</strong>
              <span>Active TS/TSX code, tools, tests, and www code reject explicit any.</span>
            </div>
          </div>
        </section>

        <nav class='nav-row'>
          <a style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)' href='/roadmap'>Roadmap truth {'->'}</a>
          <a style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)' href='/changelog'>Changelog {'->'}</a>
          <a style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)' href='/guide/getting-started'>Start building {'->'}</a>
        </nav>
      </div>
    );
  }
}

customElements.define(tagName, ArchitecturePage);
export default ArchitecturePage;


