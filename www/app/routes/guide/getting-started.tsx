export const meta = { section: 'Guide', label: 'Getting Started', order: 1 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { OPENELEMENT_VERSION } from '../../data/version.ts';
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
      <open-reading-shell><div class='container'>
        <h1>Getting Started</h1>
        <p class='subtitle'>
          OpenElement is a Web Components-native, static-first application
          framework. Start with the Deno-first workflow, then use standard
          Custom Elements, pages, routes, selective upgrades and deployable
          Vite/Nitro output through one application model.
        </p>
        <p class='subtitle'>
          The current published package line is {OPENELEMENT_VERSION}. The
          repository-side beta.4 five-package convergence is complete; external
          adopter pilot #390 and candidate release evidence remain open.
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
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-getting-started-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-getting-started-page';
