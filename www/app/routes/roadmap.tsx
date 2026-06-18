export const meta = { section: '', label: 'Roadmap', order: 10 };
export const tagName = 'page-roadmap';

// Strategic anchors: openElement = Elements + UI + Framework + Protocols.
// Current public line: v0.40.7 product graph.
// Validation train anchor: v0.37.6.

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/ui/open-card';
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

  .roadmap {
    width: min(100% - calc(var(--size-8) * 2), var(--site-container));
    margin-inline: auto;
    padding-block: var(--size-12) var(--site-section-block);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(330px, .46fr);
    gap: var(--size-8);
    align-items: end;
    padding-block-end: var(--size-8);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .kicker,
  .version {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
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
    font-size: var(--font-size-7);
    line-height: var(--font-lineheight-1);
    letter-spacing: 0;
  }

  .subtitle,
  .now p,
  .phase p,
  .truth p,
  .truth li {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .subtitle {
    max-width: 760px;
    margin-block: var(--size-5) 0;
    font-size: var(--font-size-2);
  }

  .now h2 {
    margin-block: var(--size-4) var(--size-2);
    font-size: var(--font-size-2);
    line-height: var(--font-lineheight-3);
    letter-spacing: 0;
  }

  .timeline {
    position: relative;
    display: grid;
    gap: var(--size-3);
    margin-block-start: var(--size-8);
    padding-inline-start: var(--size-6);
  }

  .timeline::before {
    content: "";
    position: absolute;
    inset-block: var(--size-3);
    inset-inline-start: var(--size-2);
    width: var(--border-size-2);
    background: linear-gradient(var(--success), var(--brand), var(--warning));
  }

  .phase {
    position: relative;
    display: grid;
    grid-template-columns: minmax(90px, .16fr) minmax(0, 1fr) auto;
    gap: var(--size-5);
    align-items: start;
    transition: transform var(--duration-2) var(--ease-2), border-color var(--duration-2) var(--ease-2);
  }

  .phase::before {
    content: "";
    position: absolute;
    inset-inline-start: calc((var(--size-6) + var(--size-2)) * -1);
    inset-block-start: var(--size-6);
    width: var(--size-3);
    height: var(--size-3);
    border: var(--border-size-2) solid var(--bg-card);
    border-radius: var(--radius-round);
    background: var(--brand);
  }

  .phase:hover {
    transform: translateX(var(--size-1));
    border-color: var(--brand);
  }

  .phase h3 {
    margin-block: 0 var(--size-2);
    color: var(--text-primary);
    font-size: var(--font-size-2);
    line-height: var(--font-lineheight-3);
    letter-spacing: 0;
  }

  .phase p {
    margin-block-end: 0;
  }

  .truth-grid {
    display: grid;
    grid-template-columns: minmax(0, .92fr) minmax(0, .92fr) minmax(0, .8fr);
    gap: var(--size-4);
    margin-block-start: var(--size-8);
  }

  .truth h2 {
    margin-block: 0 var(--size-4);
    font-size: var(--font-size-3);
    line-height: var(--font-lineheight-3);
    letter-spacing: 0;
  }

  .truth ul {
    margin: 0;
    padding-inline-start: var(--size-5);
  }

  .truth li + li {
    margin-block-start: var(--size-2);
  }

  .visual-section {
    display: grid;
    grid-template-columns: minmax(0, .88fr) minmax(0, 1fr);
    gap: var(--size-5);
    margin-block-start: var(--size-8);
  }

  .rule-list {
    display: grid;
    gap: var(--size-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rule-list li {
    display: grid;
    grid-template-columns: minmax(110px, .34fr) minmax(0, 1fr);
    gap: var(--size-3);
    padding-block: var(--size-3);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .rule-list li:last-child {
    border-block-end: 0;
  }

  .rule-list strong {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    text-transform: uppercase;
  }

  .rule-list span {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .nav-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    margin-block-start: var(--size-8);
  }

  @media (max-width: 920px) {
    .hero,
    .phase,
    .truth-grid,
    .visual-section {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .roadmap {
      width: min(100% - calc(var(--size-4) * 2), var(--site-container));
      padding-block-start: var(--size-8);
    }

    h1 {
      font-size: var(--font-size-5);
    }

    .subtitle {
      font-size: var(--font-size-1);
    }

    .rule-list li {
      grid-template-columns: 1fr;
    }
  }
`);

const phases = [
  ['v0.39', 'Framework RC + four-product matrix reset', 'Validated framework app generation, public docs integrity, and the Elements / UI / Framework / Protocols product model.', 'done', 'success'],
  ['v0.40', 'Elements + Preact + repository slimming', 'Slimmed the product surface, removed archived work from the public line, and kept the framework direction standards-first.', 'released', 'success'],
  ['v0.40.7', 'Release readiness and site truth', 'Align design, docs, package language, and CI readiness around the current public product graph.', 'current', 'brand'],
  ['v0.41', 'npm-only distribution line', 'Make package consumption, docs, and examples match the next distribution strategy without reviving old Hub-era assumptions.', 'planned', 'warning'],
  ['v1.0', 'Stable four-product platform', 'Freeze public APIs after Elements, UI, Framework, and Protocols have stable contracts and evidence-backed docs.', 'directional', 'warning'],
];

export class RoadmapPage extends OpenElement {
  static override styles = [openPropsTokenSheet, pageSheet];

  override render() {
    return (
      <main class='roadmap'>
        <section class='hero'>
          <div>
            <p class='kicker'>Product truth</p>
            <h1>Roadmap</h1>
            <p class='subtitle'>
              openElement roadmap labels describe the public product surface,
              not a wish list. The Six-Phase Vision now resolves into the
              v0.40.7 public product graph.
            </p>
          </div>
          <open-lab-panel class='now' label='current' meta='release line'>
            <open-badge tone='brand'>current</open-badge>
            <h2>v0.40.7 Release Readiness & CI Hardening</h2>
            <p>
              The website, docs, package graph, and release gates should speak
              the same product language around the WC Package Protocol.
            </p>
          </open-lab-panel>
        </section>

        <section class='timeline' aria-label='Roadmap phases'>
          {phases.map(([version, title, copy, status, tone]) => (
            <open-card class='phase'>
              <span class='version'>{version}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <open-badge tone={tone}>{status}</open-badge>
            </open-card>
          ))}
        </section>

        <section class='truth-grid'>
          <open-lab-panel class='truth' variant='artifact' label='in product'>
            <h2>In product</h2>
            <ul>
              <li>JSX-first application API</li>
              <li>Declarative Shadow DOM rendering</li>
              <li>Routes, layouts, content, islands, i18n</li>
              <li>Hono API routes and adapter-vite integration</li>
              <li>Protocols for product boundaries</li>
            </ul>
          </open-lab-panel>

          <open-lab-panel class='truth' label='out of current scope'>
            <h2>Out of current scope</h2>
            <ul>
              <li>Hub product language</li>
              <li>Registry Hub as a current product promise</li>
              <li>RPC, CEM, and interop adapter package promises</li>
              <li>Generic auth, ORM, or database platform claims</li>
              <li>Old package-count public graph language</li>
            </ul>
          </open-lab-panel>

          <open-lab-panel class='truth' label='design rule' variant='muted'>
            <h2>Design rule</h2>
            <p>
              The www design should read like a standards lab: light-first,
              diagrammatic, useful, and grounded in actual framework artifacts.
            </p>
          </open-lab-panel>
        </section>

        <section class='visual-section'>
          <open-lab-panel variant='surface' label='package matrix' meta='product boundary'>
            <open-standards-visual variant='packages' emphasis='high' motion='auto'></open-standards-visual>
          </open-lab-panel>
          <open-lab-panel label='release discipline' meta='v1.0 posture'>
            <ul class='rule-list'>
              <li>
                <strong>Ship</strong>
                <span>Only public contracts that are reflected in docs and package surfaces. No webpack remains a hard boundary.</span>
              </li>
              <li>
                <strong>Prove</strong>
                <span>Use CI, build checks, and docs scans as release evidence.</span>
              </li>
              <li>
                <strong>Freeze</strong>
                <span>Move to v1.0 after the four-product line is stable and readable.</span>
              </li>
            </ul>
          </open-lab-panel>
        </section>

        <nav class='nav-row'>
          <open-button href='/architecture/architecture'>Architecture</open-button>
          <open-button href='/changelog'>Changelog</open-button>
          <open-button href='/guide/deployment'>Deployment</open-button>
        </nav>
      </main>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, RoadmapPage);
}

export default RoadmapPage;
