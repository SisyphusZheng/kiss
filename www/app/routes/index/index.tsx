/**
 * Homepage - Web Standards Lab.
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
    gap: var(--size-16);
    padding-block: var(--size-10) var(--site-section-block);
  }

  .hero,
  .section,
  .cta {
    width: min(100% - calc(var(--size-8) * 2), var(--site-container-wide));
    margin-inline: auto;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, .7fr) minmax(430px, 1.3fr);
    gap: var(--size-8);
    align-items: center;
  }

  .hero-copy {
    display: grid;
    align-content: center;
  }

  .eyebrow,
  .section__kicker,
  .card__index,
  .mono {
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

  h1,
  h2,
  h3,
  p {
    margin-block-start: 0;
  }

  h1 {
    max-width: 820px;
    margin-block-end: 0;
    font-size: clamp(var(--font-size-6), 6vw, var(--font-size-8));
    line-height: var(--font-lineheight-1);
    letter-spacing: 0;
    font-weight: var(--font-weight-8);
  }

  .lede {
    max-width: 660px;
    margin-block: var(--size-5) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-2);
    line-height: var(--font-lineheight-3);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    margin-block-start: var(--size-6);
  }

  .proofs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--size-3);
    grid-column: 1 / -1;
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

  .stage-art {
    --lab-stage-min-height: 560px;
    min-width: 0;
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
    font-size: clamp(var(--font-size-4), 4vw, var(--font-size-6));
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

  @media (max-width: 1080px) {
    .hero,
    .section__head,
    .system,
    .cta {
      grid-template-columns: 1fr;
    }

    .hero {
      align-items: stretch;
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
      gap: var(--size-12);
      padding-block-start: var(--size-8);
    }

    .hero,
    .section,
    .cta {
      width: min(100% - calc(var(--size-4) * 2), var(--site-container-wide));
    }

    h1 {
      font-size: var(--font-size-5);
    }

    .lede {
      font-size: var(--font-size-1);
    }

    .proofs,
    .pillars,
    .entries,
    .workflow-grid,
    .matrix__row,
    .spec-list li {
      grid-template-columns: 1fr;
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
        <section class='hero'>
          <div class='hero-copy'>
            <p class='eyebrow'>Web Standards Lab</p>
            <h1>Web Components full-stack framework.</h1>
            <p class='lede'>
              openElement builds applications around native custom elements,
              Declarative Shadow DOM, route contracts, and interaction-only
              islands. It looks like the platform because it is built on it.
            </p>
            <div class='actions'>
              <open-button variant='primary' size='lg' href='/guide/getting-started'>Start building</open-button>
              <open-button size='lg' href='/architecture/architecture'>Inspect architecture</open-button>
            </div>
          </div>

          <open-lab-stage class='stage-art' emphasis='high' motion='auto'></open-lab-stage>
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
