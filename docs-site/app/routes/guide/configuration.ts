import { LitElement, html, css } from 'lit'
import '../../components/layout.js'

export class ConfigurationPage extends LitElement {
  static styles = css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
    .subtitle { color: var(--wa-color-neutral-500, #737373); margin-bottom: 2rem; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    pre { background: var(--wa-color-neutral-900, #171717); color: var(--wa-color-neutral-100, #f5f5f5); padding: 1rem 1.25rem; border-radius: var(--wa-border-radius-lg, 8px); overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: var(--wa-color-neutral-100, #f5f5f5); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.875rem; }
    th, td { border: 1px solid var(--wa-color-neutral-200, #e5e7eb); padding: 0.5rem 0.75rem; text-align: left; }
    th { background: var(--wa-color-neutral-50, #fafafa); font-weight: 600; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `

  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>Configuration</h1>
          <p class="subtitle">kiss() options and Vite config reference.</p>

          <h2>kiss() Options</h2>
          <table>
            <thead><tr><th>Option</th><th>Default</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">routesDir</span></td><td><span class="inline-code">'app/routes'</span></td><td>Directory for page and API routes</td></tr>
              <tr><td><span class="inline-code">islandsDir</span></td><td><span class="inline-code">'app/islands'</span></td><td>Directory for interactive island components</td></tr>
              <tr><td><span class="inline-code">componentsDir</span></td><td><span class="inline-code">'app/components'</span></td><td>Directory for shared components</td></tr>
              <tr><td><span class="inline-code">middleware</span></td><td><span class="inline-code">undefined</span></td><td>Path to Hono middleware module</td></tr>
            </tbody>
          </table>

          <h2>Full Config Example</h2>
          <pre><code>// vite.config.ts
import { defineConfig } from 'vite'
import { kiss } from '@kissjs/core'
import { kissUI } from '@kissjs/ui'

export default defineConfig({
  base: '/',         // set '/repo/' for GitHub Pages
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      middleware: 'app/middleware.ts',
    }),
    kissUI({ version: '3.5.0', cdn: true }),
  ],
})</code></pre>

          <h2>kissUI() Options</h2>
          <table>
            <thead><tr><th>Option</th><th>Default</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">version</span></td><td><span class="inline-code">'3.5.0'</span></td><td>Web Awesome version from CDN</td></tr>
              <tr><td><span class="inline-code">cdn</span></td><td><span class="inline-code">true</span></td><td>Use CDN injection (set false for npm)</td></tr>
            </tbody>
          </table>

          <h2>Project Structure Convention</h2>
          <pre><code>my-app/
  app/
    routes/        # File-based routing
      index.ts     # /
      about.ts     # /about
      api/
        posts.ts   # /api/posts (Hono)
    islands/       # Interactive components (auto-detected)
      counter.ts
    components/    # Shared Lit components
      header.ts
  deno.json
  vite.config.ts</code></pre>

          <div class="nav-row">
            <wa-button href="/kiss/guide/architecture">&larr; Architecture</wa-button>
            <wa-button href="/kiss/guide/deployment">Deployment &rarr;</wa-button>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-configuration', ConfigurationPage)
export default ConfigurationPage
export const tagName = 'page-configuration'
