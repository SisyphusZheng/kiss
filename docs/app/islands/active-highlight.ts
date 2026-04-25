/**
 * active-highlight Island — PIA enhancement for sidebar navigation.
 *
 * Without JS: sidebar links are plain <a> tags, all look the same.
 * With JS: this Island highlights the current page's link.
 *
 * This is the PIA pattern: HTML works, JS enhances.
 */
import { LitElement, html, css } from '@kissjs/core'

export const tagName = 'active-highlight'

export default class ActiveHighlight extends LitElement {
  static styles = css`
    :host { display: none; }
  `

  connectedCallback() {
    super.connectedCallback()
    this.highlightActive()
  }

  private highlightActive() {
    const sidebar = document.querySelector('.docs-sidebar')
    if (!sidebar) return

    const currentPath = window.location.pathname
    const links = sidebar.querySelectorAll('a')

    for (const link of links) {
      const href = link.getAttribute('href')
      if (href === currentPath) {
        link.classList.add('active')
        link.setAttribute('aria-current', 'page')
      } else {
        link.classList.remove('active')
        link.removeAttribute('aria-current')
      }
    }
  }

  render() {
    return html`` // Invisible — just runs side effects
  }
}

customElements.define(tagName, ActiveHighlight)
