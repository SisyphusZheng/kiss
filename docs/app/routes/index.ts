import { css, html, LitElement } from '@kissjs/core';
import '../components/layout.js';

export class DocsHome extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ─── Hero ─── */
    .hero {
      max-width: 800px;
      margin: 0 auto;
      padding: 10rem 2rem 5rem;
      text-align: left;
    }

    .hero .overline {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .hero h1 {
      font-size: 4.5rem;
      font-weight: 900;
      letter-spacing: -0.05em;
      margin: 0;
      color: var(--text-primary);
      line-height: 0.95;
    }

    .hero .tagline {
      font-size: 1.0625rem;
      color: var(--text-secondary);
      margin-top: 2rem;
      line-height: 1.8;
      font-weight: 400;
      max-width: 440px;
    }

    .hero .equation {
      margin-top: 3rem;
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .eq-item {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-tertiary);
    }

    .eq-label {
      color: var(--text-muted);
      font-weight: 400;
    }

    .eq-val {
      color: var(--text-primary);
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .cta {
      margin-top: 3rem;
      display: flex;
      gap: 0.625rem;
    }

    .cta a {
      display: inline-flex;
      align-items: center;
      padding: 0.625rem 1.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      text-decoration: none;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .cta-primary {
      background: var(--text-primary);
      color: var(--bg-base);
    }

    .cta-primary:hover {
      opacity: 0.85;
    }

    .cta-secondary {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }

    .cta-secondary:hover {
      color: var(--text-primary);
      border-color: var(--border-hover);
    }

    /* ─── Standards ─── */
    .standards {
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 2rem;
      border-top: 1px solid var(--border);
    }

    .section-label {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
    }

    .pill-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--bg-surface);
      color: var(--text-secondary);
      border: 1px solid var(--border);
      transition: border-color 0.2s, color 0.2s;
    }

    .pill:hover {
      border-color: var(--border-hover);
      color: var(--text-primary);
    }

    .pill .check {
      color: var(--text-primary);
      font-size: 0.625rem;
      font-weight: 700;
    }

    /* ─── Features ─── */
    .features {
      max-width: 800px;
      margin: 0 auto;
      padding: 4rem 2rem;
      border-top: 1px solid var(--border);
    }

    .features-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }

    .feature-item {
      padding: 1.75rem 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    .feature-item:nth-child(odd) {
      border-right: 1px solid var(--border);
    }

    .feature-item:nth-last-child(-n+2) {
      border-bottom: none;
    }

    .feature-item h2 {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 0.375rem;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }

    .feature-item p {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      margin: 0;
      line-height: 1.6;
    }

    /* ─── Comparison ─── */
    .comparison {
      max-width: 800px;
      margin: 0 auto;
      padding: 4rem 2rem;
      border-top: 1px solid var(--border);
    }

    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .comparison-table th,
    .comparison-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    .comparison-table th {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    .comparison-table th:first-child {
      color: var(--text-primary);
    }

    .comparison-table td {
      color: var(--text-tertiary);
    }

    .comparison-table td:first-child {
      color: var(--text-primary);
      font-weight: 500;
    }

    /* ─── JSR ─── */
    .jsr {
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 2rem 5rem;
      border-top: 1px solid var(--border);
    }

    .badge-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .jsr-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.375rem 0.875rem;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-decoration: none;
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      transition: all 0.2s ease;
    }

    .jsr-badge:hover {
      background: var(--bg-elevated);
      color: var(--text-primary);
      border-color: var(--border-hover);
    }

    /* ─── Responsive ─── */
    @media (max-width: 768px) {
      .hero {
        padding: 5rem 1.5rem 3rem;
      }

      .hero h1 {
        font-size: 3rem;
      }

      .features-list {
        grid-template-columns: 1fr;
      }

      .feature-item:nth-child(odd) {
        border-right: none;
      }
    }

    @media (max-width: 480px) {
      .hero h1 {
        font-size: 2.5rem;
      }

      .hero .equation {
        flex-direction: column;
      }
    }
  `;

  render() {
    return html`
      <app-layout home>
        <div class="hero">
          <div class="overline">Web Standards Framework</div>
          <h1>KISS</h1>
          <p class="tagline">
            Keep It Simple, Stupid. A minimal full-stack framework
            built entirely on Web Standards.
          </p>
          <div class="equation">
            <span class="eq-item"><span class="eq-label">HTTP =</span> <span class="eq-val">Fetch API</span></span>
            <span class="eq-item"><span class="eq-label">UI =</span> <span class="eq-val">Web Components</span></span>
            <span class="eq-item"><span class="eq-label">Build =</span> <span class="eq-val">ESM</span></span>
          </div>
          <div class="cta">
            <a class="cta-primary" href="/guide/getting-started">Get Started</a>
            <a class="cta-secondary" href="https://github.com/SisyphusZheng/kiss">GitHub</a>
          </div>
        </div>

        <div class="standards">
          <div class="section-label">Web Standards Coverage</div>
          <div class="pill-row">
            <span class="pill"><span class="check">&#10003;</span> Fetch API</span>
            <span class="pill"><span class="check">&#10003;</span> Web Components</span>
            <span class="pill"><span class="check">&#10003;</span> ESM</span>
            <span class="pill"><span class="check">&#10003;</span> Declarative Shadow DOM</span>
            <span class="pill"><span class="check">&#10003;</span> Islands</span>
          </div>
        </div>

        <div class="features">
          <div class="section-label">Why KISS</div>
          <div class="features-list">
            <div class="feature-item">
              <h2>Web Standards First</h2>
              <p>No new abstractions. If you know the web platform, you know KISS.</p>
            </div>
            <div class="feature-item">
              <h2>Islands Architecture</h2>
              <p>Only interactive components load JS. Default homepage: 0 KB.</p>
            </div>
            <div class="feature-item">
              <h2>Type-Safe RPC</h2>
              <p>End-to-end type safety with Hono RPC. No codegen needed.</p>
            </div>
            <div class="feature-item">
              <h2>Multi-Runtime</h2>
              <p>Same code on Deno, Node, Bun, Cloudflare Workers.</p>
            </div>
            <div class="feature-item">
              <h2>SSG Built-In</h2>
              <p>Pre-render to static HTML at build time. Zero config.</p>
            </div>
            <div class="feature-item">
              <h2>Zero Lock-In</h2>
              <p>Your code works without KISS. Hono, Lit, Vite are all standard.</p>
            </div>
          </div>
        </div>

        <div class="comparison">
          <div class="section-label">Full-Chain Web Standards</div>
          <table class="comparison-table">
            <thead>
              <tr>
                <th>KISS</th>
                <th>Astro</th>
                <th>Next.js</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Fetch API</td>
                <td>Fetch API</td>
                <td>Custom API</td>
              </tr>
              <tr>
                <td>Web Components</td>
                <td>Islands (custom)</td>
                <td>React only</td>
              </tr>
              <tr>
                <td>ESM</td>
                <td>ESM</td>
                <td>ESM + Custom</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="jsr">
          <div class="section-label">Install from JSR</div>
          <div class="badge-row">
            <a class="jsr-badge" href="https://jsr.io/@kissjs/core">@kissjs/core</a>
            <a class="jsr-badge" href="https://jsr.io/@kissjs/ui">@kissjs/ui</a>
            <a class="jsr-badge" href="https://jsr.io/@kissjs/rpc">@kissjs/rpc</a>
          </div>
        </div>
      </app-layout>
    `;
  }
}

customElements.define('docs-home', DocsHome);

export default DocsHome;
export const tagName = 'docs-home';
