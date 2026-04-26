import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '../../components/layout.js';
import '../../islands/code-block.js';

export class KissUIPage extends LitElement {
  static styles = [
    pageStyles,
    css`
      .callout {
        padding: 1rem 1.25rem;
        margin: 1rem 0;
        border-left: 3px solid var(--border-hover);
        background: var(--bg-surface);
        border-radius: 0 3px 3px 0;
      }
      .callout.warn {
        border-left-color: var(--text-muted);
      }
    `,
  ];
  render() {
    return html`
      <app-layout currentPath="/styling/kiss-ui">
        <div class="container">
          <h1>@kissjs/ui</h1>
          <p class="subtitle">KISS Architecture 的 UI 层 — 从 CDN 注入到自有设计语言的演进路径。</p>

          <h2>当前状态：WebAwesome CDN Loader</h2>
          <p>
            <span class="inline-code">@kissjs/ui</span> v0.1.x 是一个轻量的 Vite 插件，用于向 HTML 注入
            WebAwesome CDN 链接。它不是一个组件库——它是一个便利加载器。
          </p>

          <code-block
          ><pre><code>// vite.config.ts
            import { kiss } from '@kissjs/core'

            export default defineConfig({
              plugins: [kiss({
                inject: {
                  stylesheets: ['https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css'],
                  scripts: ['https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js'],
                },
              })]
            })</code></pre></code-block>

            <p>
              或者使用旧的 <span class="inline-code">ui</span> 选项（已废弃，推荐 <span class="inline-code"
              >inject</span>）：
            </p>
            <code-block
            ><pre><code>// 旧版（已废弃）
              kiss({ ui: { cdn: true } })</code></pre></code-block>

              <h2>设计原则</h2>
              <p>@kissjs/ui 遵循 KISS Architecture 四约束：</p>
              <ul>
                <li>
                  <strong>Web Standards First</strong> — 组件是标准 Web Components（Lit），非框架私有抽象
                </li>
                <li>
                  <strong>Minimal Augmentation</strong> — UI 层是可选的，不用 @kissjs/ui 也能写 KISS 应用
                </li>
                <li><strong>No Framework Binding</strong> — 组件可在任何 Web Components 环境使用</li>
                <li><strong>No Runtime Binding</strong> — 纯 ESM 输出，无平台依赖</li>
                <li><strong>Semantic (S)</strong> — 从 CDN 注入起步，按需引入组件</li>
              </ul>

              <h2>演进路线：自有设计语言</h2>
              <p>当前 @kissjs/ui 只做 CDN 注入。下一步是构建 KISS 自有的 Web Components 组件库：</p>
              <ul>
                <li>基于 <strong>Open Props</strong> 设计令牌 + <strong>Lit</strong> 组件封装</li>
                <li>暗黑瑞士国际主义风格（文档站当前设计语言）</li>
                <li>KISS Architecture 合规：所有组件输出 DSD，支持 Shadow DOM 封装</li>
                <li>零运行时 bundle：非交互组件不发送 JS</li>
              </ul>

              <div class="callout warn">
                <p>
                  <strong>计划中</strong> — 自有组件库尚在规划阶段。当前如需 UI 组件，推荐使用 WebAwesome CDN
                  注入。
                </p>
              </div>

              <h2>WebAwesome 组件参考</h2>
              <p>通过 CDN 注入后，可直接使用 WebAwesome 组件：</p>
              <code-block
              ><pre><code>&lt;wa-button appearance="outlined"&gt;Click me&lt;/wa-button&gt;
                &lt;wa-card&gt;Card content&lt;/wa-card&gt;
                &lt;wa-input label="Name"&gt;&lt;/wa-input&gt;</code></pre></code-block>
              <p>
                完整组件列表：<a href="https://webawesome.com/docs/components" style="color: #6a9bcc;"
                >WebAwesome 文档</a>
              </p>

              <div class="nav-row">
                <a href="/guide/deployment" class="nav-link">&larr; Deployment</a>
                <a href="/styling/web-awesome" class="nav-link">Web Awesome &rarr;</a>
              </div>
            </div>
          </app-layout>
        `;
      }
    }

    customElements.define('page-kiss-ui', KissUIPage);
    export default KissUIPage;
    export const tagName = 'page-kiss-ui';
