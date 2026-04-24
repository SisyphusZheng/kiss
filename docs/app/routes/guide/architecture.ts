import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'

export class ArchitecturePage extends LitElement {
  static styles = [pageStyles, css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.5rem; color: #fff; }
    .subtitle { color: #666; margin-bottom: 2.5rem; font-size: 0.9375rem; line-height: 1.6; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    pre { background: #111; color: #c8c8c8; padding: 1rem 1.25rem; border-radius: 3px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: #111; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.875rem; }
    th, td { border: 1px solid #1a1a1a; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #111; font-weight: 600; color: #ccc; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `]
  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>Architecture</h1>
          <p class="subtitle">How KISS connects Hono, Lit, and Vite into one plugin.</p>

          <h2>User Perspective</h2>
          <pre><code>// vite.config.ts — your only config
import { kiss } from '@kissjs/core'
export default defineConfig({
  plugins: [kiss()]
})</code></pre>

          <h2>Plugin Composition</h2>
          <p>The <span class="inline-code">kiss()</span> function returns an array of Vite plugins:</p>
          <table>
            <thead><tr><th>Plugin</th><th>Hook</th><th>Role</th></tr></thead>
            <tbody>
              <tr><td>kiss:core</td><td>configResolved + buildStart</td><td>Route scanning + virtual module generation</td></tr>
              <tr><td>kiss:virtual-entry</td><td>resolveId + load</td><td>Provide virtual:kiss-hono-entry</td></tr>
              <tr><td>@hono/vite-dev-server</td><td>configureServer</td><td>Dev mode Hono middleware</td></tr>
              <tr><td>island-transform</td><td>transform</td><td>AST marking (__island, __tagName)</td></tr>
              <tr><td>island-extractor</td><td>build</td><td>Build-time island dependency analysis</td></tr>
              <tr><td>html-template</td><td>transformIndexHtml</td><td>Preload, meta, hydration injection</td></tr>
              <tr><td>kiss:ssg</td><td>closeBundle</td><td>Static site generation</td></tr>
              <tr><td>kiss:build</td><td>build</td><td>Dual build (SSR + Client)</td></tr>
            </tbody>
          </table>

          <h2>Request Lifecycle (Dev)</h2>
          <pre><code>Request → Vite Dev Server → Hono middleware → Route match
  → Vite SSR (ssrLoadModule) → @lit-labs/ssr renders Lit
  → HTML + Declarative Shadow DOM → Inject Island hydration → Response</code></pre>

          <h2>Request Lifecycle (Build/SSG)</h2>
          <pre><code>vite build → closeBundle hook:
  1. Scan routes
  2. Generate SSG entry with DOM shim
  3. Create Vite SSR server (configFile: false)
  4. Load entry → Hono app → toSSG()
  5. Write dist/ as static HTML</code></pre>

          <h2>Island Hydration</h2>
          <p>At build time, <span class="inline-code">island-transform</span> marks island modules. <span class="inline-code">island-extractor</span> builds a dependency map. The HTML template plugin injects a hydration script that lazy-loads only the island JS bundles the page needs.</p>

          <div class="nav-row">
            <a href="/kiss/guide/design-philosophy" class="nav-link">&larr; Philosophy</a>
            <a href="/kiss/guide/configuration" class="nav-link">Configuration &rarr;</a>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-architecture', ArchitecturePage)
export default ArchitecturePage
export const tagName = 'page-architecture'
