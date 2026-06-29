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

class StubText extends StubElement {
  override nodeType = 3;

  constructor(text: string) {
    super();
    this.textContent = text;
  }
}

class StubDocumentFragment extends StubElement {
  override nodeType = 11;
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
  createTextNode(text: string): StubText {
    return new StubText(text);
  },
  createDocumentFragment(): StubDocumentFragment {
    return new StubDocumentFragment();
  },
  createComment(text: string): StubText {
    return new StubText(text);
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
      el.textContent = JSON.stringify({
        loader: loaderData,
        action: actionData,
      });
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

Deno.test('form submit passes FormData to route action', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const OriginalFormData = globalThis.FormData;
  let capturedForm: unknown;
  class MockFormData {
    constructor(form: unknown) {
      capturedForm = form;
    }
  }
  Object.defineProperty(globalThis, 'FormData', {
    value: MockFormData,
    configurable: true,
  });

  try {
    let actionFormData: unknown;
    const app = defineApp({
      mode: 'spa',
      routes: [{
        path: '/',
        loader: () => Promise.resolve('loader-data'),
        action: (ctx) => {
          actionFormData = ctx.formData;
          return Promise.resolve({ ok: true });
        },
        component: () => {
          const el = new StubElement();
          el.textContent = JSON.stringify(useActionData());
          return el;
        },
      }],
    });

    app.mount('#root');
    await new Promise((r) => setTimeout(r, 0));

    const form = new StubElement();
    form.tagName = 'FORM';
    const submitEvent = new Event('submit', { cancelable: true });
    Object.defineProperty(submitEvent, 'target', {
      value: form,
      writable: false,
      configurable: true,
    });

    stubRoot.dispatchEvent(submitEvent);
    await new Promise((r) => setTimeout(r, 0));

    assertEquals(capturedForm, form);
    assertEquals(actionFormData instanceof MockFormData, true);
  } finally {
    Object.defineProperty(globalThis, 'FormData', {
      value: OriginalFormData,
      configurable: true,
    });
  }
});

Deno.test('submit without route action falls through to native form behavior', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const app = defineApp({
    mode: 'spa',
    routes: [routeWithLoader('/', 'loader-data')],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 0));

  const form = new StubElement();
  form.tagName = 'FORM';
  const submitEvent = new Event('submit', { cancelable: true });
  Object.defineProperty(submitEvent, 'target', {
    value: form,
    writable: false,
    configurable: true,
  });

  const result = stubRoot.dispatchEvent(submitEvent);

  assertEquals(result, true);
  assertEquals(submitEvent.defaultPrevented, false);
});

// ─── Shadow DOM retargeting regression ──────────────────────
// When a <button type="submit"> inside a custom element (e.g. <open-button>)
// triggers the form's submit event, the event bubbles out of the shadow
// boundary and event.target is retargeted to the host element (open-button),
// NOT the <form>. The handler must use composedPath() to recover the form.

Deno.test('form submit works when event.target is retargeted by Shadow DOM', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const actionResult = { ok: true, shadowDom: true };
  const app = defineApp({
    mode: 'spa',
    routes: [routeWithAction('/', actionResult)],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 0));

  // Build the scenario: host element (open-button) is event.target,
  // but the actual <form> lives inside the composedPath.
  const form = new StubElement();
  form.tagName = 'FORM';
  const hostButton = new StubElement();
  hostButton.tagName = 'OPEN-BUTTON';

  const submitEvent = new Event('submit', { cancelable: true });
  // event.target retargets to the host (open-button) — this is what
  // the root listener sees after the event crosses the shadow boundary.
  Object.defineProperty(submitEvent, 'target', {
    value: hostButton,
    writable: false,
    configurable: true,
  });
  // composedPath() reveals the full path including the form inside the shadow tree.
  Object.defineProperty(submitEvent, 'composedPath', {
    value: () => [hostButton, form, stubRoot],
    configurable: true,
  });

  stubRoot.dispatchEvent(submitEvent);
  await new Promise((r) => setTimeout(r, 0));

  const parsed = JSON.parse(stubRoot.textContent);
  assertEquals(parsed.action, actionResult);
});

Deno.test('form submit ignored when neither target nor composedPath has a form', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const app = defineApp({
    mode: 'spa',
    routes: [routeWithAction('/', { shouldNotRun: true })],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 0));

  // Simulate a non-form submit (e.g. accidental dispatch from a div)
  const div = new StubElement();
  div.tagName = 'DIV';
  const submitEvent = new Event('submit', { cancelable: true });
  Object.defineProperty(submitEvent, 'target', {
    value: div,
    writable: false,
    configurable: true,
  });
  Object.defineProperty(submitEvent, 'composedPath', {
    value: () => [div, stubRoot],
    configurable: true,
  });

  const result = stubRoot.dispatchEvent(submitEvent);
  await new Promise((r) => setTimeout(r, 0));

  // No form found → falls through to native (defaultPrevented stays false)
  assertEquals(result, true);
  assertEquals(submitEvent.defaultPrevented, false);
  // Action did not run
  const parsed = JSON.parse(stubRoot.textContent);
  assertEquals(parsed.action, undefined);
});

Deno.test('async route component result renders after loader data is available', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const app = defineApp({
    mode: 'spa',
    routes: [{
      path: '/',
      loader: () => Promise.resolve({ message: 'async loader' }),
      component: async () => {
        await new Promise((r) => setTimeout(r, 0));
        const data = useLoaderData<{ message: string }>();
        const el = new StubElement();
        el.textContent = data.message;
        return el;
      },
    }],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 5));

  assertEquals(stubRoot.textContent, 'async loader');
});

Deno.test('lazy module default route component renders', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const app = defineApp({
    mode: 'spa',
    routes: [{
      path: '/',
      component: async () => {
        await Promise.resolve();
        return {
          default: () => {
            const el = new StubElement();
            el.textContent = 'lazy module';
            return el;
          },
        };
      },
    }],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 5));

  assertEquals(stubRoot.textContent, 'lazy module');
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

Deno.test('stale loader results do not overwrite newer navigation', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  let resolveHome!: (value: unknown) => void;
  const homeLoader = new Promise((resolve) => {
    resolveHome = resolve;
  });

  const app = defineApp({
    mode: 'spa',
    routes: [
      {
        path: '/',
        loader: () => homeLoader,
        component: () => {
          const el = new StubElement();
          el.textContent = JSON.stringify(useLoaderData());
          return el;
        },
      },
      routeWithLoader('/about', { page: 'about' }),
    ],
  });

  app.mount('#root');

  mockLocation.pathname = '/about';
  firePopstate();
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(JSON.parse(stubRoot.textContent), { page: 'about' });

  resolveHome({ page: 'stale-home' });
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(JSON.parse(stubRoot.textContent), { page: 'about' });
});

Deno.test('stale action results do not overwrite newer navigation', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  let resolveAction!: (value: unknown) => void;
  const action = new Promise((resolve) => {
    resolveAction = resolve;
  });

  const app = defineApp({
    mode: 'spa',
    routes: [
      {
        path: '/',
        loader: () => Promise.resolve({ page: 'home' }),
        action: () => action,
        component: () => {
          const el = new StubElement();
          el.textContent = JSON.stringify({
            loader: useLoaderData(),
            action: useActionData(),
          });
          return el;
        },
      },
      routeWithLoader('/about', { page: 'about' }),
    ],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(JSON.parse(stubRoot.textContent), {
    loader: { page: 'home' },
  });

  const form = new StubElement();
  form.tagName = 'FORM';
  const submitEvent = new Event('submit', { cancelable: true });
  Object.defineProperty(submitEvent, 'target', {
    value: form,
    writable: false,
    configurable: true,
  });
  stubRoot.dispatchEvent(submitEvent);

  mockLocation.pathname = '/about';
  firePopstate();
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(JSON.parse(stubRoot.textContent), { page: 'about' });

  resolveAction({ ok: true, stale: true });
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(JSON.parse(stubRoot.textContent), { page: 'about' });
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

// ─── OpenElement (tagName) route: actionData must reach the element ──
// Regression: SPA renderComponent only assigned loaderData to custom
// elements, never actionData. OpenElement pages reading `this.actionData`
// in render() got undefined — so success toasts / validation errors never
// appeared after a form submit. The element must receive actionData as a
// property just like loaderData.

Deno.test('tagName route: actionData is assigned to element after form submit', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const actionResult = { saved: true, message: '笔记已保存' };
  const app = defineApp({
    mode: 'spa',
    routes: [{
      path: '/',
      tagName: 'reader-reading',
      loader: () => Promise.resolve({ book: 'demo', page: 1 }),
      action: () => Promise.resolve(actionResult),
    }] as RouteConfig[],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 0));

  // Initial render: element exists with loaderData, no actionData
  const elAfterLoad = stubRoot.childNodes[0] as StubElement & Record<string, unknown>;
  assertEquals((elAfterLoad as Record<string, unknown>).book, 'demo');
  assertEquals((elAfterLoad as Record<string, unknown>).page, 1);
  assertEquals((elAfterLoad as Record<string, unknown>).actionData, undefined);

  // Simulate form submit
  const form = new StubElement();
  form.tagName = 'FORM';
  const submitEvent = new Event('submit', { cancelable: true });
  Object.defineProperty(submitEvent, 'target', {
    value: form,
    writable: false,
    configurable: true,
  });
  stubRoot.dispatchEvent(submitEvent);
  await new Promise((r) => setTimeout(r, 0));

  // After submit: re-rendered element must have BOTH loaderData AND actionData
  const elAfterSubmit = stubRoot.childNodes[0] as StubElement & Record<string, unknown>;
  assertEquals((elAfterSubmit as Record<string, unknown>).book, 'demo');
  assertEquals(
    (elAfterSubmit as Record<string, unknown>).actionData,
    actionResult,
  );
});

Deno.test('tagName route: no actionData property set on initial GET load', async () => {
  resetMocks({ pathname: '/' });
  stubRoot = new StubElement();
  stubRoot.tagName = 'DIV';

  const app = defineApp({
    mode: 'spa',
    routes: [{
      path: '/',
      tagName: 'reader-reading',
      loader: () => Promise.resolve({ book: 'demo' }),
      // no action defined
    }] as RouteConfig[],
  });

  app.mount('#root');
  await new Promise((r) => setTimeout(r, 0));

  const el = stubRoot.childNodes[0] as StubElement & Record<string, unknown>;
  assertEquals((el as Record<string, unknown>).book, 'demo');
  // actionData should NOT be set on initial load (useActionData returns undefined)
  assertEquals((el as Record<string, unknown>).actionData, undefined);
});
