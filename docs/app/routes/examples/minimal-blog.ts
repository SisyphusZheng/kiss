/**
 * Minimal Blog Demo — KISS Architecture
 *
 * K + I + S 约束演示：
 * - SSG + DSD 输出
 * - Theme Island（唯一交互）
 * - aria-current 导航高亮（L0+L1）
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';
// kiss-theme-toggle is registered via packageIslands (no local import needed)

export class MinimalBlogDemoPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .demo-container {
        padding: 2rem;
        background: var(--kiss-bg-base);
        border-radius: 8px;
        margin: 1.5rem 0;
      }
      .demo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .demo-header h1 {
        font-size: 1.5rem;
        margin: 0;
      }
      .post-list {
        display: grid;
        gap: 1rem;
      }
      .post-item {
        padding: 1rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
      }
      .post-item h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
      }
      .post-item p {
        margin: 0;
        color: var(--kiss-text-muted);
        font-size: 0.875rem;
      }
      .nav-highlight-demo {
        display: flex;
        gap: 0.5rem;
        margin: 1rem 0;
      }
      .nav-link-demo {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        color: var(--kiss-text-secondary);
      }
      .nav-link-demo.active {
        background: var(--kiss-bg-surface);
        color: var(--kiss-text-primary);
        font-weight: 600;
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout current-path="/examples/minimal-blog">
        <div class="container">
          <h1>Minimal Blog Demo</h1>
          <p class="subtitle">
            K + I + S 约束：SSG + Theme Island + aria-current 导航
          </p>

          <h2>Live Demo</h2>
          <div class="demo-container">
            <div class="demo-header">
              <h1>My Blog</h1>
              <kiss-theme-toggle></kiss-theme-toggle>
            </div>
            <div class="nav-highlight-demo">
              <a class="nav-link-demo active" aria-current="page">Home</a>
              <a class="nav-link-demo">About</a>
              <a class="nav-link-demo">Archive</a>
            </div>
            <div class="post-list">
              <div class="post-item">
                <h3>理解 KISS 架构</h3>
                <p>K·I·S·S 约束如何强制执行 Jamstack 原则...</p>
              </div>
              <div class="post-item">
                <h3>DSD：缺失的桥梁</h3>
                <p>声明式 Shadow DOM 解决了封装性与可访问性之间的两难...</p>
              </div>
            </div>
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
                <td>✓ Theme Island</td>
                <td>Shadow DOM + localStorage</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Semantic</td>
                <td>✓ aria-current 导航</td>
                <td>L0 HTML + L1 CSS（非 Island）</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Static</td>
                <td>✓ 纯静态文件</td>
                <td>dist/ 部署到 CDN</td>
              </tr>
            </tbody>
          </table>

          <h2>分层原则验证</h2>
          <code-block
          ><pre><code>导航高亮 → aria-current + CSS (L0+L1, 非 Island)
            主题切换 → Island + localStorage (L4, 合法 Island)

            为什么主题切换是 Island？
            - 需要 localStorage API（L2）
            - 需要跨 Shadow DOM 通信（L4）
            - 无法用纯 CSS 实现</code></pre></code-block>

            <div class="nav-row">
              <a href="/examples/hello" class="nav-link">&larr; Hello World</a>
              <a href="/examples/fullstack" class="nav-link">Fullstack &rarr;</a>
            </div>
          </div>
        </kiss-layout>
      `;
    }
  }

  customElements.define('page-minimal-blog-demo', MinimalBlogDemoPage);
  export default MinimalBlogDemoPage;
  export const tagName = 'page-minimal-blog-demo';
