export const meta = { section: 'Core', label: 'Core Concepts', order: 2 };

import { OpenElement } from '@openelement/element';
import { openPropsTokenSheet } from '@openelement/ui';
import { pageStylesSheet } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';
import '@openelement/ui/open-callout';
import '@openelement/ui/open-button';

export class CoreConceptsPage extends OpenElement {
  static override styles = [openPropsTokenSheet, pageStylesSheet];

  override render() {
    return (
      <div class='container'>
        {this._getLocale('en') === 'zh' ? <CoreConceptsZh /> : <CoreConceptsEn />}
      </div>
    );
  }
}

function CoreConceptsEn() {
  return (
    <>
      <h1>Core Concepts</h1>
      <p class='subtitle'>
        openElement has three layers: JSX-first application APIs, a DSD renderer, and progressive
        island upgrades.
      </p>

      <h2>Application API</h2>
      <p>
        App authors start from{' '}
        <code>@openelement/app</code>. The API produces Web Platform output without making every
        page author extend a base class.
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

      <h2>Pages With Data</h2>
      <p>
        The object form keeps route data, document metadata, and rendering intent together. Layout
        composition stays in app shell and renderer configuration.
      </p>
      <open-code-block>
        <pre><code>{`import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/posts/[slug]', params: ['slug'] },
  head: {
    title: 'Post',
    description: 'A static post page',
  },
  renderIntent: { mode: 'static' },
  async load({ params }) {
    return { slug: params.slug };
  },
  render({ data }) {
    return <article>{data.slug}</article>;
  },
});`}</code></pre>
      </open-code-block>

      <h2>Elements And Islands</h2>
      <p>
        Use <code>defineElement()</code> for reusable DSD components and
        <code>defineIsland()</code> for browser-upgraded interactivity.
      </p>
      <open-code-block>
        <pre><code>{`import { defineElement, defineIsland } from '@openelement/app';
import { signal } from '@openelement/element';

export const Badge = defineElement('app-badge', ({ label }) => {
  return <span part='badge'>{label}</span>;
});

const count = signal(0);

export default defineIsland('my-counter', () => (
  <button onClick={() => count.value++}>
    Count: {count.value}
  </button>
));`}</code></pre>
      </open-code-block>

      <h2>Runtime Kernel</h2>
      <p>
        <code>OpenElement</code>, <code>renderDsd()</code>, JSX runtime helpers, signals, and{' '}
        <code>StyleSheet</code>{' '}
        remain the runtime primitives. They are still public, but they are no longer the first thing
        a page author needs to write.
      </p>

      <h2>Renderer Model</h2>
      <p>There is one renderer model:</p>
      <open-code-block>
        <pre><code>{`JSX -> VNode -> RenderNode -> DSD HTML or DOM`}</code></pre>
      </open-code-block>

      <open-callout type='info' label='Why this shape?'>
        Next.js, Nuxt, SvelteKit, and Astro all separate page authoring from framework
        configuration. openElement follows that convention while keeping Web Components and
        Declarative Shadow DOM as the output model.
      </open-callout>

      <div class='nav-row'>
        <open-button href='/guide/getting-started'>&larr; Getting Started</open-button>
        <open-button href='/guide/routing-and-data'>Routing &amp; Data &rarr;</open-button>
      </div>
    </>
  );
}

function CoreConceptsZh() {
  return (
    <>
      <h1>核心概念</h1>
      <p class='subtitle'>
        openElement 有三层：JSX-first 应用 API、DSD renderer、渐进式 island 升级。
      </p>

      <h2>应用 API</h2>
      <p>
        应用作者从 <code>@openelement/app</code>{' '}
        开始。框架负责把页面函数接入 Web Components 和 DSD 输出。
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

      <h2>带数据的页面</h2>
      <open-code-block>
        <pre><code>{`import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/posts/[slug]', params: ['slug'] },
  head: { title: 'Post' },
  async load({ params }) {
    return { slug: params.slug };
  },
  render({ data }) {
    return <article>{data.slug}</article>;
  },
});`}</code></pre>
      </open-code-block>

      <h2>组件和 islands</h2>
      <open-code-block>
        <pre><code>{`import { defineElement, defineIsland } from '@openelement/app';
import { signal } from '@openelement/element';

defineElement('app-badge', ({ label }) => {
  return <span part='badge'>{label}</span>;
});

const count = signal(0);

export default defineIsland('my-counter', () => (
  <button onClick={() => count.value++}>
    Count: {count.value}
  </button>
));`}</code></pre>
      </open-code-block>

      <h2>Runtime kernel</h2>
      <p>
        <code>OpenElement</code>、<code>renderDsd()</code>、JSX runtime、signals 和
        <code>StyleSheet</code> 仍然是底层公开 primitive，但不再是页面作者的第一层 API。
      </p>

      <div class='nav-row'>
        <open-button href='/zh/guide/getting-started'>&larr; 快速开始</open-button>
        <open-button href='/zh/guide/routing-and-data'>路由与数据 &rarr;</open-button>
      </div>
    </>
  );
}

customElements.define('page-core-concepts', CoreConceptsPage);
export default CoreConceptsPage;
export const tagName = 'page-core-concepts';
