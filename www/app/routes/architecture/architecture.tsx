export const meta = { section: 'Principles', label: 'Architecture', order: 10 };
export const tagName = 'engine-architecture';

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { daisyClassSheet, openPropsTokenSheet } from '@openelement/ui';
import { OPENELEMENT_VERSION } from '../../data/version.ts';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host { display: block; }
  .shell { max-width: 1120px; margin: 0 auto; padding: 44px var(--size-6) 72px; }
  .hero { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr); gap: var(--size-7); align-items: start; padding-bottom: var(--size-8); border-bottom: 1px solid var(--gray-3); }
  .eyebrow { display: flex; flex-wrap: wrap; gap: var(--size-2); margin-bottom: var(--size-5); }
  h1 { margin: 0; color: var(--gray-10); font-size: clamp(2.5rem, 7vw, 5rem); line-height: 0.95; letter-spacing: 0; }
  h2 { margin: 0; color: var(--gray-10); font-size: clamp(1.6rem, 4vw, 2.6rem); line-height: 1.08; letter-spacing: 0; }
  h3 { margin: 0 0 var(--size-2); color: var(--gray-10); }
  p { color: var(--gray-6); line-height: var(--font-lineheight-4); }
  .lede { margin: var(--size-5) 0 0; font-size: var(--font-size-4); max-width: 650px; }
  .artifact, .layer-map { border: var(--border-size-1) solid var(--gray-3); border-radius: var(--radius-2); overflow: hidden; background: var(--gray-1); }
  .artifact-head { display: flex; justify-content: space-between; gap: var(--size-3); padding: 14px var(--size-4); border-bottom: 1px solid var(--gray-3); font-size: var(--font-size-0); color: var(--gray-6); }
  pre { margin: 0; padding: var(--size-4); overflow-x: auto; background: var(--gray-1); color: var(--gray-11); font-size: var(--font-size-0); line-height: 1.65; }
  code { font-family: "JetBrains Mono", "SF Mono", "Consolas", monospace; }
  .section { padding: var(--size-10) 0 0; }
  .section-head { display: flex; justify-content: space-between; gap: var(--size-6); margin-bottom: var(--size-5); }
  .kicker { margin: 0 0 var(--size-2); color: var(--indigo-5); font-size: var(--font-size-0); font-weight: var(--font-weight-8); text-transform: uppercase; }
  .section-copy { max-width: 460px; margin: 0; font-size: var(--font-size-2); }
  .layer { display: grid; grid-template-columns: 170px 1fr 180px; gap: var(--size-4); padding: 14px var(--size-4); border-bottom: 1px solid var(--gray-3); align-items: start; }
  .layer:last-child { border-bottom: 0; }
  .layer strong { color: var(--gray-10); font-size: var(--font-size-1); }
  .layer span, .layer p { margin: 0; color: var(--gray-6); font-size: var(--font-size-0); line-height: 1.55; }
  .cards, .gate-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--size-3); }
  .gate-grid { grid-template-columns: 1fr 1fr; }
  .gate { display: grid; grid-template-columns: 120px 1fr; gap: var(--size-3); align-items: start; padding: var(--size-4); border: var(--border-size-1) solid var(--gray-3); border-radius: var(--radius-2); background: var(--gray-1); }
  .gate strong { color: var(--indigo-8); font-size: var(--font-size-1); }
  .gate span { color: var(--gray-6); font-size: var(--font-size-0); line-height: 1.55; }
  .nav-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: var(--size-8); }
  @media (max-width: 900px) {
    .hero, .cards, .gate-grid { grid-template-columns: 1fr; }
    .layer { grid-template-columns: 1fr; gap: var(--size-2); }
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

  static override styles = [daisyClassSheet, openPropsTokenSheet, pageSheet];

  override render() {
    return (
      <div class='shell'>
        <section class='hero'>
          <div>
            <div class='eyebrow'>
              <span class='badge badge-primary'>ADR-0105</span>
              <span class='badge badge-primary'>{OPENELEMENT_VERSION}</span>
              <span class='badge badge-success'>11-package graph</span>
            </div>
            <h1>Current Architecture</h1>
            <p class='lede'>
              openElement is organized as Elements + UI + Framework + Protocols. The v0.40
              package graph is intentionally small: five product-facing packages and six
              foundation packages. SSG is retained as an adapter-agnostic engine; Vite and Nitro
              stay behind the Framework boundary.
            </p>
          </div>
          <div class='artifact'>
            <div class='artifact-head'>
              <strong>package graph</strong>
              <span>v0.40.0 current truth</span>
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
            <div class='card card-bordered p-4'>
              <h3>Why element?</h3>
              <p>
                Component authors import from one singular facade: @openelement/element. The facade
                exports OpenElement, StyleSheet, signal helpers, and authoring types.
              </p>
            </div>
            <div class='card card-bordered p-4'>
              <h3>Why SSG?</h3>
              <p>
                @openelement/ssg owns route scanning, entry descriptors, rendering, and HTML
                postprocess. @openelement/adapter-vite keeps only Vite-specific glue.
              </p>
            </div>
            <div class='card card-bordered p-4'>
              <h3>Why signal?</h3>
              <p>
                @preact/signals-core is the default engine behind @openelement/signal.
                alien-signals remains available through an optional engine subpath.
              </p>
            </div>
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
              <span>CI enters through AutoFlow3, with JSR publishing and monitoring separated.</span>
            </div>
            <div class='gate'>
              <strong>0 any</strong>
              <span>Active TS/TSX code, tools, tests, and www code reject explicit any.</span>
            </div>
          </div>
        </section>

        <nav class='nav-row'>
          <a class='btn btn-ghost' href='/roadmap'>Roadmap truth {'->'}</a>
          <a class='btn btn-ghost' href='/changelog'>Changelog {'->'}</a>
          <a class='btn btn-ghost' href='/guide/getting-started'>Start building {'->'}</a>
        </nav>
      </div>
    );
  }
}

customElements.define(tagName, ArchitecturePage);
export default ArchitecturePage;
