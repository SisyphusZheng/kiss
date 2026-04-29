import { LitElement, html, css } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class GettingStartedPage extends LitElement {
  static styles = [pageStyles, css`
    .step { margin-bottom: 1.75rem; }
    .step h2 { font-size: 1rem; margin: 0 0 0.5rem; }
  `];
  render() {
    return html`
      <kiss-layout currentPath="/guide/getting-started">
        <div class="container">
          <h1>快速上手</h1>
          <p class="subtitle">5 分钟内部署运行。</p>

          <div class="step">
            <h2>1. 创建项目</h2>
            <code-block><pre><code>mkdir my-app && cd my-app</code></pre></code-block>
          </div>

          <div class="step">
            <h2>2. 初始化 Deno</h2>
            <code-block><pre><code>deno init</code></pre></code-block>
          </div>

          <div class="step">
            <h2>3. 添加依赖</h2>
            <code-block><pre><code>deno add jsr:@kissjs/core</code></pre></code-block>
          </div>

          <div class="step">
            <h2>4. 配置 Vite</h2>
            <code-block><pre><code>// vite.config.ts
import { kiss } from '@kissjs/core';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      inject: {
        stylesheets: ['https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css'],
        scripts: ['https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js'],
      },
    }),
  ],
})</code></pre></code-block>
          </div>

          <div class="step">
            <h2>5. 创建你的第一个页面</h2>
            <code-block><pre><code>// app/routes/index.ts
import { LitElement, html, css } from '@kissjs/core';

export const tagName = 'home-page';
export default class HomePage extends LitElement {
  static styles = css\`:host { display: block; padding: 2rem; }\`;
  render() {
    return html\`&lt;h1&gt;Hello KISS!&lt;/h1&gt;\`;
  }
}</code></pre></code-block>
          </div>

          <div class="step">
            <h2>6. 启动开发服务器</h2>
            <code-block><pre><code>deno run -A npm:vite</code></pre></code-block>
            <p>打开 <span class="inline-code">localhost:5173</span> 查看页面。SSG 输出包含声明式 Shadow DOM —— 即使 JavaScript 尚未加载，内容也可见。</p>
          </div>

          <div class="nav-row">
            <a href="/guide/design-philosophy" class="nav-link">设计哲学 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-getting-started', GettingStartedPage);
export default GettingStartedPage;
export const tagName = 'page-getting-started';
