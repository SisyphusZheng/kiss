/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-badge
 *
 * Compact status badge backed by Open Props semantic tokens.
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/element';

export const tagName = 'open-badge';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--size-6);
    padding: var(--badge-padding-y) var(--badge-padding-x);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--badge-radius);
    background: var(--bg-surface);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--badge-font-size);
    font-weight: var(--font-weight-8);
    line-height: var(--font-lineheight-3);
    letter-spacing: 0;
    white-space: nowrap;
  }

  .badge--brand {
    border-color: var(--brand);
    background: var(--brand-subtle);
    color: var(--brand);
  }

  .badge--success {
    border-color: var(--success);
    background: var(--success-subtle);
    color: var(--success);
  }

  .badge--warning {
    border-color: var(--warning);
    background: var(--warning-subtle);
    color: var(--warning);
  }

  .badge--info {
    border-color: var(--info);
    background: var(--info-subtle);
    color: var(--info);
  }

  .badge--sm {
    min-height: var(--size-5);
    padding-inline: var(--size-2);
  }
`);

export class OpenBadge extends OpenElement {
  static override styles = [sheet];
  static override observedAttributes = ['tone', 'size'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const tone = this._getStr('tone', 'neutral');
    const size = this._getStr('size', 'md');
    return (
      <span className={`badge badge--${tone} badge--${size}`} part='badge'>
        <slot></slot>
      </span>
    );
  }

  private _getStr(attr: string, def: string): string {
    const camel = attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    const prop = (this as Record<string, unknown>)[camel] ??
      (this as Record<string, unknown>)[attr];
    if (prop !== undefined && prop !== null) return String(prop);
    return this.getAttribute(attr) || def;
  }
}

export default OpenBadge;
