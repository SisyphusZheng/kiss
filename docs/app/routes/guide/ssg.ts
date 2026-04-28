import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class SSGGuidePage extends LitElement {
  static styles = [
    pageStyles,
    css`
    `,
  ];
  render() {
    return html`
      <kiss-layout currentPath="/guide/ssg">
        <div class="container">
          <h1>静态站点生成（SSG）</h1>
          <p class="subtitle">在构建时将路由预渲染为带 DSD 的静态 HTML。</p>

          <h2>快速开始</h2>
          <p>SSG 内置在 <span class="inline-code">kiss()</span> 中。无需额外插件：</p>
          <code-block>
            <pre><code>// vite.config.ts
import { kiss } from '@kissjs/core';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    kiss({
      routesDir: 'app/routes',
      inject: {
        stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
        scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
      },
    }),
  ]
})</code></pre></code-block>

          <h2>工作原理</h2>
          <p>当你运行 <span class="inline-code">vite build</span> 时，kiss() 自动：</p>
          <ol>
            <li>扫描 <span class="inline-code">app/routes/</span> 中的页面路由</li>
            <li>创建临时 Vite SSR 服务器</li>
            <li>加载每个路由模块，通过 <span class="inline-code">@lit-labs/ssr</span> 渲染</li>
            <li>输出带 <strong>声明式 Shadow DOM</strong> 的 HTML —— 无需 JS 即可可见</li>
            <li>将 Island 组件提取到独立的 JS 包中</li>
            <li>将每个页面写入 <span class="inline-code">route/path/index.html</span></li>
          </ol>
          <p>动态路由（带 <span class="inline-code">[param]</span>）会自动跳过。</p>

          <h2>SSR 兼容性：使用 static properties</h2>
          <p>
            KISS 在 SSR 中使用 Vite 的 esbuild 进行即时转译。由于
            <strong>esbuild 对装饰器的支持有限</strong>，我们推荐使用
            <span class="inline-code">static properties</span> 而不是
            <span class="inline-code">@property</span> 装饰器：
          </p>
          <code-block>
            <pre><code>// ✅ 推荐：在 SSR 中可用
class MyComponent extends LitElement {
  static properties = {
    count: { type: Number },
    name: { type: String },
  };
  count = 0;
  name = '';
}

// ❌ 不推荐：在 SSR 中报错
import { property } from 'lit/decorators.js';
class MyComponent extends LitElement {
  @property({ type: Number }) count = 0;  // "Unsupported decorator location"
}
</code></pre></code-block>

          <p>
            <strong>为什么？</strong> Vite SSR 使用 esbuild 进行即时转译。esbuild 只
            支持旧的 <span class="inline-code">experimentalDecorators</span> 提案（TC39 Stage 2），
            对 <span class="inline-code">@property</span> 等字段装饰器的支持有限。
          </p>
          <p>
            <span class="inline-code">static properties</span> 是 Lit 推荐的语法，
            在任何地方都能工作，并且符合 KISS 的"Web 标准优先"哲学——无需装饰器 polyfill。
          </p>

          <h2>DSD 输出</h2>
          <p>每个渲染的页面都为所有 Lit 组件包含声明式 Shadow DOM。这意味着：</p>
          <table>
            <thead>
              <tr>
                <th>特性</th>
                <th>DSD 输出</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Shadow DOM 样式</td>
                <td>
                  作用在 <span class="inline-code">&lt;template shadowrootmode="open"&gt;</span> 内部
                </td>
              </tr>
              <tr>
                <td>内容可见性</td>
                <td>立即显示 —— 无需 JS</td>
              </tr>
              <tr>
                <td>SEO / 爬取</td>
                <td>完整内容可供爬虫访问</td>
              </tr>
              <tr>
                <td>Hydration</td>
                <td>Lit 复用时直接复用现有 DOM</td>
              </tr>
            </tbody>
          </table>

          <h2>GitHub Pages</h2>
          <p>将 <span class="inline-code">base</span> 设为你的仓库名，带尾部斜杠：</p>
          <code-block>
            <pre><code>// vite.config.ts
export default defineConfig({
  base: '/my-repo/',
  plugins: [kiss({
    inject: {
      stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
      scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
    },
  })],
})</code></pre></code-block>

          <h2>构建 &amp; 部署</h2>
          <code-block>
            <pre><code>deno run -A npm:vite build
  # 输出在 dist/ —— 部署到任何静态托管服务</code></pre></code-block>

          <div class="nav-row">
            <a href="/guide/api-design" class="nav-link">&larr; API 设计</a>
            <a href="/guide/configuration" class="nav-link">配置 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-ssg-guide', SSGGuidePage);
export default SSGGuidePage;
export const tagName = 'page-ssg-guide';
