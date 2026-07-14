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

  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--text-primary, currentColor);
    font-family: var(--font-mono, "JetBrains Mono", monospace);
    font-size: calc(var(--mark-size) * .25);
    font-weight: 800;
    letter-spacing: -.09em;
    line-height: 1;
    white-space: nowrap;
  }

  .slash {
    color: var(--violet-8, #8b5cf6);
  }

  :host { view-transition-name: open-brand-mark; }
`);

export class OpenBrandMark extends OpenElement {
  static override styles = [sheet];
  static override observedAttributes = ['size', 'tone', 'variant'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    return (
      <span className='mark' part='mark' aria-hidden='true'>
        &lt;open<span className='slash'>/</span>&gt;
      </span>
    );
  }
}

export default OpenBrandMark;
