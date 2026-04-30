/**
 * Blog Post — .kiss Compiler Vision
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export class BlogKissCompilerPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .blog-meta { font-size: 0.75rem; color: var(--kiss-text-muted); margin-bottom: 1.5rem; }
      h2 { font-size: 1rem; font-weight: 500; margin: 1.5rem 0 0.5rem; color: var(--kiss-text-primary); }
      p { font-size: 0.875rem; line-height: 1.7; margin: 0 0 0.75rem; }
      .code-block { 
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono","Fira Code",monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--kiss-text-secondary);
        white-space: pre;
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/blog/kiss-compiler">
        <div class="container">
          <p class="blog-meta">2026-04-30 · SisyphusZheng</p>
          <h1>.kiss Compiler — 消灭 Lit，零运行时 Web Components</h1>

          <p>
            KISS 框架从第一天起就选择了 Lit 作为组件基础。这个选择是对的——Lit 是 Web Components 生态中
            最成熟的库，让我们快速验证了 K·I·S·S 架构的可行性。但经过 v0.3.x 三轮代码审查，我们清楚地看到：
            Lit 的 58kb gzip 运行时、@lit-labs/ssr 的 CJS polyfill、hydration 顺序问题、以及 dprint fmt panic，
            这些不是可以修补的小问题——是架构层面的摩擦。
          </p>

          <h2>今天的代价</h2>
          <p>
            每个依赖 Lit 的 KISS 页面都要下载 58kb gzip 的运行时。SSR 需要 @lit-labs/ssr，
            它又依赖 node-domexception——一个 CJS 包，我们被迫用 globalThis.module polyfill。
            客户端 hydration 需要 litElementHydrateSupport 在 customElements.define 之前执行，
            这导致过"计数器重复渲染"的 bug。Deno fmt 在处理 Lit 模板字面量中的 HTML entities 时会 panic。
            这些不是小问题——是 Lit 的 CSFirst 设计与 KISS 的 SSG-first 架构的根本摩擦。
          </p>

          <h2>.kiss 文件格式</h2>
          <p>一个组件一个文件。没有 class 声明，没有 decorator，没有 import：</p>
          <div class="code-block">&lt;!-- my-counter.kiss --&gt;
&lt;template&gt;
  &lt;button @click="decrement"&gt;−&lt;/button&gt;
  &lt;span&gt;{count}&lt;/span&gt;
  &lt;button @click="increment"&gt;+&lt;/button&gt;
&lt;/template&gt;

&lt;script&gt;
  count = 0
  increment() { this.count++ }
  decrement() { this.count-- }
&lt;/script&gt;

&lt;style&gt;
  :host { display: inline-flex; gap: 0.5rem; align-items: center; }
&lt;/style&gt;</div>

          <h2>编译器产出</h2>
          <p>零依赖的原生 Custom Element：</p>
          <div class="code-block">class MyCounter extends HTMLElement {
  #count = 0;
  #root = this.attachShadow({ mode: 'open' });
  get count() { return this.#count; }
  set count(v) { this.#count = v; this.#update(); }
  connectedCallback() {
    this.#root.append(tpl.content.cloneNode(true));
    this.#root.querySelector('button:first-child').onclick =
      () => this.count--;
    this.#root.querySelector('button:last-child').onclick =
      () => this.count++;
  }
}</div>

          <h2>消除清单</h2>
          <p>
            — 58kb gzip lit 运行时 → 0kb<br>
            — @lit-labs/ssr + DOM shim → template.innerHTML (同步)<br>
            — DSD + hydrate() + 时序 bug → template.cloneNode (无 hydration)<br>
            — node-domexception CJS polyfill → 0 polyfill<br>
            — esbuild decorator transform → 标准 JS<br>
            — 复杂的类型层次 → 简单的 getter/setter
          </p>

          <h2>路线</h2>
          <p>
            这项工作在 roadmap 上列为 Phase 11，目标 v1.0。Lit 兼容模式在整个 v0.x
            生命周期中都会保留。在 Phase 10 (v0.4.0) 我们聚焦于 PWA、博客模块和文档完善，
            为 v1.0 的架构升级做准备。
          </p>
          <p>
            详细技术设计见 <code>docs/decisions/0002-kiss-compiler-eliminate-lit.md</code>。
          </p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/blog" class="nav-link">&larr; 返回博客</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-blog-kiss-compiler', BlogKissCompilerPage);
export default BlogKissCompilerPage;
export const tagName = 'page-blog-kiss-compiler';
