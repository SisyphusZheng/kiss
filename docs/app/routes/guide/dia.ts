import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class KissArchitecturePage extends LitElement {
  static styles = [
    pageStyles,
    css`
      .constraint {
        padding: 1.25rem 1.5rem;
        margin: 1rem 0;
        border-left: 3px solid var(--kiss-border-hover);
        background: var(--kiss-bg-surface);
        border-radius: 0 3px 3px 0;
      }
      .constraint .letter {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--kiss-text-primary);
        display: inline-block;
        width: 2rem;
      }
      .constraint .constraint-name {
        font-size: 1.0625rem;
        font-weight: 600;
        color: var(--kiss-text-primary);
      }
      .constraint .constraint-cn {
        font-size: 0.8125rem;
        color: var(--kiss-text-muted);
        margin-left: 0.5rem;
      }
      .constraint .constraint .hard-constraint {
        margin-left: 2.5rem;
      }
      .hard-constraint {
        display: inline-block;
        background: var(--kiss-code-bg);
        border: 1px solid var(--kiss-border-hover);
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.8125rem;
        margin: 0.125rem 0;
      }
      .layer-ladder {
        margin: 1rem 0 1.5rem;
      }
      .layer {
        display: flex;
        align-items: center;
        padding: 0.625rem 1rem;
        border: 1px solid var(--kiss-border);
        margin-bottom: -1px;
        font-size: 0.875rem;
      }
      .layer:first-child {
        border-radius: 3px 3px 0 0;
      }
      .layer:last-child {
        border-radius: 0 0 3px 3px;
      }
      .layer .level {
        width: 2.5rem;
        font-weight: 700;
        color: var(--kiss-text-tertiary);
        font-family: "SF Mono", "Fira Code", monospace;
      }
      .layer .name {
        width: 9rem;
        font-weight: 600;
        color: var(--kiss-accent-dim);
      }
      .layer .desc {
        flex: 1;
        color: var(--kiss-text-secondary);
      }
      .layer .example {
        color: var(--kiss-text-tertiary);
        font-family: "SF Mono", "Fira Code", monospace;
        font-size: 0.8125rem;
      }

      .decision-tree {
        padding: 1rem;
        background: var(--kiss-bg-surface);
        border-left: 3px solid var(--kiss-border-hover);
        border-radius: 0 3px 3px;
        margin: 0.75rem 0;
        font-size: 0.8125rem;
        line-height: 1.8;
        color: var(--kiss-text-secondary);
        font-family: "SF Mono", "Fira Code", monospace;
        white-space: pre-wrap;
      }
      .dsd-diagram {
        padding: 1rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 3px;
        margin: 0.75rem 0;
        font-size: 0.8125rem;
        line-height: 1.7;
        color: var(--kiss-text-secondary);
        font-family: "SF Mono", "Fira Code", monospace;
        white-space: pre-wrap;
      }
      .jamstack-map {
        padding: 1.25rem;
        margin: 1rem 0;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 3px;
      }
      .jamstack-map .jam-row {
        display: flex;
        align-items: baseline;
        margin: 0.5rem 0;
        font-size: 0.9375rem;
      }
      .jamstack-map .jam-letter {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--kiss-text-primary);
        width: 2rem;
        text-align: center;
      }
      .jamstack-map .jam-label {
        font-weight: 600;
        color: var(--kiss-accent-dim);
        width: 8rem;
      }
      .jamstack-map .jam-desc {
        color: var(--kiss-text-secondary);
        flex: 1;
      }
      .jamstack-map .jam-kiss {
        color: var(--kiss-text-secondary);
        font-family: "SF Mono", "Fira Code", monospace;
        font-size: 0.8125rem;
      }
      .quote-block {
        padding: 1.25rem 1.5rem;
        margin: 1.5rem 0;
        border-left: 3px solid var(--kiss-border-hover);
        background: var(--kiss-bg-surface);
        border-radius: 0 3px 3px 0;
        font-style: italic;
        color: var(--kiss-text-muted);
        line-height: 1.7;
      }
      .quote-block .attribution {
        margin-top: 0.5rem;
        font-size: 0.8125rem;
        color: var(--kiss-text-tertiary);
        font-style: normal;
      }
    `,
  ];

  render() {
    return html`
      <kiss-layout currentPath="/guide/dia">
        <div class="container">
          <h1>KISS Architecture</h1>
          <p class="subtitle">
            Knowledge · Isolated · Semantic · Static — 融合 Jamstack
            部署模型与声明式岛屿交互范式的全栈架构风格。
          </p>

          <h2>双重指代</h2>
          <p>
            <strong>KISS</strong> 同时是哲学和架构。两个含义精神一致——约束就是简单。
          </p>
          <table>
            <thead>
              <tr>
                <th>含义</th>
                <th>解释</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>哲学</strong></td>
                <td>
                  Keep It Simple, Stupid — 简单即力量，每个决策都经过"够不够简单"的过滤
                </td>
              </tr>
              <tr>
                <td><strong>架构</strong></td>
                <td>
                  Knowledge · Isolated · Semantic · Static — 四个不可违抗的架构约束
                </td>
              </tr>
            </tbody>
          </table>

          <h2>四约束</h2>
          <p>
            KISS 框架实现的正是 KISS 架构——K·I·S·S 是四个架构约束的缩写：
          </p>

          <div class="constraint">
            <span class="letter">K</span>
            <span class="constraint-name">Knowledge</span>
            <span class="constraint-cn">知识</span>
            <p>
              所有内容在构建时预渲染为语义 HTML 静态文件。页面骨架、正文、导航在 JS 执行前即可见。
            </p>
            <p>
              对应 Jamstack 的 M (Markup)：构建时渲染 =
              内容的完整知识在构建时已确定，运行时不需要重新获取。
            </p>
            <p>
              <span class="hard-constraint">SSG + DSD output</span>
              <span class="hard-constraint">Content visible before JS</span>
            </p>
          </div>

          <div class="constraint">
            <span class="letter">I</span>
            <span class="constraint-name">Isolated</span>
            <span class="constraint-cn">隔离</span>
            <p>
              任何客户端 JS 只能存在于独立 Island 组件的 Shadow DOM 内部。一个 Island
              的失败不影响其他部分。
            </p>
            <p>
              对应 Jamstack 的 J
              (JavaScript)：交互是孤岛，不是汪洋。每个岛屿独立加载、独立运行、独立失败。
            </p>
            <p>
              <span class="hard-constraint">Island = Shadow DOM + lazy hydration</span>
              <span class="hard-constraint">Non-Island = zero client JS</span>
            </p>
          </div>

          <div class="constraint">
            <span class="letter">S</span>
            <span class="constraint-name">Semantic</span>
            <span class="constraint-cn">语义</span>
            <p>
              每个 Island 包裹原生 HTML 元素（<span
                class="inline-code"
              >&lt;form&gt;</span>、<span class="inline-code">&lt;a&gt;</span>、<span
                class="inline-code"
              >&lt;details&gt;</span>），禁用 JS 时提供等价基线功能。
            </p>
            <p>
              对应 Progressive Enhancement 的核心：内容优先，增强在后。但在 KISS
              中，这不是建议——而是可验证的约束。
            </p>
            <p>
              <span class="hard-constraint">DSD makes content declaratively visible</span>
              <span class="hard-constraint">No-JS baseline must be functional</span>
            </p>
          </div>

          <div class="constraint">
            <span class="letter">S</span>
            <span class="constraint-name">Static</span>
            <span class="constraint-cn">静态</span>
            <p>
              构建产物仅为纯静态文件，无持久服务端进程。可部署到任何 CDN 或静态托管，零运行时锁定。
            </p>
            <p>
              对应 Jamstack 的部署模型：静态前端 + Serverless API。动态数据通过 API Routes（Hono +
              RPC）获取，部署为 Serverless 函数。
            </p>
            <p>
              <span class="hard-constraint">No SSR runtime in production</span>
              <span class="hard-constraint">No CSR / SPA</span>
              <span class="hard-constraint">Deploy to CDN + Serverless</span>
            </p>
          </div>

          <h2>三范式继承</h2>
          <p>
            KISS
            架构不发明新的渲染算法或通信协议。它识别出三个范式各自领域中被验证有效的约束，将它们组合成一套严格、可验证、不可关闭的架构规则。
          </p>

          <table>
            <thead>
              <tr>
                <th>范式</th>
                <th>KISS 继承了什么</th>
                <th>KISS 的强化</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Jamstack</strong></td>
                <td>静态优先、前后端分离的部署模型</td>
                <td>固化为不可配置的框架规则，而非最佳实践建议</td>
              </tr>
              <tr>
                <td><strong>Islands Architecture</strong></td>
                <td>静态海洋中的独立交互岛屿</td>
                <td>
                  要求所有 Island 必须是 Shadow DOM 内的 Web Component，跨岛通信只能通过声明式机制
                </td>
              </tr>
              <tr>
                <td><strong>Progressive Enhancement</strong></td>
                <td>内容优先，增强在后</td>
                <td>
                  从开发者最佳实践提升为框架层面的可验证约束——Island 内部没有语义降级元素，就不符合 KISS
                  规范
                </td>
              </tr>
            </tbody>
          </table>

          <div class="quote-block">
            KISS 对 Jamstack、Islands 和渐进增强三者关系的处理，类似于 Haskell
            对函数式编程原则的处理：不是发明了纯函数这一概念，而是通过编译器/框架约束，使这一概念不可违抗。
            <div class="attribution">
              — KISS Architecture 的核心定位：Web 前端的"强类型系统"
            </div>
          </div>

          <p>
            框架的 <span class="inline-code">kiss build</span>
            命令就是这套规则的编译验证器——不满足架构约束的输出，不会产生。
          </p>

          <h2>KISS = Jamstack</h2>
          <p>
            KISS 架构与 Jamstack 天然 1:1 对齐。K·I·S·S 四约束覆盖了 Jamstack 的三个维度，但用 Web
            Standards 原生实现：
          </p>

          <div class="jamstack-map">
            <div class="jam-row">
              <span class="jam-letter">J</span>
              <span class="jam-label">JavaScript</span>
              <span class="jam-desc">交互不膨胀，按需加载</span>
              <span class="jam-kiss">→ I: Isolated（~6KB/island）</span>
            </div>
            <div class="jam-row">
              <span class="jam-letter">A</span>
              <span class="jam-label">APIs</span>
              <span class="jam-desc">动态数据，类型安全</span>
              <span class="jam-kiss">→ S: Static 的 Serverless 扩展</span>
            </div>
            <div class="jam-row">
              <span class="jam-letter">M</span>
              <span class="jam-label">Markup</span>
              <span class="jam-desc">预渲染输出，零 JS 可见</span>
              <span class="jam-kiss">→ K+I+S: Knowledge + DSD + Semantic</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>维度</th>
                <th>传统 Jamstack</th>
                <th>KISS Architecture</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Markup</td>
                <td>SSG 框架生成</td>
                <td>SSG + DSD（Shadow DOM 内容可达）</td>
              </tr>
              <tr>
                <td>APIs</td>
                <td>第三方 Serverless</td>
                <td>内置 API Routes（Hono，端到端类型安全）</td>
              </tr>
              <tr>
                <td>JavaScript</td>
                <td>SPA 或全量 hydration</td>
                <td>Islands（Shadow DOM 封装 + 懒水合）</td>
              </tr>
              <tr>
                <td>UI 标准</td>
                <td>React/Vue/Svelte</td>
                <td>Web Components（零框架绑定）</td>
              </tr>
              <tr>
                <td>HTTP 标准</td>
                <td>框架自定义</td>
                <td>Fetch API（Hono 原生）</td>
              </tr>
              <tr>
                <td>运行时</td>
                <td>Node.js / Deno 依赖</td>
                <td>零运行时绑定（纯 ESM）</td>
              </tr>
            </tbody>
          </table>

          <p>
            <strong>KISS 是唯一全链路 Web Standards 的 Jamstack 架构。</strong>HTTP = Fetch API，UI = Web
            Components，Build = ESM。3/3 标准覆盖。
          </p>

          <h2>DSD：KISS 的桥梁</h2>
          <p>
            Declarative Shadow DOM 是 KISS Architecture 与 Web Components 之间的桥梁。它解决了"封装 vs
            可达"的根本矛盾：
          </p>

          <table>
            <thead>
              <tr>
                <th>需求</th>
                <th>传统 WC</th>
                <th>DSD (KISS)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Shadow DOM 封装</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>JS 加载前内容可见</td>
                <td>✗（需要 JS 注册组件）</td>
                <td>✓（浏览器原生渲染 template）</td>
              </tr>
              <tr>
                <td>SEO / 爬虫可达</td>
                <td>✗</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>样式隔离</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>无 JS 降级</td>
                <td>✗</td>
                <td>✓（polyfill 回退）</td>
              </tr>
            </tbody>
          </table>

          <p>
            DSD 让 K 约束（Knowledge）和 S
            约束（Semantic）同时成立：内容在构建时已完整编码（K），且以声明式方式可达（S）。
          </p>

          <h3>SSG 输出示例</h3>
          <div class="dsd-diagram">
            app-layout (Shadow DOM + DSD): ┌─────────────────────────────────────────────┐ │
            &lt;app-layout&gt; │ │ &lt;template shadowrootmode="open"&gt; │ │ &lt;style&gt;/* scoped
            styles */&lt;/style&gt; │ │ &lt;header&gt;...&lt;/header&gt; │ │ &lt;nav&gt;...&lt;/nav&gt; │
            │ &lt;main&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/main&gt; │ │ &lt;footer&gt;...&lt;/footer&gt; │ │
            &lt;/template&gt; │ │ &lt;!-- slotted content --&gt; │ │
            &lt;page-home&gt;...&lt;/page-home&gt; │ │ &lt;/app-layout&gt; │
            └─────────────────────────────────────────────┘ 浏览器行为： DSD 支持：直接渲染 Shadow DOM
            内容（零 JS） ← K 约束 JS 加载后：Lit 组件 hydrate，恢复交互 ← I 约束 旧浏览器：polyfill 展开
            template → 内容可见 ← S 约束 部署：纯静态文件，CDN 即可 ← S 约束
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
          <code-block
          ><pre><code>每写一行代码，问自己：

          1. HTML5 能做吗？    → 用语义标签 + 属性
          2. CSS 能做吗？      → 用声明式样式
          3. 平台 API 能做吗？  → 用原生浏览器接口
          4. 框架能做吗？      → 用 Hono/Vite/Lit
          5. 都不行？         → 才写自研代码（Island）

          跳过任何一层 = 违反 KISS 架构约束</code></pre></code-block>

          <h2>Island 决策树</h2>
          <p>
            每个交互需求必须通过决策树验证。如果低层能解决，就不能成为 Island——这是 I
            约束（Isolated）的执行工具。
          </p>
          <div class="decision-tree">
            需要交互？ ├─ 只需内容可见？ → L0: DSD 输出（零 JS） ← K 约束 ├─ 只需视觉状态？ → L1:
            CSS（:hover, :focus-within, details[open]） ├─ 只需浏览器能力？ → L2: 平台 API（Clipboard,
            IntersectionObserver） ├─ 需要组件封装？ → L3: Lit 组件 + DSD（构建时渲染） └─ 以上都不行？ →
            L4: Island（Shadow DOM + 懒水合）← I 约束 典型判定： Sidebar 高亮 → aria-current + CSS (L0+L1,
            非 Island) Sidebar 折叠 → &lt;details&gt;/&lt;summary&gt; (L0, 非 Island) 代码复制按钮 →
            Island + Clipboard API (L2+L4, 合法 Island) RPC 数据交互 → Island + RpcController (L4, 合法
            Island) 主题切换 → color-scheme + CSS vars (L1, 非 Island)
          </div>

          <h2>KISS vs 其他架构</h2>
          <table>
            <thead>
              <tr>
                <th>维度</th>
                <th>Astro</th>
                <th>Fresh</th>
                <th>Next.js</th>
                <th>KISS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>预渲染</td>
                <td>✓ SSG</td>
                <td>✓ SSR</td>
                <td>✓ SSG/SSR</td>
                <td>✓ SSG</td>
              </tr>
              <tr>
                <td>Islands</td>
                <td>✓</td>
                <td>✓ Preact</td>
                <td>✗</td>
                <td>✓ WC + DSD</td>
              </tr>
              <tr>
                <td>DSD 内容可达</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>✓ K+S 约束</td>
              </tr>
              <tr>
                <td>Shadow DOM 封装</td>
                <td>✗</td>
                <td>✗</td>
                <td>✗</td>
                <td>✓ I 约束</td>
              </tr>
              <tr>
                <td>Jamstack 原生</td>
                <td>✓</td>
                <td>✗（需 Deno Deploy）</td>
                <td>✗（需 Node）</td>
                <td>✓ S 约束</td>
              </tr>
              <tr>
                <td>语义基线强制</td>
                <td>✗</td>
                <td>✗</td>
                <td>✗</td>
                <td>✓ S 约束</td>
              </tr>
              <tr>
                <td>允许 SPA</td>
                <td>✓ (View Transitions)</td>
                <td>✗</td>
                <td>✓</td>
                <td>✗ S 约束</td>
              </tr>
              <tr>
                <td>运行时绑定</td>
                <td>Deno/Node</td>
                <td>Deno only</td>
                <td>Node only</td>
                <td>零绑定</td>
              </tr>
              <tr>
                <td>UI 标准</td>
                <td>React/Vue/Svelte</td>
                <td>Preact</td>
                <td>React</td>
                <td>Web Components</td>
              </tr>
              <tr>
                <td>HTTP 标准</td>
                <td>Custom</td>
                <td>Custom</td>
                <td>Custom</td>
                <td>Fetch API</td>
              </tr>
              <tr>
                <td>Web Standards 覆盖</td>
                <td>1/3</td>
                <td>1/3</td>
                <td>0/3</td>
                <td>3/3</td>
              </tr>
            </tbody>
          </table>

          <h2>架构合规审查</h2>
          <code-block
          ><pre><code>每次提交前，审查 K·I·S·S 四约束：

          K — 新内容需要运行时获取？  → 应在构建时预渲染
          I — 新增了全局 JS？         → 必须封装为 Island Shadow DOM
          S — Island 禁用 JS 可用吗？  → 必须包裹语义 HTML 基线
          S — 引入了服务端进程？       → 只允许静态文件 + Serverless API</code></pre></code-block>

          <div class="nav-row">
            <a href="/guide/design-philosophy" class="nav-link">&larr; Design Philosophy</a>
            <a href="/guide/routing" class="nav-link">Routing &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-kiss-architecture', KissArchitecturePage);
export default KissArchitecturePage;
export const tagName = 'page-kiss-architecture';
