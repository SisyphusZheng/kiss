import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'
import '../../islands/code-block.js'

export class GettingStartedPage extends LitElement {
  static styles = [pageStyles, css`
    .step { margin-bottom: 1.75rem; }
    .step h2 { font-size: 1rem; margin: 0 0 0.5rem; }
  `]
  render() {
    return html`
      <kiss-layout currentPath="/guide/getting-started">
        <div class="container">
          <h1>Getting Started</h1>
          <p class="subtitle">Up and running in under 5 minutes.</p>

          <div class="step">
            <h2>1. Create a project</h2>
            <code-block><pre><code>mkdir my-app && cd my-app</code></pre></code-block>
          </div>

          <div class="step">
            <h2>2. Initialize Deno</h2>
            <code-block><pre><code>deno init</code></pre></code-block>
          </div>

          <div class="step">
            <h2>3. Add dependencies</h2>
            <code-block><pre><code>deno add jsr:@kissjs/core</code></pre></code-block>
          </div>

          <div class="step">
            <h2>4. Configure Vite</h2>
            <code-block><pre><code>// vite.config.ts
import { kiss } from '@kissjs/core'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      inject: {
        stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
        scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
      },
    }),
  ]
})</code></pre></code-block>
          </div>

          <div class="step">
            <h2>5. Create your first page</h2>
            <code-block><pre><code>// app/routes/index.ts
import { LitElement, html, css } from '@kissjs/core'

export const tagName = 'home-page'
export default class HomePage extends LitElement {
  static styles = css\`:host { display: block; padding: 2rem; }\`
  render() {
    return html\`&lt;h1&gt;Hello KISS!&lt;/h1&gt;\`
  }
}</code></pre></code-block>
          </div>

          <div class="step">
            <h2>6. Start dev server</h2>
            <code-block><pre><code>deno run -A npm:vite</code></pre></code-block>
            <p>Open <span class="inline-code">localhost:5173</span> to see your page. SSG output includes Declarative Shadow DOM — content is visible even before JavaScript loads.</p>
          </div>

          <div class="nav-row">
            <a href="/guide/design-philosophy" class="nav-link">Design Philosophy &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `
  }
}

customElements.define('page-getting-started', GettingStartedPage)
export default GettingStartedPage
export const tagName = 'page-getting-started'
