/**
 * @kissjs/ui — Design System
 * Two palettes. Zero noise.
 *
 * Dogfooding: Uses actual kiss-button, kiss-card, kiss-input components.
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../components/page-styles.js';
import '../components/layout.js';

// Import KISS UI components for dogfooding
import '@kissjs/ui/kiss-button';
import '@kissjs/ui/kiss-card';
import '@kissjs/ui/kiss-input';
import '@kissjs/ui/kiss-code-block';

export class UIShowcase extends LitElement {
  static styles = [
    pageStyles,
    css`
      :host {
        display: block;
      }

      /* ─── Section ─── */
      .section {
        margin-bottom: 3.5rem;
      }

      .section-title {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--kiss-text-muted);
        margin-bottom: 1.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--kiss-border);
      }

      /* ─── Palettes ─── */
      .palette-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
        background: var(--kiss-border);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        overflow: hidden;
      }

      .palette-card {
        padding: 1.5rem;
      }

      .palette-dark {
        background: var(--kiss-bg-base);
      }

      .palette-light {
        background: #fff;
      }

      .palette-name {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 1rem;
      }

      .palette-dark .palette-name {
        color: var(--kiss-text-muted);
      }

      .palette-light .palette-name {
        color: var(--kiss-text-secondary);
      }

      .swatch-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }

      .swatch-item {
        text-align: center;
      }

      .swatch {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 4px;
        margin-bottom: 0.375rem;
      }

      .palette-dark .swatch {
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .palette-light .swatch {
        border: 1px solid rgba(0, 0, 0, 0.08);
      }

      .swatch-label {
        font-size: 0.5625rem;
        font-weight: 600;
        letter-spacing: 0.04em;
      }

      .palette-dark .swatch-label {
        color: var(--kiss-text-muted);
      }

      .palette-light .swatch-label {
        color: var(--kiss-text-secondary);
      }

      .palette-desc {
        font-size: 0.75rem;
        line-height: 1.6;
      }

      .palette-dark .palette-desc {
        color: var(--kiss-text-tertiary);
      }

      .palette-dark .palette-desc strong {
        color: var(--kiss-text-primary);
      }

      .palette-light .palette-desc {
        color: var(--kiss-text-secondary);
      }

      .palette-light .palette-desc strong {
        color: var(--kiss-text-primary);
      }

      /* ─── Typography ─── */
      .type-scale {
        display: flex;
        flex-direction: column;
      }

      .type-row {
        display: flex;
        align-items: baseline;
        gap: 1.5rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--kiss-border);
      }

      .type-row:last-child {
        border-bottom: none;
      }

      .type-label {
        min-width: 72px;
        font-size: 0.5625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--kiss-text-muted);
      }

      .type-sample {
        color: var(--kiss-text-primary);
      }

      /* ─── Component Preview ─── */
      .preview-card {
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        overflow: hidden;
      }

      .preview-header {
        padding: 0.875rem 1.25rem;
        border-bottom: 1px solid var(--kiss-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .preview-title {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--kiss-text-primary);
      }

      .preview-badge {
        font-size: 0.5625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        background: var(--kiss-accent-subtle);
        color: var(--kiss-text-secondary);
        border: 1px solid var(--kiss-border);
      }

      .preview-body {
        padding: 1.25rem;
        display: flex;
        gap: 0.625rem;
        flex-wrap: wrap;
        align-items: flex-start;
      }

      /* ─── Cards Grid ─── */
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      /* ─── Install ─── */
      .install-section {
        margin-top: 3.5rem;
        padding: 2rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        text-align: center;
      }

      .install-section h3 {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--kiss-text-primary);
        margin: 0 0 1rem;
      }

      .install-cmd {
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.625rem 1.25rem;
        background: var(--kiss-bg-elevated);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.8125rem;
        color: var(--kiss-text-primary);
      }

      .install-cmd .prompt {
        color: var(--kiss-text-muted);
      }

      .install-section p {
        font-size: 0.8125rem;
        color: var(--kiss-text-tertiary);
        margin: 0.75rem 0 0;
      }

      /* ─── Mobile ─── */
      @media (max-width: 900px) {
        .section {
          margin-bottom: 2.5rem;
        }

        .type-row {
          gap: 1rem;
        }

        .preview-body {
          padding: 1rem;
        }

        .install-section {
          padding: 1.5rem 1rem;
        }
      }

      @media (max-width: 640px) {
        .palette-row {
          grid-template-columns: 1fr;
        }

        .swatch-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .install-cmd {
          font-size: 0.75rem;
          padding: 0.5rem 1rem;
        }
      }
    `,
  ];

  render() {
    return html`
      <kiss-layout current-path="/ui">
        <div class="container">
          <h1>Design System</h1>
          <p class="subtitle">
            <strong>Two palettes. Zero noise.</strong><br>
            Dark and Light. Black and White. Nothing else.
          </p>

          <!-- Palettes -->
          <div class="section">
            <div class="section-title">Palettes</div>
            <div class="palette-row">
              <div class="palette-card palette-dark">
                <div class="palette-name">Dark</div>
                <div class="swatch-grid">
                  <div class="swatch-item">
                    <div class="swatch" style="background:#000"></div>
                    <div class="swatch-label">Base</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#0a0a0a"></div>
                    <div class="swatch-label">Surface</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#fff"></div>
                    <div class="swatch-label">Primary</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#999"></div>
                    <div class="swatch-label">Secondary</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#666"></div>
                    <div class="swatch-label">Tertiary</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#444"></div>
                    <div class="swatch-label">Muted</div>
                  </div>
                </div>
                <p class="palette-desc">
                  <strong>Black</strong> foundation. White for emphasis. Gray for hierarchy.
                </p>
              </div>
              <div class="palette-card palette-light">
                <div class="palette-name">Light</div>
                <div class="swatch-grid">
                  <div class="swatch-item">
                    <div class="swatch" style="background:#fff"></div>
                    <div class="swatch-label">Base</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#fafafa"></div>
                    <div class="swatch-label">Surface</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#000"></div>
                    <div class="swatch-label">Primary</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#555"></div>
                    <div class="swatch-label">Secondary</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#888"></div>
                    <div class="swatch-label">Tertiary</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#aaa"></div>
                    <div class="swatch-label">Muted</div>
                  </div>
                </div>
                <p class="palette-desc">
                  <strong>White</strong> foundation. Black for emphasis. Gray for hierarchy.
                </p>
              </div>
            </div>
          </div>

          <!-- Typography -->
          <div class="section">
            <div class="section-title">Typography</div>
            <div class="type-scale">
              <div class="type-row">
                <span class="type-label">Display</span>
                <span class="type-sample" style="font-size:2.5rem;font-weight:900;letter-spacing:-0.04em"
                >KISS UI</span>
              </div>
              <div class="type-row">
                <span class="type-label">H1</span>
                <span class="type-sample" style="font-size:1.75rem;font-weight:800;letter-spacing:-0.03em"
                >Heading One</span>
              </div>
              <div class="type-row">
                <span class="type-label">H2</span>
                <span class="type-sample" style="font-size:1.125rem;font-weight:600">Heading Two</span>
              </div>
              <div class="type-row">
                <span class="type-label">Body</span>
                <span class="type-sample" style="font-size:0.9375rem;color:var(--kiss-text-secondary)"
                >Body text for paragraphs.</span>
              </div>
              <div class="type-row">
                <span class="type-label">Caption</span>
                <span
                  class="type-sample"
                  style="font-size:0.6875rem;color:var(--kiss-text-tertiary);text-transform:uppercase;letter-spacing:0.08em;font-weight:600"
                >Caption</span>
              </div>
              <div class="type-row">
                <span class="type-label">Mono</span>
                <span
                  class="type-sample"
                  style="font-size:0.8125rem;font-family:'SF Mono','Fira Code','Consolas',monospace;color:var(--kiss-text-primary)"
                >deno add jsr:@kissjs/ui</span>
              </div>
            </div>
          </div>

          <!-- Buttons (Dogfooding kiss-button) -->
          <div class="section">
            <div class="section-title">Button</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">Variants</span>
                <span class="preview-badge">Available</span>
              </div>
              <div class="preview-body">
                <kiss-button variant="primary">Primary</kiss-button>
                <kiss-button>Default</kiss-button>
                <kiss-button variant="ghost">Ghost</kiss-button>
              </div>
              <div class="preview-body" style="border-top:1px solid var(--kiss-border)">
                <kiss-button variant="primary" size="sm">Small</kiss-button>
                <kiss-button variant="primary" size="md">Default</kiss-button>
                <kiss-button variant="primary" size="lg">Large</kiss-button>
              </div>
              <div class="preview-body" style="border-top:1px solid var(--kiss-border)">
                <kiss-button disabled>Disabled</kiss-button>
                <kiss-button href="/" target="_blank">Link Button</kiss-button>
              </div>
            </div>
          </div>

          <!-- Cards (Dogfooding kiss-card) -->
          <div class="section">
            <div class="section-title">Card</div>
            <div class="cards-grid">
              <kiss-card>
                <h3 slot="header">Island</h3>
                <p>Interactive islands with hydration and Shadow DOM.</p>
                <div slot="footer">
                  <kiss-button size="sm">Use</kiss-button>
                </div>
              </kiss-card>
              <kiss-card>
                <h3 slot="header">Static</h3>
                <p>Zero-JS rendered via DSD. Visible before JS loads.</p>
                <div slot="footer">
                  <kiss-button size="sm">Use</kiss-button>
                </div>
              </kiss-card>
              <kiss-card variant="elevated">
                <h3 slot="header">API Route</h3>
                <p>Server logic with Hono RPC. Type-safe end to end.</p>
                <div slot="footer">
                  <kiss-button size="sm">Use</kiss-button>
                </div>
              </kiss-card>
            </div>
          </div>

          <!-- Input (Dogfooding kiss-input) -->
          <div class="section">
            <div class="section-title">Input</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">Text Input</span>
                <span class="preview-badge">Available</span>
              </div>
              <div class="preview-body" style="flex-direction:column;gap:0.75rem">
                <kiss-input placeholder="Enter email..." label="Email"></kiss-input>
                <kiss-input type="password" placeholder="Password" label="Password" required></kiss-input>
                <kiss-input value="hello@kissjs.org" label="Read-only" disabled></kiss-input>
              </div>
            </div>
          </div>

          <!-- Code Block (Dogfooding kiss-code-block) -->
          <div class="section">
            <div class="section-title">Code Block</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">With Copy Button</span>
                <span class="preview-badge">Available</span>
              </div>
              <div class="preview-body">
                <kiss-code-block>
                  <pre><code>import '@kissjs/ui';

                  // Use components
                  &lt;kiss-button variant="primary"&gt;Click me&lt;/kiss-button&gt;
                  &lt;kiss-card&gt;Content&lt;/kiss-card&gt;</code></pre>
                </kiss-code-block>
              </div>
            </div>
          </div>

          <!-- Install -->
          <div class="install-section">
            <h3>Install @kissjs/ui</h3>
            <div class="install-cmd">
              <span class="prompt">$</span> deno add jsr:@kissjs/ui
            </div>
            <p>Deno, Node, Bun. Zero config.</p>
          </div>

          <div class="nav-row">
            <a href="/styling/kiss-ui" class="nav-link">&larr; @kissjs/ui Docs</a>
            <a href="/guide/getting-started" class="nav-link">Getting Started &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('ui-showcase', UIShowcase);

export default UIShowcase;
export const tagName = 'ui-showcase';
