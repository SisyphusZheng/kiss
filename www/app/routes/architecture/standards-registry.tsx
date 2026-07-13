export const meta = { section: 'Reference', label: 'WC Standards Contract', order: 80 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
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
      <open-reading-shell><div class='container'>
        <h1>WC Standards Contract</h1>
        <p class='subtitle'>
          OpenElement relies on web-platform contracts rather than a proprietary
          registry product. Custom Elements, DSD, CEM, Request/Response and
          FormData define the direction of the public application model.
        </p>

        <div class='registry-grid'>
          <open-card variant='artifact'>
            <h3>Elements + DSD</h3>
            <p>Standard Custom Elements and Declarative Shadow DOM define the durable component boundary.</p>
          </open-card>
          <open-card>
            <h3>Request semantics</h3>
            <p>Request, Response and FormData guide future application interaction without inventing a proprietary transport.</p>
          </open-card>
          <open-card>
            <h3>Five-package ownership</h3>
            <p>Element, App, Adapter Vite, Create and optional UI are the current consumer surface; internal contracts stay internal.</p>
          </open-card>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('standards-registry-page', StandardsRegistryPage);
export default StandardsRegistryPage;
export const tagName = 'standards-registry-page';
