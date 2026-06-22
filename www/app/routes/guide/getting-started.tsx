export const meta = { section: 'Guide', label: 'Getting Started', order: 1 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui';
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
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (
      <div class='container'>
        <h1>Getting Started</h1>
        <p class='subtitle'>
          openElement = Elements + UI + Framework + Protocols. Start with the
          Deno-first workflow, then inspect elements, routes, and UI primitives
          as separate layers.
        </p>
        <p class='subtitle'>
          The v0.40.7 line hardened release infrastructure and CI. The current
          active line is v0.41.0-alpha1, a cleanup-train patch that removes the legacy
          Linear UI compatibility surface and tightens type safety before the
          v0.41.0 npm-only distribution work.
        </p>
        <div class='guide-grid'>
          <open-card>
            <h3>Install</h3>
            <p>Use the repository Deno tasks for local development.</p>
          </open-card>
          <open-card>
            <h3>Explore</h3>
            <p>Read the docs, API reference, and roadmap as the public product map.</p>
          </open-card>
          <open-card>
            <h3>Build</h3>
            <p>Run the site build before treating visual changes as complete.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('guide-getting-started-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-getting-started-page';
