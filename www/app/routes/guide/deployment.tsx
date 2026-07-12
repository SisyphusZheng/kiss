export const meta = { section: 'Guide', label: 'Deployment', order: 100 };

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
      <div class='container'>
        <h1>Deployment</h1>
        <p class='subtitle'>Deployment is built around generated static output and adapter-specific runtime boundaries.</p>
        <div class='guide-grid'>
          <open-card>
            <h3>Static output</h3>
            <p>The docs site is generated through the SSG pipeline.</p>
          </open-card>
          <open-card>
            <h3>Adapters</h3>
            <p>Runtime adapters remain separate from the core packages.</p>
          </open-card>
          <open-card>
            <h3>Verification</h3>
            <p>Build output should be checked before publishing or pushing release changes.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('guide-deployment-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-deployment-page';
