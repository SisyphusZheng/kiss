import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'

export class DesignPhilosophyPage extends LitElement {
  static styles = [pageStyles, css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.5rem; color: #fff; }
    .subtitle { color: #666; margin-bottom: 2.5rem; font-size: 0.9375rem; line-height: 1.6; }
    h2 { font-size: 1.25rem; font-weight: 600; margin: 2.5rem 0 0.75rem; color: #fff; letter-spacing: -0.01em; }
    h3 { font-size: 1rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #ccc; }
    p { line-height: 1.7; margin: 0.5rem 0; color: #999; }
    .pillar { padding: 1.25rem; margin: 1rem 0; border-left: 3px solid #333; background: #0f0f0f; border-radius: 0 3px 3px 0; }
    .pillar .num { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-bottom: 0.25rem; }
    .pillar h3 { margin: 0 0 0.5rem; font-size: 1.0625rem; }
    .hard-constraint { display: inline-block; background: #111; border: 1px solid #222; padding: 0.25rem 0.625rem; border-radius: 4px; font-size: 0.8125rem; margin: 0.125rem 0; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.875rem; }
    th, td { border: 1px solid #1a1a1a; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #111; font-weight: 600; color: #ccc; }
    pre { background: #111; color: #c8c8c8; padding: 1rem 1.25rem; border-radius: 3px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `]
  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>Design Philosophy</h1>
          <p class="subtitle">KISS = Keep It Simple, Stupid. Not a slogan — a filter for every decision.</p>

          <div class="pillar">
            <div class="num">Pillar 1</div>
            <h3>Web Standards First</h3>
            <p>Most frameworks "support" web standards. KISS <em>is</em> web standards.</p>
            <p>Your code doesn't depend on KISS abstractions. Swap it out, and your Hono/Lit/Vite code still works.</p>
            <p>
              <span class="hard-constraint">Pure ESM, zero CJS</span>
              <span class="hard-constraint">Vite-only, no second build tool</span>
              <span class="hard-constraint">No patch scripts on output</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 2</div>
            <h3>Minimal Augmentation</h3>
            <p>KISS doesn't invent things. It connects existing standard tools with minimum overhead.</p>
            <p>Framework = 1 Vite plugin (a connector, not a new abstraction).</p>
            <p>Zero-interaction page: <strong>0 KB</strong> KISS runtime. Single Island: ~6 KB (Lit itself).</p>
            <p>
              <span class="hard-constraint">Reuse Hono/Vite/Lit ecosystem</span>
              <span class="hard-constraint">New dependencies need ADR</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 3</div>
            <h3>No Framework Binding</h3>
            <p>KISS recommends Lit, but you can use something else. You can use @kiss/core for SSR without Lit. You can use Lit without KISS.</p>
            <p>
              <span class="hard-constraint">Lit is not a forced peerDependency</span>
              <span class="hard-constraint">No mandatory validation scheme</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 4</div>
            <h3>No Runtime Binding</h3>
            <p>Pure ESM output runs on any runtime that supports ESM: Deno, Node, Bun, Cloudflare Workers.</p>
            <p>
              <span class="hard-constraint">No platform-specific hardcoded code</span>
              <span class="hard-constraint">deno.json is dev tooling, not runtime dependency</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 5</div>
            <h3>Progressive Enhancement</h3>
            <p>KISS defaults to zero JS. Opt in per component.</p>
            <table>
              <thead><tr><th>Level</th><th>Content</th><th>JS Size</th></tr></thead>
              <tbody>
                <tr><td>0</td><td>Pure HTML + DSD</td><td><strong>0 KB</strong></td></tr>
                <tr><td>2</td><td>Partial Islands</td><td>~6 KB/island</td></tr>
                <tr><td>4</td><td>SPA mode</td><td>User choice</td></tr>
              </tbody>
            </table>
          </div>

          <h2>Review Checklist</h2>
          <pre><code>Before every commit, ask:
1. New dependency?     → Does it violate "minimal augmentation"?
2. Modified build?    → Does it violate "Web Standards first"?
3. New abstraction?   → Are you reinventing the wheel?
4. Platform code?     → Does it violate "no runtime binding"?
5. Forced choice?     → Does it violate "no framework binding"?</code></pre>
          <p>Any "yes" requires an ADR (Architecture Decision Record).</p>

          <h2>Competitive Landscape</h2>
          <table>
            <thead><tr><th>Framework</th><th>HTTP</th><th>UI</th><th>Build</th><th>Full Standards</th></tr></thead>
            <tbody>
              <tr><td>Next.js</td><td>Custom</td><td>React</td><td>Webpack</td><td>0/3</td></tr>
              <tr><td>Astro</td><td>Custom</td><td>Any</td><td>ESM</td><td>1/3</td></tr>
              <tr><td><strong>KISS</strong></td><td><strong>Fetch API</strong></td><td><strong>Web Components</strong></td><td><strong>ESM</strong></td><td><strong>3/3</strong></td></tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/kiss/guide/getting-started" class="nav-link">&larr; Getting Started</a>
            <a href="/kiss/guide/architecture" class="nav-link">Architecture &rarr;</a>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-design-philosophy', DesignPhilosophyPage)
export default DesignPhilosophyPage
export const tagName = 'page-design-philosophy'
