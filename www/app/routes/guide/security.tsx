export const meta = { section: 'Guide', label: 'Security', order: 95 };

import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';
import '@openelement/ui/open-code-block';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Security',
    lede:
      'The CSRF threat model of the form/action loop, and the middleware recipe for ambient-auth apps.',
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
          'The form/action loop relies on the browser SameSite=Lax default for cookie-based authentication: a cross-site POST does not carry the session cookie, so same-site cookies are not a CSRF vector for actions (ADR-0121 §12). First-party sessions are 0.44 scope; until then the framework ships no built-in CSRF token check.',
      },
      {
        id: 'ambient-auth',
        title: 'Ambient authentication',
        body:
          'Apps authenticated by ambient credentials — HTTP Basic, mTLS, or cookies set with SameSite=None — cannot rely on the Lax default: the browser attaches those credentials to cross-site requests. Such apps must validate the request origin on every state-changing method.',
      },
      {
        id: 'middleware-recipe',
        title: 'Middleware recipe',
        body:
          'Drop the middleware below into app/routes/_middleware.ts. A root _middleware.ts default-exports a Hono middleware scoped to /*, in front of every page action and API route. It allows safe methods and same-site Fetch Metadata, and falls back to an Origin allowlist for older browsers.',
      },
    ],
    recipeTitle: 'app/routes/_middleware.ts',
    recipeNote:
      'middleware.corsOrigin (createOpenPlugin option) governs cross-origin resource sharing only — it is not a CSRF check. The two compose: CORS for reads, this guard for writes.',
  },
  zh: {
    breadcrumb: '指南',
    title: '安全',
    lede: '表单/action 循环的 CSRF 威胁模型，以及使用隐式凭据的应用所需的 middleware 配方。',
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
          '表单/action 循环依赖浏览器 SameSite=Lax 默认值来保护基于 cookie 的身份验证：跨站 POST 不携带会话 cookie，因此 same-site cookie 不会成为 action 的 CSRF 入口（ADR-0121 §12）。第一方会话属于 0.44 范围；在此之前框架不内置 CSRF token 校验。',
      },
      {
        id: 'ambient-auth',
        title: '隐式身份验证',
        body:
          '使用隐式凭据（HTTP Basic、mTLS，或 SameSite=None 的 cookie）的应用无法依赖 Lax 默认值：浏览器会在跨站请求中附带这些凭据。这类应用必须在每个会改变状态的方法上校验请求来源。',
      },
      {
        id: 'middleware-recipe',
        title: 'Middleware 配方',
        body:
          '把下面的 middleware 放入 app/routes/_middleware.ts。根级 _middleware.ts 默认导出一个作用于 /* 的 Hono middleware，位于每个页面 action 与 API 路由之前。它放行安全方法与 same-site Fetch Metadata，并为旧浏览器回退到 Origin 白名单。',
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

// CSRF guard (ADR-0121 §12): the framework's form/action loop assumes
// SameSite=Lax cookies. Apps using ambient authentication (Basic, mTLS,
// SameSite=None cookies) must reject cross-site state-changing requests
// themselves until built-in support lands with 0.44 sessions.
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

customElements.define('guide-security-page', GuideSecurityPage);
export default GuideSecurityPage;
export const tagName = 'guide-security-page';
