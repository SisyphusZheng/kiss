/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-brand-mark
 *
 * Geometric openElement monogram shared by header, docs surfaces, and assets.
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';

export const tagName = 'open-brand-mark';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    --mark-size: var(--size-10);
    display: inline-grid;
    width: var(--mark-size);
    height: var(--mark-size);
    flex: 0 0 auto;
    vertical-align: middle;
  }

  :host([size="sm"]) { --mark-size: var(--size-8); }
  :host([size="lg"]) { --mark-size: var(--size-12); }
  :host([size="xl"]) { --mark-size: var(--size-16); }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .mark-path {
    fill: none;
    stroke: var(--brand-deep);
    stroke-width: 7.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  :host([tone="inverted"]) .mark-path {
    stroke: var(--brand-light);
  }
`);

export class OpenBrandMark extends OpenElement {
  static override styles = [sheet];
  static override observedAttributes = ['size', 'tone'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    return (
      <svg className='mark' part='mark' viewBox='0 0 64 64' role='img' aria-hidden='true'>
        <path
          className='mark-path'
          d='M43.8 17.6A22 22 0 1 0 43.8 46.4M43.8 32H25.2'
        >
        </path>
      </svg>
    );
  }
}

export default OpenBrandMark;

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenBrandMark);
}
