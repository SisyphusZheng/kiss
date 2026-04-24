import { LitElement, html, css } from '@kissjs/core'
import '../../components/layout.js'

export class IslandsGuidePage extends LitElement {
  static styles = css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
    .subtitle { color: var(--wa-color-neutral-500, #737373); margin-bottom: 2rem; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0 1.5rem; }
    .comparison-item { padding: 1rem 1.25rem; border: 1px solid var(--wa-color-neutral-200, #e5e7eb); border-radius: var(--wa-border-radius-lg, 8px); }
    .comparison-item h3 { font-size: 0.9375rem; font-weight: 600; margin: 0 0 0.5rem; }
    .comparison-item ul { margin: 0; padding-left: 1.25rem; font-size: 0.875rem; color: var(--wa-color-neutral-600, #525252); }
    .comparison-item li { margin-bottom: 0.25rem; }
    .comparison-item.spa { border-color: var(--wa-color-danger-200, #fecaca); }
    .comparison-item.kiss { border-color: var(--wa-color-success-200, #bbf7d0); background: var(--wa-color-success-50, #f0fdf4); }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.875rem; }
    th, td { border: 1px solid var(--wa-color-neutral-200, #e5e7eb); padding: 0.5rem 0.75rem; text-align: left; }
    th { background: var(--wa-color-neutral-50, #fafafa); font-weight: 600; }
    pre { background: var(--wa-color-neutral-900, #171717); color: var(--wa-color-neutral-100, #f5f5f5); padding: 1rem 1.25rem; border-radius: var(--wa-border-radius-lg, 8px); overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: var(--wa-color-neutral-100, #f5f5f5); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `

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
              <h3>KISS Islands</h3>
              <ul>
                <li>Only interactive parts load JS</li>
                <li>Static content = pure HTML</li>
                <li>Fast initial load, great SEO</li>
              </ul>
            </div>
          </div>

          <h2>Progressive Enhancement Levels</h2>
          <table>
            <thead><tr><th>Level</th><th>Rendering</th><th>JS Size</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>0</strong></td><td>SSR + Declarative Shadow DOM</td><td><strong>0 KB</strong></td><td>Blog, documentation</td></tr>
              <tr><td><strong>2</strong></td><td>Partial Islands with hydration</td><td>~6 KB / island</td><td>Counter, theme toggle</td></tr>
              <tr><td><strong>4</strong></td><td>Full client-side navigation</td><td>Framework-size</td><td>Dashboard, SPA</td></tr>
            </tbody>
          </table>
          <p>Default: <strong>Level 0</strong> (zero JS). Opt in per-component.</p>

          <h2>Creating an Island</h2>
          <p>Create a file in <span class="inline-code">app/islands/</span>:</p>
          <pre><code>// app/islands/counter.ts
import { LitElement, html } from '@kissjs/core'

export class CounterIsland extends LitElement {
  @property({ type: Number }) count = 0

  render() {
    return html\`
      &lt;button @click=\${() => this.count++}&gt;
        Count: \${this.count}
      &lt;/button&gt;
    \`
  }
}</code></pre>
          <p>Use it in any route — it gets hydrated on the client automatically.</p>

          <div class="nav-row">
            <wa-button href="/kiss/guide/routing">&larr; Routing</wa-button>
            <wa-button href="/kiss/guide/ssg">SSG Guide &rarr;</wa-button>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-islands-guide', IslandsGuidePage)
export default IslandsGuidePage
export const tagName = 'page-islands-guide'
