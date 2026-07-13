export const meta = { section: 'Guide', label: 'Configuration', order: 70 };

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
      <open-reading-shell rail footer metadata='{"breadcrumb":"Guide","title":"Configuration","lede":"Configuration stays close to the route, build or package surface it affects."}' previous='/guide/api' previous-label='API Routes' next='/guide/error-handling' next-label='Error Handling'><open-page-rail slot='rail' items='[{"id":"route-config","label":"Route config","level":3},{"id":"build-config","label":"Build config","level":3},{"id":"package-config","label":"Package config","level":3}]'></open-page-rail><div class='container'>
        <div class='guide-grid'>
          <open-card>
            <h3 id='route-config'>Route config</h3>
            <p>Declare route-facing behavior where the route can be audited.</p>
          </open-card>
          <open-card>
            <h3 id='build-config'>Build config</h3>
            <p>Keep Vite and SSG settings explicit in project tasks.</p>
          </open-card>
          <open-card>
            <h3 id='package-config'>Package config</h3>
            <p>Use package manifests for publish and dependency boundaries.</p>
          </open-card>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-configuration-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-configuration-page';
