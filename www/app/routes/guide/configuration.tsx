export const meta = { section: 'Guide', label: 'Configuration', order: 70 };

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
        <h1>Configuration</h1>
        <p class='subtitle'>Configuration should stay close to the route, build, or package surface it affects.</p>
        <div class='guide-grid'>
          <open-card>
            <h3>Route config</h3>
            <p>Declare route-facing behavior where the route can be audited.</p>
          </open-card>
          <open-card>
            <h3>Build config</h3>
            <p>Keep Vite and SSG settings explicit in project tasks.</p>
          </open-card>
          <open-card>
            <h3>Package config</h3>
            <p>Use package manifests for publish and dependency boundaries.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('guide-configuration-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-configuration-page';
