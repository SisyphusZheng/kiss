/**
 * Homepage - Web Standards Lab direction.
 */
import { OpenElement } from "@openelement/element";
import { StyleSheet } from "@openelement/core/style-sheet";
import { linearTokenSheet } from "@openelement/ui";

export const tagName = "docs-home";

const labSheet = new StyleSheet();
labSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary, #101828);
  }

  * {
    box-sizing: border-box;
  }

  .home-lab {
    min-height: 100vh;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0) 34rem),
      transparent;
  }

  .section,
  .hero {
    max-width: 1240px;
    margin: 0 auto;
    padding-left: 32px;
    padding-right: 32px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(420px, 520px);
    gap: 56px;
    align-items: center;
    padding-top: 78px;
    padding-bottom: 64px;
  }

  .eyebrow {
    margin: 0 0 18px;
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1 {
    max-width: 760px;
    margin: 0;
    color: #101828;
    font-size: 68px;
    line-height: 0.98;
    letter-spacing: 0;
    font-weight: 760;
  }

  .lede {
    max-width: 650px;
    margin: 24px 0 0;
    color: #475467;
    font-size: 20px;
    line-height: 1.58;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 32px;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
  }

  .button.primary {
    background: #1d4ed8;
    color: #ffffff;
    border: 1px solid #1d4ed8;
  }

  .button.primary:hover {
    background: #1e40af;
    border-color: #1e40af;
  }

  .button.secondary {
    background: #ffffff;
    color: #101828;
    border: 1px solid rgba(16,24,40,0.14);
  }

  .button.secondary:hover {
    border-color: rgba(29,78,216,0.35);
    color: #1d4ed8;
  }

  .hero-points {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 30px;
    max-width: 640px;
  }

  .hero-point {
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: rgba(255,255,255,0.74);
    padding: 14px;
  }

  .hero-point strong {
    display: block;
    color: #101828;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .hero-point span {
    display: block;
    color: #667085;
    font-size: 13px;
    line-height: 1.45;
  }

  .artifact {
    border: 1px solid rgba(16,24,40,0.16);
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 24px 70px rgba(16,24,40,0.12);
    overflow: hidden;
  }

  .artifact-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 42px;
    padding: 0 14px;
    border-bottom: 1px solid rgba(16,24,40,0.1);
    background: #f8fafc;
    color: #667085;
    font-size: 12px;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .dots {
    display: inline-flex;
    gap: 6px;
  }

  .dots i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #cbd5e1;
  }

  .artifact-code {
    margin: 0;
    padding: 22px;
    background: #111827;
    color: #d1d5db;
    font-size: 12px;
    line-height: 1.75;
    overflow: auto;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .artifact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: rgba(16,24,40,0.1);
  }

  .artifact-cell {
    min-height: 122px;
    padding: 18px;
    background: #ffffff;
  }

  .artifact-cell h2 {
    margin: 0 0 14px;
    color: #101828;
    font-size: 13px;
  }

  .pipe {
    display: grid;
    gap: 8px;
  }

  .pipe span,
  .node {
    display: block;
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 6px;
    background: #f8fafc;
    color: #344054;
    padding: 7px 9px;
    font-size: 12px;
    font-weight: 650;
  }

  .node.blue { border-color: rgba(29,78,216,0.28); background: #eff6ff; color: #1d4ed8; }
  .node.green { border-color: rgba(4,120,87,0.28); background: #ecfdf5; color: #047857; }
  .node.amber { border-color: rgba(180,83,9,0.28); background: #fffbeb; color: #b45309; }

  .proof {
    border-top: 1px solid rgba(16,24,40,0.1);
    border-bottom: 1px solid rgba(16,24,40,0.1);
    background: rgba(255,255,255,0.58);
  }

  .proof .section {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    padding-top: 0;
    padding-bottom: 0;
  }

  .proof-card {
    min-height: 164px;
    padding: 28px 24px;
    border-left: 1px solid rgba(16,24,40,0.08);
  }

  .proof-card:last-child {
    border-right: 1px solid rgba(16,24,40,0.08);
  }

  .proof-card .num {
    color: #1d4ed8;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 12px;
    font-weight: 800;
  }

  .proof-card h2 {
    margin: 14px 0 8px;
    color: #101828;
    font-size: 22px;
    letter-spacing: 0;
  }

  .proof-card p {
    margin: 0;
    color: #667085;
    font-size: 14px;
    line-height: 1.55;
  }

  .section {
    padding-top: 76px;
    padding-bottom: 76px;
  }

  .section-head {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
    gap: 42px;
    align-items: end;
    margin-bottom: 28px;
  }

  .section-kicker {
    margin: 0 0 10px;
    color: #047857;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  .section-title {
    margin: 0;
    color: #101828;
    font-size: 40px;
    line-height: 1.08;
    letter-spacing: 0;
  }

  .section-copy {
    margin: 0;
    color: #475467;
    font-size: 17px;
    line-height: 1.65;
  }

  .workflow {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
  }

  .step {
    min-height: 210px;
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    padding: 20px;
    position: relative;
  }

  .step::before {
    content: "";
    display: block;
    width: 28px;
    height: 3px;
    background: #1d4ed8;
    margin-bottom: 24px;
  }

  .step h3 {
    margin: 0 0 10px;
    color: #101828;
    font-size: 18px;
  }

  .step p {
    margin: 0;
    color: #667085;
    font-size: 14px;
    line-height: 1.58;
  }

  .map {
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    gap: 16px;
  }

  .map-panel {
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    padding: 24px;
  }

  .map-panel.dark {
    background: #111827;
    border-color: #111827;
    color: #e5e7eb;
  }

  .map-panel h3 {
    margin: 0 0 18px;
    font-size: 18px;
    color: inherit;
  }

  .matrix {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .matrix-item {
    min-height: 92px;
    border: 1px solid rgba(255,255,255,0.13);
    border-radius: 8px;
    padding: 14px;
    background: rgba(255,255,255,0.04);
  }

  .matrix-item strong {
    display: block;
    color: #ffffff;
    font-size: 13px;
    margin-bottom: 7px;
  }

  .matrix-item span {
    color: #cbd5e1;
    font-size: 12px;
    line-height: 1.5;
  }

  .package-lines {
    display: grid;
    gap: 10px;
  }

  .package-line {
    display: grid;
    grid-template-columns: 132px 1fr;
    gap: 12px;
    align-items: center;
    padding: 11px 0;
    border-bottom: 1px solid rgba(16,24,40,0.08);
  }

  .package-line:last-child {
    border-bottom: 0;
  }

  .package-name {
    color: #1d4ed8;
    font-size: 13px;
    font-weight: 800;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .package-copy {
    color: #475467;
    font-size: 14px;
    line-height: 1.45;
  }

  .entry-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .entry {
    display: block;
    min-height: 180px;
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    padding: 22px;
    text-decoration: none;
    color: inherit;
  }

  .entry:hover {
    border-color: rgba(29,78,216,0.34);
  }

  .entry span {
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 800;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .entry h3 {
    margin: 18px 0 10px;
    color: #101828;
    font-size: 20px;
  }

  .entry p {
    margin: 0;
    color: #667085;
    font-size: 14px;
    line-height: 1.55;
  }

  .cta {
    margin-top: 12px;
    border: 1px solid rgba(16,24,40,0.14);
    border-radius: 8px;
    background:
      linear-gradient(135deg, rgba(29,78,216,0.1), rgba(4,120,87,0.08)),
      #ffffff;
    padding: 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
  }

  .cta h2 {
    margin: 0 0 8px;
    color: #101828;
    font-size: 30px;
    letter-spacing: 0;
  }

  .cta p {
    margin: 0;
    color: #475467;
    font-size: 16px;
    line-height: 1.6;
  }

  @media (max-width: 1080px) {
    .hero {
      grid-template-columns: 1fr;
      padding-top: 56px;
    }

    .artifact {
      max-width: 720px;
    }

    .proof .section,
    .workflow,
    .entry-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .map,
    .section-head {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .hero,
    .section {
      padding-left: 18px;
      padding-right: 18px;
    }

    h1 {
      font-size: 46px;
      line-height: 1.03;
    }

    .lede {
      font-size: 17px;
    }

    .hero-points,
    .proof .section,
    .workflow,
    .map,
    .entry-grid,
    .artifact-grid,
    .matrix {
      grid-template-columns: 1fr;
    }

    .package-line {
      grid-template-columns: 1fr;
      gap: 4px;
    }

    .cta {
      display: block;
      padding: 24px;
    }

    .cta .actions {
      margin-top: 22px;
    }
  }
`);

export class DocsHome extends OpenElement {
  static override styles = [linearTokenSheet, labSheet];

  override render() {
    return (
      <div class="home-lab">
        <section class="hero">
          <div>
            <p class="eyebrow">Web Standards Lab / v0.40.7</p>
            <h1>Web Components full-stack framework.</h1>
            <p class="lede">
              openElement turns custom elements, Declarative Shadow DOM, routing,
              content, islands, and protocol contracts into one standards-first
              application stack.
            </p>
            <div class="actions">
              <a class="button primary" href="/guide/getting-started">Start building</a>
              <a class="button secondary" href="/architecture/architecture">Inspect architecture</a>
            </div>
            <div class="hero-points">
              <div class="hero-point">
                <strong>0 JS by default</strong>
                <span>Static DSD output first, islands only when interaction needs them.</span>
              </div>
              <div class="hero-point">
                <strong>11-package product line</strong>
                <span>Elements, UI, Framework, Protocols, content, router, SSG, and Vite adapter.</span>
              </div>
              <div class="hero-point">
                <strong>Full-stack paths</strong>
                <span>Pages, layouts, API routes, MDX content, i18n, and deployment recipes.</span>
              </div>
              <div class="hero-point">
                <strong>Evidence-driven docs</strong>
                <span>The website is the product map, not a separate marketing shell.</span>
              </div>
            </div>
          </div>

          <div class="artifact" aria-label="openElement engineering artifact">
            <div class="artifact-bar">
              <span>app/routes/index.tsx</span>
              <span class="dots"><i></i><i></i><i></i></span>
            </div>
            <pre class="artifact-code"><code>{`import { definePage } from "@openelement/app";

export default definePage({
  render: () => <product-card />,
  islands: ["open-search"],
});`}</code></pre>
            <div class="artifact-grid">
              <div class="artifact-cell">
                <h2>Render pipeline</h2>
                <div class="pipe">
                  <span>Route scan</span>
                  <span>DSD render</span>
                  <span>Island manifest</span>
                </div>
              </div>
              <div class="artifact-cell">
                <h2>Runtime map</h2>
                <div class="pipe">
                  <span class="node blue">Custom Elements</span>
                  <span class="node green">Hono API routes</span>
                  <span class="node amber">Static + SSR intent</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="proof" aria-label="Product pillars">
          <div class="section">
            <article class="proof-card">
              <span class="num">01</span>
              <h2>Elements</h2>
              <p>Author web components with explicit shadow and light DOM contracts.</p>
            </article>
            <article class="proof-card">
              <span class="num">02</span>
              <h2>UI</h2>
              <p>Reusable primitives and site shell pieces built on custom elements.</p>
            </article>
            <article class="proof-card">
              <span class="num">03</span>
              <h2>Framework</h2>
              <p>Routes, layouts, islands, content, app shell, and Vite integration.</p>
            </article>
            <article class="proof-card">
              <span class="num">04</span>
              <h2>Protocols</h2>
              <p>Shared contracts for compatibility, rendering intent, and package boundaries.</p>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Application workflow</p>
              <h2 class="section-title">A framework that still looks like the web.</h2>
            </div>
            <p class="section-copy">
              The strongest visual system for openElement is not another SaaS
              homepage. It is a precise lab bench: routes, components, server
              boundaries, and package contracts visible on the page.
            </p>
          </div>
          <div class="workflow">
            <article class="step">
              <h3>Author</h3>
              <p>Write custom elements, pages, layouts, and content with JSX-first ergonomics.</p>
            </article>
            <article class="step">
              <h3>Render</h3>
              <p>Emit static pages and Declarative Shadow DOM before any client runtime.</p>
            </article>
            <article class="step">
              <h3>Hydrate</h3>
              <p>Attach islands only where search, navigation, forms, or tools need state.</p>
            </article>
            <article class="step">
              <h3>Serve</h3>
              <p>Use API routes, adapters, and content pipelines without hiding browser standards.</p>
            </article>
            <article class="step">
              <h3>Prove</h3>
              <p>Keep docs, roadmap, package graph, and release evidence aligned.</p>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <p class="section-kicker">System map</p>
              <h2 class="section-title">The page explains the architecture.</h2>
            </div>
            <p class="section-copy">
              Every major page should show a contract, a pipeline, or a decision.
              This keeps the site useful to builders and credible to framework
              evaluators.
            </p>
          </div>
          <div class="map">
            <div class="map-panel dark">
              <h3>Four-product matrix</h3>
              <div class="matrix">
                <div class="matrix-item">
                  <strong>Elements</strong>
                  <span>@openelement/element and core rendering primitives.</span>
                </div>
                <div class="matrix-item">
                  <strong>UI</strong>
                  <span>Layout, theme, cards, controls, and docs shell.</span>
                </div>
                <div class="matrix-item">
                  <strong>Framework</strong>
                  <span>App, router, content, SSG, and adapter-vite.</span>
                </div>
                <div class="matrix-item">
                  <strong>Protocols</strong>
                  <span>Shared boundaries for compatibility and conformance.</span>
                </div>
              </div>
            </div>
            <div class="map-panel">
              <h3>Package boundary sketch</h3>
              <div class="package-lines">
                <div class="package-line">
                  <span class="package-name">core</span>
                  <span class="package-copy">Pure rendering, escaping, style sheets, context, and logger.</span>
                </div>
                <div class="package-line">
                  <span class="package-name">element</span>
                  <span class="package-copy">OpenElement base class for authoring standards-first components.</span>
                </div>
                <div class="package-line">
                  <span class="package-name">app</span>
                  <span class="package-copy">High-level page, island, layout, and app-shell authoring surface.</span>
                </div>
                <div class="package-line">
                  <span class="package-name">adapter-vite</span>
                  <span class="package-copy">Build orchestration, generated entries, manifests, and page output.</span>
                </div>
                <div class="package-line">
                  <span class="package-name">www</span>
                  <span class="package-copy">Documentation site and integration proof for the public product.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Entry paths</p>
              <h2 class="section-title">Start where your question is.</h2>
            </div>
            <p class="section-copy">
              The site should behave like a working reference desk: fast routes
              into building, API details, architecture, and roadmap truth.
            </p>
          </div>
          <div class="entry-grid">
            <a class="entry" href="/guide/getting-started">
              <span>GUIDE</span>
              <h3>Build the first app</h3>
              <p>Create a project and follow the route, component, content, and deployment path.</p>
            </a>
            <a class="entry" href="/apilist">
              <span>API</span>
              <h3>Find the public surface</h3>
              <p>Inspect exported functions, classes, packages, and framework APIs.</p>
            </a>
            <a class="entry" href="/roadmap">
              <span>ROADMAP</span>
              <h3>Read product truth</h3>
              <p>Track the active version line, shipped scope, and next framework priorities.</p>
            </a>
          </div>

          <div class="cta">
            <div>
              <h2>Use standards first. Add framework only where it earns its keep.</h2>
              <p>
                That is the design rule for both the product and the website.
              </p>
            </div>
            <div class="actions">
              <a class="button primary" href="/guide/getting-started">Read the guide</a>
              <a class="button secondary" href="/architecture/architecture">View architecture</a>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

customElements.define(tagName, DocsHome);
export default DocsHome;
