export const meta = { section: 'Reference', label: 'Package Compatibility', order: 90 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    .compat-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .compat-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

export class PackageCompatibilityPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    return (
      <div class='container'>
        <h1>Package Compatibility</h1>
        <p class='subtitle'>
          The package graph is intentionally layered: runtime packages stay
          small, adapters remain optional, and docs examples use public package
          entry points.
        </p>

        <div class='compat-grid'>
          <open-card variant='artifact'>
            <h3>Runtime</h3>
            <p>@openelement/core and @openelement/element define the base layer.</p>
          </open-card>
          <open-card>
            <h3>Application</h3>
            <p>@openelement/app coordinates routes, metadata, and islands.</p>
          </open-card>
          <open-card>
            <h3>Adapters</h3>
            <p>Build and framework adapters sit outside the core runtime.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('package-compatibility-page', PackageCompatibilityPage);
export default PackageCompatibilityPage;
export const tagName = 'package-compatibility-page';
