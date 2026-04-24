import { LitElement, html, css } from '@kissjs/core'
import '../../components/layout.js'

export class SecurityMiddlewarePage extends LitElement {
  static styles = css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
    .subtitle { color: var(--wa-color-neutral-500, #737373); margin-bottom: 2rem; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    p { line-height: 1.7; margin: 0.5rem 0; }
    pre { background: var(--wa-color-neutral-900, #171717); color: var(--wa-color-neutral-100, #f5f5f5); padding: 1rem 1.25rem; border-radius: var(--wa-border-radius-lg, 8px); overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: var(--wa-color-neutral-100, #f5f5f5); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .mw-chain { padding: 1rem; background: var(--wa-color-neutral-50, #fafafa); border-left: 3px solid var(--wa-color-primary-500, #3b82f6); border-radius: 0 var(--wa-border-radius-md, 6px) var(--wa-border-radius-md, 6px); margin: 0.75rem 0; font-size: 0.8125rem; line-height: 1.8; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.875rem; }
    th, td { border: 1px solid var(--wa-color-neutral-200, #e5e7eb); padding: 0.5rem 0.75rem; text-align: left; }
    th { background: var(--wa-color-neutral-50, #fafafa); font-weight: 600; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `

  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>Security &amp; Middleware</h1>
          <p class="subtitle">Security headers, CORS, rate limiting, and middleware chain order.</p>

          <h2>Middleware Chain</h2>
          <p>KISS auto-registers middleware in a standard order. Earlier middleware has wider scope:</p>
          <div class="mw-chain">
            Request → RequestID → Logger → CORS → SecurityHeaders<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ RateLimit → BodyParse → Auth → Validation → Handler<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ ErrorHandler → Response
          </div>

          <h2>Default Middleware</h2>
          <table>
            <thead>
              <tr><th>Middleware</th><th>Scope</th><th>Default</th></tr>
            </thead>
            <tbody>
              <tr><td>Request ID</td><td>All routes</td><td>Enabled</td></tr>
              <tr><td>Logger</td><td>All routes</td><td>Enabled</td></tr>
              <tr><td>CORS</td><td>All routes</td><td>localhost allowed in dev</td></tr>
              <tr><td>Security Headers</td><td>All routes</td><td>Enabled (XSS, clickjacking, etc.)</td></tr>
            </tbody>
          </table>

          <h2>Configuring CORS</h2>
          <p>CORS origin is configured via <span class="inline-code">kiss()</span> options — no <span class="inline-code">process.env</span>:</p>
          <pre><code>// vite.config.ts
import { kiss } from '@kissjs/core'

export default defineConfig({
  plugins: [
    kiss({
      middleware: {
        corsOrigin: 'https://myapp.com',   // string
        // corsOrigin: ['https://a.com', 'https://b.com'],  // array
        // corsOrigin: (origin) => origin,  // function
      },
    }),
  ],
})</code></pre>

          <h2>Disabling Middleware</h2>
          <pre><code>kiss({
  middleware: {
    logger: false,          // Disable request logging
    cors: false,            // Disable CORS entirely
    securityHeaders: false, // Disable security headers
  },
})</code></pre>

          <h2>Security Headers</h2>
          <p>KISS applies these headers via <span class="inline-code">hono/secure-headers</span>:</p>
          <ul>
            <li><span class="inline-code">X-Content-Type-Options: nosniff</span></li>
            <li><span class="inline-code">X-Frame-Options: SAMEORIGIN</span></li>
            <li><span class="inline-code">Referrer-Policy: strict-origin-when-cross-origin</span></li>
            <li><span class="inline-code">Permissions-Policy</span> (restricts browser features)</li>
          </ul>

          <div class="nav-row">
            <wa-button href="/kiss/guide/error-handling">&larr; Error Handling</wa-button>
            <wa-button href="/kiss/guide/testing">Testing &rarr;</wa-button>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-security-middleware', SecurityMiddlewarePage)
export default SecurityMiddlewarePage
export const tagName = 'page-security-middleware'
