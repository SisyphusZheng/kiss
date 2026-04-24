import { LitElement, html, css } from 'lit'

/**
 * Docs header — top navigation bar.
 *
 * Uses Web Awesome CDN components. No imports needed —
 * <wa-*> tags are available globally after kissUI() injects the loader.
 */
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
      gap: var(--wa-space-md, 1rem);
      flex: 1;
    }

    nav a {
      color: var(--wa-color-neutral-600, #525252);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      padding: var(--wa-space-xs, 0.25rem) var(--wa-space-sm, 0.5rem);
      border-radius: var(--wa-border-radius-sm, 4px);
      transition: color 0.15s, background 0.15s;
    }

    nav a:hover {
      color: var(--wa-color-primary-600, #2563eb);
      background: var(--wa-color-primary-50, #eff6ff);
    }

    nav a[active] {
      color: var(--wa-color-primary-700, #1d4ed8);
    }

    .github-link {
      font-size: 0.875rem;
    }
  `

  render() {
    return html`
      <header class="header-inner">
        <a class="logo" href="/">KISS</a>
        <nav>
          <a href="/guide/getting-started">Guide</a>
          <a href="/guide/routing">Routing</a>
          <a href="/guide/islands">Islands</a>
          <a href="/guide/ssg">SSG</a>
          <a href="/styling/web-awesome">Components</a>
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
