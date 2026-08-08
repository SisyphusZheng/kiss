export const meta = { section: 'Principles', label: 'Island Deep Dive', order: 50 };
export const tagName = 'page-islands-deep-guide';

import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';
import '@openelement/site-ui/open-artifact-panel.tsx';
import { contentLocale } from '@openelement/site-ui/locale.ts';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
  h1 .title-accent { display: block; font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: calc(1em * 1.12); line-height: .95; letter-spacing: -.02em; color: var(--violet-8); }

  .layer-card { padding: 20px var(--size-6); margin: var(--size-4) 0; border-left: 2px solid var(--color-border); background: var(--surface-1); border-radius: 0 3px 3px 0; }
  .layer-card .layer-tag { font-size: var(--font-size-overline); font-weight: var(--font-weight-5); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.25rem; }
  .layer-card h3 { margin: 0 0 var(--size-2); }
  .strategy-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--size-4); margin: var(--size-4) 0 var(--size-6); }
  .strategy-item { padding: var(--size-4) 20px; border: 0.5px solid var(--color-border); border-radius: var(--radius-xs); background: var(--surface-1); }
  .strategy-item .strat-name { font-weight: var(--font-weight-5); font-size: var(--font-size-2); color: var(--text); margin-bottom: 0.25rem; }
  .strategy-item .strat-name code { font-size: var(--font-size-0); background: var(--surface-2); padding: 0.125rem 0.375rem; border-radius: 3px; }
  @media (max-width: 720px) { .strategy-grid { grid-template-columns: 1fr; } }
`,
);

const railItems = {
  en:
    '[{"id":"upgrade-model","label":"Upgrade Model"},{"id":"three-layers","label":"Three Layers"},{"id":"strategies","label":"Strategies"},{"id":"ssr-props","label":"SSR Props Are Not Events"},{"id":"dynamic-content","label":"Dynamic Content"}]',
  zh:
    '[{"id":"upgrade-model","label":"升级模型"},{"id":"three-layers","label":"三个层次"},{"id":"strategies","label":"策略"},{"id":"ssr-props","label":"SSR Props 不是事件"},{"id":"dynamic-content","label":"动态内容"}]',
} as const;

const content = {
  en: {
    titleMain: 'Island',
    titleAccent: 'Deep Dive',
    subtitle:
      'Islands are the only client JavaScript units in openElement. The public model is VNode output plus JSX event handlers; SSR props are restored separately.',
    upgradeModel: 'Upgrade Model',
    upgradeBody:
      'openElement uses the browser Custom Element upgrade mechanism. SSG writes HTML first, then the client entry imports only the island modules used by the current page.',
    threeLayers: 'Three Layers',
    panelLabel: 'island activation model',
    panelMeta: 'DSD static → selective upgrade',
    layer1Tag: 'Layer 1 - dsd-static',
    layer1Title: 'No client JavaScript',
    layer1Body:
      'Static Web Components render as DSD during SSG. They remain visible and styled even when no client module runs.',
    layer2Tag: 'Layer 2 - dsd-interactive',
    layer2Title: 'DSD plus VNode event hydration',
    layer2Body:
      'The server emits DSD and VNode event markers. On upgrade, OpenElement hydrates those markers to JSX handlers. There is no string method lookup and no data-on-* event binding.',
    layer3Tag: 'Layer 3 - pure-island',
    layer3Title: 'Client-owned shadow root',
    layer3Body:
      'Browser-only components can opt out of SSR with the only strategy. The server emits the host tag and data-ssr-props; the client owns rendering.',
    strategies: 'Strategies',
    stratLoad: 'Import immediately for first-paint controls such as navigation and theme.',
    stratIdle: 'Import during idle time for non-critical interactive components.',
    stratVisible: 'Import when the island approaches the viewport.',
    stratOnly: 'Skip SSR for browser-only components that cannot produce reliable DSD.',
    ssrProps: 'SSR Props Are Not Events',
    ssrPropsBody:
      'restores data-ssr-props into the upgraded element. It does not bind DOM events. Events are owned by VNode markers generated from JSX handlers.',
    dynamicContent: 'Dynamic Content',
    dynamicPre:
      'Dynamic island content should return VNode or VNode arrays. HTML injection stays behind the explicit ',
    dynamicPost: ' boundary for pre-sanitized, non-interactive content only.',
    navDsd: 'DSD Architecture',
    navIslands: 'Islands and SSR',
  },
  zh: {
    titleMain: 'Island',
    titleAccent: '深入解析',
    subtitle:
      'island 是 openElement 中唯一的客户端 JavaScript 单元。公开模型是 VNode 输出加 JSX 事件处理器；SSR props 单独恢复。',
    upgradeModel: '升级模型',
    upgradeBody:
      'openElement 使用浏览器的 Custom Element upgrade 机制。SSG 先写出 HTML，然后客户端入口只导入当前页面用到的 island 模块。',
    threeLayers: '三个层次',
    panelLabel: 'island 激活模型',
    panelMeta: 'DSD 静态输出 → 选择性升级',
    layer1Tag: '第 1 层 - dsd-static',
    layer1Title: '无客户端 JavaScript',
    layer1Body:
      '静态 Web Components 在 SSG 期间渲染为 DSD。即使没有任何客户端模块运行，它们也保持可见且样式完整。',
    layer2Tag: '第 2 层 - dsd-interactive',
    layer2Title: 'DSD 加 VNode 事件 hydration',
    layer2Body:
      '服务端输出 DSD 与 VNode 事件标记。upgrade 时，OpenElement 把这些标记 hydrate 为 JSX 处理器。没有字符串方法查找，也没有 data-on-* 事件绑定。',
    layer3Tag: '第 3 层 - pure-island',
    layer3Title: '客户端拥有的 shadow root',
    layer3Body:
      '纯浏览器组件可以用 only 策略退出 SSR。服务端只输出宿主标签和 data-ssr-props；渲染由客户端全权负责。',
    strategies: '策略',
    stratLoad: '为首屏控件（如导航与主题）立即导入。',
    stratIdle: '在浏览器空闲时间为非关键交互组件导入。',
    stratVisible: '当 island 接近视口时导入。',
    stratOnly: '对无法产出可靠 DSD 的纯浏览器组件跳过 SSR。',
    ssrProps: 'SSR Props 不是事件',
    ssrPropsBody:
      '把 data-ssr-props 恢复到 upgrade 后的元素中。它不绑定 DOM 事件；事件由 JSX 处理器生成的 VNode 标记负责。',
    dynamicContent: '动态内容',
    dynamicPre: '动态 island 内容应返回 VNode 或 VNode 数组。HTML 注入只保留在显式的 ',
    dynamicPost: ' 边界之内，且仅用于已消毒、非交互的内容。',
    navDsd: 'DSD 架构',
    navIslands: 'Islands 与 SSR',
  },
} as const;

export class IslandsDeepGuidePage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    const locale = contentLocale(this._getLocale('en'));
    const t = content[locale];
    return (
      <open-reading-shell rail>
        <open-page-rail
          slot='rail'
          items={railItems[locale]}
        >
        </open-page-rail>
        <div class='container'>
          <h1 id='start'>
            {t.titleMain}
            <span class='title-accent'>{t.titleAccent}</span>
          </h1>
          <p class='subtitle'>
            {t.subtitle}
          </p>

          <h2 id='upgrade-model'>{t.upgradeModel}</h2>
          <p>
            {t.upgradeBody}
          </p>

          <h2 id='three-layers'>{t.threeLayers}</h2>
          <open-artifact-panel>
            <span slot='label'>{t.panelLabel}</span>
            <span slot='meta'>{t.panelMeta}</span>
            <div class='layer-card'>
              <div class='layer-tag'>{t.layer1Tag}</div>
              <h3>{t.layer1Title}</h3>
              <p>
                {t.layer1Body}
              </p>
            </div>
            <div class='layer-card'>
              <div class='layer-tag'>{t.layer2Tag}</div>
              <h3>{t.layer2Title}</h3>
              <p>
                {t.layer2Body}
              </p>
            </div>
            <div class='layer-card'>
              <div class='layer-tag'>{t.layer3Tag}</div>
              <h3>{t.layer3Title}</h3>
              <p>
                {t.layer3Body}
              </p>
            </div>
          </open-artifact-panel>

          <h2 id='strategies'>{t.strategies}</h2>
          <div class='strategy-grid'>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>load</code>
              </div>
              <p>{t.stratLoad}</p>
            </div>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>idle</code>
              </div>
              <p>{t.stratIdle}</p>
            </div>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>visible</code>
              </div>
              <p>{t.stratVisible}</p>
            </div>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>only</code>
              </div>
              <p>{t.stratOnly}</p>
            </div>
          </div>

          <h2 id='ssr-props'>{t.ssrProps}</h2>
          <p>
            <span class='inline-code'>bindSsrProps()</span> {t.ssrPropsBody}
          </p>

          <h2 id='dynamic-content'>{t.dynamicContent}</h2>
          <p>
            {t.dynamicPre}
            <span class='inline-code'>trustedHtml</span>
            {t.dynamicPost}
          </p>

          <div class='nav-row'>
            <a
              href='/architecture/dsd'
              style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)'
            >
              {t.navDsd}
            </a>
            <a
              href='/guide/islands-and-ssr'
              style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)'
            >
              {t.navIslands}
            </a>
          </div>
        </div>
      </open-reading-shell>
    );
  }
}

defineCustomElement(tagName, IslandsDeepGuidePage);
export default IslandsDeepGuidePage;
