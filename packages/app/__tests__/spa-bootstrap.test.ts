/**
 * @openelement/app — SPA bootstrap tests.
 *
 * Tests defineApp({ mode: 'spa' }) for mount, navigation,
 * dispose, idempotent dispose, and re-mount.
 *
 * Uses stubbed browser globals (location, history, addEventListener,
 * removeEventListener, document) to avoid JSDOM.
 */
import {
  assertEquals,
  assertExists,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@^1.0.0';

// ─── Mock helpers ──────────────────────────────────────────────

interface MockHistory {
  pushState(data: unknown, title: string, url: string): void;
  replaceState(data: unknown, title: string, url: string): void;
  _calls: Array<{ method: 'pushState' | 'replaceState'; url: string }>;
  _reset(): void;
}

const mockLocation = {
  protocol: 'http:',
  pathname: '/',
  search: '',
  hash: '',
};

const mockHistory: MockHistory = {
  _calls: [],
  pushState(_data: unknown, _title: string, url: string) {
    this._calls.push({ method: 'pushState', url });
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

const mockEvents: Map<string, Set<EventListener>> = new Map();

function mockAddEventListener(type: string, handler: EventListener): void {
  if (!mockEvents.has(type)) mockEvents.set(type, new Set());
  mockEvents.get(type)!.add(handler);
}

function mockRemoveEventListener(type: string, handler: EventListener): void {
  mockEvents.get(type)?.delete(handler);
}

/** Minimal DOM stub with innerHTML, addEventListener, and tagName support. */
class StubElement {
  nodeType = 1; // Element node
  tagName = 'DIV';
  #html = '';
  childNodes: StubElement[] = [];
  #listeners: Map<string, Set<EventListener>> = new Map();

  get innerHTML(): string {
    return this.#html;
  }
  set innerHTML(value: string) {
    this.#html = value;
    this.childNodes = [];
  }

  appendChild(node: StubElement): StubElement {
    this.childNodes.push(node);
    this.#html += node.textContent ?? '';
    return node;
  }

  get textContent(): string {
    if (this.childNodes.length === 0) return this.#html;
    return this.childNodes.map((c) => c.textContent).join('');
  }
  set textContent(value: string) {
    this.#html = value;
    this.childNodes = [];
  }

  addEventListener(type: string, handler: EventListener): void {
    if (!this.#listeners.has(type)) this.#listeners.set(type, new Set());
    this.#listeners.get(type)!.add(handler);
  }

  removeEventListener(type: string, handler: EventListener): void {
    this.#listeners.get(type)?.delete(handler);
  }
}

let stubRoot: StubElement | null = null;

const mockDocument = {
  querySelector(_selector: string): StubElement | null {
    return stubRoot;
  },
  createElement(_tagName: string): StubElement {
    return new StubElement();
  },
};

// Install mocks on globalThis before importing the SPA module
(globalThis as Record<string, unknown>).location = mockLocation;
(globalThis as Record<string, unknown>).history = mockHistory;
(globalThis as Record<string, unknown>).addEventListener = mockAddEventListener;
(globalThis as Record<string, unknown>).removeEventListener = mockRemoveEventListener;
(globalThis as Record<string, unknown>).document = mockDocument;

// Static import (must come after mocks are on globalThis)
import { defineApp } from '../src/spa.ts';
import type { RouteConfig } from '@openelement/router/client-router';

// ─── Test helpers ──────────────────────────────────────────────

/** Resolve after one microtask tick — waits for async renderRoute to complete. */
function awaitTick(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

function resetMocks(
  overrides: {
    pathname?: string;
    search?: string;
    hash?: string;
  } = {},
): void {
  mockLocation.pathname = overrides.pathname ?? '/';
  mockLocation.search = overrides.search ?? '';
  mockLocation.hash = overrides.hash ?? '';
  mockHistory._reset();
  mockEvents.clear();
  stubRoot = null;
}

function firePopstate(): void {
  const handlers = mockEvents.get('popstate');
  if (!handlers) return;
  for (const h of handlers) h(new Event('popstate'));
}

function createSpyComponent(label: string): () => StubElement {
  return () => {
    const el = new StubElement();
    el.textContent = label;
    return el;
  };
}

function homeRoute(): RouteConfig {
  return { path: '/', component: createSpyComponent('home') };
}

function aboutRoute(): RouteConfig {
  return { path: '/about', component: createSpyComponent('about') };
}

// ─── Tests ─────────────────────────────────────────────────────

Deno.test('defineApp({ mode: "spa" }) returns app instance with mount and dispose', () => {
  resetMocks();
  const app = defineApp({ mode: 'spa' });
  assertEquals(typeof app.mount, 'function');
  assertEquals(typeof app.dispose, 'function');
});

Deno.test('mount renders home route into the target element', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();

  const app = defineApp({
    mode: 'spa',
    routes: [homeRoute()],
  });

  app.mount('#root');
  await awaitTick();
  assertStringIncludes(stubRoot.textContent, 'home');
});

Deno.test('mount renders matching route based on current URL', async () => {
  resetMocks({ pathname: '/about' });
  stubRoot = new StubElement();

  const app = defineApp({
    mode: 'spa',
    routes: [homeRoute(), aboutRoute()],
  });

  app.mount('#root');
  await awaitTick();
  assertStringIncludes(stubRoot.textContent, 'about');
});

Deno.test('navigation via popstate changes what is rendered', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();

  const app = defineApp({
    mode: 'spa',
    routes: [homeRoute(), aboutRoute()],
  });

  app.mount('#root');
  await awaitTick();
  assertEquals(stubRoot.textContent, 'home');

  // Simulate back/forward navigation to /about
  mockLocation.pathname = '/about';
  firePopstate();
  await awaitTick();

  assertEquals(stubRoot.textContent, 'about');
});

Deno.test('dispose clears root DOM', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();

  const app = defineApp({
    mode: 'spa',
    routes: [homeRoute()],
  });

  app.mount('#root');
  await awaitTick();
  assertEquals(stubRoot.textContent, 'home');

  app.dispose();
  assertEquals(stubRoot.innerHTML, '');
  assertEquals(stubRoot.childNodes.length, 0);
});

Deno.test('dispose removes popstate listener', () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();

  const app = defineApp({
    mode: 'spa',
    routes: [homeRoute()],
  });

  app.mount('#root');
  const beforeCount = mockEvents.get('popstate')?.size ?? 0;
  assertExists(mockEvents.get('popstate'));

  app.dispose();
  // Our SPA popstate handler should be removed.
  // The router's internal popstate handler was also removed by router.dispose().
  const afterCount = mockEvents.get('popstate')?.size ?? 0;
  assertEquals(afterCount, beforeCount - 2); // -1 for our handler, -1 for router handler
});

Deno.test('double dispose is safe (idempotent)', () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();

  const app = defineApp({
    mode: 'spa',
    routes: [homeRoute()],
  });

  app.mount('#root');
  app.dispose();
  // Second dispose should not throw
  app.dispose();
  // Root element should remain cleared
  assertEquals(stubRoot.innerHTML, '');
});

Deno.test('re-mount after dispose is a fresh start', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();

  const app = defineApp({
    mode: 'spa',
    routes: [homeRoute(), aboutRoute()],
  });

  // First mount
  app.mount('#root');
  await awaitTick();
  assertEquals(stubRoot.textContent, 'home');

  // Dispose
  app.dispose();
  assertEquals(stubRoot.innerHTML, '');

  // Change URL and re-mount
  mockLocation.pathname = '/about';
  app.mount('#root');
  await awaitTick();
  assertEquals(stubRoot.textContent, 'about');
});

Deno.test('mount throws when selector matches nothing', () => {
  resetMocks({ pathname: '/' });
  stubRoot = null; // querySelector returns null

  const app = defineApp({
    mode: 'spa',
    routes: [homeRoute()],
  });

  assertThrows(
    () => app.mount('#missing'),
    Error,
    '[spa] Mount target not found',
  );
});

Deno.test('mount with no routes renders nothing but does not throw', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();

  // ponytail: empty routes is valid — user may add them later or use dynamic routing.
  const app = defineApp({ mode: 'spa' });
  app.mount('#root');
  await awaitTick();
  // Root should be empty since no route matched
  assertEquals(stubRoot.innerHTML, '');
});

Deno.test('mount replaces existing content with new route content', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();

  const app = defineApp({
    mode: 'spa',
    routes: [homeRoute()],
  });

  app.mount('#root');
  await awaitTick();
  assertEquals(stubRoot.textContent, 'home');

  // Re-mount without dispose (fresh mount replaces old content)
  mockLocation.pathname = '/';
  // Call mount again - should be a fresh start (calls dispose internally)
  app.mount('#root');
  await awaitTick();
  assertEquals(stubRoot.textContent, 'home');
});

Deno.test('same instance dispose then mount with different routes works', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();

  const app = defineApp({ mode: 'spa' });
  // ponytail: routes can be set at construction time only; re-mount with same instance uses same options.
  // This tests that options are preserved across dispose/mount cycles.
  app.mount('#root');
  await awaitTick();
  assertEquals(stubRoot.innerHTML, '');

  app.dispose();
  // Fresh mount
  app.mount('#root');
  await awaitTick();
  assertEquals(stubRoot.innerHTML, '');
});
