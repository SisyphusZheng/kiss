/**
 * @kissjs/ui — Design System
 * Two palettes. Zero noise.
 *
 * Uses pageStyles for consistent layout with other doc pages.
 * Only UI-specific component demos have custom styles here.
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../components/page-styles.js';
import '../components/layout.js';

export class UIShowcase extends LitElement {
  static styles = [pageStyles, css`
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
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }

    /* ─── Palettes ─── */
    .palette-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
    }

    .palette-card {
      padding: 1.5rem;
    }

    .palette-dark {
      background: var(--bg-base);
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
      color: var(--text-muted);
    }

    .palette-light .palette-name {
      color: var(--text-secondary);
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
      color: var(--text-muted);
    }

    .palette-light .swatch-label {
      color: var(--text-secondary);
    }

    .palette-desc {
      font-size: 0.75rem;
      line-height: 1.6;
    }

    .palette-dark .palette-desc {
      color: var(--text-tertiary);
    }

    .palette-dark .palette-desc strong {
      color: var(--text-primary);
    }

    .palette-light .palette-desc {
      color: var(--text-secondary);
    }

    .palette-light .palette-desc strong {
      color: var(--text-primary);
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
      border-bottom: 1px solid var(--border);
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
      color: var(--text-muted);
    }

    .type-sample {
      color: var(--text-primary);
    }

    /* ─── Component Preview ─── */
    .preview-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
    }

    .preview-header {
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .preview-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .preview-badge {
      font-size: 0.5625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      background: var(--accent-subtle);
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }

    .preview-badge.planned {
      color: var(--text-muted);
    }

    .preview-body {
      padding: 1.25rem;
      display: flex;
      gap: 0.625rem;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    /* ─── Demo Buttons ─── */
    .demo-btn {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1.125rem;
      font-size: 0.8125rem;
      font-weight: 600;
      border-radius: 4px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
      font-family: inherit;
    }

    .demo-btn-primary {
      background: var(--text-primary);
      color: var(--bg-base);
    }

    .demo-btn-primary:hover {
      opacity: 0.85;
    }

    .demo-btn-secondary {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }

    .demo-btn-secondary:hover {
      color: var(--text-primary);
      border-color: var(--border-hover);
    }

    .demo-btn-ghost {
      background: transparent;
      color: var(--text-tertiary);
    }

    .demo-btn-ghost:hover {
      color: var(--text-primary);
    }

    .demo-btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .demo-btn-lg {
      padding: 0.625rem 1.5rem;
      font-size: 0.9375rem;
    }

    /* ─── Demo Cards ─── */
    .demo-cards-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
    }

    .demo-card {
      background: var(--bg-surface);
      padding: 1.5rem;
    }

    .demo-card h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.375rem;
    }

    .demo-card p {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      margin: 0 0 1rem;
      line-height: 1.5;
    }

    .demo-card .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }

    .demo-card .card-tag {
      font-size: 0.625rem;
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* ─── Demo Input ─── */
    .demo-input {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 0.5rem 0.875rem;
      color: var(--text-primary);
      font-size: 0.8125rem;
      font-family: inherit;
      width: 100%;
      max-width: 280px;
      transition: border-color 0.15s;
      outline: none;
    }

    .demo-input::placeholder {
      color: var(--text-muted);
    }

    .demo-input:focus {
      border-color: var(--text-primary);
    }

    /* ─── Install ─── */
    .install-section {
      margin-top: 3.5rem;
      padding: 2rem;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      text-align: center;
    }

    .install-section h3 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem;
    }

    .install-cmd {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem 1.25rem;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      font-size: 0.8125rem;
      color: var(--text-primary);
    }

    .install-cmd .prompt {
      color: var(--text-muted);
    }

    .install-section p {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
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

      .demo-cards-row {
        grid-template-columns: 1fr;
      }

      .swatch-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
      }

      .demo-input {
        max-width: 100%;
      }

      .install-cmd {
        font-size: 0.75rem;
        padding: 0.5rem 1rem;
      }
    }
  `];

  render() {
    return html`
      <app-layout current-path="/ui">
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
                <span class="type-sample" style="font-size:0.9375rem;color:var(--text-secondary)"
                >Body text for paragraphs.</span>
              </div>
              <div class="type-row">
                <span class="type-label">Caption</span>
                <span
                  class="type-sample"
                  style="font-size:0.6875rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.08em;font-weight:600"
                >Caption</span>
              </div>
              <div class="type-row">
                <span class="type-label">Mono</span>
                <span
                  class="type-sample"
                  style="font-size:0.8125rem;font-family:'SF Mono','Fira Code','Consolas',monospace;color:var(--text-primary)"
                >deno add jsr:@kissjs/ui</span>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="section">
            <div class="section-title">Button</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">Variants</span>
                <span class="preview-badge">Available</span>
              </div>
              <div class="preview-body">
                <button class="demo-btn demo-btn-primary">Primary</button>
                <button class="demo-btn demo-btn-secondary">Secondary</button>
                <button class="demo-btn demo-btn-ghost">Ghost</button>
              </div>
              <div class="preview-body" style="border-top:1px solid var(--border)">
                <button class="demo-btn demo-btn-primary demo-btn-sm">Small</button>
                <button class="demo-btn demo-btn-primary">Default</button>
                <button class="demo-btn demo-btn-primary demo-btn-lg">Large</button>
              </div>
            </div>
          </div>

          <!-- Cards -->
          <div class="section">
            <div class="section-title">Card</div>
            <div class="demo-cards-row">
              <div class="demo-card">
                <h4>Island</h4>
                <p>Interactive islands with hydration and Shadow DOM.</p>
                <div class="card-footer">
                  <span class="card-tag">Interactive</span>
                  <button class="demo-btn demo-btn-primary demo-btn-sm">Use</button>
                </div>
              </div>
              <div class="demo-card">
                <h4>Static</h4>
                <p>Zero-JS rendered via DSD. Visible before JS loads.</p>
                <div class="card-footer">
                  <span class="card-tag">0 KB JS</span>
                  <button class="demo-btn demo-btn-secondary demo-btn-sm">Use</button>
                </div>
              </div>
              <div class="demo-card">
                <h4>API Route</h4>
                <p>Server logic with Hono RPC. Type-safe end to end.</p>
                <div class="card-footer">
                  <span class="card-tag">Type-Safe</span>
                  <button class="demo-btn demo-btn-secondary demo-btn-sm">Use</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="section">
            <div class="section-title">Input</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">Text Input</span>
                <span class="preview-badge planned">Planned</span>
              </div>
              <div class="preview-body" style="flex-direction:column;gap:0.75rem">
                <input class="demo-input" type="text" placeholder="Enter email..." />
                <input class="demo-input" type="text" value="hello@kissjs.org" readonly />
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
      </app-layout>
    `;
  }
}

customElements.define('ui-showcase', UIShowcase);

export default UIShowcase;
export const tagName = 'ui-showcase';
