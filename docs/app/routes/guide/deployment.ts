import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class DeploymentPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .platform-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1rem 0 1.5rem;
      }
      .platform-card {
        padding: 1rem 1.25rem;
        border: 1px solid var(--kiss-border);
        border-radius: 3px;
      }
      .platform-card h3 {
        margin: 0 0 0.5rem;
        font-size: 0.9375rem;
        color: var(--kiss-text-primary);
      }
      .platform-card p {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--kiss-text-secondary);
      }
    `,
  ];
  override render() {
    return html`
      <kiss-layout currentPath="/guide/deployment">
        <div class="container">
          <h1>部署</h1>
          <p class="subtitle">
            构建一次，随处部署。KISS 架构（S：静态）—— 静态前端 + Serverless APIs。
          </p>

          <h2>构建</h2>
          <code-block>
            <pre><code># KISS 三阶段构建管线
deno task build          # Phase 1 — SSR bundle
deno task build:client   # Phase 2 — Island client chunks
deno task build:ssg      # Phase 3 — Static HTML + 404 page
# 输出：dist/ 目录，包含静态 HTML + island JS + 404.html</code></pre></code-block>
          <p>
            KISS 的 S 约束（静态）确保构建输出就是最终产品。三阶段管线
            分布验证：每一阶段产出下一阶段的输入，<span class="inline-code">.kiss/build-metadata.json</span>
            在阶段间传递配置。
          </p>

          <h2>全栈架构</h2>
          <p>KISS 架构的 S 约束意味着两个独立的部署目标：</p>
          <table>
            <thead>
              <tr>
                <th>组件</th>
                <th>内容</th>
                <th>部署到</th>
                <th>扩展</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>静态前端</strong></td>
                <td>dist/（HTML + DSD + Island JS）</td>
                <td>CDN / GitHub Pages / S3</td>
                <td>全局边缘缓存</td>
              </tr>
              <tr>
                <td><strong>API Routes</strong></td>
                <td>Hono handlers</td>
                <td>Serverless functions</td>
                <td>按需自动扩展</td>
              </tr>
            </tbody>
          </table>
          <p>
            静态文件和 API 函数解耦。前端部署到最便宜的主机；
            API 部署到 Serverless 平台，独立扩展。
          </p>

          <h2>静态前端部署</h2>
          <p>
            KISS 架构只生成静态文件。<span class="inline-code">dist/</span>
            目录包含 HTML（带 DSD）和 island JS 包。部署到任何静态主机。
          </p>

          <div class="platform-grid">
            <div class="platform-card">
              <h3>GitHub Pages</h3>
              <p>在 vite.config.ts 中设置 base 为 /repo-name/</p>
            </div>
            <div class="platform-card">
              <h3>Cloudflare Pages</h3>
              <p>指向 dist/ 目录</p>
            </div>
            <div class="platform-card">
              <h3>Vercel</h3>
              <p>Framework: Other，output: dist/</p>
            </div>
            <div class="platform-card">
              <h3>Netlify</h3>
              <p>Publish directory: dist/</p>
            </div>
            <div class="platform-card">
              <h3>S3 + CloudFront</h3>
              <p>上传 dist/ 到 S3 桶</p>
            </div>
            <div class="platform-card">
              <h3>任何静态主机</h3>
              <p>只需上传 dist/</p>
            </div>
          </div>

          <h2>API Routes 部署</h2>
          <p>
            Hono API routes 可以作为 Serverless 函数部署到任何支持
            JavaScript 的平台：
          </p>
          <div class="platform-grid">
            <div class="platform-card">
              <h3>Deno Deploy</h3>
              <p>原生 Hono 支持，零配置</p>
            </div>
            <div class="platform-card">
              <h3>Cloudflare Workers</h3>
              <p>Hono 内置 adapter</p>
            </div>
            <div class="platform-card">
              <h3>Vercel Edge Functions</h3>
              <p>Hono adapter 可用</p>
            </div>
            <div class="platform-card">
              <h3>AWS Lambda</h3>
              <p>通过 @hono/aws-lambda adapter</p>
            </div>
          </div>

          <h3>API Route 示例</h3>
          <code-block>
            <pre><code>// app/routes/api/posts.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.json({ posts: [] }));

export default app;
export type AppType = typeof app;</code></pre></code-block>

          <h2>GitHub Pages 设置</h2>
          <code-block>
            <pre><code>// vite.config.ts
export default defineConfig({
  base: '/my-repo/',
  plugins: [kiss()],
})</code></pre></code-block>

          <p>
            添加一个 GitHub Actions workflow 在推送 main 时构建并部署。参见本仓库的 <span
              class="inline-code">.github/workflows/deploy.yml</span> 获取完整示例。
          </p>

          <h2>为什么没有 Server 模式？</h2>
          <p>
            KISS 架构的 S 约束——<strong>构建产物仅为纯静态文件</strong>——意味着
            构建输出就是最终产品。生产环境中没有 SSR 运行时。这不是
            限制；这是一种确保以下目标的规范：
          </p>
          <ul>
            <li>零服务器维护成本</li>
            <li>全球 CDN 级性能</li>
            <li>无需 JavaScript 即可访问内容（DSD）</li>
            <li>部署到最便宜的主机</li>
            <li>静态和动态独立扩展</li>
          </ul>
          <p>
            动态数据属于 API Routes，不属于单体服务器。这就是 Jamstack 的方式——
            KISS 架构将其作为 S 约束强制执行，而非约定。
          </p>

          <div class="nav-row">
            <a href="/guide/testing" class="nav-link">&larr; 测试</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-deployment', DeploymentPage);
export default DeploymentPage;
export const tagName = 'page-deployment';
