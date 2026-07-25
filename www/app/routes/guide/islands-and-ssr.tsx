export const meta = { section: 'Guide', label: 'Islands and SSR', order: 90 };

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
    title: 'Islands and SSR',
    lede:
      'SSR and DSD provide the document baseline. Islands add client behavior at declared boundaries.',
    outline: [
      { id: 'server-first', label: 'Server first', level: 3 },
      { id: 'declared-islands', label: 'Declared islands', level: 3 },
      { id: 'small-runtime', label: 'Small runtime', level: 3 },
    ],
    previous: { href: '/guide/error-handling', label: 'Error Handling' },
    next: { href: '/guide/deployment', label: 'Deployment' },
    cards: [
      {
        id: 'server-first',
        title: 'Server first',
        body: 'Render useful HTML before client modules run.',
      },
      {
        id: 'declared-islands',
        title: 'Declared islands',
        body: 'Hydration should be visible from route metadata.',
      },
      {
        id: 'small-runtime',
        title: 'Small runtime',
        body: 'Keep browser JavaScript scoped to interactive surfaces.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: 'Islands 与 SSR',
    lede: 'SSR 与 DSD 提供文档基线。Islands 在声明的边界上添加客户端行为。',
    outline: [
      { id: 'server-first', label: 'Server first', level: 3 },
      { id: 'declared-islands', label: '声明式 islands', level: 3 },
      { id: 'small-runtime', label: '小运行时', level: 3 },
    ],
    previous: { href: '/guide/error-handling', label: '错误处理' },
    next: { href: '/guide/deployment', label: '部署' },
    cards: [
      {
        id: 'server-first',
        title: 'Server first',
        body: '在客户端模块运行之前渲染可用的 HTML。',
      },
      {
        id: 'declared-islands',
        title: '声明式 islands',
        body: 'Hydration 应当能从 route metadata 中看出。',
      },
      {
        id: 'small-runtime',
        title: '小运行时',
        body: '浏览器 JavaScript 限制在交互表面内。',
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

customElements.define('guide-islands-and-ssr-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-islands-and-ssr-page';
