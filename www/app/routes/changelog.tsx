/**
 * Changelog Page - openElement Framework Version History.
 */
export const meta = { section: "", label: "Changelog", order: 20 };
import { OpenElement } from "@openelement/element";
import { StyleSheet } from "@openelement/core/style-sheet";
import { openPropsTokenSheet } from "@openelement/ui";
import "@openelement/ui/open-button";
import { pageStyles } from "../components/page-styles.js";
import { marked } from "marked";
// @deno-types="npm:@types/sanitize-html@^2"
import sanitizeHtml from "npm:sanitize-html@^2.17.4";

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
  :host { display: block; }
  .changelog-content { font-size: var(--font-size-1); line-height: var(--font-lineheight-4); color: var(--text-primary); }
  .changelog-content h2 { font-size: var(--font-size-5); margin: var(--size-10) 0 var(--size-4); border-bottom: 0.5px solid var(--border); padding-bottom: var(--size-4); }
  .changelog-content h3 { font-size: var(--font-size-3); margin: var(--size-6) 0 var(--size-2); }
  .changelog-content code { font-family: var(--font-mono); background: var(--bg-surface); padding: var(--size-1) var(--size-2); border-radius: var(--radius-1); font-size: var(--font-size-00); }
  .changelog-content pre { background: var(--bg-surface); padding: var(--size-5) var(--size-6); border-radius: var(--radius-3); overflow-x: auto; }
`,
);

export class ChangelogPage extends OpenElement {
  static override styles = [openPropsTokenSheet, routeSheet];

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
      <div class="container">
        <h1>Changelog</h1>
        <p class="subtitle">
          Release history and architecture changes for openElement.
        </p>
        <p>
          The project follows Keep a Changelog and SemVer. Historical entries
          preserve older names where they describe older releases; current docs
          use the openElement contract.
        </p>
        <div class="changelog-content" innerHTML={html} trustedHtml={true} />
        <div class="nav-row">
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
      </div>
    );
  }
}

customElements.define("page-changelog", ChangelogPage);
export default ChangelogPage;
export const tagName = "page-changelog";


