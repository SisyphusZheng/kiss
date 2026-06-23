export const meta = { section: 'Guide', label: 'Architecture', order: 20 };

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
        <h1>Architecture Guide</h1>
        <p class='subtitle'>openElement is organized around elements, routes, islands, and package layers rather than a single client app shell.</p>
        <div class='guide-grid'>
          <open-card>
            <h3>Elements</h3>
            <p>Custom Elements and DSD define the component surface.</p>
          </open-card>
          <open-card>
            <h3>Routes</h3>
            <p>Route metadata drives navigation, generated pages, and documentation.</p>
          </open-card>
          <open-card>
            <h3>Packages</h3>
            <p>Core, app, UI, adapters, and SSG stay as separate package layers.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('guide-architecture-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-architecture-page';
