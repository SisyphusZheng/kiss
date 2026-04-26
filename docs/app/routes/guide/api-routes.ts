import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class ApiRoutesPage extends LitElement {
  static styles = [
    pageStyles,
    css`
    `,
  ];
  render() {
    return html`
      <kiss-layout currentPath="/guide/api-routes">
        <div class="container">
          <h1>API Routes</h1>
          <p class="subtitle">Create backend endpoints using Hono — the HTTP layer of KISS.</p>

          <h2>Create an API Route</h2>
          <code-block
          ><pre><code>// app/routes/api/posts.ts
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

            export default app</code></pre></code-block>

            <h2>With Validation</h2>
            <code-block
            ><pre><code>// app/routes/api/posts.ts
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

              export default app</code></pre></code-block>

              <h2>Type-Safe RPC</h2>
              <p>Use <span class="inline-code">@kissjs/rpc</span> for end-to-end type safety:</p>
              <code-block
              ><pre><code>// Server: export the type
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
                }</code></pre></code-block>

                <div class="nav-row">
                  <a href="/guide/islands" class="nav-link">&larr; Islands</a>
                  <a href="/guide/api-design" class="nav-link">API Design &rarr;</a>
                </div>
              </div>
            </kiss-layout>
          `;
        }
      }

      customElements.define('page-api-routes', ApiRoutesPage);
      export default ApiRoutesPage;
      export const tagName = 'page-api-routes';
