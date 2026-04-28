import { LitElement, html, css } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class ArchitecturePage extends LitElement {
  static styles = [
    pageStyles,
    css`

:`,
  ];
  render() {
    return html`
      <kiss-layout currentPath="/guide/architecture">
        <div class="container">
          <h1>架构设计</h1>
          <p class="subtitle">
            KISS 框架如何实现 K·I·S·S 架构约束——
            将 Hono、Lit 和 Vite 融合为一个插件。
          </p>

          <h2>用户视角</h2>
          <code-block
            ><pre><code>// vite.config.ts —— 你唯一的配置
import { kiss } from '@kissjs/core';
export default defineConfig({
  plugins: [kiss()]
})</code></pre></code-block
          >

          <h2>KISS 架构 = Jamstack，原生 Web 标准</h2>
          <p>
            K·I·S·S 约束与 Jamstack 三大支柱一一对应，
            完全通过 Web 标准实现：
          </p>
          <table>
            <thead>
              <tr>
                <th>Jamstack</th>
                <th>KISS 约束</th>
                <th>实现方式</th>
                <th>Web 标准</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>M</strong>arkup</td>
                <td>K + S（知识 + 语义）</td>
                <td>SSG + DSD —— 零 JS 静态 HTML</td>
                <td>声明式 Shadow DOM</td>
              </tr>
              <tr>
                <td><strong>A</strong>PIs</td>
                <td>S（Static —— Serverless 扩展）</td>
                <td>API Routes —— Hono handlers + RPC</td>
                <td>Fetch API</td>
              </tr>
              <tr>
                <td><strong>J</strong>avaScript</td>
                <td>I（Isolated）</td>
                <td>Islands —— Shadow DOM + 懒 Hydration</td>
                <td>Web Components</td>
              </tr>
            </tbody>
          </table>
          <p>
            没有其他框架用原生 Web 标准覆盖 Jamstack 的全部三个维度。
          </p>

          <h2>插件组合</h2>
          <p>
            <span class="inline-code">kiss()</span> 函数返回一组
            Vite 插件，每个强制一个特定的 KISS 约束：
          </p>
          <table>
            <thead>
              <tr>
                <th>插件</th>
                <th>Hook</th>
                <th>职责</th>
                <th>约束</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>kiss:core</td>
                <td>configResolved + buildStart</td>
                <td>路由扫描 + 虚拟模块生成</td>
                <td>K（知识）</td>
              </tr>
              <tr>
                <td>kiss:virtual-entry</td>
                <td>resolveId + load</td>
                <td>提供 virtual:kiss-hono-entry</td>
                <td>—</td>
              </tr>
              <tr>
                <td>@hono/vite-dev-server</td>
                <td>configureServer</td>
                <td>开发模式 Hono 中间件</td>
                <td>—</td>
              </tr>
              <tr>
                <td>island-transform</td>
                <td>transform</td>
                <td>AST 标记（__island, __tagName）</td>
                <td>I（隔离）</td>
              </tr>
              <tr>
                <td>island-extractor</td>
                <td>build</td>
                <td>构建时 Island 依赖分析</td>
                <td>I（隔离）</td>
              </tr>
              <tr>
                <td>html-template</td>
                <td>transformIndexHtml</td>
                <td>Preload、meta、hydration 注入</td>
                <td>I（隔离）</td>
              </tr>
              <tr>
                <td>kiss:ssg</td>
                <td>closeBundle</td>
                <td>带 DSD 的静态站点生成</td>
                <td>K + S（知识 + 静态）</td>
              </tr>
              <tr>
                <td>kiss:build</td>
                <td>build</td>
                <td>Island 客户端 JS 打包</td>
                <td>I（隔离）</td>
              </tr>
            </tbody>
          </table>

          <h2>请求生命周期（开发模式）</h2>
          <code-block
            ><pre><code>请求 → Vite Dev Server → Hono 中间件 → 路由匹配
  → Vite SSR (ssrLoadModule) → @lit-labs/ssr 渲染 Lit
  → HTML + 声明式 Shadow DOM → 注入 Island hydration → 响应</code></pre></code-block
          >

          <h2>构建生命周期（SSG）</h2>
          <code-block
            ><pre><code>vite build → closeBundle hook:
  1. 扫描路由                             ← K：所有路由在构建时已知
  2. 生成带 DOM shim 的 SSG 入口
  3. 创建 Vite SSR 服务器（configFile: false）
  4. 加载入口 → Hono app → toSSG()
  5. @lit-labs/ssr 用 DSD 渲染每页 ← K：内容编码在 HTML 中
  6. Island 组件 → 独立 JS chunks    ← I：隔离的 JS 包
  7. 非 Island 组件 → 零客户端 JS    ← I：不需要的地方无 JS
  8. 写入 dist/ 为静态 HTML      ← S：仅静态输出</code></pre></code-block
          >

          <h2>全栈部署</h2>
          <p>
            KISS 架构的 S 约束（Static）意味着你独立部署两样东西：
          </p>
          <table>
            <thead>
              <tr>
                <th>组件</th>
                <th>内容</th>
                <th>约束</th>
                <th>部署到</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>dist/</strong>（静态）</td>
                <td>HTML + DSD + Island JS</td>
                <td>K + I + S</td>
                <td>CDN / GitHub Pages / S3</td>
              </tr>
              <tr>
                <td><strong>API Routes</strong>（动态）</td>
                <td>Hono Handlers</td>
                <td>S（Serverless）</td>
                <td>Serverless（Deno Deploy / CF Workers）</td>
              </tr>
            </tbody>
          </table>
          <p>
            静态文件走 CDN 获得全球性能。API Routes 部署为
            Serverless 函数。两者零耦合。这就是
            S 约束强制执行的 Jamstack 模型。
          </p>

          <h2>DSD 输出</h2>
          <p>
            每个由
            <span class="inline-code">@lit-labs/ssr</span> 渲染的
            Lit 组件都输出
            <strong>声明式 Shadow DOM</strong>。这满足了 K
            约束（构建时内容知识）和 S 约束
            （无 JS 的语义基线）：
          </p>
          <code-block
            ><pre><code>&lt;!-- SSG 输出的 Lit 组件 --&gt;
&lt;app-layout&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* 作用域样式 */&lt;/style&gt;
    &lt;header&gt;...&lt;/header&gt;
    &lt;main&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/main&gt;
    &lt;footer&gt;...&lt;/footer&gt;
  &lt;/template&gt;
  &lt;!-- 插槽页面内容 --&gt;
&lt;/app-layout&gt;</code></pre></code-block
          >
          <p>
            支持 DSD 的浏览器立即渲染 Shadow DOM 内容。
            当 Lit hydration 时，它复用现有 DOM —— 无闪烁，无重复。
          </p>

          <h2>Island Hydration</h2>
          <p>
            构建时，<span class="inline-code">island-transform</span>
            标记 island 模块。<span class="inline-code">island-extractor</span>
            > 构建依赖映射。HTML 模板插件注入
            hydration 脚本，只懒加载页面需要的 island JS 包。这强制执行 I 约束——只有 Islands 获得 JS。
          </p>

          <div class="nav-row">
            <a href="/guide/testing" class="nav-link">&larr; 测试</a>
            <a href="/guide/deployment" class="nav-link"
              >部署 &rarr;</a
            >
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-architecture', ArchitecturePage);
export default ArchitecturePage;
export const tagName = 'page-architecture';
