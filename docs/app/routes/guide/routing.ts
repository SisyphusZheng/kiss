import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class RoutingGuidePage extends LitElement {
  static styles = [
    pageStyles,
    css`
    `,
  ];
  render() {
    return html`
      <kiss-layout currentPath="/guide/routing">
        <div class="container">
          <h1>路由</h1>
          <p class="subtitle">基于文件的路由——创建一个文件，就得到一个路由。</p>

          <h2>基础路由</h2>
          <p>
            在 <span class="inline-code">app/routes/</span> 下创建一个文件，它会自动变为路由。
          </p>
          <table>
            <thead>
              <tr>
                <th>文件</th>
                <th>路由</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">app/routes/index.ts</span></td>
                <td><span class="inline-code">/</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/about.ts</span></td>
                <td><span class="inline-code">/about</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/guide/getting-started.ts</span></td>
                <td><span class="inline-code">/guide/getting-started</span></td>
              </tr>
            </tbody>
          </table>

          <h2>动态路由</h2>
          <p>使用方括号表示动态片段：</p>
          <table>
            <thead>
              <tr>
                <th>文件</th>
                <th>路由</th>
                <th>参数</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">app/routes/posts/[slug].ts</span></td>
                <td><span class="inline-code">/posts/:slug</span></td>
                <td><span class="inline-code">slug</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/users/[id]/posts.ts</span></td>
                <td><span class="inline-code">/users/:id/posts</span></td>
                <td><span class="inline-code">id</span></td>
              </tr>
            </tbody>
          </table>

          <h2>特殊文件</h2>
          <table>
            <thead>
              <tr>
                <th>文件</th>
                <th>用途</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">_renderer.ts</span></td>
                <td>SSR 的自定义 HTML 包装器</td>
              </tr>
              <tr>
                <td><span class="inline-code">_middleware.ts</span></td>
                <td>路由树的 Hono 中间件</td>
              </tr>
            </tbody>
          </table>

          <h2>路由模块约定</h2>
          <p>每个路由模块必须导出：</p>
          <table>
            <thead>
              <tr>
                <th>导出</th>
                <th>类型</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">default</span></td>
                <td>LitElement class</td>
                <td>页面组件</td>
              </tr>
              <tr>
                <td><span class="inline-code">tagName</span></td>
                <td>string</td>
                <td>自定义元素标签名</td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/architecture" class="nav-link">&larr; KISS 架构</a>
            <a href="/guide/islands" class="nav-link">Islands &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-routing-guide', RoutingGuidePage);
export default RoutingGuidePage;
export const tagName = 'page-routing-guide';
