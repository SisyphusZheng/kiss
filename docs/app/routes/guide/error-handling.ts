import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class ErrorHandlingPage extends LitElement {
  static styles = [
    pageStyles,
    css`
      .error-hierarchy {
        padding: 1rem;
        background: var(--kiss-bg-surface);
        border-left: 3px solid var(--wa-color-danger-500, #ef4444);
        border-radius: 0 3px 3px;
        margin: 0.75rem 0;
        font-size: 0.8125rem;
        line-height: 1.8;
      }
    `,
  ];
  render() {
    return html`
      <kiss-layout currentPath="/guide/error-handling">
        <div class="container">
          <h1>Error Handling</h1>
          <p class="subtitle">
            Type-safe error hierarchy, global handlers, and cross-boundary error mapping.
          </p>

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
          <code-block
          ><pre><code>import { NotFoundError, ValidationError } from '@kissjs/core'

          // In an API route handler
          app.get('/api/posts/:id', async (c) => {
            const post = await findPost(c.req.param('id'))
            if (!post) throw new NotFoundError('Post not found')

            const { title } = await c.req.json()
            if (!title) throw new ValidationError('Title is required')

            return c.json(post)
          })</code></pre></code-block>

          <h2>SSR Error Rendering</h2>
          <p>KISS provides <span class="inline-code">renderSsrError()</span> with dev/prod modes:</p>
          <table>
            <thead>
              <tr>
                <th>Mode</th>
                <th>Behavior</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dev</td>
                <td>Full error message + stack trace for debugging</td>
              </tr>
              <tr>
                <td>Prod</td>
                <td>Safe generic error page — no internal details exposed</td>
              </tr>
            </tbody>
          </table>

          <h2>Three-Layer Error Strategy</h2>
          <table>
            <thead>
              <tr>
                <th>Layer</th>
                <th>Scope</th>
                <th>Strategy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SSG (Build-time)</td>
                <td>Build → HTML</td>
                <td>renderSsrError() dev/prod modes. Errors during build, not at runtime.</td>
              </tr>
              <tr>
                <td>Hydration</td>
                <td>Browser → Island</td>
                <td>console.warn + graceful fallback</td>
              </tr>
              <tr>
                <td>RPC</td>
                <td>Client → API</td>
                <td>RpcError with typed error mapping</td>
              </tr>
            </tbody>
          </table>
          <p>
            <strong>Note:</strong> "SSR" in KISS means <em>build-time rendering via @lit-labs/ssr</em>,
            not a runtime server. Errors occur during <span class="inline-code">vite build</span>, never
            in production.
          </p>

          <div class="nav-row">
            <a href="/guide/configuration" class="nav-link">&larr; Configuration</a>
            <a href="/guide/security-middleware" class="nav-link">Security &amp; Middleware &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-error-handling', ErrorHandlingPage);
export default ErrorHandlingPage;
export const tagName = 'page-error-handling';
