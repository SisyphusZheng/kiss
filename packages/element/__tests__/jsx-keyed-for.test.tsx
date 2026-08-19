/** @jsxImportSource @openelement/element */
/**
 * jsx-keyed-for.test.tsx — `<For key={fn}>` through the real JSX transform (#1055).
 *
 * The automatic JSX transform (TypeScript/esbuild/swc) passes `key` as the
 * third argument to jsx(), NOT inside props. Before the #1055 fix the
 * function key landed on vnode.key — which has zero readers — so a
 * JSX-written keyed <For> silently degraded to unkeyed full re-renders; only
 * the For({ key }) factory form reached keyed reconciliation. These tests
 * exercise the compiled JSX output end to end: the vnode shape and DOM node
 * identity across a signal-driven reorder.
 *
 * Deno's test runner has no browser DOM, so a minimal DOM harness is
 * installed when globalThis.document is missing (same pattern as
 * open-element.test.ts, trimmed to what renderToDom + the list binding
 * actually touch).
 */

import { assertEquals, assertStrictEquals } from '@std/assert';
import type { VNode } from '../src/internal/protocol/vnode.ts';

// ─── Minimal DOM harness for the Deno test environment ─────────────

class TestNode {
  nodeType = 1;
  parentNode: TestNode | null = null;
  childNodes: TestNode[] = [];

  get firstChild(): TestNode | null {
    return this.childNodes[0] ?? null;
  }

  get nextSibling(): TestNode | null {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    const index = siblings.indexOf(this);
    return index === -1 ? null : siblings[index + 1] ?? null;
  }

  appendChild(child: TestNode): TestNode {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }

  removeChild(child: TestNode): TestNode {
    const idx = this.childNodes.indexOf(child);
    if (idx === -1) throw new Error('Node not found');
    this.childNodes.splice(idx, 1);
    child.parentNode = null;
    return child;
  }

  insertBefore(newChild: TestNode, refChild: TestNode | null): TestNode {
    if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
    if (refChild === null) return this.appendChild(newChild);
    const idx = this.childNodes.indexOf(refChild);
    if (idx === -1) throw new Error('Reference node not found');
    newChild.parentNode = this;
    this.childNodes.splice(idx, 0, newChild);
    return newChild;
  }

  remove(): void {
    this.parentNode?.removeChild(this);
  }

  get textContent(): string {
    return this.childNodes.map((c) => c.textContent).join('');
  }
}

class TestText extends TestNode {
  override nodeType = 3;
  #text: string;

  constructor(text: string) {
    super();
    this.#text = String(text);
  }

  override get textContent(): string {
    return this.#text;
  }

  override set textContent(value: string) {
    this.#text = String(value);
  }
}

class TestComment extends TestNode {
  override nodeType = 8;
  data: string;

  constructor(data: string) {
    super();
    this.data = data;
  }
}

class TestElement extends TestNode {
  localName: string;
  #attributes = new Map<string, string>();

  constructor(tag: string) {
    super();
    this.localName = tag.toLowerCase();
  }

  getAttribute(name: string): string | null {
    return this.#attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.#attributes.set(name, String(value));
  }

  removeAttribute(name: string): void {
    this.#attributes.delete(name);
  }
}

class TestFragment extends TestNode {
  override nodeType = 11;
}

if (typeof globalThis.document === 'undefined') {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: (tag: string) => new TestElement(tag),
      createElementNS: (_ns: string, tag: string) => new TestElement(tag),
      createTextNode: (text: string) => new TestText(text),
      createComment: (data: string) => new TestComment(data),
      createDocumentFragment: () => new TestFragment(),
    },
  });
}

// Imports must happen after the harness is installed, mirroring the ordering
// contract in open-element.test.ts.
const { For, signal } = await import('@openelement/element');
const { renderToDom } = await import('../src/internal/core/jsx-render-dom.ts');

interface Item {
  id: number;
  name: string;
}

const byId = (item: Item) => item.id;

Deno.test('JSX <For key={fn}> routes the key function into props (#1055)', () => {
  const items = signal<Item[]>([{ id: 1, name: 'one' }]);
  const vnode = (
    <For each={items} key={byId}>
      {(item: Item) => <li id={`item-${item.id}`}>{item.name}</li>}
    </For>
  ) as unknown as VNode;

  assertStrictEquals(
    vnode.props.key,
    byId,
    'key fn must reach props.key, which keyed reconciliation reads',
  );
  assertEquals(
    vnode.key,
    undefined,
    'function key must not land on vnode.key (typed string | number)',
  );
});

Deno.test('JSX host element key still lands on vnode.key (#1055)', () => {
  const vnode = <div key='host-1' /> as unknown as VNode;

  assertEquals(vnode.key, 'host-1');
  assertEquals(vnode.props.key, undefined);
});

Deno.test('JSX <For key={fn}> reorder preserves DOM node identity (#1055)', () => {
  const items = signal<Item[]>([
    { id: 1, name: 'one' },
    { id: 2, name: 'two' },
    { id: 3, name: 'three' },
  ]);

  const root = renderToDom(
    <ul>
      <For each={items} key={byId}>
        {(item: Item) => <li id={`item-${item.id}`}>{item.name}</li>}
      </For>
    </ul>,
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const list = container.firstChild as unknown as TestElement;
  const listItems = () =>
    list.childNodes.filter((n) => n.nodeType === 1) as unknown as TestElement[];

  const before = new Map(listItems().map((n) => [n.getAttribute('id'), n]));
  assertEquals([...before.keys()], ['item-1', 'item-2', 'item-3']);

  items.value = [
    { id: 3, name: 'three' },
    { id: 1, name: 'one' },
    { id: 2, name: 'two' },
  ];

  const after = listItems();
  assertEquals(after.map((n) => n.getAttribute('id')), ['item-3', 'item-1', 'item-2']);
  for (const [id, node] of before) {
    assertStrictEquals(
      after.find((n) => n.getAttribute('id') === id),
      node,
      `${id} must keep its DOM node across the reorder; losing it means unkeyed re-render`,
    );
  }
});
