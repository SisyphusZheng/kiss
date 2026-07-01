/**
 * @openelement/ui - open-brand-mark
 *
 * openElement code-tag wordmark shared by header, docs surfaces, and assets.
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';

export const tagName = 'open-brand-mark';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    --mark-size: var(--size-10);
    display: inline-grid;
    width: calc(var(--mark-size) * 3.45);
    height: var(--mark-size);
    flex: 0 0 auto;
    place-items: center;
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

  .mark-text {
    fill: var(--brand-deep);
    font-family: var(--font-mono), ui-monospace, Menlo, monospace;
    font-size: 32px;
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
  }

  .mark-accent {
    fill: var(--brand);
  }

  :host([tone="inverted"]) .mark-text {
    fill: #fff;
  }

  :host([tone="inverted"]) .mark-accent {
    fill: var(--brand-light);
  }
`);

export class OpenBrandMark extends OpenElement {
  static override styles = [sheet];
  static override observedAttributes = ['size', 'tone', 'variant'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    return (
      <svg className='mark' part='mark' viewBox='0 0 260 72' role='img' aria-hidden='true'>
        <text className='mark-text' x='130' y='47' textAnchor='middle'>
          <tspan>&lt;</tspan>
          <tspan>open</tspan>
          <tspan className='mark-accent'>/</tspan>
          <tspan>&gt;</tspan>
        </text>
      </svg>
    );
  }
}

export default OpenBrandMark;

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenBrandMark);
}
