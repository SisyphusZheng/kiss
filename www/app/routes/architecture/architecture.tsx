export const meta = { section: 'Principles', label: 'Architecture', order: 10 };
export const tagName = 'engine-architecture';

import { OpenElement, StyleSheet } from '@openelement/element';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-card';
import { OPENELEMENT_VERSION } from '../../data/version.ts';
import '@openelement/site-ui/open-section-frame.tsx';
import '@openelement/site-ui/open-page-hero.tsx';
import '@openelement/site-ui/open-artifact-panel.tsx';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host { display: block; }
  * { box-sizing:border-box; }
  .eyebrow { display: flex; flex-wrap: wrap; gap: var(--size-2); margin-bottom: 20px; }
  h1 { margin:0; max-width:760px; color:var(--text); font-size:clamp(3.5rem,7vw,7rem); line-height:.88; letter-spacing:-.07em; }
  h2 { margin: 0; color: var(--text); font-size: 34px; line-height: 1.12; letter-spacing: 0; }
  h3 { margin: 0 0 var(--size-2); color: var(--text); }
  p { color: var(--text-secondary); line-height: var(--line-height-relaxed); }
  .lede { margin: 20px 0 0; font-size: var(--font-size-subhead); max-width: 650px; }
  .artifact, .layer-map { border:1px solid color-mix(in srgb,var(--color-border) 72%,var(--brand)); border-radius:var(--radius-2); overflow:hidden; background:color-mix(in srgb,var(--surface-1) 82%,transparent); box-shadow:inset 0 1px 0 var(--edge-highlight),0 28px 90px color-mix(in srgb,var(--violet-10) 24%,transparent); backdrop-filter:blur(18px); }
  .artifact-head { display: flex; justify-content: space-between; gap: var(--size-3); padding: 14px var(--size-4); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-0); color: var(--text-muted); }
  pre { margin: 0; padding: var(--size-4); overflow-x: auto; background: var(--code-bg); color: var(--code-text); font-size: var(--font-size-0); line-height: 1.65; }
  code { font-family: "JetBrains Mono", monospace; }
  .layer { display: grid; grid-template-columns: 170px 1fr 180px; gap: var(--size-4); padding: 14px var(--size-4); border-bottom: 1px solid var(--color-border); align-items: start; }
  .layer:last-child { border-bottom: 0; }
  .layer strong { color: var(--text); font-size: var(--font-size-1); }
  .layer span, .layer p { margin: 0; color: var(--text-secondary); font-size: var(--font-size-0); line-height: 1.55; }
  .cards, .gate-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--size-3); }
  .gate-grid { grid-template-columns: 1fr 1fr; }
  .gate { display: grid; grid-template-columns: 120px 1fr; gap: var(--size-3); align-items: start; padding: var(--size-4); border: 1px solid var(--color-border); border-radius: var(--radius-1); background: var(--surface-1); }
  .gate strong { color: var(--color-brand); font-size: var(--font-size-1); }
  .gate span { color: var(--text-secondary); font-size: var(--font-size-0); line-height: 1.55; }
  .nav-row { display:flex; flex-wrap:wrap; gap:10px; width:min(1180px,calc(100% - 4rem)); margin:var(--size-8) auto 0; }
  @media (max-width: 900px) { .cards, .gate-grid { grid-template-columns: 1fr; } .layer { grid-template-columns: 1fr; gap: var(--size-2); } h1 { font-size: 42px; line-height: 1.06; } h2 { font-size: 28px; } }
  @media (max-width: 560px) { .nav-row{width:calc(100% - 2rem)} .gate { grid-template-columns: 1fr; display: grid; } }
`);

const PACKAGE_GRAPH = `consumer packages
  @openelement/element       elements, JSX, DSD, hydration, signals
  @openelement/app           pages, routes, islands, render semantics
  @openelement/adapter-vite  Vite, content, static builds, Nitro output
  @openelement/create        starter and installed entrypoint
  @openelement/ui            optional proven primitives`;

export class ArchitecturePage extends OpenElement {
  declare locale?: string;
  static override styles = [pageSheet];

  override render() {
    return (
      <main>
        <open-page-hero variant='technical'>
          <span slot='eyebrow'>ADR-0113 / {OPENELEMENT_VERSION}</span><span slot='title'>Current Architecture</span><span slot='lede'>OpenElement is a Web Components-native, static-first application framework. Custom Elements are the durable component contract; JSX and Basic Element are authoring modes; Vite and Nitro are the official build and output path.</span>
          <open-artifact-panel slot='artifact'>
            <span slot='label'>package graph</span><span slot='meta'>{OPENELEMENT_VERSION} published line</span>
            <pre><code>{PACKAGE_GRAPH}</code></pre>
          </open-artifact-panel>
        </open-page-hero>

        <open-section-frame>
          <span slot='index'>01 / ownership</span>
          <span slot='title'>Deep modules hide implementation complexity.</span>
          <span slot='copy'>Authors use product interfaces. Renderer, router, signal, content and build-phase details stay internal until real variation proves a public seam.</span>
          <div class='layer-map'>
            <div class='layer'><strong>element</strong><span>@openelement/element</span><p>One authoring surface for Custom Elements, JSX, DSD, hydration and signals.</p></div>
            <div class='layer'><strong>application</strong><span>@openelement/app</span><p>Pages, routes, islands and render semantics for complete applications.</p></div>
            <div class='layer'><strong>build</strong><span>@openelement/adapter-vite</span><p>Vite integration, content, static generation and deployable Nitro output behind one build boundary.</p></div>
            <div class='layer'><strong>adoption</strong><span>@openelement/create, optional ui</span><p>Starter-first adoption and optional primitives; neither exposes retired implementation packages.</p></div>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>02 / strategic direction</span>
          <span slot='title'>Web Components are the application architecture.</span>
          <span slot='copy'>The roadmap earns WC fullstack leadership through compatibility evidence, complete application loops and portable operations—not a growing package count.</span>
          <div class='cards'>
            <open-card><h3 slot='header'>WC SSR</h3><p>Builds will classify standard, Lit, FAST and Stencil elements for DSD, light DOM or client-only rendering with actionable diagnostics.</p></open-card>
            <open-card><h3 slot='header'>Application loop</h3><p>Routes, data, progressive forms, actions, redirects and revalidation become one deep App interface rather than separate shallow packages.</p></open-card>
            <open-card><h3 slot='header'>Portable output</h3><p>Node and Workers output, cache intent and deployment diagnostics are verified from packed public artifacts.</p></open-card>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>03 / release gates</span>
          <span slot='title'>Current truth is checked mechanically.</span>
          <span slot='copy'>Package surface, docs truth, artifacts, critical paths and browser tests reject a return to the retired product graph.</span>
          <div class='gate-grid'>
            <div class='gate'><strong>5 packages</strong><span>Current consumer surface, starter and docs agree.</span></div>
            <div class='gate'><strong>#390</strong><span>External adoption remains a stability condition.</span></div>
            <div class='gate'><strong>3 browsers</strong><span>Candidate releases require Chromium, Firefox and WebKit proof.</span></div>
            <div class='gate'><strong>packed proof</strong><span>Consumers build from public artifacts, not workspace aliases.</span></div>
          </div>
        </open-section-frame>

        <nav class='nav-row'>
          <a style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)' href='/roadmap'>Roadmap truth {'->'}</a>
          <a style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)' href='/apilist'>Supported interfaces {'->'}</a>
          <a style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)' href='/guide/getting-started'>Start building {'->'}</a>
        </nav>
      </main>
    );
  }
}

customElements.define(tagName, ArchitecturePage);
export default ArchitecturePage;
