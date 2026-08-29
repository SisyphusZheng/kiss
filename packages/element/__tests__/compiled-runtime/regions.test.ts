import { assertEquals, assertNotStrictEquals, assertStrictEquals, assertThrows } from '@std/assert';
import {
  claimExistingDom,
  createFreshDom,
  serializeToHtml,
} from '../../src/internal/compiled/runtime.ts';
import { signal } from '../../src/internal/signal/framework.ts';
import { SIGNAL_BRAND } from '../../src/internal/protocol/signal.ts';
import type { CompiledSpikeHost } from '../../src/internal/compiled/runtime.ts';
import { parseHtml, TestDocument, type TestElement, type TestText, toHtml } from './test-dom.ts';
import { testProgram } from './test-program.ts';

const REGION_PROGRAM = testProgram({
  tag: 'oe-regions',
  template: [{
    k: 'el',
    tag: 'div',
    attrs: [],
    children: [
      { k: 'part', index: 0 },
      { k: 'part', index: 1 },
      { k: 'el', tag: 'ul', attrs: [], children: [{ k: 'part', index: 3 }] },
      { k: 'part', index: 4 },
    ],
  }],
  parts: [
    { k: 'text', index: 0, signal: 'message' },
    {
      k: 'when',
      index: 1,
      signal: 'visible',
      gt: 0,
      on: [{ k: 'el', tag: 'p', attrs: [], children: [{ k: 'part', index: 2 }] }],
      off: [{ k: 'el', tag: 'em', attrs: [], children: [{ k: 'text', value: 'hidden' }] }],
    },
    { k: 'text', index: 2, signal: 'nested' },
    {
      k: 'each',
      index: 3,
      signal: 'items',
      key: 'id',
      field: 'text',
      item: [{ k: 'el', tag: 'li', attrs: [], children: [{ k: 'ival' }] }],
    },
    { k: 'child', index: 4, signal: 'child' },
  ],
});

function regionHost() {
  const message = signal('hello');
  const visible = signal(1);
  const nested = signal('nested');
  const items = signal([
    { id: 'a', text: 'alpha' },
    { id: 'b', text: 'beta' },
  ]);
  const child = signal<unknown>('<child>');
  const host = {
    signals: { message, visible, nested, items, child },
    handlers: {},
  } as unknown as CompiledSpikeHost;
  return { host, message, visible, nested, items, child };
}

function node(element: TestElement): Node {
  return element as unknown as Node;
}

function divOf(root: TestElement): TestElement {
  return root.childNodes[0] as TestElement;
}

Deno.test('Regions own nested lifetimes and keyed identity in fresh DOM', () => {
  const state = regionHost();
  const html = serializeToHtml(REGION_PROGRAM, state.host);
  assertEquals(
    html,
    '<div><!--oe:p0-->hello<!--oe:p1--><p><!--oe:p2-->nested</p><!--oe:/p1-->' +
      '<ul><!--oe:p3--><li>alpha</li><li>beta</li><!--oe:/p3--></ul>' +
      '<!--oe:p4-->&lt;child&gt;<!--oe:/p4--></div>',
  );

  const doc = new TestDocument();
  const root = doc.createElement('host');
  const instance = createFreshDom(REGION_PROGRAM, state.host, node(root));
  const div = divOf(root);
  const paragraph = div.childNodes[3] as TestElement;
  const nestedText = paragraph.childNodes[1] as TestText;
  const list = div.childNodes[5] as TestElement;
  const first = list.childNodes[1] as TestElement;
  const second = list.childNodes[2] as TestElement;
  assertEquals(toHtml(root), `<host>${html}</host>`);

  state.visible.value = 0;
  assertEquals((div.childNodes[3] as TestElement).tagName, 'EM');
  state.nested.value = 'detached';
  assertEquals(nestedText.data, 'nested', 'removed branch text no longer reacts');

  state.visible.value = 1;
  const restoredParagraph = div.childNodes[3] as TestElement;
  assertEquals((restoredParagraph.childNodes[1] as TestText).data, 'detached');

  state.items.value = [
    { id: 'b', text: 'beta' },
    { id: 'a', text: 'ALPHA' },
    { id: 'c', text: 'gamma' },
  ];
  assertStrictEquals(list.childNodes[1], second, 'key b moved with its DOM node');
  assertStrictEquals(list.childNodes[2], first, 'key a moved with its DOM node');
  assertEquals(((list.childNodes[2] as TestElement).childNodes[0] as TestText).data, 'ALPHA');
  assertEquals(((list.childNodes[3] as TestElement).childNodes[0] as TestText).data, 'gamma');

  state.items.value = [{ id: 'a', text: 'ALPHA' }];
  assertStrictEquals(list.childNodes[1], first);
  assertEquals(list.childNodes.length, 3, 'Region retains only its anchors and live entries');

  state.child.value = ['one', 2, null, 'three'];
  assertEquals(div.childNodes[6].nodeType, 8);
  assertEquals((div.childNodes[7] as TestText).data, 'one2three');
  instance.dispose();
  state.message.value = 'disposed';
  assertEquals((div.childNodes[1] as TestText).data, 'hello');
});

Deno.test('unkeyed Regions reuse index-owned nodes and claim preserves identity', () => {
  const program = testProgram({
    tag: 'oe-unkeyed',
    template: [{ k: 'el', tag: 'ul', attrs: [], children: [{ k: 'part', index: 0 }] }],
    parts: [{
      k: 'each',
      index: 0,
      signal: 'items',
      keyed: false,
      item: [{ k: 'el', tag: 'li', attrs: [], children: [{ k: 'ival' }] }],
    }],
  });
  const items = signal(['one', 'two']);
  const host = { signals: { items }, handlers: {} } as unknown as CompiledSpikeHost;
  const ssr = serializeToHtml(program, host);
  assertEquals(ssr, '<ul><!--oe:p0--><li>one</li><li>two</li><!--oe:/p0--></ul>');

  const freshDoc = new TestDocument();
  const freshRoot = freshDoc.createElement('host');
  createFreshDom(program, host, node(freshRoot));
  const freshList = freshRoot.childNodes[0] as TestElement;
  const first = freshList.childNodes[1];
  const second = freshList.childNodes[2];
  items.value = ['TWO', 'ONE'];
  assertStrictEquals(freshList.childNodes[1], first);
  assertStrictEquals(freshList.childNodes[2], second);
  assertEquals(((first as TestElement).childNodes[0] as TestText).data, 'TWO');
  assertEquals(((second as TestElement).childNodes[0] as TestText).data, 'ONE');

  items.value = ['one', 'two'];
  const claimDoc = new TestDocument();
  const claimRoot = parseHtml(claimDoc, ssr);
  const claimList = claimRoot.childNodes[0] as TestElement;
  const claimedFirst = claimList.childNodes[1];
  const claimed = claimExistingDom(program, host, node(claimRoot));
  assertStrictEquals(claimList.childNodes[1], claimedFirst);
  items.value = ['ONE'];
  assertStrictEquals(claimList.childNodes[1], claimedFirst);
  claimed.dispose();
  assertNotStrictEquals(claimList.childNodes[1], undefined);
});

Deno.test('empty dynamic text and child values keep fresh and claim structure aligned', () => {
  const program = testProgram({
    tag: 'oe-empty-regions',
    template: [{
      k: 'el',
      tag: 'div',
      attrs: [],
      children: [{ k: 'part', index: 0 }, { k: 'part', index: 1 }],
    }],
    parts: [
      { k: 'text', index: 0, signal: 'text' },
      { k: 'child', index: 1, signal: 'child' },
    ],
  });
  const text = signal('');
  const child = signal<unknown>(['', null]);
  const host = { signals: { text, child }, handlers: {} } as unknown as CompiledSpikeHost;
  const html = serializeToHtml(program, host);
  assertEquals(html, '<div><!--oe:p0--><!--oe:p1--><!--oe:/p1--></div>');

  const freshDoc = new TestDocument();
  const freshRoot = freshDoc.createElement('host');
  const fresh = createFreshDom(program, host, node(freshRoot));
  assertEquals(toHtml(freshRoot), `<host>${html}</host>`);
  text.value = 'now visible';
  child.value = ['left', 2];
  assertEquals(
    toHtml(freshRoot),
    '<host><div><!--oe:p0-->now visible<!--oe:p1-->left2<!--oe:/p1--></div></host>',
  );

  fresh.dispose();
  text.value = '';
  child.value = ['', null];
  const claimDoc = new TestDocument();
  const claimRoot = parseHtml(claimDoc, html);
  const claimed = claimExistingDom(program, host, node(claimRoot));
  assertEquals(toHtml(claimRoot), `<host>${html}</host>`);
  text.value = 'claimed';
  child.value = 'claimed child';
  assertEquals(
    toHtml(claimRoot),
    '<host><div><!--oe:p0-->claimed<!--oe:p1-->claimed child<!--oe:/p1--></div></host>',
  );
  claimed.dispose();
});

Deno.test('item value slots create their text node when an item becomes non-empty', () => {
  const items = signal([{ id: 'a', text: '' }]);
  const program = testProgram({
    tag: 'oe-item-values',
    template: [{ k: 'el', tag: 'ul', attrs: [], children: [{ k: 'part', index: 0 }] }],
    parts: [{
      k: 'each',
      index: 0,
      signal: 'items',
      key: 'id',
      field: 'text',
      item: [{ k: 'el', tag: 'li', attrs: [], children: [{ k: 'ival' }] }],
    }],
  });
  const host = { signals: { items }, handlers: {} } as unknown as CompiledSpikeHost;
  const doc = new TestDocument();
  const root = doc.createElement('host');
  const fresh = createFreshDom(program, host, node(root));
  assertEquals(
    ((root.childNodes[0] as TestElement).childNodes[1] as TestElement).childNodes.length,
    0,
  );

  items.value = [{ id: 'a', text: 'now visible' }];
  assertEquals(
    toHtml(root),
    '<host><ul><!--oe:p0--><li>now visible</li><!--oe:/p0--></ul></host>',
  );
  items.value = [{ id: 'a', text: '' }];
  assertEquals(
    ((root.childNodes[0] as TestElement).childNodes[1] as TestElement).childNodes.length,
    0,
  );

  fresh.dispose();
  items.value = [{ id: 'a', text: '' }];
  const html = serializeToHtml(program, host);
  const claimDoc = new TestDocument();
  const claimRoot = parseHtml(claimDoc, html);
  const claimed = claimExistingDom(program, host, node(claimRoot));
  assertEquals(
    ((claimRoot.childNodes[0] as TestElement).childNodes[1] as TestElement).childNodes.length,
    0,
  );
  items.value = [{ id: 'a', text: 'claimed visible' }];
  assertEquals(
    toHtml(claimRoot),
    '<host><ul><!--oe:p0--><li>claimed visible</li><!--oe:/p0--></ul></host>',
  );
  items.value = [{ id: 'a', text: '' }];
  assertEquals(
    ((claimRoot.childNodes[0] as TestElement).childNodes[1] as TestElement).childNodes.length,
    0,
  );
  claimed.dispose();
});

Deno.test('direct item value slots keep empty and multi-node item ranges ordered', () => {
  const items = signal([{ id: 'a', text: '' }, { id: 'b', text: 'B' }]);
  const program = testProgram({
    tag: 'oe-direct-item-values',
    template: [{ k: 'el', tag: 'div', attrs: [], children: [{ k: 'part', index: 0 }] }],
    parts: [{
      k: 'each',
      index: 0,
      signal: 'items',
      key: 'id',
      field: 'text',
      item: [{ k: 'text', value: '[' }, { k: 'ival' }, { k: 'text', value: ']' }],
    }],
  });
  const host = { signals: { items }, handlers: {} } as unknown as CompiledSpikeHost;
  const doc = new TestDocument();
  const root = doc.createElement('host');
  const instance = createFreshDom(program, host, node(root));

  assertEquals(toHtml(root), '<host><div><!--oe:p0-->[][B]<!--oe:/p0--></div></host>');
  items.value = [
    { id: 'b', text: '' },
    { id: 'a', text: 'A' },
  ];
  assertEquals(toHtml(root), '<host><div><!--oe:p0-->[][A]<!--oe:/p0--></div></host>');
  items.value = [
    { id: 'a', text: '' },
    { id: 'b', text: 'B' },
  ];
  assertEquals(toHtml(root), '<host><div><!--oe:p0-->[][B]<!--oe:/p0--></div></host>');
  instance.dispose();
});

Deno.test('nested list Regions retain item-slot insertion context after branch swaps', () => {
  const visible = signal(0);
  const items = signal([{ id: 'a', text: '' }]);
  const program = testProgram({
    tag: 'oe-nested-item-values',
    template: [{ k: 'el', tag: 'div', attrs: [], children: [{ k: 'part', index: 0 }] }],
    parts: [
      {
        k: 'when',
        index: 0,
        signal: 'visible',
        gt: 0,
        on: [{ k: 'part', index: 1 }],
        off: [],
      },
      {
        k: 'each',
        index: 1,
        signal: 'items',
        key: 'id',
        field: 'text',
        item: [{ k: 'ival' }],
      },
    ],
  });
  const host = { signals: { visible, items }, handlers: {} } as unknown as CompiledSpikeHost;
  const doc = new TestDocument();
  const root = doc.createElement('host');
  const instance = createFreshDom(program, host, node(root));

  visible.value = 1;
  items.value = [{ id: 'a', text: 'branch value' }];
  assertEquals(
    toHtml(root),
    '<host><div><!--oe:p0--><!--oe:p1-->branch value<!--oe:/p1--><!--oe:/p0--></div></host>',
  );
  visible.value = 0;
  visible.value = 1;
  assertEquals(
    toHtml(root),
    '<host><div><!--oe:p0--><!--oe:p1-->branch value<!--oe:/p1--><!--oe:/p0--></div></host>',
  );
  instance.dispose();
});

Deno.test('a failed item build disposes subscriptions created before the failure', () => {
  const items = signal<unknown[]>([]);
  const goodSource = signal('good');
  let activeGoodSubscriptions = 0;
  const good = {
    [SIGNAL_BRAND]: true as const,
    get value(): string {
      return goodSource.value;
    },
    subscribe(listener: (value: string) => void): () => void {
      activeGoodSubscriptions++;
      const unsubscribe = goodSource.subscribe(listener);
      return () => {
        activeGoodSubscriptions--;
        unsubscribe();
      };
    },
  };
  const program = testProgram({
    tag: 'oe-failed-item',
    template: [{ k: 'el', tag: 'ul', attrs: [], children: [{ k: 'part', index: 0 }] }],
    parts: [
      {
        k: 'each',
        index: 0,
        signal: 'items',
        keyed: false,
        item: [{ k: 'part', index: 1 }, { k: 'part', index: 2 }],
      },
      { k: 'text', index: 1, signal: 'good' },
      { k: 'text', index: 2, signal: 'missing' },
    ],
  });
  const host = {
    signals: { items, good },
    handlers: {},
  } as unknown as CompiledSpikeHost;
  const doc = new TestDocument();
  const root = doc.createElement('host');
  createFreshDom(program, host, node(root));

  assertThrows(() => items.value = [{}], Error, 'missing host signal');
  assertEquals(activeGoodSubscriptions, 0);
});
