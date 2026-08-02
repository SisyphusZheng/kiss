export const meta = { section: 'Reference', label: 'WC Standards Contract', order: 80 };

import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    h1 .title-accent { display: block; font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: calc(1em * 1.12); line-height: .95; letter-spacing: -.02em; color: var(--violet-8); }

    .registry-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .registry-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

const content = {
  en: {
    railItems:
      '[{"id":"elements-dsd","label":"Elements + DSD","level":3},{"id":"request-semantics","label":"Request semantics","level":3},{"id":"five-package-ownership","label":"Five-package ownership","level":3}]',
    titleLead: 'WC Standards',
    titleAccent: 'Contract',
    subtitle:
      'OpenElement relies on web-platform contracts rather than a proprietary registry product. Custom Elements, DSD, CEM, Request/Response and FormData define the direction of the public application model.',
    panelLabel: 'browser standards contract',
    panelMeta: 'platform ownership',
    cards: [
      {
        id: 'elements-dsd',
        title: 'Elements + DSD',
        body:
          'Standard Custom Elements and Declarative Shadow DOM define the durable component boundary.',
      },
      {
        id: 'request-semantics',
        title: 'Request semantics',
        body:
          'Request, Response and FormData are the basis of the 0.42 loader/action surfaces — application interaction without a proprietary transport.',
      },
      {
        id: 'five-package-ownership',
        title: 'Five-package ownership',
        body:
          'Element, App, Adapter Vite, Create and optional UI are the current consumer surface; internal contracts stay internal.',
      },
    ],
  },
  zh: {
    railItems:
      '[{"id":"elements-dsd","label":"Elements + DSD","level":3},{"id":"request-semantics","label":"Request 语义","level":3},{"id":"five-package-ownership","label":"五包归属","level":3}]',
    titleLead: 'WC 标准',
    titleAccent: '契约',
    subtitle:
      'OpenElement 依赖 Web 平台契约，而非自研的注册表产品。Custom Elements、DSD、CEM、Request/Response 与 FormData 定义了公开应用模型的方向。',
    panelLabel: '浏览器标准契约',
    panelMeta: '平台归属',
    cards: [
      {
        id: 'elements-dsd',
        title: 'Elements + DSD',
        body: '标准 Custom Elements 与 Declarative Shadow DOM 定义了持久的组件边界。',
      },
      {
        id: 'request-semantics',
        title: 'Request 语义',
        body:
          'Request、Response 与 FormData 是 0.42 loader/action 面的基础——应用交互无需私有传输层。',
      },
      {
        id: 'five-package-ownership',
        title: '五包归属',
        body:
          'Element、App、Adapter Vite、Create 与可选的 UI 是当前的对外消费界面；内部契约保持内部。',
      },
    ],
  },
};

export class StandardsRegistryPage extends OpenElement {
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
            {t.titleLead}
            <span class='title-accent'>{t.titleAccent}</span>
          </h1>
          <p class='subtitle'>
            {t.subtitle}
          </p>

          <open-artifact-panel>
            <span slot='label'>{t.panelLabel}</span>
            <span slot='meta'>{t.panelMeta}</span>
            <div class='registry-grid'>
              {t.cards.map((card, i) => (
                i === 0
                  ? (
                    <open-card variant='artifact'>
                      <h3 id={card.id}>{card.title}</h3>
                      <p>
                        {card.body}
                      </p>
                    </open-card>
                  )
                  : (
                    <open-card>
                      <h3 id={card.id}>{card.title}</h3>
                      <p>
                        {card.body}
                      </p>
                    </open-card>
                  )
              ))}
            </div>
          </open-artifact-panel>
        </div>
      </open-reading-shell>
    );
  }
}

export const tagName = 'standards-registry-page';
defineCustomElement(tagName, StandardsRegistryPage);
export default StandardsRegistryPage;
