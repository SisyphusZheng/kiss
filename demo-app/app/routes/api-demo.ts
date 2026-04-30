import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'page-api-demo';

export default class PageApiDemo extends LitElement {
  static override styles = css`
    :host { display: block; max-width: 640px; margin: 0 auto; padding: 3rem 2rem; }
    .back { display: inline-block; margin-bottom: 1.5rem; text-decoration: none; color: #555; font-size: 0.875rem; }
    .back:hover { color: #000; }
    h1 { font-size: 1.5rem; margin: 0 0 0.75rem; }
    p { font-size: 0.9375rem; line-height: 1.7; color: #444; margin: 0 0 1rem; }
    .diagram { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; font-family: monospace; font-size: 0.8125rem; line-height: 1.6; }
    .diagram .arrow { color: #999; }
    .diagram .jam { color: #1a1a2e; font-weight: bold; }
    code { background: #f0f0f0; padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.8125rem; }
  `;

  override render() {
    return html`
      <a class="back" href="/demo/">← Home</a>
      <h1>JAM pattern in action</h1>
      <p>This page demonstrates the <strong>JAM</strong> pattern: a static HTML page that calls a serverless API at runtime.</p>
      <div class="diagram">
        <span class="jam">J</span> Static HTML (this page)    ↓<br>
        <span class="jam">A</span> fetch() → API endpoint     ↓<br>
        <span class="jam">M</span> Render JSON response  ✅
      </div>
      <p>The component below is an <strong>Island</strong> — 1.2 KB of lazy-loaded JS. It calls the KISS API and displays the response live.</p>
      <api-consumer api-url="${this.getAttribute('api-url') || 'https://kiss-demo-api.sisyphuszheng.deno.net'}"></api-consumer>
    `;
  }
}
