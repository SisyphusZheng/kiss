/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-badge-linear
 *
 * Linear.app-style pill badge component.
 * Read-only status label with variants for categorization.
 *
 * Variants: default, success, error, warning, info, new
 * Size: sm (optional)
 *
 * Usage:
 * ```html
 * <open-badge-linear>Entry</open-badge-linear>
 * <open-badge-linear variant="success">Active</open-badge-linear>
 * <open-badge-linear variant="new">New</open-badge-linear>
 * <open-badge-linear size="sm">Tiny</open-badge-linear>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';
import { linearTokenSheet } from './linear-token-sheet.js';

export const tagName = 'open-badge-linear';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-block;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    border-radius: var(--badge-radius);
    padding: var(--badge-padding-y) var(--badge-padding-x);
    font-size: var(--badge-font-size);
    font-weight: var(--font-weight-regular);
    line-height: 1;
    white-space: nowrap;
    box-sizing: border-box;
  }

  .badge--default {
    background: var(--badge-bg);
    color: var(--badge-color);
    border: 1px solid var(--color-border);
  }

  .badge--success {
    background: var(--color-success-subtle);
    color: var(--color-success);
  }

  .badge--error {
    background: var(--color-error-subtle);
    color: var(--color-error);
  }

  .badge--warning {
    background: var(--color-warning-subtle);
    color: var(--color-warning);
  }

  .badge--info {
    background: var(--color-info-subtle);
    color: var(--color-info);
  }

  .badge--new {
    background: var(--color-text-primary);
    color: var(--bg-canvas);
    font-size: 10px;
    font-weight: var(--font-weight-medium);
  }

  .badge--sm {
    font-size: 10px;
    padding: 1px 6px;
  }
`);

export class OpenBadgeLinear extends OpenElement {
  static override styles = [linearTokenSheet, sheet];
  static override observedAttributes = ['variant', 'size'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const v = this.getAttribute('variant') || 'default';
    const s = this.getAttribute('size') || '';
    const classes = s ? `badge badge--${v} badge--${s}` : `badge badge--${v}`;

    return (
      <span className={classes} part='badge'>
        <slot></slot>
      </span>
    );
  }

  override attributeChangedCallback(_name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    this._syncDOM();
  }

  private _syncDOM(): void {
    const el = this.shadowRoot?.querySelector('.badge') as HTMLElement | null;
    if (!el) return;
    const v = this.getAttribute('variant') || 'default';
    const s = this.getAttribute('size') || '';
    el.className = s ? `badge badge--${v} badge--${s}` : `badge badge--${v}`;
  }
}

export default OpenBadgeLinear;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenBadgeLinear);
}
