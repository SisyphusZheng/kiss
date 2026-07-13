export const meta = { section: 'Guide', label: 'Testing', order: 110 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
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
      <open-reading-shell rail footer previous='/guide/deployment' previous-label='Deployment'><open-page-rail slot='rail' items='[{"id":"type-checks","label":"Type checks","level":3},{"id":"build-checks","label":"Build checks","level":3},{"id":"visual-checks","label":"Visual checks","level":3}]'></open-page-rail><div class='container'>
        <h1 id='start'>Testing</h1>
        <p class='subtitle'>Use checks that match the changed surface: type checks for routes, build checks for generated output, and visual checks for design changes.</p>
        <div class='guide-grid'>
          <open-card>
            <h3 id='type-checks'>Type checks</h3>
            <p>Run Deno checks on changed route and component files.</p>
          </open-card>
          <open-card>
            <h3 id='build-checks'>Build checks</h3>
            <p>Use the site build to catch generation regressions.</p>
          </open-card>
          <open-card>
            <h3 id='visual-checks'>Visual checks</h3>
            <p>Capture desktop and mobile states for layout-sensitive work.</p>
          </open-card>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-testing-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-testing-page';
