import { LitElement, html, css } from '@kissjs/core'
import '../../components/layout.js'

export class WebAwesomePage extends LitElement {
  static styles = css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
    .subtitle { color: var(--wa-color-neutral-500, #737373); margin-bottom: 2rem; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    .demo-box { padding: 1.25rem; border: 1px solid var(--wa-color-neutral-200, #e5e7eb); border-radius: var(--wa-border-radius-lg, 8px); margin: 0.75rem 0 1.5rem; }
    .demo-box h3 { font-size: 0.9375rem; font-weight: 600; margin: 0 0 0.75rem; color: var(--wa-color-primary-700, #1d4ed8); }
    .demo-box .component-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
    pre { background: var(--wa-color-neutral-900, #171717); color: var(--wa-color-neutral-100, #f5f5f5); padding: 0.75rem 1rem; border-radius: var(--wa-border-radius-md, 6px); overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: var(--wa-color-neutral-100, #f5f5f5); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `

  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>Web Awesome Components</h1>
          <p class="subtitle">50+ UI components via CDN. Zero imports needed.</p>

          <h2>How It Works</h2>
          <p>
            Set <span class="inline-code">ui: { cdn: true }</span> in your <span class="inline-code">kiss()</span> config to inject Web Awesome's CSS and loader
            into your <span class="inline-code">&lt;head&gt;</span>. All <span class="inline-code">&lt;wa-*&gt;</span>
            custom elements are available globally — no per-component imports.
          </p>

          <div class="demo-box">
            <h3>Buttons</h3>
            <div class="component-row">
              <wa-button variant="brand">Brand</wa-button>
              <wa-button variant="success">Success</wa-button>
              <wa-button variant="danger">Danger</wa-button>
              <wa-button variant="default">Default</wa-button>
            </div>
            <pre><code>&lt;wa-button variant="brand"&gt;Brand&lt;/wa-button&gt;
&lt;wa-button variant="danger"&gt;Danger&lt;/wa-button&gt;</code></pre>
          </div>

          <div class="demo-box">
            <h3>Cards</h3>
            <wa-card>
              <h2 slot="header">Card Title</h2>
              <p>Web Awesome card component with header and footer slots.</p>
              <wa-button slot="footer" variant="brand">Action</wa-button>
            </wa-card>
            <pre><code>&lt;wa-card&gt;
  &lt;h2 slot="header"&gt;Title&lt;/h2&gt;
  &lt;p&gt;Content&lt;/p&gt;
  &lt;wa-button slot="footer" variant="brand"&gt;Action&lt;/wa-button&gt;
&lt;/wa-card&gt;</code></pre>
          </div>

          <div class="demo-box">
            <h3>Badges</h3>
            <div class="component-row">
              <wa-badge variant="primary">Primary</wa-badge>
              <wa-badge variant="success">Success</wa-badge>
              <wa-badge variant="danger">Danger</wa-badge>
              <wa-badge variant="warning">Warning</wa-badge>
            </div>
            <pre><code>&lt;wa-badge variant="primary"&gt;Primary&lt;/wa-badge&gt;
&lt;wa-badge variant="danger"&gt;Danger&lt;/wa-badge&gt;</code></pre>
          </div>

          <h2>Setup</h2>
          <p>Enable <span class="inline-code">ui.cdn</span> in your <span class="inline-code">kiss()</span> config:</p>
          <pre><code>import { kiss } from '@kissjs/core'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    kiss({
      routesDir: 'app/routes',
      ui: { cdn: true },
    }),
  ]
})</code></pre>

          <div class="nav-row">
            <wa-button href="/kiss/guide/deployment">&larr; Deployment</wa-button>
            <wa-button href="https://webawesome.com/docs" target="_blank">Web Awesome Docs &rarr;</wa-button>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-web-awesome', WebAwesomePage)
export default WebAwesomePage
export const tagName = 'page-web-awesome'
