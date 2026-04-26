/**
 * code-block Island — KISS Architecture compliant Shadow DOM Island.
 *
 * Without JS: <pre><code> content is visible via DSD projection.
 * With JS: Copy button becomes functional.
 *
 * KISS Architecture (K·I·S·S):
 * - K (Knowledge): SSG output includes <template shadowrootmode="open">
 * - I (Isolated): Copy logic is encapsulated in Shadow DOM
 * - S (Semantic): DSD makes content visible without JS
 * - S (Static): No external DOM manipulation
 *
 * Usage:
 *   <code-block><pre><code>const x = 1</code></pre></code-block>
 */
import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'code-block';

export default class CodeBlock extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    ::slotted(pre) {
      margin: 0;
      padding: 1.25rem;
      background: var(--kiss-code-bg);
      border: 1px solid var(--kiss-code-border);
      border-radius: 2px;
      overflow-x: auto;
      font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
      font-size: 0.8125rem;
      line-height: 1.6;
      color: var(--kiss-text-secondary);
      scrollbar-width: thin;
      scrollbar-color: var(--kiss-scrollbar-thumb) transparent;
    }

    .copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: var(--kiss-bg-elevated);
      color: var(--kiss-text-tertiary);
      border: 1px solid var(--kiss-border);
      padding: 0.25rem 0.625rem;
      font-size: 0.6875rem;
      font-family: inherit;
      cursor: pointer;
      border-radius: 2px;
      transition: color 0.15s, border-color 0.15s;
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
  `;

  private _copyState: 'idle' | 'copied' | 'failed' = 'idle';

  render() {
    return html`
      <slot></slot>
      <button
        class="copy-btn ${this._copyState === 'copied' ? 'copied' : ''}"
        @click="${this._copy}"
        ?hidden="${this._copyState === 'copied'}"
      >
        ${this._copyState === 'copied'
          ? 'Copied!'
          : this._copyState === 'failed'
          ? 'Failed'
          : 'Copy'}
      </button>
    `;
  }

  private async _copy() {
    try {
      // Access light DOM text content via host element
      const text = this.textContent || '';
      await navigator.clipboard.writeText(text);
      this._copyState = 'copied';
      this.requestUpdate();
      setTimeout(() => {
        this._copyState = 'idle';
        this.requestUpdate();
      }, 2000);
    } catch {
      this._copyState = 'failed';
      this.requestUpdate();
      setTimeout(() => {
        this._copyState = 'idle';
        this.requestUpdate();
      }, 2000);
    }
  }
}

customElements.define(tagName, CodeBlock);
