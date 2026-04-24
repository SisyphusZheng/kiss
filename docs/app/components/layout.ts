import { LitElement, html, css } from '@kissjs/core'
import './header.js'
import './sidebar.js'
import './footer.js'

/**
 * Three-column doc layout (Fresh-style):
 * [Sidebar 240px] | [Content flex-1]
 *
 * Homepage uses <app-layout home> for full-width centered layout.
 */
export class AppLayout extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .layout-body {
      display: flex;
      flex: 1;
    }

    .layout-main {
      flex: 1;
      min-width: 0;
    }

    /* Full-width mode for homepage */
    :host([home]) .layout-body {
      display: block;
    }

    @media (max-width: 900px) {
      docs-sidebar {
        display: none;
      }
    }
  `

  static properties = {
    home: { type: Boolean, reflect: true },
  }

  constructor() {
    super()
    this.home = false
  }

  render() {
    return html`
      <app-header></app-header>
      <div class="layout-body">
        ${!this.home ? html`<docs-sidebar></docs-sidebar>` : ''}
        <main class="layout-main">
          <slot></slot>
        </main>
      </div>
      <app-footer></app-footer>
    `
  }
}

customElements.define('app-layout', AppLayout)
