import { LitElement, html, css } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class ArchitecturePage extends LitElement {
  static styles = [
    pageStyles,
    css`

`,
  ];
  render() {
    return html`
      <kiss-layout currentPath="/guide/architecture">
        <div class="container">
          <h1>Architecture</h1>
          <p class="subtitle">
            How KISS Framework implements the K·I·S·S Architecture constraints —
            connecting Hono, Lit, and Vite into one plugin.
          </p>

          <h2>User Perspective</h2>
          <code-block
            ><pre><code>// vite.config.ts — your only config
import { kiss } from '@kissjs/core'
export default defineConfig({
  plugins: [kiss()]
})</code></pre></code-block
          >

          <h2>KISS Architecture = Jamstack, Web Standards Native</h2>
          <p>
            The K·I·S·S constraints align 1:1 with Jamstack's three pillars,
            implemented entirely through Web Standards:
          </p>
          <table>
            <thead>
              <tr>
                <th>Jamstack</th>
                <th>KISS Constraint</th>
                <th>Implementation</th>
                <th>Web Standard</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>M</strong>arkup</td>
                <td>K + S (Knowledge + Semantic)</td>
                <td>SSG + DSD — zero-JS static HTML</td>
                <td>Declarative Shadow DOM</td>
              </tr>
              <tr>
                <td><strong>A</strong>PIs</td>
                <td>S (Static — Serverless extension)</td>
                <td>API Routes — Hono handlers + RPC</td>
                <td>Fetch API</td>
              </tr>
              <tr>
                <td><strong>J</strong>avaScript</td>
                <td>I (Isolated)</td>
                <td>Islands — Shadow DOM + lazy hydration</td>
                <td>Web Components</td>
              </tr>
            </tbody>
          </table>
          <p>
            No other framework covers all three Jamstack dimensions with native
            Web Standards.
          </p>

          <h2>Plugin Composition</h2>
          <p>
            The <span class="inline-code">kiss()</span> function returns an
            array of Vite plugins, each enforcing a specific KISS constraint:
          </p>
          <table>
            <thead>
              <tr>
                <th>Plugin</th>
                <th>Hook</th>
                <th>Role</th>
                <th>Constraint</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>kiss:core</td>
                <td>configResolved + buildStart</td>
                <td>Route scanning + virtual module generation</td>
                <td>K (Knowledge)</td>
              </tr>
              <tr>
                <td>kiss:virtual-entry</td>
                <td>resolveId + load</td>
                <td>Provide virtual:kiss-hono-entry</td>
                <td>—</td>
              </tr>
              <tr>
                <td>@hono/vite-dev-server</td>
                <td>configureServer</td>
                <td>Dev mode Hono middleware</td>
                <td>—</td>
              </tr>
              <tr>
                <td>island-transform</td>
                <td>transform</td>
                <td>AST marking (__island, __tagName)</td>
                <td>I (Isolated)</td>
              </tr>
              <tr>
                <td>island-extractor</td>
                <td>build</td>
                <td>Build-time island dependency analysis</td>
                <td>I (Isolated)</td>
              </tr>
              <tr>
                <td>html-template</td>
                <td>transformIndexHtml</td>
                <td>Preload, meta, hydration injection</td>
                <td>I (Isolated)</td>
              </tr>
              <tr>
                <td>kiss:ssg</td>
                <td>closeBundle</td>
                <td>Static site generation with DSD</td>
                <td>K + S (Knowledge + Static)</td>
              </tr>
              <tr>
                <td>kiss:build</td>
                <td>build</td>
                <td>Island client JS bundles</td>
                <td>I (Isolated)</td>
              </tr>
            </tbody>
          </table>

          <h2>Request Lifecycle (Dev)</h2>
          <code-block
            ><pre><code>Request → Vite Dev Server → Hono middleware → Route match
  → Vite SSR (ssrLoadModule) → @lit-labs/ssr renders Lit
  → HTML + Declarative Shadow DOM → Inject Island hydration → Response</code></pre></code-block
          >

          <h2>Build Lifecycle (SSG)</h2>
          <code-block
            ><pre><code>vite build → closeBundle hook:
  1. Scan routes                             ← K: all routes known at build time
  2. Generate SSG entry with DOM shim
  3. Create Vite SSR server (configFile: false)
  4. Load entry → Hono app → toSSG()
  5. @lit-labs/ssr renders each page with DSD ← K: content encoded in HTML
  6. Island components → separate JS chunks    ← I: isolated JS bundles
  7. Non-Island components → zero client JS    ← I: no JS where not needed
  8. Write dist/ as static HTML                ← S: static output only</code></pre></code-block
          >

          <h2>Full-Stack Deployment</h2>
          <p>
            KISS Architecture's S constraint (Static) means you deploy two
            things independently:
          </p>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Content</th>
                <th>Constraint</th>
                <th>Deploy To</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>dist/</strong> (static)</td>
                <td>HTML + DSD + Island JS</td>
                <td>K + I + S</td>
                <td>CDN / GitHub Pages / S3</td>
              </tr>
              <tr>
                <td><strong>API Routes</strong> (dynamic)</td>
                <td>Hono handlers</td>
                <td>S (Serverless)</td>
                <td>Serverless (Deno Deploy / CF Workers)</td>
              </tr>
            </tbody>
          </table>
          <p>
            Static files go to CDN for global performance. API Routes deploy as
            Serverless functions. Zero coupling between the two. This is the
            Jamstack model enforced by the S constraint.
          </p>

          <h2>DSD Output</h2>
          <p>
            Every Lit component rendered by
            <span class="inline-code">@lit-labs/ssr</span> outputs
            <strong>Declarative Shadow DOM</strong>. This satisfies the K
            constraint (content knowledge at build time) and the S constraint
            (semantic baseline without JS):
          </p>
          <code-block
            ><pre><code>&lt;!-- SSG output for a Lit component --&gt;
&lt;app-layout&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* scoped styles */&lt;/style&gt;
    &lt;header&gt;...&lt;/header&gt;
    &lt;main&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/main&gt;
    &lt;footer&gt;...&lt;/footer&gt;
  &lt;/template&gt;
  &lt;!-- slotted page content --&gt;
&lt;/app-layout&gt;</code></pre></code-block
          >
          <p>
            Browsers with DSD support render the Shadow DOM content immediately.
            When Lit hydrates, it reuses the existing DOM — no flash, no
            duplication.
          </p>

          <h2>Island Hydration</h2>
          <p>
            At build time, <span class="inline-code">island-transform</span>
            marks island modules. <span class="inline-code">island-extractor</span
            > builds a dependency map. The HTML template plugin injects a
            hydration script that lazy-loads only the island JS bundles the page
            needs. This enforces the I constraint — only Islands get JS.
          </p>

          <div class="nav-row">
            <a href="/guide/testing" class="nav-link">&larr; Testing</a>
            <a href="/guide/deployment" class="nav-link"
              >Deployment &rarr;</a
            >
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-architecture', ArchitecturePage);
export default ArchitecturePage;
export const tagName = 'page-architecture';
