import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '@kissjs/ui/kiss-layout'
import '../../islands/code-block.js'

export class IslandsGuidePage extends LitElement {
  static override styles = [pageStyles, css`
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0 1.5rem; }
    .comparison-item { padding: 1rem 1.25rem; border: 1px solid var(--kiss-border); border-radius: 3px; }
    .comparison-item ul { margin: 0; padding-left: 1.25rem; font-size: 0.875rem; color: var(--kiss-text-secondary);  }
    .comparison-item li { margin-bottom: 0.25rem; }
    .comparison-item.spa { border-color: var(--kiss-border, #fecaca); }
    .comparison-item.kiss { border-color: var(--kiss-accent, #bbf7d0); background: var(--kiss-bg-surface, #f0fdf4); }

    .decision-tree { padding: 1rem; background: var(--kiss-bg-surface); border-left: 3px solid var(--kiss-border-hover); border-radius: 0 3px 3px 0; margin: 0.75rem 0; font-size: 0.8125rem; line-height: 1.8; color: var(--kiss-text-secondary);  font-family: 'SF Mono', 'Fira Code', monospace; white-space: pre-wrap; }

  `]
  override render() {
    return html`
      <kiss-layout currentPath="/guide/islands">
        <div class="container">
          <h1>Islands 架构</h1>
          <p class="subtitle">只在需要的地方添加交互性。默认零 JS。</p>

          <h2>为什么需要 Islands？</h2>
          <div class="comparison">
            <div class="comparison-item spa">
              <h3>传统 SPA</h3>
              <ul>
                <li>整个页面都是 JavaScript（100KB+）</li>
                <li>静态内容需要 JS 才能渲染</li>
                <li>首屏加载慢，SEO 差</li>
              </ul>
            </div>
            <div class="comparison-item kiss">
              <h3>KISS Islands（KISS 架构）</h3>
              <ul>
                <li>只有交互部分才加载 JS</li>
                <li>静态内容 = HTML + DSD（零 JS）</li>
                <li>首屏加载快，SEO 好</li>
                <li>Shadow DOM 封装保留</li>
              </ul>
            </div>
          </div>

          <h2>渐进增强层级</h2>
          <p>KISS 架构只有两个层级。没有 SPA——这是 S 约束（Static）。</p>
          <table>
            <thead><tr><th>层级</th><th>渲染方式</th><th>JS 大小</th><th>使用场景</th></tr></thead>
            <tbody>
              <tr><td><strong>0</strong></td><td>SSG + 声明式 Shadow DOM</td><td><strong>0 KB</strong></td><td>博客、文档、营销页</td></tr>
              <tr><td><strong>1</strong></td><td>Islands + 懒 Hydration</td><td>~6 KB / island</td><td>计数器、表单、代码复制</td></tr>
            </tbody>
          </table>
          <p>默认：<strong>层级 0</strong>（零 JS）。通过 <span class="inline-code">app/islands/</span> 按组件选择加入。</p>

          <h2>Island 决策树</h2>
          <p>创建 Island 前，确认低层无法解决问题：</p>
          <div class="decision-tree">需要交互性？
├─ 仅内容？        → L0：DSD 输出（零 JS）
├─ 仅视觉状态？   → L1：CSS（:hover、:focus-within、details[open]）
├─ 浏览器能力？   → L2：平台 API（Clipboard、IntersectionObserver）
├─ 组件封装？     → L3：Lit 组件 + DSD（构建时渲染）
└─ 以上都不行？   → L4：Island（Shadow DOM + 懒 Hydration）

示例排除：
  - 激活高亮  → aria-current + CSS（L0+L1，不是 Island）
  - 侧边栏折叠  → &lt;details&gt;/&lt;summary&gt;（L0，不是 Island）
  - 代码复制按钮  → Island + Clipboard API（L2+L4，合法 Island）
  - 主题切换      → Island + localStorage（L2+L4，合法 Island）</div>

          <h2>Islands 如何工作</h2>
          <h3>构建时</h3>
          <p><span class="inline-code">island-transform</span> 用 <span class="inline-code">__island</span> 和 <span class="inline-code">__tagName</span> 标记 island 模块。<span class="inline-code">island-extractor</span> 构建依赖映射。SSG 输出包含 island 占位元素。</p>

          <h3>运行时</h3>
          <p>hydration 脚本只懒加载当前页面需要的 island JS 包。Islands 按需求 hydration（可见时、空闲时、或立即——可配置）。</p>

          <h2>创建一个 Island</h2>
          <p>在 <span class="inline-code">app/islands/</span> 下创建文件：</p>
          <code-block><pre><code>// app/islands/counter.ts
import { LitElement, html, css } from '@kissjs/core'

export const tagName = 'my-counter'
export default class MyCounter extends LitElement {
  static properties = { count: { type: Number } }

  constructor() {
    super()
    this.count = 0
  }

  override render() {
    return html\`
      &lt;button @click=\${() => this.count++}&gt;+&lt;/button&gt;
      &lt;span&gt;\${this.count}&lt;/span&gt;
      &lt;button @click=\${() => this.count--}&gt;-&lt;/button&gt;
    \`
  }
}</code></pre></code-block>
          <p>在任何路由中使用——它会自动在客户端 hydration。</p>

          <h2>Package Islands</h2>
          <p>
            KISS 可以自动探测并注册来自 npm/JSR 包的 Islands。这使得
            可复用的 Island 组件可以跨项目共享。
          </p>

          <h3>创建 Package Island</h3>
          <p>
            在你的包中，创建一个 Island 并通过 <code>islands</code> 数组导出它：
          </p>
          <code-block><pre><code>// packages/my-ui/src/my-counter.ts
import { LitElement, html, css } from 'lit'

export const tagName = 'my-counter'
export default class MyCounter extends LitElement {
  static properties = { count: { type: Number } }
  override render() {
    return html\`&lt;button @click=\${() => this.count++}&gt;Count: \${this.count}&lt;/button&gt;\`
  }
}

// packages/my-ui/src/index.ts
import type { PackageIslandMeta } from '@kissjs/core'
import MyCounter, { tagName as counterTag } from './my-counter.js'

// 导出 islands 数组供自动探测
export const islands: PackageIslandMeta[] = [
  { tagName: counterTag, modulePath: 'my-ui/my-counter', strategy: 'eager' }
]

export { MyCounter }</code></pre></code-block>

          <h3>使用 Package Islands</h3>
          <p>
            在 <code>vite.config.ts</code> 中配置 <code>packageIslands</code>：
          </p>
          <code-block><pre><code>// vite.config.ts
import { kiss } from '@kissjs/core'

export default {
  plugins: [
    kiss({
      packageIslands: ['my-ui'], // 从 my-ui 包自动探测 islands
    })
  ]
}</code></pre></code-block>
          <p>
            框架会自动导入并注册包中的所有 Islands。无需手动注册。
          </p>

          <h3>Package Island 元数据</h3>
          <table>
            <thead>
              <tr>
                <th>字段</th>
                <th>类型</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>tagName</code></td>
                <td>string</td>
                <td>自定义元素标签名（如 'my-counter'）</td>
              </tr>
              <tr>
                <td><code>modulePath</code></td>
                <td>string</td>
                <td>相对于包的路径（如 'my-ui/my-counter'）</td>
              </tr>
              <tr>
                <td><code>strategy</code></td>
                <td>string</td>
                <td>hydration 策略：'eager' | 'lazy' | 'idle' | 'visible'（默认：'eager'）</td>
              </tr>
            </tbody>
          </table>

          <h2>DSD + Islands</h2>
          <p>非 Island 组件（在 <span class="inline-code">app/components/</span> 和 <span class="inline-code">app/routes/</span>）在构建时使用<strong>声明式 Shadow DOM</strong>渲染。它们的内容在 JS 加载前就可见：</p>
          <table>
            <thead><tr><th>组件类型</th><th>DSD 输出</th><th>客户端 JS</th></tr></thead>
            <tbody>
              <tr><td>页面组件（routes/）</td><td>✓ 完整 DSD + 作用域样式</td><td>仅 hydration（框架）</td></tr>
              <tr><td>布局组件（components/）</td><td>✓ 完整 DSD + 作用域样式</td><td>仅 hydration（框架）</td></tr>
              <tr><td>Island 组件（islands/）</td><td>✓ 占位符 DSD</td><td>✓ 懒加载包</td></tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/routing" class="nav-link">&larr; 路由</a>
            <a href="/guide/api-routes" class="nav-link">API Routes &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-islands-guide', IslandsGuidePage)
export default IslandsGuidePage
export const tagName = 'page-islands-guide'
