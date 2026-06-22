/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-brand-mark
 *
 * Flat Aperture O brand mark shared by header, docs surfaces, and assets.
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

  .mark {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--radius-round);
    background:
      radial-gradient(circle at 50% 50%, var(--brand-mark-field, var(--bg-base)) 0 38%, transparent 39%),
      conic-gradient(
        from 218deg,
        var(--brand-deep) 0 24%,
        var(--brand) 24% 61%,
        var(--brand-light) 61% 82%,
        var(--brand-deep) 82% 100%
      );
  }

  :host([tone="inverted"]) .mark {
    --brand-mark-field: var(--gray-12);
  }

  .mark::before {
    content: "";
    position: absolute;
    inset: 27%;
    border: var(--border-size-1) solid color-mix(in srgb, var(--brand-light) 58%, var(--brand-mark-field, var(--bg-base)));
    border-radius: var(--radius-round);
    transform: rotate(-13deg);
  }

  .mark::after {
    content: "";
    position: absolute;
    inset-inline-end: -2%;
    inset-block-start: 7%;
    width: 35%;
    height: 44%;
    border-radius: var(--radius-round) var(--radius-round) 0 0;
    background: var(--brand-mark-field, var(--bg-base));
    transform: rotate(24deg);
  }

  .boundary,
  .route {
    position: absolute;
    inset-inline: 28% 22%;
    height: var(--border-size-1);
    border-radius: var(--radius-round);
    background: var(--brand-deep);
    z-index: 1;
  }

  .boundary { inset-block-start: 46%; }
  .route {
    inset-block-start: 57%;
    background: var(--brand);
  }

  :host([size="sm"]) .boundary,
  :host([size="sm"]) .route {
    inset-inline: 30% 24%;
  }
`);

export class OpenBrandMark extends OpenElement {
  static override styles = [sheet];
  static override observedAttributes = ['size', 'tone'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    return (
      <span className='mark' part='mark' aria-hidden='true'>
        <span className='boundary'></span>
        <span className='route'></span>
      </span>
    );
  }
}

export default OpenBrandMark;

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenBrandMark);
}
