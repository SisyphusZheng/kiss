export const meta = { section: 'Principles', label: 'DSD Rendering', order: 30 };

import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    h1 .title-accent { display: block; font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: calc(1em * 1.12); line-height: .95; letter-spacing: -.02em; color: var(--violet-8); }

    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    open-card[variant="artifact"] {
      border-left: 3px solid var(--brand);
    }

    @media (max-width: 760px) {
      .comparison {
        grid-template-columns: 1fr;
      }
    }
  `,
);

const content = {
  en: {
    titleAccent: 'Rendering',
    subtitle:
      'openElement treats Declarative Shadow DOM as the server-rendered boundary for Web Components, then upgrades only the behavior that must run in the browser.',
    platformContract: 'The platform contract',
    platformContractBody:
      'Declarative Shadow DOM uses a template with {shadowrootmode} so HTML can carry shadow-root content before client JavaScript loads.',
    artifactLabel: 'template / shadow tree',
    artifactMeta: 'browser-parsed DSD',
    traditionalHydration: 'Traditional hydration',
    traditionalHydrationBody:
      'A client runtime often reconstructs the component tree before the page is fully interactive.',
    dsdFirst: 'DSD-first rendering',
    dsdFirstBody:
      'The browser parses shadow roots from HTML. Custom Elements then upgrade existing hosts and attach only the needed behavior.',
    layers: 'openElement layers',
    layerItems: [
      'Static DSD components for content, layout, and documentation.',
      'Interactive elements for local browser behavior.',
      'Islands for client components that need framework runtimes.',
    ],
    railItems:
      '[{"id":"platform-contract","label":"The platform contract"},{"id":"traditional-hydration","label":"Traditional hydration","level":3},{"id":"dsd-first","label":"DSD-first rendering","level":3},{"id":"openelement-layers","label":"openElement layers"}]',
  },
  zh: {
    titleAccent: '渲染',
    subtitle:
      'openElement 把 Declarative Shadow DOM 作为 Web Components 的服务端渲染边界，然后只升级那些必须在浏览器中运行的行为。',
    platformContract: '平台契约',
    platformContractBody:
      'Declarative Shadow DOM 通过带 {shadowrootmode} 的 template，让 HTML 在客户端 JavaScript 加载之前就能携带 shadow-root 内容。',
    artifactLabel: '模板 / shadow tree',
    artifactMeta: '浏览器解析的 DSD',
    traditionalHydration: '传统 hydration',
    traditionalHydrationBody: '客户端运行时往往要在页面完全可交互之前重建整棵组件树。',
    dsdFirst: 'DSD-first 渲染',
    dsdFirstBody:
      '浏览器直接从 HTML 解析出 shadow root。随后 Custom Elements 升级已有的宿主元素，只挂载需要的行为。',
    layers: 'openElement 分层',
    layerItems: [
      '静态 DSD 组件，用于内容、布局与文档。',
      '交互元素，承担浏览器内的局部行为。',
      'islands，用于需要框架运行时的客户端组件。',
    ],
    railItems:
      '[{"id":"platform-contract","label":"平台契约"},{"id":"traditional-hydration","label":"传统 hydration","level":3},{"id":"dsd-first","label":"DSD-first 渲染","level":3},{"id":"openelement-layers","label":"openElement 分层"}]',
  },
} as const;

export class DsdGuidePage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    const t = content[this._getLocale('en') === 'zh' ? 'zh' : 'en'];
    return (
      <open-reading-shell rail>
        <open-page-rail
          slot='rail'
          items={t.railItems}
        >
        </open-page-rail>
        <div class='container'>
          <h1 id='start'>
            Declarative Shadow DOM<span class='title-accent'>{t.titleAccent}</span>
          </h1>
          <p class='subtitle'>
            {t.subtitle}
          </p>

          <h2 id='platform-contract'>{t.platformContract}</h2>
          <p>
            {t.platformContractBody.split('{shadowrootmode}')[0]}
            <code>shadowrootmode</code>
            {t.platformContractBody.split('{shadowrootmode}')[1]}
          </p>
          <open-artifact-panel>
            <span slot='label'>{t.artifactLabel}</span>
            <span slot='meta'>{t.artifactMeta}</span>
            <open-code-block>
              <pre><code>{`<my-card>
  <template shadowrootmode="open">
    <style>:host { display: block; }</style>
    <p>Visible before client JavaScript.</p>
  </template>
</my-card>`}</code></pre>
            </open-code-block>
          </open-artifact-panel>

          <div class='comparison'>
            <open-card>
              <h3 id='traditional-hydration'>{t.traditionalHydration}</h3>
              <p>
                {t.traditionalHydrationBody}
              </p>
            </open-card>
            <open-card variant='artifact'>
              <h3 id='dsd-first'>{t.dsdFirst}</h3>
              <p>
                {t.dsdFirstBody}
              </p>
            </open-card>
          </div>

          <h2 id='openelement-layers'>{t.layers}</h2>
          <ul>
            {t.layerItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </open-reading-shell>
    );
  }
}

export const tagName = 'dsd-guide-page';
defineCustomElement(tagName, DsdGuidePage);
export default DsdGuidePage;
