export const meta = { section: 'Core', label: 'API Routes', order: 60 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';
import '@openelement/ui/open-code-block';

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
        body:
          'Files under an api/ directory of the routes dir are API routes; they are served by the same generated entry as pages and are never prerendered. Requests and responses are the Web Request and Response objects.',
      },
      {
        id: 'handler-shape',
        title: 'Handler shape',
        body:
          'An API route default-exports either a Hono app (mounted with app.route()) or a function (ctx) => Response receiving { request, params, env, platform } (mounted with app.all()). Keep input parsing, validation, and response serialization visible in the route.',
      },
      {
        id: 'runtime-fit',
        title: 'Runtime fit',
        body: 'Use Deno-first tasks and avoid Node-only assumptions in docs examples.',
      },
    ],
    recipeTitle: 'app/routes/api/hello.ts',
    recipeNote:
      'The same default-export contract applies at every depth: app/routes/api/items/[id].ts serves /api/items/:id with params populated from the path.',
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
        body:
          'routes 目录下 api/ 子目录中的文件是 API 路由；它们与页面由同一个生成入口伺服，且永不预渲染。请求与响应都是 Web Request 与 Response 对象。',
      },
      {
        id: 'handler-shape',
        title: 'Handler 形态',
        body:
          'API 路由默认导出两种形态之一：一个 Hono app（以 app.route() 挂载），或一个接收 { request, params, env, platform } 的函数 (ctx) => Response（以 app.all() 挂载）。输入解析、校验与响应序列化在 route 中保持可见。',
      },
      {
        id: 'runtime-fit',
        title: '运行时适配',
        body: '使用 Deno-first 的 tasks，文档示例避免仅 Node 的假设。',
      },
    ],
    recipeTitle: 'app/routes/api/hello.ts',
    recipeNote:
      '同一默认导出契约适用于任意深度：app/routes/api/items/[id].ts 伺服 /api/items/:id，params 从路径中解析填充。',
  },
};

export class GuideApiPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };

  protected override renderAfterCards(t: GuideContent): unknown {
    return (
      <>
        <h3>{t.recipeTitle}</h3>
        <open-code-block>
          <pre><code>{`// Files under an api/ directory are API routes. Default-export a Hono
// app (mounted with app.route()) or a function (ctx) => Response
// (mounted with app.all()).
export default function hello(ctx: {
  request: Request;
  params: Record<string, string>;
  env: Record<string, string | undefined>;
  platform?: unknown;
}) {
  const url = new URL(ctx.request.url);
  return Response.json({ hello: url.searchParams.get('name') ?? 'world' });
}`}</code></pre>
        </open-code-block>
        <p>{t.recipeNote}</p>
      </>
    );
  }
}

defineCustomElement('guide-api-page', GuideApiPage);
export default GuideApiPage;
export const tagName = 'guide-api-page';
