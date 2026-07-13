/**
 * @openelement/ui - open-brand-mark
 *
 * openElement code-tag wordmark shared by header, docs surfaces, and assets.
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/element';

export const tagName = 'open-brand-mark';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    --mark-size: var(--size-10);
    display: inline-grid;
    width: var(--mark-size);
    height: var(--mark-size);
    flex: 0 0 auto;
    place-items: center;
    vertical-align: middle;
  }

  :host([size="sm"]) { --mark-size: var(--size-8); }
  :host([size="md"]) { --mark-size: var(--size-10); }
  :host([size="lg"]) { --mark-size: var(--size-12); }
  :host([size="xl"]) { --mark-size: var(--size-16); }

  img {
    display: block;
    width: 100%;
    height: 100%;
  }

  :host { view-transition-name: open-brand-mark; }
`);

export class OpenBrandMark extends OpenElement {
  static override styles = [sheet];
  static override observedAttributes = ['size', 'tone', 'variant'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    return <img className='mark' part='mark' src='/assets/open-favicon.svg' alt='' />;
  }
}

export default OpenBrandMark;
