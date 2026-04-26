import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class DesignPhilosophyPage extends LitElement {
  static styles = [
    pageStyles,
    css`
      .pillar {
        padding: 1.25rem;
        margin: 1rem 0;
        border-left: 3px solid var(--kiss-border-hover);
        background: var(--kiss-bg-surface);
        border-radius: 0 3px 3px 0;
      }
      .pillar .num {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--kiss-text-muted);
        margin-bottom: 0.25rem;
      }
      .pillar .hard-constraint {
        display: inline-block;
        background: var(--kiss-code-bg);
        border: 1px solid var(--kiss-border-hover);
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.8125rem;
        margin: 0.125rem 0;
      }
    `,
  ];
  render() {
    return html`
      <kiss-layout currentPath="/guide/design-philosophy">
        <div class="container">
          <h1>Design Philosophy</h1>
          <p class="subtitle">
            KISS = Keep It Simple, Stupid. Not a slogan — a filter for every decision.
          </p>

          <h2>Five Pillars</h2>

          <div class="pillar">
            <div class="num">Pillar 1</div>
            <h3>Web Standards First</h3>
            <p>
              Most frameworks "support" web standards. KISS
              <em>is</em> web standards.
            </p>
            <p>
              Your code doesn't depend on KISS abstractions. Swap it out, and your Hono/Lit/Vite code
              still works.
            </p>
            <p>
              <span class="hard-constraint">Pure ESM, zero CJS</span>
              <span class="hard-constraint">Vite-only, no second build tool</span>
              <span class="hard-constraint">No patch scripts on output</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 2</div>
            <h3>Minimal Augmentation</h3>
            <p>
              KISS doesn't invent things. It connects existing standard tools with minimum overhead.
            </p>
            <p>
              Framework = 1 Vite plugin (a connector, not a new abstraction).
            </p>
            <p>
              Zero-interaction page: <strong>0 KB</strong> KISS runtime. Single Island: ~6 KB (Lit
              itself).
            </p>
            <p>
              <span class="hard-constraint">Reuse Hono/Vite/Lit ecosystem</span>
              <span class="hard-constraint">New dependencies need ADR</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 3</div>
            <h3>No Framework Binding</h3>
            <p>
              KISS recommends Lit, but you can use something else. You can use @kissjs/core for SSR
              without Lit. You can use Lit without KISS.
            </p>
            <p>
              <span class="hard-constraint">Lit is not a forced peerDependency</span>
              <span class="hard-constraint">No mandatory validation scheme</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 4</div>
            <h3>No Runtime Binding</h3>
            <p>
              Pure ESM output runs on any runtime that supports ESM: Deno, Node, Bun, Cloudflare Workers.
            </p>
            <p>
              <span class="hard-constraint">No platform-specific hardcoded code</span>
              <span class="hard-constraint">deno.json is dev tooling, not runtime dependency</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 5</div>
            <h3>Progressive Enhancement</h3>
            <p>
              KISS defaults to zero JS. Opt in per component. No SPA — this is architecture, not
              oversight.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Content</th>
                  <th>JS Size</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>0</td>
                  <td>HTML + DSD (Declarative Shadow DOM)</td>
                  <td><strong>0 KB</strong></td>
                </tr>
                <tr>
                  <td>1</td>
                  <td>Partial Islands with lazy hydration</td>
                  <td>~6 KB / island</td>
                </tr>
              </tbody>
            </table>
            <p>
              No Level 2 SPA, no Level 3 real-time, no Level 4 CSR. This is not a gap — it's a boundary
              defined by KISS Architecture's S constraint.
            </p>
          </div>

          <h2>Philosophy vs Architecture</h2>
          <p>
            The five philosophy pillars describe <strong>how</strong> KISS makes decisions. The KISS
            Architecture (K·I·S·S) constraints define
            <strong>what</strong> the framework enforces.
          </p>
          <table>
            <thead>
              <tr>
                <th>Philosophy Pillar</th>
                <th>Architecture Constraint</th>
                <th>Relationship</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Web Standards First</td>
                <td>All four (K·I·S·S)</td>
                <td>Standards are the foundation of every constraint</td>
              </tr>
              <tr>
                <td>Minimal Augmentation</td>
                <td>I (Isolated)</td>
                <td>Minimum JS = only Islands get JS</td>
              </tr>
              <tr>
                <td>No Framework Binding</td>
                <td>I (Isolated)</td>
                <td>Web Components = zero framework binding</td>
              </tr>
              <tr>
                <td>No Runtime Binding</td>
                <td>S (Static)</td>
                <td>Pure static files = no runtime dependency</td>
              </tr>
              <tr>
                <td>Progressive Enhancement</td>
                <td>K + S (Knowledge + Semantic)</td>
                <td>Build-time knowledge + semantic baseline</td>
              </tr>
            </tbody>
          </table>

          <h2>Capability Layering</h2>
          <p>
            Every feature must pass through the capability ladder. Lower layers first, always:
          </p>
          <table>
            <thead>
              <tr>
                <th>Layer</th>
                <th>Technology</th>
                <th>Only use when</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>L0</strong></td>
                <td>HTML5 semantics</td>
                <td>Structure, content, navigation</td>
              </tr>
              <tr>
                <td><strong>L1</strong></td>
                <td>CSS</td>
                <td>Visual, layout, animation, responsive</td>
              </tr>
              <tr>
                <td><strong>L2</strong></td>
                <td>Platform APIs</td>
                <td>Clipboard, IntersectionObserver, matchMedia</td>
              </tr>
              <tr>
                <td><strong>L3</strong></td>
                <td>Hono / Vite / Lit</td>
                <td>Routing, build, component encapsulation</td>
              </tr>
              <tr>
                <td><strong>L4</strong></td>
                <td>Custom code</td>
                <td>Island hydration, RPC, plugin logic</td>
              </tr>
            </tbody>
          </table>
          <p>
            Skipping a layer = violating the design philosophy. See
            <a href="/guide/dia">KISS Architecture</a>
            for the full decision tree.
          </p>

          <h2>Review Checklist</h2>
          <code-block
          ><pre><code>Before every commit, ask:
            1. New dependency?     → Does it violate "minimal augmentation"?
            2. Modified build?    → Does it violate "Web Standards first"?
            3. New abstraction?   → Are you reinventing the wheel?
            4. Platform code?     → Does it violate "no runtime binding"?
            5. Forced choice?     → Does it violate "no framework binding"?
            6. Added JS?          → Could a lower layer do this instead?
            7. Broke Shadow DOM?  → Is there a DSD-compatible alternative?</code></pre></code-block>
          <p>
            Any "yes" requires an ADR (Architecture Decision Record).
          </p>

          <h2>Competitive Landscape</h2>
          <table>
            <thead>
              <tr>
                <th>Framework</th>
                <th>HTTP</th>
                <th>UI</th>
                <th>Build</th>
                <th>DSD</th>
                <th>Jamstack</th>
                <th>Full Standards</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Next.js</td>
                <td>Custom</td>
                <td>React</td>
                <td>Webpack</td>
                <td>—</td>
                <td>Partial</td>
                <td>0/3</td>
              </tr>
              <tr>
                <td>Astro</td>
                <td>Custom</td>
                <td>Any</td>
                <td>ESM</td>
                <td>—</td>
                <td>Yes</td>
                <td>1/3</td>
              </tr>
              <tr>
                <td>Fresh</td>
                <td>Custom</td>
                <td>Preact</td>
                <td>ESM</td>
                <td>—</td>
                <td>No</td>
                <td>1/3</td>
              </tr>
              <tr>
                <td><strong>KISS</strong></td>
                <td><strong>Fetch API</strong></td>
                <td><strong>Web Components</strong></td>
                <td><strong>ESM</strong></td>
                <td><strong>✓</strong></td>
                <td><strong>Yes</strong></td>
                <td><strong>3/3</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">&larr; Getting Started</a>
            <a href="/guide/dia" class="nav-link">KISS Architecture &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-design-philosophy', DesignPhilosophyPage);
export default DesignPhilosophyPage;
export const tagName = 'page-design-philosophy';
