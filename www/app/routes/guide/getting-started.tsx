export const meta = { section: 'Quick Start', label: 'Getting Started', order: 1 };
// Strategic docs anchor: current package line v0.40.6, active line v0.40.6.
// openElement = Elements + UI + Framework + Protocols.

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { pageStylesSheet } from '../../components/page-styles.js';
import { daisyClassSheet, openPropsTokenSheet } from '@openelement/ui';
import '@openelement/ui/open-callout';
import '@openelement/ui/open-code-block';
import { OPENELEMENT_VERSION } from '../../data/version.ts';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  .step { margin: var(--size-6) 0 var(--size-8); }
  .step h2 { margin-top: 0; }
  .nav-row { margin-top: var(--size-8); padding-top: var(--size-4); border-top: 0.5px solid var(--gray-3); display: flex; justify-content: flex-end; }
`);

export class GettingStartedPage extends OpenElement {
  static override styles = [daisyClassSheet, openPropsTokenSheet, pageStylesSheet, routeSheet];

  override render() {
    return (
      <div class='content-grid'>
        <div class='container'>
          {this._getLocale('en') === 'zh' ? <GettingStartedZh /> : <GettingStartedEn />}
        </div>
      </div>
    );
  }
}

function GettingStartedEn() {
  return (
    <>
      <h1>Getting Started</h1>
      <p class='subtitle'>
        Create a minimal JSX-first openElement app, start the dev server, build static output, and
        learn where the {OPENELEMENT_VERSION}{' '}
        application lifecycle lives inside the four-product platform.
      </p>

      <open-callout type='info' label='Recommended'>
        Deno 2.7+ recommended. openElement <strong>{OPENELEMENT_VERSION}</strong> uses Deno tasks,
        {' '}
        <code>deno.json</code> imports, JSX/VNode rendering, and the <code>openElement()</code>{' '}
        Vite facade from
        <code>@openelement/app/vite</code>.
      </open-callout>

      <section class='step'>
        <h2>1. Create a Project</h2>
        <open-code-block>
          <pre><code>{'deno run -A jsr:@openelement/create my-app\ncd my-app'}</code></pre>
        </open-code-block>
        <p>
          The scaffold includes page routes, a sample island, Vite config, and the common Deno tasks
          needed for development and builds.
        </p>
      </section>

      <section class='step'>
        <h2>2. Start the Dev Server</h2>
        <open-code-block>
          <pre><code>deno task dev</code></pre>
        </open-code-block>
        <p>
          Dev mode provides module loading and hot reload through Vite, with SSR/API behavior from
          the generated Hono entry.
        </p>
      </section>

      <section class='step'>
        <h2>3. Build Static Output</h2>
        <open-code-block>
          <pre><code>deno task build</code></pre>
        </open-code-block>
        <p>
          The build command scans routes and islands, generates SSR wiring, renders DSD HTML, emits
          client island chunks, and writes the final static output to{' '}
          <span class='inline-code'>dist/</span>.
        </p>
      </section>

      <h2>Project Structure</h2>
      <open-code-block>
        <pre><code>{`my-app/
|-- app/
|   |-- routes/
|   |   \`-- index.tsx
|   |-- islands/
|   |   \`-- my-counter.tsx
|   \`-- components/
|-- deno.json
\`-- vite.config.ts`}</code></pre>
      </open-code-block>

      <h2>Writing a Page</h2>
      <p>
        A page is a canonical object descriptor passed to{' '}
        <code>definePage()</code>. The framework turns the descriptor into a Web Component and
        renders it as Declarative Shadow DOM during SSR/SSG.
      </p>
      <open-code-block>
        <pre><code>{`import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: { title: 'Home' },
  render() {
    return <main>Hello openElement</main>;
  },
});`}</code></pre>
      </open-code-block>

      <h2>Loading Data and Controlling Lifecycle</h2>
      <p>
        The object form keeps app code in JSX while giving the framework a structured lifecycle:
        params, route source, metadata, redirect, not-found, and error fallback.
      </p>
      <open-code-block>
        <pre><code>{`import { definePage, notFound, redirect } from '@openelement/app';

export default definePage({
  route: { path: '/posts/[slug]', params: ['slug'] },
  head: {
    title: 'Post',
    description: 'Blog post page',
  },
  renderIntent: {
    mode: 'static',
    revalidate: 300,
  },
  async load({ params, route }) {
    if (!params.slug) notFound();
    if (params.slug === 'old-post') redirect('/posts/new-post', 301);
    return { slug: params.slug, source: route.filePath };
  },
  render({ data, route }) {
    return (
      <article>
        <h1>{data.slug}</h1>
        <p>Rendered from {route.filePath}</p>
      </article>
    );
  },
  error({ error }) {
    return <main>{String(error)}</main>;
  },
});`}</code></pre>
      </open-code-block>

      <h2>Adding Interactivity</h2>
      <p>
        Put browser-upgraded components under{' '}
        <span class='inline-code'>app/islands</span>. Interactive UI should return VNodes and use
        JSX event handlers.
      </p>
      <open-code-block>
        <pre><code>{`import { defineIsland } from '@openelement/app';
import { signal } from '@openelement/element';

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  ),
);`}</code></pre>
      </open-code-block>

      <h2>Configuring Vite</h2>
      <open-code-block>
        <pre><code>{`import { defineConfig } from 'vite';
import { openElement } from '@openelement/app/vite';

export default defineConfig({
  plugins: [openElement({ routesDir: 'app/routes', islandsDir: 'app/islands' })],
});`}</code></pre>
      </open-code-block>

      <div class='alert alert-info'>
        <p>
          The v1.0 target is a stable application engine. {OPENELEMENT_VERSION}{' '}
          keeps the Application API structured and AI-readable while static generation remains
          proven build infrastructure behind the app/create surface.
        </p>
      </div>

      <div class='nav-row'>
        <a href='/guide/core-concepts' class='btn btn-ghost'>Core Concepts &rarr;</a>
      </div>
    </>
  );
}

function GettingStartedZh() {
  return (
    <>
      <h1>快速开始</h1>
      <p class='subtitle'>
        创建一个 JSX-first 的 openElement 应用，启动开发服务器，构建静态输出，并理解
        {OPENELEMENT_VERSION} 的应用 API 如何落在四产品平台中。
      </p>

      <open-callout type='info' label='推荐'>
        推荐 Deno 2.7+。openElement <strong>{OPENELEMENT_VERSION}</strong>{' '}
        使用 Deno tasks、<code>deno.json</code> imports、JSX/VNode 渲染，以及来自
        <code>@openelement/app/vite</code> 的 <code>openElement()</code> Vite facade。
      </open-callout>

      <section class='step'>
        <h2>1. 创建项目</h2>
        <open-code-block>
          <pre><code>{'deno run -A jsr:@openelement/create my-app\ncd my-app'}</code></pre>
        </open-code-block>
        <p>
          脚手架会生成页面路由、示例 island、Vite 配置和常用 Deno tasks。
        </p>
      </section>

      <section class='step'>
        <h2>2. 启动开发服务器</h2>
        <open-code-block>
          <pre><code>deno task dev</code></pre>
        </open-code-block>
        <p>
          开发模式由 Vite 提供模块加载和热更新，SSR/API 行为来自生成的 Hono entry。
        </p>
      </section>

      <section class='step'>
        <h2>3. 构建静态输出</h2>
        <open-code-block>
          <pre><code>deno task build</code></pre>
        </open-code-block>
        <p>
          构建会扫描 routes 和 islands，生成 SSR wiring，输出 DSD HTML 和 client island chunks，
          最终结果位于 <span class='inline-code'>dist/</span>。
        </p>
      </section>

      <h2>页面写法</h2>
      <open-code-block>
        <pre><code>{`import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: { title: 'Home' },
  render() {
    return <main>Hello openElement</main>;
  },
});`}</code></pre>
      </open-code-block>

      <h2>交互写法</h2>
      <open-code-block>
        <pre><code>{`import { defineIsland } from '@openelement/app';
import { signal } from '@openelement/element';

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  ),
);`}</code></pre>
      </open-code-block>

      <div class='alert alert-info'>
        <p>
          v1.0 的目标是稳定 Elements、UI、Framework 和 Protocols 四个产品面。
          {OPENELEMENT_VERSION} 继续验证结构化、AI 可读的 Application API。
        </p>
      </div>

      <div class='nav-row'>
        <a href='/zh/guide/core-concepts' class='btn btn-ghost'>核心概念 &rarr;</a>
      </div>
    </>
  );
}
customElements.define('page-getting-started', GettingStartedPage);
export default GettingStartedPage;
export const tagName = 'page-getting-started';
