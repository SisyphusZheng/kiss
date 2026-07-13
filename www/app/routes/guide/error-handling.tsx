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
      <open-reading-shell><div class='container'>
        <h1>Error Handling</h1>
        <p class='subtitle'>Error handling should preserve platform semantics and keep route failures visible.</p>
        <div class='guide-grid'>
          <open-card>
            <h3>Route errors</h3>
            <p>Return clear status codes and response bodies from API boundaries.</p>
          </open-card>
          <open-card>
            <h3>Component errors</h3>
            <p>Keep component fallback states local and inspectable.</p>
          </open-card>
          <open-card>
            <h3>Build errors</h3>
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
