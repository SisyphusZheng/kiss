/**
 * Demo Showcase — Jamstack in Action
 *
 * SSR-only page layout that:
 *   1. Explains the JAM pattern with a visual flow diagram
 *   2. Embeds an <api-consumer> Island for live API interaction
 *   3. Showcases a <counter-island> for client-side state
 *   4. Displays the architecture in a code block
 *
 * All interactive parts are Islands (lazy-loaded JS).
 * The rest is pure static HTML with Declarative Shadow DOM.
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export const tagName = 'page-demo';

export default class PageDemo extends LitElement {
  static override styles = [
    pageStyles,
    css`
      /* ─── JAM Flow Steps ─── */
      .jam-grid {
        display: flex;
        gap: 0;
        margin: 1.5rem 0 2rem;
        border: 1px solid var(--kiss-border);
        border-radius: 8px;
        overflow: hidden;
      }
      .jam-cell {
        flex: 1;
        padding: 1.5rem 1rem;
        text-align: center;
        position: relative;
      }
      .jam-cell + .jam-cell {
        border-left: 1px solid var(--kiss-border);
      }
      .jam-cell .letter {
        font-size: 2rem;
        font-weight: 900;
        color: var(--kiss-text-primary);
        display: block;
        line-height: 1;
        margin-bottom: 0.5rem;
      }
      .jam-cell .label {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--kiss-text-muted);
        display: block;
        margin-bottom: 0.3rem;
      }
      .jam-cell .desc {
        font-size: 0.75rem;
        color: var(--kiss-text-tertiary);
        line-height: 1.5;
        margin: 0;
      }
      .jam-cell:hover {
        background: var(--kiss-bg-hover);
      }

      /* ─── Architecture section ─── */
      .arch-card {
        border: 1px solid var(--kiss-border);
        border-radius: 8px;
        overflow: hidden;
      }
      .arch-card pre {
        margin: 0;
        padding: 1rem 1.25rem;
        background: var(--kiss-code-bg);
        font-size: 0.75rem;
        line-height: 1.7;
        overflow-x: auto;
      }
      .arch-card .endpoint-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.25rem;
        background: var(--kiss-bg-surface);
        border-bottom: 1px solid var(--kiss-border);
        font-size: 0.8125rem;
        color: var(--kiss-text-secondary);
        font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      }
      .arch-card .endpoint-bar a {
        text-decoration: none;
      }
      .endpoint-label {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
        margin: 1.5rem 0 0.5rem;
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout>
        <div class="container">
          <span class="overline">Showcase</span>
          <h1>JAM Pattern in Action</h1>
          <p class="subtitle">
            A live demonstration of the <strong>JAMstack</strong> pipeline —
            statically generated HTML that talks to a serverless API at runtime.
            Zero backend. Zero server maintenance.
          </p>

          <!-- JAM Flow Diagram (pure CSS grid, no JS needed) -->
          <div class="jam-grid">
            <div class="jam-cell">
              <span class="letter">J</span>
              <span class="label">JavaScript</span>
              <p class="desc">Island component hydrates on the client, ready for interaction</p>
            </div>
            <div class="jam-cell">
              <span class="letter">A</span>
              <span class="label">API</span>
              <p class="desc">fetch() calls the KISS serverless API hosted on Deno Deploy</p>
            </div>
            <div class="jam-cell">
              <span class="letter">M</span>
              <span class="label">Markup</span>
              <p class="desc">JSON response rendered into the DOM — no page reload needed</p>
            </div>
          </div>

          <!-- Live API Consumer Island -->
          <api-consumer></api-consumer>

          <hr class="divider" />

          <!-- Counter Island -->
          <p style="font-size:0.8125rem;color:var(--kiss-text-tertiary);margin:0 0 0.5rem;line-height:1.6">
            Another Island — <strong>0.9 KB</strong> of lazy-loaded JavaScript,
            fully interactive via Declarative Shadow DOM hydration.
          </p>
          <counter-island></counter-island>

          <hr class="divider" />

          <!-- Architecture -->
          <h2>Architecture</h2>
          <p style="font-size:0.9375rem;color:var(--kiss-text-secondary);line-height:1.7">
            This entire page was statically generated at build time by the KISS 3-phase pipeline.
            The interactive components are <strong>Islands</strong> — lazy-loaded JavaScript that
            hydrates only the parts that need interaction. Everything else is pure static HTML.
          </p>

          <div class="endpoint-label">API Endpoint</div>
          <div class="arch-card">
            <div class="endpoint-bar">
              <span>https://kiss-demo-api.sisyphuszheng.deno.net</span>
              <a href="https://kiss-demo-api.sisyphuszheng.deno.net/api" target="_blank" style="font-size:0.75rem;color:var(--kiss-text-primary);text-decoration:underline;text-underline-offset:3px">Open →</a>
            </div>
          </div>

          <div class="endpoint-label">Build Pipeline</div>
          <div class="arch-card">
            <pre>npx vite build   → SSR bundle + metadata
build:client     → Island client chunks (lazy-loaded)
build:ssg        → Static HTML + DSD + clean URLs + PWA</pre>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}
