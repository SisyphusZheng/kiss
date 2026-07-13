export const meta = { section: 'Guide', label: 'Architecture', order: 20 };

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
      <open-reading-shell rail footer previous='/guide/core-concepts' previous-label='Core Concepts' next='/guide/comparison' next-label='Comparison'><open-page-rail slot='rail' items='[{"id":"elements","label":"Elements","level":3},{"id":"routes","label":"Routes","level":3},{"id":"packages","label":"Packages","level":3}]'></open-page-rail><div class='container'>
        <h1 id='start'>Architecture Guide</h1>
        <p class='subtitle'>openElement is organized around elements, routes, islands, and package layers rather than a single client app shell.</p>
        <div class='guide-grid'>
          <open-card>
            <h3 id='elements'>Elements</h3>
            <p>Custom Elements and DSD define the component surface.</p>
          </open-card>
          <open-card>
            <h3 id='routes'>Routes</h3>
            <p>Route metadata drives navigation, generated pages, and documentation.</p>
          </open-card>
          <open-card>
            <h3 id='packages'>Packages</h3>
            <p>Core, app, UI, adapters, and SSG stay as separate package layers.</p>
          </open-card>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-architecture-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-architecture-page';
