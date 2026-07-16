export const meta = { section: '', label: 'Roadmap', order: 10 };
export const tagName = 'page-roadmap';

// Strategic anchors: Web Components-native, static-first application framework.

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/ui/open-card';
import '@openelement/site-ui/open-standards-visual.tsx';
import '@openelement/site-ui/open-page-hero.tsx';
import '@openelement/site-ui/open-artifact-panel.tsx';
import '@openelement/site-ui/open-section-frame.tsx';

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

  .section-body {
    padding: var(--size-8);
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
    .truth-grid,
    .visual-grid {
      grid-template-columns: 1fr;
    }

    .phase-grid {
      grid-template-columns: repeat(5, minmax(240px, 1fr));
    }

  }

  @media (max-width: 640px) {
    .section-body,
    .nav-row {
      padding: var(--size-5) var(--size-4);
    }

    h1 {
      font-size: var(--font-size-6);
      line-height: .94;
    }

    .subtitle {
      font-size: var(--font-size-1);
      line-height: 1.34;
    }

    .release-rail,
    .truth-grid {
      width: min(100% - var(--size-8), 1120px);
      padding-inline: 0;
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
    version: 'v0.41.0-alpha.15',
    title: 'Five-package alpha release',
    copy: 'The published alpha line converges the consumer product around five packages and ships the unified product and website surface.',
    status: 'done',
    tone: 'success',
  },
  {
    version: 'v0.41.0-alpha.x',
    title: 'Adoption and interface proof',
    copy: 'External adopter #390 and further real use can still drive breaking architecture and authoring corrections.',
    status: 'active alpha',
    tone: 'warning',
  },
  {
    version: 'v0.41.0',
    title: 'Core interface freeze',
    copy: 'Freeze the five-package graph and deep Element, App and Build interfaces only when alpha adoption exposes no further breaking work.',
    status: 'after alpha proof',
    tone: 'warning',
  },
  {
    version: 'v0.42',
    title: 'WC Application Loop',
    copy: 'One route-to-interaction loop: load, DSD render, progressive form, action, error or redirect, and revalidation with a no-JavaScript path.',
    status: 'planned',
    tone: 'warning',
  },
  {
    version: 'v0.43–0.46',
    title: 'SSR, production runtime, ecosystem and v1 freeze',
    copy: 'Earn WC fullstack leadership through compatibility diagnostics, portable runtime proof, external adoption and a stability-only release candidate.',
    status: 'direction',
    tone: 'warning',
  },
  {
    version: 'v1.0.0',
    title: 'Stable five-package product',
    copy: 'Release only after external production users prove that the Element, App and Build interfaces need no further architecture change.',
    status: 'direction',
    tone: 'warning',
  },
] as const;

export class RoadmapPage extends OpenElement {
  static override styles = [pageSheet];

  override render() {
    return (
      <main class='roadmap'>
        <open-page-hero variant='timeline'>
            <span slot='eyebrow'>Product truth / release line</span>
            <span slot='title'>Roadmap</span>
            <span slot='lede'>OpenElement roadmap labels describe the public product surface, tied to package truth, docs truth and CI evidence rather than a wish list.</span>
            <open-artifact-panel slot='artifact' class='now'>
              <span slot='label'>current</span><span slot='meta'>alpha.10 published → alpha adoption proof</span>
              <div class='hero-actions'>
              <open-button variant='primary' href='/changelog'>Read changelog</open-button>
              <open-button href='/architecture/architecture'>Architecture</open-button>
              </div>
              <div class='now-layout'>
                <div class='aperture' aria-hidden='true'>
                  <span class='notch'></span>
                </div>
                <div>
                  <open-badge tone='warning'>alpha maturation</open-badge>
                  <h2>The five-package product is published; adoption now decides when its interfaces are stable.</h2>
                  <p>
                    alpha.10 is the published package line. beta.1–beta.3 remain
                    withdrawn partial npm artifacts. External adopter pilot
                    #390 and continued browser and release evidence guide the
                    remaining alpha maturation work.
                  </p>
                </div>
              </div>
            </open-artifact-panel>
        </open-page-hero>

        <open-section-frame>
          <span slot='index'>01 / release rail</span>
          <span slot='title'>From shipped evidence to v1.0 freeze.</span>
          <span slot='copy'>The rail is deliberately narrow: only claims that can survive docs, package exports and build validation stay visible.</span>
          <div class='release-rail' aria-label='Roadmap release rail'>
          <div class='phase-grid'>
            {phases.map((phase) => (
              <open-card class='phase-card' variant={phase.version === 'v0.41.0-alpha.15' ? 'elevated' : undefined}>
                <div class='phase-top'>
                  <span class='version'>{phase.version}</span>
                  <open-badge tone={phase.tone}>{phase.status}</open-badge>
                </div>
                <h3>{phase.title}</h3>
                <p class='phase-copy'>{phase.copy}</p>
              </open-card>
            ))}
          </div>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>02 / product boundary</span>
          <span slot='title'>Scope is explicit.</span>
          <span slot='copy'>Current capability, excluded promises and the visual contract are kept separate.</span>
          <div class='truth-grid'>
          <open-artifact-panel class='truth'><span slot='label'>in product</span>
            <h2>In product</h2>
            <ul>
              <li>JSX-first application API</li>
              <li>Declarative Shadow DOM rendering</li>
              <li>Routes, layouts, content, islands, and i18n</li>
              <li>Hono API routes and adapter-vite integration</li>
              <li>Verified package and release boundaries</li>
            </ul>
          </open-artifact-panel>

          <open-artifact-panel class='truth'><span slot='label'>out of current scope</span>
            <h2>Out of current scope</h2>
            <ul>
              <li>Hub product language</li>
              <li>Registry Hub as a current product promise</li>
              <li>RPC, CEM, and interop adapter package promises</li>
              <li>Generic auth, ORM, or database platform claims</li>
              <li>Old package-count public graph language</li>
            </ul>
          </open-artifact-panel>

          <open-artifact-panel class='truth'><span slot='label'>design rule</span>
            <h2>Design rule</h2>
            <p>
              The public website should read like a Web Standards Lab:
              dark-first, diagrammatic, useful, and grounded in artifacts users
              can inspect.
            </p>
          </open-artifact-panel>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>03 / decision matrix</span>
          <span slot='title'>Roadmap language stays inside the product boundary.</span>
          <span slot='copy'>Ship, prove and freeze are evidence states rather than marketing labels.</span>
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
                <span class='matrix-copy'>Move toward v1.0 after the WC fullstack framework and Basic Element line is stable, readable, and boring to verify.</span>
              </div>
            </div>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>04 / system visual</span>
          <span slot='title'>The package graph is part of the release artifact.</span>
          <span slot='copy'>Published package ownership and the public architecture must remain mechanically identical.</span>
          <div class='section-body visual-grid'>
            <open-artifact-panel><span slot='label'>package matrix</span><span slot='meta'>product boundary</span>
              <open-standards-visual variant='packages' emphasis='high' motion='auto'></open-standards-visual>
            </open-artifact-panel>
            <open-artifact-panel><span slot='label'>release discipline</span><span slot='meta'>v1.0 posture</span>
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
            </open-artifact-panel>
          </div>
        </open-section-frame>

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
