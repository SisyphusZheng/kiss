import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'

export class RoutingGuidePage extends LitElement {
  static styles = [pageStyles, css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.5rem; color: #fff; }
    .subtitle { color: #666; margin-bottom: 2.5rem; font-size: 0.9375rem; line-height: 1.6; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
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
          <h1>Routing</h1>
          <p class="subtitle">File-based routing — create a file, get a route.</p>

          <h2>Basic Routes</h2>
          <p>Create a file in <span class="inline-code">app/routes/</span>, and it becomes a route automatically.</p>
          <table>
            <thead><tr><th>File</th><th>Route</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">app/routes/index.ts</span></td><td><span class="inline-code">/</span></td></tr>
              <tr><td><span class="inline-code">app/routes/about.ts</span></td><td><span class="inline-code">/about</span></td></tr>
              <tr><td><span class="inline-code">app/routes/guide/getting-started.ts</span></td><td><span class="inline-code">/guide/getting-started</span></td></tr>
            </tbody>
          </table>

          <h2>Dynamic Routes</h2>
          <p>Use square brackets for dynamic segments:</p>
          <table>
            <thead><tr><th>File</th><th>Route</th><th>Params</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">app/routes/posts/[slug].ts</span></td><td><span class="inline-code">/posts/:slug</span></td><td><span class="inline-code">slug</span></td></tr>
              <tr><td><span class="inline-code">app/routes/users/[id]/posts.ts</span></td><td><span class="inline-code">/users/:id/posts</span></td><td><span class="inline-code">id</span></td></tr>
            </tbody>
          </table>

          <h2>Special Files</h2>
          <table>
            <thead><tr><th>File</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">_renderer.ts</span></td><td>Custom HTML wrapper for SSR</td></tr>
              <tr><td><span class="inline-code">_middleware.ts</span></td><td>Hono middleware for the route tree</td></tr>
            </tbody>
          </table>

          <h2>Route Module Convention</h2>
          <p>Every route module must export:</p>
          <table>
            <thead><tr><th>Export</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">default</span></td><td>LitElement class</td><td>The page component</td></tr>
              <tr><td><span class="inline-code">tagName</span></td><td>string</td><td>Custom element tag name</td></tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/kiss/guide/getting-started" class="nav-link">&larr; Getting Started</a>
            <a href="/kiss/guide/islands" class="nav-link">Islands Guide &rarr;</a>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-routing-guide', RoutingGuidePage)
export default RoutingGuidePage
export const tagName = 'page-routing-guide'
