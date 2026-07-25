export const meta = { section: 'Guide', label: 'Routing and Data', order: 40 };

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
    title: 'Routing and Data',
    lede: 'Routes are file-based surfaces with explicit metadata and data boundaries.',
    outline: [
      { id: 'file-routes', label: 'File routes', level: 3 },
      { id: 'metadata', label: 'Metadata', level: 3 },
      { id: 'data-boundary', label: 'Data boundary', level: 3 },
    ],
    previous: { href: '/guide/comparison', label: 'Comparison' },
    next: { href: '/guide/mdx', label: 'MDX' },
    cards: [
      {
        id: 'file-routes',
        title: 'File routes',
        body: 'Routes should be discoverable from the repository tree.',
      },
      {
        id: 'metadata',
        title: 'Metadata',
        body: 'Navigation and generated docs rely on route metadata.',
      },
      {
        id: 'data-boundary',
        title: 'Data boundary',
        body: 'Keep data loading separate from presentation markup.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '路由与数据',
    lede: 'Routes 是基于文件的页面表面，带有显式 metadata 与数据边界。',
    outline: [
      { id: 'file-routes', label: '文件路由', level: 3 },
      { id: 'metadata', label: '元数据', level: 3 },
      { id: 'data-boundary', label: '数据边界', level: 3 },
    ],
    previous: { href: '/guide/comparison', label: '对比' },
    next: { href: '/guide/mdx', label: 'MDX' },
    cards: [
      {
        id: 'file-routes',
        title: '文件路由',
        body: 'Routes 应当能从仓库目录树中被发现。',
      },
      {
        id: 'metadata',
        title: '元数据',
        body: '导航与生成的文档依赖 route metadata。',
      },
      {
        id: 'data-boundary',
        title: '数据边界',
        body: '数据加载与展示标记保持分离。',
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

customElements.define('guide-routing-and-data-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-routing-and-data-page';
