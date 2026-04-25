import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'

export class DiaPage extends LitElement {
  static styles = [pageStyles, css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.5rem; color: #fff; }
    .subtitle { color: #666; margin-bottom: 2.5rem; font-size: 0.9375rem; line-height: 1.6; }
    h2 { font-size: 1.25rem; font-weight: 600; margin: 2.5rem 0 0.75rem; color: #fff; letter-spacing: -0.01em; }
    h3 { font-size: 1rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #ccc; }
    p { line-height: 1.7; margin: 0.5rem 0; color: #999; }
    .pillar { padding: 1.25rem; margin: 1rem 0; border-left: 3px solid #333; background: #0f0f0f; border-radius: 0 3px 3px 0; }
    .pillar .num { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-bottom: 0.25rem; }
    .pillar h3 { margin: 0 0 0.5rem; font-size: 1.0625rem; color: #fff; }
    .pillar p { color: #888; }
    .layer-ladder { margin: 1rem 0 1.5rem; }
    .layer { display: flex; align-items: center; padding: 0.625rem 1rem; border: 1px solid #1a1a1a; margin-bottom: -1px; font-size: 0.875rem; }
    .layer:first-child { border-radius: 3px 3px 0 0; }
    .layer:last-child { border-radius: 0 0 3px 3px; }
    .layer .level { width: 2.5rem; font-weight: 700; color: #666; font-family: 'SF Mono', 'Fira Code', monospace; }
    .layer .name { width: 9rem; font-weight: 600; color: #ccc; }
    .layer .desc { flex: 1; color: #888; }
    .layer .example { color: #666; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.8125rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.875rem; }
    th, td { border: 1px solid #1a1a1a; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #111; font-weight: 600; color: #ccc; }
    pre { background: #111; color: #c8c8c8; padding: 1rem 1.25rem; border-radius: 3px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: #111; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    .decision-tree { padding: 1rem; background: #0f0f0f; border-left: 3px solid #444; border-radius: 0 3px 3px; margin: 0.75rem 0; font-size: 0.8125rem; line-height: 1.8; color: #888; font-family: 'SF Mono', 'Fira Code', monospace; white-space: pre-wrap; }
    .dsd-diagram { padding: 1rem; background: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 3px; margin: 0.75rem 0; font-size: 0.8125rem; line-height: 1.7; color: #888; font-family: 'SF Mono', 'Fira Code', monospace; white-space: pre-wrap; }
    .hard-constraint { display: inline-block; background: #111; border: 1px solid #222; padding: 0.25rem 0.625rem; border-radius: 4px; font-size: 0.8125rem; margin: 0.125rem 0; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `]

  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>DIA — Declarative Islands Architecture</h1>
          <p class="subtitle">KISS 的架构内核。Declarative 是核心差异——DSD 让 Shadow DOM 内容声明式可达。</p>

          <h2>为什么叫 DIA</h2>
          <p>DIA = <strong>Declarative Islands Architecture</strong>。</p>
          <p>KISS 之前的架构名称是 PIA（Pre-rendered Islands Architecture），但实践证明它不够准确：</p>
          <ul>
            <li><strong>Pre-rendered</strong> 只是手段，不是最独特的差异——Astro 也预渲染</li>
            <li>PIA 名字没有体现 <strong>DSD</strong> 和 <strong>Web Components 封装</strong>，导致之前的实现直接放弃了 Shadow DOM</li>
            <li>PIA 名字没有体现 <strong>分层原则</strong>，导致 JS 做了 CSS 能做的事</li>
          </ul>
          <p><strong>Declarative</strong> 才是核心差异——DSD 让 Shadow DOM 内容在 JS 加载前声明式可见。Pre-rendered 隐含在 Declarative 之中。</p>

          <h2>DIA 四支柱</h2>

          <div class="pillar">
            <div class="num">Pillar 1</div>
            <h3>构建即终态</h3>
            <p>所有页面在构建时渲染为静态 HTML（含 DSD），构建后零服务端进程。</p>
            <p>SSG 输出的 HTML 就是最终产物——不需要运行时服务器重新渲染。</p>
            <p>
              <span class="hard-constraint">No SSR runtime</span>
              <span class="hard-constraint">No server process in production</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 2</div>
            <h3>交互必隔离</h3>
            <p>客户端 JS 只能存在于 Island Web Component 内部。非 Island 组件不发送任何 JS 到浏览器。</p>
            <p>Island 是交互的原子单位——它的 Shadow DOM 封装了样式和逻辑，不会泄漏到外部。</p>
            <p>
              <span class="hard-constraint">Island = Shadow DOM + lazy hydration</span>
              <span class="hard-constraint">Non-Island = zero client JS</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 3</div>
            <h3>声明即内容</h3>
            <p>DSD（Declarative Shadow DOM）让 Shadow DOM 内容从 HTML 声明中即可见——不需要 JS 解析和执行。</p>
            <p>这是 PIA→DIA 最关键的修正：之前"降级即内容"被误读为"禁用 JS 时可见"，导致放弃 Shadow DOM。
               正确理解是 <strong>JS 未加载前内容即可见</strong>，DSD 恰好满足。</p>
            <p>
              <span class="hard-constraint">DSD output from @lit-labs/ssr</span>
              <span class="hard-constraint">Chrome 111+ / Safari 16.4+ / Firefox 123+</span>
              <span class="hard-constraint">Polyfill: @webcomponents/template-shadowroot ~1KB</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 4</div>
            <h3>拒绝即纪律</h3>
            <p>框架不提供 SSR 运行时、CSR、SPA。这些限制不可配置关闭。</p>
            <p>纪律意味着每一层能力必须先被低层证明不够用，才允许引入高层依赖。</p>
            <p>
              <span class="hard-constraint">No SSR runtime</span>
              <span class="hard-constraint">No CSR / SPA</span>
              <span class="hard-constraint">Not configurable away</span>
            </p>
          </div>

          <h2>分层原则：能力下沉，依赖上移</h2>
          <p>每一层只做上一层做不了的事。能用低层能力解决的事情，绝不引入高层依赖。</p>

          <div class="layer-ladder">
            <div class="layer">
              <span class="level">L0</span>
              <span class="name">HTML5 语义</span>
              <span class="desc">结构、内容、导航</span>
              <span class="example">&lt;details&gt;, aria-current</span>
            </div>
            <div class="layer">
              <span class="level">L1</span>
              <span class="name">CSS 表现</span>
              <span class="desc">视觉、布局、动画、响应式</span>
              <span class="example">:focus-within, @media, scroll-snap</span>
            </div>
            <div class="layer">
              <span class="level">L2</span>
              <span class="name">平台 API</span>
              <span class="desc">浏览器原生能力</span>
              <span class="example">Clipboard, IntersectionObserver, matchMedia</span>
            </div>
            <div class="layer">
              <span class="level">L3</span>
              <span class="name">Hono / Vite / Lit</span>
              <span class="desc">路由、构建、组件封装</span>
              <span class="example">LitElement, Hono RPC, Vite plugins</span>
            </div>
            <div class="layer">
              <span class="level">L4</span>
              <span class="name">自研代码</span>
              <span class="desc">Island 水合、RPC、插件逻辑</span>
              <span class="example">kiss:island-transform, RpcController</span>
            </div>
          </div>

          <h3>分层审查清单</h3>
          <pre><code>每写一行代码，问自己：

1. HTML5 能做吗？  → 用语义标签 + 属性
2. CSS 能做吗？    → 用声明式样式
3. 平台 API 能做吗？ → 用原生浏览器接口
4. 框架能做吗？    → 用 Hono/Vite/Lit
5. 都不行？       → 才写自研代码（Island）

跳过任何一层 = 违反分层原则</code></pre>

          <h2>DSD：DIA 的桥梁</h2>
          <p>Declarative Shadow DOM 是 DIA 与 Web Components 之间的桥梁。它解决了"封装 vs 可达"的根本矛盾：</p>

          <table>
            <thead><tr><th>需求</th><th>传统 WC</th><th>DSD</th></tr></thead>
            <tbody>
              <tr><td>Shadow DOM 封装</td><td>✓</td><td>✓</td></tr>
              <tr><td>JS 加载前内容可见</td><td>✗（需要 JS 注册组件）</td><td>✓（浏览器原生渲染 template）</td></tr>
              <tr><td>SEO / 爬虫可达</td><td>✗</td><td>✓</td></tr>
              <tr><td>样式隔离</td><td>✓</td><td>✓</td></tr>
              <tr><td>无 JS 降级</td><td>✗</td><td>✓（polyfill 回退）</td></tr>
            </tbody>
          </table>

          <h3>SSG 输出示例</h3>
          <div class="dsd-diagram">app-layout (Shadow DOM + DSD):
┌─────────────────────────────────────────────┐
│ &lt;app-layout&gt;                                │
│   &lt;template shadowrootmode="open"&gt;         │
│     &lt;style&gt;/* scoped styles */&lt;/style&gt;     │
│     &lt;header&gt;...&lt;/header&gt;                    │
│     &lt;nav&gt;...&lt;/nav&gt;                          │
│     &lt;main&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/main&gt;             │
│     &lt;footer&gt;...&lt;/footer&gt;                    │
│   &lt;/template&gt;                               │
│   &lt;!-- slotted content --&gt;                  │
│   &lt;page-home&gt;...&lt;/page-home&gt;               │
│ &lt;/app-layout&gt;                               │
└─────────────────────────────────────────────┘

浏览器行为：
  - DSD 支持：直接渲染 Shadow DOM 内容（零 JS）
  - JS 加载后：Lit 组件 hydrate，恢复交互
  - 旧浏览器：polyfill 展开 template → 内容可见</div>

          <h2>Island 决策树</h2>
          <p>每个交互需求必须通过决策树验证。如果低层能解决，就不能成为 Island。</p>
          <div class="decision-tree">需要交互？
├─ 只需内容可见？  → L0: DSD 输出（零 JS）
├─ 只需视觉状态？  → L1: CSS（:hover, :focus-within, details[open]）
├─ 只需浏览器能力？ → L2: 平台 API（Clipboard, IntersectionObserver）
├─ 需要组件封装？  → L3: Lit 组件 + DSD（构建时渲染）
└─ 以上都不行？    → L4: Island（Shadow DOM + 懒水合）</div>

          <h3>典型组件判定</h3>
          <table>
            <thead><tr><th>需求</th><th>判定</th><th>层级</th><th>JS?</th></tr></thead>
            <tbody>
              <tr><td>Sidebar active 高亮</td><td>构建时 <span class="inline-code">aria-current="page"</span> + CSS</td><td>L0+L1</td><td>无</td></tr>
              <tr><td>Sidebar 折叠</td><td><span class="inline-code">&lt;details&gt;/&lt;summary&gt;</span></td><td>L0</td><td>无</td></tr>
              <tr><td>页面布局 + 导航</td><td>Lit + Shadow DOM + DSD</td><td>L3</td><td>水合时</td></tr>
              <tr><td>代码复制按钮</td><td>Island + Clipboard API</td><td>L2+L4</td><td>懒加载</td></tr>
              <tr><td>RPC 数据交互</td><td>Island + RpcController</td><td>L4</td><td>懒加载</td></tr>
              <tr><td>表单验证</td><td>Constraint Validation API</td><td>L0+L2</td><td>平台</td></tr>
              <tr><td>主题切换</td><td><span class="inline-code">color-scheme</span> + CSS 变量</td><td>L1</td><td>无 / 极少</td></tr>
            </tbody>
          </table>

          <h2>DIA vs 其他架构</h2>
          <table>
            <thead><tr><th>维度</th><th>Astro</th><th>Fresh</th><th>KISS DIA</th></tr></thead>
            <tbody>
              <tr><td>预渲染</td><td>✓ SSG</td><td>✓ SSR</td><td>✓ SSG</td></tr>
              <tr><td>Islands</td><td>✓</td><td>✓ Preact</td><td>✓ WC + DSD</td></tr>
              <tr><td>DSD 内容可达</td><td>—</td><td>—</td><td>✓ 核心差异</td></tr>
              <tr><td>Shadow DOM 封装</td><td>✗</td><td>✗</td><td>✓ 始终保留</td></tr>
              <tr><td>允许 SPA</td><td>✓ (View Transitions)</td><td>✗</td><td>✗ 纪律</td></tr>
              <tr><td>运行时绑定</td><td>Deno/Node</td><td>Deno only</td><td>零绑定</td></tr>
              <tr><td>UI 标准</td><td>React/Vue/Svelte</td><td>Preact</td><td>Web Components</td></tr>
              <tr><td>HTTP 标准</td><td>Custom</td><td>Custom</td><td>Fetch API</td></tr>
            </tbody>
          </table>

          <h2>DIA 合规审查</h2>
          <pre><code>每次提交前，审查：

1. 新增了 JS？  → 是否低层做不了？（分层原则）
2. 突破了 Shadow DOM？ → 是否必要？（封装原则）
3. Island 没走决策树？ → 退回重判（纪律原则）
4. 输出没有 DSD？  → @lit-labs/ssr 配置问题
5. 引入了 SPA 行为？ → 违反"拒绝即纪律"</code></pre>

          <div class="nav-row">
            <a href="/kiss/guide/design-philosophy" class="nav-link">&larr; Design Philosophy</a>
            <a href="/kiss/guide/routing" class="nav-link">Routing &rarr;</a>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-dia', DiaPage)
export default DiaPage
export const tagName = 'page-dia'
