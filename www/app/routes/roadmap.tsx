export const meta = { section: '', label: 'Roadmap', order: 10 };
export const tagName = 'page-roadmap';

// Strategic anchors: openElement = Elements + UI + Framework + Protocols.
// Current public line: v0.41.0-alpha1 product graph.
// Validation train anchor: v0.37.6.

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
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

  h1,
  h2,
  h3,
  p {
    margin-block-start: 0;
  }

  .roadmap {
    display: grid;
    width: 100%;
    background: var(--bg-base);
  }

  .hero {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, .62fr) minmax(390px, .38fr);
    min-height: min(660px, calc(100svh - var(--nav-height)));
    border-block-end: var(--border-size-1) solid var(--border);
    overflow: hidden;
    isolation: isolate;
    background:
      linear-gradient(112deg, var(--violet-2), transparent 48%),
      radial-gradient(circle at 74% 42%, color-mix(in srgb, var(--brand-light) 22%, transparent), transparent 36%),
      linear-gradient(180deg, var(--bg-base), var(--bg-base));
  }

  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -2;
    background:
      linear-gradient(color-mix(in srgb, var(--brand) 16%, transparent) var(--border-size-1), transparent var(--border-size-1)),
      linear-gradient(90deg, color-mix(in srgb, var(--brand) 12%, transparent) var(--border-size-1), transparent var(--border-size-1));
    background-size: 220px 132px;
    mask-image: linear-gradient(90deg, transparent, black 12%, black 94%, transparent);
  }

  .hero-copy,
  .hero-artifact {
    position: relative;
    z-index: 1;
    display: grid;
    align-content: end;
    min-width: 0;
    padding: var(--size-10);
  }

  .hero-copy {
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .hero-artifact {
    align-content: center;
  }

  .kicker,
  .version,
  .section-kicker,
  .metric-label,
  .rule-label {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .kicker {
    margin-block-end: var(--size-5);
  }

  h1 {
    margin: 0;
    max-width: 860px;
    font-size: var(--font-size-8);
    line-height: .88;
    letter-spacing: 0;
    font-weight: var(--font-weight-9);
  }

  .subtitle {
    max-width: 760px;
    margin-block: var(--size-6) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-2);
    line-height: 1.28;
    font-weight: var(--font-weight-5);
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    margin-block-start: var(--size-8);
  }

  .now {
    --panel-min-height: 430px;
  }

  .now-layout {
    position: relative;
    display: grid;
    align-content: space-between;
    gap: var(--size-6);
    min-height: 340px;
  }

  .aperture {
    position: relative;
    justify-self: center;
    width: min(320px, 72vw);
    aspect-ratio: 1;
    border: var(--size-8) solid transparent;
    border-radius: var(--radius-round);
    background:
      linear-gradient(var(--bg-card), var(--bg-card)) padding-box,
      conic-gradient(from 218deg, var(--brand-deep), var(--brand), var(--brand-light), var(--brand-deep)) border-box;
    box-shadow:
      inset 0 0 0 var(--border-size-1) color-mix(in srgb, var(--brand-light) 42%, transparent),
      0 var(--size-8) var(--size-16) color-mix(in srgb, var(--brand) 12%, transparent);
  }

  .aperture::before {
    content: "";
    position: absolute;
    inset: 20%;
    border: var(--border-size-1) solid color-mix(in srgb, var(--brand-light) 58%, var(--bg-card));
    border-radius: var(--radius-round);
    transform: rotate(-16deg);
  }

  .aperture::after {
    content: "";
    position: absolute;
    inset-inline: 18%;
    inset-block-start: 47%;
    height: var(--size-10);
    border-block: var(--border-size-2) solid var(--brand-deep);
    opacity: .72;
  }

  .notch {
    position: absolute;
    inset-inline-end: calc(var(--size-4) * -1);
    inset-block-start: 18%;
    width: var(--size-12);
    height: var(--size-12);
    border-radius: var(--radius-round) 0 0 var(--radius-round);
    background: var(--bg-card);
  }

  .now h2 {
    margin-block: 0 var(--size-3);
    font-size: var(--font-size-3);
    line-height: 1.08;
    letter-spacing: 0;
  }

  .now p,
  .phase-copy,
  .truth p,
  .truth li,
  .rule-copy,
  .matrix-copy {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .release-rail {
    display: grid;
    gap: var(--size-5);
    width: min(1120px, calc(100% - var(--size-10)));
    margin-inline: auto;
    padding: var(--size-8) 0 var(--size-6);
    border-block-end: var(--border-size-1) solid var(--border);
    background: color-mix(in srgb, var(--bg-surface) 72%, transparent);
  }

  .rail-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: var(--size-5);
  }

  .rail-head h2,
  .section-title {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--font-size-5);
    line-height: .98;
    letter-spacing: 0;
    font-weight: var(--font-weight-9);
  }

  .rail-head p {
    max-width: 560px;
    margin-block-end: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-1);
    line-height: 1.36;
  }

  .phase-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(210px, 1fr));
    gap: var(--size-4);
    overflow-x: auto;
    padding-block-end: var(--size-2);
  }

  .phase-card {
    min-height: 280px;
    background: color-mix(in srgb, var(--bg-card) 86%, transparent);
  }

  .phase-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--size-3);
    margin-block-end: var(--size-7);
  }

  .phase-card h3 {
    margin-block: 0 var(--size-3);
    color: var(--text-primary);
    font-size: var(--font-size-2);
    line-height: 1.12;
    letter-spacing: 0;
  }

  .phase-copy {
    margin-block-end: 0;
  }

  .truth-grid {
    display: grid;
    grid-template-columns: minmax(0, .95fr) minmax(0, .95fr) minmax(0, .72fr);
    gap: var(--size-5);
    width: min(1120px, calc(100% - var(--size-10)));
    margin-inline: auto;
    padding: var(--size-8) 0;
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .truth h2 {
    margin-block: 0 var(--size-4);
    color: var(--text-primary);
    font-size: var(--font-size-3);
    line-height: 1.08;
    letter-spacing: 0;
  }

  .truth ul {
    display: grid;
    gap: var(--size-2);
    margin: 0;
    padding-inline-start: var(--size-5);
  }

  .studio-section {
    display: grid;
    grid-template-columns: minmax(300px, .38fr) minmax(0, 1fr);
    width: min(1120px, calc(100% - var(--size-10)));
    margin-inline: auto;
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .section-head,
  .section-body {
    padding: var(--size-8);
  }

  .section-head {
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .section-title {
    margin-block-start: var(--size-4);
    max-width: 640px;
  }

  .matrix {
    display: grid;
    border-block-start: var(--border-size-1) solid var(--border);
  }

  .matrix-row {
    display: grid;
    grid-template-columns: minmax(132px, .28fr) minmax(0, 1fr);
    gap: var(--size-5);
    padding-block: var(--size-5);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .matrix-row:last-child {
    border-block-end: 0;
  }

  .visual-grid {
    display: grid;
    grid-template-columns: minmax(0, .88fr) minmax(0, 1fr);
    gap: var(--size-5);
  }

  .rule-list {
    display: grid;
    gap: var(--size-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rule-list li {
    display: grid;
    grid-template-columns: minmax(110px, .32fr) minmax(0, 1fr);
    gap: var(--size-4);
    padding-block: var(--size-4);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .rule-list li:last-child {
    border-block-end: 0;
  }

  .nav-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    padding: var(--size-8);
    background: var(--bg-base);
  }

  @media (max-width: 1120px) {
    .hero,
    .truth-grid,
    .studio-section,
    .visual-grid {
      grid-template-columns: 1fr;
    }

    .hero-copy {
      border-inline-end: 0;
      border-block-end: var(--border-size-1) solid var(--border);
    }

    .hero-artifact {
      padding-block-start: 0;
    }

    .phase-grid {
      grid-template-columns: repeat(5, minmax(240px, 1fr));
    }

    .section-head {
      border-inline-end: 0;
      border-block-end: var(--border-size-1) solid var(--border);
    }
  }

  @media (max-width: 640px) {
    .hero {
      min-height: auto;
    }

    .hero-copy,
    .hero-artifact,
    .section-head,
    .section-body,
    .nav-row {
      padding: var(--size-5) var(--size-4);
    }

    h1 {
      font-size: var(--font-size-6);
      line-height: .94;
    }

    .subtitle,
    .rail-head p {
      font-size: var(--font-size-1);
      line-height: 1.34;
    }

    .rail-head {
      display: grid;
    }

    .release-rail,
    .truth-grid {
      width: min(100% - var(--size-8), 1120px);
      padding-inline: 0;
    }

    .studio-section {
      width: min(100% - var(--size-8), 1120px);
    }

    .now {
      --panel-min-height: auto;
    }

    .now-layout {
      min-height: 280px;
    }

    .aperture {
      width: min(260px, 78vw);
      border-width: var(--size-6);
    }

    .matrix-row,
    .rule-list li {
      grid-template-columns: 1fr;
      gap: var(--size-2);
    }
  }
`);

const phases = [
  {
    version: 'v0.39',
    title: 'Framework RC + product matrix reset',
    copy: 'Validated app generation, public docs integrity, and the Elements / UI / Framework / Protocols model.',
    status: 'done',
    tone: 'success',
  },
  {
    version: 'v0.40',
    title: 'Elements + repository slimming',
    copy: 'Slimmed the public surface, removed archived promises, and kept the framework direction standards-first.',
    status: 'released',
    tone: 'success',
  },
  {
    version: 'v0.41.0-alpha1',
    title: 'Release readiness and site truth',
    copy: 'Align design, docs, WC Package Protocol language, and CI readiness around the current product graph.',
    status: 'current',
    tone: 'brand',
  },
  {
    version: 'v0.41',
    title: 'npm-first distribution (JSR secondary)',
    copy: 'Make package consumption, docs, and examples match the next distribution strategy.',
    status: 'planned',
    tone: 'warning',
  },
  {
    version: 'v1.0',
    title: 'Stable four-product platform',
    copy: 'Freeze public APIs after contracts, examples, and release evidence are all stable.',
    status: 'direction',
    tone: 'warning',
  },
] as const;

export class RoadmapPage extends OpenElement {
  static override styles = [pageSheet];

  override render() {
    return (
      <main class='roadmap'>
        <section class='hero'>
          <div class='hero-copy'>
            <p class='kicker'>Product truth / release line</p>
            <h1>Roadmap</h1>
            <p class='subtitle'>
              openElement roadmap labels describe the public product surface,
              not a wish list. Every release stage is tied to package truth,
              docs truth, and CI evidence.
            </p>
            <div class='hero-actions'>
              <open-button variant='primary' href='/changelog'>Read changelog</open-button>
              <open-button href='/architecture/architecture'>Architecture</open-button>
            </div>
          </div>
          <div class='hero-artifact'>
            <open-lab-panel class='now' label='current' meta='v0.41.0-alpha1'>
              <div class='now-layout'>
                <div class='aperture' aria-hidden='true'>
                  <span class='notch'></span>
                </div>
                <div>
                  <open-badge tone='brand'>release readiness</open-badge>
                  <h2>Site, docs, package graph, and release gates speak one language.</h2>
                  <p>
                    The current line resolves the Six-Phase Vision into a readable
                    four-product platform: Elements, UI, Framework, and Protocols,
                    with WC Package Protocol boundaries kept visible.
                  </p>
                </div>
              </div>
            </open-lab-panel>
          </div>
        </section>

        <section class='release-rail' aria-label='Roadmap release rail'>
          <div class='rail-head'>
            <div>
              <p class='section-kicker'>Release rail</p>
              <h2>From shipped evidence to v1.0 freeze.</h2>
            </div>
            <p>
              The rail is deliberately narrow: only claims that can survive docs,
              package exports, and build validation stay visible.
            </p>
          </div>
          <div class='phase-grid'>
            {phases.map((phase) => (
              <open-card class='phase-card' variant={phase.version === 'v0.41.0-alpha1' ? 'elevated' : undefined}>
                <div class='phase-top'>
                  <span class='version'>{phase.version}</span>
                  <open-badge tone={phase.tone}>{phase.status}</open-badge>
                </div>
                <h3>{phase.title}</h3>
                <p class='phase-copy'>{phase.copy}</p>
              </open-card>
            ))}
          </div>
        </section>

        <section class='truth-grid'>
          <open-lab-panel class='truth' variant='artifact' label='in product'>
            <h2>In product</h2>
            <ul>
              <li>JSX-first application API</li>
              <li>Declarative Shadow DOM rendering</li>
              <li>Routes, layouts, content, islands, and i18n</li>
              <li>Hono API routes and adapter-vite integration</li>
              <li>WC Package Protocol for package and release boundaries</li>
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
              The public website should read like an editorial standards lab:
              light-first, diagrammatic, useful, and grounded in artifacts users
              can inspect.
            </p>
          </open-lab-panel>
        </section>

        <section class='studio-section'>
          <div class='section-head'>
            <p class='section-kicker'>Decision matrix</p>
            <h2 class='section-title'>Roadmap language stays inside the product boundary.</h2>
          </div>
          <div class='section-body'>
            <div class='matrix'>
              <div class='matrix-row'>
                <span class='metric-label'>Ship</span>
                <span class='matrix-copy'>Only public contracts reflected in docs, generated pages, and package surfaces.</span>
              </div>
              <div class='matrix-row'>
                <span class='metric-label'>Prove</span>
                <span class='matrix-copy'>Use CI, build checks, and docs scans as release evidence before expanding claims.</span>
              </div>
              <div class='matrix-row'>
                <span class='metric-label'>Freeze</span>
                <span class='matrix-copy'>Move toward v1.0 after the four-product line is stable, readable, and boring to verify.</span>
              </div>
            </div>
          </div>
        </section>

        <section class='studio-section'>
          <div class='section-head'>
            <p class='section-kicker'>System visual</p>
            <h2 class='section-title'>The package graph is part of the release artifact.</h2>
          </div>
          <div class='section-body visual-grid'>
            <open-lab-panel variant='surface' label='package matrix' meta='product boundary'>
              <open-standards-visual variant='packages' emphasis='high' motion='auto'></open-standards-visual>
            </open-lab-panel>
            <open-lab-panel label='release discipline' meta='v1.0 posture'>
              <ul class='rule-list'>
                <li>
                  <strong class='rule-label'>No drift</strong>
                  <span class='rule-copy'>Marketing language, docs, package exports, and CI gates must agree.</span>
                </li>
                <li>
                  <strong class='rule-label'>No ghosts</strong>
                  <span class='rule-copy'>
                    Archived Hub-era promises and No webpack-era shortcuts stay out
                    of the current public product line.
                  </span>
                </li>
                <li>
                  <strong class='rule-label'>No fog</strong>
                  <span class='rule-copy'>Users should understand what is shipped, current, planned, and explicitly out of scope.</span>
                </li>
              </ul>
            </open-lab-panel>
          </div>
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
