export const meta = { section: 'Guide', label: 'MDX', order: 50 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import { guideSectionStyles } from '@openelement/site-ui/guide-section-styles.ts';
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
    title: 'MDX',
    lede:
      'Documentation content compiles into the same route and component system as authored pages.',
    outline: [
      { id: 'content-source', label: 'Content source', level: 3 },
      { id: 'components', label: 'Components', level: 3 },
      { id: 'build-path', label: 'Build path', level: 3 },
    ],
    previous: { href: '/guide/routing-and-data', label: 'Routing and Data' },
    next: { href: '/guide/api', label: 'API Routes' },
    cards: [
      {
        id: 'content-source',
        title: 'Content source',
        body: 'Keep source content reviewable in the repository.',
      },
      {
        id: 'components',
        title: 'Components',
        body: 'Use shared UI primitives for examples and callouts.',
      },
      {
        id: 'build-path',
        title: 'Build path',
        body: 'Validate generated pages through the normal site build.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: 'MDX',
    lede: '文档内容编译进与手写页面相同的 route 与 component 体系。',
    outline: [
      { id: 'content-source', label: '内容来源', level: 3 },
      { id: 'components', label: '组件', level: 3 },
      { id: 'build-path', label: '构建路径', level: 3 },
    ],
    previous: { href: '/guide/routing-and-data', label: '路由与数据' },
    next: { href: '/guide/api', label: 'API 路由' },
    cards: [
      {
        id: 'content-source',
        title: '内容来源',
        body: '源内容保持在仓库中可审查。',
      },
      {
        id: 'components',
        title: '组件',
        body: '示例与 callouts 使用共享的 UI 原语。',
      },
      {
        id: 'build-path',
        title: '构建路径',
        body: '通过常规站点构建验证生成的页面。',
      },
    ],
  },
};

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + guideSectionStyles + `
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
        <div class='container guide-sections'>
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

customElements.define('guide-mdx-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-mdx-page';
