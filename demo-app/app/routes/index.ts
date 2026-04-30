import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'df-home';

export default class DfHome extends LitElement {
  static override styles = css`
    :host { display: block; max-width: 640px; margin: 0 auto; padding: 4rem 2rem; text-align: center; }
    h1 { font-size: 2rem; margin: 0 0 0.5rem; }
    .subtitle { color: #666; font-size: 1.05rem; }
    .pill-row { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin: 1.5rem 0; }
    .pill { padding: 0.3rem 0.65rem; border: 1px solid #ddd; border-radius: 20px; font-size: 0.75rem; color: #555; }
    .nav { margin: 1rem 0; }
    .nav a { display: inline-block; margin: 0 0.5rem; padding: 0.6rem 1.2rem; border: 1px solid #ddd; border-radius: 6px; text-decoration: none; color: #333; font-size: 0.875rem; }
    .nav a:hover { border-color: #666; }
    .info { margin-top: 2rem; font-size: 0.8125rem; color: #888; line-height: 1.6; }
    .info code { background: #f5f5f5; padding: 0.1rem 0.3rem; border-radius: 3px; }
  `;

  override render() {
    return html`
      <h1>KISS Jamstack Demo</h1>
      <p class="subtitle">Built from scratch with the KISS 3-phase build pipeline.</p>
      <div class="pill-row">
        <span class="pill">SSG</span>
        <span class="pill">Island</span>
        <span class="pill">DSD</span>
        <span class="pill">PWA</span>
      </div>
      <div class="nav">
        <a href="/demo/about">About →</a>
        <a href="/demo/api-demo">API Demo →</a>
      </div>
      <counter-island></counter-island>
      <div class="info">
        <p>This page was statically generated at build time.<br>
        The counter is an Island — only <strong>1.2 KB</strong> of JS loaded on demand.<br>
        Everything else is pure HTML with Declarative Shadow DOM.</p>
        <p><code>npx vite build</code> → <code>build:client</code> → <code>build:ssg</code></p>
      </div>
    `;
  }
}
