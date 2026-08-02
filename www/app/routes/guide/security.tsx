export const meta = { section: 'Guide', label: 'Security', order: 95 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';
import '@openelement/ui/open-code-block';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Security',
    lede:
      'The built-in CSRF same-origin floor for actions, plus the middleware recipe for API routes and ambient-auth apps.',
    outline: [
      { id: 'standing-assumption', label: 'Standing assumption', level: 3 },
      { id: 'ambient-auth', label: 'Ambient authentication', level: 3 },
      { id: 'middleware-recipe', label: 'Middleware recipe', level: 3 },
    ],
    previous: { href: '/guide/islands-and-ssr', label: 'Islands and SSR' },
    next: { href: '/guide/deployment', label: 'Deployment' },
    cards: [
      {
        id: 'standing-assumption',
        title: 'Standing assumption',
        body:
          'Generated action POST handlers ship with a fail-closed same-origin floor (ADR-0121 §12 amendment): a request is rejected when Sec-Fetch-Site is cross-site, or when Origin is present and does not match the request URL origin. Clients that omit both headers (typical non-browser tools) are allowed. Set OPEN_ELEMENT_DISABLE_CSRF=1 on the request env binding (c.env / Nitro runtime env) to opt out. First-party cookie sessions remain 0.44 scope; until then the form/action loop assumes the browser SameSite=Lax default.',
      },
      {
        id: 'ambient-auth',
        title: 'Ambient authentication',
        body:
          'Apps authenticated by ambient credentials — HTTP Basic, mTLS, or cookies set with SameSite=None — cannot rely on the Lax default: the browser attaches those credentials to cross-site requests. The built-in same-origin floor covers generated action POSTs, but such apps should validate the request origin on every state-changing API route as well.',
      },
      {
        id: 'middleware-recipe',
        title: 'Middleware recipe',
        body:
          'The built-in floor guards generated action handlers only. For custom API routes — and as defense in depth for ambient-auth apps — drop the middleware below into app/routes/_middleware.ts. A root _middleware.ts default-exports a Hono middleware scoped to /*, in front of every page action and API route. It allows safe methods and same-site Fetch Metadata, and falls back to an Origin allowlist for older browsers.',
      },
    ],
    recipeTitle: 'app/routes/_middleware.ts',
    recipeNote:
      'middleware.corsOrigin (createOpenPlugin option) governs cross-origin resource sharing only — it is not a CSRF check. The two compose: CORS for reads, this guard for writes.',
  },
  zh: {
    breadcrumb: '指南',
    title: '安全',
    lede: 'action 内置的 CSRF 同源地板，以及面向 API 路由与隐式凭据应用的 middleware 配方。',
    outline: [
      { id: 'standing-assumption', label: '基本假设', level: 3 },
      { id: 'ambient-auth', label: '隐式身份验证', level: 3 },
      { id: 'middleware-recipe', label: 'Middleware 配方', level: 3 },
    ],
    previous: { href: '/guide/islands-and-ssr', label: 'Islands 与 SSR' },
    next: { href: '/guide/deployment', label: '部署' },
    cards: [
      {
        id: 'standing-assumption',
        title: '基本假设',
        body:
          '生成的 action POST 处理器内置 fail-closed 同源地板（ADR-0121 §12 修订文）：当 Sec-Fetch-Site 为 cross-site，或 Origin 存在且与请求 URL 的源不一致时拒绝请求；两个头都省略的客户端（典型的非浏览器工具）放行。在请求 env 绑定（c.env / Nitro runtime env）上设置 OPEN_ELEMENT_DISABLE_CSRF=1 可选择退出。第一方 cookie 会话仍属 0.44 范围；在此之前表单/action 循环假定浏览器 SameSite=Lax 默认值。',
      },
      {
        id: 'ambient-auth',
        title: '隐式身份验证',
        body:
          '使用隐式凭据（HTTP Basic、mTLS，或 SameSite=None 的 cookie）的应用无法依赖 Lax 默认值：浏览器会在跨站请求中附带这些凭据。内置同源地板已覆盖生成的 action POST，但这类应用还应在每个会改变状态的 API 路由上校验请求来源。',
      },
      {
        id: 'middleware-recipe',
        title: 'Middleware 配方',
        body:
          '内置地板只守卫生成的 action 处理器。对于自定义 API 路由——以及作为隐式凭据应用的纵深防御——把下面的 middleware 放入 app/routes/_middleware.ts。根级 _middleware.ts 默认导出一个作用于 /* 的 Hono middleware，位于每个页面 action 与 API 路由之前。它放行安全方法与 same-site Fetch Metadata，并为旧浏览器回退到 Origin 白名单。',
      },
    ],
    recipeTitle: 'app/routes/_middleware.ts',
    recipeNote:
      'middleware.corsOrigin（createOpenPlugin 选项）只管跨域资源共享，不是 CSRF 校验。两者组合使用：CORS 管读取，这个守卫管写入。',
  },
};

export class GuideSecurityPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };

  protected override renderAfterCards(t: GuideContent): unknown {
    return (
      <>
        <h3>{t.recipeTitle}</h3>
        <open-code-block>
          <pre><code>{`import type { Context, Next } from 'hono';

// CSRF guard for custom API routes and defense in depth (ADR-0121 §12):
// generated action POST handlers already enforce a fail-closed same-origin
// floor (opt out with OPEN_ELEMENT_DISABLE_CSRF=1 on the request env). Apps
// using ambient authentication (Basic, mTLS, SameSite=None cookies) should
// also reject cross-site state-changing requests on their API routes.
const ALLOWED_ORIGINS = new Set(['https://app.example.com']);

export default async function csrfGuard(c: Context, next: Next) {
  const method = c.req.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }
  // Fetch Metadata: same-origin/same-site submissions and user-typed
  // navigations are always fine.
  const site = c.req.header('sec-fetch-site');
  if (site === 'same-origin' || site === 'same-site' || site === 'none') {
    return next();
  }
  // Older browsers without Fetch Metadata: fall back to the Origin header.
  const origin = c.req.header('origin');
  if (origin && ALLOWED_ORIGINS.has(new URL(origin).origin)) {
    return next();
  }
  return c.text('Forbidden', 403);
}`}</code></pre>
        </open-code-block>
        <p>{t.recipeNote}</p>
      </>
    );
  }
}

defineCustomElement('guide-security-page', GuideSecurityPage);
export default GuideSecurityPage;
export const tagName = 'guide-security-page';
