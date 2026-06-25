/**
 * @openelement/core - CSR DOM render tests (ADR-0109 Phase 2).
 */

import { assert, assertEquals, assertExists, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { asTestElement, signal, TestEvent, withMockDocument } from './test-utils.ts';
import { For, Fragment, HTML_TAG, jsx, Show } from '../src/jsx-runtime.ts';
import { collectPropBindings, renderToDom } from '../src/jsx-render-dom.ts';
import type { Signal } from '@openelement/protocol/signal';

function it(name: string, fn: () => void): void {
  Deno.test(name, () => withMockDocument(fn));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

it('renderToDom creates element with static attributes', () => {
  const vnode = jsx('div', { id: 'x', 'data-test': 'foo', children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.tagName.toLowerCase(), 'div');
  assertEquals(el.getAttribute('id'), 'x');
  assertEquals(el.getAttribute('data-test'), 'foo');
});

it('renderToDom maps className to class attribute', () => {
  const vnode = jsx('span', { className: 'a b', children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.getAttribute('class'), 'a b');
});

it('renderToDom applies static style descriptor', () => {
  const vnode = jsx('div', { style: { color: 'red', fontSize: 12 }, children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(asTestElement(el).style.getPropertyValue('color'), 'red');
  assertEquals(asTestElement(el).style.getPropertyValue('fontSize'), '12');
});

it('renderToDom binds click event via descriptor', () => {
  let clicked = false;
  const vnode = jsx('button', { onClick: () => (clicked = true), children: 'hi' });
  const el = renderToDom(vnode) as Element;
  asTestElement(el).click();
  assert(clicked);
});

it('renderToDom binds dashed custom element events via descriptor', () => {
  let changed = false;
  const vnode = jsx('sl-switch', {
    'on-sl-change': () => (changed = true),
    children: 'Toggle',
  });
  const el = renderToDom(vnode) as Element;

  el.dispatchEvent(new TestEvent('sl-change', { bubbles: true }) as unknown as Event);

  assert(changed);
});

it('renderToDom binds signal attribute via descriptor', () => {
  const s = signal('a');
  const vnode = jsx('input', { value: s });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.getAttribute('value'), 'a');
  s.value = 'b';
  assertEquals(el.getAttribute('value'), 'b');
});

it('renderToDom binds signal class as signal-attr descriptor', () => {
  const s = signal(false);
  const div = document.createElement('div');
  // signal-driven className/class props use signal-attr to set the full
  // attribute value. Signal-class toggling is reserved for explicit
  // data-signal-class markers.
  const descriptors = collectPropBindings(div, { className: s, children: [] });
  const attrDesc = descriptors.find((d) => d.kind === 'signal-attr');
  assert(attrDesc, 'expected signal-attr descriptor');
});

it('renderToDom renders signal child as reactive text node', () => {
  const s = signal('hello');
  const vnode = jsx('p', { children: [s] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.textContent, 'hello');
  s.value = 'world';
  assertEquals(el.textContent, 'world');
});

it('collectPropBindings emits data-signal marker for registered signal', () => {
  const s = signal(1);
  const registry = new Map<string, Signal<unknown>>([['count', s as Signal<unknown>]]);
  const el = document.createElement('span');
  collectPropBindings(el, { 'data-test': 'x', value: s, children: [] }, registry);
  assertEquals(el.getAttribute('data-signal'), 'count');
});

it('collectPropBindings skips data-signal for unregistered signal', () => {
  const s = signal(1);
  const el = document.createElement('span');
  collectPropBindings(el, { value: s, children: [] });
  assertFalse(el.hasAttribute('data-signal'));
});

it('renderToDom passes signalRegistry to nested elements', () => {
  const count = signal(0);
  const registry = new Map<string, Signal<unknown>>([['count', count as Signal<unknown>]]);
  const vnode = jsx('div', { children: [jsx('span', { value: count })] });
  const root = asTestElement(renderToDom(vnode, undefined, undefined, registry) as Element);
  const span = root.querySelector('span');
  assertExists(span);
  assertEquals(span.getAttribute('data-signal'), 'count');
});

it('renderToDom escapes untrusted innerHTML', () => {
  const vnode = jsx('div', { innerHTML: '<script>xss</script>', children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.textContent, '<script>xss</script>');
});

it('renderToDom honors trustedHtml innerHTML', () => {
  const vnode = jsx('div', { innerHTML: '<span>trusted</span>', trustedHtml: true, children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(asTestElement(el).innerHTML, '<span>trusted</span>');
});

it('collectPropBindings includes ref descriptor', () => {
  let refEl: Element | null = null;
  const el = document.createElement('div');
  const descriptors = collectPropBindings(
    el,
    { ref: (e: Element) => (refEl = e), children: [] },
  );
  const refDesc = descriptors.find((d) => d.kind === 'ref');
  assert(refDesc);
  (refDesc as Extract<typeof refDesc, { kind: 'ref' }>).callback(el);
  assertEquals(refEl, el);
});

it('collectPropBindings includes boolean descriptor', () => {
  const el = document.createElement('input');
  const descriptors = collectPropBindings(el, { disabled: true, children: [] });
  const boolDesc = descriptors.find((d) => d.kind === 'static-boolean');
  assert(boolDesc);
  assertEquals((boolDesc as { attrName: string }).attrName, 'disabled');
});

it('renderToDom renders Fragment children without wrapper', () => {
  const vnode = jsx(Fragment, { children: ['a', 'b'] });
  const frag = renderToDom(vnode);
  assertEquals(frag.nodeType, 11);
  assertEquals(asTestElement(frag as unknown as Element).childNodes.length, 2);
});

it('renderToDom renders trusted HTML_TAG as fragment', () => {
  const vnode = jsx(HTML_TAG, { html: '<span class="x">y</span>', children: [] });
  const frag = renderToDom(vnode);
  assertEquals(frag.nodeType, 11);
  assertEquals(asTestElement(frag as unknown as Element).childNodes.length, 1);
});

it('renderToDom renders number children as text', () => {
  const vnode = jsx('p', { children: 42 });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.textContent, '42');
});

it('renderToDom renders null and false as empty text', () => {
  const vnode = jsx('p', { children: [null, false] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.textContent, '');
});

it('renderToDom returns comment anchor for Show and reacts after mount', () => {
  const when = signal(true);
  const vnode = jsx(Show, {
    when,
    children: [jsx('span', { children: 'yes' }), jsx('span', { children: 'no' })],
  });
  const anchor = renderToDom(vnode);
  assertEquals(anchor.nodeType, 8);

  const host = document.createElement('div');
  host.appendChild(anchor);
  when.value = false;
  assertEquals(asTestElement(host).textContent, 'no');
  when.value = true;
  assertEquals(asTestElement(host).textContent, 'yes');
});

it('renderToDom returns comment anchor for For and reacts after mount', () => {
  const items = signal(['a', 'b']);
  const vnode = jsx(For, {
    each: items,
    children: [(item: string) => jsx('span', { children: item })],
  });
  const anchor = renderToDom(vnode);
  assertEquals(anchor.nodeType, 8);

  const host = document.createElement('div');
  host.appendChild(anchor);
  items.value = ['x', 'y', 'z'];
  assertEquals(asTestElement(host).textContent, 'xyz');
});

it('renderToDom creates SVG elements with namespace', () => {
  const vnode = jsx('svg', { children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.tagName.toLowerCase(), 'svg');
});

it('renderToDom applies textContent prop', () => {
  const vnode = jsx('p', { textContent: 'direct', children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.textContent, 'direct');
});

it('renderToDom handles component constructor errors gracefully', () => {
  const Bad = class {
    render() {
      throw new Error('boom');
    }
  };
  const vnode = jsx(Bad as unknown as string, { children: [] });
  const node = renderToDom(vnode);
  assertEquals(node.textContent, '');
});

it('renderToDom handles component function errors gracefully', () => {
  const Bad = () => {
    throw new Error('boom');
  };
  const vnode = jsx(Bad as unknown as string, { children: [] });
  const node = renderToDom(vnode);
  assertEquals(node.textContent, '');
});
