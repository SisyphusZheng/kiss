import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { defineApp, definePage, type RouteConfig } from '../src/index.ts';
import { applyPageHostData, type PageHostElement } from '../src/internal/page-host-data.ts';

Deno.test('SPA interface accepts custom-element routes', () => {
  const routes: RouteConfig[] = [{ path: '/', tagName: 'app-home' }];
  const app = defineApp({ mode: 'spa', routes });
  assertEquals(app.router, null);
  app.dispose();
});

Deno.test('SPA route contract rejects legacy component callbacks at type level', () => {
  const route: RouteConfig = { path: '/settings', tagName: 'app-settings' };
  assertEquals(Object.hasOwn(route, 'component'), false);
});

Deno.test('SPA page-host adapter supplies the canonical definePage context', () => {
  let received: unknown;
  const Page = definePage<{ title: string }, { slug: string }>({
    render(context) {
      received = context;
      return null;
    },
  });
  const host = Object.create(Page.prototype) as InstanceType<typeof Page> & PageHostElement;
  const request = new Request('https://example.test/articles/hello');
  applyPageHostData(host, {
    data: { title: 'Hello' },
    actionData: { saved: true },
    params: { slug: 'hello' },
    request,
    route: { path: '/articles/:slug' },
    meta: { section: 'guide' },
  });

  host.render();

  assertEquals(received, {
    data: { title: 'Hello' },
    params: { slug: 'hello' },
    request,
    route: { path: '/articles/:slug' },
    meta: { section: 'guide' },
    props: { data: { title: 'Hello' } },
  });
});

Deno.test('defineApp mounts loader data and route context into a real definePage host', async () => {
  const descriptors = {
    document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
    location: Object.getOwnPropertyDescriptor(globalThis, 'location'),
    history: Object.getOwnPropertyDescriptor(globalThis, 'history'),
  };
  const originalAdd = globalThis.addEventListener;
  const originalRemove = globalThis.removeEventListener;
  let received: unknown;
  const Page = definePage<{ title: string }, { slug: string }>({
    render(context) {
      received = context;
      return null;
    },
  });
  const root = {
    innerHTML: '',
    addEventListener() {},
    removeEventListener() {},
    appendChild(host: InstanceType<typeof Page>) {
      host.render();
      return host;
    },
  };
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      querySelector: () => root,
      createElement: () => Object.create(Page.prototype),
    },
  });
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: {
      protocol: 'https:',
      pathname: '/articles/hello',
      search: '?preview=yes',
      hash: '',
      href: 'https://example.test/articles/hello?preview=yes',
    },
  });
  Object.defineProperty(globalThis, 'history', {
    configurable: true,
    value: { pushState() {}, replaceState() {} },
  });
  globalThis.addEventListener = (() => {}) as typeof globalThis.addEventListener;
  globalThis.removeEventListener = (() => {}) as typeof globalThis.removeEventListener;

  const app = defineApp({
    mode: 'spa',
    routerMode: 'history',
    routes: [{
      path: '/articles/:slug',
      tagName: 'article-page',
      loader: ({ params }) => Promise.resolve({ title: `${params.slug}:${params.preview}` }),
    }],
  });
  try {
    app.mount('#app');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const context = received as {
      data: unknown;
      params: unknown;
      request: Request;
      route: unknown;
    };
    assertEquals(context.data, { title: 'hello:yes' });
    assertEquals(context.params, { slug: 'hello', preview: 'yes' });
    assertEquals(context.request.url, 'https://example.test/articles/hello?preview=yes');
    assertEquals(context.route, { path: '/articles/:slug' });
  } finally {
    app.dispose();
    globalThis.addEventListener = originalAdd;
    globalThis.removeEventListener = originalRemove;
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as Record<string, unknown>)[key];
    }
  }
});
