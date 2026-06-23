export const meta = { section: 'Guide', label: 'MDX', order: 50 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
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
      <div class='container'>
        <h1>MDX</h1>
        <p class='subtitle'>Documentation content should compile into the same route and component system as authored pages.</p>
        <div class='guide-grid'>
          <open-card>
            <h3>Content source</h3>
            <p>Keep source content reviewable in the repository.</p>
          </open-card>
          <open-card>
            <h3>Components</h3>
            <p>Use shared UI primitives for examples and callouts.</p>
          </open-card>
          <open-card>
            <h3>Build path</h3>
            <p>Validate generated pages through the normal site build.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('guide-mdx-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-mdx-page';
