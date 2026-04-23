import { LitElement, html, css } from 'lit'

/**
 * Footer component
 *
 * Static component - no JS needed.
 */
export class Footer extends LitElement {
  static styles = css`
    footer {
      padding: 2rem;
      border-top: 1px solid #eaeaea;
      text-align: center;
      color: #666;
      font-size: 0.9rem;
    }

    a {
      color: inherit;
    }
  `

  render() {
    return html`
      <footer>
        <p>Built with <a href="https://github.com/SisyphusZheng/kiss" target="_blank">KISS Framework</a></p>
        <p>Zero JS by default. Islands for interactivity.</p>
      </footer>
    `
  }
}

customElements.define('app-footer', Footer)
