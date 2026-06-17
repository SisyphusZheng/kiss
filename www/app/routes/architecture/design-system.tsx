/**
 * @openelement/ui - Web Standards Lab design system page.
 */
export const meta = { section: 'Reference', label: 'Design System', order: 10 };
export const tagName = 'ui-showcase';

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host {
    display: block;
    color: #101828;
  }

  * {
    box-sizing: border-box;
  }

  .ds-container {
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

  .kicker,
  .ds-section-label {
    margin: 0 0 12px;
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 850;
    letter-spacing: 0;
    text-transform: uppercase;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .ds-title {
    margin: 0;
    color: #101828;
    font-size: 56px;
    font-weight: 780;
    line-height: 1.02;
    letter-spacing: 0;
  }

  .ds-subtitle {
    max-width: 720px;
    margin: 18px 0 0;
    color: #475467;
    font-size: 18px;
    line-height: 1.62;
  }

  .rule-card {
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    padding: 20px;
  }

  .rule-card h2 {
    margin: 0 0 12px;
    color: #101828;
    font-size: 20px;
    letter-spacing: 0;
  }

  .rule-card ul {
    margin: 0;
    padding-left: 18px;
    color: #667085;
    font-size: 14px;
    line-height: 1.62;
  }

  .ds-section {
    padding-top: 46px;
  }

  .ds-section-heading {
    margin: 0 0 20px;
    color: #101828;
    font-size: 28px;
    line-height: 1.14;
    letter-spacing: 0;
  }

  .swatch-grid,
  .component-grid,
  .principles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .swatch-card,
  .component-card,
  .principle {
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    padding: 16px;
  }

  .swatch {
    height: 82px;
    border-radius: 6px;
    border: 1px solid rgba(16,24,40,0.12);
    margin-bottom: 12px;
  }

  .swatch-label,
  .swatch-value {
    display: block;
    font-size: 12px;
    line-height: 1.5;
  }

  .swatch-label {
    color: #101828;
    font-weight: 750;
  }

  .swatch-value {
    color: #667085;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .type-scale {
    border: 1px solid rgba(16,24,40,0.12);
    border-radius: 8px;
    background: #ffffff;
    overflow: hidden;
  }

  .type-row {
    display: grid;
    grid-template-columns: 128px 150px 1fr;
    gap: 18px;
    align-items: baseline;
    padding: 16px 18px;
    border-bottom: 1px solid rgba(16,24,40,0.08);
  }

  .type-row:last-child {
    border-bottom: 0;
  }

  .type-label,
  .type-detail {
    color: #667085;
    font-size: 12px;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .type-sample {
    color: #101828;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: 0;
  }

  .component-card {
    min-height: 190px;
  }

  .component-card h3,
  .principle h3 {
    margin: 0 0 12px;
    color: #101828;
    font-size: 18px;
    letter-spacing: 0;
  }

  .component-card p,
  .principle p {
    margin: 12px 0 0;
    color: #667085;
    font-size: 14px;
    line-height: 1.58;
  }

  .button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid rgba(16,24,40,0.14);
    background: #ffffff;
    color: #101828;
    font-size: 14px;
    font-weight: 700;
  }

  .button.primary {
    background: #1d4ed8;
    border-color: #1d4ed8;
    color: #ffffff;
  }

  .button.icon {
    width: 38px;
    padding: 0;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .field {
    height: 40px;
    width: 100%;
    border-radius: 8px;
    border: 1px solid rgba(16,24,40,0.14);
    background: #ffffff;
    padding: 0 12px;
    color: #101828;
    font-size: 14px;
  }

  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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

  .badge.green {
    background: #ecfdf5;
    color: #047857;
  }

  .badge.amber {
    background: #fffbeb;
    color: #b45309;
  }

  .artifact {
    margin-top: 10px;
    border-radius: 8px;
    background: #111827;
    color: #d1d5db;
    padding: 16px;
    font-size: 12px;
    line-height: 1.65;
    font-family: var(--font-mono, ui-monospace, monospace);
    overflow: auto;
  }

  .principle strong {
    display: block;
    color: #1d4ed8;
    font-size: 12px;
    margin-bottom: 10px;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .nav-row {
    margin-top: 34px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .nav-row a {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    padding: 0 13px;
    border: 1px solid rgba(16,24,40,0.14);
    border-radius: 8px;
    background: #ffffff;
    color: #101828;
    text-decoration: none;
    font-size: 14px;
    font-weight: 700;
  }

  @media (max-width: 920px) {
    .hero,
    .swatch-grid,
    .component-grid,
    .principles {
      grid-template-columns: 1fr;
    }

    .type-row {
      grid-template-columns: 1fr;
      gap: 6px;
    }
  }

  @media (max-width: 560px) {
    .ds-container {
      padding: 38px 18px 64px;
    }

    .ds-title {
      font-size: 40px;
      line-height: 1.06;
    }
  }
`);

const palette = [
  { name: 'Canvas', value: '#f6f8fb', color: '#f6f8fb' },
  { name: 'Surface', value: '#ffffff', color: '#ffffff' },
  { name: 'Border', value: 'rgba(16,24,40,0.12)', color: '#d7dee8' },
  { name: 'Brand', value: '#1d4ed8', color: '#1d4ed8' },
  { name: 'Standards', value: '#047857', color: '#047857' },
  { name: 'Warning', value: '#b45309', color: '#b45309' },
  { name: 'Text', value: '#101828', color: '#101828' },
  { name: 'Muted', value: '#667085', color: '#667085' },
  { name: 'Code', value: '#111827', color: '#111827' },
];

const typeScale: Array<{ label: string; detail: string; style: Record<string, string> }> = [
  { label: 'Display', detail: '56 / 780 / 0', style: { fontSize: '56px', fontWeight: '780', lineHeight: '1.02' } },
  { label: 'Page title', detail: '40 / 760 / 0', style: { fontSize: '40px', fontWeight: '760', lineHeight: '1.1' } },
  { label: 'Section', detail: '28 / 720 / 0', style: { fontSize: '28px', fontWeight: '720', lineHeight: '1.16' } },
  { label: 'Card title', detail: '18 / 700 / 0', style: { fontSize: '18px', fontWeight: '700', lineHeight: '1.25' } },
  { label: 'Body', detail: '16 / 400 / 0', style: { fontSize: '16px', fontWeight: '400', lineHeight: '1.65' } },
  { label: 'Caption', detail: '12 / 800 / 0', style: { fontSize: '12px', fontWeight: '800', lineHeight: '1.45' } },
];

export class UIShowcase extends OpenElement {
  static override styles = [linearTokenSheet, routeSheet];

  override render() {
    return (
      <div class="ds-container">
        <section class="hero">
          <div>
            <p class="kicker">Web Standards Lab</p>
            <h1 class="ds-title">Design System</h1>
            <p class="ds-subtitle">
              The www visual language is light-first, documentation-focused,
              and built around real framework artifacts: route graphs, code,
              package boundaries, and browser standards.
            </p>
          </div>
          <aside class="rule-card">
            <h2>Rules</h2>
            <ul>
              <li>Light surfaces, dark code/artifact panels.</li>
              <li>8px radius or less for interface containers.</li>
              <li>No negative letter spacing.</li>
              <li>No Linear clone, no decorative blobs.</li>
            </ul>
          </aside>
        </section>

        <section class="ds-section">
          <p class="ds-section-label">Color</p>
          <h2 class="ds-section-heading">Light-first palette</h2>
          <div class="swatch-grid">
            {palette.map((item) => (
              <div class="swatch-card">
                <div class="swatch" style={{ background: item.color }}></div>
                <span class="swatch-label">{item.name}</span>
                <span class="swatch-value">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section class="ds-section">
          <p class="ds-section-label">Typography</p>
          <h2 class="ds-section-heading">Type scale</h2>
          <div class="type-scale">
            {typeScale.map((item) => (
              <div class="type-row">
                <span class="type-label">{item.label}</span>
                <span class="type-detail">{item.detail}</span>
                <span class="type-sample" style={item.style}>
                  Standards-first documentation should be readable at speed.
                </span>
              </div>
            ))}
          </div>
        </section>

        <section class="ds-section">
          <p class="ds-section-label">Components</p>
          <h2 class="ds-section-heading">Interface primitives</h2>
          <div class="component-grid">
            <article class="component-card">
              <h3>Buttons</h3>
              <div class="button-row">
                <span class="button primary">Primary</span>
                <span class="button">Secondary</span>
                <span class="button icon">/</span>
              </div>
              <p>Use text buttons for clear commands and icon buttons for tools.</p>
            </article>
            <article class="component-card">
              <h3>Fields</h3>
              <input class="field" value="app/routes/index.tsx" readonly />
              <p>Inputs stay dense, predictable, and sized to avoid layout shift.</p>
            </article>
            <article class="component-card">
              <h3>Status</h3>
              <div class="badge-row">
                <span class="badge">current</span>
                <span class="badge green">done</span>
                <span class="badge amber">planned</span>
              </div>
              <p>Status language should match roadmap and release truth.</p>
            </article>
          </div>
        </section>

        <section class="ds-section">
          <p class="ds-section-label">Artifacts</p>
          <h2 class="ds-section-heading">Code and diagrams are the visual asset.</h2>
          <pre class="artifact"><code>{`route -> render -> DSD -> island manifest
core  -> element -> app -> adapter-vite -> www
Elements + UI + Framework + Protocols`}</code></pre>
        </section>

        <section class="ds-section">
          <p class="ds-section-label">Layout</p>
          <h2 class="ds-section-heading">Page composition principles</h2>
          <div class="principles">
            <article class="principle">
              <strong>01</strong>
              <h3>Lead with the product object</h3>
              <p>Show routes, package graphs, code, browser contracts, or docs structure in the first viewport.</p>
            </article>
            <article class="principle">
              <strong>02</strong>
              <h3>Keep sections unframed</h3>
              <p>Use cards for repeated items only. Main sections should be open bands with constrained content.</p>
            </article>
            <article class="principle">
              <strong>03</strong>
              <h3>Use evidence as navigation</h3>
              <p>Every major page should point to a guide, API surface, architecture contract, or roadmap truth.</p>
            </article>
          </div>
        </section>

        <nav class="nav-row">
          <a href="/architecture/architecture">Architecture</a>
          <a href="/roadmap">Roadmap</a>
          <a href="/guide/getting-started">Guide</a>
        </nav>
      </div>
    );
  }
}

customElements.define(tagName, UIShowcase);
export default UIShowcase;
