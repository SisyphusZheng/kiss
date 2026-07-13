export const meta = { section: 'Principles', label: 'Islands', order: 40 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    .island-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .island-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

export class IslandsGuidePage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    return (
      <open-reading-shell rail><open-page-rail slot='rail' items='[{"id":"static-surface","label":"Static surface","level":3},{"id":"hydration-boundary","label":"Hydration boundary","level":3},{"id":"progressive-behavior","label":"Progressive behavior","level":3}]'></open-page-rail><div class='container'>
        <h1 id='start'>Island Hydration</h1>
        <p class='subtitle'>
          openElement keeps documents and Web Components server-rendered by
          default. Islands are reserved for client components that need runtime
          state or framework interop.
        </p>

        <open-artifact-panel><span slot='label'>activation boundary</span><span slot='meta'>static → interactive</span><div class='island-grid'>
          <open-card>
            <h3 id='static-surface'>Static surface</h3>
            <p>HTML and DSD render first, without forcing a client app shell.</p>
          </open-card>
          <open-card variant='artifact'>
            <h3 id='hydration-boundary'>Hydration boundary</h3>
            <p>
              Client modules attach where the route metadata declares an island.
            </p>
          </open-card>
          <open-card>
            <h3 id='progressive-behavior'>Progressive behavior</h3>
            <p>
              Interactive pieces can load independently from the surrounding
              document.
            </p>
          </open-card>
        </div></open-artifact-panel>
      </div></open-reading-shell>
    );
  }
}

customElements.define('islands-guide-page', IslandsGuidePage);
export default IslandsGuidePage;
export const tagName = 'islands-guide-page';
