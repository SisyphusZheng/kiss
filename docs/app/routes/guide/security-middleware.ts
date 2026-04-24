import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'

export class SecurityMiddlewarePage extends LitElement {
  static styles = [pageStyles, css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.5rem; color: #fff; }
    .subtitle { color: #666; margin-bottom: 2.5rem; font-size: 0.9375rem; line-height: 1.6; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    p { line-height: 1.7; margin: 0.5rem 0; color: #999; }
    pre { background: #111; color: #c8c8c8; padding: 1rem 1.25rem; border-radius: 3px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: #111; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .mw-chain { padding: 1rem; background: #0f0f0f; border-left: 3px solid #333; border-radius: 0 3px 3px; margin: 0.75rem 0; font-size: 0.8125rem; line-height: 1.8; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.875rem; }
    th, td { border: 1px solid #1a1a1a; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #111; font-weight: 600; color: #ccc; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `]
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
            <a href="/kiss/guide/error-handling" class="nav-link">&larr; Error Handling</a>
            <a href="/kiss/guide/testing" class="nav-link">Testing &rarr;</a>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-security-middleware', SecurityMiddlewarePage)
export default SecurityMiddlewarePage
export const tagName = 'page-security-middleware'
