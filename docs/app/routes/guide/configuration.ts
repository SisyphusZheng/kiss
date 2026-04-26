import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '../../components/layout.js';
import '../../islands/code-block.js';

export class ConfigurationPage extends LitElement {
  static styles = [
    pageStyles,
    css`
      .deprecated {
        color: var(--text-tertiary);
        text-decoration: line-through;
      }
      .new-badge {
        display: inline-block;
        background: #1a3a1a;
        color: #4ade80;
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        vertical-align: middle;
      }
    `,
  ];
  render() {
    return html`
      <app-layout currentPath="/guide/configuration">
        <div class="container">
          <h1>Configuration</h1>
          <p class="subtitle">kiss() options and Vite config reference.</p>

          <h2>kiss() Options</h2>
          <table>
            <thead>
              <tr>
                <th>Option</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">routesDir</span></td>
                <td><span class="inline-code">'app/routes'</span></td>
                <td>Directory for page and API routes</td>
              </tr>
              <tr>
                <td><span class="inline-code">islandsDir</span></td>
                <td><span class="inline-code">'app/islands'</span></td>
                <td>Directory for interactive island components</td>
              </tr>
              <tr>
                <td><span class="inline-code">componentsDir</span></td>
                <td><span class="inline-code">'app/components'</span></td>
                <td>Directory for shared components</td>
              </tr>
              <tr>
                <td><span class="inline-code">middleware</span></td>
                <td><span class="inline-code">undefined</span></td>
                <td>Path to Hono middleware module</td>
              </tr>
              <tr>
                <td><span class="inline-code">inject</span> <span class="new-badge">new</span></td>
                <td><span class="inline-code">undefined</span></td>
                <td>Head injection for stylesheets, scripts, fragments</td>
              </tr>
              <tr>
                <td><span class="inline-code">ui</span> <span class="deprecated">deprecated</span></td>
                <td><span class="inline-code">undefined</span></td>
                <td>Use <span class="inline-code">inject</span> instead</td>
              </tr>
            </tbody>
          </table>

          <h2>inject Option <span class="new-badge">new</span></h2>
          <p>
            Generic head injection — replaces the <span class="inline-code">ui</span> option. Works with
            any CDN or local asset:
          </p>
          <code-block
          ><pre><code>kiss({
            inject: {
              stylesheets: [
                'https://cdn.example.com/style.css',
              ],
              scripts: [
                'https://cdn.example.com/ui.js',
              ],
              headFragments: [
                '&lt;meta name="theme-color" content="#0a0a0a"&gt;',
              ],
            },
          })</code></pre></code-block>

          <h2>Full Config Example</h2>
          <code-block
          ><pre><code>// vite.config.ts
            import { kiss } from '@kissjs/core'
            import { defineConfig } from 'vite'

            export default defineConfig({
              base: '/',         // set '/repo/' for GitHub Pages
              plugins: [
                kiss({
                  routesDir: 'app/routes',
                  islandsDir: 'app/islands',
                  componentsDir: 'app/components',
                  middleware: 'app/middleware.ts',

                  // Generic head injection (preferred)
                  inject: {
                    stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
                    scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
                  },

                  // Old WebAwesome CDN shortcut (deprecated, use inject instead)
                  // ui: { cdn: true, version: '3.5.0' },
                }),
              ],
            })</code></pre></code-block>

            <h2>Project Structure Convention</h2>
            <code-block
            ><pre><code>my-app/
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
                  vite.config.ts</code></pre></code-block>

                  <div class="nav-row">
                    <a href="/guide/ssg" class="nav-link">&larr; SSG</a>
                    <a href="/guide/error-handling" class="nav-link">Error Handling &rarr;</a>
                  </div>
                </div>
              </app-layout>
            `;
          }
        }

        customElements.define('page-configuration', ConfigurationPage);
        export default ConfigurationPage;
        export const tagName = 'page-configuration';
