/**
 * Homepage - openElement v0.40.7.
 * Linear.app-style design with 4 sections: Hero, Features, Showcase, CTA.
 */
import { OpenElement } from "@openelement/element";
import { StyleSheet } from "@openelement/core/style-sheet";
import { linearTokenSheet } from "@openelement/ui";
import { consumeContext } from "@openelement/core/signal-context";
import { THEME_CTX } from "@openelement/ui/open-layout";
import { signal } from "@openelement/signal";
import { heroSheet, renderHero } from "./hero-linear.tsx";
import { featuresSheet, renderFeatures } from "./features-linear.tsx";
import { renderShowcase, showcaseSheet } from "./showcase-linear.tsx";
import { ctaSheet, renderCTA } from "./cta-linear.tsx";

export const tagName = "docs-home";

const hostSheet = new StyleSheet();
hostSheet.replaceSync(`
  :host { display: block; }
`);

export class DocsHome extends OpenElement {
  static override styles = [
    linearTokenSheet,
    hostSheet,
    heroSheet,
    featuresSheet,
    showcaseSheet,
    ctaSheet,
  ];

  #activeTab = signal(0);

  constructor() {
    super();
    this.registerSignal("activeTab", this.#activeTab);
  }

  override connectedCallback() {
    super.connectedCallback();
    const theme = consumeContext(THEME_CTX);
    this.setAttribute("data-theme", theme.value);
    theme.subscribe((t) => this.setAttribute("data-theme", t));
  }

  #switchTab(i: number) {
    this.#activeTab.value = i;
    this.update();
  }

  override render() {
    return (
      <div>
        {renderHero()}
        {renderFeatures()}
        {renderShowcase(
          this.#activeTab.value,
          (i: number) => this.#switchTab(i),
        )}
        {renderCTA()}
      </div>
    );
  }
}

customElements.define(tagName, DocsHome);
export default DocsHome;
