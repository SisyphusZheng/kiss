/**
 * App Layout — DIA compliant Shadow DOM component.
 *
 * DSD (Declarative Shadow DOM) makes content visible without JavaScript.
 * Shadow DOM provides style encapsulation — no global CSS leakage.
 *
 * DIA pillars:
 * - 构建即终态: SSG output includes <template shadowrootmode="open">
 * - 交互必隔离: Layout is a proper Shadow DOM component
 * - 声明即内容: DSD ensures content is visible pre-hydration
 * - 拒绝即纪律: No light DOM hacks, no external DOM manipulation
 */
import { LitElement, html } from '@kissjs/core'
import { layoutStyles } from './layout-styles.js'

export class AppLayout extends LitElement {
  static styles = layoutStyles

  static properties = {
    home: { type: Boolean, reflect: true },
    currentPath: { type: String, attribute: 'current-path' },
  }

  constructor() {
    super()
    this.home = false
    this.currentPath = ''
  }

  private _navLink(path: string, text: string) {
    const isActive = this.currentPath === path
    return html`<a
      href="${path}"
      class=${isActive ? 'active' : ''}
      aria-current=${isActive ? 'page' : ''}
    >${text}</a>`
  }

  render() {
    return html`
      <div class="app-layout" ?home=${this.home}>
        <header class="app-header">
          <div class="header-inner">
            <a class="logo" href="/kiss/">KISS<span class="logo-sub">framework</span></a>
            <nav>
              <a href="/kiss/guide/getting-started">Docs</a>
              <a href="https://jsr.io/@kissjs/core">JSR</a>
            </nav>
            <div class="header-right">
              <a class="github-link" href="https://github.com/SisyphusZheng/kiss">GitHub</a>
            </div>
          </div>
        </header>
        <div class="layout-body">
          ${!this.home ? html`
            <nav class="docs-sidebar" aria-label="Documentation navigation">
              <div class="nav-section">
                <div class="nav-section-title">Introduction</div>
                ${this._navLink('/kiss/guide/getting-started', 'Getting Started')}
                ${this._navLink('/kiss/guide/design-philosophy', 'Design Philosophy')}
                ${this._navLink('/kiss/guide/dia', 'DIA')}
              </div>
              <div class="nav-section">
                <div class="nav-section-title">Core</div>
                ${this._navLink('/kiss/guide/routing', 'Routing')}
                ${this._navLink('/kiss/guide/islands', 'Islands')}
                ${this._navLink('/kiss/guide/api-routes', 'API Routes')}
                ${this._navLink('/kiss/guide/api-design', 'API Design')}
                ${this._navLink('/kiss/guide/ssg', 'SSG')}
              </div>
              <div class="nav-section">
                <div class="nav-section-title">Guides</div>
                ${this._navLink('/kiss/guide/configuration', 'Configuration')}
                ${this._navLink('/kiss/guide/error-handling', 'Error Handling')}
                ${this._navLink('/kiss/guide/security-middleware', 'Security & Middleware')}
                ${this._navLink('/kiss/guide/testing', 'Testing')}
              </div>
              <div class="nav-section">
                <div class="nav-section-title">Reference</div>
                ${this._navLink('/kiss/guide/architecture', 'Architecture')}
                ${this._navLink('/kiss/guide/deployment', 'Deployment')}
                ${this._navLink('/kiss/styling/web-awesome', 'Web Awesome')}
              </div>
            </nav>
          ` : ''}
          <main class="layout-main">
            <slot></slot>
          </main>
        </div>
        <div class="app-footer">
          <footer>
            <p>
              Built with <a href="https://github.com/SisyphusZheng/kiss" target="_blank">KISS Framework</a>
              <span class="divider"></span>
              Self-bootstrapped from JSR
              <span class="divider"></span>
              DIA — Declarative Islands Architecture
            </p>
          </footer>
        </div>
      </div>
      <noscript>
        <div class="noscript-warning">
          This site works best with JavaScript enabled for enhanced navigation,
          but all content is accessible without it.
        </div>
      </noscript>
    `
  }
}

customElements.define('app-layout', AppLayout)
