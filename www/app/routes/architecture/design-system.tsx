/**
 * @openelement/ui - Web Standards Lab design system page.
 */
export const meta = { section: 'Reference', label: 'Design System', order: 10 };
export const tagName = 'ui-showcase';

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/ui/open-card';
import '@openelement/ui/open-input';
import '@openelement/ui/open-lab-panel';
import '@openelement/ui/open-lab-stage';
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

  .system {
    width: 100%;
    margin-inline: auto;
    padding-block: 0 var(--site-section-block);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, .58fr) minmax(360px, .42fr);
    gap: 0;
    align-items: stretch;
    min-height: 420px;
    padding-block-end: 0;
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .hero > div:first-child {
    display: grid;
    align-content: end;
    padding: var(--size-8) var(--size-5);
    border-inline-end: var(--border-size-1) solid var(--border);
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
    font-size: var(--font-size-7);
    line-height: .9;
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
    margin-block: var(--size-5) 0;
    font-size: var(--font-size-2);
    line-height: 1.18;
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
    margin-block-start: 0;
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .section > div:first-child {
    padding: var(--size-8) var(--size-5);
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .section > open-lab-panel,
  .section > .component-grid,
  .section > .visual-grid,
  .section > .principles {
    padding: var(--size-8) var(--size-5);
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
    gap: 0;
    border-block-start: var(--border-size-1) solid var(--border);
    border-inline-start: var(--border-size-1) solid var(--border);
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
    border-block-start: 0;
    border-inline-start: 0;
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
    gap: 0;
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

  @media (max-width: 940px) {
    .hero,
    .section,
    .token-grid,
    .component-grid,
    .principles,
    .visual-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .system {
      padding-block-start: var(--size-8);
    }

    h1 {
      font-size: var(--font-size-5);
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
  ['Use components as the design system', 'Buttons, cards, badges, panels, inputs, and visuals come from @openelement/ui.'],
  ['Treat dark mode as parity', 'Every page and shadow component must resolve through the same semantic tokens.'],
];

export class UIShowcase extends OpenElement {
  static override styles = [openPropsTokenSheet, pageSheet];

  override render() {
    return (
      <main class='system'>
        <section class='hero'>
          <div>
            <p class='kicker'>Web Standards Lab</p>
            <h1>Design System</h1>
            <p class='subtitle'>
              This page documents the active `www` implementation contract:
              Open Props tokens, UI package primitives, product-art diagrams,
              and first-class dark mode.
            </p>
          </div>
          <open-lab-panel label='rules' meta='v3'>
            <ul class='rule-list'>
              <li>Strict Open Props and semantic tokens only.</li>
              <li>Reusable visuals live in `@openelement/ui`.</li>
              <li>Kinetic motion respects reduced-motion preferences.</li>
              <li>No Linear clone, decorative blobs, or local color systems.</li>
              <li>Letter spacing remains `0`.</li>
            </ul>
          </open-lab-panel>
        </section>

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
            <h2 class='section-title'>The site is composed from UI package components.</h2>
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
