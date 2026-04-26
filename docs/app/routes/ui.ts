/**
 * @kissjs/ui — Design System Showcase
 * Pure B&W — Two palettes: Dark / Light. Nothing else.
 * Route: /ui
 */
import { css, html, LitElement } from '@kissjs/core';
import '../components/layout.js';

export class UIShowcase extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .container {
      max-width: 960px;
      padding: 3rem 2.5rem 4rem;
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 900;
      letter-spacing: -0.04em;
      margin: 0 0 0.5rem;
      color: var(--text-primary);
      line-height: 1.1;
    }

    .subtitle {
      color: var(--text-secondary);
      margin-bottom: 3rem;
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    .subtitle strong {
      color: var(--text-primary);
      font-weight: 600;
    }

    /* Section */
    .section {
      margin-bottom: 3.5rem;
    }

    .section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }

    /* === Palette Preview === */
    .palette-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .palette-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .palette-header {
      padding: 0.75rem 1.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid var(--border);
    }

    .palette-dark .palette-header {
      background: #000;
      color: #fff;
      border-color: #1a1a1a;
    }

    .palette-light .palette-header {
      background: #fff;
      color: #000;
      border-color: #e5e5e5;
    }

    .palette-body {
      padding: 1.25rem;
    }

    .palette-dark .palette-body {
      background: #000;
    }

    .palette-light .palette-body {
      background: #fff;
    }

    .swatch-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .swatch {
      width: 48px;
      height: 48px;
      border-radius: 6px;
      border: 1px solid rgba(128, 128, 128, 0.2);
      position: relative;
    }

    .swatch-label {
      font-size: 0.5625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
      text-align: center;
    }

    .palette-dark .swatch-label {
      color: #666;
    }

    .palette-light .swatch-label {
      color: #999;
    }

    .palette-sample {
      line-height: 1.7;
      font-size: 0.8125rem;
    }

    .palette-dark .palette-sample {
      color: #999;
    }

    .palette-dark .palette-sample strong {
      color: #fff;
    }

    .palette-light .palette-sample {
      color: #555;
    }

    .palette-light .palette-sample strong {
      color: #000;
    }

    /* === Typography Scale === */
    .type-scale {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .type-row {
      display: flex;
      align-items: baseline;
      gap: 1.5rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
    }

    .type-label {
      min-width: 80px;
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    .type-sample {
      color: var(--text-primary);
    }

    /* === Component Preview === */
    .preview-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .preview-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .preview-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .preview-badge {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0.25rem 0.625rem;
      border-radius: 100px;
      background: var(--accent-subtle);
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }

    .preview-badge.planned {
      color: var(--text-muted);
    }

    .preview-body {
      padding: 1.5rem 1.25rem;
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    /* Demo Buttons — Pure B&W */
    .demo-btn {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1.25rem;
      font-size: 0.8125rem;
      font-weight: 600;
      border-radius: 6px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
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
      padding: 0.375rem 0.875rem;
      font-size: 0.75rem;
    }

    .demo-btn-lg {
      padding: 0.75rem 1.75rem;
      font-size: 0.9375rem;
    }

    /* Demo Cards */
    .demo-cards-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .demo-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      transition: border-color 0.2s;
    }

    .demo-card:hover {
      border-color: var(--border-hover);
    }

    .demo-card h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem;
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
      font-size: 0.6875rem;
      color: var(--text-secondary);
      font-weight: 600;
    }

    /* Demo Input */
    .demo-input {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.625rem 1rem;
      color: var(--text-primary);
      font-size: 0.8125rem;
      font-family: inherit;
      width: 100%;
      max-width: 320px;
      transition: border-color 0.2s;
      outline: none;
    }

    .demo-input::placeholder {
      color: var(--text-muted);
    }

    .demo-input:focus {
      border-color: var(--text-primary);
    }

    /* Install */
    .install-section {
      margin-top: 3rem;
      padding: 2rem;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      text-align: center;
    }

    .install-section h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem;
    }

    .install-cmd {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    .install-cmd .prompt {
      color: var(--text-muted);
    }

    .install-section p {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      margin: 1rem 0 0;
    }

    /* Nav */
    .nav-row {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      border: 1px solid var(--border);
      border-radius: 6px;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
    }

    .nav-link:hover {
      color: var(--text-primary);
      border-color: var(--border-hover);
      background: var(--accent-subtle);
    }

    @media (max-width: 640px) {
      .palette-row {
        grid-template-columns: 1fr;
      }
    }
  `;

  render() {
    return html`
      <app-layout current-path="/ui">
        <div class="container">
          <h1>Design System</h1>
          <p class="subtitle">
            <strong>Two palettes. Zero noise.</strong><br>
            Dark and Light. Black and White. That's it.
          </p>

          <!-- Palettes -->
          <div class="section">
            <div class="section-title">Palettes</div>
            <div class="palette-row">
              <!-- Dark -->
              <div class="palette-card palette-dark">
                <div class="palette-header">Dark</div>
                <div class="palette-body">
                  <div class="swatch-row">
                    <div>
                      <div class="swatch" style="background:#000"></div>
                      <div class="swatch-label">Base</div>
                    </div>
                    <div>
                      <div class="swatch" style="background:#0a0a0a"></div>
                      <div class="swatch-label">Surface</div>
                    </div>
                    <div>
                      <div class="swatch" style="background:#111"></div>
                      <div class="swatch-label">Elevated</div>
                    </div>
                    <div>
                      <div class="swatch" style="background:#fff"></div>
                      <div class="swatch-label">Text</div>
                    </div>
                    <div>
                      <div class="swatch" style="background:#999"></div>
                      <div class="swatch-label">Muted</div>
                    </div>
                  </div>
                  <p class="palette-sample">
                    <strong>Pure black</strong> foundation. White for emphasis. Gray for hierarchy.
                  </p>
                </div>
              </div>
              <!-- Light -->
              <div class="palette-card palette-light">
                <div class="palette-header">Light</div>
                <div class="palette-body">
                  <div class="swatch-row">
                    <div>
                      <div class="swatch" style="background:#fff"></div>
                      <div class="swatch-label">Base</div>
                    </div>
                    <div>
                      <div class="swatch" style="background:#fafafa"></div>
                      <div class="swatch-label">Surface</div>
                    </div>
                    <div>
                      <div class="swatch" style="background:#f5f5f5"></div>
                      <div class="swatch-label">Elevated</div>
                    </div>
                    <div>
                      <div class="swatch" style="background:#000"></div>
                      <div class="swatch-label">Text</div>
                    </div>
                    <div>
                      <div class="swatch" style="background:#555"></div>
                      <div class="swatch-label">Muted</div>
                    </div>
                  </div>
                  <p class="palette-sample">
                    <strong>Pure white</strong> foundation. Black for emphasis. Gray for hierarchy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Typography -->
          <div class="section">
            <div class="section-title">Typography</div>
            <div class="type-scale">
              <div class="type-row">
                <span class="type-label">Display</span>
                <span class="type-sample" style="font-size:3rem;font-weight:900;letter-spacing:-0.04em"
                >KISS UI</span>
              </div>
              <div class="type-row">
                <span class="type-label">H1</span>
                <span class="type-sample" style="font-size:2rem;font-weight:800;letter-spacing:-0.03em"
                >Heading One</span>
              </div>
              <div class="type-row">
                <span class="type-label">H2</span>
                <span class="type-sample" style="font-size:1.25rem;font-weight:600">Heading Two</span>
              </div>
              <div class="type-row">
                <span class="type-label">Body</span>
                <span class="type-sample" style="font-size:0.9375rem;color:var(--text-secondary)"
                >Body text for paragraphs and content blocks.</span>
              </div>
              <div class="type-row">
                <span class="type-label">Caption</span>
                <span
                  class="type-sample"
                  style="font-size:0.75rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.08em;font-weight:600"
                >Caption / Label</span>
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
            <div class="section-title">Components — Button</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">Button Variants</span>
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
            <div class="section-title">Components — Card</div>
            <div class="demo-cards-row">
              <div class="demo-card">
                <h4>Island Component</h4>
                <p>Interactive islands with automatic hydration and Shadow DOM encapsulation.</p>
                <div class="card-footer">
                  <span class="card-tag">Interactive</span>
                  <button class="demo-btn demo-btn-primary demo-btn-sm">Use</button>
                </div>
              </div>
              <div class="demo-card">
                <h4>Static Component</h4>
                <p>Zero-JS rendered via DSD. Content visible before any JavaScript loads.</p>
                <div class="card-footer">
                  <span class="card-tag">0 KB JS</span>
                  <button class="demo-btn demo-btn-secondary demo-btn-sm">Use</button>
                </div>
              </div>
              <div class="demo-card">
                <h4>API Route</h4>
                <p>Server-side logic with Hono RPC. Type-safe from server to client.</p>
                <div class="card-footer">
                  <span class="card-tag">Type-Safe</span>
                  <button class="demo-btn demo-btn-secondary demo-btn-sm">Use</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="section">
            <div class="section-title">Components — Input</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">Text Input</span>
                <span class="preview-badge planned">Planned</span>
              </div>
              <div class="preview-body" style="flex-direction:column;gap:1rem">
                <input class="demo-input" type="text" placeholder="Enter your email..." />
                <input class="demo-input" type="text" value="hello@kissjs.org" readonly />
              </div>
            </div>
          </div>

          <!-- Install -->
          <div class="install-section">
            <h3>Get Started with @kissjs/ui</h3>
            <div class="install-cmd">
              <span class="prompt">$</span> deno add jsr:@kissjs/ui
            </div>
            <p>Works with Deno, Node, and Bun. Zero config needed.</p>
          </div>

          <!-- Nav -->
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
