/**
 * Contributing Page - openElement Framework Contribution Guide
 */
export const meta = { section: "", label: "Contributing", order: 30 };
import { OpenElement } from "@openelement/element";
import { StyleSheet } from "@openelement/element";
import { pageStyles } from "../components/page-styles.js";
import "@openelement/ui/open-code-block";
import "@openelement/ui/open-button";
import "@openelement/site-ui/open-page-hero.tsx";
import "@openelement/site-ui/open-artifact-panel.tsx";

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

      .layer-diagram {
        padding: var(--size-5);
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        border-radius: var(--radius-2);
        margin: var(--size-6) 0;
        font-size: var(--font-size-1);
        line-height: var(--font-lineheight-4);
        font-family: var(--font-mono);
        white-space: pre;
        overflow-x: auto;
        color: var(--text-secondary);
      }
      .commit-types {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--size-3);
        margin: var(--size-4) 0;
      }
      .commit-type {
        padding: var(--size-3) var(--size-4);
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        border-radius: var(--radius-1);
        font-size: var(--font-size-2);
      }
      .commit-type code {
        color: var(--brand);
        font-weight: var(--font-weight-6);
      }
    `,
);

export class ContributingPage extends OpenElement {
  static override styles = [routeSheet];
  override render() {
    return this._renderEn();
  }

  private _renderEn() {
    return (
      <><open-page-hero variant="technical"><span slot="eyebrow">Maintainer guide</span><span slot="title">Contributing</span><span slot="lede">A precise, Deno-first contributor workflow for the Web Standards Lab.</span><open-artifact-panel slot="artifact"><span slot="label">contribution contract</span><span slot="meta">public repository</span><p>Use the same product interfaces, checks and release evidence that the framework requires of itself.</p></open-artifact-panel></open-page-hero><open-reading-shell rail footer><open-page-rail slot="rail"><a href="#start">Overview</a></open-page-rail><div class="container">
        <h1 id="start">Contributing to openElement</h1>
        <p class="subtitle">
          Thank you for your interest in the openElement Framework!
        </p>
        <h2>Development Setup</h2>
        <open-code-block>
          <pre><code>git clone https://github.com/open-element/openelement.git
cd openElement
deno install
deno task test
deno task dev</code></pre>
        </open-code-block>
        <h2>Deno-first Toolchain</h2>
        <p>
          openElement core CLI, SSG, serverless API, tests, publishing, and docs
          site tasks all use Deno 2.8+ as the default runtime. Vite 8 runs via
          {" "}
          <span class="inline-code">deno run -A npm:vite</span> - no{" "}
          <span class="inline-code">npm</span> or{" "}
          <span class="inline-code">npx</span> needed for the main workflow.
        </p>
        <h2>Development Conventions</h2>
        <ul>
          <li>
            <strong>Code style</strong>: Use{" "}
            <span class="inline-code">deno fmt</span> +{" "}
            <span class="inline-code">deno lint</span>
          </li>
          <li>
            <strong>Commits</strong>: Conventional Commits
            (<span class="inline-code">
              feat
            </span>/<span class="inline-code">
              fix
            </span>/<span class="inline-code">docs</span>
            /<span class="inline-code">
              refactor
            </span>/<span class="inline-code">test</span>
            /<span class="inline-code">chore</span>)
          </li>
          <li>
            <strong>Layering</strong>: Before adding a new feature, check if it
            can be solved at a lower level: L0 HTML, L1 CSS, L2 Browser API, L3
            Hono/Vite/Lit, then L4 custom code.
          </li>
        </ul>
        <h2>Release Process</h2>
        <ol>
          <li>
            Update version numbers (<span class="inline-code">
              packages/*/deno.json
            </span>)
          </li>
          <li>Update changelog</li>
          <li>
            Run tests: <span class="inline-code">deno task test</span>
          </li>
          <li>
            Publish packages: <span class="inline-code">deno task publish:jsr</span>,{" "}
            <span class="inline-code">deno task publish:npm</span>,{" "}
            <span class="inline-code">deno task pack:dry-run</span>
          </li>
          <li>Create GitHub Release</li>
        </ol>
        <div class="nav-row">
          <open-button variant="ghost" size="sm" href="/changelog">
            Changelog
          </open-button>
          <open-button variant="ghost" size="sm" href="/roadmap">
            Roadmap
          </open-button>
        </div>
      </div></open-reading-shell></>
    );
  }
}

customElements.define("page-contributing", ContributingPage);
export default ContributingPage;
export const tagName = "page-contributing";
