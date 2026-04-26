/**
 * Examples Gallery — KISS Architecture in Action
 *
 * 展示 KISS 框架的三个范式继承：
 * - Jamstack：静态前端 + Serverless API
 * - Islands Architecture：按需水合的交互岛屿
 * - Progressive Enhancement：语义基线，无 JS 可用
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';
import '@kissjs/ui/kiss-card';
import '@kissjs/ui/kiss-button';

export class ExamplesPage extends LitElement {
  static styles = [
    pageStyles,
    css`
      .example-grid {
        display: grid;
        gap: 1.5rem;
        margin: 1.5rem 0;
      }
      .example-card {
        padding: 1.5rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        transition: border-color 0.2s ease;
      }
      .example-card:hover {
        border-color: var(--kiss-border-hover);
      }
      .example-card h3 {
        margin: 0 0 0.5rem;
        font-size: 1.125rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .example-card .tag {
        font-size: 0.6875rem;
        padding: 0.125rem 0.375rem;
        background: var(--kiss-code-bg);
        border-radius: 3px;
        font-weight: 500;
      }
      .example-card .tag.k {
        color: var(--kiss-accent);
      }
      .example-card .tag.i {
        color: var(--kiss-accent-dim);
      }
      .example-card .tag.s1 {
        color: var(--kiss-text-secondary);
      }
      .example-card .tag.s2 {
        color: var(--kiss-text-tertiary);
      }
      .example-card p {
        margin: 0.5rem 0 1rem;
        color: var(--kiss-text-secondary);
        font-size: 0.9375rem;
      }
      .constraint-badges {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }
      .constraint-badge {
        padding: 0.25rem 0.5rem;
        background: var(--kiss-bg-base);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        font-size: 0.75rem;
        font-family: "SF Mono", "Fira Code", monospace;
      }
      .architecture-diagram {
        padding: 1.5rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        margin: 1.5rem 0;
      }
      .arch-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .arch-row:last-child {
        margin-bottom: 0;
      }
      .arch-label {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
        min-width: 120px;
      }
      .arch-value {
        font-size: 0.8125rem;
        color: var(--kiss-text-secondary);
      }
      .arch-divider {
        border: none;
        border-top: 1px solid var(--kiss-border);
        margin: 1rem 0;
      }
      .kiss-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin: 0.75rem 0;
      }
      .kiss-letter {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: 1px solid var(--kiss-border-hover);
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--kiss-text-primary);
        background: var(--kiss-bg-base);
      }
      .kiss-desc {
        font-size: 0.8125rem;
        color: var(--kiss-text-secondary);
        margin-left: 0.25rem;
        line-height: 28px;
      }
      .nav-links {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
      }
    `,
  ];

  render() {
    return html`
      <kiss-layout currentPath="/examples">
        <div class="container">
          <h1>Examples</h1>
          <p class="subtitle">
            KISS Architecture 实战 — 三范式继承 + 四约束验证
          </p>

          <h2>KISS Architecture = Jamstack</h2>
          <p>
            KISS 架构是唯一全链路 Web Standards 的 Jamstack 实现：
          </p>

          <div class="architecture-diagram">
            <div class="arch-row">
              <span class="arch-label">Jamstack</span>
              <span class="arch-value">Static-first deployment model — SSG + CDN</span>
            </div>
            <div class="arch-row">
              <span class="arch-label">Islands</span>
              <span class="arch-value">Isolated interactive components in Shadow DOM</span>
            </div>
            <div class="arch-row">
              <span class="arch-label">Progressive</span>
              <span class="arch-value">Content first, enhancement second — no JS baseline</span>
            </div>
            <hr class="arch-divider" />
            <div class="kiss-row">
              <span class="kiss-letter">K</span><span class="kiss-desc">Knowledge — SSG + DSD</span>
            </div>
            <div class="kiss-row">
              <span class="kiss-letter">I</span><span class="kiss-desc"
              >Isolated — Islands + Shadow DOM</span>
            </div>
            <div class="kiss-row">
              <span class="kiss-letter">S</span><span class="kiss-desc">Semantic — No-JS baseline</span>
            </div>
            <div class="kiss-row">
              <span class="kiss-letter">S</span><span class="kiss-desc">Static — CDN + Serverless</span>
            </div>
          </div>

          <h2>示例项目</h2>
          <div class="example-grid">
            <div class="example-card">
              <h3>
                Hello World
                <span class="tag k">K</span>
                <span class="tag s1">S</span>
              </h3>
              <div class="constraint-badges">
                <span class="constraint-badge">SSG + DSD</span>
                <span class="constraint-badge">零运行时</span>
              </div>
              <p>
                最小化 KISS 应用。展示 SSG + DSD 输出，内容在 JS 加载前可见。 使用 @kissjs/ui 组件。
              </p>
              <code-block
              ><pre><code>deno run -A npm:vite build
                # 输出: dist/index.html (含 DSD)</code></pre></code-block>
              <div class="nav-links">
                <kiss-button size="sm" href="/examples/hello">查看 Demo</kiss-button>
                <kiss-button
                  size="sm"
                  variant="ghost"
                  href="https://github.com/SisyphusZheng/kiss/tree/main/docs/app/routes/examples/hello"
                >源码</kiss-button>
              </div>
            </div>

            <div class="example-card">
              <h3>
                Minimal Blog
                <span class="tag k">K</span>
                <span class="tag i">I</span>
                <span class="tag s1">S</span>
              </h3>
              <div class="constraint-badges">
                <span class="constraint-badge">SSG</span>
                <span class="constraint-badge">Theme Island</span>
                <span class="constraint-badge">aria-current</span>
              </div>
              <p>
                静态博客示例。主题切换是唯一 Island，使用 localStorage 持久化。 导航高亮用 aria-current +
                CSS（L0+L1），零 JS。
              </p>
              <div class="nav-links">
                <kiss-button size="sm" href="/examples/minimal-blog">查看 Demo</kiss-button>
                <kiss-button
                  size="sm"
                  variant="ghost"
                  href="https://github.com/SisyphusZheng/kiss/tree/main/docs/app/routes/examples/minimal-blog"
                >源码</kiss-button>
              </div>
            </div>

            <div class="example-card">
              <h3>
                Fullstack
                <span class="tag k">K</span>
                <span class="tag i">I</span>
                <span class="tag s1">S</span>
                <span class="tag s2">S</span>
              </h3>
              <div class="constraint-badges">
                <span class="constraint-badge">SSG + DSD</span>
                <span class="constraint-badge">API Routes</span>
                <span class="constraint-badge">Counter Island</span>
                <span class="constraint-badge">Serverless</span>
              </div>
              <p>
                全栈示例。静态前端 + Serverless API Routes。 展示 KISS 架构的完整四约束：静态文件部署到
                CDN，API 部署到 Serverless。
              </p>
              <code-block
              ><pre><code># 部署架构
                dist/           → CDN / GitHub Pages
                api/            → Deno Deploy / CF Workers</code></pre></code-block>
              <div class="nav-links">
                <kiss-button size="sm" href="/examples/fullstack">查看 Demo</kiss-button>
                <kiss-button
                  size="sm"
                  variant="ghost"
                  href="https://github.com/SisyphusZheng/kiss/tree/main/docs/app/routes/examples/fullstack"
                >源码</kiss-button>
              </div>
            </div>
          </div>

          <h2>四约束验证清单</h2>
          <p>每个示例必须通过 K·I·S·S 四约束审查：</p>
          <code-block
          ><pre><code>K — 内容需要运行时获取？  → 应在构建时预渲染 (SSG + DSD)
            I — 新增了全局 JS？       → 必须封装为 Island (Shadow DOM)
            S — Island 禁用 JS 可用？ → 必须有语义 HTML 基线
            S — 引入了服务端进程？     → 只允许静态文件 + Serverless API</code></pre></code-block>

            <div class="nav-row">
              <a href="/styling/kiss-ui" class="nav-link">&larr; @kissjs/ui</a>
              <a href="/guide/deployment" class="nav-link">Deployment &rarr;</a>
            </div>
          </div>
        </kiss-layout>
      `;
    }
  }

  customElements.define('page-examples', ExamplesPage);
  export default ExamplesPage;
  export const tagName = 'page-examples';
