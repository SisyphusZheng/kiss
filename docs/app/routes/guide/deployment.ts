import { LitElement, html, css } from '@kissjs/core'
import '../../components/layout.js'

export class DeploymentPage extends LitElement {
  static styles = css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
    .subtitle { color: var(--wa-color-neutral-500, #737373); margin-bottom: 2rem; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    pre { background: var(--wa-color-neutral-900, #171717); color: var(--wa-color-neutral-100, #f5f5f5); padding: 1rem 1.25rem; border-radius: var(--wa-border-radius-lg, 8px); overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: var(--wa-color-neutral-100, #f5f5f5); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .platform-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0 1.5rem; }
    .platform-card { padding: 1rem 1.25rem; border: 1px solid var(--wa-color-neutral-200, #e5e7eb); border-radius: var(--wa-border-radius-lg, 8px); }
    .platform-card h3 { font-size: 0.9375rem; font-weight: 600; margin: 0 0 0.25rem; }
    .platform-card p { font-size: 0.8125rem; color: var(--wa-color-neutral-500, #737373); margin: 0; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `

  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>Deployment</h1>
          <p class="subtitle">Build once, deploy anywhere — static or server.</p>

          <h2>Build</h2>
          <pre><code>deno run -A npm:vite build
# Output: dist/ directory with static HTML</code></pre>

          <h2>SSG Deployment (Static)</h2>
          <p>The default <span class="inline-code">vite build</span> outputs static HTML. Deploy the <span class="inline-code">dist/</span> directory to any static host.</p>

          <div class="platform-grid">
            <div class="platform-card">
              <h3>GitHub Pages</h3>
              <p>Set base to /repo-name/ in vite.config.ts</p>
            </div>
            <div class="platform-card">
              <h3>Cloudflare Pages</h3>
              <p>Point to dist/ directory</p>
            </div>
            <div class="platform-card">
              <h3>Vercel</h3>
              <p>Framework: Other, output: dist/</p>
            </div>
            <div class="platform-card">
              <h3>Deno Deploy</h3>
              <p>Serve dist/ with Hono</p>
            </div>
            <div class="platform-card">
              <h3>Netlify</h3>
              <p>Publish directory: dist/</p>
            </div>
            <div class="platform-card">
              <h3>Any static host</h3>
              <p>Just upload dist/</p>
            </div>
          </div>

          <h2>GitHub Pages Setup</h2>
          <pre><code>// vite.config.ts
export default defineConfig({
  base: '/my-repo/',
  plugins: [kiss({ ui: { cdn: true } })],
})</code></pre>

          <p>Add a GitHub Actions workflow to build and deploy on push to main. See the <span class="inline-code">.github/workflows/deploy.yml</span> in this repo for a working example.</p>

          <h2>SSR Deployment (Dynamic)</h2>
          <pre><code>// server.ts — run with Deno
import { Hono } from 'hono'
import { serveStatic } from 'hono/deno'

const app = new Hono()
app.get('/*', serveStatic({ root: './dist/client' }))

Deno.serve(app.fetch)</code></pre>

          <div class="nav-row">
            <wa-button href="/kiss/guide/configuration">&larr; Configuration</wa-button>
            <wa-button href="/kiss/styling/web-awesome">Components &rarr;</wa-button>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-deployment', DeploymentPage)
export default DeploymentPage
export const tagName = 'page-deployment'
