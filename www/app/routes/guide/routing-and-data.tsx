export const meta = { section: 'Guide', label: 'Routing and Data', order: 40 };

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
    title: 'Routing and Data',
    lede: 'Routes are file-based surfaces with explicit metadata and data boundaries.',
    outline: [
      { id: 'file-routes', label: 'File routes', level: 3 },
      { id: 'metadata', label: 'Metadata', level: 3 },
      { id: 'data-boundary', label: 'Data boundary', level: 3 },
      { id: 'rendering-modes', label: 'Rendering modes', level: 3 },
      { id: 'form-actions', label: 'Form actions', level: 3 },
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
      {
        id: 'rendering-modes',
        title: 'Rendering modes',
        body:
          "renderIntent.mode selects where a page renders: 'auto' (default) and 'static' prerender at build; 'dynamic' skips prerendering and renders per request through the generated dist/server entry, running the route loader on every request. Pages that export an action must declare 'dynamic' — the build rejects prerendered action pages (0.42 line, unfrozen).",
      },
      {
        id: 'form-actions',
        title: 'Form actions',
        body:
          "A dynamic route may export an action ({ formData }) — plain HTML forms work without JavaScript: validation failures return fail(4xx, data) and re-render with the echo (HTTP 422), successes answer 303 (PRG). Named actions dispatch via formaction='?/name'. Forms marked data-open-enhance use the same protocol through fetch (ActionResult JSON); an action must be safe to re-run after a failed validation (0.42 line, unfrozen).",
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
      { id: 'rendering-modes', label: '渲染模式', level: 3 },
      { id: 'form-actions', label: '表单 action', level: 3 },
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
      {
        id: 'rendering-modes',
        title: '渲染模式',
        body:
          "renderIntent.mode 决定页面在哪里渲染:'auto'(默认)与 'static' 在构建时预渲染;'dynamic' 跳过预渲染,通过生成的 dist/server 入口按请求渲染,每次请求都会运行路由 loader。导出 action 的页面必须声明 'dynamic'——构建会拒绝预渲染的 action 页面(0.42 版本线,未冻结)。",
      },
      {
        id: 'form-actions',
        title: '表单 action',
        body:
          "dynamic 路由可导出 action({ formData })——纯 HTML 表单无需 JavaScript 即可工作:校验失败返回 fail(4xx, data),以 422 重渲染并回显;成功则以 303 应答(PRG)。命名 action 通过 formaction='?/name' 分派。标记 data-open-enhance 的表单走同一协议的 fetch 路径(ActionResult JSON);action 在校验失败后必须可安全重跑(0.42 版本线,未冻结)。",
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

customElements.define('guide-routing-and-data-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-routing-and-data-page';
