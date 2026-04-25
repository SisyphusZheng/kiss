/**
 * code-block Island — DIA-compliant Shadow DOM Island.
 *
 * Without JS: <pre><code> content is visible via DSD projection.
 * With JS: Copy button becomes functional.
 *
 * DIA pillars:
 * - 构建即终态: SSG output includes <template shadowrootmode="open">
 * - 交互必隔离: Copy logic is encapsulated in Shadow DOM
 * - 声明即内容: DSD makes content visible without JS
 * - 拒绝即纪律: No external DOM manipulation
 *
 * Usage:
 *   <code-block><pre><code>const x = 1</code></pre></code-block>
 */
import { LitElement, html, css } from '@kissjs/core'

export const tagName = 'code-block'

export default class CodeBlock extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    ::slotted(pre) {
      margin: 0;
      padding: 1.25rem;
      background: #111;
      border: 1px solid #222;
      border-radius: 2px;
      overflow-x: auto;
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
      font-size: 0.8125rem;
      line-height: 1.6;
      color: #ccc;
      scrollbar-width: thin;
      scrollbar-color: #222 transparent;
    }

    .copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #222;
      color: #888;
      border: 1px solid #333;
      padding: 0.25rem 0.625rem;
      font-size: 0.6875rem;
      font-family: inherit;
      cursor: pointer;
      border-radius: 2px;
      transition: color 0.15s, border-color 0.15s;
      z-index: 1;
    }

    .copy-btn:hover {
      color: #ccc;
      border-color: #555;
    }

    .copy-btn.copied {
      color: #fff;
      border-color: #555;
    }
  `

  private _copyState: 'idle' | 'copied' | 'failed' = 'idle'

  render() {
    return html`
      <slot></slot>
      <button
        class="copy-btn ${this._copyState === 'copied' ? 'copied' : ''}"
        @click=${this._copy}
        ?hidden=${this._copyState === 'copied'}
      >
        ${this._copyState === 'copied' ? 'Copied!' : this._copyState === 'failed' ? 'Failed' : 'Copy'}
      </button>
    `
  }

  private async _copy() {
    try {
      // Access light DOM text content via host element
      const text = this.textContent || ''
      await navigator.clipboard.writeText(text)
      this._copyState = 'copied'
      this.requestUpdate()
      setTimeout(() => {
        this._copyState = 'idle'
        this.requestUpdate()
      }, 2000)
    } catch {
      this._copyState = 'failed'
      this.requestUpdate()
      setTimeout(() => {
        this._copyState = 'idle'
        this.requestUpdate()
      }, 2000)
    }
  }
}

customElements.define(tagName, CodeBlock)
