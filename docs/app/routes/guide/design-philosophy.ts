import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class DesignPhilosophyPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .pillar {
        padding: 1.25rem;
        margin: 1rem 0;
        border-left: 3px solid var(--kiss-border-hover);
        background: var(--kiss-bg-surface);
        border-radius: 0 3px 3px 0;
      }
      .pillar .num {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--kiss-text-muted);
        margin-bottom: 0.25rem;
      }
      .pillar .hard-constraint {
        display: inline-block;
        background: var(--kiss-code-bg);
        border: 1px solid var(--kiss-border-hover);
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.8125rem;
        margin: 0.125rem 0;
      }
    `,
  ];
  override render() {
    return html`
      <kiss-layout currentPath="/guide/design-philosophy">
        <div class="container">
          <h1>设计哲学</h1>
          <p class="subtitle">
            KISS = Keep It Simple, Stupid。不是口号——而是每个决策的过滤器。
          </p>

          <h2>五大支柱</h2>

          <div class="pillar">
            <div class="num">支柱 1</div>
            <h3>Web 标准优先</h3>
            <p>
              大多数框架"支持"Web 标准。KISS
              <em>就是</em> Web 标准。
            </p>
            <p>
              你的代码不依赖 KISS 的抽象。把它换掉，你的 Hono/Lit/Vite 代码
              依然能跑。
            </p>
            <p>
              <span class="hard-constraint">纯 ESM，零 CJS</span>
              <span class="hard-constraint">仅 Vite，无第二个构建工具</span>
              <span class="hard-constraint">不在输出上打补丁</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">支柱 2</div>
            <h3>最小化增强</h3>
            <p>
              KISS 不发明东西。它以最小开销连接现有标准工具。
            </p>
            <p>
              框架 = 1 个 Vite 插件（连接器，不是新抽象）。
            </p>
            <p>
              零交互页面：<strong>0 KB</strong> KISS 运行时。单个 Island：~6 KB（Lit 本身）。
            </p>
            <p>
              <span class="hard-constraint">复用 Hono/Vite/Lit 生态</span>
              <span class="hard-constraint">新依赖需要 ADR</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">支柱 3</div>
            <h3>无框架绑定</h3>
            <p>
              KISS 推荐 Lit，但你可以用别的。你可以不用 Lit 就用 @kissjs/core 做 SSR。
              你也可以不用 KISS 就用 Lit。
            </p>
            <p>
              Package Islands 自动探测——无需手动注册。只需从你的包
              <code>export</code> 一个 <code>islands</code> 数组，KISS 就能找到。
            </p>
            <p>
              <span class="hard-constraint">Lit 不是强制 peerDependency</span>
              <span class="hard-constraint">无强制验证方案</span>
              <span class="hard-constraint">零配置 Island 发现</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">支柱 4</div>
            <h3>无运行时绑定</h3>
            <p>
              纯 ESM 输出运行在任何支持 ESM 的运行时：Deno、Node、Bun、Cloudflare Workers。
            </p>
            <p>
              <span class="hard-constraint">无平台特定硬编码</span>
              <span class="hard-constraint">deno.json 是开发工具，不是运行时依赖</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">支柱 5</div>
            <h3>渐进增强</h3>
            <p>
              KISS 默认零 JS。按组件选择加入。没有 SPA——这是架构，不是疏忽。
            </p>
            <table>
              <thead>
                <tr>
                  <th>层级</th>
                  <th>内容</th>
                  <th>JS 大小</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>0</td>
                  <td>HTML + DSD（声明式 Shadow DOM）</td>
                  <td><strong>0 KB</strong></td>
                </tr>
                <tr>
                  <td>1</td>
                  <td>部分 Islands 带懒 Hydration</td>
                  <td>~6 KB / island</td>
                </tr>
              </tbody>
            </table>
            <p>
              没有层级 2 SPA，没有层级 3 实时，没有层级 4 CSR。这不是缺憾——这是
              KISS 架构 S 约束定义的边界。
            </p>
          </div>

          <h2>哲学 vs 架构</h2>
          <p>
            五大哲学支柱描述<strong>如何</strong>做决策。KISS
            架构（K·I·S·S）约束定义
            <strong>什么</strong>框架强制执行。
          </p>
          <table>
            <thead>
              <tr>
                <th>哲学支柱</th>
                <th>架构约束</th>
                <th>关系</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Web 标准优先</td>
                <td>全部四个（K·I·S·S）</td>
                <td>标准是每个约束的基础</td>
              </tr>
              <tr>
                <td>最小化增强</td>
                <td>I（隔离）</td>
                <td>最小 JS = 只有 Islands 获得 JS</td>
              </tr>
              <tr>
                <td>无框架绑定</td>
                <td>I（隔离）</td>
                <td>Web Components = 零框架绑定</td>
              </tr>
              <tr>
                <td>无运行时绑定</td>
                <td>S（静态）</td>
                <td>纯静态文件 = 无运行时依赖</td>
              </tr>
              <tr>
                <td>渐进增强</td>
                <td>K + S（知识 + 语义）</td>
                <td>构建时知识 + 语义基线</td>
              </tr>
            </tbody>
          </table>

          <h2>能力分层</h2>
          <p>
            每个特性必须通过能力阶梯。低层优先，始终如此：
          </p>
          <table>
            <thead>
              <tr>
                <th>层级</th>
                <th>技术</th>
                <th>仅在何时使用</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>L0</strong></td>
                <td>HTML5 语义</td>
                <td>结构、内容、导航</td>
              </tr>
              <tr>
                <td><strong>L1</strong></td>
                <td>CSS</td>
                <td>视觉、布局、动画、响应式</td>
              </tr>
              <tr>
                <td><strong>L2</strong></td>
                <td>平台 APIs</td>
                <td>Clipboard、IntersectionObserver、matchMedia</td>
              </tr>
              <tr>
                <td><strong>L3</strong></td>
                <td>Hono / Vite / Lit</td>
                <td>路由、构建、组件封装</td>
              </tr>
              <tr>
                <td><strong>L4</strong></td>
                <td>自定义代码</td>
                <td>Island hydration、RPC、插件逻辑</td>
              </tr>
            </tbody>
          </table>
          <p>
            跳过一层 = 违反设计哲学。参见
            <a href="/guide/architecture">KISS 架构</a>
            获取完整决策树。
          </p>

          <h2>审查清单</h2>
          <code-block
            ><pre><code>每次提交前，问自己：
            1. 新依赖？     → 是否违反"最小化增强"？
            2. 修改了构建？→ 是否违反"Web 标准优先"？
            3. 新抽象？     → 你在重新发明轮子吗？
            4. 平台代码？   → 是否违反"无运行时绑定"？
            5. 强制选择？   → 是否违反"无框架绑定"？
            6. 添加了 JS？   → 低层能做吗？
            7. 破坏了 Shadow DOM？ → 有 DSD 兼容的替代方案吗？</code></pre></code-block>
          <p>
            任何"是"都需要一份 ADR（架构决策记录）。
          </p>

          <h2>竞争格局</h2>
          <table>
            <thead>
              <tr>
                <th>框架</th>
                <th>HTTP</th>
                <th>UI</th>
                <th>构建</th>
                <th>DSD</th>
                <th>Jamstack</th>
                <th>全标准</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Next.js</td>
                <td>自定义</td>
                <td>React</td>
                <td>Webpack</td>
                <td>—</td>
                <td>部分</td>
                <td>0/3</td>
              </tr>
              <tr>
                <td>Astro</td>
                <td>自定义</td>
                <td>任意</td>
                <td>ESM</td>
                <td>—</td>
                <td>是</td>
                <td>1/3</td>
              </tr>
              <tr>
                <td>Fresh</td>
                <td>自定义</td>
                <td>Preact</td>
                <td>ESM</td>
                <td>—</td>
                <td>否</td>
                <td>1/3</td>
              </tr>
              <tr>
                <td><strong>KISS</strong></td>
                <td><strong>Fetch API</strong></td>
                <td><strong>Web Components</strong></td>
                <td><strong>ESM</strong></td>
                <td><strong>✓</strong></td>
                <td><strong>是</strong></td>
                <td><strong>3/3</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">&larr; 快速上手</a>
            <a href="/guide/architecture" class="nav-link">架构设计 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-design-philosophy', DesignPhilosophyPage);
export default DesignPhilosophyPage;
export const tagName = 'page-design-philosophy';
