/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - OpenStepCard Component
 *
 * Step card with numbered indicator and label.
 * Used in Quick Start sections and Getting Started guides.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * @csspart container -The step card wrapper
 * @csspart indicator -The step number circle
 * @csspart title -The step label heading
 * @csspart description -The step description paragraph
 * @csspart content -The slot content area
 *
 * Usage:
 * ```html
 * <open-step-card step="1" label="Create">
 *   deno run -A npm:@openelement/create my-app
 * </open-step-card>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from './open-props-tokens.js';
import { escapeHtml } from '@openelement/core';

export const tagName = 'open-step-card';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
  }
  .step-card {
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2);
    padding: var(--size-4);
    background: var(--gray-1);
    position: relative;
    border-top: var(--border-size-2) solid var(--brand);
  }
  .step-header {
    display: flex;
    align-items: center;
    gap: var(--size-2);
    margin-bottom: var(--size-2);
  }
  .step-number {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-round);
    background: var(--brand);
    color: var(--text-primary);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-7);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .step-label {
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-6);
    color: var(--gray-5);
    text-transform: uppercase;
    letter-spacing: var(--font-letterspacing-5);
  }
  .step-body {
    font-size: var(--font-size-1);
    line-height: var(--font-lineheight-3);
    color: var(--gray-9);
  }
  .step-body ::slotted(code) {
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    color: var(--gray-9);
  }
`);

export class OpenStepCard extends OpenElement {
  static override styles = [openPropsTokenSheet, sheet];
  static override observedAttributes = ['step', 'label', 'description', 'status'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const step = parseInt(this.getAttribute('step') || '1', 10);
    const label = this.getAttribute('label') || '';
    const description = this.getAttribute('description') || '';

    return (
      <div className='step-card' part='container'>
        <div className='step-header'>
          <span className='step-number' part='indicator'>{step}</span>
          <span className='step-label' part='title'>{this._esc(label)}</span>
        </div>
        {description && (
          <p
            part='description'
            style='margin:0 0 var(--size-2);color:var(--gray-7);font-size:var(--font-size-0);'
          >
            {this._esc(description)}
          </p>
        )}
        <div className='step-body' part='content'>
          <slot></slot>
        </div>
      </div>
    );
  }

  override attributeChangedCallback(_name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    this._syncDOM();
  }

  private _syncDOM(): void {
    this.update();
  }

  private _esc = escapeHtml;
}

export default OpenStepCard;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenStepCard);
}
