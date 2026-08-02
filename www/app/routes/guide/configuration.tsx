export const meta = { section: 'Guide', label: 'Configuration', order: 70 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';
import '@openelement/ui/open-code-block';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Configuration',
    lede: 'Configuration stays close to the route, build or package surface it affects.',
    outline: [
      { id: 'pipeline-config', label: 'openPipeline()', level: 3 },
      { id: 'full-entry', label: 'openElement() umbrella', level: 3 },
      { id: 'spa-mode', label: "mode: 'spa'", level: 3 },
      { id: 'spa-vs-ssg', label: 'SPA vs SSG chains', level: 3 },
    ],
    previous: { href: '/guide/api', label: 'API Routes' },
    next: { href: '/guide/migration', label: 'Migration' },
    cards: [
      {
        id: 'pipeline-config',
        title: 'openPipeline()',
        body:
          "The lean Vite plugin entry, configured in vite.config.ts: openPipeline({ mode, routes: { dir }, island: { dir, upgradeStrategy }, output: { outDir }, viewTransition, headExtras }). Defaults: routes app/routes, islands app/islands, components app/components, viewTransition on. headExtras is injected into the document head as-is — controlled content only (0.42 line, unfrozen).",
      },
      {
        id: 'full-entry',
        title: 'openElement() umbrella',
        body:
          'Apps that need the content (blog/nav/sitemap) or i18n modules use openElement() from the same package root: it wraps openPipeline and takes the flat option names — routesDir, islandsDir, componentsDir, packageIslands, html, inject, middleware — plus content and i18n module options; omit either module to disable it.',
      },
      {
        id: 'spa-mode',
        title: "mode: 'spa'",
        body:
          "openPipeline({ mode: 'spa' }) produces a client-only app (no SSR). Bootstrap with defineApp({ mode: 'spa', routes }) from @openelement/app: each route is { path, tagName, loader?, action?, guard? }, paths take :id params and the :path{.+} multi-segment catch-all (Hono-style). mount(selector) attaches the client router; pages read data with useLoaderData() / useActionData().",
      },
      {
        id: 'spa-vs-ssg',
        title: 'SPA vs SSG chains',
        body:
          'SPA loaders/actions run client-side with only { params } (actions also get formData) and signal failure by throwing; the SSG/request-time chain runs on the server with the Web-standard context and the fail()/redirect() protocol. The names are intentionally parallel, the contexts are not (ADR-0119 frozen SPA semantics).',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '配置',
    lede: '配置贴近它所影响的 route、build 或 package 表面。',
    outline: [
      { id: 'pipeline-config', label: 'openPipeline()', level: 3 },
      { id: 'full-entry', label: 'openElement() 伞入口', level: 3 },
      { id: 'spa-mode', label: "mode: 'spa'", level: 3 },
      { id: 'spa-vs-ssg', label: 'SPA 与 SSG 两链', level: 3 },
    ],
    previous: { href: '/guide/api', label: 'API 路由' },
    next: { href: '/guide/migration', label: '迁移' },
    cards: [
      {
        id: 'pipeline-config',
        title: 'openPipeline()',
        body:
          '精简的 Vite 插件入口，在 vite.config.ts 中配置：openPipeline({ mode, routes: { dir }, island: { dir, upgradeStrategy }, output: { outDir }, viewTransition, headExtras })。默认值：routes 为 app/routes，islands 为 app/islands，components 为 app/components，viewTransition 开启。headExtras 原样注入文档 head——仅限可控内容（0.42 版本线，未冻结）。',
      },
      {
        id: 'full-entry',
        title: 'openElement() 伞入口',
        body:
          '需要 content（blog/nav/sitemap）或 i18n 模块的应用使用同一包根导出的 openElement()：它包装 openPipeline，采用扁平选项名——routesDir、islandsDir、componentsDir、packageIslands、html、inject、middleware——外加 content 与 i18n 模块选项；省略对应模块即禁用。',
      },
      {
        id: 'spa-mode',
        title: "mode: 'spa'",
        body:
          "openPipeline({ mode: 'spa' }) 产出纯客户端应用（无 SSR）。用 @openelement/app 的 defineApp({ mode: 'spa', routes }) 启动：每条路由是 { path, tagName, loader?, action?, guard? }，路径支持 :id 参数与 :path{.+} 多段 catch-all（Hono 风格）。mount(selector) 挂载 client router；页面用 useLoaderData() / useActionData() 读取数据。",
      },
      {
        id: 'spa-vs-ssg',
        title: 'SPA 与 SSG 两链',
        body:
          'SPA 的 loader/action 运行在客户端，上下文只有 { params }（action 另有 formData），通过抛出异常表达失败；SSG/request-time 链运行在服务端，使用 Web 标准上下文与 fail()/redirect() 协议。两者命名刻意平行，上下文并不相同（ADR-0119 已冻结的 SPA 语义）。',
      },
    ],
  },
};

export class GuideConfigurationPage extends GuidePage {
  static override styles = [guideStyles({ columns: 2 })];
  static override guide = { content };

  protected override renderAfterCards(_t: GuideContent): unknown {
    const zh = this._getLocale('en') === 'zh';
    return (
      <>
        <h3>vite.config.ts</h3>
        <open-code-block>
          <pre><code>{`import { defineConfig } from 'vite';
import { openPipeline } from '@openelement/adapter-vite';

export default defineConfig({
  plugins: [
    openPipeline({
      mode: 'ssg', // default; 'spa' produces a client-only app
      routes: { dir: 'app/routes' },
      island: { dir: 'app/islands', upgradeStrategy: 'visible' },
      output: { outDir: 'dist' },
      viewTransition: true,
    }),
  ],
});`}</code></pre>
        </open-code-block>
        <h3>{zh ? 'app/main.ts —— SPA 启动' : 'app/main.ts — SPA bootstrap'}</h3>
        <open-code-block>
          <pre><code>{`import { defineApp, definePage, useLoaderData } from '@openelement/app';

const HomePage = definePage({
  render() {
    const data = useLoaderData() as { now: string } | undefined;
    return <main><h1>home</h1><p>{data?.now ?? ''}</p></main>;
  },
});
customElements.define('page-home', HomePage);
// register 'page-doc' the same way

const app = defineApp({
  mode: 'spa',
  routes: [
    {
      path: '/',
      tagName: 'page-home',
      loader: async () => ({ now: new Date().toISOString() }),
    },
    // multi-segment catch-all (Hono-style)
    { path: '/docs/:path{.+}', tagName: 'page-doc' },
  ],
});

app.mount('#app');`}</code></pre>
        </open-code-block>
        <p>
          {zh
            ? "SPA 链上 redirect()/notFound() 仍然有效：redirect 交给 client router 导航，notFound 走页面 error 定义；其余 throw 会被规整为 action 数据。"
            : 'redirect()/notFound() still work on the SPA chain: a redirect navigates the client router, a notFound rides the page error definition; any other throw is normalized into action data.'}
        </p>
      </>
    );
  }
}

defineCustomElement('guide-configuration-page', GuideConfigurationPage);
export default GuideConfigurationPage;
export const tagName = 'guide-configuration-page';
