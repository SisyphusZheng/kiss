import { LitElement, html, css } from '@kissjs/core'

/**
 * Shared page layout wrapper.
 *
 * Every route page wraps its content in <app-layout> instead of
 * manually including <app-header> and <app-footer>.
 *
 * Usage inside a route:
 * ```ts
 * render() {
 *   return html`<app-layout>...page content...</app-layout>`
 * }
 * ```
 */
export class AppLayout extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .layout-main {
      flex: 1;
    }
  `

  render() {
    return html`
      <app-header></app-header>
      <main class="layout-main">
        <slot></slot>
      </main>
      <app-footer></app-footer>
    `
  }
}

customElements.define('app-layout', AppLayout)
