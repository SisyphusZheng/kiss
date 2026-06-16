/**
 * /guide/architecture is kept for E2E compatibility.
 * The canonical architecture page is at /architecture.
 */
export const meta = { section: 'Quick Start', label: 'Architecture', order: 10 };
export const tagName = 'guide-architecture';

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';
import { OPENELEMENT_VERSION } from '../../data/version.ts';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display:block; }
  .shell { max-width:900px; margin:0 auto; padding:44px var(--size-6) 72px; }
  h1 { color:var(--text-primary); font-size:clamp(2.2rem,6vw,4rem); line-height:0.95; }
  p { color:var(--text-secondary); font-size:var(--font-size-4); line-height:var(--font-lineheight-4); }
  a { color:var(--brand); font-weight:var(--font-weight-7); }
`);

export class GuideArchitecturePage extends OpenElement {
  static override styles = [linearTokenSheet, sheet];

  override render() {
    return (
      <div class='shell'>
        <h1>Architecture</h1>
        <p>
          The architecture documentation has moved to the canonical{' '}
          <a href='/architecture'>Architecture section</a>.
        </p>
        <p>
          openElement {OPENELEMENT_VERSION} is an 11-package architecture: Elements, UI,
          Framework, Protocols, plus foundation packages for core, signal, router, content, SSG,
          and the Vite bridge.
        </p>
      </div>
    );
  }
}

customElements.define('guide-architecture', GuideArchitecturePage);
export default GuideArchitecturePage;
