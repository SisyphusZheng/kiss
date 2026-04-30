/**
 * Roadmap Page — KISS Framework Development Roadmap
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../islands/code-block.js';

export class RoadmapPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .phase-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.875rem;
      }
      .phase-table th,
      .phase-table td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--kiss-border);
      }
      .phase-table th {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
      }
      .phase-table td:first-child {
        font-weight: 600;
        color: var(--kiss-text-primary);
      }
      .status-done {
        color: var(--kiss-accent);
        font-weight: 500;
      }
      .status-wip {
        color: var(--kiss-text-secondary);
        font-weight: 500;
      }
      .task-list {
        list-style: none;
        padding: 0;
        margin: 1rem 0;
      }
      .task-list li {
        padding: 0.5rem 0;
        padding-left: 1.5rem;
        position: relative;
        color: var(--kiss-text-secondary);
        font-size: 0.875rem;
      }
      .task-list li::before {
        content: "✓";
        position: absolute;
        left: 0;
        color: var(--kiss-accent);
        font-weight: 700;
      }
      .tech-debt-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.875rem;
      }
      .tech-debt-table th,
      .tech-debt-table td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--kiss-border);
      }
      .tech-debt-table th {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
      }
      .priority-high {
        color: var(--kiss-accent);
      }
      .priority-medium {
        color: var(--kiss-accent-dim);
      }
      .priority-low {
        color: var(--kiss-text-tertiary);
      }
      .architecture-diagram {
        padding: 1.5rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        margin: 1.5rem 0;
        font-size: 0.75rem;
        line-height: 1.6;
        font-family: "SF Mono", "Fira Code", monospace;
        white-space: pre;
        overflow-x: auto;
        color: var(--kiss-text-secondary);
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/roadmap">
        <div class="container">
          <h1>开发路线图</h1>
          <p class="subtitle">
            KISS 架构：Knowledge · Isolated · Semantic · Static — 从 PoC 到 v1.0
          </p>

          <h2>里程碑概览</h2>
          <table class="phase-table">
            <thead>
              <tr>
                <th>阶段</th>
                <th>名称</th>
                <th>核心目标</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Phase 0</td>
                <td>PoC</td>
                <td>技术可行性验证</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 1</td>
                <td>Alpha</td>
                <td>核心插件包可用</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 2</td>
                <td>工程化补齐</td>
                <td>P0/P1 修复 + 架构重构</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 3</td>
                <td>文档整合</td>
                <td>docs-site → docs</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 4</td>
                <td>KISS Architecture 落地</td>
                <td>K·I·S·S 四约束 + Jamstack 对齐</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 5</td>
                <td>UI 革命与生态验证</td>
                <td>@kissjs/ui + 设计系统</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 6</td>
                <td>架构审计与修复</td>
                <td>P0/P1 问题清零 + Dogfooding</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 7</td>
                <td>文档站自举</td>
                <td>docs 站使用自研 kiss-ui 组件</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 8</td>
                <td>v0.3.x — 工程重构</td>
                <td>Package Islands + 3-phase build + KISS renderer</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 9</td>
                <td>v0.3.4 — 代码审查</td>
                <td>全量 audit + CI 并行 + 35+ 项修复</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 10</td>
                <td>v0.4.0 — PWA + 生态</td>
                <td>PWA 支持、博客模块、在线文档</td>
                <td>进行中</td>
              </tr>
              <tr>
                <td>Phase 11</td>
                <td>v1.0 — .kiss Compiler</td>
                <td>零运行时编译器、消灭 Lit</td>
                <td>规划中</td>
              </tr>
            </tbody>
          </table>

          <h2>Phase 5：UI 革命与生态验证（已完成）</h2>

          <h3>5A: 品牌视觉 + 设计系统页面</h3>
          <ul class="task-list">
            <li>首页风格改造 — 纯黑背景、高对比度</li>
            <li>品牌色统一 — Logo/Nav hover/Sidebar active 全局统一</li>
            <li>UI 设计系统页面 — /ui 路由，展示 Design Tokens</li>
            <li>导航栏添加 UI 标签 — Docs | UI | JSR | GitHub</li>
            <li>自定义域名修复 — base path 从 /kiss/ 改为 /</li>
          </ul>

          <h3>5B: @kissjs/ui 组件库实现</h3>
          <ul class="task-list">
            <li>@kissjs/ui 重构 — 基于 Lit 构建自有 Web Components</li>
            <li>核心组件：kiss-button, kiss-card, kiss-input, kiss-code-block, kiss-layout</li>
            <li>文档站用 @kissjs/ui 重写 — dogfooding</li>
            <li>迁移示例文件 — examples/minimal-blog + examples/hello 迁移到 static properties</li>
            <li>发布 @kissjs/ui@0.1.4 — JSR 发布</li>
          </ul>

          <h2>Phase 6：架构审计与修复（已完成）</h2>

          <h3>6A: P0 Bug 修复</h3>
          <ul class="task-list">
            <li>allNoExternal 未使用 — 修复 Vite SSR 模块解析</li>
            <li>userResolveAlias 类型不匹配 — 支持 Record 和 Alias[] 两种格式</li>
            <li>Island 扫描配置错误 — 移动到正确目录，文件名匹配 tag name</li>
          </ul>

          <h3>6B: P1 问题清理</h3>
          <ul class="task-list">
            <li>code-block Island 主题适配 — CSS 变量替换硬编码颜色</li>
            <li>kiss-layout 导航补全 — 添加 Examples + Project sections</li>
            <li>hydrationStrategy 选项移除 — 删除未实现选项</li>
            <li>测试覆盖扩展 — kiss-rpc + kiss-ui 测试集成</li>
            <li>kiss-docs-kit 空壳删除 — 移除未使用包</li>
            <li>logger.ts 删除 — 移除未使用模块</li>
            <li>README 版本更新 — core 0.1.6, rpc 0.1.3, ui 0.1.4</li>
          </ul>

          <h3>6C: 体验优化</h3>
          <ul class="task-list">
            <li>docs 站 dogfooding — 25 个路由使用 kiss-layout</li>
            <li>组件导入统一 — @kissjs/ui/kiss-layout 替代本地组件</li>
            <li>构建验证通过 — 25 pages, 3 islands detected</li>
            <li>deno fmt/lint 通过 — 代码风格统一</li>
          </ul>

          <h2>Phase 8：v0.3.0 工程重构（已完成）</h2>
          <ul class="task-list">
            <li>Package Islands 自动检测 — npm/JSR 包可导出 Islands</li>
            <li>KissRenderer 实现 — 替代 Hono 默认 Renderer</li>
            <li>KissBuildContext 架构 — 替代闭包共享可变状态</li>
            <li>EntryDescriptor + renderEntry 模板化 — 替代 hono-entry.ts 字符串拼接</li>
            <li>hydrationStrategy 四策略 — eager / lazy / idle / visible</li>
            <li>@kissjs/ui 构建产出去 @kissjs/core 依赖 — 依赖反转</li>
          </ul>

          <h3>8A: 三阶段构建管线</h3>
          <ul class="task-list">
            <li>Phase 1: vite build → SSR bundle + .kiss/build-metadata.json</li>
            <li>Phase 2: build:client → dist/client/islands/*.js</li>
            <li>Phase 3: build:ssg → dist/*.html + 静态 SSG</li>
            <li>消除 closeBundle 嵌套 Vite 导致 watch 模式 breakage</li>
            <li>Vite manifest 集成 — build.manifest:true 确定性 chunk 检测</li>
          </ul>

          <h3>8B: hydration 修复</h3>
          <ul class="task-list">
            <li>litElementHydrateSupport 在 customElements.define 之前执行</li>
            <li>动态 import() 确保 hydration 补丁先于组件注册</li>
            <li>DSD polyfill 移除（现代浏览器已原生支持）</li>
            <li>build-client.ts base=/client/ 修复 Island chunk URL</li>
          </ul>

          <h2>Phase 9：v0.3.4 代码审查（已完成）</h2>
          <ul class="task-list">
            <li>三轮迭代审查 + 两轮 agent 深搜 — 35+ 项修复</li>
            <li>P0: kiss-input undefined 字符串, CLI exports 缺失, SSG CJS polyfill 时序</li>
            <li>P1: 暗色模式阴影, kiss-button nothing/arrow, kiss-rpc abort race, kiss-theme-toggle 递归</li>
            <li>CI 并行化 (typecheck + 4 test job) + actions/cache</li>
            <li>deno-version 锁定 "2" — 防止 Deno 3.0 意外破坏</li>
            <li>scanIslands 递归扫描 — 支持子目录 Island</li>
            <li>coverge 自动化 + CI badge 替换手动 badge</li>
            <li>JSR publish typecheck 修复 — noExternalPatterns 类型断言</li>
          </ul>

          <h2>Phase 10：v0.4.0 PWA + 生态（进行中）</h2>
          <ul class="task-list">
            <li>PWA 支持 — 自动生成 manifest.json + sw.js（CacheFirst 策略）</li>
            <li>博客模块 — 文档站新增 /blog/* 路由，dogfooding</li>
            <li>腾讯在线文档同步 — 变更记录发布到 docs.qq.com</li>
            <li>v0.3.x 全量修复 — 35+ 项代码审查问题已清零</li>
          </ul>

          <h2>Phase 11：v1.0 .kiss Compiler（规划中）</h2>
          <p class="subtitle">彻底消灭 Lit，零运行时 Web Components。</p>
          <ul class="task-list">
            <li>发明 <code>.kiss</code> 文件格式 — 声明式组件（template + script + style）</li>
            <li>编译器：<code>.kiss → vanilla Custom Element</code>（0 runtime deps）</li>
            <li>消除：Lit 58kb gzip、@lit-labs/ssr、hydration、CJS polyfill</li>
            <li>SSR 变为同步 string concat：<code>template.innerHTML</code></li>
            <li>保留 Lit 作为可选 fallback（<code>compiler: 'auto'</code>）</li>
            <li>详见证：<code>docs/decisions/0002-kiss-compiler-eliminate-lit.md</code></li>
          </ul>

          <h2>已解决的技术债</h2>
          <table class="tech-debt-table">
            <thead>
              <tr>
                <th>问题</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>8 插件闭包共享可变状态</td>
                <td class="status-done">已重构为 KissBuildContext</td>
              </tr>
              <tr>
                <td>entry-renderer.ts 字符串拼接</td>
                <td class="status-done">已重构为 EntryDescriptor + renderEntry</td>
              </tr>
              <tr>
                <td>Island 正则检测</td>
                <td class="status-done">已改为 Rollup manifest</td>
              </tr>
              <tr>
                <td>CI 串行执行</td>
                <td class="status-done">已拆为 5 并行 job</td>
              </tr>
              <tr>
                <td>deno-version 浮动</td>
                <td class="status-done">已锁定 "2"</td>
              </tr>
              <tr>
                <td>8 个 assertEquals(true,true) 僵尸断言</td>
                <td class="status-done">已替换</td>
              </tr>
              <tr>
                <td>ssg-smoke 静默跳过</td>
                <td class="status-done">已改为 Deno.test({ ignore })</td>
              </tr>
            </tbody>
          </table>

          <h2>仍存在的技术债</h2>
          <table class="tech-debt-table">
            <thead>
              <tr>
                <th>问题</th>
                <th>优先级</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>移动端 <code>&lt;details&gt;</code> hack — 无程序化关闭</td>
                <td class="priority-medium">中</td>
              </tr>
              <tr>
                <td>@kissjs/ui-plugin cdn:false 无操作选项</td>
                <td class="priority-low">低</td>
              </tr>
              <tr>
                <td>index-plugin.test.ts 10个冗余 plugins.length 测试</td>
                <td class="priority-low">低</td>
              </tr>
              <tr>
                <td>kiss-card 不在 islands 数组中 — SSR-only 设计未文档化</td>
                <td class="priority-low">低</td>
              </tr>
              <tr>
                <td>无 Codecov / 覆盖率 badge 自动化</td>
                <td class="priority-medium">中</td>
              </tr>
            </tbody>
          </table>

          <h2>架构概览</h2>
          <div class="architecture-diagram">用户视角：vite.config.ts
&#x250C;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2510;
&#x2502;  import { kiss } from '@kissjs/core'  &#x2502;
&#x2502;  export default defineConfig({         &#x2502;
&#x2502;    plugins: [kiss()]                   &#x2502;
&#x2502;  })                                    &#x2502;
&#x2514;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2534;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2518;
               &#x2502;
&#x250C;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2534;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2510;
&#x2502;     @kissjs/core (6 &#x5B50;&#x63D2;&#x4EF6;)              &#x2502;
&#x2502;                                          &#x2502;
&#x2502;  1. kiss:core — &#x8DEF;&#x7531;&#x626B;&#x63CF; (K)            &#x2502;
&#x2502;  2. kiss:virtual-entry — &#x865A;&#x62DF;&#x6A21;&#x5757;       &#x2502;
&#x2502;  3. @hono/vite-dev-server — dev only    &#x2502;
&#x2502;  4. island-transform — AST &#x6807;&#x8BB0; (I)     &#x2502;
&#x2502;  5. html-template — HTML &#x6CE8;&#x5165; (&#x9884;&#x7559;)    &#x2502;
&#x2502;  6. kiss:build — &#x5143;&#x6570;&#x636E; (K+S)          &#x2502;
&#x2514;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2534;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2518;
               &#x2502;
&#x250C;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2534;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2510;
&#x2502;  &#x4E24;&#x4E2A;&#x72EC;&#x7ACB;&#x90E8;&#x7F72;&#x76EE;&#x6807;      &#x2502;
&#x2502;                       &#x2502;
&#x2502;  dist/ (&#x9759;&#x6001;&#x524D;&#x7AEF;)     &#x2502; &larr; K+I+S &#x7EA6;&#x675F;
&#x2502;  API Routes (Serverless) &larr; S &#x7EA6;&#x675F;
&#x2514;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2518;</div>

          <div class="nav-row">
            <a href="/examples" class="nav-link">&larr; 示例</a>
            <a href="/changelog" class="nav-link">更新日志 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;
export const tagName = 'page-roadmap';
