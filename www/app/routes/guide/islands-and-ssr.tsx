export const meta = { section: 'Guide', label: 'Islands and SSR', order: 90 };

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
      <open-reading-shell rail footer metadata='{"breadcrumb":"Guide","title":"Islands and SSR","lede":"SSR and DSD provide the document baseline. Islands add client behavior at declared boundaries."}' previous='/guide/error-handling' previous-label='Error Handling' next='/guide/deployment' next-label='Deployment'><open-page-rail slot='rail' items='[{"id":"server-first","label":"Server first","level":3},{"id":"declared-islands","label":"Declared islands","level":3},{"id":"small-runtime","label":"Small runtime","level":3}]'></open-page-rail><div class='container'>
        <div class='guide-grid'>
          <open-card>
            <h3 id='server-first'>Server first</h3>
            <p>Render useful HTML before client modules run.</p>
          </open-card>
          <open-card>
            <h3 id='declared-islands'>Declared islands</h3>
            <p>Hydration should be visible from route metadata.</p>
          </open-card>
          <open-card>
            <h3 id='small-runtime'>Small runtime</h3>
            <p>Keep browser JavaScript scoped to interactive surfaces.</p>
          </open-card>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-islands-and-ssr-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-islands-and-ssr-page';
