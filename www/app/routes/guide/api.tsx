export const meta = { section: 'Core', label: 'API Routes', order: 60 };

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
    title: 'API Routes',
    lede:
      'API routes use platform request and response primitives. Keep route handlers explicit, typed, and close to the app boundary.',
    outline: [
      { id: 'request-boundary', label: 'Request boundary', level: 3 },
      { id: 'handler-shape', label: 'Handler shape', level: 3 },
      { id: 'runtime-fit', label: 'Runtime fit', level: 3 },
    ],
    previous: { href: '/guide/mdx', label: 'MDX' },
    next: { href: '/guide/configuration', label: 'Configuration' },
    cards: [
      {
        id: 'request-boundary',
        title: 'Request boundary',
        body: 'Use Web Request and Response objects at the edge of the API contract.',
      },
      {
        id: 'handler-shape',
        title: 'Handler shape',
        body: 'Keep input parsing, validation, and response serialization visible in the route.',
      },
      {
        id: 'runtime-fit',
        title: 'Runtime fit',
        body: 'Use Deno-first tasks and avoid Node-only assumptions in docs examples.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: 'API 路由',
    lede:
      'API routes 使用平台 request 与 response 原语。Route handlers 保持显式、有类型，并贴近应用边界。',
    outline: [
      { id: 'request-boundary', label: 'Request 边界', level: 3 },
      { id: 'handler-shape', label: 'Handler 形态', level: 3 },
      { id: 'runtime-fit', label: '运行时适配', level: 3 },
    ],
    previous: { href: '/guide/mdx', label: 'MDX' },
    next: { href: '/guide/configuration', label: '配置' },
    cards: [
      {
        id: 'request-boundary',
        title: 'Request 边界',
        body: '在 API 契约边界使用 Web Request 与 Response 对象。',
      },
      {
        id: 'handler-shape',
        title: 'Handler 形态',
        body: '输入解析、校验与响应序列化在 route 中保持可见。',
      },
      {
        id: 'runtime-fit',
        title: '运行时适配',
        body: '使用 Deno-first 的 tasks，文档示例避免仅 Node 的假设。',
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

customElements.define('guide-api-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-api-page';
