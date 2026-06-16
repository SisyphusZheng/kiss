/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-button-linear
 *
 * Linear.app-style button component.
 * Compact, no box-shadow, no hover lift effect.
 *
 * Variants: primary, secondary, tertiary, inverse
 * Sizes: sm, md (default), lg
 *
 * @csspart control - The button or anchor element
 *
 * Usage:
 * ```html
 * <open-button-linear>Click me</open-button-linear>
 * <open-button-linear variant="primary">Submit</open-button-linear>
 * <open-button-linear variant="secondary" size="sm">Cancel</open-button-linear>
 * <open-button-linear href="/docs">Link</open-button-linear>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';
import { linearTokenSheet } from './linear-token-sheet.js';
import { escapeAttr } from '@openelement/core';

export const tagName = 'open-button-linear';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-block;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    border-radius: var(--btn-radius, 8px);
    transition: all 150ms ease;
    box-sizing: border-box;
  }

  /* Sizes */
  .btn--sm {
    padding: 4px 12px;
    font-size: 12px;
    height: 28px;
  }

  .btn--md {
    padding: var(--btn-padding-y, 8px) var(--btn-padding-x, 14px);
    font-size: var(--btn-font-size, 14px);
    height: 36px;
  }

  .btn--lg {
    padding: 12px 24px;
    font-size: 16px;
    height: 44px;
  }

  /* Variants */
  .btn--primary {
    background: var(--color-brand);
    color: #ffffff;
    border: 1px solid var(--color-brand);
  }
  .btn--primary:hover {
    background: var(--color-brand-hover);
    border-color: var(--color-brand-hover);
  }

  .btn--secondary {
    background: var(--surface-1);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }
  .btn--secondary:hover {
    border-color: var(--color-border-hover);
    background: var(--surface-2);
  }

  .btn--tertiary {
    background: transparent;
    color: var(--color-text-primary);
    border: 1px solid transparent;
  }
  .btn--tertiary:hover {
    color: var(--color-text-primary);
    background: rgba(255, 255, 255, 0.04);
  }

  .btn--inverse {
    background: #ffffff;
    color: var(--bg-canvas);
    border: 1px solid #ffffff;
  }
  .btn--inverse:hover {
    background: #f1f3f5;
  }

  /* States */
  .btn:disabled,
  .btn[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .btn:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--color-brand-light) 50%, transparent);
    outline-offset: 2px;
  }

  :host(:state(disabled)) .btn {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`);

export class OpenButtonLinear extends OpenElement {
  static override styles = [linearTokenSheet, sheet];
  static override delegatesFocus = true;
  static override formAssociated = true;
  static override observedAttributes = ['variant', 'size', 'disabled', 'href', 'target', 'type'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const v = this.getAttribute('variant') || 'primary';
    const s = this.getAttribute('size') || 'md';
    const d = this.hasAttribute('disabled');
    const href = this.getAttribute('href') || '';
    const target = this.getAttribute('target') || '';
    const type = this.getAttribute('type') || 'button';
    const classes = `btn btn--${v} btn--${s}`;

    if (href) {
      return (
        <a
          className={classes}
          part='control'
          href={d ? '' : href}
          target={target || undefined}
          aria-disabled={d ? 'true' : undefined}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          onClick={this._handleClick}
        >
          <slot></slot>
        </a>
      );
    }

    return (
      <button
        className={classes}
        part='control'
        disabled={d}
        type={type}
        onClick={this._handleClick}
      >
        <slot></slot>
      </button>
    );
  }

  override attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    if (name === 'href') {
      this._reRender();
    } else if (name === 'disabled') {
      this._syncDOM();
      this._updateState();
    } else {
      this._syncDOM();
    }
  }

  private _syncDOM(): void {
    const el = this.shadowRoot?.querySelector('.btn') as HTMLElement | null;
    if (!el) return;
    const v = this.getAttribute('variant') || 'primary';
    const s = this.getAttribute('size') || 'md';
    el.className = `btn btn--${v} btn--${s}`;
    if (el instanceof HTMLButtonElement) {
      el.disabled = this.hasAttribute('disabled');
    }
    if (el instanceof HTMLAnchorElement && this.hasAttribute('disabled')) {
      el.setAttribute('aria-disabled', 'true');
    }
  }

  private _reRender(): void {
    this.update();
  }

  private _updateState(): void {
    if (!this._internals?.states) return;
    if (this.hasAttribute('disabled')) {
      this._internals.states.delete('enabled');
      this._internals.states.add('disabled');
    } else {
      this._internals.states.delete('disabled');
      this._internals.states.add('enabled');
    }
  }

  private _handleClick(_e: Event): void {
    this.dispatchEvent(new CustomEvent('open-click', { bubbles: true, composed: true }));
  }

  private _escAttr = escapeAttr;
}

export default OpenButtonLinear;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenButtonLinear);
}
