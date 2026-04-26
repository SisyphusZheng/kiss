import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'
import '../../islands/code-block.js'

export class SecurityMiddlewarePage extends LitElement {
  static styles = [pageStyles, css`

    .mw-chain { padding: 1rem; background: var(--kiss-bg-surface);  border-left: 3px solid var(--kiss-border-hover); border-radius: 0 3px 3px; margin: 0.75rem 0; font-size: 0.8125rem; line-height: 1.8; }

`]
  render() {
    return html`
      <kiss-layout currentPath="/guide/security-middleware">
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
          <code-block><pre><code>// vite.config.ts
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
})</code></pre></code-block>

          <h2>Disabling Middleware</h2>
          <code-block><pre><code>kiss({
  middleware: {
    logger: false,          // Disable request logging
    cors: false,            // Disable CORS entirely
    securityHeaders: false, // Disable security headers
  },
})</code></pre></code-block>

          <h2>Security Headers</h2>
          <p>KISS applies these headers via <span class="inline-code">hono/secure-headers</span>:</p>
          <ul>
            <li><span class="inline-code">X-Content-Type-Options: nosniff</span></li>
            <li><span class="inline-code">X-Frame-Options: SAMEORIGIN</span></li>
            <li><span class="inline-code">Referrer-Policy: strict-origin-when-cross-origin</span></li>
            <li><span class="inline-code">Permissions-Policy</span> (restricts browser features)</li>
          </ul>

          <div class="nav-row">
            <a href="/guide/error-handling" class="nav-link">&larr; Error Handling</a>
            <a href="/guide/testing" class="nav-link">Testing &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `
  }
}

customElements.define('page-security-middleware', SecurityMiddlewarePage)
export default SecurityMiddlewarePage
export const tagName = 'page-security-middleware'
