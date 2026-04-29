/**
 * Contributing Page — KISS Framework Contribution Guide
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../islands/code-block.js';

export class ContributingPage extends LitElement {
  static styles = [
    pageStyles,
    css`
      .layer-diagram {
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
      .commit-types {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
        margin: 1rem 0;
      }
      .commit-type {
        padding: 0.75rem 1rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        font-size: 0.875rem;
      }
      .commit-type code {
        color: var(--kiss-accent);
        font-weight: 600;
      }
    `,
  ];

  render() {
    return html`
      <kiss-layout currentPath="/contributing">
        <div class="container">
          <h1>Contributing to KISS</h1>
          <p class="subtitle">感谢你对 KISS 框架的兴趣！</p>

          <h2>开发环境设置</h2>
          <code-block
          ><pre><code># 克隆仓库
git clone https://github.com/SisyphusZheng/kiss.git
cd kiss

# 安装依赖
deno install

# 运行测试
deno task test

# 启动文档站开发服务器
deno task docs:dev</code></pre></code-block>

          <h2>项目结构</h2>
          <code-block
          ><pre><code>kiss/
├── packages/
│   ├── kiss-core/    # 核心 Vite 插件
│   ├── kiss-rpc/     # RPC 客户端控制器
│   └── kiss-ui/      # UI 插件
├── docs/             # 文档站（自举）
└── scripts/          # 工具脚本</code></pre></code-block>

          <h2>开发规范</h2>

          <h3>代码风格</h3>
          <ul>
            <li>使用 Deno 内置格式化：<code>deno fmt</code></li>
            <li>使用 Deno 内置 lint：<code>deno lint</code></li>
            <li>遵循 KISS Architecture 四约束（K·I·S·S）</li>
          </ul>

          <h3>提交规范</h3>
          <p>使用 Conventional Commits：</p>
          <div class="commit-types">
            <div class="commit-type"><code>feat:</code> 新功能</div>
            <div class="commit-type"><code>fix:</code> 修复 bug</div>
            <div class="commit-type"><code>docs:</code> 文档更新</div>
            <div class="commit-type"><code>refactor:</code> 重构</div>
            <div class="commit-type"><code>test:</code> 测试相关</div>
            <div class="commit-type"><code>chore:</code> 杂项</div>
          </div>

          <h3>分层原则</h3>
          <p>在添加新功能前，检查是否可以用更低层级解决：</p>
          <div class="layer-diagram">L0 HTML5 语义 — 结构、内容、导航
L1 CSS 表现 — 视觉、布局、动画
L2 浏览器平台 API — Clipboard, IntersectionObserver
L3 Hono/Vite/Lit — 路由、构建、组件封装
L4 自研代码 — Island 水合、RPC、插件逻辑

跳过任何一层 = 违反 KISS 架构约束</div>

          <h3>测试</h3>
          <code-block
          ><pre><code># 运行所有测试
deno task test

# 监听模式
deno task test:watch

# 类型检查
deno task typecheck</code></pre></code-block>

          <h2>发布流程</h2>
          <ol>
            <li>更新版本号（packages/*/package.json）</li>
            <li>更新 changelog（docs/app/routes/changelog.ts）</li>
            <li>运行测试：<code>deno task test</code></li>
            <li>发布到 JSR：<code>deno task publish</code></li>
            <li>创建 GitHub Release</li>
          </ol>

          <h2>架构决策记录（ADR）</h2>
          <p>重大架构变更需要创建 ADR 文档：</p>
          <code-block
          ><pre><code># ADR-XXX: 标题

## 状态
提议 / 已接受 / 已废弃

## 背景
为什么需要这个决策

## 决策
我们决定做什么

## 后果
这个决策的影响</code></pre></code-block>

          <h2>问题反馈</h2>
          <ul>
            <li>
              GitHub Issues:
              <a href="https://github.com/SisyphusZheng/kiss/issues" target="_blank"
                >https://github.com/SisyphusZheng/kiss/issues</a
              >
            </li>
            <li>提交前请搜索已有 issue</li>
          </ul>

          <div class="nav-row">
            <a href="/guide/architecture" class="nav-link">&larr; Architecture</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-contributing', ContributingPage);
export default ContributingPage;
export const tagName = 'page-contributing';
