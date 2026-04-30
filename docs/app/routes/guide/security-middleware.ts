import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class SecurityMiddlewarePage extends LitElement {
  static override styles = [pageStyles, css`
    .mw-chain { padding: 1rem; background: var(--kiss-bg-surface); border-left: 3px solid var(--kiss-border-hover); border-radius: 0 3px 3px 0; margin: 0.75rem 0; font-size: 0.8125rem; line-height: 1.8; }
  `];
  override render() {
    return html`
      <kiss-layout currentPath="/guide/security-middleware">
        <div class="container">
          <h1>安全 &amp; 中间件</h1>
          <p class="subtitle">安全请求头、CORS、限流、以及中间件链执行顺序。</p>

          <h2>中间件链</h2>
          <p>KISS 按标准顺序自动注册中间件。越早注册的中间件作用域越广：</p>
          <div class="mw-chain">
            请求 → RequestID → Logger → CORS → SecurityHeaders<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ RateLimit → BodyParse → Auth → Validation → Handler<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ ErrorHandler → Response
          </div>

          <h2>默认中间件</h2>
          <table>
            <thead>
              <tr><th>中间件</th><th>作用域</th><th>默认</th></tr>
            </thead>
            <tbody>
              <tr><td>Request ID</td><td>所有路由</td><td>启用</td></tr>
              <tr><td>Logger</td><td>所有路由</td><td>启用</td></tr>
              <tr><td>CORS</td><td>所有路由</td><td>开发环境允许 localhost</td></tr>
              <tr><td>Security Headers</td><td>所有路由</td><td>启用（XSS、点击劫持等）</td></tr>
            </tbody>
          </table>

          <h2>配置 CORS</h2>
          <p>CORS 源通过 <span class="inline-code">kiss()</span> 选项配置——无需 <span class="inline-code">process.env</span>：</p>
          <code-block><pre><code>// vite.config.ts
import { kiss } from '@kissjs/core';

export default defineConfig({
  plugins: [
    kiss({
      middleware: {
        corsOrigin: 'https://myapp.com',   // 字符串
        // corsOrigin: ['https://a.com', 'https://b.com'],  // 数组
        // corsOrigin: (origin) => origin,  // 函数
      },
    }),
  ],
})</code></pre></code-block>

          <h2>禁用中间件</h2>
          <code-block><pre><code>kiss({
  middleware: {
    logger: false,          // 禁用请求日志
    cors: false,            // 完全禁用 CORS
    securityHeaders: false, // 禁用安全请求头
  },
})</code></pre></code-block>

          <h2>安全请求头</h2>
          <p>KISS 通过 <span class="inline-code">hono/secure-headers</span> 应用以下请求头：</p>
          <ul>
            <li><span class="inline-code">X-Content-Type-Options: nosniff</span></li>
            <li><span class="inline-code">X-Frame-Options: SAMEORIGIN</span></li>
            <li><span class="inline-code">Referrer-Policy: strict-origin-when-cross-origin</span></li>
            <li><span class="inline-code">Permissions-Policy</span>（限制浏览器特性）</li>
          </ul>

          <div class="nav-row">
            <a href="/guide/testing" class="nav-link">&larr; 测试</a>
            <a href="/guide/deployment" class="nav-link">部署 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-security-middleware', SecurityMiddlewarePage);
export default SecurityMiddlewarePage;
export const tagName = 'page-security-middleware';
