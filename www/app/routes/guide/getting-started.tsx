export const meta = { section: 'Guide', label: 'Getting Started', order: 1 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    .guide-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .guide-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

export class GuideGuidePage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    return (
      <div class='container'>
        <h1>Getting Started</h1>
        <p class='subtitle'>
          openElement = Web Components Fullstack Framework + Basic Element.
          Start with the Deno-first workflow, then inspect pages, routes,
          Web Components, API routes, and deployment as one app model.
        </p>
        <p class='subtitle'>
          The current package line is v0.41.0-alpha.5. The active execution line
          is v0.41.0-alpha.6 App/protocol hardening, followed by
          v0.41.0-alpha.7 Mastodon Desktop dogfood and v0.41.0-beta.1 adoption
          freeze.
        </p>
        <div class='guide-grid'>
          <open-card>
            <h3>Install</h3>
            <p>Use the npm-first create surface and Deno tasks for local development.</p>
          </open-card>
          <open-card>
            <h3>Explore</h3>
            <p>Read the docs, API reference, and roadmap as the current product map.</p>
          </open-card>
          <open-card>
            <h3>Build</h3>
            <p>Run build, package, docs truth, and visual smoke gates before release.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('guide-getting-started-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-getting-started-page';
