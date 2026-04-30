/**
 * KISS Compiler — .kiss file compiler architecture decision
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export class KissCompilerPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .adr-meta { font-size: 0.75rem; color: var(--kiss-text-muted); margin-bottom: 1.5rem; }
      h2 { font-size: 1rem; font-weight: 500; margin: 1.5rem 0 0.5rem; color: var(--kiss-text-primary); }
      h3 { font-size: 0.875rem; font-weight: 500; margin: 1rem 0 0.25rem; color: var(--kiss-text-secondary); }
      p { font-size: 0.8125rem; line-height: 1.7; color: var(--kiss-text-secondary); margin: 0 0 0.75rem; }
      .code-block {
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono","Fira Code",monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--kiss-text-secondary);
        white-space: pre;
      }
      table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; margin: 0.75rem 0; }
      th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--kiss-border); }
      th { font-weight: 500; color: var(--kiss-text-primary); }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/guide/kiss-compiler">
        <div class="container">
          <p class="adr-meta">ADR 0002 · 2026-04-30 · Draft</p>
          <h1>.kiss Compiler — Eliminate Lit, Zero Runtime</h1>

          <h2>Context</h2>
          <p>
            KISS currently depends on <code>lit</code> (npm:lit) for component authoring. This brings a 58kb gzip runtime,
            @lit-labs/ssr for server rendering (with CJS polyfill), hydration ceremony, and dprint fmt panics on tagged
            template literals.
          </p>

          <h2>Proposal</h2>
          <p>
            Introduce <code>.kiss</code> files — a component format purpose-built for KISS. A compiler transforms <code>.kiss</code>
            files into vanilla Custom Elements at build time. Zero runtime dependency.
          </p>

          <h3>.kiss file format</h3>
          <div class="code-block">&lt;!-- my-counter.kiss --&gt;
&lt;template&gt;
  &lt;button @click="decrement"&gt;−&lt;/button&gt;
  &lt;span&gt;{count}&lt;/span&gt;
  &lt;button @click="increment"&gt;+&lt;/button&gt;
&lt;/template&gt;

&lt;script&gt;
  count = 0
  increment() { this.count++ }
  decrement() { this.count-- }
&lt;/script&gt;

&lt;style&gt;
  :host { display: inline-flex; gap: 0.5rem; align-items: center; }
&lt;/style&gt;</div>

          <h3>What the compiler eliminates</h3>
          <table>
            <tr><th>Layer</th><th>Before (Lit)</th><th>After (.kiss compiler)</th></tr>
            <tr><td>Runtime</td><td>58kb gzip lit</td><td>0kb</td></tr>
            <tr><td>SSR</td><td>@lit-labs/ssr + DOM shim</td><td>template.innerHTML (sync)</td></tr>
            <tr><td>Hydration</td><td>DSD + hydrate() + order bug</td><td>template.cloneNode (no hydration)</td></tr>
            <tr><td>Polyfills</td><td>node-domexception CJS shim</td><td>none needed</td></tr>
            <tr><td>Build</td><td>esbuild decorator transform</td><td>standard TS/JS only</td></tr>
          </table>

          <h2>SSG integration</h2>
          <p>
            The route scanner already maps <code>app/routes/*.ts</code> to URL paths. Extend it to also scan .kiss files.
            Page .kiss files render directly (template is the page). Island .kiss files get lazy chunk treatment.
          </p>

          <h2>Backward compatibility</h2>
          <p>
            <code>vite.config.ts</code> option: <code>compiler: 'lit' | 'kiss' | 'auto'</code>.
            Lit support retained throughout v0.x. v1.0 defaults to .kiss compiler.
          </p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/guide/pwa" class="nav-link">PWA Support &rarr;</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-kiss-compiler', KissCompilerPage);
export default KissCompilerPage;
export const tagName = 'page-kiss-compiler';
