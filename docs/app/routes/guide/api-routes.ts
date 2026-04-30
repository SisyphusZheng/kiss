import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class ApiRoutesPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
    `,
  ];
  override render() {
    return html`
      <kiss-layout currentPath="/guide/api-routes">
        <div class="container">
          <h1>API Routes</h1>
          <p class="subtitle">使用 Hono 创建后端端点——KISS 的 HTTP 层。</p>

          <h2>创建 API Route</h2>
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

          <h2>带验证</h2>
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

          <h2>类型安全 RPC</h2>
          <p>使用 <span class="inline-code">@kissjs/rpc</span> 实现端到端类型安全：</p>
          <code-block
            ><pre><code>// 服务端：导出类型
export type AppType = typeof app

// 客户端：在 Island 中
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
            <a href="/guide/api-design" class="nav-link">API 设计 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-api-routes', ApiRoutesPage);
export default ApiRoutesPage;
export const tagName = 'page-api-routes';
