export const meta = { section: 'Guide', label: 'Routing and Data', order: 40 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';
import '@openelement/ui/open-code-block';

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
      { id: 'isr-revalidate', label: 'renderIntent.revalidate', level: 3 },
      { id: 'form-actions', label: 'Form actions', level: 3 },
      { id: 'action-negotiation', label: 'Action fetch negotiation', level: 3 },
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
          "renderIntent.mode selects where a page renders: 'static' (default) prerenders at build; 'dynamic' skips prerendering and renders per request through the generated dist/server entry, running the route loader on every request. Pages that export an action must declare 'dynamic' — the build rejects prerendered action pages (0.42 line, unfrozen).",
      },
      {
        id: 'isr-revalidate',
        title: 'renderIntent.revalidate',
        body:
          'revalidate is recorded on the route but inert in the 0.42 line — it does not enable caching; it is reserved for the 0.44 ISR work. Treat it as unstable (@experimental).',
      },
      {
        id: 'form-actions',
        title: 'Form actions',
        body:
          "A dynamic route may export an action ({ formData }) — plain HTML forms work without JavaScript: validation failures return fail(4xx, data) and re-render with the echo (HTTP 422), successes answer 303 (PRG). Named actions dispatch via formaction='?/name'. Forms marked data-open-enhance submit via fetch and morph the returned document into place: hydrated islands whose light DOM did not change keep their state, data-open-preserve exempts a subtree, and the URL follows the PRG target. An action must be safe to re-run after a failed validation (0.42 line, unfrozen).",
      },
      {
        id: 'action-negotiation',
        title: 'Action fetch negotiation',
        body:
          'Fetch-based action posts are recognized by the x-openelement-action header (exported as ACTION_FETCH_HEADER from @openelement/app): the built-in morph enhancement sends enhance and receives the same full-HTML responses as the no-JS path; a programmatic caller sends true and receives the serialized ActionResult union — success / failure / redirect with status and data — while error outcomes answer RFC 9457 problem+json (type/title/status/detail, #863). No header means a plain browser form post.',
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
      { id: 'isr-revalidate', label: 'renderIntent.revalidate', level: 3 },
      { id: 'form-actions', label: '表单 action', level: 3 },
      { id: 'action-negotiation', label: 'Action fetch 协商', level: 3 },
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
          "renderIntent.mode 决定页面在哪里渲染:'static'(默认)在构建时预渲染;'dynamic' 跳过预渲染,通过生成的 dist/server 入口按请求渲染,每次请求都会运行路由 loader。导出 action 的页面必须声明 'dynamic'——构建会拒绝预渲染的 action 页面(0.42 版本线,未冻结)。",
      },
      {
        id: 'isr-revalidate',
        title: 'renderIntent.revalidate',
        body:
          'revalidate 会记录在路由上，但在 0.42 版本线中是 inert 的——它不会启用缓存；该字段为 0.44 的 ISR 工作预留。把它当作不稳定的 @experimental 对待。',
      },
      {
        id: 'form-actions',
        title: '表单 action',
        body:
          "dynamic 路由可导出 action({ formData })——纯 HTML 表单无需 JavaScript 即可工作:校验失败返回 fail(4xx, data),以 422 重渲染并回显;成功则以 303 应答(PRG)。命名 action 通过 formaction='?/name' 分派。标记 data-open-enhance 的表单经 fetch 提交并把返回的文档 morph 就位:light DOM 未变化的已水合 island 状态保留,data-open-preserve 豁免子树,URL 跟随 PRG 目标。action 在校验失败后必须可安全重跑(0.42 版本线,未冻结)。",
      },
      {
        id: 'action-negotiation',
        title: 'Action fetch 协商',
        body:
          '基于 fetch 的 action 提交通过 x-openelement-action 头识别（从 @openelement/app 导出为 ACTION_FETCH_HEADER）：内置 morph 增强发送 enhance，收到与无 JS 路径相同的完整 HTML 响应；编程调用方发送 true，收到序列化的 ActionResult 联合类型——success / failure / redirect，带 status 与 data；错误结果则以 RFC 9457 problem+json 应答（type/title/status/detail，#863）。没有该头即视为普通浏览器表单提交。',
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

export class GuideRoutingAndDataPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };

  protected override renderAfterCards(_t: GuideContent): unknown {
    const zh = this._getLocale('en') === 'zh';
    return (
      <>
        <h3>app/routes/guestbook.tsx</h3>
        <open-code-block>
          <pre><code>{`import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
  useLoaderData,
} from '@openelement/app';

export const tagName = 'page-guestbook';

interface GuestbookData {
  entries: string[];
}

interface GuestbookActionData {
  error?: string;
  message?: string;
}

export async function loader(): Promise<GuestbookData> {
  return { entries: await listEntries() }; // app data layer
}

export function action(
  ctx: { formData: FormData },
): OpenElementActionFailure<GuestbookActionData> {
  const message = String(ctx.formData.get('message') ?? '').trim();
  if (!message) {
    return fail(422, { error: 'message is required', message });
  }
  throw redirect('/guestbook?echoed=' + encodeURIComponent(message)); // 303 PRG
}

// Named actions dispatch via formaction='?/name'.
export const actions = {
  shout(ctx: { formData: FormData }): never {
    const message = String(ctx.formData.get('message') ?? '').trim() || 'silence';
    throw redirect('/guestbook?echoed=' + encodeURIComponent(message.toUpperCase()));
  },
};

const GuestbookPage = definePage({
  renderIntent: { mode: 'dynamic' },
  render({ request }) {
    const { entries } = useLoaderData() as GuestbookData;
    const actionData = useActionData() as GuestbookActionData | undefined;
    const echoed = request ? new URL(request.url).searchParams.get('echoed') : undefined;
    return (
      <main>
        <h1>guestbook</h1>
        <form method='post' data-open-enhance>
          <input name='message' type='text' value={actionData?.message ?? ''} />
          <button type='submit'>Send</button>
          <button type='submit' formaction='?/shout'>Shout</button>
        </form>
        {actionData?.error ? <p role='alert'>{actionData.error}</p> : null}
        {echoed ? <p>echo={echoed}</p> : null}
        <ul>{entries.map((entry) => <li>{entry}</li>)}</ul>
      </main>
    );
  },
});

customElements.define(tagName, GuestbookPage);
export default GuestbookPage;`}</code></pre>
        </open-code-block>
        <h3>{zh ? '集成配方' : 'Integration recipes'}</h3>
        <p class='full-guide'>
          {zh
            ? (
              <>
                <a href='https://github.com/open-element/openelement/blob/main/docs/integrations/better-auth.md'>
                  better-auth
                </a>——在 loader 中读会话、把 auth 端点挂为 API 路由、在 action
                中授权（文档级配方）。
              </>
            )
            : (
              <>
                <a href='https://github.com/open-element/openelement/blob/main/docs/integrations/better-auth.md'>
                  better-auth
                </a>{' '}
                — session read in loaders, auth endpoints mounted as API routes, authorization in
                actions (doc-level recipe).
              </>
            )}
        </p>
        <p class='full-guide'>
          {zh
            ? (
              <>
                <a href='https://github.com/open-element/openelement/blob/main/docs/integrations/drizzle.md'>
                  Drizzle
                </a>——查询放在 loader、变更放在 action，连接密钥只走 ctx.env（文档级配方）。
              </>
            )
            : (
              <>
                <a href='https://github.com/open-element/openelement/blob/main/docs/integrations/drizzle.md'>
                  Drizzle
                </a>{' '}
                — queries in loaders, mutations in actions, connection secrets on ctx.env only
                (doc-level recipe).
              </>
            )}
        </p>
        <p class='full-guide'>
          {zh
            ? (
              <>
                <a href='https://github.com/open-element/openelement/blob/main/docs/integrations/validation.md'>
                  Validation（zod / valibot）
                </a>——在 action 内做 schema 解析，失败 fail(422) 回显；由 request-time fixture 的
                e2e 门禁验证。
              </>
            )
            : (
              <>
                <a href='https://github.com/open-element/openelement/blob/main/docs/integrations/validation.md'>
                  Validation (zod / valibot)
                </a>{' '}
                — schema parse inside the action, fail(422) with the echo on failure; verified by
                the request-time fixture e2e gate.
              </>
            )}
        </p>
      </>
    );
  }
}

export const tagName = 'guide-routing-and-data-page';
defineCustomElement(tagName, GuideRoutingAndDataPage);
export default GuideRoutingAndDataPage;
