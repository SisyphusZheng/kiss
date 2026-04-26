/**
 * Roadmap Page — KISS Framework Development Roadmap
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../components/page-styles.js';
import '../components/layout.js';
import '../islands/code-block.js';

export class RoadmapPage extends LitElement {
  static styles = [
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
        border-bottom: 1px solid var(--border);
      }
      .phase-table th {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
      }
      .phase-table td:first-child {
        font-weight: 600;
        color: var(--text-primary);
      }
      .status-done {
        color: #00e87b;
        font-weight: 500;
      }
      .status-wip {
        color: #f59e0b;
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
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
      .task-list li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: #00e87b;
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
        border-bottom: 1px solid var(--border);
      }
      .tech-debt-table th {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
      }
      .priority-high {
        color: #ef4444;
      }
      .priority-medium {
        color: #f59e0b;
      }
      .priority-low {
        color: #3b82f6;
      }
      .architecture-diagram {
        padding: 1.5rem;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 6px;
        margin: 1.5rem 0;
        font-size: 0.75rem;
        line-height: 1.6;
        font-family: 'SF Mono', 'Fira Code', monospace;
        white-space: pre;
        overflow-x: auto;
        color: var(--text-secondary);
      }
    `,
  ];

  render() {
    return html`
      <app-layout currentPath="/roadmap">
        <div class="container">
          <h1>Roadmap</h1>
          <p class="subtitle">
            KISS Architecture: Knowledge · Isolated · Semantic · Static — 从 PoC 到 v1.0
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
                <td>hono-entry.ts 全字符串拼接</td>
                <td class="status-done">已重构为 EntryDescriptor + renderEntry</td>
              </tr>
              <tr>
                <td>8 插件闭包共享可变状态</td>
                <td class="status-done">已提取 KissBuildContext</td>
              </tr>
              <tr>
                <td>SSR 运行时模式</td>
                <td class="status-done">已移除</td>
              </tr>
              <tr>
                <td>GLOBAL_BUILT 模块级变量</td>
                <td class="status-done">已移除</td>
              </tr>
              <tr>
                <td>Island 正则检测</td>
                <td class="status-done">已改为构建时 map</td>
              </tr>
              <tr>
                <td>DIA → KISS Architecture</td>
                <td class="status-done">已重定义（K·I·S·S 四约束）</td>
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
                <td>entry-renderer.ts 字符串拼接（非 MagicString）</td>
                <td class="priority-medium">中</td>
              </tr>
              <tr>
                <td>html-template.ts declare module 扩展</td>
                <td class="priority-low">低</td>
              </tr>
              <tr>
                <td>文档站内联样式碎片</td>
                <td class="priority-medium">中</td>
              </tr>
            </tbody>
          </table>

          <h2>架构概览</h2>
          <div class="architecture-diagram">
用户视角：vite.config.ts
┌─────────────────────────────────────────┐
│  import { kiss } from '@kissjs/core'     │
│  export default defineConfig({           │
│    plugins: [kiss()]                     │
│  })                                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         @kissjs/core (8 子插件)          │
│                                          │
│  1. kiss:core         — 路由扫描 (K)     │
│  2. kiss:virtual-entry — 虚拟模块        │
│  3. @hono/vite-dev-server — dev only     │
│  4. island-transform    — AST 标记 (I)   │
│  5. island-extractor    — 依赖分析 (I)   │
│  6. html-template       — HTML 注入 (I)  │
│  7. kiss:ssg            — SSG 产物 (K+S) │
│  8. kiss:build          — Island JS (I)  │
└──────────────┬──────────────────────────┘
               │
    ┌──────────▼──────────┐
    │  两个独立部署目标     │
    │                      │
    │  dist/ (静态前端)     │ ← K+I+S 约束
    │  API Routes (Serverless) │ ← S 约束
    └──────────────────────┘
          </div>

          <div class="nav-row">
            <a href="/examples" class="nav-link">&larr; Examples</a>
            <a href="/changelog" class="nav-link">Changelog &rarr;</a>
          </div>
        </div>
      </app-layout>
    `;
  }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;
export const tagName = 'page-roadmap';
