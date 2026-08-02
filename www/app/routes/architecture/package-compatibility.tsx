export const meta = { section: 'Reference', label: 'Package Compatibility', order: 90 };

import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    h1 .title-accent { display: block; font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: calc(1em * 1.12); line-height: .95; letter-spacing: -.02em; color: var(--violet-8); }

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
      <open-reading-shell rail>
        <open-page-rail
          slot='rail'
          items='[{"id":"current-contract","label":"Current contract","level":3},{"id":"explicit-admission","label":"Explicit admission","level":3},{"id":"roadmap-diagnostics","label":"Roadmap diagnostics","level":3}]'
        >
        </open-page-rail>
        <div class='container'>
          <h1 id='start'>
            Package<span class='title-accent'>Compatibility</span>
          </h1>
          <p class='subtitle'>
            OpenElement treats third-party Custom Elements as standards-based dependencies. Current
            builds use explicit package-island configuration and available Custom Elements Manifest
            metadata for SSR admission.
          </p>

          <open-artifact-panel>
            <span slot='label'>capability matrix</span>
            <span slot='meta'>current / admitted / planned</span>
            <div class='compat-grid'>
              <open-card variant='artifact'>
                <h3 id='current-contract'>Current contract</h3>
                <p>
                  @openelement/element owns authoring; app and adapter-vite keep application and
                  build behavior separate.
                </p>
              </open-card>
              <open-card>
                <h3 id='explicit-admission'>Explicit admission</h3>
                <p>
                  Known packages can be configured as package islands and use available CEM metadata
                  without importing retired package surfaces.
                </p>
              </open-card>
              <open-card>
                <h3 id='roadmap-diagnostics'>Roadmap diagnostics</h3>
                <p>
                  Universal DSD/light/client-only classification and hydration-mismatch diagnostics
                  are `0.43` roadmap work, not a current market claim.
                </p>
              </open-card>
            </div>
          </open-artifact-panel>
        </div>
      </open-reading-shell>
    );
  }
}

defineCustomElement('package-compatibility-page', PackageCompatibilityPage);
export default PackageCompatibilityPage;
export const tagName = 'package-compatibility-page';
