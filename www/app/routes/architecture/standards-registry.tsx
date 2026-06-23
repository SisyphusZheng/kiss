export const meta = { section: 'Reference', label: 'Standards Registry', order: 80 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    .registry-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .registry-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

export class StandardsRegistryPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    return (
      <div class='container'>
        <h1>Standards Registry</h1>
        <p class='subtitle'>
          openElement documents standards-facing contracts so routes, elements,
          islands, and package layers can be reasoned about as public surfaces.
        </p>

        <div class='registry-grid'>
          <open-card variant='artifact'>
            <h3>Elements</h3>
            <p>Custom Elements and DSD define the component boundary.</p>
          </open-card>
          <open-card>
            <h3>Routes</h3>
            <p>Route metadata keeps navigation and generated docs explicit.</p>
          </open-card>
          <open-card>
            <h3>Packages</h3>
            <p>Package layers keep runtime, app, UI, and adapters separate.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('standards-registry-page', StandardsRegistryPage);
export default StandardsRegistryPage;
export const tagName = 'standards-registry-page';
