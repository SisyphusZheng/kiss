export const meta = { section: 'Principles', label: 'DSD Rendering', order: 30 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';
import '@openelement/ui\/open-code-block';
import '../../islands/reactive-showcase.js';

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-md);
        margin: var(--space-md) 0 var(--space-lg);
      }
      .comparison-item {
        padding: var(--space-md) 20px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .comparison-item:hover {
        border-color: var(--color-border-hover);
      }
      .comparison-item.openElement {
        background: var(--surface-1);
        border-left: 3px solid var(--color-brand);
      }
      @media (max-width: 720px) {
        .comparison {
          grid-template-columns: 1fr;
        }
      }
    `);

export class DsdGuidePage extends OpenElement {
  declare locale?: string;

  static override styles = [linearTokenSheet, routeSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    const loc = this._getLocale('zh');
    return (
      <div class='container'>
        <h1>DSD 渲染架构</h1>
        <p class='subtitle'>
          Declarative Shadow DOM 是 openElement 的核心渲染模型：服务端输出标准
          HTML，浏览器在解析阶段创建 shadow root，JavaScript 只负责后续升级和必要事件绑定。v0.20
          起，DSD 组件默认以 OpenElement + StyleSheet 实现。
        </p>

        <h2>什么是 DSD</h2>
        <p>
          DSD 是 WHATWG HTML 中的 template 语义，核心属性是{' '}
          <code>shadowrootmode</code>。它允许 HTML 直接携带 shadow root 内容，使服务端渲染的 Web
          Components 在 JS 加载前已经可见。
        </p>
        <open-code-block>
          <pre><code>{`&lt;my-card&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;:host { display: block; }&lt;/style&gt;
    &lt;p&gt;内容在 JavaScript 加载前可见。&lt;/p&gt;
  &lt;/template&gt;
&lt;/my-card&gt;`}</code></pre>
        </open-code-block>

        <h2>为什么 openElement 选择 DSD</h2>
        <div class='comparison'>
          <div class='comparison-item'>
            <h3>传统 hydration</h3>
            <ul>
              <li>客户端通常需要恢复整棵组件树。</li>
              <li>容易出现 mismatch、重复渲染或交互丢失。</li>
              <li>常依赖框架私有标记。</li>
            </ul>
          </div>
          <div class='comparison-item less'>
            <h3>DSD-first</h3>
            <ul>
              <li>HTML 解析阶段已有 shadow root。</li>
              <li>Custom Element upgrade 只激活已有 host。</li>
              <li>输出接近平台语义，便于 SSG 和缓存。</li>
            </ul>
          </div>
        </div>

        <h2>WHATWG DSD 属性</h2>
        <table>
          <thead>
            <tr>
              <th>属性</th>
              <th>openElement 选项</th>
              <th>用途</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>shadowrootmode</code>
              </td>
              <td>固定输出 open</td>
              <td>启用声明式 shadow root。</td>
            </tr>
            <tr>
              <td>
                <code>shadowrootdelegatesfocus</code>
              </td>
              <td>
                <code>delegatesFocus</code>
              </td>
              <td>焦点委托。</td>
            </tr>
            <tr>
              <td>
                <code>shadowrootslotassignment</code>
              </td>
              <td>
                <code>slotAssignment</code>
              </td>
              <td>slot 分配策略。</td>
            </tr>
            <tr>
              <td>
                <code>shadowrootclonable</code>
              </td>
              <td>
                <code>clonable</code>
              </td>
              <td>允许 clone 时保留 shadow root。</td>
            </tr>
            <tr>
              <td>
                <code>shadowrootserializable</code>
              </td>
              <td>
                <code>serializable</code>
              </td>
              <td>允许序列化 shadow root。</td>
            </tr>
            <tr>
              <td>
                <code>shadowrootcustomelementregistry</code>
              </td>
              <td>
                <code>customElementRegistry</code>
              </td>
              <td>为 scoped registry 方向预留语义。</td>
            </tr>
          </tbody>
        </table>

        <h2>三层组件模型</h2>
        <table>
          <thead>
            <tr>
              <th>层级</th>
              <th>类型</th>
              <th>客户端 JS</th>
              <th>适合场景</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Layer 1</td>
              <td>
                <code>dsd-static</code>
              </td>
              <td>无</td>
              <td>布局、导航、文章内容。</td>
            </tr>
            <tr>
              <td>Layer 2</td>
              <td>
                <code>dsd-interactive</code>
              </td>
              <td>只绑定事件</td>
              <td>主题切换、折叠、tabs。</td>
            </tr>
            <tr>
              <td>Layer 3</td>
              <td>
                <code>pure-island</code>
              </td>
              <td>完整客户端逻辑</td>
              <td>图表、复杂表单、WebSocket。</td>
            </tr>
          </tbody>
        </table>

        <h2>边界</h2>
        <p>
          DSD 不是"任意组件 SSR"的保证。组件如果依赖浏览器布局、全局 DOM、副作用、timer
          或第三方脚本， 就必须降级为 pure island，或通过 manifest 明确声明 SSR/fallback 行为。
        </p>
        <p>
          openElement 应通过 Playwright 验证目标浏览器行为。旧浏览器 polyfill
          只能作为降级路径，不能替代真实浏览器验证。
        </p>

        <h2>Reactive DSD（v0.21）</h2>
        <p>
          OpenElement + Signals 让 Ocean 组件获得零框架响应式。 一个 <code>signal(0)</code>{' '}
          驱动计数器，一个 <code>computed()</code> 驱动过滤器—— 不需要 Lit、React 或任何框架运行时。
        </p>
        <reactive-showcase></reactive-showcase>

        <div class='nav-row'>
          <a href={`/${loc}/architecture/architecture`} style='color:var(--color-text-secondary);text-decoration:none;font-size:var(--font-size-body-sm)'>
            &larr; {loc === 'zh' ? '分层架构' : 'Architecture'}
          </a>
          <a href={`/${loc}/architecture/islands`} style='color:var(--color-text-secondary);text-decoration:none;font-size:var(--font-size-body-sm)'>
            {loc === 'zh' ? 'Island 升级' : 'Island Upgrade'} &rarr;
          </a>
          <a href={`/${loc}/architecture/standards-registry`} style='color:var(--color-text-secondary);text-decoration:none;font-size:var(--font-size-body-sm)'>
            {loc === 'zh' ? '标准与注册表' : 'Standards & Registry'} &rarr;
          </a>
        </div>
      </div>
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');
    return (
      <div class='container'>
        <h1>DSD Rendering Architecture</h1>
        <p class='subtitle'>
          Declarative Shadow DOM is the core openElement rendering model: the server emits standard
          HTML, the browser creates shadow roots during parsing, and JavaScript only upgrades
          components and binds necessary events. Since v0.20, DSD components are built on
          OpenElement + StyleSheet by default.
        </p>

        <h2>What Is DSD</h2>
        <p>
          DSD is template semantics in WHATWG HTML. The key attribute is
          <code>shadowrootmode</code>. It lets HTML carry shadow root content so server-rendered Web
          Components are visible before their JavaScript implementation loads.
        </p>
        <open-code-block>
          <pre><code>{`&lt;my-card&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;:host { display: block; }&lt;/style&gt;
    &lt;p&gt;Content is visible before JavaScript loads.&lt;/p&gt;
  &lt;/template&gt;
&lt;/my-card&gt;`}</code></pre>
        </open-code-block>

        <h2>Why openElement Uses DSD</h2>
        <div class='comparison'>
          <div class='comparison-item'>
            <h3>Traditional Hydration</h3>
            <ul>
              <li>The client often restores a full component tree.</li>
              <li>Mismatches can cause re-rendering, flicker, or lost interactivity.</li>
              <li>Framework-private markers are common.</li>
            </ul>
          </div>
          <div class='comparison-item less'>
            <h3>DSD-first</h3>
            <ul>
              <li>Shadow roots exist during HTML parsing.</li>
              <li>Custom Element upgrade activates existing hosts.</li>
              <li>The output stays close to platform semantics and works well with SSG/caching.</li>
            </ul>
          </div>
        </div>

        <h2>WHATWG DSD Attributes</h2>
        <table>
          <thead>
            <tr>
              <th>Attribute</th>
              <th>openElement Option</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>shadowrootmode</code>
              </td>
              <td>always open</td>
              <td>Enables declarative shadow root output.</td>
            </tr>
            <tr>
              <td>
                <code>shadowrootdelegatesfocus</code>
              </td>
              <td>
                <code>delegatesFocus</code>
              </td>
              <td>Delegates focus into the shadow root.</td>
            </tr>
            <tr>
              <td>
                <code>shadowrootslotassignment</code>
              </td>
              <td>
                <code>slotAssignment</code>
              </td>
              <td>Controls slot assignment.</td>
            </tr>
            <tr>
              <td>
                <code>shadowrootclonable</code>
              </td>
              <td>
                <code>clonable</code>
              </td>
              <td>Allows cloned hosts to include the shadow root.</td>
            </tr>
            <tr>
              <td>
                <code>shadowrootserializable</code>
              </td>
              <td>
                <code>serializable</code>
              </td>
              <td>Allows shadow root serialization.</td>
            </tr>
            <tr>
              <td>
                <code>shadowrootcustomelementregistry</code>
              </td>
              <td>
                <code>customElementRegistry</code>
              </td>
              <td>Leaves room for scoped registry semantics.</td>
            </tr>
          </tbody>
        </table>

        <h2>Three-Layer Component Model</h2>
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Type</th>
              <th>Client JS</th>
              <th>Good Fit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Layer 1</td>
              <td>
                <code>dsd-static</code>
              </td>
              <td>None</td>
              <td>Layout, navigation, article content.</td>
            </tr>
            <tr>
              <td>Layer 2</td>
              <td>
                <code>dsd-interactive</code>
              </td>
              <td>Events only</td>
              <td>Theme toggles, disclosure, tabs.</td>
            </tr>
            <tr>
              <td>Layer 3</td>
              <td>
                <code>pure-island</code>
              </td>
              <td>Full client logic</td>
              <td>Charts, complex forms, WebSocket.</td>
            </tr>
          </tbody>
        </table>

        <h2>Boundary</h2>
        <p>
          DSD is not a guarantee that every component can be SSR-rendered. Components that depend on
          browser layout, global DOM, side effects, timers, or third-party scripts must degrade to
          pure islands or declare their SSR/fallback behavior in a manifest.
        </p>
        <p>
          openElement should validate target browser behavior with Playwright. Polyfills for older
          browsers are graceful fallback, not a replacement for real-browser validation.
        </p>

        <h2>Reactive DSD (v0.21)</h2>
        <p>
          OpenElement + Signals gives Ocean components zero-framework reactivity. A single{' '}
          <code>signal(0)</code> drives a counter, a <code>computed()</code>{' '}
          drives a filter — no Lit, React, or any framework runtime required.
        </p>
        <reactive-showcase></reactive-showcase>

        <div class='nav-row'>
          <a href={`/${loc}/architecture/architecture`} style='color:var(--color-text-secondary);text-decoration:none;font-size:var(--font-size-body-sm)'>
            &larr; {loc === 'zh' ? '分层架构' : 'Architecture'}
          </a>
          <a href={`/${loc}/architecture/islands`} style='color:var(--color-text-secondary);text-decoration:none;font-size:var(--font-size-body-sm)'>
            {loc === 'zh' ? 'Island 升级' : 'Island Upgrade'} &rarr;
          </a>
          <a href={`/${loc}/architecture/standards-registry`} style='color:var(--color-text-secondary);text-decoration:none;font-size:var(--font-size-body-sm)'>
            {loc === 'zh' ? '标准与注册表' : 'Standards & Registry'} &rarr;
          </a>
        </div>
      </div>
    );
  }
}

customElements.define('page-dsd-guide', DsdGuidePage);
export default DsdGuidePage;
export const tagName = 'page-dsd-guide';
