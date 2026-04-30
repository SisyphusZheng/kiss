/**
 * @kissjs/ui - kiss-code-block
 *
 * Code block with copy button.
 * DSD makes content visible without JavaScript.
 *
 * Usage:
 * ```html
 * <kiss-code-block>
 *   <pre><code>const x = 1;</code></pre>
 * </kiss-code-block>
 * ```
 */

import { css, type CSSResult, html, LitElement, type TemplateResult } from '@kissjs/core';
import { kissDesignTokens } from './design-tokens.js';

export const tagName = 'kiss-code-block';

export class KissCodeBlock extends LitElement {
  static override styles: CSSResult[] = [
    kissDesignTokens,
    css`
      :host {
        display: block;
        position: relative;
      }

      ::slotted(pre) {
        margin: 0;
        padding: var(--kiss-size-5);
        background: var(--kiss-code-bg);
        border: 1px solid var(--kiss-code-border);
        border-radius: var(--kiss-radius-sm);
        overflow-x: auto;
        font-family: var(--kiss-font-mono);
        font-size: var(--kiss-font-size-sm);
        line-height: var(--kiss-line-height-normal);
        color: var(--kiss-text-secondary);
        scrollbar-width: thin;
        scrollbar-color: var(--kiss-border) transparent;
      }

      .copy-btn {
        position: absolute;
        top: var(--kiss-size-2);
        right: var(--kiss-size-2);
        background: var(--kiss-bg-elevated);
        color: var(--kiss-text-muted);
        border: 1px solid var(--kiss-border);
        padding: var(--kiss-size-1) var(--kiss-size-3);
        font-size: var(--kiss-font-size-xs);
        font-family: var(--kiss-font-sans);
        cursor: pointer;
        border-radius: var(--kiss-radius-sm);
        transition: color var(--kiss-transition-normal), border-color var(--kiss-transition-normal);
        z-index: 1;
      }

      .copy-btn:hover {
        color: var(--kiss-text-secondary);
        border-color: var(--kiss-border-hover);
      }

      .copy-btn.copied {
        color: var(--kiss-text-primary);
        border-color: var(--kiss-border-hover);
      }

      .copy-btn.failed {
        color: var(--kiss-error, #e55);
        border-color: var(--kiss-error, #e55);
      }
    `,
  ];

  static override properties = {
    _copyState: { state: true },
  };

  private _copyState: 'idle' | 'copied' | 'failed' = 'idle';
  private _copyTimer: number | undefined;

  override disconnectedCallback() {
    super.disconnectedCallback();
    // Clear pending timer if component disconnects before timeout fires
    if (this._copyTimer !== undefined) {
      clearTimeout(this._copyTimer);
      this._copyTimer = undefined;
    }
  }

  override render(): TemplateResult {
    return html`
      <slot></slot>
      <button
        class="copy-btn ${this._copyState === 'copied'
          ? 'copied'
          : ''} ${this._copyState === 'failed' ? 'failed' : ''}"
        @click="${() => this._copy()}"
      >
        ${this._copyState === 'copied'
          ? '✓ Copied!'
          : this._copyState === 'failed'
          ? '✗ Failed'
          : 'Copy'}
      </button>
    `;
  }

  private async _copy() {
    try {
      const text = this.textContent || '';
      await navigator.clipboard.writeText(text);
      this._copyState = 'copied';
      this._copyTimer = setTimeout(() => {
        this._copyState = 'idle';
        this._copyTimer = undefined;
      }, 2000);
    } catch {
      this._copyState = 'failed';
      this._copyTimer = setTimeout(() => {
        this._copyState = 'idle';
        this._copyTimer = undefined;
      }, 2000);
    }
  }
}

customElements.define(tagName, KissCodeBlock);
