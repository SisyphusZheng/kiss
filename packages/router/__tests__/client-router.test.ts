/**
 * Tests for client-router.ts.
 *
 * Mocks browser globals (location, history, addEventListener, removeEventListener)
 * on globalThis before importing the module.
 */
import { assertEquals, assertExists, assertFalse } from 'jsr:@std/assert@^1.0.0';

// ─── Mock helpers ─────────────────────────────────────────────────

interface MockHistory {
  pushState: (data: unknown, _title: string, url: string) => void;
  replaceState: (data: unknown, _title: string, url: string) => void;
  _calls: Array<{ method: 'pushState' | 'replaceState'; url: string }>;
  _reset(): void;
}

interface MockLocation {
  protocol: string;
  pathname: string;
  search: string;
  hash: string;
}

type EventMap = Map<string, Set<EventListener>>;

/** Mutable globals that each test resets. */
const mockLocation: MockLocation = {
  protocol: 'http:',
  pathname: '/',
  search: '',
  hash: '',
};

const mockHistory: MockHistory = {
  _calls: [],
  pushState(_data: unknown, _title: string, url: string) {
    this._calls.push({ method: 'pushState', url });
    // In real browsers, pushState updates location.pathname/search
    const u = new URL(url, 'http://x');
    mockLocation.pathname = u.pathname;
    mockLocation.search = u.search;
    mockLocation.hash = u.hash;
  },
  replaceState(_data: unknown, _title: string, url: string) {
    this._calls.push({ method: 'replaceState', url });
    const u = new URL(url, 'http://x');
    mockLocation.pathname = u.pathname;
    mockLocation.search = u.search;
    mockLocation.hash = u.hash;
  },
  _reset() {
    this._calls = [];
  },
};

const mockEvents: EventMap = new Map();

function mockAddEventListener(type: string, handler: EventListener) {
  if (!mockEvents.has(type)) mockEvents.set(type, new Set());
  mockEvents.get(type)!.add(handler);
}

function mockRemoveEventListener(type: string, handler: EventListener) {
  mockEvents.get(type)?.delete(handler);
}

// Install mocks on globalThis before importing the module
(globalThis as Record<string, unknown>).location = mockLocation;
(globalThis as Record<string, unknown>).history = mockHistory;
(globalThis as Record<string, unknown>).addEventListener = mockAddEventListener;
(globalThis as Record<string, unknown>).removeEventListener = mockRemoveEventListener;

// Static import (must come after mocks are on globalThis)
import { createRouter } from '../src/client-router.ts';

// ─── Test helpers ─────────────────────────────────────────────────

function resetMocks(
  overrides: {
    protocol?: string;
    pathname?: string;
    search?: string;
    hash?: string;
  } = {},
) {
  mockLocation.protocol = overrides.protocol ?? 'http:';
  mockLocation.pathname = overrides.pathname ?? '/';
  mockLocation.search = overrides.search ?? '';
  mockLocation.hash = overrides.hash ?? '';
  mockHistory._reset();
  mockEvents.clear();
}

function fireEvent(type: string) {
  const handlers = mockEvents.get(type);
  if (!handlers) return;
  for (const h of handlers) h(new Event(type));
}

// ─── Tests ────────────────────────────────────────────────────────

Deno.test('history mode: pushState called on navigate', async () => {
  resetMocks({ pathname: '/' });

  const router = createRouter({
    mode: 'history',
    routes: [{ path: '/', component: () => null }],
  });

  await router.navigate('/foo');
  assertEquals(mockHistory._calls.length, 1);
  assertEquals(mockHistory._calls[0].method, 'pushState');
});

Deno.test('history mode: popstate triggers re-match', () => {
  resetMocks({ pathname: '/' });

  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/', component: () => null },
      { path: '/about', component: () => null },
    ],
  });

  assertEquals(router.currentRoute?.path, '/');

  // Simulate popstate to a different URL
  mockLocation.pathname = '/about';
  mockLocation.search = '';
  fireEvent('popstate');

  assertEquals(router.currentRoute?.path, '/about');
});

Deno.test('history mode: popstate calls onChange after re-match', () => {
  resetMocks({ pathname: '/' });

  let observedPath = '';
  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/', component: () => null },
      { path: '/about', component: () => null },
    ],
    onChange: () => {
      observedPath = router.currentRoute?.path ?? '';
    },
  });

  mockLocation.pathname = '/about';
  fireEvent('popstate');

  assertEquals(observedPath, '/about');
});

Deno.test('hash mode: hashchange triggers re-match', () => {
  resetMocks({ pathname: '/', hash: '' });

  const router = createRouter({
    mode: 'hash',
    routes: [
      { path: '/', component: () => null },
      { path: '/products/:id', component: () => null },
    ],
  });

  assertEquals(router.currentRoute?.path, '/');

  // Simulate hashchange
  mockLocation.hash = '#/products/42';
  fireEvent('hashchange');

  assertEquals(router.currentRoute?.path, '/products/:id');
  assertEquals(router.params.id, '42');
});

Deno.test('hash mode: navigate writes hash URL and calls onChange once', async () => {
  resetMocks({ pathname: '/', hash: '' });

  let changeCount = 0;
  const router = createRouter({
    mode: 'hash',
    routes: [
      { path: '/', component: () => null },
      { path: '/products/:id', component: () => null },
    ],
    onChange: () => {
      changeCount++;
    },
  });

  await router.navigate('/products/42');

  assertEquals(mockHistory._calls, [
    { method: 'pushState', url: '#/products/42' },
  ]);
  assertEquals(router.currentRoute?.path, '/products/:id');
  assertEquals(router.params.id, '42');
  assertEquals(changeCount, 1);
});

Deno.test('auto mode: file:// protocol picks hash', () => {
  resetMocks({ protocol: 'file:', pathname: '/' });

  createRouter({
    mode: 'auto',
    routes: [{ path: '/', component: () => null }],
  });

  // Hash mode registers hashchange, not popstate
  assertExists(mockEvents.get('hashchange'));
});

Deno.test('auto mode: http:// protocol picks history', () => {
  resetMocks({ protocol: 'http:', pathname: '/' });

  createRouter({
    mode: 'auto',
    routes: [{ path: '/', component: () => null }],
  });

  // History mode registers popstate, not hashchange
  assertExists(mockEvents.get('popstate'));
  assertFalse(mockEvents.has('hashchange'));
});

Deno.test('route matching: named params extraction', () => {
  resetMocks({ pathname: '/products/42' });

  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/', component: () => null },
      { path: '/products/:id', component: () => null },
    ],
  });

  assertEquals(router.currentRoute?.path, '/products/:id');
  assertEquals(router.params.id, '42');
});

Deno.test('route matching: optional params present', () => {
  resetMocks({ pathname: '/products/42/hello-world' });

  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/products/:id/:slug?', component: () => null },
    ],
  });

  assertEquals(router.currentRoute?.path, '/products/:id/:slug?');
  assertEquals(router.params.id, '42');
  assertEquals(router.params.slug, 'hello-world');
});

Deno.test('route matching: optional params missing', () => {
  resetMocks({ pathname: '/products/42' });

  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/products/:id/:slug?', component: () => null },
    ],
  });

  assertEquals(router.currentRoute?.path, '/products/:id/:slug?');
  assertEquals(router.params.id, '42');
  assertEquals(router.params.slug, undefined);
});

Deno.test('route matching: missing required param → no match', () => {
  resetMocks({ pathname: '/products' });

  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/products/:id', component: () => null },
    ],
  });

  assertEquals(router.currentRoute, null);
});

Deno.test('query string parsing', () => {
  resetMocks({ pathname: '/search', search: '?q=hello&page=2' });

  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/search', component: () => null },
    ],
  });

  assertEquals(router.currentRoute?.path, '/search');
  assertEquals(router.params.q, 'hello');
  assertEquals(router.params.page, '2');
});

Deno.test('guard blocking: returns false → navigation blocked', async () => {
  resetMocks({ pathname: '/' });

  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/', component: () => null },
      {
        path: '/admin',
        component: () => null,
        guard: async () => {
          await Promise.resolve();
          return false;
        },
      },
    ],
  });

  assertEquals(router.currentRoute?.path, '/');
  await router.navigate('/admin');

  // Should still be on '/' since guard blocked
  assertEquals(router.currentRoute?.path, '/');
  // pushState should NOT have been called
  assertEquals(
    mockHistory._calls.filter((c) => c.method === 'pushState').length,
    0,
  );
});

Deno.test('guard redirect: returns string → navigate to that path', async () => {
  resetMocks({ pathname: '/' });

  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/', component: () => null },
      { path: '/login', component: () => null },
      {
        path: '/dashboard',
        component: () => null,
        guard: async () => {
          await Promise.resolve();
          return '/login';
        },
      },
    ],
  });

  assertEquals(router.currentRoute?.path, '/');
  await router.navigate('/dashboard');

  // Should have been redirected to /login
  assertEquals(router.currentRoute?.path, '/login');
});

Deno.test('dispose removes event listeners', () => {
  resetMocks({ pathname: '/' });

  const router = createRouter({
    mode: 'history',
    routes: [{ path: '/', component: () => null }],
  });

  assertExists(mockEvents.get('popstate'));
  assertEquals(mockEvents.get('popstate')!.size, 1);

  router.dispose();
  assertEquals(mockEvents.get('popstate')!.size, 0);
});

Deno.test('idempotent dispose: multiple calls safe', () => {
  resetMocks({ pathname: '/' });

  const router = createRouter({
    mode: 'history',
    routes: [{ path: '/', component: () => null }],
  });

  router.dispose();
  router.dispose(); // should not throw
  assertEquals(mockEvents.get('popstate')!.size, 0);
});

Deno.test('replace: replaces state without adding history entry', async () => {
  resetMocks({ pathname: '/' });

  const router = createRouter({
    mode: 'history',
    routes: [
      { path: '/', component: () => null },
      { path: '/about', component: () => null },
    ],
  });

  await router.replace('/about');

  // replaceState should have been called
  const replaceCalls = mockHistory._calls.filter(
    (c) => c.method === 'replaceState',
  );
  assertEquals(replaceCalls.length, 1);
  assertEquals(router.currentRoute?.path, '/about');
});
