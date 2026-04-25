import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'

export class IslandsGuidePage extends LitElement {
  static styles = [pageStyles, css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.5rem; color: #fff; }
    .subtitle { color: #666; margin-bottom: 2.5rem; font-size: 0.9375rem; line-height: 1.6; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    h3 { font-size: 1rem; font-weight: 600; margin: 1.25rem 0 0.5rem; color: #ccc; }
    p { line-height: 1.7; margin: 0.5rem 0; color: #999; }
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0 1.5rem; }
    .comparison-item { padding: 1rem 1.25rem; border: 1px solid #1a1a1a; border-radius: 3px; }
    .comparison-item h3 { font-size: 0.9375rem; font-weight: 600; margin: 0 0 0.5rem; }
    .comparison-item ul { margin: 0; padding-left: 1.25rem; font-size: 0.875rem; color: #888; }
    .comparison-item li { margin-bottom: 0.25rem; }
    .comparison-item.spa { border-color: var(--wa-color-danger-200, #fecaca); }
    .comparison-item.kiss { border-color: var(--wa-color-success-200, #bbf7d0); background: var(--wa-color-success-50, #f0fdf4); }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.875rem; }
    th, td { border: 1px solid #1a1a1a; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #111; font-weight: 600; color: #ccc; }
    pre { background: #111; color: #c8c8c8; padding: 1rem 1.25rem; border-radius: 3px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: #111; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .decision-tree { padding: 1rem; background: #0f0f0f; border-left: 3px solid #444; border-radius: 0 3px 3px; margin: 0.75rem 0; font-size: 0.8125rem; line-height: 1.8; color: #888; font-family: 'SF Mono', 'Fira Code', monospace; white-space: pre-wrap; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `]
  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>Islands Architecture</h1>
          <p class="subtitle">Add interactivity only where needed. Ship zero JS by default.</p>

          <h2>Why Islands?</h2>
          <div class="comparison">
            <div class="comparison-item spa">
              <h3>Traditional SPA</h3>
              <ul>
                <li>Entire page is JavaScript (100KB+)</li>
                <li>Static content needs JS to render</li>
                <li>Slow initial load, poor SEO</li>
              </ul>
            </div>
            <div class="comparison-item kiss">
              <h3>KISS Islands (DIA)</h3>
              <ul>
                <li>Only interactive parts load JS</li>
                <li>Static content = HTML + DSD (zero JS)</li>
                <li>Fast initial load, great SEO</li>
                <li>Shadow DOM encapsulation preserved</li>
              </ul>
            </div>
          </div>

          <h2>Progressive Enhancement Levels</h2>
          <p>DIA only has two levels. No SPA — this is discipline.</p>
          <table>
            <thead><tr><th>Level</th><th>Rendering</th><th>JS Size</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>0</strong></td><td>SSG + Declarative Shadow DOM</td><td><strong>0 KB</strong></td><td>Blog, documentation, marketing</td></tr>
              <tr><td><strong>1</strong></td><td>Islands with lazy hydration</td><td>~6 KB / island</td><td>Counter, form, code copy</td></tr>
            </tbody>
          </table>
          <p>Default: <strong>Level 0</strong> (zero JS). Opt in per-component via <span class="inline-code">app/islands/</span>.</p>

          <h2>Island Decision Tree</h2>
          <p>Before creating an Island, verify that no lower layer can solve the problem:</p>
          <div class="decision-tree">Need interactivity?
├─ Content only?        → L0: DSD output (zero JS)
├─ Visual state only?   → L1: CSS (:hover, :focus-within, details[open])
├─ Browser capability?  → L2: Platform API (Clipboard, IntersectionObserver)
├─ Component encapsulation? → L3: Lit component + DSD (build-time render)
└─ None of the above?   → L4: Island (Shadow DOM + lazy hydration)

Example rejections:
  - Active highlight  → aria-current + CSS (L0+L1, not an Island)
  - Sidebar collapse  → &lt;details&gt;/&lt;summary&gt; (L0, not an Island)
  - Theme toggle      → color-scheme + CSS vars (L1, not an Island)
  - Code copy button  → Island + Clipboard API (L2+L4, valid Island)</div>

          <h2>How Islands Work</h2>
          <h3>Build Time</h3>
          <p><span class="inline-code">island-transform</span> marks island modules with <span class="inline-code">__island</span> and <span class="inline-code">__tagName</span>. <span class="inline-code">island-extractor</span> builds a dependency map. The SSG output includes island placeholder elements.</p>

          <h3>Runtime</h3>
          <p>A hydration script lazy-loads only the island JS bundles the current page needs. Islands hydrate on demand (visible, idle, or eager — configurable).</p>

          <h2>Creating an Island</h2>
          <p>Create a file in <span class="inline-code">app/islands/</span>:</p>
          <pre><code>// app/islands/counter.ts
import { LitElement, html, css } from '@kissjs/core'

export const tagName = 'my-counter'
export default class MyCounter extends LitElement {
  static properties = { count: { type: Number } }

  constructor() {
    super()
    this.count = 0
  }

  render() {
    return html\`
      &lt;button @click=\${() => this.count++}&gt;+&lt;/button&gt;
      &lt;span&gt;\${this.count}&lt;/span&gt;
      &lt;button @click=\${() => this.count--}&gt;-&lt;/button&gt;
    \`
  }
}</code></pre>
          <p>Use it in any route — it gets hydrated on the client automatically.</p>

          <h2>DSD + Islands</h2>
          <p>Non-Island components (in <span class="inline-code">app/components/</span> and <span class="inline-code">app/routes/</span>) are rendered at build time with <strong>Declarative Shadow DOM</strong>. Their content is visible before JS loads:</p>
          <table>
            <thead><tr><th>Component Type</th><th>DSD Output</th><th>Client JS</th></tr></thead>
            <tbody>
              <tr><td>Page component (routes/)</td><td>✓ Full DSD with scoped styles</td><td>Hydration only (framework)</td></tr>
              <tr><td>Layout component (components/)</td><td>✓ Full DSD with scoped styles</td><td>Hydration only (framework)</td></tr>
              <tr><td>Island component (islands/)</td><td>✓ Placeholder DSD</td><td>✓ Lazy-loaded bundle</td></tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/kiss/guide/routing" class="nav-link">&larr; Routing</a>
            <a href="/kiss/guide/api-routes" class="nav-link">API Routes &rarr;</a>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-islands-guide', IslandsGuidePage)
export default IslandsGuidePage
export const tagName = 'page-islands-guide'
