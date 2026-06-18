/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-button
 *
 * Minimal button component following Swiss International Style.
 * Pure B&W design with subtle hover states.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * Variants: default (outlined), primary (filled), ghost (no border), accent (gradient)
 * Sizes: sm, md (default), lg
 *
 * @csspart control -The button or anchor element
 *
 * Usage:
 * ```html
 * <open-button>Click me</open-button>
 * <open-button variant="primary">Submit</open-button>
 * <open-button size="sm" disabled>Small</open-button>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from './open-props-tokens.js';
import { escapeAttr } from '@openelement/core';

export const tagName = 'open-button';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-block;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--size-2);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-8);
    text-decoration: none;
    cursor: pointer;
    border: var(--border-size-1) solid var(--border);
    background: transparent;
    color: var(--text-primary);
    border-radius: var(--btn-radius);
    transition: color var(--ease-3) var(--duration-2), border-color var(--ease-3) var(--duration-2), background var(--ease-3) var(--duration-2), transform var(--ease-3) var(--duration-2);
    white-space: nowrap;
    letter-spacing: 0;
  }

  /* Sizes */
  .btn--sm {
    padding: var(--size-1) var(--size-3);
    font-size: var(--font-size-0);
    height: 28px;
  }

  .btn--md {
    padding: var(--size-2) var(--size-4);
    font-size: var(--font-size-1);
    height: 36px;
  }

  .btn--lg {
    padding: var(--size-3) var(--size-5);
    font-size: var(--font-size-2);
    height: 44px;
  }

  /* Variants */
  .btn--default:hover {
    color: var(--on-brand);
    border-color: var(--brand);
    background: var(--brand);
  }

  .btn--primary {
    background: var(--brand, var(--indigo-6));
    color: var(--on-brand);
    border-color: var(--brand, var(--indigo-6));
  }

  .btn--primary:hover {
    background: var(--brand-hover, var(--indigo-7));
    border-color: var(--brand-hover, var(--indigo-7));
    transform: translateX(var(--size-1));
  }

  .btn--ghost {
    border-color: transparent;
  }

  .btn--ghost:hover {
    background: var(--brand-subtle);
    border-color: transparent;
  }

  .btn--accent {
    background: var(--brand);
    color: var(--on-brand);
    border-color: transparent;
  }
  .btn--accent:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }
  .btn--accent:active {
    transform: translateY(0);
    box-shadow: var(--shadow-1);
  }

  /* States */
  .btn:disabled,
  .btn[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .btn:focus-visible {
    outline: 2px solid var(--brand, var(--indigo-6));
    outline-offset: 2px;
  }

  :host(:state(disabled)) .btn {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`);

export class OpenButton extends OpenElement {
  static override styles = [openPropsTokenSheet, sheet];
  static override delegatesFocus = true;
  static override formAssociated = true;
  static override observedAttributes = ['variant', 'size', 'disabled', 'href', 'target', 'type'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const v = this.getAttribute('variant') || 'default';
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
    // href change may switch element type (a vs button) -full re-render
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
    const v = this.getAttribute('variant') || 'default';
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
    // NOTE: We do NOT capture assignedNodes before innerHTML replacement.
    // Light DOM children remain in the host element and automatically
    // re-project to the new <slot> - no manual DOM manipulation needed.
    // The previous approach (replaceChildren) incorrectly moved light DOM
    // children into the shadow root, breaking slot projection.
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

export default OpenButton;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenButton);
}
