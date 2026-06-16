export const meta = { section: 'Production', label: 'Testing', order: 40 };
import { pageStylesSheet } from '../../components/page-styles.js';
import { OpenElement } from '@openelement/element';
import { linearTokenSheet } from '@openelement/ui';
import '@openelement/ui\/open-code-block';
import '@openelement/ui\/open-button-linear';

export class TestingPage extends OpenElement {
  static override styles = [linearTokenSheet, pageStylesSheet];
  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    const loc = this._getLocale('zh');

    return (
      <div class='container'>
        <h1>测试</h1>
        <p class='subtitle'>
          openElement 测试应保护框架契约：路由扫描、DSD 输出、island 元数据、middleware 范围、SSG
          后处理和包边界。
        </p>
        <h2>项目测试</h2>
        <p>
          应用代码可以使用 Deno 内置的测试运行器。从纯逻辑和 API handler 的单元测试开始。
        </p>
        <h2>构建冒烟测试</h2>
        <p>
          静态优先框架至少需要一个测试来构建站点并验证生成的 HTML。
        </p>
        <h2>Playwright E2E 测试</h2>
        <p>
          openElement 包含 Playwright 端到端测试，在真实浏览器中验证 SSG 输出。
        </p>
        <div class='nav-row'>
          <open-button-linear variant='secondary' href='/guide/error-handling'>← 错误处理</open-button-linear>
          <open-button-linear variant='secondary' href='/guide/deployment'>部署 →</open-button-linear>
        </div>
      </div>
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');

    return (
      <div class='container'>
        <h1>Testing</h1>
        <p class='subtitle'>
          openElement testing should protect framework contracts: route scanning, DSD output, island
          metadata, middleware scope, SSG post-processing, and package boundaries.
        </p>
        <h2>Project Testing</h2>
        <p>
          Application code can use Deno's built-in test runner. Start with unit tests for pure logic
          and API handlers, then add build smoke tests for critical routes.
        </p>
        <h2>Build Smoke Tests</h2>
        <p>
          A static-first framework needs at least one test that builds the site and verifies the
          generated HTML. This catches route scanning, SSR, client island, and SSG integration
          issues.
        </p>
        <open-code-block>
          <pre><code>deno test --allow-read --allow-write --allow-env --allow-net --allow-run</code></pre>
        </open-code-block>
        <h2>Browser Testing</h2>
        <p>
          Use browser tests when behavior depends on Custom Element upgrade, IntersectionObserver,
          idle loading, service worker, or real DOM semantics.
        </p>
        <h2>Playwright E2E Tests</h2>
        <p>
          openElement includes Playwright end-to-end tests that verify SSG output in real browsers.
          They confirm DSD is correctly parsed, Custom Elements upgrade, and island strategies work
          as expected.
        </p>
        <div class='nav-row'>
          <open-button-linear variant='secondary' href='/guide/error-handling'>← Error Handling</open-button-linear>
          <open-button-linear variant='secondary' href='/guide/deployment'>Deployment →</open-button-linear>
        </div>
      </div>
    );
  }
}

customElements.define('page-testing', TestingPage);
export default TestingPage;
export const tagName = 'page-testing';
