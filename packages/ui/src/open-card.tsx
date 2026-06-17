/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-card
 *
 * Minimal card container with optional header and footer.
 * Swiss International Style: borders are whispers, not shouts.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * @csspart container - The article wrapper
 * @csspart body - The card body content area
 *
 * Usage:
 * ```html
 * <open-card>
 *   <h3 slot="header">Card Title</h3>
 *   <p>Card content goes here.</p>
 * </open-card>
 *
 * <open-card variant="elevated">
 *   <p>Elevated card with shadow.</p>
 * </open-card>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from './open-props-tokens.js';
export const tagName = 'open-card';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
    background: var(--bg-card);
    color: var(--text-primary);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    overflow: hidden;
    transition: box-shadow var(--ease-3) var(--duration-2), transform var(--ease-3) var(--duration-2);
  }

  :host([variant="elevated"]) {
    box-shadow: var(--shadow-1);
    border-color: transparent;
  }

  :host([variant="elevated"]:hover) {
    box-shadow: var(--shadow-2);
    transform: translateY(-2px);
  }

  :host([variant="borderless"]) {
    border-color: transparent;
  }

  :host([variant="muted"]) {
    background: var(--bg-surface);
  }

  :host([variant="artifact"]) {
    background: var(--bg-code, var(--gray-11));
    color: var(--gray-2);
    border-color: var(--code-border, var(--gray-8));
  }

  ::slotted([slot="header"]) {
    padding: var(--size-4) var(--size-5);
    border-bottom: var(--border-size-1) solid var(--border);
    font-size: var(--font-size-2);
    font-weight: var(--font-weight-6);
    color: var(--text-primary);
    margin: 0;
  }

  .card-body {
    padding: var(--size-5);
  }

  ::slotted([slot="footer"]) {
    padding: var(--size-3) var(--size-5);
    border-top: var(--border-size-1) solid var(--border);
    font-size: var(--font-size-0);
    color: var(--text-muted);
    margin: 0;
  }
`);

export class OpenCard extends OpenElement {
  static override styles = [openPropsTokenSheet, sheet];
  static override observedAttributes = ['variant'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    return (
      <article part='container'>
        <slot name='header'></slot>
        <div className='card-body' part='body'>
          <slot></slot>
        </div>
        <slot name='footer'></slot>
      </article>
    );
  }
}

export default OpenCard;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenCard);
}
