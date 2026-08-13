export const meta = { section: 'Guide', label: 'Configuration', order: 70 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';
import '@openelement/ui/open-code-block';
import { contentLocale } from '@openelement/site-ui/locale.ts';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Configuration',
    lede: 'Configuration stays close to the route, build or package surface it affects.',
    outline: [
      { id: 'pipeline-config', label: 'openPipeline()', level: 3 },
      { id: 'full-entry', label: 'openElement() umbrella', level: 3 },
      { id: 'blog-data', label: 'The blog-data module', level: 3 },
      { id: 'highlighting', label: 'Code highlighting', level: 3 },
      { id: 'fetch-middleware', label: 'middleware.use', level: 3 },
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
          'The lean Vite plugin entry, configured in vite.config.ts: openPipeline({ mode, routes: { dir }, island: { dir, upgradeStrategy }, output: { outDir }, viewTransition, headExtras }). Defaults: routes app/routes, islands app/islands, components app/components, viewTransition on. headExtras is injected into the document head as-is — controlled content only (0.42 line, unfrozen).',
      },
      {
        id: 'full-entry',
        title: 'openElement() umbrella',
        body:
          'Apps that need the content (blog/nav/sitemap) or i18n modules use openElement() from the same package root: it wraps openPipeline and takes the flat option names — routesDir, islandsDir, componentsDir, packageIslands, html, inject, middleware — plus content and i18n module options; omit either module to disable it.',
      },
      {
        id: 'blog-data',
        title: 'The generated blog-data module',
        body:
          "content: { blog: { contentDir, basePath } } compiles every markdown post into a virtual module: import { posts, getPostBySlug } from '@openelement/generated/blog-data'. The runtime module is generated at build/dev time; a checked-in .d.ts stub plus an import-map entry keep deno task check green. frontmatter supports title, date, draft, tags, excerpt, type.",
      },
      {
        id: 'highlighting',
        title: 'Code-block highlighting (optional)',
        body:
          'The blog pipeline renders fenced blocks as <pre><code class="language-x"> with no token-level colors. Wire your own highlighter through the content.blog.markdown hook — the recipe below keeps the default marked behavior and adds hljs spans, which pass the sanitizer allowlist untouched. For code blocks in routes/pages, wrap them in <open-code-block> (@openelement/ui) — it highlights via a global Prism that your page must load (core + language grammars, e.g. the CDN scripts this site injects in www/vite.config.ts); without Prism you get the copy button but no token spans.',
      },
      {
        id: 'fetch-middleware',
        title: 'middleware.use — fetch middleware',
        body:
          'middleware.use (ADR-0123, #858) registers fetch middleware with the WinterCG shape (request, next) => Promise<Response> — no HTTP-framework dialect. The chain is composed around the generated handler in onion order (use[0] is outermost: first to see the request, last to see the response), outside the built-in requestId/logger/cors/securityHeaders/csp middleware, and runs with identical semantics in the dev server, the start CLI, the e2e fixture server, and the Nitro production entry (locked by the request-time parity contract test). A middleware may short-circuit by returning a Response without calling next(). One constraint: middleware sources are inlined into the generated server entry (same mechanism as a function-valued corsOrigin), so each middleware must be self-contained — no closures over the vite.config.ts module scope. Route-scoped _middleware.ts files keep the Hono dialect and remain available inside the app.',
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
      { id: 'blog-data', label: 'blog-data 模块', level: 3 },
      { id: 'highlighting', label: '代码高亮', level: 3 },
      { id: 'fetch-middleware', label: 'middleware.use', level: 3 },
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
        id: 'blog-data',
        title: '生成的 blog-data 虚拟模块',
        body:
          "content: { blog: { contentDir, basePath } } 把每篇 markdown 文章编译进一个虚拟模块：import { posts, getPostBySlug } from '@openelement/generated/blog-data'。运行时模块在 build/dev 时生成；仓库内一份 .d.ts stub 加 import-map 条目保证 deno task check 通过。frontmatter 支持 title、date、draft、tags、excerpt、type。",
      },
      {
        id: 'highlighting',
        title: '代码块语法高亮（可选）',
        body:
          'blog 管线把围栏代码块渲染为 <pre><code class="language-x">，无 token 级着色。可通过 content.blog.markdown 钩子接入你自己的高亮器——下方配方保留默认 marked 行为并追加 hljs span，这些 span 原样通过 sanitizer 白名单。路由/页面里的代码块则用 <open-code-block>（@openelement/ui）包裹——它通过全局 Prism 高亮，页面必须自行加载 Prism（core + 语言 grammar，参考本站在 www/vite.config.ts 注入的 CDN script）；不加载 Prism 就只有 copy 按钮、没有 token 着色。',
      },
      {
        id: 'fetch-middleware',
        title: 'middleware.use —— fetch 中间件',
        body:
          'middleware.use（ADR-0123，#858）注册 WinterCG 形态的 fetch 中间件：(request, next) => Promise<Response>——不含任何 HTTP 框架方言。中间件链在生成的 handler 边界按洋葱序组合（use[0] 最外层：最先看到请求，最后看到响应），位于内置 requestId/logger/cors/securityHeaders/csp 中间件之外，并在 dev server、start CLI、e2e fixture server 与 Nitro 生产入口四个运行时中保持完全一致的语义（由 request-time parity 契约测试锁定）。中间件可以不调用 next() 直接返回 Response 来短路。一个约束：中间件源码会被内联进生成的 server entry（与函数形态的 corsOrigin 同一机制），因此每个中间件必须自包含——不能闭包引用 vite.config.ts 模块作用域的变量。路由级 _middleware.ts 文件保留 Hono 方言，在应用内部依然可用。',
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
    const zh = contentLocale(this._getLocale('en')) === 'zh';
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
        <h3>
          {zh
            ? 'vite.config.ts —— middleware.use（#858）'
            : 'vite.config.ts — middleware.use (#858)'}
        </h3>
        <open-code-block>
          <pre><code>{`import type { Middleware } from '@openelement/element';

// Self-contained: the source is inlined into the generated server entry,
// so it cannot close over vite.config.ts module scope.
const responseTime: Middleware = async (request, next) => {
  const started = Date.now();
  const response = await next();
  response.headers.set('x-response-time', String(Date.now() - started));
  return response;
};

const guard: Middleware = (request, next) => {
  // Short-circuit: skip next() and return a Response directly.
  if (new URL(request.url).pathname.startsWith('/internal')) {
    return Promise.resolve(new Response('Forbidden', { status: 403 }));
  }
  return next();
};

export default defineConfig({
  plugins: [
    ...openElement({
      // Onion order: responseTime wraps guard wraps the app handler.
      middleware: { use: [responseTime, guard] },
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
            ? 'SPA 链上 redirect()/notFound() 仍然有效：redirect 交给 client router 导航，notFound 走页面 error 定义；其余 throw 会被规整为 action 数据。'
            : 'redirect()/notFound() still work on the SPA chain: a redirect navigates the client router, a notFound rides the page error definition; any other throw is normalized into action data.'}
        </p>
        <h3>
          {zh ? 'vite.config.ts —— blog-data 模块' : 'vite.config.ts — the blog-data module (#924)'}
        </h3>
        <open-code-block>
          <pre><code>{`import { defineConfig } from 'vite';
import { openElement } from '@openelement/adapter-vite';

export default defineConfig({
  plugins: [
    openElement({
      content: {
        blog: { contentDir: 'content/blog', basePath: '/blog' },
      },
    }),
  ],
});`}</code></pre>
        </open-code-block>
        <p>
          {zh
            ? '启动 openElement()（content 模块必需；openPipeline() 不生成 blog-data）。每篇 content/blog/*.md 编译为一个 post；draft 文章在 production 构建中被排除。'
            : 'openElement() is required (the content module is not part of openPipeline()). Every content/blog/*.md compiles to one post; draft posts are excluded from production builds.'}
        </p>
        <h3>
          {zh
            ? 'deno.json —— .d.ts stub 与 import-map 条目'
            : 'deno.json — the .d.ts stub and import-map entry (#924)'}
        </h3>
        <open-code-block>
          <pre><code>{`{
  "imports": {
    "@openelement/generated/blog-data": "./app/data/_generated-blog-data.d.ts"
  }
}`}</code></pre>
        </open-code-block>
        <p>
          {zh
            ? '运行时模块由 adapter-vite 在 build/dev 时生成；stub 让 deno task check 在生成文件缺席时仍能类型检查。'
            : 'The runtime module is generated by adapter-vite during build/dev; the stub keeps deno task check type-correct before the generated file exists.'}
        </p>
        <h3>
          {zh
            ? 'app/routes/blog/[slug].tsx —— 使用模式'
            : 'app/routes/blog/[slug].tsx — usage pattern (#924)'}
        </h3>
        <open-code-block>
          <pre><code>{`import { defineElement, definePage, notFound } from '@openelement/app';
import { getPostBySlug, posts } from '@openelement/generated/blog-data';

export function getStaticPaths(): Array<Record<string, string>> {
  return posts.map((post) => ({ slug: post.slug }));
}

defineElement('blog-post-page', {
  render(props: { slug: string }) {
    const post = getPostBySlug(props.slug);
    if (!post) notFound(\`Post not found: \${props.slug}\`);
    return (
      <>
        <h1>{post.frontmatter.title}</h1>
        {/* post.html is markdown authored in this repo — explicit trust boundary */}
        <article class='post-body' innerHTML={post.html} trustedHtml></article>
      </>
    );
  },
});

export default definePage({
  route: { path: '/blog/:slug' },
  renderIntent: { mode: 'static', revalidate: false },
  render({ params }) {
    return <blog-post-page slug={params.slug} />;
  },
});`}</code></pre>
        </open-code-block>
        <p>
          {zh
            ? 'getStaticPaths() 预渲染每个 slug；innerHTML + trustedHtml 是渲染 markdown HTML 的显式信任边界。'
            : 'getStaticPaths() pre-renders every slug; innerHTML + trustedHtml is the explicit trust boundary for markdown HTML.'}
        </p>
        <h3>
          {zh
            ? 'vite.config.ts —— 语法高亮配方（可选，#930）'
            : 'vite.config.ts — syntax highlighting recipe (optional, #930)'}
        </h3>
        <open-code-block>
          <pre><code>{`import { defineConfig } from 'vite';
import { openElement } from '@openelement/adapter-vite';
import { marked } from 'npm:marked@^15';
import hljs from 'npm:highlight.js@^11';

// Default marked behavior + hljs token spans. hljs output only adds class
// attributes to <code>, which the sanitizer allowlist keeps.
const markdown = (content: string) =>
  marked(content, {
    async: true,
    renderer: {
      code(code: string, lang: string | undefined) {
        const language = hljs.getLanguage(lang ?? '') ? lang : 'plaintext';
        const html = hljs.highlight(code, { language }).value;
        return \`<pre><code class="language-\${language}">\${html}</code></pre>\`;
      },
    },
  });

export default defineConfig({
  plugins: [
    openElement({
      content: { blog: { contentDir: 'content/blog', markdown } },
    }),
  ],
});`}</code></pre>
        </open-code-block>
        <p>
          {zh
            ? '自定义 renderer 的输出仍会经过同一道 sanitizer 白名单（class 属性保留）。'
            : 'Custom renderer output still passes the same sanitizer allowlist (class attributes are kept).'}
        </p>
      </>
    );
  }
}

export const tagName = 'guide-configuration-page';
defineCustomElement(tagName, GuideConfigurationPage);
export default GuideConfigurationPage;
