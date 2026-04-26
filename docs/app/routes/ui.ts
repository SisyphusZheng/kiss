/**
 * @kissjs/ui — Design System Showcase
 * A live demo page for the KISS UI component library.
 * Route: /ui/
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
      color: #fff;
      line-height: 1.1;
    }

    .subtitle {
      color: #666;
      margin-bottom: 3rem;
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    .subtitle strong {
      color: #00e87b;
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
      color: #333;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #1a1a1a;
    }

    .section-title .tag {
      color: #00e87b;
      margin-left: 0.5rem;
      font-weight: 600;
    }

    /* Design Tokens Grid */
    .tokens-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.75rem;
    }

    .token-card {
      background: #0a0a0a;
      border: 1px solid #1a1a1a;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      transition: border-color 0.2s;
    }

    .token-card:hover {
      border-color: #333;
    }

    .token-swatch {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      margin: 0 auto 0.75rem;
      border: 1px solid #1a1a1a;
    }

    .token-name {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #aaa;
      letter-spacing: 0.02em;
    }

    .token-value {
      font-size: 0.625rem;
      color: #555;
      margin-top: 0.25rem;
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
    }

    /* Component Preview */
    .preview-card {
      background: #0a0a0a;
      border: 1px solid #1a1a1a;
      border-radius: 8px;
      overflow: hidden;
    }

    .preview-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #1a1a1a;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .preview-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #fff;
    }

    .preview-badge {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0.25rem 0.625rem;
      border-radius: 100px;
      background: rgba(0, 232, 123, 0.1);
      color: #00e87b;
      border: 1px solid rgba(0, 232, 123, 0.2);
    }

    .preview-badge.planned {
      background: rgba(255, 255, 255, 0.03);
      color: #555;
      border-color: #222;
    }

    .preview-body {
      padding: 1.5rem 1.25rem;
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    /* Demo Buttons */
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
      background: #00e87b;
      color: #000;
    }

    .demo-btn-primary:hover {
      background: #00ff88;
      box-shadow: 0 0 16px rgba(0, 232, 123, 0.3);
    }

    .demo-btn-secondary {
      background: transparent;
      color: #888;
      border: 1px solid #222;
    }

    .demo-btn-secondary:hover {
      color: #fff;
      border-color: #444;
    }

    .demo-btn-ghost {
      background: transparent;
      color: #666;
    }

    .demo-btn-ghost:hover {
      color: #fff;
    }

    .demo-btn-danger {
      background: #ff3b3b;
      color: #fff;
    }

    .demo-btn-danger:hover {
      background: #ff5555;
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
      background: #0f0f0f;
      border: 1px solid #1a1a1a;
      border-radius: 8px;
      padding: 1.5rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .demo-card:hover {
      border-color: #333;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .demo-card h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #fff;
      margin: 0 0 0.5rem;
    }

    .demo-card p {
      font-size: 0.8125rem;
      color: #666;
      margin: 0 0 1rem;
      line-height: 1.5;
    }

    .demo-card .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #1a1a1a;
    }

    .demo-card .card-tag {
      font-size: 0.6875rem;
      color: #00e87b;
      font-weight: 600;
    }

    /* Demo Input */
    .demo-input {
      background: #0a0a0a;
      border: 1px solid #222;
      border-radius: 6px;
      padding: 0.625rem 1rem;
      color: #fff;
      font-size: 0.8125rem;
      font-family: inherit;
      width: 100%;
      max-width: 320px;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }

    .demo-input::placeholder {
      color: #444;
    }

    .demo-input:focus {
      border-color: #00e87b;
      box-shadow: 0 0 0 3px rgba(0, 232, 123, 0.1);
    }

    /* Typography Scale */
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
      border-bottom: 1px solid #1a1a1a;
    }

    .type-label {
      min-width: 80px;
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #333;
    }

    .type-sample {
      color: #fff;
    }

    /* Install */
    .install-section {
      margin-top: 3rem;
      padding: 2rem;
      background: #0a0a0a;
      border: 1px solid #1a1a1a;
      border-radius: 8px;
      text-align: center;
    }

    .install-section h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      margin: 0 0 1rem;
    }

    .install-cmd {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      background: #111;
      border: 1px solid #1a1a1a;
      border-radius: 6px;
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      font-size: 0.875rem;
      color: #00e87b;
    }

    .install-cmd .prompt {
      color: #444;
    }

    .install-section p {
      font-size: 0.8125rem;
      color: #666;
      margin: 1rem 0 0;
    }

    /* Nav */
    .nav-row {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid #1a1a1a;
      display: flex;
      justify-content: space-between;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #888;
      text-decoration: none;
      border: 1px solid #1a1a1a;
      border-radius: 6px;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
    }

    .nav-link:hover {
      color: #fff;
      border-color: #333;
      background: #111;
    }
  `;

  render() {
    return html`
      <app-layout current-path="/ui">
        <div class="container">
          <h1>@kissjs/ui</h1>
          <p class="subtitle">
            A <strong>native Web Components</strong> library built on Lit + Open Props.
            Zero framework lock-in, full Shadow DOM encapsulation.
          </p>

          <!-- Design Tokens -->
          <div class="section">
            <div class="section-title">Design Tokens <span class="tag">Colors</span></div>
            <div class="tokens-grid">
              <div class="token-card">
                <div class="token-swatch" style="background:#00e87b"></div>
                <div class="token-name">Brand</div>
                <div class="token-value">#00e87b</div>
              </div>
              <div class="token-card">
                <div class="token-swatch" style="background:#00c9ff"></div>
                <div class="token-name">Info</div>
                <div class="token-value">#00c9ff</div>
              </div>
              <div class="token-card">
                <div class="token-swatch" style="background:#ff3b3b"></div>
                <div class="token-name">Danger</div>
                <div class="token-value">#ff3b3b</div>
              </div>
              <div class="token-card">
                <div class="token-swatch" style="background:#ffaa00"></div>
                <div class="token-name">Warning</div>
                <div class="token-value">#ffaa00</div>
              </div>
              <div class="token-card">
                <div class="token-swatch" style="background:#fff"></div>
                <div class="token-name">Text</div>
                <div class="token-value">#ffffff</div>
              </div>
              <div class="token-card">
                <div class="token-swatch" style="background:#888"></div>
                <div class="token-name">Muted</div>
                <div class="token-value">#888888</div>
              </div>
              <div class="token-card">
                <div class="token-swatch" style="background:#0a0a0a;border-color:#222"></div>
                <div class="token-name">Surface</div>
                <div class="token-value">#0a0a0a</div>
              </div>
              <div class="token-card">
                <div class="token-swatch" style="background:#000;border-color:#222"></div>
                <div class="token-name">Base</div>
                <div class="token-value">#000000</div>
              </div>
            </div>
          </div>

          <!-- Typography -->
          <div class="section">
            <div class="section-title">Design Tokens <span class="tag">Typography</span></div>
            <div class="type-scale">
              <div class="type-row">
                <span class="type-label">Display</span>
                <span class="type-sample" style="font-size:3rem;font-weight:900;letter-spacing:-0.04em">KISS UI</span>
              </div>
              <div class="type-row">
                <span class="type-label">H1</span>
                <span class="type-sample" style="font-size:2rem;font-weight:800;letter-spacing:-0.03em">Heading One</span>
              </div>
              <div class="type-row">
                <span class="type-label">H2</span>
                <span class="type-sample" style="font-size:1.25rem;font-weight:600">Heading Two</span>
              </div>
              <div class="type-row">
                <span class="type-label">Body</span>
                <span class="type-sample" style="font-size:0.9375rem;color:#999">Body text for paragraphs and content blocks.</span>
              </div>
              <div class="type-row">
                <span class="type-label">Caption</span>
                <span class="type-sample" style="font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Caption / Label</span>
              </div>
              <div class="type-row">
                <span class="type-label">Mono</span>
                <span class="type-sample" style="font-size:0.8125rem;font-family:'SF Mono','Fira Code','Consolas',monospace;color:#00e87b">npm install @kissjs/ui</span>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="section">
            <div class="section-title">Components <span class="tag">Button</span></div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">Button Variants</span>
                <span class="preview-badge">Available</span>
              </div>
              <div class="preview-body">
                <button class="demo-btn demo-btn-primary">Primary</button>
                <button class="demo-btn demo-btn-secondary">Secondary</button>
                <button class="demo-btn demo-btn-ghost">Ghost</button>
                <button class="demo-btn demo-btn-danger">Danger</button>
              </div>
              <div class="preview-body" style="border-top:1px solid #1a1a1a">
                <button class="demo-btn demo-btn-primary demo-btn-sm">Small</button>
                <button class="demo-btn demo-btn-primary">Default</button>
                <button class="demo-btn demo-btn-primary demo-btn-lg">Large</button>
              </div>
            </div>
          </div>

          <!-- Cards -->
          <div class="section">
            <div class="section-title">Components <span class="tag">Card</span></div>
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
            <div class="section-title">Components <span class="tag">Input</span></div>
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
