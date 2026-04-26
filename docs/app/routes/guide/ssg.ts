import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class SSGGuidePage extends LitElement {
  static styles = [
    pageStyles,
    css`
    `,
  ];
  render() {
    return html`
      <kiss-layout currentPath="/guide/ssg">
        <div class="container">
          <h1>Static Site Generation</h1>
          <p class="subtitle">Pre-render your routes to static HTML with DSD at build time.</p>

          <h2>Quick Start</h2>
          <p>SSG is built into <span class="inline-code">kiss()</span>. No extra plugin needed:</p>
          <code-block
          ><pre><code>// vite.config.ts
            import { kiss } from '@kissjs/core'
            import { defineConfig } from 'vite'

            export default defineConfig({
              plugins: [
                kiss({
                  routesDir: 'app/routes',
                  inject: {
                    stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
                    scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
                  },
                }),
              ]
            })</code></pre></code-block>

            <h2>How It Works</h2>
            <p>When you run <span class="inline-code">vite build</span>, kiss() automatically:</p>
            <ol>
              <li>Scans <span class="inline-code">app/routes/</span> for page routes</li>
              <li>Creates a temporary Vite SSR server</li>
              <li>
                Loads each route module and renders via <span class="inline-code">@lit-labs/ssr</span>
              </li>
              <li>
                Outputs HTML with <strong>Declarative Shadow DOM</strong> — content visible without JS
              </li>
              <li>Extracts Island components into separate JS bundles</li>
              <li>Writes each page as <span class="inline-code">route/path/index.html</span></li>
            </ol>
            <p>Dynamic routes (with <span class="inline-code">:param</span>) are skipped automatically.</p>

            <h2>SSR Compatibility: Use static properties</h2>
            <p>
              KISS uses Vite's SSR capabilities with esbuild for fast transpilation. Due to
              <strong>esbuild's limited decorator support</strong>, we recommend using
              <span class="inline-code">static properties</span> instead of
              <span class="inline-code">@property</span> decorators:
            </p>
            <code-block
            ><pre><code>// ✅ Recommended: Works in SSR
              class MyComponent extends LitElement {
                static properties = {
                  count: { type: Number },
                  name: { type: String },
                };
                count = 0;
                name = '';
              }

              // ❌ Not recommended: Fails in SSR
              import { property } from 'lit/decorators.js';
              class MyComponent extends LitElement {
                @property({ type: Number }) count = 0;  // "Unsupported decorator location"
              }</code></pre></code-block>

              <p>
                <strong>Why?</strong> Vite SSR uses esbuild for on-the-fly transpilation. esbuild only
                supports the legacy <span class="inline-code">experimentalDecorators</span> proposal (TC39
                Stage 2), which has limited support for field decorators like <span class="inline-code"
                >@property</span>.
              </p>
              <p>
                <span class="inline-code">static properties</span> is Lit's recommended syntax, works
                everywhere, and aligns with KISS's "Web Standards First" philosophy — no decorator polyfills
                needed.
              </p>

              <h2>DSD Output</h2>
              <p>Each rendered page includes Declarative Shadow DOM for all Lit components. This means:</p>
              <table>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>DSD Output</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Shadow DOM styles</td>
                    <td>
                      Scoped inside <span class="inline-code">&lt;template shadowrootmode="open"&gt;</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Content visibility</td>
                    <td>Immediate — no JS required</td>
                  </tr>
                  <tr>
                    <td>SEO / crawling</td>
                    <td>Full content accessible to bots</td>
                  </tr>
                  <tr>
                    <td>Hydration</td>
                    <td>Lit reuses existing DOM on hydration</td>
                  </tr>
                </tbody>
              </table>

              <h2>GitHub Pages</h2>
              <p>Set <span class="inline-code">base</span> to your repo name with trailing slash:</p>
              <code-block
              ><pre><code>// vite.config.ts
                export default defineConfig({
                  base: '/my-repo/',
                  plugins: [kiss({
                    inject: {
                      stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
                      scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
                    },
                  })],
                })</code></pre></code-block>

                <h2>Build &amp; Deploy</h2>
                <code-block
                ><pre><code>deno run -A npm:vite build
                  # Output in dist/ — deploy to any static host</code></pre></code-block>

                  <div class="nav-row">
                    <a href="/guide/api-design" class="nav-link">&larr; API Design</a>
                    <a href="/guide/configuration" class="nav-link">Configuration &rarr;</a>
                  </div>
                </div>
              </kiss-layout>
            `;
          }
        }

        customElements.define('page-ssg-guide', SSGGuidePage);
        export default SSGGuidePage;
        export const tagName = 'page-ssg-guide';
