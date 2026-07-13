export const meta = { section: 'Principles', label: 'DSD Rendering', order: 30 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    open-card[variant="artifact"] {
      border-left: 3px solid var(--brand);
    }

    @media (max-width: 760px) {
      .comparison {
        grid-template-columns: 1fr;
      }
    }
  `,
);

export class DsdGuidePage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    return (
      <open-reading-shell><div class='container'>
        <h1>Declarative Shadow DOM Rendering</h1>
        <p class='subtitle'>
          openElement treats Declarative Shadow DOM as the server-rendered
          boundary for Web Components, then upgrades only the behavior that must
          run in the browser.
        </p>

        <h2>The platform contract</h2>
        <p>
          Declarative Shadow DOM uses a template with
          {' '}<code>shadowrootmode</code>{' '}so HTML can carry shadow-root
          content before client JavaScript loads.
        </p>
        <open-code-block>
          <pre><code>{`<my-card>
  <template shadowrootmode="open">
    <style>:host { display: block; }</style>
    <p>Visible before client JavaScript.</p>
  </template>
</my-card>`}</code></pre>
        </open-code-block>

        <div class='comparison'>
          <open-card>
            <h3>Traditional hydration</h3>
            <p>
              A client runtime often reconstructs the component tree before the
              page is fully interactive.
            </p>
          </open-card>
          <open-card variant='artifact'>
            <h3>DSD-first rendering</h3>
            <p>
              The browser parses shadow roots from HTML. Custom Elements then
              upgrade existing hosts and attach only the needed behavior.
            </p>
          </open-card>
        </div>

        <h2>openElement layers</h2>
        <ul>
          <li>Static DSD components for content, layout, and documentation.</li>
          <li>Interactive elements for local browser behavior.</li>
          <li>Islands for client components that need framework runtimes.</li>
        </ul>
      </div></open-reading-shell>
    );
  }
}

customElements.define('dsd-guide-page', DsdGuidePage);
export default DsdGuidePage;
export const tagName = 'dsd-guide-page';
