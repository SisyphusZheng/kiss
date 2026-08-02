import { assertEquals, assertRejects } from '@std/assert';
import {
  compileRouteMatcher,
  createRouter,
  matchRoute,
  matchRouteLinearForTests,
  type RouteConfig,
} from '../src/internal/router/client-router.ts';

const routes: RouteConfig[] = [{ path: '/items/:id', tagName: 'item-page' }];

Deno.test('client router decodes path parameters and gives path values precedence', () => {
  const match = matchRoute('/items/hello%20world', '?id=query&view=full', routes);
  assertEquals(match?.params.id, 'hello world');
  assertEquals(match?.params.view, 'full');
});

Deno.test('client router decodes query components exactly once', () => {
  const cases = [
    ['?value=%25', '%'],
    ['?value=%2525', '%25'],
    ['?value=hello+world', 'hello world'],
    ['?value=%2B', '+'],
  ] as const;
  for (const [search, expected] of cases) {
    assertEquals(matchRoute('/items/id', search, routes)?.params.value, expected);
  }
});

Deno.test('client router preserves malformed query escapes without aborting matching', () => {
  const match = matchRoute('/items/id', '?bad=%&also=%2&key%=value%', routes);
  assertEquals(match?.params.bad, '%');
  assertEquals(match?.params.also, '%2');
  assertEquals(match?.params['key%'], 'value%');
});

Deno.test('compiled route matcher is equivalent to the declaration-order matcher', () => {
  const fixtures: RouteConfig[] = [
    { path: '/', tagName: 'home-page' },
    { path: '/docs/new', tagName: 'new-page' },
    { path: '/docs/:slug', tagName: 'doc-page' },
    { path: '/:locale?/guide/:page?', tagName: 'guide-page' },
    { path: '/assets/:path*', tagName: 'asset-page' },
    { path: '*', tagName: 'fallback-page' },
  ];
  const cases = [
    ['/', ''],
    ['/docs/new', '?preview=yes'],
    ['/docs/start', ''],
    ['/guide', ''],
    ['/zh/guide/api', ''],
    ['/assets/icons/ui/add.svg', ''],
    ['/unknown/path', ''],
  ] as const;
  const compiled = compileRouteMatcher(fixtures);

  for (const [pathname, search] of cases) {
    assertEquals(
      compiled.match(pathname, search),
      matchRouteLinearForTests(pathname, search, fixtures),
    );
  }
});

Deno.test('compiled matcher narrows a large static route table through the trie', () => {
  const largeRoutes = Array.from({ length: 5_000 }, (_, index) => ({
    path: `/catalog/${index}/details`,
    tagName: `catalog-${index}`,
  }));
  const compiled = compileRouteMatcher(largeRoutes);

  assertEquals(compiled.match('/catalog/4999/details', '')?.route.tagName, 'catalog-4999');
  assertEquals(compiled.candidateCount('/catalog/4999/details'), 1);
});

Deno.test('compiled matcher preserves declaration priority across dynamic and wildcard routes', () => {
  const dynamicFirst: RouteConfig[] = [
    { path: '/docs/:slug', tagName: 'dynamic-page' },
    { path: '/docs/new', tagName: 'static-page' },
  ];
  const wildcardFirst: RouteConfig[] = [
    { path: '/assets/:path*', tagName: 'wildcard-page' },
    { path: '/assets/logo.svg', tagName: 'logo-page' },
  ];

  assertEquals(matchRoute('/docs/new', '', dynamicFirst)?.route.tagName, 'dynamic-page');
  assertEquals(matchRoute('/assets/logo.svg', '', wildcardFirst)?.route.tagName, 'wildcard-page');
});

Deno.test('client router matches Hono-style `:param{.+}` catch-all patterns (#812)', () => {
  const catchAll: RouteConfig[] = [{ path: '/products/:slug{.+}', tagName: 'product-page' }];

  // Multi-segment paths match and capture the remainder under the plain param name...
  const match = matchRoute('/products/a/b', '', catchAll);
  assertEquals(match?.route.tagName, 'product-page');
  assertEquals(match?.params.slug, 'a/b');
  // ...single segments too, without leaking the `{.+}` suffix into the name.
  assertEquals(matchRoute('/products/a', '', catchAll)?.params.slug, 'a');
  // `{.+}` requires at least one segment.
  assertEquals(matchRoute('/products', '', catchAll), null);
  // The declaration-order oracle agrees with the compiled matcher.
  assertEquals(
    compileRouteMatcher(catchAll).match('/products/a/b', ''),
    matchRouteLinearForTests('/products/a/b', '', catchAll),
  );
});

Deno.test('client router dispose removes event listeners and double dispose is safe', () => {
  const original = {
    location: Object.getOwnPropertyDescriptor(globalThis, 'location'),
    history: Object.getOwnPropertyDescriptor(globalThis, 'history'),
    add: globalThis.addEventListener,
    remove: globalThis.removeEventListener,
  };
  const added: EventListener[] = [];
  const removed: EventListener[] = [];
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { protocol: 'https:', pathname: '/', search: '', hash: '' },
  });
  Object.defineProperty(globalThis, 'history', {
    configurable: true,
    value: { pushState() {}, replaceState() {} },
  });
  globalThis.addEventListener = ((_type: string, listener: EventListener) => {
    added.push(listener);
  }) as typeof globalThis.addEventListener;
  globalThis.removeEventListener = ((_type: string, listener: EventListener) => {
    removed.push(listener);
  }) as typeof globalThis.removeEventListener;

  try {
    const router = createRouter({ mode: 'history', routes });
    router.dispose();
    router.dispose();
    assertEquals(added.length, 1);
    assertEquals(removed, added);
  } finally {
    globalThis.addEventListener = original.add;
    globalThis.removeEventListener = original.remove;
    if (original.location) Object.defineProperty(globalThis, 'location', original.location);
    else delete (globalThis as Record<string, unknown>).location;
    if (original.history) Object.defineProperty(globalThis, 'history', original.history);
    else delete (globalThis as Record<string, unknown>).history;
  }
});

Deno.test('client router guard redirect limit rejects redirect loops', async () => {
  const loop: RouteConfig[] = [{
    path: '/loop',
    tagName: 'loop-page',
    guard: () => Promise.resolve('/loop'),
  }];
  const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const originalHistory = Object.getOwnPropertyDescriptor(globalThis, 'history');
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { protocol: 'https:', pathname: '/', search: '', hash: '' },
  });
  Object.defineProperty(globalThis, 'history', {
    configurable: true,
    value: { pushState() {}, replaceState() {} },
  });
  const router = createRouter({ mode: 'history', routes: loop });
  try {
    await assertRejects(() => router.navigate('/loop'), Error, 'redirect limit');
  } finally {
    router.dispose();
    if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation);
    else delete (globalThis as Record<string, unknown>).location;
    if (originalHistory) Object.defineProperty(globalThis, 'history', originalHistory);
    else delete (globalThis as Record<string, unknown>).history;
  }
});

// ─── Browser-driven navigation (popstate/hashchange) guard coverage ───

interface FakeBrowser {
  /** URLs passed to pushState/replaceState, in order. */
  readonly applied: string[];
  /** Move the browser itself (back/forward buttons) without pushState. */
  jumpTo(url: string): void;
  /** Dispatch a captured window listener (popstate/hashchange). */
  fire(type: string): void;
  /** The current router-visible path (hash without '#' in hash mode). */
  path(): string;
  restore(): void;
}

function installFakeBrowser(initialUrl: string): FakeBrowser {
  const descriptors = {
    location: Object.getOwnPropertyDescriptor(globalThis, 'location'),
    history: Object.getOwnPropertyDescriptor(globalThis, 'history'),
  };
  const originalAdd = globalThis.addEventListener;
  const originalRemove = globalThis.removeEventListener;
  const state = { pathname: '/', search: '', hash: '' };
  const applyUrl = (url: string): void => {
    if (url.startsWith('#')) {
      state.hash = url;
    } else {
      const u = new URL(url, 'https://router.test');
      state.pathname = u.pathname;
      state.search = u.search;
    }
  };
  applyUrl(initialUrl);
  const applied: string[] = [];
  const listeners = new Map<string, EventListener[]>();
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: {
      protocol: 'https:',
      href: 'https://router.test/',
      get pathname() {
        return state.pathname;
      },
      get search() {
        return state.search;
      },
      get hash() {
        return state.hash;
      },
    },
  });
  Object.defineProperty(globalThis, 'history', {
    configurable: true,
    value: {
      pushState(_state: unknown, _title: string, url: string) {
        applied.push(url);
        applyUrl(url);
      },
      replaceState(_state: unknown, _title: string, url: string) {
        applied.push(url);
        applyUrl(url);
      },
    },
  });
  globalThis.addEventListener = ((type: string, listener: EventListener) => {
    listeners.set(type, [...(listeners.get(type) ?? []), listener]);
  }) as typeof globalThis.addEventListener;
  globalThis.removeEventListener = ((type: string, listener: EventListener) => {
    listeners.set(type, (listeners.get(type) ?? []).filter((entry) => entry !== listener));
  }) as typeof globalThis.removeEventListener;
  return {
    applied,
    jumpTo: applyUrl,
    fire(type: string) {
      for (const listener of listeners.get(type) ?? []) {
        listener(new Event(type));
      }
    },
    path() {
      return state.hash ? state.hash.replace(/^#/, '') : state.pathname + state.search;
    },
    restore() {
      globalThis.addEventListener = originalAdd;
      globalThis.removeEventListener = originalRemove;
      if (descriptors.location) Object.defineProperty(globalThis, 'location', descriptors.location);
      else delete (globalThis as Record<string, unknown>).location;
      if (descriptors.history) Object.defineProperty(globalThis, 'history', descriptors.history);
      else delete (globalThis as Record<string, unknown>).history;
    },
  };
}

/** Guards are async; let the serialized browser-navigation queue drain. */
async function flushBrowserNavigation(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

Deno.test('popstate runs the guard and restores the previous entry when blocked', async () => {
  const browser = installFakeBrowser('/public');
  const events: string[] = [];
  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/public', tagName: 'public-page' },
      {
        path: '/protected',
        tagName: 'protected-page',
        guard: () => {
          events.push('guard');
          return Promise.resolve(false);
        },
      },
    ],
    onChange: () => {
      events.push('change');
    },
  });
  try {
    // The browser itself moved the history pointer onto /protected.
    browser.jumpTo('/protected');
    browser.fire('popstate');
    await flushBrowserNavigation();
    // The guard ran, rejected the navigation, and the previous entry was
    // restored without notifying a change that never committed.
    assertEquals(events, ['guard']);
    assertEquals(router.currentPath, '/public');
    assertEquals(browser.path(), '/public');
    assertEquals(browser.applied, ['/public']);
  } finally {
    router.dispose();
    browser.restore();
  }
});

Deno.test('popstate commits the landed route when the guard allows it', async () => {
  const browser = installFakeBrowser('/public');
  const events: string[] = [];
  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/public', tagName: 'public-page' },
      {
        path: '/protected',
        tagName: 'protected-page',
        guard: () => {
          events.push('guard');
          return Promise.resolve(true);
        },
      },
    ],
    onChange: () => {
      events.push('change');
    },
  });
  try {
    browser.jumpTo('/protected');
    browser.fire('popstate');
    await flushBrowserNavigation();
    assertEquals(events, ['guard', 'change']);
    assertEquals(router.currentPath, '/protected');
    assertEquals(router.currentRoute?.tagName, 'protected-page');
  } finally {
    router.dispose();
    browser.restore();
  }
});

Deno.test('popstate follows a guard redirect with replace semantics', async () => {
  const browser = installFakeBrowser('/public');
  const events: string[] = [];
  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/public', tagName: 'public-page' },
      { path: '/protected', tagName: 'protected-page', guard: () => Promise.resolve('/login') },
      { path: '/login', tagName: 'login-page' },
    ],
    onChange: () => {
      events.push('change');
    },
  });
  try {
    browser.jumpTo('/protected');
    browser.fire('popstate');
    await flushBrowserNavigation();
    assertEquals(events, ['change']);
    assertEquals(router.currentPath, '/login');
    assertEquals(router.currentRoute?.tagName, 'login-page');
    assertEquals(browser.path(), '/login');
  } finally {
    router.dispose();
    browser.restore();
  }
});

Deno.test('popstate follows a multi-hop guard redirect chain', async () => {
  const browser = installFakeBrowser('/public');
  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/public', tagName: 'public-page' },
      { path: '/old', tagName: 'old-page', guard: () => Promise.resolve('/newer') },
      { path: '/newer', tagName: 'newer-page', guard: () => Promise.resolve('/newest') },
      { path: '/newest', tagName: 'newest-page' },
    ],
  });
  try {
    browser.jumpTo('/old');
    browser.fire('popstate');
    await flushBrowserNavigation();
    assertEquals(router.currentPath, '/newest');
    assertEquals(router.currentRoute?.tagName, 'newest-page');
    assertEquals(browser.path(), '/newest');
  } finally {
    router.dispose();
    browser.restore();
  }
});

Deno.test('popstate restores the source entry when a guard redirect target is blocked', async () => {
  const browser = installFakeBrowser('/public');
  const events: string[] = [];
  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/public', tagName: 'public-page' },
      { path: '/old', tagName: 'old-page', guard: () => Promise.resolve('/protected') },
      {
        path: '/protected',
        tagName: 'protected-page',
        guard: () => {
          events.push('guard');
          return Promise.resolve(false);
        },
      },
    ],
    onChange: () => {
      events.push('change');
    },
  });
  try {
    browser.jumpTo('/old');
    browser.fire('popstate');
    await flushBrowserNavigation();
    // The redirect target's guard blocked, so the entry the user came from
    // was restored and no change was notified.
    assertEquals(events, ['guard']);
    assertEquals(router.currentPath, '/public');
    assertEquals(router.currentRoute?.tagName, 'public-page');
    assertEquals(browser.path(), '/public');
    assertEquals(browser.applied, ['/public']);
  } finally {
    router.dispose();
    browser.restore();
  }
});

Deno.test('popstate dedupes consecutive events landing on the same URL', async () => {
  const browser = installFakeBrowser('/public');
  const events: string[] = [];
  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/public', tagName: 'public-page' },
      {
        path: '/protected',
        tagName: 'protected-page',
        guard: () => {
          events.push('guard');
          return Promise.resolve(true);
        },
      },
    ],
    onChange: () => {
      events.push('change');
    },
  });
  try {
    browser.jumpTo('/protected');
    browser.fire('popstate');
    browser.fire('popstate');
    await flushBrowserNavigation();
    assertEquals(events, ['guard', 'change']);
    assertEquals(router.currentPath, '/protected');
  } finally {
    router.dispose();
    browser.restore();
  }
});

Deno.test('hashchange runs the guard and restores the previous hash entry when blocked', async () => {
  const browser = installFakeBrowser('#/public');
  const events: string[] = [];
  const router = createRouter({
    mode: 'hash',
    routes: [
      { path: '/public', tagName: 'public-page' },
      {
        path: '/protected',
        tagName: 'protected-page',
        guard: () => {
          events.push('guard');
          return Promise.resolve(false);
        },
      },
    ],
    onChange: () => {
      events.push('change');
    },
  });
  try {
    browser.jumpTo('#/protected');
    browser.fire('hashchange');
    await flushBrowserNavigation();
    assertEquals(events, ['guard']);
    assertEquals(router.currentPath, '/public');
    assertEquals(browser.path(), '/public');
    assertEquals(browser.applied, ['#/public']);
  } finally {
    router.dispose();
    browser.restore();
  }
});
