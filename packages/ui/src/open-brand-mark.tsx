/**
 * @openelement/ui - open-brand-mark
 *
 * Geometric openElement monogram shared by header, docs surfaces, and assets.
 * Variants: "circle" (Aperture O+E, default) and "brackets" (</> favicon).
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
  :host([size="md"]) { --mark-size: var(--size-10); }
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
    stroke-width: 14;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  :host([tone="inverted"]) .mark-path {
    stroke: var(--brand-light);
  }
`);

/* Aperture O+E: circle with gap + e-back curve + crossbar */
const CIRCLE_PATH =
  'M 100.4 85 A 42 42 0 1 1 100.4 43 M 64 44 A 20 20 0 0 0 64 84 M 44 64 L 100.4 64';

/* </>: three separated code-bracket segments, same R=10 radius */
const BRACKETS_PATH =
  'M 60 36 A 40 40 0 0 0 16 64 A 40 40 0 0 1 60 92 M 52 100 L 76 28 M 68 36 A 40 40 0 0 0 112 64 A 40 40 0 0 1 68 92';

export class OpenBrandMark extends OpenElement {
  static override styles = [sheet];
  static override observedAttributes = ['size', 'tone', 'variant'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const variant = this.getAttribute('variant') ?? 'circle';
    const d = variant === 'brackets' ? BRACKETS_PATH : CIRCLE_PATH;

    return (
      <svg className='mark' part='mark' viewBox='0 0 128 128' role='img' aria-hidden='true'>
        <path className='mark-path' d={d} />
      </svg>
    );
  }
}

export default OpenBrandMark;

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenBrandMark);
}
