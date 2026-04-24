import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'

export class ErrorHandlingPage extends LitElement {
  static styles = [pageStyles, css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.5rem; color: #fff; }
    .subtitle { color: #666; margin-bottom: 2.5rem; font-size: 0.9375rem; line-height: 1.6; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    h3 { font-size: 1rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #ccc; }
    p { line-height: 1.7; margin: 0.5rem 0; color: #999; }
    pre { background: #111; color: #c8c8c8; padding: 1rem 1.25rem; border-radius: 3px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: #111; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .error-hierarchy { padding: 1rem; background: #0f0f0f; border-left: 3px solid var(--wa-color-danger-500, #ef4444); border-radius: 0 3px 3px; margin: 0.75rem 0; font-size: 0.8125rem; line-height: 1.8; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.875rem; }
    th, td { border: 1px solid #1a1a1a; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #111; font-weight: 600; color: #ccc; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `]
  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>Error Handling</h1>
          <p class="subtitle">Type-safe error hierarchy, global handlers, and cross-boundary error mapping.</p>

          <h2>Design Philosophy</h2>
          <ul>
            <li>Every error has a type — no bare <span class="inline-code">Error</span></li>
            <li>Global error handler catches everything</li>
            <li>Operational errors → structured response to users</li>
            <li>Programming errors → log + generic 500</li>
            <li>Unified error format across SSR → Browser → API boundaries</li>
          </ul>

          <h2>Error Class Hierarchy</h2>
          <div class="error-hierarchy">
            <strong>KissError</strong> (base: code, statusCode, message)<br>
            ├── <strong>NotFoundError</strong> (404)<br>
            ├── <strong>UnauthorizedError</strong> (401)<br>
            ├── <strong>ForbiddenError</strong> (403)<br>
            ├── <strong>ValidationError</strong> (400)<br>
            ├── <strong>ConflictError</strong> (409)<br>
            ├── <strong>RateLimitError</strong> (429)<br>
            ├── <strong>SsrRenderError</strong> (500)<br>
            └── <strong>HydrationError</strong> (500)
          </div>

          <h2>Using Error Classes</h2>
          <pre><code>import { NotFoundError, ValidationError } from '@kissjs/core'

// In an API route handler
app.get('/api/posts/:id', async (c) => {
  const post = await findPost(c.req.param('id'))
  if (!post) throw new NotFoundError('Post not found')

  const { title } = await c.req.json()
  if (!title) throw new ValidationError('Title is required')

  return c.json(post)
})</code></pre>

          <h2>SSR Error Rendering</h2>
          <p>KISS provides <span class="inline-code">renderSsrError()</span> with dev/prod modes:</p>
          <table>
            <thead>
              <tr><th>Mode</th><th>Behavior</th></tr>
            </thead>
            <tbody>
              <tr><td>Dev</td><td>Full error message + stack trace for debugging</td></tr>
              <tr><td>Prod</td><td>Safe generic error page — no internal details exposed</td></tr>
            </tbody>
          </table>

          <h2>Three-Layer Error Strategy</h2>
          <table>
            <thead>
              <tr><th>Layer</th><th>Scope</th><th>Strategy</th></tr>
            </thead>
            <tbody>
              <tr><td>SSR</td><td>Server → HTML</td><td>renderSsrError() dev/prod modes</td></tr>
              <tr><td>Hydration</td><td>Browser → Island</td><td>console.warn + graceful fallback</td></tr>
              <tr><td>RPC</td><td>Client → API</td><td>RpcError with typed error mapping</td></tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/kiss/guide/api-routes" class="nav-link">&larr; API Routes</a>
            <a href="/kiss/guide/security-middleware" class="nav-link">Security &amp; Middleware &rarr;</a>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-error-handling', ErrorHandlingPage)
export default ErrorHandlingPage
export const tagName = 'page-error-handling'
