export const meta = { section: "", label: "Roadmap", order: 10 };
export const tagName = "page-roadmap";

// Strategic anchors: openElement = Elements + UI + Framework + Protocols.
// Current public line: v0.40.7, 11-package product graph.

import { OpenElement } from "@openelement/element";
import { StyleSheet } from "@openelement/core/style-sheet";
import { linearTokenSheet } from "@openelement/ui";

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host {
    display: block;
    color: #101828;
  }

  * {
    box-sizing: border-box;
  }

  .shell {
    max-width: 1160px;
    margin: 0 auto;
    padding: 58px 32px 84px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 42px;
    align-items: end;
    padding-bottom: 34px;
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
    font-size: 58px;
    line-height: 1.02;
    letter-spacing: 0;
  }

  .subtitle {
    max-width: 740px;
    margin: 18px 0 0;
    color: #475467;
    font-size: 18px;
    line-height: 1.62;
  }

  .now {
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    padding: 22px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 9px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 800;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .badge.done {
    background: #ecfdf5;
    color: #047857;
  }

  .badge.next {
    background: #fffbeb;
    color: #b45309;
  }

  .now h2 {
    margin: 18px 0 8px;
    color: #101828;
    font-size: 22px;
    letter-spacing: 0;
  }

  .now p {
    margin: 0;
    color: #667085;
    font-size: 14px;
    line-height: 1.58;
  }

  .timeline {
    margin-top: 38px;
    display: grid;
    gap: 12px;
  }

  .phase {
    display: grid;
    grid-template-columns: 124px 1fr 116px;
    gap: 20px;
    align-items: start;
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    padding: 20px;
  }

  .version {
    color: #1d4ed8;
    font-size: 13px;
    font-weight: 850;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .phase h3 {
    margin: 0 0 8px;
    color: #101828;
    font-size: 20px;
    letter-spacing: 0;
  }

  .phase p {
    margin: 0;
    color: #667085;
    font-size: 14px;
    line-height: 1.62;
  }

  .status {
    justify-self: end;
  }

  .truth-grid {
    margin-top: 38px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .truth {
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    padding: 24px;
  }

  .truth.dark {
    background: #111827;
    border-color: #111827;
  }

  .truth h2 {
    margin: 0 0 14px;
    color: #101828;
    font-size: 22px;
    letter-spacing: 0;
  }

  .truth.dark h2 {
    color: #ffffff;
  }

  .truth p,
  .truth li {
    color: #667085;
    font-size: 14px;
    line-height: 1.62;
  }

  .truth.dark li {
    color: #d1d5db;
  }

  .truth p {
    margin: 0;
  }

  ul {
    margin: 0;
    padding-left: 18px;
  }

  .nav-row {
    margin-top: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid rgba(16,24,40,0.14);
    background: #ffffff;
    color: #101828;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
  }

  .button:hover {
    border-color: rgba(29,78,216,0.34);
    color: #1d4ed8;
  }

  @media (max-width: 860px) {
    .hero,
    .phase,
    .truth-grid {
      grid-template-columns: 1fr;
    }

    .status {
      justify-self: start;
    }
  }

  @media (max-width: 560px) {
    .shell {
      padding: 38px 18px 64px;
    }

    h1 {
      font-size: 42px;
      line-height: 1.06;
    }
  }
`);

export class RoadmapPage extends OpenElement {
  static override styles = [linearTokenSheet, routeSheet];

  override render() {
    return (
      <div class="shell">
        <section class="hero">
          <div>
            <p class="kicker">Product truth</p>
            <h1>Roadmap</h1>
            <p class="subtitle">
              openElement roadmap labels describe the public product surface,
              not a wish list. The current line is v0.40.7 on the 11-package
              product graph.
            </p>
          </div>
          <aside class="now">
            <span class="badge">current</span>
            <h2>v0.40.7 Release Readiness & CI Hardening</h2>
            <p>
              The website, docs, package graph, and release gates should speak
              the same product language: Elements, UI, Framework, Protocols.
            </p>
          </aside>
        </section>

        <div class="timeline">
          <div class="phase">
            <div class="version">v0.39</div>
            <div>
              <h3>Framework RC + four-product matrix reset</h3>
              <p>
                Validated framework app generation, public docs integrity, and
                the Elements / UI / Framework / Protocols product model.
              </p>
            </div>
            <span class="badge done status">done</span>
          </div>

          <div class="phase">
            <div class="version">v0.40</div>
            <div>
              <h3>Elements + Preact + repository slimming</h3>
              <p>
                Slimmed the product surface, removed archived work from the
                public line, and kept the framework direction standards-first.
              </p>
            </div>
            <span class="badge done status">released</span>
          </div>

          <div class="phase">
            <div class="version">v0.40.7</div>
            <div>
              <h3>Release readiness and site truth</h3>
              <p>
                Align design, docs, package language, and CI readiness around
                the 11-package line.
              </p>
            </div>
            <span class="badge status">current</span>
          </div>

          <div class="phase">
            <div class="version">v0.41</div>
            <div>
              <h3>npm-only distribution line</h3>
              <p>
                Make package consumption, docs, and examples match the next
                distribution strategy without reviving old Hub-era assumptions.
              </p>
            </div>
            <span class="badge next status">planned</span>
          </div>

          <div class="phase">
            <div class="version">v1.0</div>
            <div>
              <h3>Stable four-product platform</h3>
              <p>
                Freeze public APIs after Elements, UI, Framework, and Protocols
                have stable contracts and evidence-backed docs.
              </p>
            </div>
            <span class="badge next status">directional</span>
          </div>
        </div>

        <div class="truth-grid">
          <section class="truth dark">
            <h2>In product</h2>
            <ul>
              <li>JSX-first application API</li>
              <li>Declarative Shadow DOM rendering</li>
              <li>Routes, layouts, content, islands, i18n</li>
              <li>Hono API routes and adapter-vite integration</li>
              <li>Protocols for product boundaries</li>
            </ul>
          </section>

          <section class="truth">
            <h2>Out of current scope</h2>
            <ul>
              <li>Hub product language</li>
              <li>RPC, CEM, and interop adapter package promises</li>
              <li>Generic auth, ORM, or database platform claims</li>
              <li>Old package-count public graph language</li>
            </ul>
          </section>

          <section class="truth">
            <h2>Design rule</h2>
            <p>
              The www design should read like a standards lab: light-first,
              diagrammatic, useful, and grounded in actual framework artifacts.
            </p>
          </section>
        </div>

        <nav class="nav-row">
          <a class="button" href="/architecture/architecture">Architecture</a>
          <a class="button" href="/changelog">Changelog</a>
          <a class="button" href="/guide/deployment">Deployment</a>
        </nav>
      </div>
    );
  }
}

customElements.define(tagName, RoadmapPage);
export default RoadmapPage;
