import { LitElement, html, css } from '@kissjs/core'
import '../components/layout.js'

export class DocsHome extends LitElement {
  static styles = css`
    :host { display: block; }

    .hero {
      max-width: 800px;
      margin: 0 auto;
      padding: 4rem 1.5rem 2rem;
      text-align: center;
    }

    .hero h1 {
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin: 0;
      background: linear-gradient(135deg, var(--wa-color-primary-600, #2563eb), var(--wa-color-primary-400, #60a5fa));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero .tagline {
      font-size: 1.25rem;
      color: var(--wa-color-neutral-500, #737373);
      margin-top: 0.75rem;
      line-height: 1.6;
    }

    .hero .tagline strong {
      color: var(--wa-color-neutral-700, #404040);
    }

    .cta {
      margin-top: 2rem;
      display: flex;
      gap: var(--wa-space-md, 1rem);
      justify-content: center;
    }

    .features {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem 1.5rem 3rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .feature-card {
      padding: 1.5rem;
      border: 1px solid var(--wa-color-neutral-200, #e5e7eb);
      border-radius: var(--wa-border-radius-lg, 8px);
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .feature-card:hover {
      border-color: var(--wa-color-primary-300, #93c5fd);
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
    }

    .feature-card .icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .feature-card h2 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.375rem;
      color: var(--wa-color-neutral-800, #262626);
    }

    .feature-card p {
      font-size: 0.875rem;
      color: var(--wa-color-neutral-500, #737373);
      margin: 0;
      line-height: 1.5;
    }

    .standards-bar {
      max-width: 800px;
      margin: 0 auto 3rem;
      padding: 0 1.5rem;
      text-align: center;
    }

    .standards-bar .pill-row {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 500;
      background: var(--wa-color-neutral-100, #f5f5f5);
      color: var(--wa-color-neutral-700, #404040);
      border: 1px solid var(--wa-color-neutral-200, #e5e7eb);
    }

    .pill .check {
      color: var(--wa-color-success-600, #16a34a);
    }

    .jsr-badges {
      max-width: 600px;
      margin: 0 auto 2rem;
      padding: 0 1.5rem;
      text-align: center;
    }

    .jsr-badges h3 {
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--wa-color-neutral-400, #a3a3a3);
      margin: 0 0 0.75rem;
    }

    .badge-row {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .jsr-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.625rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #166534;
      text-decoration: none;
      transition: background 0.15s;
    }

    .jsr-badge:hover {
      background: #dcfce7;
    }
  `

  render() {
    return html`
      <app-layout>
        <div class="hero">
          <h1>KISS</h1>
          <p class="tagline">
            <strong>Keep It Simple, Stupid.</strong><br>
            A minimal full-stack framework built on Web Standards.<br>
            HTTP = Fetch API, UI = Web Components, Build = ESM.
          </p>
          <div class="cta">
            <wa-button variant="brand" href="/kiss/guide/getting-started">
              Get Started
            </wa-button>
            <wa-button href="https://github.com/SisyphusZheng/kiss">
              GitHub
            </wa-button>
          </div>
        </div>

        <div class="jsr-badges">
          <h3>Install from JSR</h3>
          <div class="badge-row">
            <a class="jsr-badge" href="https://jsr.io/@kissjs/core">@kissjs/core</a>
            <a class="jsr-badge" href="https://jsr.io/@kissjs/ui">@kissjs/ui</a>
            <a class="jsr-badge" href="https://jsr.io/@kissjs/rpc">@kissjs/rpc</a>
          </div>
        </div>

        <div class="standards-bar">
          <div class="pill-row">
            <span class="pill"><span class="check">&#10003;</span> Fetch API</span>
            <span class="pill"><span class="check">&#10003;</span> Web Components</span>
            <span class="pill"><span class="check">&#10003;</span> ESM</span>
            <span class="pill"><span class="check">&#10003;</span> Declarative Shadow DOM</span>
            <span class="pill"><span class="check">&#10003;</span> Islands</span>
          </div>
        </div>

        <div class="features">
          <div class="feature-card">
            <div class="icon">&#127760;</div>
            <h2>Web Standards First</h2>
            <p>No new abstractions. If you know the web platform, you know KISS.</p>
          </div>
          <div class="feature-card">
            <div class="icon">&#127965;</div>
            <h2>Islands Architecture</h2>
            <p>Only interactive components load JS. Default homepage: 0 KB.</p>
          </div>
          <div class="feature-card">
            <div class="icon">&#128268;</div>
            <h2>Type-Safe RPC</h2>
            <p>End-to-end type safety with Hono RPC. No codegen needed.</p>
          </div>
          <div class="feature-card">
            <div class="icon">&#127758;</div>
            <h2>Multi-Runtime</h2>
            <p>Same code on Deno, Node, Bun, Cloudflare Workers.</p>
          </div>
          <div class="feature-card">
            <div class="icon">&#9889;</div>
            <h2>SSG Built-In</h2>
            <p>Pre-render to static HTML at build time. Zero config.</p>
          </div>
          <div class="feature-card">
            <div class="icon">&#128274;</div>
            <h2>Zero Lock-In</h2>
            <p>Your code works without KISS. Hono, Lit, Vite are all standard.</p>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('docs-home', DocsHome)

export default DocsHome
export const tagName = 'docs-home'
