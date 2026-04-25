import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'

export class ApiRoutesPage extends LitElement {
  static styles = [pageStyles, css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.5rem; color: #fff; }
    .subtitle { color: #666; margin-bottom: 2.5rem; font-size: 0.9375rem; line-height: 1.6; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    pre { background: #111; color: #c8c8c8; padding: 1rem 1.25rem; border-radius: 3px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: #111; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `]
  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>API Routes</h1>
          <p class="subtitle">Create backend endpoints using Hono — the HTTP layer of KISS.</p>

          <h2>Create an API Route</h2>
          <pre><code>// app/routes/api/posts.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json([
    { id: 1, title: 'Hello KISS' }
  ])
})

app.post('/', async (c) => {
  const body = await c.req.json()
  return c.json({ id: 2, ...body }, 201)
})

export default app</code></pre>

          <h2>With Validation</h2>
          <pre><code>// app/routes/api/posts.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const schema = z.object({
  title: z.string().min(1),
  body: z.string(),
})

app.post('/', zValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ id: 1, ...data }, 201)
})

export default app</code></pre>

          <h2>Type-Safe RPC</h2>
          <p>Use <span class="inline-code">@kissjs/rpc</span> for end-to-end type safety:</p>
          <pre><code>// Server: export the type
export type AppType = typeof app

// Client: in an Island
import { RpcController } from '@kissjs/rpc'
import { hc } from 'hono/client'
import type { AppType } from '../routes/api/posts'

class MyIsland extends LitElement {
  private rpc = new RpcController(this)
  private client = hc&lt;AppType&gt;('/')

  async loadPosts() {
    const res = await this.rpc.call(() =>
      this.client.api.posts.$get()
    )
  }
}</code></pre>

          <div class="nav-row">
            <a href="/kiss/guide/islands" class="nav-link">&larr; Islands</a>
            <a href="/kiss/guide/api-design" class="nav-link">API Design &rarr;</a>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-api-routes', ApiRoutesPage)
export default ApiRoutesPage
export const tagName = 'page-api-routes'
