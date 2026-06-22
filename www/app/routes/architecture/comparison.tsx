/**
 * @openelement/docs - Comparison: openElement vs Alternatives
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';

export const tagName = 'comparison-page';
export const meta = { section: 'Principles', label: 'Comparison', order: 20 };

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    open-card {
      min-height: 100%;
    }

    .label {
      color: var(--brand);
      font-family: var(--font-mono);
      font-size: var(--font-size-0);
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    h3 {
      margin: var(--size-2) 0 var(--size-3);
      font-size: var(--font-size-3);
    }

    p,
    li {
      color: var(--text-secondary);
      line-height: var(--font-lineheight-4);
    }

    ul {
      padding-left: var(--size-4);
    }

    @media (max-width: 860px) {
      .comparison-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

export default class ComparisonPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    return (
      <div class='container'>
        <h1>openElement vs Alternatives</h1>
        <p class='subtitle'>
          A conservative comparison of product direction. This page describes
          what openElement optimizes for; it does not invent benchmark claims.
        </p>

        <div class='comparison-grid'>
          <open-card variant='artifact'>
            <span class='label'>openElement</span>
            <h3>Web Components first</h3>
            <p>
              The framework centers Custom Elements, Declarative Shadow DOM,
              route metadata, and package protocols as first-class contracts.
            </p>
          </open-card>
          <open-card>
            <span class='label'>Astro / Fresh</span>
            <h3>Island-oriented sites</h3>
            <p>
              These ecosystems are useful references for island architecture,
              but openElement keeps the public component contract on standards.
            </p>
          </open-card>
          <open-card>
            <span class='label'>Next.js / React</span>
            <h3>Application framework</h3>
            <p>
              React frameworks optimize around a React runtime and app model.
              openElement optimizes around authored elements and browser-native
              rendering boundaries.
            </p>
          </open-card>
        </div>

        <h2>Decision criteria</h2>
        <ul>
          <li>
            Choose openElement when Web Components are the public integration
            surface.
          </li>
          <li>
            Choose openElement when SSR output should preserve browser-native
            component boundaries.
          </li>
          <li>
            Choose another framework when your product is intentionally locked
            to a React, Preact, or Vue component runtime.
          </li>
        </ul>
      </div>
    );
  }
}

customElements.define(tagName, ComparisonPage);
