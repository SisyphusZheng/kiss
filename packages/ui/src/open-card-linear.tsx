/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-card-linear
 *
 * Linear.app-style card component with edge highlight, macOS-style
 * code panel variant, and featured variant for pricing tiers.
 *
 * v0.40.7: Initial implementation.
 *
 * @csspart container - The article wrapper
 * @csspart body - The body content area
 *
 * Usage:
 * ```html
 * <!-- Standard card -->
 * <open-card-linear>
 *   <h3 slot="header">Title</h3>
 *   <p>Card content goes here.</p>
 * </open-card-linear>
 *
 * <!-- Featured card (pricing tier) -->
 * <open-card-linear variant="featured">
 *   <p>Featured content with stronger border.</p>
 * </open-card-linear>
 *
 * <!-- Code panel (macOS-style terminal) -->
 * <open-card-linear variant="code-panel" title="example.ts">
 *   <pre>const x = 1;</pre>
 * </open-card-linear>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';
import { escapeHtml } from '@openelement/core';
import { linearTokenSheet } from './linear-token-sheet.js';
export const tagName = 'open-card-linear';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
    position: relative;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    padding: var(--card-padding);
    transition: border-color 0.15s ease;
  }

  :host(:hover) {
    border-color: var(--color-border-hover);
    background: var(--surface-3);
  }

  /* Edge highlight — Linear-style 1px white line at top */
  :host::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: var(--card-edge-highlight);
    border-radius: var(--card-radius) var(--card-radius) 0 0;
    pointer-events: none;
  }

  /* Featured variant */
  :host([variant="featured"]) {
    background: var(--surface-3);
    border-color: var(--color-border-strong);
  }

  /* Code-panel variant — no host padding, header/body handle it */
  :host([variant="code-panel"]) {
    padding: 0;
  }

  /* Header slot */
  ::slotted([slot="header"]) {
    padding: var(--space-xs) var(--space-md);
    border-bottom: 1px solid var(--card-border);
    font-family: var(--font-sans);
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    margin: 0;
  }

  /* Footer slot */
  ::slotted([slot="footer"]) {
    padding: var(--space-xs) var(--space-md);
    border-top: 1px solid var(--card-border);
    font-family: var(--font-sans);
    font-size: var(--font-size-body-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  /* Code-panel header bar */
  .card-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    background: var(--surface-1);
    padding: var(--space-xs) var(--space-md);
    border-bottom: 1px solid var(--color-border);
  }

  /* macOS-style traffic light dots */
  .card-dots {
    display: flex;
    gap: 8px;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }

  .dot-red { background: #ff5f57; }
  .dot-yellow { background: #febc2e; }
  .dot-green { background: #28c840; }

  /* Code-panel title (filename) */
  .card-title {
    font-family: var(--font-mono);
    font-size: var(--font-size-caption);
    color: var(--color-text-muted);
    line-height: 1;
  }

  /* Code-panel body */
  :host([variant="code-panel"]) .card-body {
    background: var(--card-bg);
    padding: var(--space-md);
    font-family: var(--font-mono);
    font-size: var(--font-size-mono);
    color: var(--color-text-secondary);
  }
`);

export class OpenCardLinear extends OpenElement {
  static override styles = [linearTokenSheet, sheet];
  static override observedAttributes = ['variant', 'title'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const variant = this.getAttribute('variant') || 'standard';

    if (variant === 'code-panel') {
      return this._renderCodePanel();
    }

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

  private _renderCodePanel(): ReturnType<typeof OpenElement.prototype.render> {
    const title = this.getAttribute('title') || '';
    return (
      <article part='container'>
        <div className='card-header'>
          <div className='card-dots'>
            <span className='dot dot-red'></span>
            <span className='dot dot-yellow'></span>
            <span className='dot dot-green'></span>
          </div>
          {title && <span className='card-title'>{escapeHtml(title)}</span>}
        </div>
        <div className='card-body' part='body'>
          <slot></slot>
        </div>
      </article>
    );
  }

  override attributeChangedCallback(_name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    this.update();
  }
}

export default OpenCardLinear;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenCardLinear);
}
