import { assertEquals, assertRejects } from '@std/assert';
import {
  compileRouteMatcher,
  createRouter,
  matchRoute,
  matchRouteLinear,
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

Deno.test('client router semantics are WHATWG URLPattern semantics (#856, ADR-0123)', () => {
  const fixtures: RouteConfig[] = [
    { path: '/assets/:path*', tagName: 'asset-page' },
    { path: '/products/:slug{.+}', tagName: 'product-page' },
    { path: '/docs/new', tagName: 'new-page' },
  ];

  // `:param*` is zero-or-more segments: the bare prefix matches, with the
  // param absent (URLPattern reports an unmatched repeat as undefined).
  assertEquals(matchRoute('/assets', '', fixtures)?.route.tagName, 'asset-page');
  assertEquals(matchRoute('/assets', '', fixtures)?.params.path, undefined);
  // Multi-segment captures decode percent-encoded input exactly once.
  assertEquals(matchRoute('/assets/a%20b/c', '', fixtures)?.params.path, 'a b/c');
  // `:param{.+}` is the URLPattern `:param(.+)` regex group: one or more
  // segments, decoded under the plain param name.
  assertEquals(matchRoute('/products/a%20b/c', '', fixtures)?.params.slug, 'a b/c');
  // URLPattern pathname matching is strict about trailing slashes — the old
  // hand-written matcher silently ignored them.
  assertEquals(matchRoute('/docs/new/', '', fixtures), null);
});

// ─── URLPattern fallback parity (#897) ─────────────────────────────

const fallbackFixtures: RouteConfig[] = [
  { path: '/', tagName: 'home-page' },
  { path: '/docs/new', tagName: 'new-page' },
  { path: '/docs/:slug', tagName: 'doc-page' },
  { path: '/:locale?/guide/:page?', tagName: 'guide-page' },
  { path: '/assets/:path*', tagName: 'asset-page' },
  { path: '/products/:slug{.+}', tagName: 'product-page' },
  { path: '/items/:id', tagName: 'item-page' },
  { path: '/a/:x?/b', tagName: 'optional-mid-page' },
  { path: '/mixed/:path*/tail', tagName: 'repeat-mid-page' },
  { path: '*', tagName: 'fallback-page' },
];

const fallbackCases: Array<[string, string]> = [
  ['/', ''],
  ['/docs/new', '?preview=yes'],
  ['/docs/new/', ''],
  ['/docs/start', ''],
  ['/guide', ''],
  ['/zh/guide/api', ''],
  ['/assets', ''],
  ['/assets/', ''],
  ['/assets/a/b', ''],
  ['/assets/a//b', ''],
  ['/assets/a%20b/c', ''],
  ['/products/a/b', ''],
  ['/products/a', ''],
  ['/products', ''],
  ['/products/', ''],
  ['/items/hello%20world', '?id=query'],
  ['/items/id', '?value=%25'],
  ['/a/b', ''],
  ['/a//b', ''],
  ['/mixed/tail', ''],
  ['/mixed/x/tail', ''],
  ['/mixed/x/y/tail', ''],
  ['/mixed//tail', ''],
  ['/unknown/path', ''],
];

Deno.test('regex fallback matches the URLPattern path on identical fixtures', () => {
  for (const [pathname, search] of fallbackCases) {
    assertEquals(
      matchRouteLinear(pathname, search, fallbackFixtures),
      matchRouteLinearForTests(pathname, search, fallbackFixtures),
      `fallback mismatch for ${pathname}${search}`,
    );
  }
});

Deno.test('regex fallback drives the compiled trie matcher identically', () => {
  const compiled = compileRouteMatcher(fallbackFixtures);
  for (const [pathname, search] of fallbackCases) {
    assertEquals(
      compiled.match(pathname, search),
      matchRouteLinear(pathname, search, fallbackFixtures),
      `trie mismatch for ${pathname}${search}`,
    );
  }
});

Deno.test('regex fallback accepts custom regexes containing nested groups (#1036)', () => {
  const grouped: RouteConfig[] = [
    { path: '/x/:name{(?:a|b)+}', tagName: 'grouped-page' },
    { path: '/y/:v{[)]+}', tagName: 'class-page' },
  ];
  // A naive indexOf(')') stopped at the inner group's terminator and threw at
  // compile time; pair-scanning accepts what URLPattern accepts.
  const match = matchRouteLinear('/x/ab', '', grouped);
  assertEquals(match?.route.tagName, 'grouped-page');
  assertEquals(match?.params.name, 'ab');
  assertEquals(matchRouteLinear('/x/c', '', grouped), null);
  // A ')' inside a character class is not the group terminator either.
  assertEquals(matchRouteLinear('/y/))', '', grouped)?.params.v, '))');
  // Parity with the native URLPattern path.
  assertEquals(matchRoute('/x/ab', '', grouped)?.params.name, 'ab');
  // Unbalanced groups still fail fast at compile time.
  let threw = false;
  try {
    matchRouteLinear('/z/a', '', [{ path: '/z/:name{(?:a}', tagName: 'bad-page' }]);
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

Deno.test('router falls back to the regex matcher when URLPattern is absent', () => {
  const original = globalThis.URLPattern;
  // @ts-expect-error removing a browser global to simulate Firefox (#897)
  delete globalThis.URLPattern;
  try {
    for (const [pathname, search] of fallbackCases) {
      const viaFallback = matchRoute(pathname, search, fallbackFixtures);
      const viaLinear = matchRouteLinear(pathname, search, fallbackFixtures);
      assertEquals(viaFallback, viaLinear, `dispatch mismatch for ${pathname}${search}`);
    }
  } finally {
    globalThis.URLPattern = original;
  }
});

Deno.test('regex fallback rejects empty segments and trailing slashes like URLPattern', () => {
  const original = globalThis.URLPattern;
  // @ts-expect-error removing a browser global to simulate Firefox (#897)
  delete globalThis.URLPattern;
  const routes: RouteConfig[] = [
    { path: '/assets/:path*', tagName: 'asset-page' },
    { path: '/mixed/:path*/tail', tagName: 'repeat-mid-page' },
    { path: '/docs/new', tagName: 'new-page' },
    { path: '/products/:slug{.+}', tagName: 'product-page' },
  ];
  try {
    // Repeat `:path*` does not match empty remainders.
    assertEquals(matchRoute('/assets/', '', routes), null);
    assertEquals(matchRoute('/assets/a/', '', routes), null);
    assertEquals(matchRoute('/assets/a//b', '', routes), null);
    assertEquals(matchRoute('/mixed//tail', '', routes), null);
    // Trailing-slash strictness holds in fallback mode too.
    assertEquals(matchRoute('/docs/new/', '', routes), null);
    // Regex groups still match across slashes.
    assertEquals(matchRoute('/products/a%20b/c', '', routes)?.params.slug, 'a b/c');
    // Zero-segment repeat is absent, like URLPattern.
    assertEquals(matchRoute('/assets', '', routes)?.params.path, undefined);
  } finally {
    globalThis.URLPattern = original;
  }
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

Deno.test('programmatic navigations are latest-wins: a slow stale guard cannot roll back a newer navigation (#1023)', async () => {
  const browser = installFakeBrowser('/start');
  let releaseGuard!: () => void;
  const events: string[] = [];
  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/start', tagName: 'start-page' },
      {
        path: '/guarded',
        tagName: 'guarded-page',
        guard: () =>
          new Promise<boolean>((resolve) => {
            releaseGuard = () => resolve(true);
          }),
      },
      { path: '/newer', tagName: 'newer-page' },
    ],
    onChange: () => {
      events.push('change');
    },
  });
  try {
    // First navigation suspends in its async guard.
    const stale = router.navigate('/guarded');
    // A newer navigation commits while the first guard is still pending.
    await router.navigate('/newer');
    assertEquals(router.currentPath, '/newer');
    // The stale guard resolves afterwards: it must not push state or rematch.
    releaseGuard();
    await stale;
    assertEquals(router.currentPath, '/newer');
    assertEquals(browser.path(), '/newer');
    assertEquals(browser.applied, ['/newer']);
    assertEquals(events, ['change']);
  } finally {
    router.dispose();
    browser.restore();
  }
});

// ─── Guard-veto history trap (#1036) ───────────────────────────────

/**
 * Fake browser with a truthful history model: pushState truncates the forward
 * stack and appends, replaceState rewrites the current entry, and back() moves
 * the session pointer before dispatching popstate.
 */
function installFakeHistoryStack(initialEntries: string[]) {
  const descriptors = {
    location: Object.getOwnPropertyDescriptor(globalThis, 'location'),
    history: Object.getOwnPropertyDescriptor(globalThis, 'history'),
  };
  const originalAdd = globalThis.addEventListener;
  const originalRemove = globalThis.removeEventListener;
  const entries = [...initialEntries];
  let pointer = entries.length - 1;
  const listeners = new Map<string, EventListener[]>();
  const currentUrl = () => new URL(entries[pointer], 'https://router.test');
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: {
      protocol: 'https:',
      get pathname() {
        return currentUrl().pathname;
      },
      get search() {
        return currentUrl().search;
      },
      get hash() {
        return '';
      },
    },
  });
  Object.defineProperty(globalThis, 'history', {
    configurable: true,
    value: {
      pushState(_state: unknown, _title: string, url: string) {
        entries.length = pointer + 1;
        entries.push(url);
        pointer++;
      },
      replaceState(_state: unknown, _title: string, url: string) {
        entries[pointer] = url;
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
    entries,
    back() {
      if (pointer > 0) pointer--;
      for (const listener of listeners.get('popstate') ?? []) {
        listener(new Event('popstate'));
      }
    },
    path() {
      return entries[pointer];
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

Deno.test('popstate guard veto does not trap earlier history entries (#1036)', async () => {
  // /a ← /guarded ← /b: the user backs onto the vetoed /guarded entry.
  const browser = installFakeHistoryStack(['/a', '/guarded', '/b']);
  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/a', tagName: 'a-page' },
      { path: '/guarded', tagName: 'guarded-page', guard: () => Promise.resolve(false) },
      { path: '/b', tagName: 'b-page' },
    ],
  });
  try {
    browser.back();
    await flushBrowserNavigation();
    // Vetoed: the router and the address bar stay on /b.
    assertEquals(router.currentPath, '/b');
    assertEquals(browser.path(), '/b');
    // The vetoed entry must not sit under the restored one forever: with
    // push-restore the next back re-landed on /guarded and bounced again,
    // leaving /a unreachable; replace-restore rewrites the vetoed entry, so
    // the next back reaches /a.
    browser.back();
    await flushBrowserNavigation();
    assertEquals(router.currentPath, '/a');
    assertEquals(browser.path(), '/a');
  } finally {
    router.dispose();
    browser.restore();
  }
});
