import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class DeploymentPage extends LitElement {
  static styles = [
    pageStyles,
    css`
      .platform-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1rem 0 1.5rem;
      }
      .platform-card {
        padding: 1rem 1.25rem;
        border: 1px solid var(--kiss-border);
        border-radius: 3px;
      }
      .platform-card h3 {
        margin: 0 0 0.5rem;
        font-size: 0.9375rem;
        color: var(--kiss-text-primary);
      }
      .platform-card p {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--kiss-text-secondary);
      }
    `,
  ];
  render() {
    return html`
      <kiss-layout currentPath="/guide/deployment">
        <div class="container">
          <h1>Deployment</h1>
          <p class="subtitle">
            Build once, deploy anywhere. KISS Architecture (S: Static) — static frontend + Serverless
            APIs.
          </p>

          <h2>Build</h2>
          <code-block
          ><pre><code>deno run -A npm:vite build
            # Output: dist/ directory with static HTML + island JS chunks</code></pre></code-block>

            <h2>Full-Stack Architecture</h2>
            <p>KISS Architecture's S constraint means two independent deployment targets:</p>
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Content</th>
                  <th>Deploy To</th>
                  <th>Scaling</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Static Frontend</strong></td>
                  <td>dist/ (HTML + DSD + Island JS)</td>
                  <td>CDN / GitHub Pages / S3</td>
                  <td>Global edge cache</td>
                </tr>
                <tr>
                  <td><strong>API Routes</strong></td>
                  <td>Hono handlers</td>
                  <td>Serverless functions</td>
                  <td>Auto-scale on demand</td>
                </tr>
              </tbody>
            </table>
            <p>
              Static files and API functions are decoupled. Frontend deploys to the cheapest possible
              hosting; APIs deploy to Serverless platforms and scale independently.
            </p>

            <h2>Static Frontend Deployment</h2>
            <p>
              KISS Architecture produces only static files. The <span class="inline-code">dist/</span>
              directory contains HTML (with DSD) and island JS bundles. Deploy to any static host.
            </p>

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

            <h2>API Routes Deployment</h2>
            <p>
              Hono API routes can be deployed as Serverless functions to any platform that supports
              JavaScript:
            </p>
            <div class="platform-grid">
              <div class="platform-card">
                <h3>Deno Deploy</h3>
                <p>Native Hono support, zero config</p>
              </div>
              <div class="platform-card">
                <h3>Cloudflare Workers</h3>
                <p>Hono adapter built-in</p>
              </div>
              <div class="platform-card">
                <h3>Vercel Edge Functions</h3>
                <p>Hono adapter available</p>
              </div>
              <div class="platform-card">
                <h3>AWS Lambda</h3>
                <p>Via @hono/aws-lambda adapter</p>
              </div>
            </div>

            <h3>API Route Example</h3>
            <code-block
            ><pre><code>// app/routes/api/posts.ts
              import { Hono } from '@kissjs/core'

              const app = new Hono()
              app.get('/', (c) => c.json({ posts: [] }))

              export default app
              export type AppType = typeof app</code></pre></code-block>

              <h2>GitHub Pages Setup</h2>
              <code-block
              ><pre><code>// vite.config.ts
                export default defineConfig({
                  base: '/my-repo/',
                  plugins: [kiss()],
                })</code></pre></code-block>

                <p>
                  Add a GitHub Actions workflow to build and deploy on push to main. See the <span
                    class="inline-code"
                  >.github/workflows/deploy.yml</span> in this repo for a working example.
                </p>

                <h2>Why No Server Mode?</h2>
                <p>
                  KISS Architecture's S constraint (Static) — <strong>构建产物仅为纯静态文件</strong> — means
                  build output is the final product. There is no SSR runtime in production. This is not a
                  limitation; it's a discipline that guarantees:
                </p>
                <ul>
                  <li>Zero server maintenance cost</li>
                  <li>CDN-grade performance globally</li>
                  <li>Content available without JavaScript (DSD)</li>
                  <li>Deployable to the cheapest possible hosting</li>
                  <li>Static and dynamic scale independently</li>
                </ul>
                <p>
                  Dynamic data belongs in API Routes, not in a monolithic server. This is the Jamstack way — and
                  KISS Architecture enforces it as the S constraint, not convention.
                </p>

                <div class="nav-row">
                  <a href="/guide/architecture" class="nav-link">&larr; Architecture</a>
                  <a href="/styling/kiss-ui" class="nav-link">@kissjs/ui &rarr;</a>
                </div>
              </div>
            </kiss-layout>
          `;
        }
      }

      customElements.define('page-deployment', DeploymentPage);
      export default DeploymentPage;
      export const tagName = 'page-deployment';
