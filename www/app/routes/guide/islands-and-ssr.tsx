export const meta = { section: 'Guide', label: 'Islands and SSR', order: 90 };

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
        <h1>Islands and SSR</h1>
        <p class='subtitle'>SSR and DSD provide the document baseline. Islands add client behavior at declared boundaries.</p>
        <div class='guide-grid'>
          <open-card>
            <h3>Server first</h3>
            <p>Render useful HTML before client modules run.</p>
          </open-card>
          <open-card>
            <h3>Declared islands</h3>
            <p>Hydration should be visible from route metadata.</p>
          </open-card>
          <open-card>
            <h3>Small runtime</h3>
            <p>Keep browser JavaScript scoped to interactive surfaces.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('guide-islands-and-ssr-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-islands-and-ssr-page';
