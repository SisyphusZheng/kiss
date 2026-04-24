import { LitElement, html, css } from '@kissjs/core'
import '../../components/layout.js'

export class GettingStartedPage extends LitElement {
  static styles = css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
    .subtitle { color: var(--wa-color-neutral-500, #737373); margin-bottom: 2rem; }
    .step { margin-bottom: 1.75rem; }
    .step h2 { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem; color: var(--wa-color-primary-700, #1d4ed8); }
    pre { background: var(--wa-color-neutral-900, #171717); color: var(--wa-color-neutral-100, #f5f5f5); padding: 1rem 1.25rem; border-radius: var(--wa-border-radius-lg, 8px); overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.5rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: var(--wa-color-neutral-100, #f5f5f5); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `

  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>Getting Started</h1>
          <p class="subtitle">Up and running in under 5 minutes.</p>

          <div class="step">
            <h2>1. Create a project</h2>
            <pre><code>mkdir my-app && cd my-app</code></pre>
          </div>

          <div class="step">
            <h2>2. Initialize Deno</h2>
            <pre><code>deno init</code></pre>
          </div>

          <div class="step">
            <h2>3. Add dependencies</h2>
            <pre><code>deno add jsr:@kissjs/core</code></pre>
          </div>

          <div class="step">
            <h2>4. Configure Vite</h2>
            <pre><code>// vite.config.ts
import { kiss } from '@kissjs/core'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      ui: { cdn: true },
    }),
  ]
})</code></pre>
          </div>

          <div class="step">
            <h2>5. Create your first page</h2>
            <pre><code>// app/routes/index.ts
import { LitElement, html, css } from '@kissjs/core'

export class HomePage extends LitElement {
  static styles = css\`:host { display: block; padding: 2rem; }\`
  render() {
    return html\`&lt;h1&gt;Hello KISS!&lt;/h1&gt;\`
  }
}

customElements.define('home-page', HomePage)
export default HomePage
export const tagName = 'home-page'</code></pre>
          </div>

          <div class="step">
            <h2>6. Start dev server</h2>
            <pre><code>deno run -A npm:vite</code></pre>
            <p>Open <span class="inline-code">localhost:5173</span> to see your page.</p>
          </div>

          <div class="nav-row">
            <span></span>
            <wa-button href="/kiss/guide/routing">Routing Guide &rarr;</wa-button>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-getting-started', GettingStartedPage)
export default GettingStartedPage
export const tagName = 'page-getting-started'
