import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class ConfigurationPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .deprecated {
        color: var(--kiss-text-tertiary);
        text-decoration: line-through;
      }
      .new-badge {
        display: inline-block;
        background: var(--kiss-accent-subtle);
        color: var(--kiss-accent);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        vertical-align: middle;
      }
    `,
  ];
  override render() {
    return html`
      <kiss-layout currentPath="/guide/configuration">
        <div class="container">
          <h1>配置</h1>
          <p class="subtitle">kiss() 选项和 Vite 配置参考。</p>

          <h2>kiss() 选项</h2>
          <table>
            <thead>
              <tr>
                <th>选项</th>
                <th>默认值</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">routesDir</span></td>
                <td><span class="inline-code">'app/routes'</span></td>
                <td>页面和 API 路由目录</td>
              </tr>
              <tr>
                <td><span class="inline-code">islandsDir</span></td>
                <td><span class="inline-code">'app/islands'</span></td>
                <td>交互式 Island 组件目录</td>
              </tr>
              <tr>
                <td><span class="inline-code">componentsDir</span></td>
                <td><span class="inline-code">'app/components'</span></td>
                <td>共享组件目录</td>
              </tr>
              <tr>
                <td><span class="inline-code">middleware</span></td>
                <td><span class="inline-code">undefined</span></td>
                <td>Hono 中间件模块路径</td>
              </tr>
              <tr>
                <td>
                  <span class="inline-code">inject</span> <span class="new-badge">新</span>
                </td>
                <td><span class="inline-code">undefined</span></td>
                <td>注入样式表、脚本、HTML 片段到 &lt;head&gt;</td>
              </tr>
              <tr>
                <td>
                  <span class="inline-code">packageIslands</span> <span class="new-badge">新</span>
                </td>
                <td><span class="inline-code">[]</span></td>
                <td>要扫描 Island 的包名数组（自动探测）</td>
              </tr>
              <tr>
                <td><span class="inline-code">ui</span> <span class="deprecated">已弃用</span></td>
                <td><span class="inline-code">undefined</span></td>
                <td>请使用 <span class="inline-code">inject</span> 替代</td>
              </tr>
            </tbody>
          </table>

          <h2>inject 选项 <span class="new-badge">新</span></h2>
          <p>
            通用 &lt;head&gt; 注入——替代旧的 <span class="inline-code">ui</span> 选项。适用于
            任何 CDN 或本地资源：
          </p>
          <code-block
            ><pre><code>kiss({
  inject: {
    stylesheets: [
      'https://cdn.example.com/style.css',
    ],
    scripts: [
      'https://cdn.example.com/ui.js',
    ],
    headFragments: [
      '&lt;meta name="theme-color" content="#0a0a0a"&gt;',
    ],
  },
})</code></pre></code-block>

          <h2>packageIslands 选项 <span class="new-badge">新</span></h2>
          <p>
            自动探测并注册来自 npm/JSR 包的 Islands。框架会扫描包的
            <code>islands</code> 导出并自动注册：
          </p>
          <code-block
            ><pre><code>kiss({
  // 从 @kissjs/ui 包自动探测 Islands
  packageIslands: ['@kissjs/ui'],
})</code></pre></code-block>
          <p>
            包必须导出 <code>islands</code> 数组。详见
            <a href="/guide/islands">Islands 架构</a>。
          </p>

          <h2>完整配置示例</h2>
          <code-block
            ><pre><code>// vite.config.ts
import { kiss } from '@kissjs/core';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',         // GitHub Pages 设为 '/repo/'
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      middleware: 'app/middleware.ts',

      // 从包自动探测 Islands
      packageIslands: ['@kissjs/ui'],

      // 通用 head 注入（推荐）
      inject: {
        stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
        scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
      },

      // 旧版 WebAwesome CDN 快捷方式（已弃用，请用 inject）
      // ui: { cdn: true, version: '3.5.0' },
    }),
  ],
})</code></pre></code-block>

          <h2>项目结构约定</h2>
          <code-block
            ><pre><code>my-app/
  app/
    routes/        # 基于文件的路由
      index.ts     # /
      about.ts     # /about
      api/
        posts.ts   # /api/posts (Hono)
    islands/       # 交互式组件（自动探测）
      counter.ts
    components/    # 共享 Lit 组件
      header.ts
  deno.json
  vite.config.ts</code></pre></code-block>

          <div class="nav-row">
            <a href="/guide/ssg" class="nav-link">&larr; SSG</a>
            <a href="/guide/error-handling" class="nav-link">错误处理 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-configuration', ConfigurationPage);
export default ConfigurationPage;
export const tagName = 'page-configuration';
