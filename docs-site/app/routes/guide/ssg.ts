import { LitElement, html, css } from 'lit'
import '../../components/layout.js'

export class SSGGuidePage extends LitElement {
  static styles = css`
    :host { display: block; }

    .container {
      max-width: 720px;
      margin: 0 auto;
      padding: 2rem 1.5rem 3rem;
    }

    h1 {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 0.5rem;
    }

    .subtitle {
      color: var(--wa-color-neutral-500, #737373);
      margin-bottom: 2rem;
    }

    h2 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 1.5rem 0 0.75rem;
    }

    pre {
      background: var(--wa-color-neutral-900, #171717);
      color: var(--wa-color-neutral-100, #f5f5f5);
      padding: 1rem 1.25rem;
      border-radius: var(--wa-border-radius-lg, 8px);
      overflow-x: auto;
      font-size: 0.8125rem;
      line-height: 1.6;
      margin: 0.75rem 0;
    }

    code {
      font-family: 'SF Mono', 'Fira Code', monospace;
    }

    .inline-code {
      background: var(--wa-color-neutral-100, #f5f5f5);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-size: 0.875em;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.75rem 0 1.5rem;
      font-size: 0.875rem;
    }

    th, td {
      border: 1px solid var(--wa-color-neutral-200, #e5e7eb);
      padding: 0.5rem 0.75rem;
      text-align: left;
    }

    th {
      background: var(--wa-color-neutral-50, #fafafa);
      font-weight: 600;
    }

    .nav-row {
      margin-top: 2.5rem;
      display: flex;
      justify-content: space-between;
    }
  `

  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>Static Site Generation</h1>
          <p class="subtitle">Pre-render your routes to static HTML at build time.</p>

          <h2>Quick Start</h2>
          <p>Add <span class="inline-code">kissSSG()</span> to your Vite config after <span class="inline-code">kiss()</span>:</p>
          <pre><code>// vite.config.ts
import { kiss } from '@kissjs/core'
import { kissSSG } from '@kissjs/ssg'
import { kissUI } from '@kissjs/ui'

export default defineConfig({
  plugins: [
    kiss({ routesDir: 'app/routes' }),
    kissUI(),
    kissSSG(),  // Add after kiss()
  ]
})</code></pre>

          <h2>How It Works</h2>
          <p>
            After Vite finishes the SSR + client build, <span class="inline-code">kissSSG</span> runs
            in the <span class="inline-code">closeBundle</span> hook:
          </p>
          <ol>
            <li>Scans <span class="inline-code">app/routes/</span> for page routes</li>
            <li>Creates a temporary Vite SSR server</li>
            <li>Loads each route module and renders via Lit SSR</li>
            <li>Writes each page as <span class="inline-code">route/path/index.html</span></li>
          </ol>
          <p>Dynamic routes (with <span class="inline-code">:param</span>) are skipped automatically.</p>

          <h2>Configuration</h2>
          <table>
            <thead>
              <tr><th>Option</th><th>Default</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><span class="inline-code">routesDir</span></td><td><span class="inline-code">'app/routes'</span></td><td>Must match kiss() config</td></tr>
              <tr><td><span class="inline-code">outDir</span></td><td><span class="inline-code">'dist'</span></td><td>Output directory</td></tr>
              <tr><td><span class="inline-code">base</span></td><td><span class="inline-code">'/'</span></td><td>Base path (e.g. '/repo/' for GitHub Pages)</td></tr>
              <tr><td><span class="inline-code">siteTitle</span></td><td><span class="inline-code">'KISS App'</span></td><td>Page title prefix</td></tr>
              <tr><td><span class="inline-code">include</span></td><td><span class="inline-code">[]</span></td><td>Only pre-render these routes</td></tr>
              <tr><td><span class="inline-code">exclude</span></td><td><span class="inline-code">[]</span></td><td>Skip these routes</td></tr>
            </tbody>
          </table>

          <h2>Deploy to GitHub Pages</h2>
          <pre><code>kissSSG({
  base: '/my-repo/',
  siteTitle: 'My Docs',
})</code></pre>
          <p>Set <span class="inline-code">base</span> to your repo name with trailing slash.</p>

          <div class="nav-row">
            <wa-button href="/guide/islands">&larr; Islands</wa-button>
            <wa-button href="/styling/web-awesome">Components &rarr;</wa-button>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-ssg-guide', SSGGuidePage)

export default SSGGuidePage
export const tagName = 'page-ssg-guide'
