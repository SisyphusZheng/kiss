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
        border-radius: 0 3px 3px 0;
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
          <h1>错误处理</h1>
          <p class="subtitle">
            类型安全的错误层级、全局处理器、跨边界错误映射。
          </p>

          <h2>设计哲学</h2>
          <ul>
            <li>每个错误都有类型——不使用裸 <span class="inline-code">Error</span></li>
            <li>全局错误处理器捕获一切</li>
            <li>操作性错误 → 结构化响应给用户</li>
            <li>编程错误 → 日志 + 通用 500</li>
            <li>统一的错误格式跨 SSR → 浏览器 → API 边界</li>
          </ul>

          <h2>错误类层级</h2>
          <div class="error-hierarchy">
            <strong>KissError</strong> (基类: code, statusCode, message)<br>
            ├── <strong>NotFoundError</strong> (404)<br>
            ├── <strong>UnauthorizedError</strong> (401)<br>
            ├── <strong>ForbiddenError</strong> (403)<br>
            ├── <strong>ValidationError</strong> (400)<br>
            ├── <strong>ConflictError</strong> (409)<br>
            ├── <strong>RateLimitError</strong> (429)<br>
            ├── <strong>SsrRenderError</strong> (500)<br>
            └── <strong>HydrationError</strong> (500)
          </div>

          <h2>使用错误类</h2>
          <code-block>
            ><pre><code>import { NotFoundError, ValidationError } from '@kissjs/core';

// 在 API 路由处理器中
app.get('/api/posts/:id', async (c) => {
  const post = await findPost(c.req.param('id'));
  if (!post) throw new NotFoundError('Post not found');

  const { title } = await c.req.json();
  if (!title) throw new ValidationError('Title is required');

  return c.json(post);
})</code></pre></code-block>

          <h2>SSR 错误渲染</h2>
          <p>KISS 提供 <span class="inline-code">renderSsrError()</span>，支持开发/生产模式：</p>
          <table>
            <thead>
              <tr>
                <th>模式</th>
                <th>行为</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>开发</td>
                <td>完整错误消息 + 堆栈跟踪用于调试</td>
              </tr>
              <tr>
                <td>生产</td>
                <td>安全的通用错误页面——不暴露内部细节</td>
              </tr>
            </tbody>
          </table>

          <h2>三层错误策略</h2>
          <table>
            <thead>
              <tr>
                <th>层级</th>
                <th>范围</th>
                <th>策略</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>SSG（构建时）</strong></td>
                <td>构建 → HTML</td>
                <td>renderSsrError() 开发/生产模式。错误在构建时发生，不在运行时。</td>
              </tr>
              <tr>
                <td><strong>Hydration</strong></td>
                <td>浏览器 → Island</td>
                <td>console.warn + 优雅回退</td>
              </tr>
              <tr>
                <td><strong>RPC</strong></td>
                <td>客户端 → API</td>
                <td>RpcError 带类型化错误映射</td>
              </tr>
            </tbody>
          </table>
          <p>
            <strong>注意：</strong> KISS 中的"SSR"指的是<span class="inline-code">@lit-labs/ssr</span> 的<em>构建时渲染</em>，
            不是运行时服务器。错误在 <span class="inline-code">vite build</span> 期间发生，从不在生产环境中。
          </p>

          <div class="nav-row">
            <a href="/guide/configuration" class="nav-link">&larr; 配置</a>
            <a href="/guide/security-middleware" class="nav-link">安全 &amp; 中间件 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-error-handling', ErrorHandlingPage);
export default ErrorHandlingPage;
export const tagName = 'page-error-handling';
