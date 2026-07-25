export const meta = { section: 'Guide', label: 'Error Handling', order: 80 };

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
    title: 'Error Handling',
    lede: 'Error handling preserves platform semantics and keeps route failures visible.',
    outline: [
      { id: 'route-errors', label: 'Route errors', level: 3 },
      { id: 'component-errors', label: 'Component errors', level: 3 },
      { id: 'build-errors', label: 'Build errors', level: 3 },
    ],
    previous: { href: '/guide/configuration', label: 'Configuration' },
    next: { href: '/guide/islands-and-ssr', label: 'Islands and SSR' },
    cards: [
      {
        id: 'route-errors',
        title: 'Route errors',
        body: 'Return clear status codes and response bodies from API boundaries.',
      },
      {
        id: 'component-errors',
        title: 'Component errors',
        body: 'Keep component fallback states local and inspectable.',
      },
      {
        id: 'build-errors',
        title: 'Build errors',
        body: 'Treat generation failures as release blockers, not cosmetic warnings.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '错误处理',
    lede: '错误处理保留平台语义，并让 route 失败保持可见。',
    outline: [
      { id: 'route-errors', label: 'Route 错误', level: 3 },
      { id: 'component-errors', label: '组件错误', level: 3 },
      { id: 'build-errors', label: '构建错误', level: 3 },
    ],
    previous: { href: '/guide/configuration', label: '配置' },
    next: { href: '/guide/islands-and-ssr', label: 'Islands 与 SSR' },
    cards: [
      {
        id: 'route-errors',
        title: 'Route 错误',
        body: '从 API 边界返回明确的状态码与响应体。',
      },
      {
        id: 'component-errors',
        title: '组件错误',
        body: '组件 fallback 状态保持局部且可检查。',
      },
      {
        id: 'build-errors',
        title: '构建错误',
        body: '把生成失败视为发布阻断项，而不是装饰性警告。',
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

customElements.define('guide-error-handling-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-error-handling-page';
