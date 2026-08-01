import { assertEquals, assertStringIncludes, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { defineApp, definePage, notFound, redirect } from '../src/index.ts';
import { assertValidTagName } from '@openelement/element';
import type { RouteConfig } from '../src/internal/router/client-router.ts';
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

Deno.test('defineApp rejects missing targets and safely remounts and redisposes', () => {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const originalHistory = Object.getOwnPropertyDescriptor(globalThis, 'history');
  const originalAdd = globalThis.addEventListener;
  const originalRemove = globalThis.removeEventListener;
  const root = { innerHTML: '', addEventListener() {}, removeEventListener() {}, appendChild() {} };
  let found = false;
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { querySelector: () => found ? root : null, createElement: () => ({}) },
  });
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: {
      protocol: 'https:',
      pathname: '/',
      search: '',
      hash: '',
      href: 'https://example.test/',
    },
  });
  Object.defineProperty(globalThis, 'history', {
    configurable: true,
    value: { pushState() {}, replaceState() {} },
  });
  globalThis.addEventListener = (() => {}) as typeof globalThis.addEventListener;
  globalThis.removeEventListener = (() => {}) as typeof globalThis.removeEventListener;
  const app = defineApp({ mode: 'spa', routes: [] });
  try {
    let message = '';
    try {
      app.mount('#missing');
    } catch (error) {
      message = String(error);
    }
    assertStringIncludes(message, 'Mount target not found');
    found = true;
    app.mount('#app');
    app.mount('#app');
    app.dispose();
    app.dispose();
    assertEquals(app.router, null);
  } finally {
    app.dispose();
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else delete (globalThis as Record<string, unknown>).document;
    if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation);
    else delete (globalThis as Record<string, unknown>).location;
    if (originalHistory) Object.defineProperty(globalThis, 'history', originalHistory);
    else delete (globalThis as Record<string, unknown>).history;
    globalThis.addEventListener = originalAdd;
    globalThis.removeEventListener = originalRemove;
  }
});

Deno.test('defineApp action delegation handles shadow paths and action failures without crashing', async () => {
  const descriptors = {
    document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
    location: Object.getOwnPropertyDescriptor(globalThis, 'location'),
    history: Object.getOwnPropertyDescriptor(globalThis, 'history'),
  };
  const originalAdd = globalThis.addEventListener;
  const originalRemove = globalThis.removeEventListener;
  let submit: ((event: Event) => void) | undefined;
  let renders = 0;
  const requests: Request[] = [];
  const actionResults: unknown[] = [];
  const root = {
    innerHTML: '',
    addEventListener(type: string, listener: (event: Event) => void) {
      if (type === 'submit') submit = listener;
    },
    removeEventListener() {},
    appendChild(host: PageHostElement) {
      renders++;
      if (host.__openElementRequest) requests.push(host.__openElementRequest);
      actionResults.push(host.__openElementActionData);
    },
  };
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { querySelector: () => root, createElement: () => ({}) },
  });
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: {
      protocol: 'https:',
      pathname: '/',
      search: '',
      hash: '',
      href: 'https://example.test/',
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
      path: '/',
      tagName: 'home-page',
      loader: () => Promise.resolve({ renders }),
      action: () => Promise.reject(new Error('save failed')),
    }],
  });
  try {
    app.mount('#app');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const form = { tagName: 'FORM' };
    let prevented = false;
    submit?.({
      target: { tagName: 'OPEN-BUTTON' },
      composedPath: () => [{ tagName: 'SPAN' }, form],
      preventDefault: () => {
        prevented = true;
      },
    } as unknown as Event);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assertEquals(prevented, true);
    assertEquals(renders, 2);
    assertEquals(actionResults[1], { error: 'Action failed' });
    assertEquals(requests[0], requests[1]);

    // Non-form submissions and routes without an action are ignored.
    submit?.({ target: {}, composedPath: () => [], preventDefault() {} } as unknown as Event);
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

Deno.test('defineApp routes loader failures to the page error channel, not the data channel (#676)', async () => {
  const descriptors = {
    document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
    location: Object.getOwnPropertyDescriptor(globalThis, 'location'),
    history: Object.getOwnPropertyDescriptor(globalThis, 'history'),
  };
  const originalAdd = globalThis.addEventListener;
  const originalRemove = globalThis.removeEventListener;
  let rendered: unknown;
  let errored: unknown;
  const Page = definePage<{ title: string }, { slug: string }>({
    render(context) {
      rendered = context;
      return null;
    },
    error(context) {
      errored = context;
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
      search: '',
      hash: '',
      href: 'https://example.test/articles/hello',
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
      loader: () => Promise.reject(new Error('fetch failed')),
    }],
  });
  try {
    app.mount('#app');
    await new Promise((resolve) => setTimeout(resolve, 0));
    // The error definition renders with the stable failure shape...
    const context = errored as { data: unknown; error: unknown; params: unknown };
    assertEquals(context.error, { error: 'Loader failed' });
    // ...and the data channel stays empty instead of carrying a fake shape.
    assertEquals(context.data, undefined);
    assertEquals(context.params, { slug: 'hello' });
    assertEquals(rendered, undefined);
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

Deno.test('assertValidTagName accepts valid tag names and rejects invalid ones (#642)', () => {
  assertValidTagName('app-home');
  assertValidTagName('a1-b2');
  assertThrows(() => assertValidTagName('x'), Error);
  assertThrows(() => assertValidTagName('Invalid'), Error);
  assertThrows(() => assertValidTagName('UPPER'), Error);
  assertThrows(() => assertValidTagName('bad_name'), Error);
  assertThrows(() => assertValidTagName(''), Error);
  assertThrows(() => assertValidTagName('with space'), Error);
});

Deno.test('unregistered tagName warns and renders nothing instead of an inert host (#642)', async () => {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const originalHistory = Object.getOwnPropertyDescriptor(globalThis, 'history');
  const originalAdd = globalThis.addEventListener;
  const originalRemove = globalThis.removeEventListener;
  const originalCustomElements = Object.getOwnPropertyDescriptor(globalThis, 'customElements');

  const root = { innerHTML: '', addEventListener() {}, removeEventListener() {}, appendChild() {} };
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { querySelector: () => root, createElement: () => ({}) },
  });
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: {
      protocol: 'https:',
      pathname: '/',
      search: '',
      hash: '',
      href: 'https://example.test/',
    },
  });
  Object.defineProperty(globalThis, 'history', {
    configurable: true,
    value: { pushState() {}, replaceState() {} },
  });
  globalThis.addEventListener = (() => {}) as typeof globalThis.addEventListener;
  globalThis.removeEventListener = (() => {}) as typeof globalThis.removeEventListener;
  Object.defineProperty(globalThis, 'customElements', {
    configurable: true,
    value: { get: () => undefined },
  });

  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => warnings.push(args.join(' '));

  const app = defineApp({ mode: 'spa', routes: [{ path: '/', tagName: 'home-page' }] });
  try {
    app.mount('#app');
    await new Promise((resolve) => setTimeout(resolve, 0));
    assertStringIncludes(warnings.join('\n'), 'unregistered tagName: home-page');
    // Empty render: root was cleared and nothing appended.
    assertEquals(root.innerHTML, '');
  } finally {
    app.dispose();
    console.warn = originalWarn;
    globalThis.addEventListener = originalAdd;
    globalThis.removeEventListener = originalRemove;
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else delete (globalThis as Record<string, unknown>).document;
    if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation);
    else delete (globalThis as Record<string, unknown>).location;
    if (originalHistory) Object.defineProperty(globalThis, 'history', originalHistory);
    else delete (globalThis as Record<string, unknown>).history;
    if (originalCustomElements) {
      Object.defineProperty(globalThis, 'customElements', originalCustomElements);
    } else delete (globalThis as Record<string, unknown>).customElements;
  }
});

// ─── #731: redirect()/notFound() in the SPA chain ──────────────

/**
 * Stub the browser environment for SPA navigation tests. Unlike the no-op
 * history stubs above, this one applies pushState/replaceState URLs to the
 * fake location so the router actually lands on redirect targets.
 */
function stubNavigableEnvironment(root: unknown, initialPath: string) {
  const descriptors = {
    document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
    location: Object.getOwnPropertyDescriptor(globalThis, 'location'),
    history: Object.getOwnPropertyDescriptor(globalThis, 'history'),
  };
  const originalAdd = globalThis.addEventListener;
  const originalRemove = globalThis.removeEventListener;
  const initial = new URL(initialPath, 'https://example.test');
  const fakeLocation = {
    protocol: 'https:',
    pathname: initial.pathname,
    search: initial.search,
    hash: '',
    href: initial.href,
  };
  const pushed: string[] = [];
  const applyUrl = (url: string | URL | null | undefined) => {
    if (url == null) return;
    const next = new URL(String(url), fakeLocation.href);
    fakeLocation.pathname = next.pathname;
    fakeLocation.search = next.search;
    fakeLocation.hash = next.hash;
    fakeLocation.href = next.href;
  };
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { querySelector: () => root, createElement: () => ({}) },
  });
  Object.defineProperty(globalThis, 'location', { configurable: true, value: fakeLocation });
  Object.defineProperty(globalThis, 'history', {
    configurable: true,
    value: {
      pushState(_state: unknown, _unused: unknown, url?: string | URL | null) {
        pushed.push(String(url));
        applyUrl(url);
      },
      replaceState(_state: unknown, _unused: unknown, url?: string | URL | null) {
        applyUrl(url);
      },
    },
  });
  globalThis.addEventListener = (() => {}) as typeof globalThis.addEventListener;
  globalThis.removeEventListener = (() => {}) as typeof globalThis.removeEventListener;
  return {
    location: fakeLocation,
    pushed,
    restore() {
      globalThis.addEventListener = originalAdd;
      globalThis.removeEventListener = originalRemove;
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete (globalThis as Record<string, unknown>)[key];
      }
    },
  };
}

Deno.test('defineApp navigates when the SPA loader throws redirect() (#731)', async () => {
  const hosts: PageHostElement[] = [];
  const root = {
    innerHTML: '',
    addEventListener() {},
    removeEventListener() {},
    appendChild(host: PageHostElement) {
      hosts.push(host);
      return host;
    },
  };
  const env = stubNavigableEnvironment(root, '/');
  const app = defineApp({
    mode: 'spa',
    routerMode: 'history',
    routes: [
      {
        path: '/',
        tagName: 'home-page',
        loader: () => {
          redirect('/login');
        },
      },
      {
        path: '/login',
        tagName: 'login-page',
        loader: () => Promise.resolve({ page: 'login' }),
      },
    ],
  });
  try {
    app.mount('#app');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    // The redirect navigated instead of becoming page data...
    assertEquals(env.pushed, ['/login']);
    assertEquals(app.router?.currentPath, '/login');
    // ...and the destination route rendered with its own loader data.
    assertEquals(hosts.length, 1);
    assertEquals(hosts[0].data, { page: 'login' });
    assertEquals(hosts[0].__openElementError, undefined);
  } finally {
    app.dispose();
    env.restore();
  }
});

Deno.test('defineApp keeps current page data when a guard vetoes the loader redirect (#802)', async () => {
  const hosts: PageHostElement[] = [];
  const root = {
    innerHTML: '',
    addEventListener() {},
    removeEventListener() {},
    appendChild(host: PageHostElement) {
      hosts.push(host);
      return host;
    },
  };
  const env = stubNavigableEnvironment(root, '/');
  const app = defineApp({
    mode: 'spa',
    routerMode: 'history',
    routes: [
      {
        path: '/',
        tagName: 'home-page',
        loader: () => Promise.resolve({ page: 'home' }),
      },
      {
        path: '/away',
        tagName: 'away-page',
        loader: () => {
          redirect('/login');
        },
      },
      {
        path: '/login',
        tagName: 'login-page',
        guard: () => Promise.resolve(false),
        loader: () => Promise.resolve({ page: 'login' }),
      },
    ],
  });
  try {
    app.mount('#app');
    await new Promise((resolve) => setTimeout(resolve, 0));
    assertEquals(hosts.length, 1);
    assertEquals(hosts[0].data, { page: 'home' });

    await app.router?.navigate('/away');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    // The guard vetoed the redirect target, so the navigation never
    // committed: no re-render with `data: undefined` — the current page
    // keeps its loader data (same as the action redirect path).
    assertEquals(env.pushed, ['/away']);
    assertEquals(app.router?.currentPath, '/away');
    assertEquals(hosts.length, 1);
    assertEquals(hosts[0].data, { page: 'home' });
  } finally {
    app.dispose();
    env.restore();
  }
});

Deno.test('defineApp navigates when the SPA action throws redirect() (#731)', async () => {
  let submit: ((event: Event) => void) | undefined;
  const hosts: PageHostElement[] = [];
  const root = {
    innerHTML: '',
    addEventListener(type: string, listener: (event: Event) => void) {
      if (type === 'submit') submit = listener;
    },
    removeEventListener() {},
    appendChild(host: PageHostElement) {
      hosts.push(host);
      return host;
    },
  };
  const env = stubNavigableEnvironment(root, '/');
  const app = defineApp({
    mode: 'spa',
    routerMode: 'history',
    routes: [
      {
        path: '/',
        tagName: 'home-page',
        loader: () => Promise.resolve({ page: 'home' }),
        action: () => {
          redirect('/done');
        },
      },
      {
        path: '/done',
        tagName: 'done-page',
        loader: () => Promise.resolve({ page: 'done' }),
      },
    ],
  });
  try {
    app.mount('#app');
    await new Promise((resolve) => setTimeout(resolve, 0));
    submit?.({
      target: { tagName: 'FORM' },
      composedPath: () => [],
      preventDefault() {},
    } as unknown as Event);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    // PRG: the redirect navigated to the destination route...
    assertEquals(env.pushed, ['/done']);
    assertEquals(app.router?.currentPath, '/done');
    // ...and no host ever received a normalized action failure.
    assertEquals(hosts.map((host) => host.data), [{ page: 'home' }, { page: 'done' }]);
    assertEquals(hosts.every((host) => host.__openElementActionData === undefined), true);
  } finally {
    app.dispose();
    env.restore();
  }
});

Deno.test('defineApp routes loader notFound() to the page error channel (#731)', async () => {
  let rendered: unknown;
  let errored: unknown;
  const Page = definePage<{ title: string }, { slug: string }>({
    render(context) {
      rendered = context;
      return null;
    },
    error(context) {
      errored = context;
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
  const env = stubNavigableEnvironment(root, '/articles/hello');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      querySelector: () => root,
      createElement: () => Object.create(Page.prototype),
    },
  });
  const app = defineApp({
    mode: 'spa',
    routerMode: 'history',
    routes: [{
      path: '/articles/:slug',
      tagName: 'article-page',
      loader: () => {
        notFound('no such article');
      },
    }],
  });
  try {
    app.mount('#app');
    await new Promise((resolve) => setTimeout(resolve, 0));
    // The original 404 error rides the error channel (never normalized, never
    // a navigation) so the error definition can read its status/message.
    const context = errored as { data: unknown; error: unknown; params: unknown };
    assertEquals((context.error as Error).name, 'OpenElementNotFound');
    assertEquals((context.error as Error).message, 'no such article');
    assertEquals((context.error as { status: number }).status, 404);
    assertEquals(context.data, undefined);
    assertEquals(context.params, { slug: 'hello' });
    assertEquals(rendered, undefined);
    assertEquals(env.pushed, []);
  } finally {
    app.dispose();
    env.restore();
  }
});

Deno.test('defineApp routes action notFound() to the page error channel (#731)', async () => {
  let submit: ((event: Event) => void) | undefined;
  let rendered: unknown;
  let errored: unknown;
  const Page = definePage<{ page: string }>({
    render(context) {
      rendered = context;
      return null;
    },
    error(context) {
      errored = context;
      return null;
    },
  });
  const root = {
    innerHTML: '',
    addEventListener(type: string, listener: (event: Event) => void) {
      if (type === 'submit') submit = listener;
    },
    removeEventListener() {},
    appendChild(host: InstanceType<typeof Page>) {
      host.render();
      return host;
    },
  };
  const env = stubNavigableEnvironment(root, '/');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      querySelector: () => root,
      createElement: () => Object.create(Page.prototype),
    },
  });
  const app = defineApp({
    mode: 'spa',
    routerMode: 'history',
    routes: [{
      path: '/',
      tagName: 'home-page',
      loader: () => Promise.resolve({ page: 'home' }),
      action: () => {
        notFound('cannot save');
      },
    }],
  });
  try {
    app.mount('#app');
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Initial render used the data channel, not the error channel.
    assertEquals((rendered as { data: unknown }).data, { page: 'home' });
    assertEquals(errored, undefined);
    submit?.({
      target: { tagName: 'FORM' },
      composedPath: () => [],
      preventDefault() {},
    } as unknown as Event);
    await new Promise((resolve) => setTimeout(resolve, 0));
    // The action's notFound renders the error channel in place — no
    // navigation, no normalized action failure, loader data preserved.
    const context = errored as { data: unknown; error: unknown };
    assertEquals((context.error as Error).name, 'OpenElementNotFound');
    assertEquals((context.error as Error).message, 'cannot save');
    assertEquals((context.error as { status: number }).status, 404);
    assertEquals(context.data, { page: 'home' });
    assertEquals(env.pushed, []);
    assertEquals(app.router?.currentPath, '/');
  } finally {
    app.dispose();
    env.restore();
  }
});
