export const meta = { section: 'Core', label: 'Islands & SSR', order: 4 };
import { pageStylesSheet } from '../../components/page-styles.js';
import { OpenElement } from '@openelement/element';
import { linearTokenSheet } from '@openelement/ui';
import '@openelement/ui\/open-code-block';
import '@openelement/ui\/open-callout';
import '@openelement/ui\/open-button-linear';

export class IslandsSsrPage extends OpenElement {
  static override styles = [linearTokenSheet, pageStylesSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return (
      <div class='container'>
        <h1>Islands 与 SSR</h1>
        <p class='subtitle'>
          openElement 的 Ocean/Island 模型：服务端通过 DSD 预渲染内容，客户端按需升级交互组件。
        </p>

        <h2>Ocean/Island 模式</h2>
        <p>
          "海洋"是纯静态内容（布局、文本、导航），"岛屿"是需要客户端交互的组件。
          这种架构的核心思想：大部分页面不需要 JavaScript，只有少数交互点需要。
        </p>
        <div
          class='comparison'
          style='display:grid;grid-template-columns:1fr 1fr;gap:var(--size-4);margin:var(--size-4) 0 var(--size-6)'
        >
          <div style='padding:var(--size-4);border:1px solid var(--border);border-radius:var(--radius-2)'>
            <h3>传统 SPA</h3>
            <ul>
              <li>JavaScript 加载前页面空白</li>
              <li>整页 hydration 消耗资源</li>
              <li>内容和交互绑定</li>
            </ul>
          </div>
          <div style='padding:var(--size-4);border:1px solid var(--border);border-radius:var(--radius-2);background:var(--bg-surface);border-left:3px solid var(--brand)'>
            <h3>openElement Islands</h3>
            <ul>
              <li>内容通过 SSG + DSD 预渲染</li>
              <li>只有需要的组件加载 JS</li>
              <li>内容与交互解耦</li>
            </ul>
          </div>
        </div>

        <h2>DSD 渲染</h2>
        <p>
          Declarative Shadow DOM 让服务端渲染的 Web Components 在 HTML 解析阶段就有 shadow root。
          用户看到内容的那一刻，不需要任何 JavaScript。
        </p>
        <open-code-block>
          <pre><code>{`&lt;my-card&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;:host { display: block; }&lt;/style&gt;
    &lt;p&gt;内容在 JavaScript 加载前即可见。&lt;/p&gt;
  &lt;/template&gt;
&lt;/my-card&gt;`}</code></pre>
        </open-code-block>

        <h2>三层组件模型</h2>
        <table>
          <thead>
            <tr>
              <th>层级</th>
              <th>类型</th>
              <th>客户端 JS</th>
              <th>适用场景</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Layer 1</td>
              <td>DSD Static</td>
              <td>无</td>
              <td>布局、导航、文章内容</td>
            </tr>
            <tr>
              <td>Layer 2</td>
              <td>DSD Interactive</td>
              <td>仅事件绑定</td>
              <td>主题切换、折叠面板、tabs</td>
            </tr>
            <tr>
              <td>Layer 3</td>
              <td>Pure Island</td>
              <td>完整客户端逻辑</td>
              <td>图表、复杂表单、WebSocket</td>
            </tr>
          </tbody>
        </table>

        <h2>Hydration 策略</h2>
        <p>
          通过 <code>defineIsland()</code> API 声明 island，支持四种 hydration 策略：
        </p>
        <open-code-block>
          <pre><code>{`import { defineIsland } from '@openelement/core';

export class MyChart extends OpenElement { /* ... */ }

// 立即加载（适合首屏交互元素）
defineIsland(MyChart, { strategy: 'load' });

// 浏览器空闲时加载（适合非关键 UI）
defineIsland(MyChart, { strategy: 'idle' });

// 进入视口时加载（适合懒加载内容）
defineIsland(MyChart, { strategy: 'visible' });

// 纯客户端渲染（无 DSD，无 SSR）
defineIsland(MyChart, { strategy: 'only' });`}</code></pre>
        </open-code-block>

        <table>
          <thead>
            <tr>
              <th>策略</th>
              <th>触发条件</th>
              <th>推荐用途</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>load</code>
              </td>
              <td>模块加载时</td>
              <td>首屏交互：导航菜单、搜索框</td>
            </tr>
            <tr>
              <td>
                <code>idle</code>
              </td>
              <td>requestIdleCallback</td>
              <td>非关键 UI：页脚组件</td>
            </tr>
            <tr>
              <td>
                <code>visible</code>
              </td>
              <td>IntersectionObserver</td>
              <td>懒加载：图片画廊、评论区</td>
            </tr>
            <tr>
              <td>
                <code>only</code>
              </td>
              <td>纯客户端</td>
              <td>浏览器专用：图表库、地图</td>
            </tr>
          </tbody>
        </table>

        <h2>创建 Island</h2>
        <p>
          将需要客户端行为的组件放在 <code>app/islands/</code> 目录：
        </p>
        <open-code-block>
          <pre><code>{`// app/islands/counter.ts
import { signal } from '@openelement/core';
import { OpenElement } from '@openelement/element';

export class Counter extends OpenElement {
  #count = signal(0);

  override render() {
    return (
      &lt;div&gt;
        &lt;button onClick={() => this.#count.value--}&gt;-&lt;/button&gt;
        &lt;span&gt;{this.#count}&lt;/span&gt;
        &lt;button onClick={() => this.#count.value++}&gt;+&lt;/button&gt;
      &lt;/div&gt;
    );
  }
}

customElements.define('my-counter', Counter);`}</code></pre>
        </open-code-block>
        <p>在页面中使用：</p>
        <open-code-block>
          <pre><code>&lt;my-counter&gt;&lt;/my-counter&gt;</code></pre>
        </open-code-block>
        <p>
          构建器会自动扫描{' '}
          <code>app/islands/</code>，生成 client entry，并注入到静态 HTML 中。 页面 HTML
          先渲染，浏览器加载 island entry 后再升级组件。
        </p>

        <h2>SSR vs CSR 行为对比</h2>
        <table>
          <thead>
            <tr>
              <th>方面</th>
              <th>SSR（服务端渲染）</th>
              <th>CSR（客户端渲染）</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>渲染输出</td>
              <td>DSD HTML 字符串</td>
              <td>shadow root 中的真实 DOM</td>
            </tr>
            <tr>
              <td>Signal 订阅</td>
              <td>渲染期间收集、序列化</td>
              <td>活跃状态，变化时更新 DOM</td>
            </tr>
            <tr>
              <td>事件处理</td>
              <td>序列化等待 hydration</td>
              <td>通过 addEventListener 直接绑定</td>
            </tr>
            <tr>
              <td>effect()</td>
              <td>执行一次，捕获输出</td>
              <td>持续执行</td>
            </tr>
            <tr>
              <td>ref</td>
              <td>静默跳过</td>
              <td>回调被调用</td>
            </tr>
          </tbody>
        </table>

        <open-callout type='info' label='Upgrade, Not Hydration'>
          openElement 使用 Island Upgrade 而非传统 hydration。浏览器解析 HTML 时 DSD 已经填充内容，
          客户端 entry 调用 <code>customElements.define()</code>{' '}
          升级已有元素为真正的 Custom Element。
        </open-callout>

        <div class='nav-row'>
          <open-button-linear variant='secondary' href='/guide/routing-and-data'>&larr; 路由与数据</open-button-linear>
          <open-button-linear variant='secondary' href='/guide/deployment'>部署 &rarr;</open-button-linear>
        </div>
      </div>
    );
  }

  private _renderEn() {
    return (
      <div class='container'>
        <h1>Islands & SSR</h1>
        <p class='subtitle'>
          openElement's Ocean/Island model: server pre-renders content via DSD, client upgrades
          interactive components on demand.
        </p>

        <h2>Ocean/Island Pattern</h2>
        <p>
          The "ocean" is purely static content (layout, text, navigation). "Islands" are components
          that need client-side interactivity. The core insight: most of a page doesn't need
          JavaScript — only a few interactive spots do.
        </p>
        <div
          class='comparison'
          style='display:grid;grid-template-columns:1fr 1fr;gap:var(--size-4);margin:var(--size-4) 0 var(--size-6)'
        >
          <div style='padding:var(--size-4);border:1px solid var(--border);border-radius:var(--radius-2)'>
            <h3>Traditional SPA</h3>
            <ul>
              <li>Blank page until JavaScript loads</li>
              <li>Full-page hydration is expensive</li>
              <li>Content and interactivity are tightly coupled</li>
            </ul>
          </div>
          <div style='padding:var(--size-4);border:1px solid var(--border);border-radius:var(--radius-2);background:var(--bg-surface);border-left:3px solid var(--brand)'>
            <h3>openElement Islands</h3>
            <ul>
              <li>Content pre-rendered via SSG + DSD</li>
              <li>Only needed components load JavaScript</li>
              <li>Content decoupled from interactivity</li>
            </ul>
          </div>
        </div>

        <h2>DSD Rendering</h2>
        <p>
          Declarative Shadow DOM lets server-rendered Web Components have their shadow root during
          HTML parsing. Users see content immediately — no JavaScript required.
        </p>
        <open-code-block>
          <pre><code>{`&lt;my-card&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;:host { display: block; }&lt;/style&gt;
    &lt;p&gt;Content is visible before JavaScript loads.&lt;/p&gt;
  &lt;/template&gt;
&lt;/my-card&gt;`}</code></pre>
        </open-code-block>

        <h2>Three-Layer Component Model</h2>
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Type</th>
              <th>Client JS</th>
              <th>Best Fit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Layer 1</td>
              <td>DSD Static</td>
              <td>None</td>
              <td>Layout, navigation, article content</td>
            </tr>
            <tr>
              <td>Layer 2</td>
              <td>DSD Interactive</td>
              <td>Events only</td>
              <td>Theme toggles, disclosure, tabs</td>
            </tr>
            <tr>
              <td>Layer 3</td>
              <td>Pure Island</td>
              <td>Full client logic</td>
              <td>Charts, complex forms, WebSocket</td>
            </tr>
          </tbody>
        </table>

        <h2>Hydration Strategies</h2>
        <p>
          Declare islands via <code>defineIsland()</code> API with four hydration strategies:
        </p>
        <open-code-block>
          <pre><code>{`import { defineIsland } from '@openelement/core';

export class MyChart extends OpenElement { /* ... */ }

// Load immediately (above-the-fold interactive elements)
defineIsland(MyChart, { strategy: 'load' });

// Defer until browser is idle (non-critical UI)
defineIsland(MyChart, { strategy: 'idle' });

// Load when entering viewport (lazy-loaded content)
defineIsland(MyChart, { strategy: 'visible' });

// Client-only render (no DSD, no SSR)
defineIsland(MyChart, { strategy: 'only' });`}</code></pre>
        </open-code-block>

        <table>
          <thead>
            <tr>
              <th>Strategy</th>
              <th>Trigger</th>
              <th>Recommended Use</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>load</code>
              </td>
              <td>Module load</td>
              <td>Above-fold: nav menus, search boxes</td>
            </tr>
            <tr>
              <td>
                <code>idle</code>
              </td>
              <td>requestIdleCallback</td>
              <td>Non-critical: footer widgets</td>
            </tr>
            <tr>
              <td>
                <code>visible</code>
              </td>
              <td>IntersectionObserver</td>
              <td>Lazy: image galleries, comments</td>
            </tr>
            <tr>
              <td>
                <code>only</code>
              </td>
              <td>Client-only</td>
              <td>Browser-specific: charts, maps</td>
            </tr>
          </tbody>
        </table>

        <h2>Creating an Island</h2>
        <p>
          Place components that need client-side behavior in the <code>app/islands/</code>{' '}
          directory:
        </p>
        <open-code-block>
          <pre><code>{`// app/islands/counter.ts
import { signal } from '@openelement/core';
import { OpenElement } from '@openelement/element';

export class Counter extends OpenElement {
  #count = signal(0);

  override render() {
    return (
      &lt;div&gt;
        &lt;button onClick={() => this.#count.value--}&gt;-&lt;/button&gt;
        &lt;span&gt;{this.#count}&lt;/span&gt;
        &lt;button onClick={() => this.#count.value++}&gt;+&lt;/button&gt;
      &lt;/div&gt;
    );
  }
}

customElements.define('my-counter', Counter);`}</code></pre>
        </open-code-block>
        <p>Usage in pages:</p>
        <open-code-block>
          <pre><code>&lt;my-counter&gt;&lt;/my-counter&gt;</code></pre>
        </open-code-block>
        <p>
          The builder automatically scans{' '}
          <code>app/islands/</code>, generates a client entry, and injects it into the static HTML.
          Page HTML renders first; the browser upgrades components after loading the island entry.
        </p>

        <h2>SSR vs CSR Behavior</h2>
        <table>
          <thead>
            <tr>
              <th>Aspect</th>
              <th>SSR (Server-Side)</th>
              <th>CSR (Client-Side)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Render output</td>
              <td>DSD HTML string</td>
              <td>Live DOM in shadow root</td>
            </tr>
            <tr>
              <td>Signal subscriptions</td>
              <td>Collected during render, serialized</td>
              <td>Active — DOM updates on change</td>
            </tr>
            <tr>
              <td>Event handlers</td>
              <td>Serialized for hydration</td>
              <td>Bound via addEventListener</td>
            </tr>
            <tr>
              <td>effect()</td>
              <td>Runs once, output captured</td>
              <td>Runs continuously</td>
            </tr>
            <tr>
              <td>ref</td>
              <td>Silently skipped</td>
              <td>Callback invoked</td>
            </tr>
          </tbody>
        </table>

        <open-callout type='info' label='Upgrade, Not Hydration'>
          openElement uses Island Upgrade instead of traditional hydration. When the browser parses
          HTML, DSD has already populated the content. The client entry calls{' '}
          <code>customElements.define()</code>
          to upgrade existing elements into real Custom Elements.
        </open-callout>

        <div class='nav-row'>
          <open-button-linear variant='secondary' href='/guide/routing-and-data'>&larr; Routing & Data</open-button-linear>
          <open-button-linear variant='secondary' href='/guide/deployment'>Deployment &rarr;</open-button-linear>
        </div>
      </div>
    );
  }
}

customElements.define('page-islands-ssr', IslandsSsrPage);
export default IslandsSsrPage;
export const tagName = 'page-islands-ssr';
