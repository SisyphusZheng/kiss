import { LitElement, html, css } from 'lit'

/**
 * Header component
 *
 * This is a static component (no JS needed).
 * It's rendered on the server and shipped as HTML only (0 KB JS).
 */
export class Header extends LitElement {
  static styles = css`
    header {
      padding: 1rem 2rem;
      border-bottom: 1px solid #eaeaea;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: inherit;
      text-decoration: none;
    }

    nav a {
      margin-left: 1.5rem;
      color: inherit;
      text-decoration: none;
    }

    nav a:hover {
      text-decoration: underline;
    }

    /* Theme toggle button - will be hydrated as Island */
    .theme-toggle-container {
      margin-left: 1.5rem;
    }
  `

  render() {
    return html`
      <header>
        <a class="logo" href="/">Minimal Blog</a>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <span class="theme-toggle-container">
            <!-- This will be hydrated as an Island -->
            <theme-toggle></theme-toggle>
          </span>
        </nav>
      </header>
    `
  }
}

customElements.define('app-header', Header)
