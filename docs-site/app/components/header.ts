import { LitElement, html, css } from 'lit'

export class DocsHeader extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--wa-color-neutral-0, #fff);
      border-bottom: 1px solid var(--wa-color-neutral-200, #e5e7eb);
    }

    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--wa-space-md, 1rem);
      display: flex;
      align-items: center;
      height: 56px;
      gap: var(--wa-space-lg, 1.5rem);
    }

    .logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--wa-color-primary-600, #2563eb);
      text-decoration: none;
      letter-spacing: -0.02em;
    }

    .logo:hover {
      color: var(--wa-color-primary-700, #1d4ed8);
    }

    nav {
      display: flex;
      gap: var(--wa-space-sm, 0.5rem);
      flex: 1;
      flex-wrap: wrap;
    }

    nav a {
      color: var(--wa-color-neutral-600, #525252);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 500;
      padding: var(--wa-space-xs, 0.25rem) var(--wa-space-sm, 0.5rem);
      border-radius: var(--wa-border-radius-sm, 4px);
      transition: color 0.15s, background 0.15s;
    }

    nav a:hover {
      color: var(--wa-color-primary-600, #2563eb);
      background: var(--wa-color-primary-50, #eff6ff);
    }

    .github-link {
      font-size: 0.875rem;
    }
  `

  render() {
    return html`
      <header class="header-inner">
        <a class="logo" href="/kiss/">KISS</a>
        <nav>
          <a href="/kiss/guide/getting-started">Getting Started</a>
          <a href="/kiss/guide/routing">Routing</a>
          <a href="/kiss/guide/islands">Islands</a>
          <a href="/kiss/guide/ssg">SSG</a>
          <a href="/kiss/guide/api-routes">API</a>
          <a href="/kiss/guide/design-philosophy">Philosophy</a>
          <a href="/kiss/guide/architecture">Architecture</a>
          <a href="/kiss/guide/configuration">Config</a>
          <a href="/kiss/guide/deployment">Deploy</a>
          <a href="/kiss/styling/web-awesome">Components</a>
        </nav>
        <wa-button
          class="github-link"
          href="https://github.com/SisyphusZheng/kiss"
          variant="default"
          size="small"
        >
          GitHub
        </wa-button>
      </header>
    `
  }
}

customElements.define('app-header', DocsHeader)
