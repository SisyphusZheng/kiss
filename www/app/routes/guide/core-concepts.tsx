export const meta = { section: 'Guide', label: 'Core Concepts', order: 10 };

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
      <open-reading-shell rail footer previous='/guide/getting-started' previous-label='Getting Started' next='/guide/architecture' next-label='Architecture'><open-page-rail slot='rail' items='[{"id":"openelement","label":"OpenElement","level":3},{"id":"dsd","label":"DSD","level":3},{"id":"islands","label":"Islands","level":3}]'></open-page-rail><div class='container'>
        <h1 id='start'>Core Concepts</h1>
        <p class='subtitle'>The core model is standards-first: authored elements, declarative rendering, file routes, and optional islands.</p>
        <div class='guide-grid'>
          <open-card>
            <h3 id='openelement'>OpenElement</h3>
            <p>The base element class provides the component authoring surface.</p>
          </open-card>
          <open-card>
            <h3 id='dsd'>DSD</h3>
            <p>Declarative Shadow DOM carries server-rendered shadow roots in HTML.</p>
          </open-card>
          <open-card>
            <h3 id='islands'>Islands</h3>
            <p>Hydrate only the components that need browser runtime behavior.</p>
          </open-card>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-core-concepts-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-core-concepts-page';
