export const meta = { section: 'Guide', label: 'Getting Started', order: 1 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { OPENELEMENT_VERSION } from '../../data/version.ts';
import { pageStyles } from '../../components/page-styles.js';
import { defineReadingContract, serializeOutline } from '@openelement/site-ui/page-contract.ts';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
const reading = defineReadingContract({ breadcrumb: 'Guide', title: 'Getting Started', outline: [{ id: 'install', label: 'Install', level: 3 }, { id: 'explore', label: 'Explore', level: 3 }, { id: 'build', label: 'Build', level: 3 }], next: { href: '/guide/core-concepts', label: 'Core Concepts' } });
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
      <open-reading-shell rail footer metadata={JSON.stringify({ breadcrumb: reading.breadcrumb, title: reading.title, lede: 'OpenElement is a Web Components-native, static-first application framework. Start with standard Custom Elements, pages, routes, selective upgrades and deployable Vite/Nitro output.' })} next={reading.next?.href} next-label={reading.next?.label}><open-page-rail slot='rail' items={serializeOutline(reading.outline)}></open-page-rail><div class='container'>
        <p class='subtitle'>
          The current published package line is {OPENELEMENT_VERSION}. The
          five-package convergence is published in alpha.9; external adopter
          pilot #390 remains the primary stability evidence still open.
        </p>
        <div class='guide-grid'>
          <open-card>
            <h3 id='install'>Install</h3>
            <p>Use the npm-first create surface and Deno tasks for local development.</p>
          </open-card>
          <open-card>
            <h3 id='explore'>Explore</h3>
            <p>Read the docs, API reference, and roadmap as the current product map.</p>
          </open-card>
          <open-card>
            <h3 id='build'>Build</h3>
            <p>Run build, package, docs truth, and visual smoke gates before release.</p>
          </open-card>
        </div>
      </div></open-reading-shell>
    );
  }
}

customElements.define('guide-getting-started-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-getting-started-page';
