/**
 * copy-code Island — PIA enhancement for code blocks.
 *
 * Without JS: code blocks are plain <pre><code> (content readable, no copy).
 * With JS: adds a "Copy" button to each code block.
 *
 * PIA pattern: content accessible without JS, JS adds convenience.
 */
import { LitElement, html, css } from '@kissjs/core'

export const tagName = 'copy-code'

export default class CopyCode extends LitElement {
  static styles = css`
    :host { display: none; }
  `

  connectedCallback() {
    super.connectedCallback()
    this.enhanceCodeBlocks()
  }

  private enhanceCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre')

    for (const pre of codeBlocks) {
      // Skip if already enhanced
      if (pre.querySelector('.copy-btn')) continue

      const btn = document.createElement('button')
      btn.className = 'copy-btn'
      btn.textContent = 'Copy'
      btn.style.cssText = `
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
      `

      // Make pre relative for button positioning
      const originalPosition = getComputedStyle(pre).position
      if (originalPosition === 'static') {
        (pre as HTMLElement).style.position = 'relative'
      }

      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code')
        const text = code?.textContent || pre.textContent || ''

        try {
          await navigator.clipboard.writeText(text)
          btn.textContent = 'Copied!'
          btn.style.color = '#fff'
          setTimeout(() => {
            btn.textContent = 'Copy'
            btn.style.color = '#888'
          }, 2000)
        } catch {
          btn.textContent = 'Failed'
          setTimeout(() => { btn.textContent = 'Copy' }, 2000)
        }
      })

      btn.addEventListener('mouseenter', () => {
        btn.style.color = '#ccc'
        btn.style.borderColor = '#555'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.color = '#888'
        btn.style.borderColor = '#333'
      })

      pre.appendChild(btn)
    }
  }

  render() {
    return html`` // Invisible — just runs side effects
  }
}

customElements.define(tagName, CopyCode)
