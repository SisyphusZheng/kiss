/**
 * Smoke tests for route components.
 * Tests verify route exports, VNode tag structure, and custom element
 * registration.
 */

import { assert, assertEquals } from '@std/assert';
import type { VNode } from '@openelement/element';

// ─── Minimal DOM mock for Deno test environment ──────────────────
// Covers only the DOM APIs the route components actually touch:
// an HTMLElement base class for the OpenElement page classes, and an
// in-memory customElements registry for the module-level
// `customElements.define(tag, Page)` side effects (including Shoelace's
// sl-button in wc-interop). Rendering is asserted on pure VNode output,
// so no document/location/localStorage doubles are needed — lit-html
// (Shoelace's renderer) uses its own SSR stub when `document` is
// undefined.

class MockElement {
  tagName: string;

  constructor(tag = 'mock-element') {
    this.tagName = tag.toUpperCase();
  }
}

// deno-lint-ignore no-explicit-any
(globalThis as any).HTMLElement = MockElement;
/** In-memory registry backing the customElements mock. */
const definedCustomElements = new Map<string, CustomElementConstructor>();
// deno-lint-ignore no-explicit-any
(globalThis as any).customElements = {
  get: (tagName: string) => definedCustomElements.get(tagName),
  define: (tagName: string, ctor: CustomElementConstructor) => {
    definedCustomElements.set(tagName, ctor);
  },
};

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

Deno.test('Settings source form submits only through the route action (#1064)', async () => {
  const mod = await import('../../routes/settings.tsx');
  const page = new mod.default();
  (page as unknown as Record<string, unknown>).sources = [];
  const sourceForm = findVNode(
    page.render(),
    (node) => node.tag === 'form' && node.props.class === 'source-form',
  );
  assert(sourceForm, 'source form should render');
  // A JSX onSubmit would re-run addSource/syncSource on top of the route
  // action dispatched by the open-button submit (#1064).
  assertEquals('onSubmit' in sourceForm.props, false);
});

function findVNode(node: unknown, match: (node: VNode) => boolean): VNode | null {
  if (node === null || node === undefined || typeof node === 'string') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findVNode(child, match);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== 'object') return null;
  const vnode = node as VNode;
  if (match(vnode)) return vnode;
  for (const child of vnode.children) {
    if (typeof child === 'function') continue;
    const found = findVNode(child, match);
    if (found) return found;
  }
  return null;
}

Deno.test('WC Interop route exports a function', async () => {
  const mod = await import('../../routes/wc-interop.tsx');
  assertEquals(typeof mod.default, 'function');
});

Deno.test('WC Interop route renders third-party, OpenElement UI, and island tags', async () => {
  const mod = await import('../../routes/wc-interop.tsx');
  // Inspect pure VNode output; this test does not need DOM rendering.
  const page = new mod.default();
  const tags = collectElementTags(page.render());

  const expectedTags = [
    'sl-button',
    'open-button',
    'open-card',
    'open-input',
    'sync-status-island',
  ];
  const missingTags = expectedTags.filter((tag) => !tags.has(tag));
  assertEquals(missingTags, []);
});

Deno.test('Shoelace sl-button registers via route side-effect import', async () => {
  await import('../../routes/wc-interop.tsx');
  assertEquals(typeof customElements.get('sl-button'), 'function');
});

Deno.test('Reader Preact islands register deterministic custom elements', async () => {
  await Promise.all([
    import('../../islands/pdf-reader-island.tsx'),
    import('../../islands/search-box-island.tsx'),
    import('../../islands/sync-status-island.tsx'),
  ]);

  assertEquals(typeof customElements.get('pdf-reader-island'), 'function');
  assertEquals(typeof customElements.get('search-box-island'), 'function');
  assertEquals(typeof customElements.get('sync-status-island'), 'function');
});

Deno.test('Bookshelf action surfaces sync errors instead of throwing', async () => {
  const mod = await import('../../routes/index.tsx');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response('boom', { status: 500 }));

  try {
    const result = await mod.action({ formData: new FormData() });
    assertEquals(typeof result.error, 'string');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test('Bookshelf renders a large library without hanging', async () => {
  const mod = await import('../../routes/index.tsx');
  const page = new mod.default();
  const books = Array.from({ length: 500 }, (_, i) => ({
    id: `book-${i}`,
    title: `Book ${i}`,
    author: 'Author',
    coverUrl: '',
    sourceId: 'fixtures',
  }));
  (page as unknown as Record<string, unknown>).books = books;
  (page as unknown as Record<string, unknown>).progressByBook = {};
  (page as unknown as Record<string, unknown>).sources = [];

  const start = performance.now();
  const vnode = page.render();
  const elapsed = performance.now() - start;

  assert(vnode !== null && typeof vnode === 'object', 'render should return a non-null VNode');
  assert(
    (vnode as VNode).children.length > 1,
    'large library render should produce multiple children',
  );
  assertEquals(elapsed < 1000, true, `Large bookshelf render took ${elapsed}ms`);
});

function collectElementTags(node: unknown, tags = new Set<string>()): Set<string> {
  if (node === null || node === undefined || typeof node === 'string') return tags;
  if (Array.isArray(node)) {
    for (const child of node) collectElementTags(child, tags);
    return tags;
  }
  if (typeof node !== 'object') return tags;

  const vnode = node as VNode;
  if (typeof vnode.tag === 'string') tags.add(vnode.tag);
  for (const child of vnode.children) {
    if (typeof child === 'function') continue;
    collectElementTags(child, tags);
  }
  return tags;
}
