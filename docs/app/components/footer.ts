import { LitElement, html, css } from '@kissjs/core'

export class DocsFooter extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin-top: auto;
    }

    footer {
      padding: var(--wa-space-lg, 1.5rem) var(--wa-space-xl, 2rem);
      border-top: 1px solid var(--wa-color-neutral-200, #e5e7eb);
      text-align: center;
      color: var(--wa-color-neutral-500, #737373);
      font-size: 0.8125rem;
      background: var(--wa-color-neutral-50, #fafafa);
    }

    p {
      margin: var(--wa-space-xs, 0.25rem) 0;
    }

    a {
      color: var(--wa-color-primary-600, #2563eb);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }
  `

  render() {
    return html`
      <footer>
        <p>Built with <a href="https://github.com/SisyphusZheng/kiss" target="_blank">KISS Framework</a> — Web Standards all the way down</p>
        <p>
          Self-bootstrapped: this site uses @kissjs/core from JSR.
          UI by <a href="https://webawesome.com/" target="_blank">Web Awesome</a>.
        </p>
      </footer>
    `
  }
}

customElements.define('app-footer', DocsFooter)
