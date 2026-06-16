export const meta = { section: 'Production', label: 'Configuration', order: 10 };
import { pageStylesSheet } from '../../components/page-styles.js';
import { OpenElement } from '@openelement/element';
import { linearTokenSheet } from '@openelement/ui';
import '@openelement/ui\/open-code-block';
import '@openelement/ui\/open-button-linear';

export class ConfigurationPage extends OpenElement {
  declare locale?: string;

  static override styles = [linearTokenSheet, pageStylesSheet];
  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    const loc = this._getLocale('zh');

    return (
      <div class='container'>
        <h1>配置</h1>
        <p class='subtitle'>
          openElement 通过 Vite 插件配置。路由、island、静态输出、head 注入、PWA 和 middleware
          是各自独立的关注点。
        </p>
        <h2>Minimal Configuration</h2>
        <open-code-block>
          <pre><code>import {'{'} defineConfig {'}'} from 'vite';
import {'{'} openElement {'}'} from '@openelement/app/vite';
export default defineConfig({'{'} plugins: [openElement()] {'}'});</code></pre>
        </open-code-block>
        <p>
          使用 <span class='inline-code'>openElement()</span>{' '}
          是推荐方式--它组合了核心插件、内容管线和 i18n，一个调用包含所有功能。高级构建参考可以讨论
          {' '}
          <span class='inline-code'>@openelement/adapter-vite</span>，但常规项目应从{' '}
          <span class='inline-code'>@openelement/app/vite</span> 开始。
        </p>
        <h2>Main Options</h2>
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Default</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>routesDir</td>
              <td>'app/routes'</td>
              <td>Page routes, API routes, renderer and route-tree middleware.</td>
            </tr>
            <tr>
              <td>islandsDir</td>
              <td>'app/islands'</td>
              <td>Custom Elements for local client-side upgrade.</td>
            </tr>
            <tr>
              <td>componentsDir</td>
              <td>'app/components'</td>
              <td>Shared server-rendered components.</td>
            </tr>
            <tr>
              <td>packageIslands</td>
              <td>[]</td>
              <td>Packages that export an islands metadata array.</td>
            </tr>
          </tbody>
        </table>
        <h2>JSX 配置（v0.24.1）</h2>
        <p>
          openElement v0.24.1 使用 JSX + Signal 作为组件模型。需要配置 deno.json 和 vite.config.ts：
        </p>
        <open-code-block>
          <pre><code>{'// deno.json'}
{'{'}
  "compilerOptions": {'{'}
    "jsx": "react-jsx",
    "jsxImportSource": "@openelement/core"
  {'}'},
  "imports": {'{'}
    "@openelement/core/jsx-runtime": "jsr:@openelement/core@^0.24.1/jsx-runtime",
    "@openelement/core/jsx-dev-runtime": "jsr:@openelement/core@^0.24.1/jsx-runtime"
  {'}'}
{'}'}</code></pre>
        </open-code-block>
        <open-code-block>
          <pre><code>{'// vite.config.ts'}
export default defineConfig({'{'}
  esbuild: {'{'}
    jsx: 'automatic',
    jsxImportSource: '@openelement/core',
  {'}'},
  plugins: [openElement({'{'} ... {'}'})]
{'}'});</code></pre>
        </open-code-block>
        <p>
          <span class='inline-code'>jsx: 'automatic'</span>{' '}
          告诉 esbuild 使用 openElement 的 jsx-runtime 而不是 React 的。Vite 的 SSR 和 client island
          构建都会正确转换 <span class='inline-code'>.tsx</span> 文件。
        </p>
        <h2>Document Metadata, Head Injection, Package Islands, Middleware, PWA</h2>
        <open-code-block>
          <pre><code>openElement({'{'}
  html: {'{'} lang: 'en', title: 'My App' {'}'},
  inject: {'{'}
    stylesheets: ['https://cdn.example.com/theme.css'],
    headFragments: ['&lt;meta name="theme-color" content="#050505"&gt;'],
  {'}'},
  packageIslands: ['@openelement/ui'],
  middleware: {'{'} logger: true, cors: true, csp: {'{'} policy: "default-src 'self'" {'}'} {'}'},
  pwa: {'{'} name: 'My App', shortName: 'openElement', themeColor: '#050505' {'}'},
  content: {'{'} blog: {'{'} contentDir: 'posts' {'}'}, nav: {'{'} routesDir: 'app/routes' {'}'} {'}'},
  i18n: {'{'} locales: ['en', 'zh'], defaultLocale: 'en' {'}'},
{'}'});</code></pre>
        </open-code-block>
        <div class='nav-row'>
          <open-button-linear variant='secondary' href='/api/reference'>← API Design</open-button-linear>
          <open-button-linear variant='secondary' href='/guide/error-handling'>Security &amp; Middleware →</open-button-linear>
        </div>
      </div>
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');

    return (
      <div class='container'>
        <h1>Configuration</h1>
        <p class='subtitle'>
          openElement is configured through Vite plugins. Routes, islands, static output, head
          injection, PWA, and middleware are independent concerns.
        </p>
        <h2>Minimal Configuration</h2>
        <open-code-block>
          <pre><code>import {'{'} defineConfig {'}'} from 'vite';
import {'{'} openElement {'}'} from '@openelement/app/vite';
export default defineConfig({'{'} plugins: [openElement()] {'}'});</code></pre>
        </open-code-block>
        <p>
          Use <span class='inline-code'>openElement()</span>{' '}
          as the recommended entry - it combines the core plugin, content pipeline, and i18n in a
          single call. Advanced build references may discuss{' '}
          <span class='inline-code'>@openelement/adapter-vite</span>, but ordinary projects should
          start from <span class='inline-code'>@openelement/app/vite</span>.
        </p>
        <h2>Options Reference</h2>
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Default</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>routesDir</td>
              <td>'app/routes'</td>
              <td>Page routes, API routes, renderer and route-tree middleware.</td>
            </tr>
            <tr>
              <td>islandsDir</td>
              <td>'app/islands'</td>
              <td>Custom Elements for local client-side upgrade.</td>
            </tr>
            <tr>
              <td>componentsDir</td>
              <td>'app/components'</td>
              <td>Shared server-rendered components.</td>
            </tr>
            <tr>
              <td>packageIslands</td>
              <td>[]</td>
              <td>
                Packages exporting an islands metadata array. This is not yet a full registry
                protocol.
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          Future <code>open add</code>{' '}
          support should update this option only after a package manifest passes validation. Until
          then, third-party packages should be added explicitly and reviewed like any other
          dependency.
        </p>
        <h2>JSX Configuration (v0.24.1)</h2>
        <p>
          openElement v0.24.1 uses JSX+Signal as the component model. Configure deno.json and
          vite.config.ts:
        </p>
        <open-code-block>
          <pre><code>{'// deno.json'}
{'{'}
  "compilerOptions": {'{'}
    "jsx": "react-jsx",
    "jsxImportSource": "@openelement/core"
  {'}'},
  "imports": {'{'}
    "@openelement/core/jsx-runtime": "jsr:@openelement/core@^0.24.1/jsx-runtime",
    "@openelement/core/jsx-dev-runtime": "jsr:@openelement/core@^0.24.1/jsx-runtime"
  {'}'}
{'}'}</code></pre>
        </open-code-block>
        <open-code-block>
          <pre><code>{'// vite.config.ts'}
export default defineConfig({'{'}
  esbuild: {'{'}
    jsx: 'automatic',
    jsxImportSource: '@openelement/core',
  {'}'},
  plugins: [openElement({'{'} ... {'}'})]
{'}'});</code></pre>
        </open-code-block>
        <p>
          <span class='inline-code'>jsx: 'automatic'</span>{' '}
          tells esbuild to use openElement's jsx-runtime instead of React's. Both Vite SSR and
          client island builds will correctly transform <span class='inline-code'>.tsx</span> files.
        </p>
        <h2>Document Metadata, Head Injection, Package Islands, Middleware, PWA</h2>
        <open-code-block>
          <pre><code>openElement({'{'}
  html: {'{'} lang: 'en', title: 'My App' {'}'},
  inject: {'{'}
    stylesheets: ['https://cdn.example.com/theme.css'],
    headFragments: ['&lt;meta name="theme-color" content="#050505"&gt;'],
  {'}'},
  packageIslands: ['@openelement/ui'],
  middleware: {'{'} logger: true, cors: true, csp: {'{'} policy: "default-src 'self'" {'}'} {'}'},
  pwa: {'{'} name: 'My App', shortName: 'openElement', themeColor: '#050505' {'}'},
  content: {'{'} blog: {'{'} contentDir: 'posts' {'}'}, nav: {'{'} routesDir: 'app/routes' {'}'} {'}'},
  i18n: {'{'} locales: ['en', 'zh'], defaultLocale: 'en' {'}'},
{'}'});</code></pre>
        </open-code-block>
        <p>
          See <a href='/guide/api'>API Reference</a> for the complete options table, or check the
          {' '}
          <a href='/guide/error-handling'>Security &amp; Middleware</a>{' '}
          guide for CSP and middleware configuration.
        </p>
        <div class='nav-row'>
          <open-button-linear variant='secondary' href='/api/reference'>← API Design</open-button-linear>
          <open-button-linear variant='secondary' href='/guide/error-handling'>Security &amp; Middleware →</open-button-linear>
        </div>
      </div>
    );
  }
}

customElements.define('page-configuration', ConfigurationPage);
export default ConfigurationPage;
export const tagName = 'page-configuration';
