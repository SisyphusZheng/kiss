import { LitElement, html, css } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class ApiDesignPage extends LitElement {
  static styles = [pageStyles, css`
    .principle { padding: 1rem; background: var(--kiss-bg-surface);  border-left: 3px solid var(--kiss-border-hover); border-radius: 0 3px 3px 0; margin: 0.75rem 0; font-size: 0.875rem; }
  `];
  render() {
    return html`
      <kiss-layout currentPath="/guide/api-design">
        <div class="container">
          <h1>API 设计</h1>
          <p class="subtitle">Hono 路由、类型安全 RPC、验证和错误响应模式。</p>

          <h2>设计原则</h2>
          <div class="principle">
            <strong>Web 标准优先</strong> —— 路由处理器返回标准 <span class="inline-code">Response</span>，输入使用 <span class="inline-code">Request</span>/<span class="inline-code">FormData</span><br>
            <strong>全链路类型安全</strong> —— Zod 验证 → Hono RPC → 客户端自动推断，零代码生成<br>
            <strong>约定优于配置</strong> —— <span class="inline-code">app/routes/api/</span> 下的文件自动注册为 API 路由
          </div>

          <h2>路由约定</h2>
          <table>
            <thead>
              <tr><th>文件</th><th>路由</th><th>说明</th></tr>
            </thead>
            <tbody>
              <tr><td><span class="inline-code">api/posts.ts</span></td><td><span class="inline-code">/api/posts</span></td><td>Posts API（Hono 子应用）</td></tr>
              <tr><td><span class="inline-code">api/posts/[id].ts</span></td><td><span class="inline-code">/api/posts/:id</span></td><td>单个 post API</td></tr>
              <tr><td><span class="inline-code">api/users/index.ts</span></td><td><span class="inline-code">/api/users</span></td><td>用户列表 API</td></tr>
            </tbody>
          </table>

          <h2>类型安全 RPC</h2>
          <p>KISS 利用 Hono RPC 实现端到端类型安全。无需代码生成：</p>
          <code-block><pre><code>// 服务端：app/routes/api/posts.ts
import { Hono } from 'hono'

const app = new Hono()
  .get('/', (c) => c.json([{ id: 1, title: 'Hello' }]))
  .post('/', async (c) => {
    const body = await c.req.json()
    return c.json({ ok: true }, 201)
  })

export default app
export type AppType = typeof app</code></pre></code-block>

          <code-block><pre><code>// 客户端：app/islands/post-list.ts
import { hc } from 'hono/client'
import type { AppType } from '../routes/api/posts.ts'

const client = hc&lt;AppType&gt;('/api/posts')
const res = await client.index.$get()
const posts = await res.json()  // 完全类型化！</code></pre></code-block>

          <h2>验证（用户选择）</h2>
          <p>Zod 和 <span class="inline-code">@hono/zod-validator</span> 不是框架依赖——它们是你的项目级选择：</p>
          <code-block><pre><code>import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const schema = z.object({ title: z.string(), body: z.string() })

app.post('/', zValidator('json', schema), async (c) => {
  const data = c.req.valid('json')  // 有类型！
  return c.json({ ok: true, data }, 201)
})</code></pre></code-block>

          <h2>错误响应格式</h2>
          <p>所有 KISS 错误产生一致的 JSON 响应：</p>
          <code-block><pre><code>{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "status": 400
  }
}</code></pre></code-block>

          <div class="nav-row">
            <a href="/guide/api-routes" class="nav-link">&larr; API Routes</a>
            <a href="/guide/ssg" class="nav-link">SSG &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-api-design', ApiDesignPage);
export default ApiDesignPage;
export const tagName = 'page-api-design';
