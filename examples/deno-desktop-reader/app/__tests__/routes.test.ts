/**
 * Smoke tests for route components.
 * Each route module exports a default function that returns JSX.
 * These tests verify the exports exist and are callable.
 */

import { assert, assertEquals } from '@std/assert';
import type { VNode } from '@openelement/core/static';

// ─── Minimal DOM mock for Deno test environment ──────────────────
// ponytail: inline mock covering only the DOM APIs used by route components.

class MockNode {
  childNodes: MockNode[] = [];
  parentNode: MockNode | null = null;
  textContent: string = '';

  appendChild(child: MockNode): MockNode {
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }
  removeChild(child: MockNode): MockNode {
    const i = this.childNodes.indexOf(child);
    if (i >= 0) this.childNodes.splice(i, 1);
    child.parentNode = null;
    return child;
  }
  remove(): void {
    this.parentNode?.removeChild(this);
  }
}

class MockElement extends MockNode {
  tagName: string;
  _attrs = new Map<string, string>();
  _listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  _value = '';
  _disabled = false;
  className = '';
  style = {
    _props: {} as Record<string, string>,
    setProperty(k: string, v: string) {
      this._props[k] = v;
    },
    getProperty(k: string) {
      return this._props[k] ?? '';
    },
  } as {
    _props: Record<string, string>;
    setProperty(k: string, v: string): void;
    getProperty(k: string): string;
  };

  constructor(tag = 'mock-element') {
    super();
    this.tagName = tag.toUpperCase();
  }

  getAttribute(name: string): string | null {
    return this._attrs.get(name) ?? null;
  }
  setAttribute(name: string, value: string): void {
    this._attrs.set(name, value);
  }
  addEventListener(type: string, fn: (...args: unknown[]) => void): void {
    const list = this._listeners.get(type) ?? [];
    list.push(fn);
    this._listeners.set(type, list);
  }
  click(): void {
    this._listeners.get('click')?.forEach((fn) => fn({ stopPropagation() {} }));
  }
  append(...children: (string | MockNode)[]): void {
    for (const c of children) {
      if (typeof c === 'string') {
        this.appendChild(new MockText(c));
      } else {
        this.appendChild(c);
      }
    }
  }
  get value(): string {
    return this._value;
  }
  set value(v: string) {
    this._value = v;
  }
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(v: boolean) {
    this._disabled = v;
  }
}

class MockText extends MockNode {
  constructor(content: string) {
    super();
    this.textContent = content;
  }
}

class MockDocumentFragment extends MockNode {}

function mockDocument() {
  const body = new MockElement('body');
  const docEl = new MockElement('html');
  return {
    body,
    documentElement: docEl,
    createDocumentFragment(): MockDocumentFragment {
      return new MockDocumentFragment();
    },
    createElement(tag: string): MockElement {
      return new MockElement(tag);
    },
    createTextNode(content: string): MockText {
      return new MockText(content);
    },
    querySelector(_selector: string): MockElement | null {
      return null;
    },
    createTreeWalker() {
      return { nextNode: () => null, currentNode: null };
    },
  };
}

// deno-lint-ignore no-explicit-any
(globalThis as any).document = mockDocument();
// deno-lint-ignore no-explicit-any
(globalThis as any).DocumentFragment = MockDocumentFragment;
// deno-lint-ignore no-explicit-any
(globalThis as any).HTMLElement = MockElement;
const definedCustomElements = new Map<string, CustomElementConstructor>();
// deno-lint-ignore no-explicit-any
(globalThis as any).customElements = {
  get: (tagName: string) => definedCustomElements.get(tagName),
  define: (tagName: string, ctor: CustomElementConstructor) => {
    definedCustomElements.set(tagName, ctor);
  },
};

// Mock localStorage
// deno-lint-ignore no-explicit-any
(globalThis as any).localStorage = {
  _data: {} as Record<string, string>,
  getItem(key: string) {
    return this._data[key] ?? null;
  },
  setItem(key: string, value: string) {
    this._data[key] = value;
  },
  removeItem(key: string) {
    delete this._data[key];
  },
  clear() {
    this._data = {};
  },
};

// Mock window.location and history
// deno-lint-ignore no-explicit-any
(globalThis as any).location = { pathname: '/', search: '', href: '/' };
// deno-lint-ignore no-explicit-any
(globalThis as any).history = {
  pushState: () => {},
  replaceState: () => {},
};
// deno-lint-ignore no-explicit-any
(globalThis as any).window = globalThis;

Deno.test('Bookshelf route exports a function', async () => {
  const mod = await import('../../routes/index.tsx');
  assertEquals(typeof mod.default, 'function');
});

Deno.test('Reading route exports a function', async () => {
  const mod = await import('../../routes/books/[id].tsx');
  assertEquals(typeof mod.default, 'function');
});

Deno.test('Notes route exports a function', async () => {
  const mod = await import('../../routes/notes.tsx');
  assertEquals(typeof mod.default, 'function');
});

Deno.test('Search route exports a function', async () => {
  const mod = await import('../../routes/search.tsx');
  assertEquals(typeof mod.default, 'function');
});

Deno.test('Settings route exports a function', async () => {
  const mod = await import('../../routes/settings.tsx');
  assertEquals(typeof mod.default, 'function');
});

Deno.test('Settings action adds and immediately syncs a source', async () => {
  const mod = await import('../../routes/settings.tsx');
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push(`${init?.method ?? 'GET'} ${url}`);
    if (url === '/api/sources') {
      return Promise.resolve(
        new Response(
          JSON.stringify({ id: 'local-papers', kind: 'local', label: 'Papers' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    }
    if (url === '/api/sources/local-papers/sync') {
      return Promise.resolve(
        new Response(
          JSON.stringify({ source: { id: 'local-papers' }, books: [{ id: 'paper-1' }] }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    }
    return Promise.resolve(new Response('not found', { status: 404 }));
  }) as typeof fetch;

  try {
    const formData = new FormData();
    formData.set('kind', 'local');
    formData.set('label', 'Papers');
    formData.set('root', '/tmp/papers');
    const result = await mod.action({ formData });
    assertEquals(result, { added: 'local-papers', synced: 1 });
    assertEquals(calls, [
      'POST /api/sources',
      'POST /api/sources/local-papers/sync',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test('WC Interop route exports a function', async () => {
  const mod = await import('../../routes/wc-interop.tsx');
  assertEquals(typeof mod.default, 'function');
});

Deno.test('WC Interop route renders third-party, OpenElement UI, and island tags', async () => {
  const mod = await import('../../routes/wc-interop.tsx');
  const page = new mod.default();
  const tags = collectVNodeTags(page.render());

  assert(tags.has('sl-button'));
  assert(tags.has('open-button'));
  assert(tags.has('open-card'));
  assert(tags.has('open-input'));
  assert(tags.has('sync-status-island'));
});

Deno.test('Reader Preact islands register deterministic custom elements', async () => {
  await import('../../islands/note-panel-island.tsx');
  await import('../../islands/pdf-reader-island.tsx');
  await import('../../islands/search-box-island.tsx');
  await import('../../islands/sync-status-island.tsx');

  assertEquals(typeof customElements.get('note-panel-island'), 'function');
  assertEquals(typeof customElements.get('pdf-reader-island'), 'function');
  assertEquals(typeof customElements.get('search-box-island'), 'function');
  assertEquals(typeof customElements.get('sync-status-island'), 'function');
});

function collectVNodeTags(node: unknown, tags = new Set<string>()): Set<string> {
  if (typeof node === 'string' || node == null) return tags;
  if (Array.isArray(node)) {
    for (const child of node) collectVNodeTags(child, tags);
    return tags;
  }
  if (typeof node !== 'object') return tags;

  const vnode = node as Partial<VNode>;
  if (typeof vnode.tag === 'string') tags.add(vnode.tag);
  for (const child of vnode.children ?? []) collectVNodeTags(child, tags);
  return tags;
}
