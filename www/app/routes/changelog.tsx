/**
 * Changelog Page - openElement Framework Version History.
 */
export const meta = { section: "", label: "Changelog", order: 20 };
import { OpenElement } from "@openelement/element";
import { StyleSheet } from "@openelement/element";
import "@openelement/ui/open-button";
import { pageStyles } from "../components/page-styles.js";
import { marked } from "marked";
// @deno-types="npm:@types/sanitize-html@^2"
import sanitizeHtml from "npm:sanitize-html@^2.17.4";
import "@openelement/site-ui/open-page-hero.tsx";
import "@openelement/site-ui/open-reading-shell.tsx";
import "@openelement/site-ui/open-page-rail.tsx";

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
  :host { display: block; }
  .changelog-content { font-size: var(--font-size-1); line-height: var(--font-lineheight-4); color: var(--text-primary); }
  .changelog-content h2 { position:relative; font-size: var(--font-size-5); margin: var(--size-10) 0 var(--size-4); border-bottom: 0.5px solid var(--border); padding:0 0 var(--size-4) var(--size-6); }
  .changelog-content h2::before { content:""; position:absolute; inset:0 auto 0 0; width:2px; background:var(--brand); box-shadow:0 0 22px color-mix(in srgb,var(--brand) 52%,transparent); }
  .changelog-content h2:first-child::after { content:"published history"; display:block; margin-top:var(--size-2); color:var(--brand); font-family:var(--font-mono); font-size:var(--font-size-00); text-transform:uppercase; letter-spacing:.08em; }
  .changelog-content h3 { font-size: var(--font-size-3); margin: var(--size-6) 0 var(--size-2); }
  .changelog-content code { font-family: var(--font-mono); background: var(--bg-surface); padding: var(--size-1) var(--size-2); border-radius: var(--radius-1); font-size: var(--font-size-00); }
  .changelog-content pre { background: var(--bg-surface); padding: var(--size-5) var(--size-6); border-radius: var(--radius-3); overflow-x: auto; }
`,
);

export class ChangelogPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    const changelogPath = new URL("../../../../CHANGELOG.md", import.meta.url);
    let html: string;
    try {
      const md = Deno.readTextFileSync(changelogPath);
      const raw = marked.parse(md, { async: false }) as string;
      html = sanitizeHtml(raw, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "h2",
          "h3",
          "h4",
          "img",
        ]),
        allowedAttributes: { a: ["href", "target", "rel"] },
      });
    } catch {
      html =
        '<p>Unable to load the changelog. Read it on <a href="https://github.com/open-element/openelement/blob/main/CHANGELOG.md">GitHub</a>.</p>';
    }

    return (
      <main>
        <open-page-hero variant="timeline">
          <span slot="eyebrow">Release evidence</span>
          <span slot="title">Changelog</span>
          <span slot="lede">Published, candidate, withdrawn and historical release evidence for OpenElement.</span>
          <div slot="artifact"><open-button href="/roadmap">Read roadmap</open-button></div>
        </open-page-hero>
        <open-reading-shell meta rail footer>
          <div slot="meta"><p class="section-label">Current truth</p><p class="subtitle">The currently published package line is <code>0.41.0-alpha.8</code>.</p></div>
          <open-page-rail slot="rail" items='[{"id":"published","label":"Published"},{"id":"candidate","label":"Candidate"},{"id":"withdrawn","label":"Withdrawn"},{"id":"historical","label":"Historical archive"}]'></open-page-rail>
        <p id="published">
          The project follows Keep a Changelog and SemVer. Historical entries
          preserve older names where they describe older releases; current docs
          use the openElement contract.
        </p>
        <section id="candidate"><h2>Candidate</h2><p><code>0.41.0-beta.4</code> is an unpublished candidate. It needs the external adopter pilot #390 and final release evidence before it can become a published release.</p></section>
        <section id="withdrawn"><h2>Withdrawn partial artifacts</h2><p>The npm beta.1–beta.3 artifacts are withdrawn partial releases, not supported product lines or upgrade targets.</p></section>
        <div id="historical" class="changelog-content" innerHTML={html} trustedHtml={true} />
        <div slot="footer" class="nav-row">
          <open-button variant="ghost" size="sm" href="/roadmap">
            Roadmap
          </open-button>
          <open-button
            variant="ghost"
            size="sm"
            href="/guide/getting-started"
          >
            Getting Started
          </open-button>
        </div>
        </open-reading-shell>
      </main>
    );
  }
}

customElements.define("page-changelog", ChangelogPage);
export default ChangelogPage;
export const tagName = "page-changelog";
