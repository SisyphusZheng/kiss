import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'

export class ApiDesignPage extends LitElement {
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
    .principle { padding: 1rem; background: #0f0f0f; border-left: 3px solid #333; border-radius: 0 3px 3px; margin: 0.75rem 0; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.875rem; }
    th, td { border: 1px solid #1a1a1a; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #111; font-weight: 600; color: #ccc; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `]
  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>API Design</h1>
          <p class="subtitle">Hono routing, type-safe RPC, validation, and error response patterns.</p>

          <h2>Design Principles</h2>
          <div class="principle">
            <strong>Web Standards First</strong> — Route handlers return standard <span class="inline-code">Response</span>, input uses <span class="inline-code">Request</span>/<span class="inline-code">FormData</span><br>
            <strong>Type Safety Throughout</strong> — Zod validation → Hono RPC → client auto-inference, zero codegen<br>
            <strong>Convention over Configuration</strong> — Files in <span class="inline-code">app/routes/api/</span> auto-register as API routes
          </div>

          <h2>Route Conventions</h2>
          <table>
            <thead>
              <tr><th>File</th><th>Route</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><span class="inline-code">api/posts.ts</span></td><td><span class="inline-code">/api/posts</span></td><td>Posts API (Hono sub-app)</td></tr>
              <tr><td><span class="inline-code">api/posts/[id].ts</span></td><td><span class="inline-code">/api/posts/:id</span></td><td>Single post API</td></tr>
              <tr><td><span class="inline-code">api/users/index.ts</span></td><td><span class="inline-code">/api/users</span></td><td>Users list API</td></tr>
            </tbody>
          </table>

          <h2>Type-Safe RPC</h2>
          <p>KISS leverages Hono RPC for end-to-end type safety. No code generation needed:</p>
          <pre><code>// Server: app/routes/api/posts.ts
import { Hono } from 'hono'

const app = new Hono()
  .get('/', (c) => c.json([{ id: 1, title: 'Hello' }]))
  .post('/', async (c) => {
    const body = await c.req.json()
    return c.json({ ok: true }, 201)
  })

export default app
export type AppType = typeof app</code></pre>

          <pre><code>// Client: app/islands/post-list.ts
import { hc } from 'hono/client'
import type { AppType } from '../routes/api/posts.ts'

const client = hc&lt;AppType&gt;('/api/posts')
const res = await client.index.$get()
const posts = await res.json()  // Fully typed!</code></pre>

          <h2>Validation (User Choice)</h2>
          <p>Zod and <span class="inline-code">@hono/zod-validator</span> are NOT framework dependencies — they're your project-level choice:</p>
          <pre><code>import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const schema = z.object({ title: z.string(), body: z.string() })

app.post('/', zValidator('json', schema), async (c) => {
  const data = c.req.valid('json')  // Typed!
  return c.json({ ok: true, data }, 201)
})</code></pre>

          <h2>Error Response Format</h2>
          <p>All KISS errors produce consistent JSON responses:</p>
          <pre><code>{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "status": 400
  }
}</code></pre>

          <div class="nav-row">
            <a href="/kiss/guide/testing" class="nav-link">&larr; Testing</a>
            <a href="/kiss/guide/design-philosophy" class="nav-link">Design Philosophy &rarr;</a>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-api-design', ApiDesignPage)
export default ApiDesignPage
export const tagName = 'page-api-design'
