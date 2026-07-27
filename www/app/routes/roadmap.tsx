export const meta = { section: '', label: 'Roadmap', order: 10 };
export const tagName = 'page-roadmap';

// Strategic anchors: Web Components-native, static-first application framework.

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { OPENELEMENT_VERSION } from '../data/version.ts';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
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

  .title-serif {
    display: block;
    color: var(--violet-8);
    font-family: var(--font-serif);
    font-size: calc(1em * 1.12);
    font-style: italic;
    font-weight: 400;
    letter-spacing: -.02em;
  }

  .title-mono {
    display: block;
  }

  .metric-label,
  .rule-label,
  .rule-title {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    margin-block-end: var(--size-6);
  }

  .now h2 {
    margin-block: var(--size-3) var(--size-3);
    font-size: var(--font-size-3);
    line-height: 1.08;
    letter-spacing: 0;
  }

  .now p,
  .tl-copy,
  .truth p,
  .truth li,
  .rule-copy,
  .rule-text,
  .matrix-copy {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  /* vertical timeline: square nodes, evidence-first versions */
  .roadmap-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, .38fr);
    gap: clamp(2rem, 6vw, 5rem);
    align-items: start;
  }

  .timeline {
    position: relative;
    display: grid;
  }

  .timeline::before {
    content: "";
    position: absolute;
    inset-block: var(--size-2);
    inset-inline-start: calc(var(--size-2) / 2);
    width: var(--border-size-1);
    background: var(--border);
  }

  .tl-row {
    position: relative;
    padding: var(--size-5) 0 var(--size-5) var(--size-8);
  }

  .tl-node {
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: calc(var(--size-5) + var(--size-3));
    width: var(--size-2);
    height: var(--size-2);
  }

  .tl-stable .tl-node {
    background: var(--brand);
  }

  .tl-next .tl-node {
    border: var(--border-size-2) solid var(--violet-8);
    background: var(--bg-base);
  }

  .tl-next .tl-node::after {
    content: "";
    position: absolute;
    inset: var(--size-1);
    background: var(--violet-8);
  }

  .tl-planned .tl-node {
    border: var(--border-size-2) solid color-mix(in srgb, var(--violet-5) 55%, transparent);
  }

  .tl-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--size-3) var(--size-4);
  }

  .tl-version {
    color: var(--text-primary);
    font-size: clamp(2rem, 4.2vw, 3.6rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -.03em;
  }

  .tl-next .tl-version {
    color: var(--violet-8);
  }

  .tl-planned .tl-version {
    color: transparent;
    -webkit-text-stroke: 1.5px color-mix(in srgb, var(--violet-5) 55%, transparent);
  }

  .tl-theme {
    color: var(--violet-8);
    font-family: var(--font-serif);
    font-size: clamp(1.25rem, 1.9vw, 1.7rem);
    font-style: italic;
    font-weight: 400;
  }

  .tl-planned .tl-theme {
    color: var(--violet-5);
  }

  .stamp {
    padding: var(--size-1) var(--size-3);
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-7);
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .stamp-current {
    background: var(--brand);
    color: var(--on-brand);
  }

  .stamp-next {
    border: var(--border-size-1) solid var(--violet-8);
    color: var(--violet-8);
  }

  .tl-status {
    color: var(--text-muted);
    font-size: var(--font-size-00);
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  .tl-copy {
    max-width: 560px;
    margin-block: var(--size-3) 0;
  }

  .rule-callout {
    position: sticky;
    top: calc(var(--nav-height) + var(--size-6));
    padding: var(--size-5);
    border: var(--border-size-1) solid color-mix(in srgb, var(--violet-5) 45%, transparent);
    border-radius: var(--radius-2);
    background: var(--violet-0);
    box-shadow: inset var(--size-1) 0 0 var(--brand);
  }

  .rule-title {
    margin-block-end: var(--size-3);
    color: var(--violet-8);
  }

  .rule-text {
    margin-block-end: 0;
  }

  .truth-grid {
    display: grid;
    grid-template-columns: minmax(0, .95fr) minmax(0, .95fr) minmax(0, .72fr);
    gap: var(--size-5);
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
    width: min(1180px, calc(100% - 3rem));
    margin: clamp(4rem, 10vh, 8rem) auto 0;
    padding-block-end: clamp(3rem, 8vh, 6rem);
  }

  @media (max-width: 1120px) {
    .roadmap-grid,
    .truth-grid,
    .visual-grid {
      grid-template-columns: 1fr;
    }

    .rule-callout {
      position: static;
    }
  }

  @media (max-width: 640px) {
    .matrix-row,
    .rule-list li {
      grid-template-columns: 1fr;
      gap: var(--size-2);
    }

    .tl-row {
      padding-inline-start: var(--size-6);
    }
  }
`);

type TimelineEntry = {
  version: string;
  theme: string;
  copy: string;
  state: 'stable' | 'next' | 'planned';
  stamp?: 'CURRENT' | 'NEXT';
  status?: string;
};

const entries: TimelineEntry[] = [
  {
    version: 'v0.42.0-alpha.1',
    theme: 'release tooling self-repair',
    copy:
      'TP-0 of the 0.42.0 plan: patch-release resume re-derives its target from evidence, and a line-prose gate keeps release themes honest.',
    state: 'stable',
    stamp: 'CURRENT',
  },
  {
    version: 'v0.41.0',
    theme: 'core interface freeze',
    copy:
      'Scoped freeze of the proven static-first contract and SPA chain; request-time semantics stay unfrozen (ADR-0119).',
    state: 'stable',
    status: 'released 2026-07-26',
  },
  {
    version: 'v0.42',
    theme: 'WC application loop',
    copy:
      'One route-to-interaction loop: load, DSD render, progressive form, action, error or redirect, and revalidation with a no-JavaScript path.',
    state: 'planned',
    status: 'planned',
  },
  {
    version: 'v0.43–0.46',
    theme: 'SSR, runtime, ecosystem',
    copy:
      'Earn WC fullstack leadership through compatibility diagnostics, portable runtime proof, external adoption and a stability-only release candidate.',
    state: 'planned',
    status: 'direction',
  },
  {
    version: 'v1.0.0',
    theme: 'stable five-package product',
    copy:
      'Release only after external production users prove that the Element, App and Build interfaces need no further architecture change.',
    state: 'planned',
    status: 'direction',
  },
];

export class RoadmapPage extends OpenElement {
  static override styles = [pageSheet];

  override render() {
    return (
      <main>
        <open-page-hero variant='timeline'>
          <span slot='eyebrow'>Roadmap — where the stable line goes</span>
          <span slot='title'>
            <span class='title-serif'>Forward,</span>
            <span class='title-mono'>VERSIONED.</span>
          </span>
          <span slot='lede'>
            OpenElement roadmap labels describe the public product surface, tied to package truth,
            docs truth and CI evidence rather than a wish list.
          </span>
          <open-artifact-panel slot='artifact' class='now'>
            <span slot='label'>current</span>
            <span slot='meta'>{OPENELEMENT_VERSION} published → stable line</span>
            <div class='hero-actions'>
              <open-button variant='primary' href='/changelog'>Read changelog</open-button>
              <open-button href='/architecture/architecture'>Architecture</open-button>
            </div>
            <open-badge tone='warning'>ADR-0119 freeze shipped</open-badge>
            <h2>
              The five-package product is stable at 0.41.x; the freeze is shipped, not a wish.
            </h2>
            <p>
              {OPENELEMENT_VERSION}{' '}
              is the published package line, stable under ADR-0119's scoped interface freeze — the
              #390 pilot requirement was retired by maintainer decision.
            </p>
          </open-artifact-panel>
        </open-page-hero>

        <open-section-frame>
          <span slot='index'>01 / release line</span>
          <span slot='title'>From shipped evidence to v1.0 freeze.</span>
          <span slot='copy'>
            The line is deliberately narrow: only claims that can survive docs, package exports and
            build validation stay visible.
          </span>
          <div class='roadmap-grid'>
            <div class='timeline' aria-label='Roadmap release line'>
              {entries.map((phase) => {
                // The current-line stamp follows the bump-maintained anchor so a
                // release bump re-marks the timeline without manual edits.
                const stamp = phase.version === 'v0.42.0-alpha.1' ? 'CURRENT' : phase.stamp;
                return (
                  <div class={`tl-row tl-${phase.state}`}>
                    <span class='tl-node' aria-hidden='true'></span>
                    <div class='tl-head'>
                      <span class='tl-version'>{phase.version}</span>
                      {stamp
                        ? <span class={`stamp stamp-${stamp.toLowerCase()}`}>{stamp}</span>
                        : null}
                      <span class='tl-theme'>{phase.theme}</span>
                    </div>
                    <p class='tl-copy'>{phase.copy}</p>
                    {phase.status ? <span class='tl-status'>{phase.status}</span> : null}
                  </div>
                );
              })}
            </div>
            <aside class='rule-callout'>
              <p class='rule-title'>Design rule</p>
              <p class='rule-text'>
                No new package is created by default. Auth, ORM and storage remain recipes —
                openElement owns the application contract, not service products.
              </p>
            </aside>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>02 / product boundary</span>
          <span slot='title'>Scope is explicit.</span>
          <span slot='copy'>
            Current capability, excluded promises and the visual contract are kept separate.
          </span>
          <div class='truth-grid'>
            <open-artifact-panel class='truth'>
              <span slot='label'>in product</span>
              <h2>In product</h2>
              <ul>
                <li>JSX-first application API</li>
                <li>Declarative Shadow DOM rendering</li>
                <li>Routes, layouts, content, islands, and i18n</li>
                <li>Hono API routes and adapter-vite integration</li>
                <li>Verified package and release boundaries</li>
              </ul>
            </open-artifact-panel>

            <open-artifact-panel class='truth'>
              <span slot='label'>out of current scope</span>
              <h2>Out of current scope</h2>
              <ul>
                <li>Hub product language</li>
                <li>Registry Hub as a current product promise</li>
                <li>RPC, CEM, and interop adapter package promises</li>
                <li>Generic auth, ORM, or database platform claims</li>
                <li>Old package-count public graph language</li>
              </ul>
            </open-artifact-panel>

            <open-artifact-panel class='truth'>
              <span slot='label'>design rule</span>
              <h2>Design rule</h2>
              <p>
                The public website should read like a Web Standards Lab: dark-first, diagrammatic,
                useful, and grounded in artifacts users can inspect.
              </p>
            </open-artifact-panel>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>03 / decision matrix</span>
          <span slot='title'>Roadmap language stays inside the product boundary.</span>
          <span slot='copy'>
            Ship, prove and freeze are evidence states rather than marketing labels.
          </span>
          <div class='matrix'>
            <div class='matrix-row'>
              <span class='metric-label'>Ship</span>
              <span class='matrix-copy'>
                Only public contracts reflected in docs, generated pages, and package surfaces.
              </span>
            </div>
            <div class='matrix-row'>
              <span class='metric-label'>Prove</span>
              <span class='matrix-copy'>
                Use CI, build checks, and docs scans as release evidence before expanding claims.
              </span>
            </div>
            <div class='matrix-row'>
              <span class='metric-label'>Freeze</span>
              <span class='matrix-copy'>
                Move toward v1.0 after the WC fullstack framework and Basic Element line is stable,
                readable, and boring to verify.
              </span>
            </div>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>04 / system visual</span>
          <span slot='title'>The package graph is part of the release artifact.</span>
          <span slot='copy'>
            Published package ownership and the public architecture must remain mechanically
            identical.
          </span>
          <div class='visual-grid'>
            <open-artifact-panel>
              <span slot='label'>package matrix</span>
              <span slot='meta'>product boundary</span>
              <open-standards-visual variant='packages' emphasis='high' motion='auto'>
              </open-standards-visual>
            </open-artifact-panel>
            <open-artifact-panel>
              <span slot='label'>release discipline</span>
              <span slot='meta'>v1.0 posture</span>
              <ul class='rule-list'>
                <li>
                  <strong class='rule-label'>No drift</strong>
                  <span class='rule-copy'>
                    Marketing language, docs, package exports, and CI gates must agree.
                  </span>
                </li>
                <li>
                  <strong class='rule-label'>No ghosts</strong>
                  <span class='rule-copy'>
                    Archived Hub-era promises and No webpack-era shortcuts stay out of the current
                    public product line.
                  </span>
                </li>
                <li>
                  <strong class='rule-label'>No fog</strong>
                  <span class='rule-copy'>
                    Users should understand what is shipped, current, planned, and explicitly out of
                    scope.
                  </span>
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
