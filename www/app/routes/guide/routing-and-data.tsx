export const meta = { section: 'Core', label: 'Routing & Data', order: 3 };

import { OpenElement } from '@openelement/element';
import { linearTokenSheet } from '@openelement/ui';
import { pageStylesSheet } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';
import '@openelement/ui/open-callout';
import '@openelement/ui/open-button-linear';

export class RoutingDataPage extends OpenElement {
  static override styles = [linearTokenSheet, pageStylesSheet];

  override render() {
    return (
      <div class='container'>
        {this._getLocale('en') === 'zh' ? <RoutingDataZh /> : <RoutingDataEn />}
      </div>
    );
  }
}

function RoutingDataEn() {
  return (
    <>
      <h1>Routing &amp; Data</h1>
      <p class='subtitle'>
        openElement uses filesystem routing. A route module exports a page definition, and the
        framework wires params, data, metadata, and app shell rendering.
      </p>

      <h2>Filesystem Routing</h2>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>app/routes/index.tsx</code>
            </td>
            <td>
              <code>/</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>app/routes/about.tsx</code>
            </td>
            <td>
              <code>/about</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>app/routes/docs/index.tsx</code>
            </td>
            <td>
              <code>/docs</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>app/routes/posts/[slug].tsx</code>
            </td>
            <td>
              <code>/posts/:slug</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Basic Page</h2>
      <open-code-block>
        <pre><code>{`import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/about' },
  head: { title: 'About' },
  render() {
    return <main>About</main>;
  },
});`}</code></pre>
      </open-code-block>

      <h2>Dynamic Params</h2>
      <p>
        Bracket segments become route params. The flat params are also passed as props for simple
        cases.
      </p>
      <open-code-block>
        <pre><code>{`import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/posts/[slug]', params: ['slug'] },
  render({ params }) {
    return <article>Post: {params.slug}</article>;
  },
});`}</code></pre>
      </open-code-block>

      <h2>Load Data</h2>
      <p>
        Use <code>load()</code>{' '}
        when data should be fetched by the framework before rendering. This is the openElement
        equivalent of the route data functions that mainstream file-route frameworks expose.
      </p>
      <open-code-block>
        <pre><code>{`import { definePage } from '@openelement/app';

type Post = { title: string; body: string };

export default definePage<Post>({
  route: { path: '/posts/[slug]', params: ['slug'] },
  head: { title: 'Post' },
  async load({ params }) {
    return fetch(\`https://api.example.com/posts/\${params.slug}\`)
      .then((r) => r.json());
  },
  render({ data }) {
    return (
      <article>
        <h1>{data.title}</h1>
        <p>{data.body}</p>
      </article>
    );
  },
});`}</code></pre>
      </open-code-block>

      <h2>Page Metadata</h2>
      <p>
        The same descriptor can set document title, description, route intent, and revalidation
        intent. Build adapters read it as structured metadata.
      </p>
      <open-code-block>
        <pre><code>{`export default definePage({
  route: { path: '/field-notes' },
  head: {
    title: 'Field Notes',
    description: 'Posts about Web Components',
    meta: [{ property: 'og:type', content: 'article' }],
  },
  renderIntent: { mode: 'static', revalidate: 300 },
  render() {
    return <main>...</main>;
  },
});`}</code></pre>
      </open-code-block>

      <h2>Special Files</h2>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>_renderer.ts</code>
            </td>
            <td>Wraps route VNodes for layout composition.</td>
          </tr>
          <tr>
            <td>
              <code>_middleware.ts</code>
            </td>
            <td>Mounts Hono middleware for headers, auth, CSP, and request guards.</td>
          </tr>
          <tr>
            <td>
              <code>api/*.ts</code>
            </td>
            <td>Defines Hono API handlers inside the route tree.</td>
          </tr>
        </tbody>
      </table>

      <open-callout type='info' label='Content System'>
        For Markdown, MDX, blog indexes, navigation, and sitemap generation, use the{' '}
        <code>@openelement/content</code> plugin from the Vite config.
      </open-callout>

      <div class='nav-row'>
        <open-button-linear variant='secondary' href='/guide/core-concepts'>&larr; Core Concepts</open-button-linear>
        <open-button-linear variant='secondary' href='/guide/islands-and-ssr'>Islands &amp; SSR &rarr;</open-button-linear>
      </div>
    </>
  );
}

function RoutingDataZh() {
  return (
    <>
      <h1>路由与数据</h1>
      <p class='subtitle'>
        openElement 使用文件系统路由。路由模块导出页面定义，框架负责接入 params、data、metadata 和
        app shell 渲染。
      </p>

      <h2>文件系统路由</h2>
      <table>
        <thead>
          <tr>
            <th>文件</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>app/routes/index.tsx</code>
            </td>
            <td>
              <code>/</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>app/routes/about.tsx</code>
            </td>
            <td>
              <code>/about</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>app/routes/posts/[slug].tsx</code>
            </td>
            <td>
              <code>/posts/:slug</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>基础页面</h2>
      <open-code-block>
        <pre><code>{`import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/about' },
  head: { title: 'About' },
  render() {
    return <main>About</main>;
  },
});`}</code></pre>
      </open-code-block>

      <h2>动态参数</h2>
      <open-code-block>
        <pre><code>{`import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/posts/[slug]', params: ['slug'] },
  render({ params }) {
    return <article>Post: {params.slug}</article>;
  },
});`}</code></pre>
      </open-code-block>

      <h2>加载数据</h2>
      <open-code-block>
        <pre><code>{`import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/posts/[slug]', params: ['slug'] },
  head: { title: 'Post' },
  async load({ params }) {
    return fetch(\`https://api.example.com/posts/\${params.slug}\`)
      .then((r) => r.json());
  },
  render({ data }) {
    return <article>{data.title}</article>;
  },
});`}</code></pre>
      </open-code-block>

      <h2>页面 metadata</h2>
      <open-code-block>
        <pre><code>{`export default definePage({
  route: { path: '/field-notes' },
  head: {
    title: 'Field Notes',
    description: 'Posts about Web Components',
    meta: [{ property: 'og:type', content: 'article' }],
  },
  renderIntent: { mode: 'static', revalidate: 300 },
  render() {
    return <main>...</main>;
  },
});`}</code></pre>
      </open-code-block>

      <div class='nav-row'>
        <open-button-linear variant='secondary' href='/zh/guide/core-concepts'>&larr; 核心概念</open-button-linear>
        <open-button-linear variant='secondary' href='/zh/guide/islands-and-ssr'>Islands 与 SSR &rarr;</open-button-linear>
      </div>
    </>
  );
}

customElements.define('page-routing-data', RoutingDataPage);
export default RoutingDataPage;
export const tagName = 'page-routing-data';
