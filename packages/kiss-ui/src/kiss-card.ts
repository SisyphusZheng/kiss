/**
 * @kissjs/ui - kiss-card
 *
 * Minimal card container with optional header and footer.
 * Swiss International Style: borders are whispers, not shouts.
 *
 * Usage:
 * ```html
 * <kiss-card>
 *   <h3 slot="header">Card Title</h3>
 *   <p>Card content goes here.</p>
 * </kiss-card>
 *
 * <kiss-card variant="elevated">
 *   <p>Elevated card with shadow.</p>
 * </kiss-card>
 * ```
 */

import { css, type CSSResult, html, LitElement, type TemplateResult } from '@kissjs/core';
import { kissDesignTokens } from './design-tokens.js';

export const tagName = 'kiss-card';

export class KissCard extends LitElement {
  static override styles: CSSResult[] = [
    kissDesignTokens,
    css`
      :host {
        display: block;
      }

      .card {
        background: var(--kiss-bg-card);
        border: 1px solid var(--kiss-border);
        border-radius: var(--kiss-radius-lg);
        overflow: hidden;
      }

      .card--elevated {
        box-shadow: var(--kiss-shadow-md);
        border-color: transparent;
      }

      .card--borderless {
        border-color: transparent;
      }

      ::slotted([slot="header"]) {
        padding: var(--kiss-size-4) var(--kiss-size-5);
        border-bottom: 1px solid var(--kiss-border);
        font-size: var(--kiss-font-size-lg);
        font-weight: var(--kiss-font-weight-semibold);
        color: var(--kiss-text-primary);
        margin: 0;
      }

      .card-body {
        padding: var(--kiss-size-5);
      }

      ::slotted([slot="footer"]) {
        padding: var(--kiss-size-3) var(--kiss-size-5);
        border-top: 1px solid var(--kiss-border);
        font-size: var(--kiss-font-size-sm);
        color: var(--kiss-text-muted);
        margin: 0;
      }
    `,
  ];

  static override properties = {
    variant: { type: String },
  };

  /** Card variant: 'default' (bordered), 'elevated' (shadow, no border), or 'borderless' */
  variant: 'default' | 'elevated' | 'borderless' = 'default';

  override render(): TemplateResult {
    return html`
      <div class="card card--${this.variant}">
        <slot name="header"></slot>
        <div class="card-body">
          <slot></slot>
        </div>
        <slot name="footer"></slot>
      </div>
    `;
  }
}

customElements.define(tagName, KissCard);
