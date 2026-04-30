import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class WebAwesomePage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .demo-box {
        padding: 1.25rem;
        border: 1px solid var(--kiss-border);
        border-radius: 3px;
        margin: 0.75rem 0 1.5rem;
      }
      .demo-box .component-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
      }
    `,
  ];
  override render() {
    return html`
      <kiss-layout currentPath="/styling/web-awesome">
        <div class="container">
          <h1>Web Awesome 组件</h1>
          <p class="subtitle">通过 CDN 使用 50+ UI 组件。无需导入。</p>

          <h2>工作原理</h2>
          <p>
            在 <span class="inline-code">kiss()</span> 配置中设置 <span class="inline-code">inject</span> 选项，
            将 Web Awesome 的 CSS 和 loader 注入到 <span class="inline-code">&lt;head&gt;</span>。
            所有 <span class="inline-code">&lt;wa-*&gt;</span> 自定义元素全局可用——无需逐组件导入。
          </p>

          <div class="demo-box">
            <h3>按钮</h3>
            <div class="component-row">
              <wa-button variant="brand">品牌</wa-button>
              <wa-button variant="success">成功</wa-button>
              <wa-button variant="danger">危险</wa-button>
              <wa-button variant="default">默认</wa-button>
            </div>
            <code-block>
              <pre><code>&lt;wa-button variant="brand"&gt;品牌&lt;/wa-button&gt;
&lt;wa-button variant="danger"&gt;危险&lt;/wa-button&gt;</code></pre>
            </code-block>
          </div>

          <div class="demo-box">
            <h3>卡片</h3>
            <wa-card>
              <h2 slot="header">卡片标题</h2>
              <p>带 header 和 footer slots 的 Web Awesome 卡片组件。</p>
              <wa-button slot="footer" variant="brand">操作</wa-button>
            </wa-card>
            <code-block>
              <pre><code>&lt;wa-card&gt;
  &lt;h2 slot="header"&gt;标题&lt;/h2&gt;
  &lt;p&gt;内容&lt;/p&gt;
  &lt;wa-button slot="footer" variant="brand"&gt;操作&lt;/wa-button&gt;
&lt;/wa-card&gt;</code></pre>
            </code-block>
          </div>

          <div class="demo-box">
            <h3>徽章</h3>
            <div class="component-row">
              <wa-badge variant="primary">主要</wa-badge>
              <wa-badge variant="success">成功</wa-badge>
              <wa-badge variant="danger">危险</wa-badge>
              <wa-badge variant="warning">警告</wa-badge>
            </div>
            <code-block>
              <pre><code>&lt;wa-badge variant="primary"&gt;主要&lt;/wa-badge&gt;
&lt;wa-badge variant="danger"&gt;危险&lt;/wa-badge&gt;</code></pre>
            </code-block>
          </div>

          <h2>配置</h2>
          <p>通过 <span class="inline-code">inject</span> 选项启用 Web Awesome（推荐）：</p>
          <code-block>
            <pre><code>// vite.config.ts
import { kiss } from '@kissjs/core'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    kiss({
      inject: {
        stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
        scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
      },
    }),
  ]
})</code></pre>
          </code-block>

          <h2>从 <span class="inline-code">ui</span> 选项迁移</h2>
          <p>
            旧的 <span class="inline-code">ui: { cdn: true }</span> 快捷方式仍然可用，但已弃用。迁移方法：
          </p>
          <code-block>
            <pre><code>// 之前（已弃用）
kiss({ ui: { cdn: true } })

// 之后（推荐）
kiss({
  inject: {
    stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
    scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
  },
})</code></pre>
          </code-block>
          <p>
            <span class="inline-code">inject</span> 选项更灵活——适用于任何 CDN、任何版本、任何外部资源。
          </p>

          <div class="nav-row">
            <a href="/ui" class="nav-link">&larr; @kissjs/ui</a>
            <a href="https://webawesome.com/docs" class="nav-link">Web Awesome 文档 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-web-awesome', WebAwesomePage);
export default WebAwesomePage;
export const tagName = 'page-web-awesome';
