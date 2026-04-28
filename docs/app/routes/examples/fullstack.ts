/**
 * Fullstack Demo — KISS Architecture
 *
 * K + I + S + S 四约束完整演示：
 * - SSG + DSD 静态前端
 * - Counter Island（交互）
 * - API Routes（Serverless）
 * - CDN + Serverless 双部署
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';
import '../../islands/counter-island.js';

export class FullstackDemoPage extends LitElement {
  static styles = [
    pageStyles,
    css`
      .demo-container {
        padding: 2rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 8px;
        margin: 1.5rem 0;
        color: var(--kiss-text-primary);
      }
      .demo-container h1 {
        font-size: 2rem;
        margin: 0 0 1rem;
      }
      .api-demo {
        margin-top: 1.5rem;
        padding: 1rem;
        background: var(--kiss-bg-elevated);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
      }
      .api-demo h3 {
        margin: 0 0 0.75rem;
        font-size: 0.9375rem;
        color: var(--kiss-accent);
      }
      .api-response {
        font-family: "SF Mono", "Fira Code", monospace;
        font-size: 0.8125rem;
        color: var(--kiss-text-secondary);
        background: var(--kiss-code-bg);
        padding: 0.75rem;
        border-radius: 4px;
      }
      .counter-demo {
        margin-top: 1.5rem;
        padding: 1rem;
        background: var(--kiss-bg-elevated);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
      }
      .counter-demo h3 {
        margin: 0 0 1rem;
        font-size: 0.9375rem;
        color: var(--kiss-accent);
      }
      .deployment-diagram {
        padding: 1.25rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        margin: 1.5rem 0;
        font-size: 0.8125rem;
        line-height: 1.8;
        font-family: "SF Mono", "Fira Code", monospace;
        white-space: pre;
        overflow-x: auto;
        color: var(--kiss-text-secondary);
      }
    `,
  ];

  render() {
    return html`
      <kiss-layout currentPath="/examples/fullstack">
        <div class="container">
          <h1>全栈示例</h1>
          <p class="subtitle">
            K + I + S + S 四约束：静态前端 + Serverless API
          </p>

          <h2>在线演示</h2>
          <div class="demo-container">
            <h1>KISS 全栈示例</h1>
            <p style="color: var(--kiss-text-tertiary); margin-bottom: 1.5rem;">
              SSG + API Routes + Islands —— 完整的全栈示例。
            </p>

            <div class="counter-demo">
              <h3>交互式 Island 演示</h3>
              <counter-island></counter-island>
            </div>

            <div class="api-demo">
              <h3>API Routes 演示</h3>
              <div class="api-response">
                GET /api/hello → { "message": "Hello from KISS API!" } GET /api/time → { "time":
                "2026-04-26T...", "timestamp": 1745678... } GET /api/echo/:text → { "echo": "your-text" }
              </div>
            </div>
          </div>

          <h2>部署架构</h2>
          <div class="deployment-diagram">
            ┌─────────────────────────────────────────────────────────────────┐ │ 全栈部署 │
            │ │ │ ┌──────────────────┐ ┌──────────────────┐ │ │ │ 静态 dist/ │ │ API 路由 │ │ │ │ │ │
            │ │ │ │ index.html │ │ /api/hello │ │ │ │ + DSD │ │ /api/time │ │ │ │ + Island JS │ │
            /api/echo │ │ │ │ │ │ │ │ │ └──────────────────┘ └──────────────────┘ │ │ │ │ │ │ ▼ ▼ │ │
            ┌──────────────────┐ ┌──────────────────┐ │ │ │ CDN / │ │ Serverless │ │ │ │ GitHub Pages │ │
            Deno Deploy │ │ │ │ Cloudflare │ │ CF Workers │ │ │ │ Pages │ │ Vercel Edge │ │ │
            └──────────────────┘ └──────────────────┘ │ │ │ │ S 约束： 静态文件 + Serverless API │
            └─────────────────────────────────────────────────────────────────┘
          </div>

          <h2>约束验证</h2>
          <table>
            <thead>
              <tr>
                <th>约束</th>
                <th>验证</th>
                <th>实现</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>K</strong> — Knowledge</td>
                <td>✓ 内容在构建时已知</td>
                <td>SSG + DSD 输出</td>
              </tr>
              <tr>
                <td><strong>I</strong> — Isolated</td>
                <td>✓ Counter Island</td>
                <td>Shadow DOM + 懒水合</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Semantic</td>
                <td>✓ DSD 内容可达</td>
                <td>禁用 JS 时内容可见</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Static</td>
                <td>✓ CDN + Serverless</td>
                <td>静态前端 + API Routes</td>
              </tr>
            </tbody>
          </table>

          <h2>API Routes 示例代码</h2>
          <code-block
          ><pre><code>// app/routes/api/index.ts
            import { Hono } from 'hono'

            const app = new Hono()

            app.get('/hello', (c) => c.json({ message: 'Hello from KISS API!' }))
            app.get('/time', (c) => c.json({ time: new Date().toISOString() }))
            app.get('/echo/:text', (c) => c.json({ echo: c.req.param('text') }))

            export default app</code></pre></code-block>

            <div class="nav-row">
              <a href="/examples/minimal-blog" class="nav-link">&larr; Minimal Blog</a>
              <a href="/guide/deployment" class="nav-link">部署 &rarr;</a>
            </div>
          </div>
        </kiss-layout>
      `;
    }
  }

  customElements.define('page-fullstack-demo', FullstackDemoPage);
  export default FullstackDemoPage;
  export const tagName = 'page-fullstack-demo';
