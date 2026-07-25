export const meta = { section: 'Guide', label: 'Architecture', order: 20 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';

type GuideContent = {
  breadcrumb: string;
  title: string;
  lede: string;
  outline: ReadonlyArray<{ id: string; label: string; level: 2 | 3 }>;
  previous?: { href: string; label: string };
  next?: { href: string; label: string };
  cards: ReadonlyArray<{ id: string; title: string; body: string }>;
};

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Architecture Guide',
    lede:
      'OpenElement is organized around elements, routes, islands and package layers rather than a client app shell.',
    outline: [
      { id: 'elements', label: 'Elements', level: 3 },
      { id: 'routes', label: 'Routes', level: 3 },
      { id: 'packages', label: 'Packages', level: 3 },
    ],
    previous: { href: '/guide/core-concepts', label: 'Core Concepts' },
    next: { href: '/guide/comparison', label: 'Comparison' },
    cards: [
      {
        id: 'elements',
        title: 'Elements',
        body: 'Custom Elements and DSD define the component surface.',
      },
      {
        id: 'routes',
        title: 'Routes',
        body: 'Route metadata drives navigation, generated pages, and documentation.',
      },
      {
        id: 'packages',
        title: 'Packages',
        body: 'Core, app, UI, adapters, and SSG stay as separate package layers.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '架构指南',
    lede:
      'OpenElement 围绕 elements、routes、islands 与 package layers 组织，而不是 client app shell。',
    outline: [
      { id: 'elements', label: '元素', level: 3 },
      { id: 'routes', label: '路由', level: 3 },
      { id: 'packages', label: '包', level: 3 },
    ],
    previous: { href: '/guide/core-concepts', label: '核心概念' },
    next: { href: '/guide/comparison', label: '对比' },
    cards: [
      {
        id: 'elements',
        title: '元素',
        body: 'Custom Elements 与 DSD 定义组件表面。',
      },
      {
        id: 'routes',
        title: '路由',
        body: 'Route metadata 驱动导航、生成页面与文档。',
      },
      {
        id: 'packages',
        title: '包',
        body: 'Core、app、UI、adapters 与 SSG 保持独立的包分层。',
      },
    ],
  },
};

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    .guide-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .guide-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

export class GuideGuidePage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    const t = content[this._getLocale('en') === 'zh' ? 'zh' : 'en'];
    return (
      <open-reading-shell
        rail
        footer
        metadata={JSON.stringify({ breadcrumb: t.breadcrumb, title: t.title, lede: t.lede })}
        previous={t.previous?.href}
        previous-label={t.previous?.label}
        next={t.next?.href}
        next-label={t.next?.label}
      >
        <open-page-rail slot='rail' items={JSON.stringify(t.outline)}></open-page-rail>
        <div class='container'>
          <div class='guide-grid'>
            {t.cards.map((card) => (
              <open-card>
                <h3 id={card.id}>{card.title}</h3>
                <p>{card.body}</p>
              </open-card>
            ))}
          </div>
        </div>
      </open-reading-shell>
    );
  }
}

customElements.define('guide-architecture-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-architecture-page';
