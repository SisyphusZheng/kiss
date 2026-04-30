import { LitElement, html, css } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class GettingStartedPage extends LitElement {
  static override styles = [pageStyles, css`
    .step { margin-bottom: 2rem; }
    .step-header { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem; color: var(--kiss-text-primary); }
    .step-desc { color: var(--kiss-text-tertiary); font-size: 0.8125rem; margin-bottom: 0.5rem; }
    .note { background: var(--kiss-bg-surface); border: 1px solid var(--kiss-border); border-radius: 4px; padding: 0.75rem 1rem; font-size: 0.8125rem; color: var(--kiss-text-secondary); margin-top: 1rem; }
    .inline-code { font-family: "SF Mono","Fira Code",monospace; font-size: 0.8125rem; background: var(--kiss-bg-elevated); padding: 0.125rem 0.375rem; border-radius: 3px; }
  `];
  override render() {
    return html`
      <kiss-layout currentPath="/guide/getting-started">
        <div class="container">
          <h1>快速上手</h1>
          <p class="subtitle">一条命令创建、三阶段构建、GitHub Pages 部署。</p>

          <div class="step">
            <h2 class="step-header">1. 创建项目</h2>
            <p class="step-desc">使用 create-kiss CLI 一键生成脚手架 —— 零配置、零选择。</p>
            <code-block><pre><code>deno run -A jsr:@kissjs/create my-app
cd my-app</code></pre></code-block>
          </div>

          <div class="step">
            <h2 class="step-header">2. 启动开发服务器</h2>
            <p class="step-desc">Vite 开发服务器 + Hono SSR，实时刷新。</p>
            <code-block><pre><code>deno task dev</code></pre></code-block>
            <p>打开 <span class="inline-code">localhost:5173</span> 查看页面。</p>
          </div>

          <div class="step">
            <h2 class="step-header">3. 构建（三阶段）</h2>
            <p class="step-desc">KISS 使用三阶段构建管线，分步验证、增量输出。</p>
            <code-block><pre><code># Phase 1 — SSR bundle + build metadata
deno task build

# Phase 2 — Island client chunks
deno task build:client

# Phase 3 — SSG static HTML
deno task build:ssg</code></pre></code-block>
            <div class="note">
              <strong>架构说明：</strong>三阶段各自独立，每阶段输出可作为下一阶段输入。
              Phase 1 产出 SSR bundle 和 <span class="inline-code">.kiss/build-metadata.json</span>；
              Phase 2 将 Island 组件编译为独立 client chunk；
              Phase 3 渲染全部静态 HTML + 注入 hydration 脚本。
            </div>
          </div>

          <div class="step">
            <h2 class="step-header">4. 预览构建产物</h2>
            <code-block><pre><code>deno task preview</code></pre></code-block>
          </div>

          <div class="step">
            <h2 class="step-header">5. 部署到 GitHub Pages</h2>
            <p class="step-desc"><span class="inline-code">dist/</span> 目录为纯静态网站，可直接部署到任意静态托管平台。</p>
            <code-block><pre><code># 示例：gh-pages 分支
cd dist
git init
git add -A
git commit -m "Deploy"
git push -f https://github.com/USER/REPO.git HEAD:gh-pages</code></pre></code-block>
          </div>

          <div class="step">
            <h2 class="step-header">项目结构</h2>
            <code-block><pre><code>my-app/
├── app/
│   ├── routes/          # 页面组件（LitElement）
│   │   ├── index.ts     # 首页 /
│   │   └── ...
│   └── islands/         # 交互式 Island（LitElement）
│       └── my-counter.ts
├── deno.json            # 任务定义 + 依赖
└── vite.config.ts       # KISS 插件配置</code></pre></code-block>
          </div>

          <div class="nav-row">
            <a href="/guide/design-philosophy" class="nav-link">设计哲学 &rarr;</a>
            <a href="/examples" class="nav-link">示例 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-getting-started', GettingStartedPage);
export default GettingStartedPage;
export const tagName = 'page-getting-started';
