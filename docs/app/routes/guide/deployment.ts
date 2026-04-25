import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'
import '../islands/code-block.js'

export class DeploymentPage extends LitElement {
  static styles = [pageStyles, css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.5rem; color: #fff; }
    .subtitle { color: #666; margin-bottom: 2.5rem; font-size: 0.9375rem; line-height: 1.6; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    p { line-height: 1.7; margin: 0.5rem 0; color: #999; }
    pre { background: #111; color: #c8c8c8; padding: 1rem 1.25rem; border-radius: 3px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: #111; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .platform-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0 1.5rem; }
    .platform-card { padding: 1rem 1.25rem; border: 1px solid #1a1a1a; border-radius: 3px; }
    .platform-card h3 { font-size: 0.9375rem; font-weight: 600; margin: 0 0 0.25rem; }
    .platform-card p { font-size: 0.8125rem; color: #666; margin: 0; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `]
  render() {
    return html`
      <app-layout currentPath="/kiss/guide/deployment">
        <div class="container">
          <h1>Deployment</h1>
          <p class="subtitle">Build once, deploy anywhere — static only. DIA means no server process.</p>

          <h2>Build</h2>
          <code-block><pre><code>deno run -A npm:vite build
# Output: dist/ directory with static HTML + island JS chunks</code></pre></code-block>

          <h2>Static Deployment</h2>
          <p>DIA produces only static files. The <span class="inline-code">dist/</span> directory contains HTML (with DSD) and island JS bundles. Deploy to any static host.</p>

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
              <h3>Netlify</h3>
              <p>Publish directory: dist/</p>
            </div>
            <div class="platform-card">
              <h3>S3 + CloudFront</h3>
              <p>Upload dist/ to S3 bucket</p>
            </div>
            <div class="platform-card">
              <h3>Any static host</h3>
              <p>Just upload dist/</p>
            </div>
          </div>

          <h2>GitHub Pages Setup</h2>
          <code-block><pre><code>// vite.config.ts
export default defineConfig({
  base: '/my-repo/',
  plugins: [kiss({
    inject: {
      stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
      scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
    },
  })],
})</code></pre></code-block>

          <p>Add a GitHub Actions workflow to build and deploy on push to main. See the <span class="inline-code">.github/workflows/deploy.yml</span> in this repo for a working example.</p>

          <h2>Why No Server Mode?</h2>
          <p>DIA's first pillar — <strong>构建即终态</strong> — means build output is the final product. There is no SSR runtime in production. This is not a limitation; it's a discipline that guarantees:</p>
          <ul>
            <li>Zero server maintenance cost</li>
            <li>CDN-grade performance globally</li>
            <li>Content available without JavaScript (DSD)</li>
            <li>Deployable to the cheapest possible hosting</li>
          </ul>
          <p>If you need dynamic server behavior, use <span class="inline-code">app/routes/api/</span> for API endpoints and deploy them separately.</p>

          <div class="nav-row">
            <a href="/kiss/guide/architecture" class="nav-link">&larr; Architecture</a>
            <a href="/kiss/styling/web-awesome" class="nav-link">Components &rarr;</a>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-deployment', DeploymentPage)
export default DeploymentPage
export const tagName = 'page-deployment'
