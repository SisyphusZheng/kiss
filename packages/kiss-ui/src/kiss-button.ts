/**
 * @kissjs/ui - kiss-button
 *
 * Minimal button component following Swiss International Style.
 * Pure B&W design with subtle hover states.
 *
 * Variants:
 * - default: outlined button
 * - primary: filled button (black/white)
 * - ghost: no border, subtle hover
 *
 * Sizes:
 * - sm: compact button
 * - md: default size
 * - lg: prominent button
 *
 * Usage:
 * ```html
 * <kiss-button>Click me</kiss-button>
 * <kiss-button variant="primary">Submit</kiss-button>
 * <kiss-button size="sm" disabled>Small</kiss-button>
 * ```
 */

import { css, type CSSResult, html, LitElement, nothing, type TemplateResult } from '@kissjs/core';
import { kissDesignTokens } from './design-tokens.js';

export const tagName = 'kiss-button';

export class KissButton extends LitElement {
  static override styles: CSSResult[] = [
    kissDesignTokens,
    css`
      :host {
        display: inline-block;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--kiss-size-2);
        font-family: var(--kiss-font-sans);
        font-weight: var(--kiss-font-weight-medium);
        text-decoration: none;
        cursor: pointer;
        border: 1px solid var(--kiss-border);
        background: transparent;
        color: var(--kiss-text-primary);
        border-radius: var(--kiss-radius-md);
        transition:
          color var(--kiss-transition-normal),
          border-color var(--kiss-transition-normal),
          background var(--kiss-transition-normal);
        white-space: nowrap;
        letter-spacing: var(--kiss-letter-spacing-wide);
      }

      /* Sizes */
      .btn--sm {
        padding: var(--kiss-size-1) var(--kiss-size-3);
        font-size: var(--kiss-font-size-sm);
        height: 28px;
      }

      .btn--md {
        padding: var(--kiss-size-2) var(--kiss-size-4);
        font-size: var(--kiss-font-size-md);
        height: 36px;
      }

      .btn--lg {
        padding: var(--kiss-size-3) var(--kiss-size-5);
        font-size: var(--kiss-font-size-lg);
        height: 44px;
      }

      /* Variants */
      .btn--default:hover {
        color: var(--kiss-text-primary);
        border-color: var(--kiss-border-hover);
        background: var(--kiss-accent-subtle);
      }

      .btn--primary {
        background: var(--kiss-accent);
        color: var(--kiss-bg-base);
        border-color: var(--kiss-accent);
      }

      .btn--primary:hover {
        background: var(--kiss-accent-dim);
        border-color: var(--kiss-accent-dim);
      }

      .btn--ghost {
        border-color: transparent;
      }

      .btn--ghost:hover {
        background: var(--kiss-accent-subtle);
        border-color: transparent;
      }

      /* States */
      .btn:disabled,
      .btn[aria-disabled="true"] {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }

      .btn:focus-visible {
        outline: 2px solid var(--kiss-accent);
        outline-offset: 2px;
      }
    `,
  ];

  static override properties = {
    variant: { type: String },
    size: { type: String },
    disabled: { type: Boolean, reflect: true },
    href: { type: String },
    target: { type: String },
    type: { type: String },
  };

  /** Button variant style: 'default' (outlined), 'primary' (filled), or 'ghost' (no border) */
  variant: 'default' | 'primary' | 'ghost' = 'default';
  /** Button size: 'sm', 'md' (default), or 'lg' */
  size: 'sm' | 'md' | 'lg' = 'md';
  /** Whether the button is disabled */
  disabled = false;
  /** If set, renders as an anchor link instead of a button */
  href?: string;
  /** Target attribute for link mode (e.g. '_blank') */
  target?: string;
  /** Button type: 'submit', 'button', or 'reset' (default: 'button'). Only applies in button mode (no href). */
  type: 'submit' | 'button' | 'reset' = 'button';

  /** Prevent default on disabled anchor clicks */
  private _preventClick(e: Event) {
    e.preventDefault();
  }

  override render(): TemplateResult {
    const classes = `btn btn--${this.variant} btn--${this.size}`;

    if (this.href) {
      // disabled anchor: remove href and use aria-disabled (disabled is not valid on <a>)
      const hrefAttr = this.disabled ? undefined : this.href;
      return html`
        <a
          class="${classes}"
          href="${hrefAttr ?? nothing}"
          target="${this.target || nothing}"
          aria-disabled="${this.disabled || nothing}"
          rel="${this.target === '_blank' ? 'noopener noreferrer' : nothing}"
          @click="${this.disabled ? this._preventClick : nothing}"
        >
          <slot></slot>
        </a>
      `;
    }

    return html`
      <button class="${classes}" ?disabled="${this.disabled}" type="${this.type}">
        <slot></slot>
      </button>
    `;
  }
}

customElements.define(tagName, KissButton);
