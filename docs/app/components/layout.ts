/**
 * App Layout — KISS Architecture compliant Shadow DOM component.
 *
 * DSD (Declarative Shadow DOM) makes content visible without JavaScript.
 * Shadow DOM provides style encapsulation — no global CSS leakage.
 *
 * Theme toggle: handled by a global script (headFragments), not Lit hydration.
 * This component is NOT an Island — it has no client-side JS.
 * The theme-toggle button uses composedPath() event delegation to cross
 * the Shadow DOM boundary. KISS Architecture: L2 > L4.
 *
 * Mobile navigation: <details>/<summary> in header (L0 HTML).
 * Sidebar is always in DOM — CSS controls visibility per viewport.
 * KISS Architecture: L0 (structure) + L1 (responsive) = no JS needed.
 */
import { html, LitElement } from '@kissjs/core';
import { layoutStyles } from './layout-styles.js';

export class AppLayout extends LitElement {
  static styles = layoutStyles;

  static properties = {
    home: { type: Boolean, reflect: true },
    currentPath: { type: String, attribute: 'current-path' },
  };

  constructor() {
    super();
    this.home = false;
    this.currentPath = '';
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
    return html`
      <div class="app-layout" ?home="${this.home}">
        <header class="app-header">
          <div class="header-inner">
            ${!this.home
              ? html`
                <details class="mobile-menu">
                  <summary class="mobile-menu-btn" aria-label="Toggle navigation">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                      <line x1="3" y1="4.5" x2="15" y2="4.5"/>
                      <line x1="3" y1="9" x2="15" y2="9"/>
                      <line x1="3" y1="13.5" x2="15" y2="13.5"/>
                    </svg>
                  </summary>
                </details>
              `
              : ''}
            <a class="logo" href="/">KISS<span class="logo-sub">framework</span></a>
            <nav class="header-nav">
              <a href="/guide/getting-started">Docs</a>
              <a href="/ui">UI</a>
              <a href="https://jsr.io/@kissjs/core">JSR</a>
            </nav>
            <div class="header-right">
              <button
                class="theme-toggle"
                title="Switch to light theme"
                aria-label="Toggle theme"
              >
                <svg class="icon-sun" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
                  <circle cx="8" cy="8" r="3"/>
                  <line x1="8" y1="1" x2="8" y2="3"/>
                  <line x1="8" y1="13" x2="8" y2="15"/>
                  <line x1="1" y1="8" x2="3" y2="8"/>
                  <line x1="13" y1="8" x2="15" y2="8"/>
                  <line x1="3.05" y1="3.05" x2="4.46" y2="4.46"/>
                  <line x1="11.54" y1="11.54" x2="12.95" y2="12.95"/>
                  <line x1="3.05" y1="12.95" x2="4.46" y2="11.54"/>
                  <line x1="11.54" y1="4.46" x2="12.95" y2="3.05"/>
                </svg>
                <svg class="icon-moon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
                  <path d="M13.5 9.14A5.5 5.5 0 0 1 6.86 2.5 5.5 5.5 0 1 0 13.5 9.14Z"/>
                </svg>
              </button>
              <a class="github-link" href="https://github.com/SisyphusZheng/kiss">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                <span class="github-text">GitHub</span>
              </a>
            </div>
          </div>
        </header>
        <div class="mobile-backdrop"></div>
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
