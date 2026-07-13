export const meta = { section: 'Guide', label: 'MDX', order: 50 };

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
      <open-reading-shell rail footer metadata='{"breadcrumb":"Guide","title":"MDX","lede":"Documentation content compiles into the same route and component system as authored pages."}' previous='/guide/routing-and-data' previous-label='Routing and Data' next='/guide/api' next-label='API Routes'><open-page-rail slot='rail' items='[{"id":"content-source","label":"Content source","level":3},{"id":"components","label":"Components","level":3},{"id":"build-path","label":"Build path","level":3}]'></open-page-rail><div class='container'>
        <div class='guide-grid'>
          <open-card>
            <h3 id='content-source'>Content source</h3>
            <p>Keep source content reviewable in the repository.</p>
          </open-card>
          <open-card>
            <h3 id='components'>Components</h3>
            <p>Use shared UI primitives for examples and callouts.</p>
          </open-card>
          <open-card>
            <h3 id='build-path'>Build path</h3>
            <p>Validate generated pages through the normal site build.</p>
          </open-card>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-mdx-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-mdx-page';
