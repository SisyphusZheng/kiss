export const meta = { section: 'Principles', label: 'Islands', order: 40 };

import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    h1 .title-accent { display: block; font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: calc(1em * 1.12); line-height: .95; letter-spacing: -.02em; color: var(--violet-8); }

    .island-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .island-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

const railItems = {
  en:
    '[{"id":"static-surface","label":"Static surface","level":3},{"id":"hydration-boundary","label":"Hydration boundary","level":3},{"id":"progressive-behavior","label":"Progressive behavior","level":3}]',
  zh:
    '[{"id":"static-surface","label":"静态表面","level":3},{"id":"hydration-boundary","label":"Hydration 边界","level":3},{"id":"progressive-behavior","label":"渐进式行为","level":3}]',
} as const;

const content = {
  en: {
    titleAccent: 'Hydration',
    subtitle:
      'openElement keeps documents and Web Components server-rendered by default. Islands are reserved for client components that need runtime state or framework interop.',
    panelLabel: 'activation boundary',
    panelMeta: 'static → interactive',
    staticSurfaceTitle: 'Static surface',
    staticSurfaceBody: 'HTML and DSD render first, without forcing a client app shell.',
    hydrationBoundaryTitle: 'Hydration boundary',
    hydrationBoundaryBody: 'Client modules attach where the route metadata declares an island.',
    progressiveBehaviorTitle: 'Progressive behavior',
    progressiveBehaviorBody:
      'Interactive pieces can load independently from the surrounding document.',
  },
  zh: {
    titleAccent: 'Hydration',
    subtitle:
      'openElement 默认让文档与 Web Components 保持服务端渲染。island 只为需要运行时状态或框架互操作的客户端组件保留。',
    panelLabel: '激活边界',
    panelMeta: '静态 → 交互',
    staticSurfaceTitle: '静态表面',
    staticSurfaceBody: 'HTML 与 DSD 先行渲染，不强迫加载客户端应用外壳。',
    hydrationBoundaryTitle: 'Hydration 边界',
    hydrationBoundaryBody: '客户端模块挂载在路由 metadata 声明 island 的位置。',
    progressiveBehaviorTitle: '渐进式行为',
    progressiveBehaviorBody: '交互部分可以独立于周围文档加载。',
  },
} as const;

export class IslandsPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    const locale = this._getLocale('en') === 'zh' ? 'zh' : 'en';
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
            Island<span class='title-accent'>{t.titleAccent}</span>
          </h1>
          <p class='subtitle'>
            {t.subtitle}
          </p>

          <open-artifact-panel>
            <span slot='label'>{t.panelLabel}</span>
            <span slot='meta'>{t.panelMeta}</span>
            <div class='island-grid'>
              <open-card>
                <h3 id='static-surface'>{t.staticSurfaceTitle}</h3>
                <p>{t.staticSurfaceBody}</p>
              </open-card>
              <open-card variant='artifact'>
                <h3 id='hydration-boundary'>{t.hydrationBoundaryTitle}</h3>
                <p>
                  {t.hydrationBoundaryBody}
                </p>
              </open-card>
              <open-card>
                <h3 id='progressive-behavior'>{t.progressiveBehaviorTitle}</h3>
                <p>
                  {t.progressiveBehaviorBody}
                </p>
              </open-card>
            </div>
          </open-artifact-panel>
        </div>
      </open-reading-shell>
    );
  }
}

export const tagName = 'islands-guide-page';
defineCustomElement(tagName, IslandsPage);
export default IslandsPage;
