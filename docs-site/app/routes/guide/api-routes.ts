import { LitElement, html, css } from 'lit'
import '../../components/layout.js'

export class ApiRoutesPage extends LitElement {
  static styles = css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
    .subtitle { color: var(--wa-color-neutral-500, #737373); margin-bottom: 2rem; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    pre { background: var(--wa-color-neutral-900, #171717); color: var(--wa-color-neutral-100, #f5f5f5); padding: 1rem 1.25rem; border-radius: var(--wa-border-radius-lg, 8px); overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: var(--wa-color-neutral-100, #f5f5f5); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `

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
            <wa-button href="/kiss/guide/ssg">&larr; SSG</wa-button>
            <wa-button href="/kiss/guide/design-philosophy">Philosophy &rarr;</wa-button>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-api-routes', ApiRoutesPage)
export default ApiRoutesPage
export const tagName = 'page-api-routes'
