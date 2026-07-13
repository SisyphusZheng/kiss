export const meta = { section: 'Guide', label: 'Routing and Data', order: 40 };

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
      <open-reading-shell rail footer previous='/guide/comparison' previous-label='Comparison' next='/guide/mdx' next-label='MDX'><open-page-rail slot='rail' items='[{"id":"file-routes","label":"File routes","level":3},{"id":"metadata","label":"Metadata","level":3},{"id":"data-boundary","label":"Data boundary","level":3}]'></open-page-rail><div class='container'>
        <h1 id='start'>Routing and Data</h1>
        <p class='subtitle'>Routes are file-based surfaces with explicit metadata and data boundaries.</p>
        <div class='guide-grid'>
          <open-card>
            <h3 id='file-routes'>File routes</h3>
            <p>Routes should be discoverable from the repository tree.</p>
          </open-card>
          <open-card>
            <h3 id='metadata'>Metadata</h3>
            <p>Navigation and generated docs rely on route metadata.</p>
          </open-card>
          <open-card>
            <h3 id='data-boundary'>Data boundary</h3>
            <p>Keep data loading separate from presentation markup.</p>
          </open-card>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-routing-and-data-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-routing-and-data-page';
