/**
 * Homepage - Kinetic Web Standards Lab.
 *
 * Strategic anchors:
 * openElement = Elements + UI + Framework + Protocols.
 * Current public package line: v0.40.7.
 * Active execution line: v0.40.7.
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/ui/open-card';
import '@openelement/ui/open-lab-panel';
import '@openelement/ui/open-lab-stage';
import '@openelement/ui/open-standards-visual';
import '../../islands/home-console.js';

export const tagName = 'docs-home';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
  }

  * {
    box-sizing: border-box;
  }

  .home {
    display: grid;
    gap: var(--size-7);
    padding-block-end: var(--site-section-block);
  }

  .hero {
    position: relative;
    display: grid;
    min-height: calc(100svh - var(--nav-height) - var(--size-16) - var(--size-2));
    overflow: hidden;
    isolation: isolate;
    color: var(--code-text);
    background:
      linear-gradient(var(--border) var(--border-size-1), transparent var(--border-size-1)),
      linear-gradient(90deg, var(--border) var(--border-size-1), transparent var(--border-size-1)),
      linear-gradient(135deg, color-mix(in srgb, var(--brand) 22%, transparent), transparent 42%),
      linear-gradient(225deg, color-mix(in srgb, var(--success) 18%, transparent), transparent 48%),
      var(--bg-code);
    background-size: var(--size-10) var(--size-10), var(--size-10) var(--size-10), auto, auto, auto;
  }

  .hero::before,
  .hero::after {
    content: "";
    position: absolute;
    inset-block: 0;
    pointer-events: none;
    z-index: -1;
  }

  .hero::before {
    inset-inline-start: 7%;
    width: var(--border-size-2);
    background: linear-gradient(transparent, var(--brand-light), transparent);
    opacity: .68;
  }

  .hero::after {
    inset-inline-end: 12%;
    width: var(--size-16);
    transform: skewX(-18deg);
    background: linear-gradient(transparent, color-mix(in srgb, var(--success) 18%, transparent), transparent);
    opacity: .72;
  }

  .hero-inner,
  .section,
  .cta {
    width: min(100% - calc(var(--size-8) * 2), var(--site-container-wide));
    margin-inline: auto;
  }

  .hero-inner {
    display: grid;
    grid-template-columns: minmax(0, .74fr) minmax(500px, 1.26fr);
    gap: var(--size-8);
    align-items: center;
    padding-block: var(--size-6);
  }

  .hero-copy {
    display: grid;
    align-content: center;
    min-width: 0;
  }

  .eyebrow,
  .section__kicker,
  .card__index,
  .mono,
  .hero-stat strong {
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .eyebrow,
  .section__kicker {
    color: var(--brand);
    margin: 0 0 var(--size-4);
  }

  .hero .eyebrow {
    color: var(--success);
  }

  h1,
  h2,
  h3,
  p {
    margin-block-start: 0;
  }

  h1 {
    max-width: 780px;
    margin-block-end: 0;
    color: var(--code-text);
    font-size: var(--font-size-8);
    line-height: var(--font-lineheight-1);
    letter-spacing: 0;
    font-weight: var(--font-weight-9);
  }

  .lede {
    max-width: 620px;
    margin-block: var(--size-5) 0;
    color: color-mix(in srgb, var(--code-text) 76%, transparent);
    font-size: var(--font-size-2);
    line-height: var(--font-lineheight-3);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    margin-block-start: var(--size-6);
  }

  .hero-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--size-3);
    margin-block-start: var(--size-7);
  }

  .hero-stat {
    display: grid;
    gap: var(--size-1);
    min-width: 0;
    padding-block: var(--size-3);
    border-block-start: var(--border-size-1) solid color-mix(in srgb, var(--code-border) 76%, transparent);
  }

  .hero-stat strong {
    color: var(--brand-light);
  }

  .hero-stat span {
    min-width: 0;
    overflow-wrap: anywhere;
    color: color-mix(in srgb, var(--code-text) 66%, transparent);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .hero-dashboard {
    display: grid;
    gap: var(--size-4);
    min-width: 0;
    position: relative;
  }

  .stage-art {
    --lab-stage-min-height: 560px;
    min-width: 0;
  }

  .live-row {
    position: absolute;
    inset-inline: var(--size-4);
    inset-block-end: var(--size-4);
    z-index: 2;
    display: grid;
    grid-template-columns: minmax(0, .72fr) minmax(260px, .28fr);
    gap: var(--size-4);
    align-items: stretch;
  }

  .live-note {
    display: grid;
    gap: var(--size-2);
    padding: var(--size-4);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .live-note strong {
    color: var(--success);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    text-transform: uppercase;
  }

  .live-note span {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .proofs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--size-3);
  }

  .proof-card h3,
  .pillar h3,
  .entry h3,
  .workflow h3 {
    margin-block: var(--size-3) var(--size-2);
    color: var(--text-primary);
    font-size: var(--font-size-2);
    line-height: var(--font-lineheight-3);
    letter-spacing: 0;
  }

  .proof-card p,
  .pillar p,
  .entry p,
  .workflow p,
  .section__copy,
  .spec-list span,
  .matrix p {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
    margin-block-end: 0;
  }

  .card__index {
    color: var(--brand);
  }

  .spec-list {
    display: grid;
    gap: var(--size-3);
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .spec-list li {
    display: grid;
    grid-template-columns: minmax(90px, .32fr) minmax(0, 1fr);
    gap: var(--size-3);
    padding-block: var(--size-3);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .spec-list li:last-child {
    border-block-end: 0;
  }

  .spec-list strong {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .section {
    display: grid;
    gap: var(--size-7);
  }

  .section__head {
    display: grid;
    grid-template-columns: minmax(0, .78fr) minmax(0, 1fr);
    gap: var(--size-8);
    align-items: end;
  }

  .section__title {
    margin: 0;
    font-size: var(--font-size-6);
    line-height: var(--font-lineheight-1);
    letter-spacing: 0;
  }

  .section__copy {
    max-width: 640px;
    font-size: var(--font-size-1);
  }

  .pillars,
  .entries {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--size-4);
  }

  .workflow-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--size-3);
  }

  .workflow {
    min-height: 230px;
  }

  .system {
    display: grid;
    grid-template-columns: minmax(0, .88fr) minmax(0, 1.12fr);
    gap: var(--size-5);
  }

  .matrix {
    display: grid;
    gap: var(--size-3);
  }

  .matrix__row {
    display: grid;
    grid-template-columns: minmax(120px, .35fr) minmax(0, 1fr);
    gap: var(--size-4);
    align-items: start;
    padding-block: var(--size-3);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .matrix__row:last-child {
    border-block-end: 0;
  }

  .matrix strong {
    color: var(--text-primary);
    font-size: var(--font-size-1);
  }

  .entry-link {
    color: inherit;
    text-decoration: none;
  }

  .entry-link:focus-visible {
    outline: var(--border-size-2) solid var(--brand);
    outline-offset: var(--size-1);
    border-radius: var(--radius-2);
  }

  .cta {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--size-6);
    align-items: center;
    padding: var(--size-8);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background:
      linear-gradient(135deg, var(--brand-subtle), var(--success-subtle)),
      var(--bg-card);
  }

  .cta h2 {
    margin-block-end: var(--size-2);
    font-size: var(--font-size-4);
    line-height: var(--font-lineheight-3);
    letter-spacing: 0;
  }

  .cta p {
    color: var(--text-secondary);
    line-height: var(--font-lineheight-3);
    margin-block-end: 0;
  }

  @media (max-width: 1120px) {
    .hero-inner,
    .section__head,
    .system,
    .cta,
    .live-row {
      grid-template-columns: 1fr;
    }

    .stage-art {
      --lab-stage-min-height: auto;
    }

    .pillars,
    .proofs,
    .entries {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .workflow-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 680px) {
    .home {
      gap: var(--size-4);
    }

    .hero {
      min-height: auto;
    }

    .hero-inner,
    .section,
    .cta {
      width: min(100% - calc(var(--size-4) * 2), var(--site-container-wide));
    }

    .hero-inner {
      padding-block: var(--size-5);
    }

    h1 {
      font-size: var(--font-size-5);
    }

    .lede {
      font-size: var(--font-size-1);
      margin-block-start: var(--size-4);
    }

    .actions {
      margin-block-start: var(--size-4);
    }

    .secondary-action {
      display: none !important;
    }

    .hero-strip,
    .proofs,
    .pillars,
    .entries,
    .workflow-grid,
    .matrix__row,
    .spec-list li {
      grid-template-columns: 1fr;
    }

    .section__title {
      font-size: var(--font-size-5);
    }

    .hero-strip {
      display: none;
    }

    .live-row {
      inset-inline: var(--size-3);
      inset-block-end: var(--size-3);
      grid-template-columns: 1fr;
    }

    .live-note {
      display: none;
    }

    .cta {
      padding: var(--size-5);
    }
  }
`);

const proofPoints = [
  ['HTML first', 'Declarative Shadow DOM is the default rendering target.'],
  ['Island precise', 'JavaScript is reserved for interactive components.'],
  ['API beside UI', 'Hono routes live beside pages, content, and layouts.'],
  ['Package truthful', 'Elements, UI, Framework, and Protocols stay separate.'],
];

const pillars = [
  ['Elements', 'Custom elements, shadow boundaries, and runtime behavior.'],
  ['UI', 'Open Props components for product surfaces and app primitives.'],
  ['Framework', 'Routes, layouts, content, islands, i18n, and deployment.'],
  ['Protocols', 'Package contracts and compatibility language for consumers.'],
];

const workflow = [
  ['Author', 'Write pages, layouts, components, and content in one app tree.'],
  ['Render', 'Generate static HTML with Declarative Shadow DOM boundaries.'],
  ['Hydrate', 'Attach islands only where behavior is required.'],
  ['Serve', 'Use the same project for documents, API routes, and assets.'],
  ['Prove', 'Validate docs, public package graph, and release truth together.'],
];

const entries = [
  ['Guide', 'Build an app', 'Start with routes, layouts, content, islands, and deployment.', '/guide/getting-started'],
  ['API', 'Read contracts', 'Inspect public package exports and framework helpers.', '/apilist'],
  ['Architecture', 'Follow boundaries', 'Understand DSD, islands, adapters, and package responsibilities.', '/architecture/architecture'],
  ['Roadmap', 'Check product truth', 'See shipped, current, planned, and out-of-scope language.', '/roadmap'],
];

export class DocsHome extends OpenElement {
  static override styles = [openPropsTokenSheet, pageSheet];

  override render() {
    return (
      <main class='home'>
        <section class='hero swiss-grid'>
          <div class='hero-inner'>
            <div class='hero-copy'>
              <p class='eyebrow'>Kinetic Web Standards Lab</p>
              <h1>Native web. Product engine.</h1>
              <p class='lede'>
                openElement turns Elements, UI, Framework, and Protocols into
                one inspectable application surface: DSD, route graphs, island
                hydration, and package contracts in motion.
              </p>
              <div class='actions'>
                <open-button variant='primary' size='lg' href='/guide/getting-started'>Start building</open-button>
                <open-button class='secondary-action' size='lg' href='/architecture/architecture'>Inspect architecture</open-button>
              </div>
              <div class='hero-strip' aria-label='Product line anchors'>
                <div class='hero-stat'>
                  <strong>v0.40.7</strong>
                  <span>Current public package line and active execution line.</span>
                </div>
                <div class='hero-stat'>
                  <strong>Matrix</strong>
                  <span>openElement = Elements + UI + Framework + Protocols.</span>
                </div>
                <div class='hero-stat'>
                  <strong>CI</strong>
                  <span>AutoFlow keeps docs, package graph, and release truth aligned.</span>
                </div>
              </div>
            </div>

            <div class='hero-dashboard'>
              <open-lab-stage class='stage-art' emphasis='high' motion='auto'></open-lab-stage>
              <div class='live-row'>
                <div class='live-note terminal'>
                  <strong>Live island</strong>
                  <span>Interactive behavior stays explicit. The counter below is a real hydrated island, not decorative copy.</span>
                </div>
                <home-console class='live-console'></home-console>
              </div>
            </div>
          </div>
        </section>

        <section class='section'>
          <div class='section__head'>
            <div>
              <p class='section__kicker'>Product matrix</p>
              <h2 class='section__title'>Four product lines. One standards-first app model.</h2>
            </div>
            <p class='section__copy'>
              The website is intentionally documentation-first: every visual
              block points back to a framework contract users can inspect.
            </p>
          </div>
          <div class='proofs'>
            {proofPoints.map(([title, copy], index) => (
              <open-card class='proof-card' variant='muted'>
                <span class='card__index'>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </open-card>
            ))}
          </div>
          <div class='pillars'>
            {pillars.map(([title, copy], index) => (
              <open-card class='pillar'>
                <span class='card__index'>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </open-card>
            ))}
          </div>
        </section>

        <section class='section'>
          <div class='section__head'>
            <div>
              <p class='section__kicker'>Application flow</p>
              <h2 class='section__title'>Author a route, ship platform HTML, hydrate exactly what moves.</h2>
            </div>
            <p class='section__copy'>
              This is a full-stack framework without pretending the browser is
              an implementation detail.
            </p>
          </div>
          <div class='workflow-grid'>
            {workflow.map(([title, copy], index) => (
              <open-card class='workflow' variant={index === 1 ? 'muted' : undefined}>
                <span class='card__index'>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </open-card>
            ))}
          </div>
        </section>

        <section class='section system'>
          <open-lab-panel variant='surface' label='package graph' meta='public product line'>
            <open-standards-visual variant='packages' emphasis='high' motion='auto'></open-standards-visual>
          </open-lab-panel>
          <open-lab-panel variant='muted' label='decision sheet' meta='why it matters'>
            <div class='matrix'>
              <div class='matrix__row'>
                <strong>Browser native</strong>
                <p>Custom elements and DSD define the rendering boundary instead of hiding it.</p>
              </div>
              <div class='matrix__row'>
                <strong>Docs as product</strong>
                <p>The framework is explained through routes, contracts, packages, and release truth.</p>
              </div>
              <div class='matrix__row'>
                <strong>UI package first</strong>
                <p>The site consumes the same Open Props primitives it expects consumers to use.</p>
              </div>
            </div>
          </open-lab-panel>
        </section>

        <section class='section'>
          <div class='section__head'>
            <div>
              <p class='section__kicker'>Entry paths</p>
              <h2 class='section__title'>Move from product promise to implementation evidence.</h2>
            </div>
            <p class='section__copy'>
              Use the site as a workbench: build, verify, inspect, and decide.
            </p>
          </div>
          <div class='entries'>
            {entries.map(([label, title, copy, href]) => (
              <a class='entry-link' href={href}>
                <open-card class='entry'>
                  <span class='card__index'>{label}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </open-card>
              </a>
            ))}
          </div>
        </section>

        <section class='cta'>
          <div>
            <open-badge tone='success'>standards-first</open-badge>
            <h2>Start with the guide, then inspect the contracts.</h2>
            <p>
              The fastest path is a small app: one route, one layout, one island,
              and one API endpoint.
            </p>
          </div>
          <open-button variant='primary' size='lg' href='/guide/getting-started'>Open the guide</open-button>
        </section>
      </main>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, DocsHome);
}

export default DocsHome;
