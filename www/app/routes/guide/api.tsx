export const meta = { section: 'Core', label: 'API Routes', order: 60 };

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
      <open-reading-shell rail footer previous='/guide/mdx' next='/guide/configuration'><open-page-rail slot='rail'><a href='#start'>Overview</a></open-page-rail><div class='container'>
        <h1>API Routes</h1>
        <p class='subtitle'>API routes use platform request and response primitives. Keep route handlers explicit, typed, and close to the app boundary.</p>
        <div class='guide-grid'>
          <open-card>
            <h3>Request boundary</h3>
            <p>Use Web Request and Response objects at the edge of the API contract.</p>
          </open-card>
          <open-card>
            <h3>Handler shape</h3>
            <p>Keep input parsing, validation, and response serialization visible in the route.</p>
          </open-card>
          <open-card>
            <h3>Runtime fit</h3>
            <p>Use Deno-first tasks and avoid Node-only assumptions in docs examples.</p>
          </open-card>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-api-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-api-page';
