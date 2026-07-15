import { assertEquals, assertRejects } from 'jsr:@std/assert@^1.0.0';
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
