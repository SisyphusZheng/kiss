export const meta = { section: 'Reference', label: 'Package Compatibility', order: 90 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
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
          Basic Element is the default authoring layer, while third-party Web
          Components use explicit package or Custom Elements Manifest metadata
          for supported interop.
        </p>

        <div class='compat-grid'>
          <open-card variant='artifact'>
            <h3>Basic Element</h3>
            <p>@openelement/element provides OpenElement, StyleSheet, DSD, signals, and islands.</p>
          </open-card>
          <open-card>
            <h3>Third-party WC</h3>
            <p>External custom elements are supported through manifest or CEM metadata.</p>
          </open-card>
          <open-card>
            <h3>Diagnostics</h3>
            <p>Unknown SSR capability becomes explicit client-only interop or a rejected admission.</p>
          </open-card>
        </div>
      </div>
    );
  }
}

customElements.define('package-compatibility-page', PackageCompatibilityPage);
export default PackageCompatibilityPage;
export const tagName = 'package-compatibility-page';
