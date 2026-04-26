/**
 * App Layout — KISS Architecture compliant Shadow DOM component.
 *
 * DSD (Declarative Shadow DOM) makes content visible without JavaScript.
 * Shadow DOM provides style encapsulation — no global CSS leakage.
 *
 * KISS Architecture (K·I·S·S):
 * - K (Knowledge): SSG output includes <template shadowrootmode="open">
 * - I (Isolated): Layout is a proper Shadow DOM component
 * - S (Semantic): DSD ensures content is visible pre-hydration
 * - S (Static): Dynamic data via API Routes + RPC (Serverless)
 */
import { html, LitElement } from '@kissjs/core';
import { layoutStyles } from './layout-styles.js';

export class AppLayout extends LitElement {
  static styles = layoutStyles;

  static properties = {
    home: { type: Boolean, reflect: true },
    currentPath: { type: String, attribute: 'current-path' },
    theme: { state: true },
  };

  constructor() {
    super();
    this.home = false;
    this.currentPath = '';
    this.theme = 'dark';
  }

  connectedCallback() {
    super.connectedCallback();
    // Read initial theme
    this.theme = document.documentElement.getAttribute('data-theme') || 'dark';
    // Listen for theme changes from other components
    this._onThemeChange = () => {
      this.theme = document.documentElement.getAttribute('data-theme') || 'dark';
    };
    window.addEventListener('kiss-theme-change', this._onThemeChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('kiss-theme-change', this._onThemeChange);
  }

  private _onThemeChange:
    | (() => void)
    | undefined;

  private _toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('kiss-theme', next);
    this.theme = next;
    // Notify other components
    window.dispatchEvent(new CustomEvent('kiss-theme-change'));
  }

  private _navLink(path: string, text: string) {
    const isActive = this.currentPath === path;
    return html`
      <a
        href="${path}"
        class="${isActive ? 'active' : ''}"
        aria-current="${isActive ? 'page' : undefined}"
      >${text}</a>
    `;
  }

  render() {
    const isDark = this.theme === 'dark';

    return html`
      <div class="app-layout" ?home="${this.home}">
        <header class="app-header">
          <div class="header-inner">
            <a class="logo" href="/">KISS<span class="logo-sub">framework</span></a>
            <nav>
              <a href="/guide/getting-started">Docs</a>
              <a href="/ui">UI</a>
              <a href="https://jsr.io/@kissjs/core">JSR</a>
            </nav>
            <div class="header-right">
              <button
                class="theme-toggle"
                @click="${this._toggleTheme}"
                title="Switch to ${isDark ? 'light' : 'dark'} theme"
                aria-label="Toggle theme"
              >
                ${isDark ? '☀' : '☾'}
              </button>
              <a class="github-link" href="https://github.com/SisyphusZheng/kiss">GitHub</a>
            </div>
          </div>
        </header>
        <div class="layout-body">
          ${!this.home
            ? html`
              <nav class="docs-sidebar" aria-label="Documentation navigation">
                <details class="nav-section" open>
                  <summary class="nav-section-title">Introduction</summary>
                  ${this._navLink('/guide/getting-started', 'Getting Started')} ${this
                    ._navLink('/guide/design-philosophy', 'Design Philosophy')} ${this
                    ._navLink('/guide/dia', 'KISS Architecture')}
                </details>
                <details class="nav-section" open>
                  <summary class="nav-section-title">Core</summary>
                  ${this._navLink('/guide/routing', 'Routing')} ${this._navLink(
                    '/guide/islands',
                    'Islands',
                  )} ${this._navLink('/guide/api-routes', 'API Routes')} ${this._navLink(
                    '/guide/api-design',
                    'API Design',
                  )} ${this._navLink('/guide/ssg', 'SSG')}
                </details>
                <details class="nav-section" open>
                  <summary class="nav-section-title">Guides</summary>
                  ${this._navLink('/guide/configuration', 'Configuration')} ${this._navLink(
                    '/guide/error-handling',
                    'Error Handling',
                  )} ${this._navLink(
                    '/guide/security-middleware',
                    'Security & Middleware',
                  )} ${this._navLink('/guide/testing', 'Testing')}
                </details>
                <details class="nav-section" open>
                  <summary class="nav-section-title">Reference</summary>
                  ${this._navLink('/guide/architecture', 'Architecture')} ${this._navLink(
                    '/guide/deployment',
                    'Deployment',
                  )} ${this._navLink('/styling/kiss-ui', '@kissjs/ui')} ${this._navLink(
                    '/styling/web-awesome',
                    'Web Awesome',
                  )}
                </details>
                <details class="nav-section" open>
                  <summary class="nav-section-title">UI</summary>
                  ${this._navLink('/ui', 'Design System')}
                </details>
              </nav>
            `
            : ''}
          <main class="layout-main">
            <slot></slot>
          </main>
        </div>
        <div class="app-footer">
          <footer>
            <p>
              Built with <a href="https://github.com/SisyphusZheng/kiss" target="_blank"
              >KISS Framework</a>
              <span class="divider"></span>
              Self-bootstrapped from JSR
              <span class="divider"></span>
              KISS Architecture — K·I·S·S
            </p>
          </footer>
        </div>
      </div>
      <noscript>
        <div class="noscript-warning">
          This site works best with JavaScript enabled for enhanced navigation, but all content is
          accessible without it.
        </div>
      </noscript>
    `;
  }
}

customElements.define('app-layout', AppLayout);
