/**
 * @openelement/app — SPA data flow tests (loader / action).
 *
 * Tests that defineApp({ mode: 'spa' }) correctly manages the
 * data-context stack for loader and action data in client-side mode.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';

// ─── Mock helpers (same as spa-bootstrap.test.ts) ──────────────

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

/** Minimal DOM stub that supports innerHTML, appendChild, tagName, addEventListener, and dispatchEvent. */
class StubElement {
  nodeType = 1;
  #html = '';
  childNodes: StubElement[] = [];
  tagName = 'DIV';
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

  dispatchEvent(event: Event): boolean {
    const handlers = this.#listeners.get(event.type);
    if (!handlers) return true;
    for (const h of handlers) h(event);
    return !event.defaultPrevented;
  }
}

let stubRoot: StubElement | null = null;

const mockDocument = {
  querySelector(_selector: string): StubElement | null {
    return stubRoot;
  },
  createElement(_tagName: string): StubElement {
    const el = new StubElement();
    el.tagName = _tagName;
    return el;
  },
};

// Install mocks on globalThis before importing the SPA module
(globalThis as Record<string, unknown>).location = mockLocation;
(globalThis as Record<string, unknown>).history = mockHistory;
(globalThis as Record<string, unknown>).addEventListener = mockAddEventListener;
(globalThis as Record<string, unknown>).removeEventListener = mockRemoveEventListener;
(globalThis as Record<string, unknown>).document = mockDocument;

import { defineApp } from '../src/spa.ts';
import type { RouteConfig } from '@openelement/router/client-router';
import { useActionData, useLoaderData } from '@openelement/router/data-context';

// ─── Test helpers ──────────────────────────────────────────────

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

/**
 * Create a route with a loader that returns data, and a component
 * that reads useLoaderData() and renders it as text.
 */
function routeWithLoader(
  path: string,
  loaderData: unknown,
): RouteConfig {
  return {
    path,
    loader: () => Promise.resolve(loaderData),
    component: () => {
      const data = useLoaderData();
      const el = new StubElement();
      el.textContent = JSON.stringify(data);
      return el;
    },
  };
}

/**
 * Create a route with an action. The component renders a form
 * that can trigger the action.
 */
function routeWithAction(
  path: string,
  actionResult: unknown,
): RouteConfig {
  return {
    path,
    loader: () => Promise.resolve('loader-data'),
    action: () => Promise.resolve(actionResult),
    component: () => {
      const loaderData = useLoaderData();
      const actionData = useActionData();
      const el = new StubElement();
      el.textContent = JSON.stringify({ loader: loaderData, action: actionData });
      // The form element is what gets dispatched in the action test
      return el;
    },
  };
}

// ─── Tests ─────────────────────────────────────────────────────

Deno.test('loader data flows to useLoaderData()', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const testData = { message: 'hello from loader', count: 42 };
  const app = defineApp({
    mode: 'spa',
    routes: [routeWithLoader('/', testData)],
  });

  app.mount('#root');

  // renderRoute() is async — wait for the microtask queue
  await new Promise((r) => setTimeout(r, 0));

  const parsed = JSON.parse(stubRoot.textContent);
  assertEquals(parsed, testData);
});

Deno.test('action data flows to useActionData() via form submit', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const actionResult = { ok: true, saved: 'record-1' };
  const app = defineApp({
    mode: 'spa',
    routes: [routeWithAction('/', actionResult)],
  });

  app.mount('#root');

  // Wait for initial render (loader runs)
  await new Promise((r) => setTimeout(r, 0));

  // Verify initial state: loader data present, no action data
  let parsed = JSON.parse(stubRoot.textContent);
  assertEquals(parsed.loader, 'loader-data');
  assertEquals(parsed.action, undefined);

  // Simulate form submit: create a stub form element and dispatch submit
  const form = new StubElement();
  form.tagName = 'FORM';
  const submitEvent = new Event('submit', { cancelable: true });
  // Set event target by dispatching on the root element (which has the submit listener)
  // We need to dispatch on stubRoot since that's where the listener is attached
  // Override the event's target to point to our form
  Object.defineProperty(submitEvent, 'target', {
    value: form,
    writable: false,
    configurable: true,
  });

  stubRoot.dispatchEvent(submitEvent);

  // Wait for async action + re-render
  await new Promise((r) => setTimeout(r, 0));

  parsed = JSON.parse(stubRoot.textContent);
  assertEquals(parsed.loader, 'loader-data');
  assertEquals(parsed.action, actionResult);
});

Deno.test('navigation pops old loader data and loads new', async () => {
  resetMocks({ pathname: '/home' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const homeData = { page: 'home', id: 1 };
  const aboutData = { page: 'about', id: 2 };

  const app = defineApp({
    mode: 'spa',
    routes: [
      routeWithLoader('/home', homeData),
      routeWithLoader('/about', aboutData),
    ],
  });

  app.mount('#root');

  // Wait for initial render
  await new Promise((r) => setTimeout(r, 0));
  let parsed = JSON.parse(stubRoot.textContent);
  assertEquals(parsed, homeData);

  // Navigate to /about via popstate
  mockLocation.pathname = '/about';
  firePopstate();

  // Wait for async render
  await new Promise((r) => setTimeout(r, 0));
  parsed = JSON.parse(stubRoot.textContent);
  assertEquals(parsed, aboutData);
});

Deno.test('dispose clears all data context', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const testData = { message: 'before dispose' };
  const app = defineApp({
    mode: 'spa',
    routes: [routeWithLoader('/', testData)],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 0));

  // Verify data is present
  let data = useLoaderData();
  assertEquals(data, testData);

  app.dispose();

  // After dispose, data should be cleared
  data = useLoaderData();
  assertEquals(data, undefined);
});

Deno.test('loader runs before component render', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const executionOrder: string[] = [];

  const app = defineApp({
    mode: 'spa',
    routes: [
      {
        path: '/',
        loader: async () => {
          await Promise.resolve();
          executionOrder.push('loader');
          return { ok: true };
        },
        component: () => {
          executionOrder.push('component');
          const el = new StubElement();
          el.textContent = useLoaderData<{ ok: boolean }>().ok ? 'yes' : 'no';
          return el;
        },
      },
    ],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 0));

  assertEquals(executionOrder, ['loader', 'component']);
  assertEquals(stubRoot.textContent, 'yes');
});

Deno.test('navigation to route without loader clears previous data', async () => {
  resetMocks({ pathname: '/with-loader' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const app = defineApp({
    mode: 'spa',
    routes: [
      routeWithLoader('/with-loader', { has: 'data' }),
      {
        path: '/no-loader',
        component: () => {
          const data = useLoaderData();
          const el = new StubElement();
          el.textContent = data === undefined ? 'no-data' : JSON.stringify(data);
          return el;
        },
      },
    ],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(JSON.parse(stubRoot.textContent).has, 'data');

  // Navigate to route without loader
  mockLocation.pathname = '/no-loader';
  firePopstate();
  await new Promise((r) => setTimeout(r, 0));

  assertEquals(stubRoot.textContent, 'no-data');
});

Deno.test('second render replaces first, not accumulates', async () => {
  resetMocks({ pathname: '/first' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const app = defineApp({
    mode: 'spa',
    routes: [
      routeWithLoader('/first', { value: 'first' }),
      routeWithLoader('/second', { value: 'second' }),
    ],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(JSON.parse(stubRoot.textContent).value, 'first');

  mockLocation.pathname = '/second';
  firePopstate();
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(JSON.parse(stubRoot.textContent).value, 'second');

  mockLocation.pathname = '/first';
  firePopstate();
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(JSON.parse(stubRoot.textContent).value, 'first');
});
