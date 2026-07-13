export const meta = { section: 'Guide', label: 'Error Handling', order: 80 };

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
      <open-reading-shell rail footer metadata='{"breadcrumb":"Guide","title":"Error Handling","lede":"Error handling preserves platform semantics and keeps route failures visible."}' previous='/guide/configuration' previous-label='Configuration' next='/guide/islands-and-ssr' next-label='Islands and SSR'><open-page-rail slot='rail' items='[{"id":"route-errors","label":"Route errors","level":3},{"id":"component-errors","label":"Component errors","level":3},{"id":"build-errors","label":"Build errors","level":3}]'></open-page-rail><div class='container'>
        <div class='guide-grid'>
          <open-card>
            <h3 id='route-errors'>Route errors</h3>
            <p>Return clear status codes and response bodies from API boundaries.</p>
          </open-card>
          <open-card>
            <h3 id='component-errors'>Component errors</h3>
            <p>Keep component fallback states local and inspectable.</p>
          </open-card>
          <open-card>
            <h3 id='build-errors'>Build errors</h3>
            <p>Treat generation failures as release blockers, not cosmetic warnings.</p>
          </open-card>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-error-handling-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-error-handling-page';
