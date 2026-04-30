import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class TestingPage extends LitElement {
  static override styles = [
    pageStyles,
  ];
  override render() {
    return html`
      <kiss-layout currentPath="/guide/testing">
        <div class="container">
          <h1>测试策略</h1>
          <p class="subtitle">测试金字塔、框架内置测试、以及你的项目测试模板。</p>

          <h2>测试金字塔</h2>
          <table>
            <thead>
              <tr>
                <th>层级</th>
                <th>占比</th>
                <th>速度</th>
                <th>用途</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>单元测试</td>
                <td>70%</td>
                <td>&lt;10ms</td>
                <td>独立函数 / 组件逻辑</td>
              </tr>
              <tr>
                <td>集成测试</td>
                <td>20%</td>
                <td>&lt;100ms</td>
                <td>路由 + SSR + 渲染</td>
              </tr>
              <tr>
                <td>E2E 测试</td>
                <td>10%</td>
                <td>秒级</td>
                <td>关键用户流程</td>
              </tr>
            </tbody>
          </table>

          <h2>测试框架</h2>
          <p>KISS 使用 Deno 内置测试运行器——零额外依赖：</p>
          <code-block>
            <pre><code>// __tests__/context_test.ts
import { assertEquals } from 'jsr:@std/assert';
import { extractParams, parseQuery } from '@kissjs/core';

Deno.test('extractParams 解析动态片段', () => {
  const params = extractParams('/users/:id', '/users/42');
  assertEquals(params, { id: '42' });
});</code></pre></code-block>

          <h2>测试你的 KISS 应用</h2>
          <code-block>
            <pre><code>// tests/api_test.ts
import { assertEquals } from 'jsr:@std/assert';

Deno.test('API 返回 posts', async () => {
  const res = await fetch('http://localhost:3000/api/posts');
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(Array.isArray(data), true);
});</code></pre></code-block>

          <h2>CI 集成</h2>
          <code-block>
            <pre><code># .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
      - run: deno test --allow-read --allow-write</code></pre></code-block>

          <h2>KISS 内部测试了什么</h2>
          <ul>
            <li><span class="inline-code">entry-descriptor</span> —— EntryDescriptor 数据模型构建器</li>
            <li><span class="inline-code">entry-renderer</span> —— 从描述符生成代码</li>
            <li><span class="inline-code">route-scanner</span> —— 基于文件的路由发现</li>
            <li><span class="inline-code">island-transform</span> —— AST 标记 + hydration 探测</li>
            <li><span class="inline-code">ssr-handler</span> —— SSR 渲染 + 错误处理</li>
            <li><span class="inline-code">context</span> —— 请求上下文工具</li>
            <li><span class="inline-code">errors</span> —— 错误类层级</li>
          </ul>

          <div class="nav-row">
            <a href="/guide/security-middleware" class="nav-link">&larr; 安全 &amp; 中间件</a>
            <a href="/guide/architecture" class="nav-link">架构 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-testing', TestingPage);
export default TestingPage;
export const tagName = 'page-testing';
