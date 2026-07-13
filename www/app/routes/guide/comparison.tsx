export const meta = { section: 'Guide', label: 'Comparison', order: 25 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    .guide-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .guide-grid {
        grid-template-columns: 1fr;
      }
    }

    .when-to-choose {
      margin-top: var(--size-8);
    }
  `,
);

export class GuideComparisonPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    return (
      <open-reading-shell rail footer previous='/guide/architecture' next='/guide/routing-and-data'><open-page-rail slot='rail'><a href='#start'>Overview</a></open-page-rail><div class='container'>
        <h1>How openElement compares</h1>
        <p class='subtitle'>
          openElement occupies a specific niche: a Web Components-native
          fullstack framework with a JSX-first authoring layer. Other tools are
          adjacent or solve a different slice of the problem.
        </p>
        <div class='guide-grid'>
          <open-card>
            <h3>Lit</h3>
            <p>
              A Web Components authoring library. Use Lit when you need
              standalone components; use openElement when you need a fullstack
              app lifecycle around those components.
            </p>
          </open-card>
          <open-card>
            <h3>Stencil</h3>
            <p>
              A compiler and design-system production tool. Use Stencil to ship
              a component library; use openElement to build the application that
              consumes it.
            </p>
          </open-card>
          <open-card>
            <h3>Enhance</h3>
            <p>
              The closest fullstack Web Components peer, but HTML-first. Choose
              Enhance if you prefer HTML templates; choose openElement if you
              prefer JSX and islands-driven hydration.
            </p>
          </open-card>
          <open-card>
            <h3>Astro / Fresh</h3>
            <p>
              Adjacent app frameworks. Astro is content-first and treats Web
              Components as one integration; Fresh is Preact-first. Choose
              openElement when Web Components are the primary app primitive.
            </p>
          </open-card>
        </div>
        <div class='when-to-choose'>
          <h2>When to choose openElement</h2>
          <ul>
            <li>
              You want DSD-native SSR out of the box, not an opt-in rendering
              mode.
            </li>
            <li>
              You want JSX authoring that compiles to standards-based Custom
              Elements.
            </li>
            <li>
              You need file-based routing, API routes, and islands in the same
              framework.
            </li>
            <li>
              You are targeting Deno Desktop or edge runtimes with the same
              component model.
            </li>
          </ul>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-comparison-page', GuideComparisonPage);
export default GuideComparisonPage;
export const tagName = 'guide-comparison-page';
