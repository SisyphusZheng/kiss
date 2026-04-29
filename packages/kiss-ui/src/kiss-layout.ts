/**
 * @kissjs/ui - kiss-layout
 *
 * App layout component with header, sidebar, and footer.
 * Swiss International Style: Pure B&W, minimal.
 *
 * Features:
 * - Sticky header with configurable navigation
 * - Collapsible sidebar with data-driven sections
 * - Mobile hamburger menu (L0 details/summary)
 * - Theme toggle via kiss-theme-toggle Island
 * - Footer with links
 *
 * KISS Architecture:
 * - This is a STATIC component (no hydration needed)
 * - Theme toggle is handled by kiss-theme-toggle Island
 * - Navigation is data-driven via navItems property (no hardcoded links)
 *
 * Usage (data-driven navigation):
 * ```html
 * <kiss-layout current-path="/guide/getting-started"
 *   nav-items='[{"section":"Guide","items":[{"path":"/guide/getting-started","label":"Getting Started"}]}]'>
 * </kiss-layout>
 * ```
 *
 * Usage (default KISS docs navigation, no nav-items attribute):
 * ```html
 * <kiss-layout current-path="/guide/getting-started">
 *   <main>Content here</main>
 * </kiss-layout>
 * ```
 *
 * NavItems schema:
 * ```ts
 * interface NavItem { path: string; label: string }
 * interface NavSection { section: string; items: NavItem[] }
 * ```
 */

import { css, type CSSResult, html, LitElement, nothing, type TemplateResult } from '@kissjs/core';
import { kissDesignTokens } from './design-tokens.js';
// CRITICAL: kiss-layout's template uses <kiss-theme-toggle>, so we MUST import it
// so that the SSR renderer can recursively render its DSD shadow root.
// Without this import, SSR outputs <kiss-theme-toggle></kiss-theme-toggle> without
// DSD, which means the theme toggle button is never rendered server-side and
// cannot hydrate on the client.
import './kiss-theme-toggle.js';

export const tagName = 'kiss-layout';

/** A single navigation link */
export interface NavItem {
  /** URL path for the link */
  path: string;
  /** Display label */
  label: string;
}

/** A navigation section with a title and links */
export interface NavSection {
  /** Section title (shown as collapsible header) */
  section: string;
  /** Links in this section */
  items: NavItem[];
}

/** Header navigation link */
export interface HeaderNavLink {
  /** URL path or external URL */
  href: string;
  /** Display label */
  label: string;
}

export class KissLayout extends LitElement {
  static override styles: CSSResult[] = [
    kissDesignTokens,
    css`
      :host {
        display: block;
      }

      /* === Layout Shell === */
      .app-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: var(--kiss-bg-base);
        color: var(--kiss-text-primary);
        font-family: var(--kiss-font-sans);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .layout-body {
        display: flex;
        flex: 1;
      }

      .layout-main {
        flex: 1;
        min-width: 0;
      }

      .app-layout[home] .layout-body {
        display: block;
      }

      /* === Header === */
      .app-header {
        position: sticky;
        top: 0;
        z-index: var(--kiss-z-sticky);
        background: var(--kiss-bg-base);
        border-bottom: 1px solid var(--kiss-border);
      }

      .header-inner {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 var(--kiss-size-8);
        display: flex;
        align-items: center;
        height: 56px;
        gap: var(--kiss-size-6);
      }

      /* === Mobile Menu (L0: details/summary) === */
      .mobile-menu {
        display: none;
      }

      .mobile-menu-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid var(--kiss-border);
        border-radius: var(--kiss-radius-md);
        background: transparent;
        color: var(--kiss-text-tertiary);
        cursor: pointer;
        padding: 0;
        list-style: none;
        transition:
          color var(--kiss-transition-normal),
          border-color var(--kiss-transition-normal),
          background var(--kiss-transition-normal);
        }

        .mobile-menu-btn::-webkit-details-marker {
          display: none;
        }

        .mobile-menu-btn::marker {
          content: "";
        }

        .mobile-menu-btn:hover,
        .mobile-menu-btn:focus-visible {
          color: var(--kiss-text-primary);
          border-color: var(--kiss-border-hover);
          background: var(--kiss-accent-subtle);
        }

        .mobile-menu[open] .mobile-menu-btn {
          color: var(--kiss-text-primary);
          background: var(--kiss-accent-subtle);
          border-color: var(--kiss-border-hover);
        }

        /* === Logo === */
        .logo {
          font-size: var(--kiss-font-size-sm);
          font-weight: var(--kiss-font-weight-extrabold);
          color: var(--kiss-text-primary);
          text-decoration: none;
          letter-spacing: var(--kiss-letter-spacing-widest);
          text-transform: uppercase;
          transition: opacity var(--kiss-transition-normal);
          white-space: nowrap;
        }

        .logo:hover {
          opacity: 0.6;
        }

        .logo-sub {
          font-size: var(--kiss-font-size-xs);
          font-weight: var(--kiss-font-weight-normal);
          color: var(--kiss-text-muted);
          margin-left: var(--kiss-size-2);
          letter-spacing: var(--kiss-letter-spacing-wide);
          text-transform: none;
        }

        /* === Header Nav === */
        .header-nav {
          display: flex;
          gap: 0.125rem;
          flex: 1;
        }

        .header-nav a {
          color: var(--kiss-text-tertiary);
          text-decoration: none;
          font-size: var(--kiss-font-size-sm);
          font-weight: var(--kiss-font-weight-medium);
          padding: var(--kiss-size-2) var(--kiss-size-3);
          letter-spacing: var(--kiss-letter-spacing-wide);
          transition: color var(--kiss-transition-normal);
          border-radius: var(--kiss-radius-md);
        }

        .header-nav a:hover {
          color: var(--kiss-text-primary);
        }

        /* === Header Right === */
        .header-right {
          display: flex;
          align-items: center;
          gap: var(--kiss-size-2);
          margin-left: auto;
        }

        /* === GitHub Link === */
        .github-link {
          display: inline-flex;
          align-items: center;
          gap: var(--kiss-size-2);
          color: var(--kiss-text-muted);
          text-decoration: none;
          font-size: var(--kiss-font-size-xs);
          font-weight: var(--kiss-font-weight-medium);
          letter-spacing: var(--kiss-letter-spacing-wide);
          padding: var(--kiss-size-2) var(--kiss-size-3);
          border: 1px solid var(--kiss-border);
          border-radius: var(--kiss-radius-md);
          transition: color var(--kiss-transition-normal), border-color var(--kiss-transition-normal);
        }

        .github-link:hover {
          color: var(--kiss-text-secondary);
          border-color: var(--kiss-border-hover);
        }

        .github-link svg {
          flex-shrink: 0;
        }

        /* === Sidebar (Desktop) === */
        .docs-sidebar {
          width: 240px;
          flex-shrink: 0;
          border-right: 1px solid var(--kiss-border);
          padding: var(--kiss-size-6) 0;
          overflow-y: auto;
          height: calc(100vh - 56px);
          position: sticky;
          top: 56px;
          scrollbar-width: thin;
        }

        .nav-section {
          margin-bottom: var(--kiss-size-5);
        }

        .nav-section summary {
          font-size: var(--kiss-font-size-xs);
          font-weight: var(--kiss-font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--kiss-text-muted);
          padding: 0 var(--kiss-size-5);
          margin-bottom: var(--kiss-size-2);
          cursor: pointer;
          list-style: none;
          display: flex;
          align-items: center;
          gap: var(--kiss-size-2);
          user-select: none;
        }

        .nav-section summary::-webkit-details-marker {
          display: none;
        }

        .nav-section summary::marker {
          content: "";
        }

        .nav-section summary::before {
          content: "▾";
          font-size: 0.5rem;
          transition: transform var(--kiss-transition-normal);
          display: inline-block;
        }

        .nav-section[open] summary::before {
          transform: rotate(0deg);
        }

        .nav-section:not([open]) summary::before {
          transform: rotate(-90deg);
        }

        .nav-section summary:hover {
          color: var(--kiss-text-tertiary);
        }

        .docs-sidebar a {
          display: block;
          color: var(--kiss-text-tertiary);
          text-decoration: none;
          font-size: var(--kiss-font-size-sm);
          padding: 0.3rem var(--kiss-size-5);
          transition: color var(--kiss-transition-normal), background var(--kiss-transition-normal);
          border-left: 2px solid transparent;
        }

        .docs-sidebar a:hover {
          color: var(--kiss-text-primary);
          background: var(--kiss-accent-subtle);
        }

        .docs-sidebar a.active,
        .docs-sidebar a[aria-current="page"] {
          color: var(--kiss-text-primary);
          border-left-color: var(--kiss-text-primary);
          background: var(--kiss-accent-subtle);
          font-weight: var(--kiss-font-weight-medium);
        }

        /* === Mobile Backdrop === */
        .mobile-backdrop {
          position: fixed;
          inset: 0;
          top: 56px;
          background: rgba(0, 0, 0, 0.4);
          z-index: 80;
          opacity: 0;
          pointer-events: none;
          transition: opacity var(--kiss-transition-slow);
          backdrop-filter: blur(2px);
        }

        /* === Mobile Responsive === */
        @media (max-width: 900px) {
          .mobile-menu {
            display: block;
          }

          .header-inner {
            padding: 0 var(--kiss-size-4);
            gap: var(--kiss-size-3);
          }

          .header-nav {
            display: none;
          }

          .github-text {
            display: none;
          }

          .header-right {
            gap: var(--kiss-size-2);
          }

          .docs-sidebar {
            position: fixed;
            top: 56px;
            left: 0;
            width: min(300px, 80vw);
            height: calc(100vh - 56px);
            z-index: 90;
            background: var(--kiss-bg-base);
            border-right: 1px solid var(--kiss-border);
            border-bottom: none;
            padding: var(--kiss-size-4) 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            transform: translateX(-101%);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform;
            box-shadow: none;
          }

          .app-layout:has(.mobile-menu[open]) .docs-sidebar {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
          }

          .app-layout:has(.mobile-menu[open]) .mobile-backdrop {
            opacity: 1;
            pointer-events: auto;
          }

          /* :has() fallback for browsers without :has() support
            (Safari < 15.4, Firefox < 121).
            has-fallback.js adds .sidebar-open to the host element. */
          :host(.sidebar-open) .docs-sidebar {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
          }

          :host(.sidebar-open) .mobile-backdrop {
            opacity: 1;
            pointer-events: auto;
          }

          .nav-section {
            margin-bottom: var(--kiss-size-2);
          }

          .nav-section summary {
            padding: var(--kiss-size-2) var(--kiss-size-4);
            font-size: var(--kiss-font-size-xs);
          }

          .docs-sidebar a {
            padding: var(--kiss-size-2) var(--kiss-size-4) var(--kiss-size-2) var(--kiss-size-7);
            font-size: var(--kiss-font-size-sm);
          }

          .layout-main {
            width: 100%;
          }

          .app-footer footer {
            padding: var(--kiss-size-6) var(--kiss-size-4);
          }

          .app-footer .divider {
            display: none;
          }

          .app-footer p {
            line-height: 1.8;
          }
        }

        @media (max-width: 480px) {
          .logo-sub {
            display: none;
          }

          .github-link {
            padding: var(--kiss-size-2);
            border: none;
          }

          .header-inner {
            padding: 0 var(--kiss-size-3);
          }
        }

        /* === Footer === */
        .app-footer footer {
          padding: var(--kiss-size-8);
          border-top: 1px solid var(--kiss-border);
          text-align: center;
          color: var(--kiss-text-muted);
          font-size: var(--kiss-font-size-xs);
          letter-spacing: var(--kiss-letter-spacing-wide);
          background: var(--kiss-bg-base);
        }

        .app-footer p {
          margin: 0.25rem 0;
        }

        .app-footer a {
          color: var(--kiss-text-tertiary);
          text-decoration: none;
          transition: color var(--kiss-transition-normal);
        }

        .app-footer a:hover {
          color: var(--kiss-text-primary);
        }

        .app-footer .divider {
          display: inline-block;
          width: 1px;
          height: 8px;
          background: var(--kiss-border-hover);
          vertical-align: middle;
          margin: 0 var(--kiss-size-3);
        }
      `,
    ];

    static override properties = {
      home: { type: Boolean, reflect: true },
      currentPath: { type: String, attribute: 'current-path' },
      navItems: { type: Array, attribute: 'nav-items' },
      headerNav: { type: Array, attribute: 'header-nav' },
      logoText: { type: String, attribute: 'logo-text' },
      logoSub: { type: String, attribute: 'logo-sub' },
      githubUrl: { type: String, attribute: 'github-url' },
    };

    /** Whether to show the home layout (no sidebar, full-width) */
    home = false;
    /** Current URL path, used to highlight the active navigation link */
    currentPath = '';
    /** Sidebar navigation sections (data-driven; falls back to default KISS docs nav) */
    navItems?: NavSection[];
    /** Header navigation links (data-driven; falls back to default) */
    headerNav?: HeaderNavLink[];
    /** Logo text (default: "KISS") */
    logoText = 'KISS';
    /** Logo subtitle (default: "framework") */
    logoSub = 'framework';
    /** GitHub repository URL (default: KISS repo) */
    githubUrl = 'https://github.com/SisyphusZheng/kiss';

    /** Default KISS docs navigation — single source of truth for the docs site */
    private static readonly DEFAULT_NAV: NavSection[] = [
      {
        section: 'Introduction',
        items: [
          { path: '/guide/getting-started', label: 'Getting Started' },
          { path: '/guide/design-philosophy', label: 'Design Philosophy' },
          { path: '/guide/architecture', label: 'KISS Architecture' },
        ],
      },
      {
        section: 'Core',
        items: [
          { path: '/guide/routing', label: 'Routing' },
          { path: '/guide/islands', label: 'Islands' },
          { path: '/guide/api-routes', label: 'API Routes' },
          { path: '/guide/api-design', label: 'API Design' },
          { path: '/guide/ssg', label: 'SSG' },
        ],
      },
      {
        section: 'Guides',
        items: [
          { path: '/guide/configuration', label: 'Configuration' },
          { path: '/guide/error-handling', label: 'Error Handling' },
          { path: '/guide/security-middleware', label: 'Security & Middleware' },
          { path: '/guide/testing', label: 'Testing' },
        ],
      },
      {
        section: 'Reference',
        items: [
          { path: '/guide/deployment', label: 'Deployment' },
          { path: '/styling/kiss-ui', label: '@kissjs/ui' },
          { path: '/styling/web-awesome', label: 'Web Awesome' },
        ],
      },
      {
        section: 'UI',
        items: [{ path: '/ui', label: 'Design System' }],
      },
      {
        section: 'Examples',
        items: [
          { path: '/examples', label: 'Overview' },
          { path: '/examples/hello', label: 'Hello World' },
          { path: '/examples/minimal-blog', label: 'Minimal Blog' },
          { path: '/examples/fullstack', label: 'Fullstack' },
        ],
      },
      {
        section: 'Project',
        items: [
          { path: '/roadmap', label: 'Roadmap' },
          { path: '/changelog', label: 'Changelog' },
          { path: '/contributing', label: 'Contributing' },
        ],
      },
    ];

    /** Default header navigation links */
    private static readonly DEFAULT_HEADER_NAV: HeaderNavLink[] = [
      { href: '/guide/getting-started', label: 'Docs' },
      { href: '/ui', label: 'UI' },
      { href: 'https://jsr.io/@kissjs/core', label: 'JSR' },
    ];

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

    private _renderSidebarNav(): TemplateResult | typeof nothing {
      const nav = this.navItems || KissLayout.DEFAULT_NAV;
      return html`
        <nav class="docs-sidebar" aria-label="Documentation navigation">
          ${nav.map(
            (section) =>
              html`
                <details class="nav-section" open>
                  <summary class="nav-section-title">${section.section}</summary>
                  ${section.items.map(
                    (item) => this._navLink(item.path, item.label),
                  )}
                </details>
              `,
          )}
        </nav>
      `;
    }

    private _renderHeaderNav(): TemplateResult | typeof nothing {
      const links = this.headerNav || KissLayout.DEFAULT_HEADER_NAV;
      return html`
        <nav class="header-nav">
          ${links.map(
            (link) =>
              html`
                <a href="${link.href}">${link.label}</a>
              `,
          )}
        </nav>
      `;
    }

    override render(): TemplateResult {
      return html`
        <div class="app-layout" ?home="${this.home}">
          <header class="app-header">
            <div class="header-inner">
              <a class="logo" href="/">${this.logoText}<span class="logo-sub">${this
                .logoSub}</span></a>
              ${this._renderHeaderNav()}
              <div class="header-right">
                ${!this.home
                  ? html`
                    <details class="mobile-menu">
                      <summary class="mobile-menu-btn" aria-label="Toggle navigation">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        >
                          <line x1="3" y1="4.5" x2="15" y2="4.5" />
                          <line x1="3" y1="9" x2="15" y2="9" />
                          <line x1="3" y1="13.5" x2="15" y2="13.5" />
                        </svg>
                      </summary>
                    </details>
                  `
                  : ''}
                <kiss-theme-toggle></kiss-theme-toggle>
                <a class="github-link" href="${this.githubUrl}">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path
                      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                    />
                  </svg>
                  <span class="github-text">GitHub</span>
                </a>
              </div>
            </div>
          </header>
          <div class="mobile-backdrop"></div>
          <div class="layout-body">
            ${!this.home ? this._renderSidebarNav() : nothing}
            <main class="layout-main">
              <slot></slot>
            </main>
          </div>
          <div class="app-footer">
            <footer>
              <p>
                Built with <a href="${this.githubUrl}" target="_blank" rel="noopener noreferrer"
                >KISS Framework</a>
                <span class="divider"></span>
                Self-bootstrapped from JSR
                <span class="divider"></span>
                KISS Architecture — K·I·S·S
              </p>
            </footer>
          </div>
        </div>
      `;
    }
  }

  customElements.define(tagName, KissLayout);
