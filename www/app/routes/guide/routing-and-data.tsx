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
      { id: 'two-chains', label: 'Two loader/action chains', level: 3 },
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
          "A dynamic route may export an action ({ formData }) — plain HTML forms work without JavaScript: validation failures return fail(4xx, data) and re-render with the echo (HTTP 422), successes answer 303 (PRG). Named actions dispatch via formaction='?/name'. Forms marked data-open-enhance submit via fetch and morph the returned document into place: hydrated islands whose light DOM did not change keep their state, data-open-preserve exempts a subtree, and the URL follows the PRG target. An action must be safe to re-run after a failed validation (0.42 line, unfrozen).",
      },
      {
        id: 'two-chains',
        title: 'Two loader/action chains',
        body:
          "Request-time ('dynamic') loaders/actions run on the server with the Web-standard context { request, params, env, platform, route } and the fail()/redirect() protocol. SPA-mode loaders/actions run client-side with only { params } (plus formData for actions) and signal failure by throwing — a throw is normalized into action data. The names are intentionally parallel, but the contexts differ: code written against one chain cannot assume the other's context (#570, ADR-0119 frozen SPA semantics).",
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
      { id: 'two-chains', label: '两条 loader/action 链', level: 3 },
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
          "dynamic 路由可导出 action({ formData })——纯 HTML 表单无需 JavaScript 即可工作:校验失败返回 fail(4xx, data),以 422 重渲染并回显;成功则以 303 应答(PRG)。命名 action 通过 formaction='?/name' 分派。标记 data-open-enhance 的表单经 fetch 提交并把返回的文档 morph 就位:light DOM 未变化的已水合 island 状态保留,data-open-preserve 豁免子树,URL 跟随 PRG 目标。action 在校验失败后必须可安全重跑(0.42 版本线,未冻结)。",
      },
      {
        id: 'two-chains',
        title: '两条 loader/action 链',
        body:
          "request-time('dynamic')loader/action 运行在服务端,上下文是 Web 标准的 { request, params, env, platform, route },并使用 fail()/redirect() 协议。SPA 模式的 loader/action 运行在客户端,上下文只有 { params }(action 另有 formData),通过抛出异常来表达失败——throw 会被规整为 action 数据。两者命名刻意保持一致,但上下文不同:针对其中一条链编写的代码不能假设另一条链的上下文(#570,ADR-0119 已冻结的 SPA 语义)。",
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
