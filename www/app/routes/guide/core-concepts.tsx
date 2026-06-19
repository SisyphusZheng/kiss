export const meta = { section: 'Guide', label: 'Core Concepts', order: 10 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui';
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
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (
      <div class='container'>
        <h1>Core Concepts</h1>
        <p class='subtitle'>The core model is standards-first: authored elements, declarative rendering, file routes, and optional islands.</p>
        <div class='guide-grid'>
          <open-card>
            <h3>OpenElement</h3>
            <p>The base element class provides the component authoring surface.</p>
          </open-card>
          <open-card>
            <h3>DSD</h3>
            <p>Declarative Shadow DOM carries server-rendered shadow roots in HTML.</p>
          </open-card>
          <open-card>
            <h3>Islands</h3>
            <p>Hydrate only the components that need browser runtime behavior.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('guide-core-concepts-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-core-concepts-page';
