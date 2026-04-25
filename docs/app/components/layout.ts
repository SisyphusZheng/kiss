/**
 * App Layout — DIA compliant.
 * TODO: Restore Shadow DOM + DSD output (Phase 4B).
 * Current: light DOM as interim measure.
 */
import { LitElement, html, css, unsafeHTML } from '@kissjs/core'
import { layoutStyles } from './layout-styles.js'
import '../islands/active-highlight.js'
import '../islands/copy-code.js'

export class AppLayout extends LitElement {
  // DIA: Render to light DOM (interim).
  // TODO: Restore Shadow DOM — DSD makes content visible without JS.
  // Light DOM was a misinterpretation of "降级即内容"; correct reading is DSD.
  createRenderRoot() { return this }

  static properties = {
    home: { type: Boolean, reflect: true },
  }

  constructor() {
    super()
    this.home = false
  }

  render() {
    return html`
      <style>${layoutStyles}</style>
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
                <a href="/kiss/guide/getting-started">Getting Started</a>
                <a href="/kiss/guide/design-philosophy">Design Philosophy</a>
                <a href="/kiss/guide/dia">DIA</a>
              </div>
              <div class="nav-section">
                <div class="nav-section-title">Core</div>
                <a href="/kiss/guide/routing">Routing</a>
                <a href="/kiss/guide/islands">Islands</a>
                <a href="/kiss/guide/api-routes">API Routes</a>
                <a href="/kiss/guide/api-design">API Design</a>
                <a href="/kiss/guide/ssg">SSG</a>
              </div>
              <div class="nav-section">
                <div class="nav-section-title">Guides</div>
                <a href="/kiss/guide/configuration">Configuration</a>
                <a href="/kiss/guide/error-handling">Error Handling</a>
                <a href="/kiss/guide/security-middleware">Security & Middleware</a>
                <a href="/kiss/guide/testing">Testing</a>
              </div>
              <div class="nav-section">
                <div class="nav-section-title">Reference</div>
                <a href="/kiss/guide/architecture">Architecture</a>
                <a href="/kiss/guide/deployment">Deployment</a>
                <a href="/kiss/styling/web-awesome">Web Awesome</a>
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
      <active-highlight></active-highlight>
      <copy-code></copy-code>
    `
  }
}

customElements.define('app-layout', AppLayout)
