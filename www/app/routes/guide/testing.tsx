export const meta = { section: 'Guide', label: 'Testing', order: 110 };

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
        <h1>Testing</h1>
        <p class='subtitle'>Use checks that match the changed surface: type checks for routes, build checks for generated output, and visual checks for design changes.</p>
        <div class='guide-grid'>
          <open-card>
            <h3>Type checks</h3>
            <p>Run Deno checks on changed route and component files.</p>
          </open-card>
          <open-card>
            <h3>Build checks</h3>
            <p>Use the site build to catch generation regressions.</p>
          </open-card>
          <open-card>
            <h3>Visual checks</h3>
            <p>Capture desktop and mobile states for layout-sensitive work.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('guide-testing-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-testing-page';
