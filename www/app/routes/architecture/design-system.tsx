/**
 * @openelement/ui - Web Standards Lab design system page.
 */
export const meta = { section: 'Reference', label: 'Design System', order: 10 };
export const tagName = 'ui-showcase';

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/ui/open-card';
import '@openelement/ui/open-input';
import '@openelement/site-ui/open-lab-panel.tsx';
import '@openelement/site-ui/open-lab-stage.tsx';
import '@openelement/site-ui/open-standards-visual.tsx';
import '@openelement/site-ui/open-page-hero.tsx';
import '@openelement/site-ui/open-artifact-panel.tsx';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
  }

  * {
    box-sizing: border-box;
  }

  .system {
    width: 100%;
    margin-inline: auto;
    padding-block: 0 var(--site-section-block);
  }

  .hero {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, .58fr) minmax(360px, .42fr);
    gap: 0;
    align-items: stretch;
    min-height: 480px;
    padding-block-end: 0;
    border-block-end: var(--border-size-1) solid var(--border);
    background:
      linear-gradient(126deg, color-mix(in srgb, var(--violet-2) 42%, transparent), transparent 54%),
      color-mix(in srgb, var(--bg-base) 86%, var(--violet-0));
    overflow: hidden;
  }

  .hero::after {
    content: "";
    position: absolute;
    inset-inline-end: var(--size-8);
    inset-block: 50% auto;
    width: 360px;
    aspect-ratio: 1;
    transform: translateY(-50%);
    border: var(--size-6) solid color-mix(in srgb, var(--brand) 24%, transparent);
    border-radius: var(--radius-round);
    opacity: .32;
    pointer-events: none;
    z-index: 0;
  }

  .hero > div:first-child {
    display: grid;
    align-content: end;
    position: relative;
    z-index: 1;
    padding: var(--size-10) var(--size-8);
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .hero open-lab-panel {
    position: relative;
    z-index: 1;
  }

  .kicker,
  .label,
  .token-name {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .kicker,
  .label {
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
    font-size: var(--font-size-6);
    line-height: .92;
    letter-spacing: 0;
    font-weight: var(--font-weight-9);
  }

  .subtitle,
  .rule-list li,
  .component-card p,
  .principle p,
  .token-row span {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .subtitle {
    max-width: 760px;
    margin-block: var(--size-6) 0;
    font-size: var(--font-size-2);
    line-height: 1.24;
  }

  .rule-list {
    margin: 0;
    padding-inline-start: var(--size-5);
  }

  .rule-list li + li {
    margin-block-start: var(--size-2);
  }

  .section {
    display: grid;
    grid-template-columns: minmax(280px, .34fr) minmax(0, 1fr);
    gap: 0;
    width: min(1120px, calc(100% - var(--size-10)));
    margin-inline: auto;
    margin-block-start: 0;
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .section > div:first-child {
    padding: var(--size-8);
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .section > open-lab-panel,
  .section > .component-grid,
  .section > .visual-grid,
  .section > .principles {
    padding: var(--size-8);
  }

  .section-title {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--font-size-6);
    line-height: .96;
    letter-spacing: 0;
    font-weight: var(--font-weight-9);
  }

  .token-grid,
  .component-grid,
  .principles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--size-4);
  }

  .token-row {
    display: grid;
    grid-template-columns: minmax(150px, .38fr) minmax(0, 1fr);
    gap: var(--size-4);
    align-items: start;
    padding-block: var(--size-3);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .token-row:last-child {
    border-block-end: 0;
  }

  .component-card {
    min-height: 220px;
    background: color-mix(in srgb, var(--bg-card) 84%, transparent);
  }

  .component-card h3,
  .principle h3 {
    margin-block: 0 var(--size-3);
    color: var(--text-primary);
    font-size: var(--font-size-3);
    line-height: 1.05;
    letter-spacing: 0;
  }

  .component-card p,
  .principle p {
    margin-block: var(--size-4) 0;
  }

  .button-row,
  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-2);
  }

  .visual-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.18fr) minmax(0, .82fr);
    gap: var(--size-5);
  }

  .stage-demo {
    --lab-stage-min-height: 430px;
  }

  .code-sample {
    margin: 0;
    color: var(--code-text);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    line-height: var(--font-lineheight-4);
    white-space: pre-wrap;
  }

  .nav-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    margin: var(--size-8) var(--size-5) 0;
  }

  @media (max-width: 1120px) {
    .hero,
    .section,
    .token-grid,
    .component-grid,
    .principles,
    .visual-grid {
      grid-template-columns: 1fr;
    }

    .section {
      width: min(100% - var(--size-8), 1120px);
    }
  }

  @media (max-width: 620px) {
    .system {
      padding-block-start: var(--size-8);
    }

    h1 {
      font-size: var(--font-size-6);
    }

    .subtitle {
      font-size: var(--font-size-1);
    }

    .token-row {
      grid-template-columns: 1fr;
    }
  }
`);

const tokenRows = [
  ['Canvas', '--bg-base', 'Page background and grid field.'],
  ['Surface', '--bg-card / --bg-elevated', 'Reading surfaces and raised panels.'],
  ['Artifact', '--bg-code / --code-border', 'Code, devtools, route, and package diagrams.'],
  ['Text', '--text-primary / --text-secondary', 'Readable hierarchy in both themes.'],
  ['Action', '--brand / --on-brand', 'Primary command and link emphasis.'],
  ['State', '--success / --warning / --info / --error', 'Roadmap, standards, reference, and failure states.'],
];

const principles = [
  ['Lead with the product object', 'Show routes, package graphs, code, browser contracts, or docs structure in the first viewport.'],
  ['Use components as the site system', 'The website dogfoods retained @openelement/ui primitives; UI remains optional for application authors.'],
  ['Treat dark mode as parity', 'Every page and shadow component must resolve through the same semantic tokens.'],
];

export class UIShowcase extends OpenElement {
  static override styles = [pageSheet];

  override render() {
    return (
      <main class='system'>
        <open-page-hero variant='technical'>
          <span slot='eyebrow'>Web Standards Lab</span><span slot='title'>Design System</span><span slot='lede'>The active www dogfood contract: audited Open Props tokens, retained UI primitives, product-art diagrams and full dark-mode parity. It is not a framework requirement.</span>
          <open-artifact-panel slot='artifact'>
            <span slot='label'>rules</span><span slot='meta'>v3</span>
            <ul class='rule-list'>
              <li>Strict Open Props and semantic tokens only.</li>
              <li>Only reusable primitives live in `@openelement/ui`; site visuals stay in `www`.</li>
              <li>Kinetic motion respects reduced-motion preferences.</li>
              <li>No Linear clone, decorative blobs, or local color systems.</li>
              <li>Letter spacing remains `0`.</li>
            </ul>
          </open-artifact-panel>
        </open-page-hero>

        <section class='section'>
          <div>
            <p class='label'>Token contract</p>
            <h2 class='section-title'>Semantic roles mapped to Open Props.</h2>
          </div>
          <open-lab-panel label='token roles' meta='source: openPropsTokenSheet'>
            {tokenRows.map(([role, token, copy]) => (
              <div class='token-row'>
                <strong class='token-name'>{role}</strong>
                <span><code>{token}</code> - {copy}</span>
              </div>
            ))}
          </open-lab-panel>
        </section>

        <section class='section'>
          <div>
            <p class='label'>Primitives</p>
            <h2 class='section-title'>The site dogfoods optional UI primitives.</h2>
          </div>
          <div class='component-grid'>
            <open-card class='component-card'>
              <h3>Buttons</h3>
              <div class='button-row'>
                <open-button variant='primary'>Primary</open-button>
                <open-button>Secondary</open-button>
                <open-button variant='ghost'>Ghost</open-button>
              </div>
              <p>Commands use stable dimensions, token colors, and focus-visible states.</p>
            </open-card>
            <open-card class='component-card'>
              <h3>Fields</h3>
              <open-input value='app/routes/index.tsx' readonly></open-input>
              <p>Inputs stay utilitarian and inherit the same Open Props token system.</p>
            </open-card>
            <open-card class='component-card'>
              <h3>Status + motion</h3>
              <div class='badge-row'>
                <open-badge tone='brand'>current</open-badge>
                <open-badge tone='success'>done</open-badge>
                <open-badge tone='warning'>planned</open-badge>
              </div>
              <p>Status labels and motion states are readable text first and color second.</p>
            </open-card>
          </div>
        </section>

        <section class='section'>
          <div>
            <p class='label'>Product art</p>
            <h2 class='section-title'>Code and diagrams are the visual asset.</h2>
          </div>
          <div class='visual-grid'>
            <open-lab-stage class='stage-demo' emphasis='normal' motion='auto'></open-lab-stage>
            <open-lab-panel label='token board' meta='Open Props'>
              <open-standards-visual variant='tokens' emphasis='high' motion='auto'></open-standards-visual>
            </open-lab-panel>
          </div>
        </section>

        <section class='section'>
          <div>
            <p class='label'>Layout</p>
            <h2 class='section-title'>Composition principles</h2>
          </div>
          <div class='principles'>
            {principles.map(([title, copy], index) => (
              <open-card class='principle'>
                <span class='token-name'>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </open-card>
            ))}
          </div>
        </section>

        <nav class='nav-row'>
          <open-button href='/docs'>Docs</open-button>
          <open-button href='/architecture/architecture'>Architecture</open-button>
          <open-button href='/roadmap'>Roadmap</open-button>
        </nav>
      </main>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, UIShowcase);
}

export default UIShowcase;
