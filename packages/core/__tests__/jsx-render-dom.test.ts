/**
 * @openelement/core - CSR DOM render tests (ADR-0109 Phase 2).
 */

import { assert, assertEquals, assertExists, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { signal } from './test-utils.ts';
import { For, Fragment, HTML_TAG, jsx, Show } from '../src/jsx-runtime.ts';
import { collectPropBindings, renderToDom } from '../src/jsx-render-dom.ts';
import type { Signal } from '@openelement/protocol/signal';

// ─── Minimal DOM harness (shared pattern with binding-activation.test.ts) ─────

class TestEvent implements Event {
  type: string;
  bubbles: boolean;
  cancelable: boolean;
  composed: boolean;
  defaultPrevented = false;
  target: EventTarget | null = null;
  currentTarget: EventTarget | null = null;
  eventPhase = 0;
  timeStamp = Date.now();
  isTrusted = false;
  cancelBubble = false;
  returnValue = true;
  srcElement = null;

  #stopPropagation = false;
  #stopImmediatePropagation = false;

  constructor(type: string, init?: EventInit) {
    this.type = type;
    this.bubbles = init?.bubbles ?? false;
    this.cancelable = init?.cancelable ?? false;
    this.composed = init?.composed ?? false;
  }

  stopPropagation(): void {
    this.#stopPropagation = true;
    this.cancelBubble = true;
  }

  stopImmediatePropagation(): void {
    this.#stopImmediatePropagation = true;
    this.cancelBubble = true;
  }

  preventDefault(): void {
    this.defaultPrevented = true;
  }

  initEvent(): void {}
  composedPath(): EventTarget[] {
    return [];
  }

  readonly NONE = 0 as const;
  readonly CAPTURING_PHASE = 1 as const;
  readonly AT_TARGET = 2 as const;
  readonly BUBBLING_PHASE = 3 as const;
}

class TestClassList {
  #classes = new Set<string>();

  toggle(token: string, force?: boolean): boolean {
    if (force === true) {
      this.#classes.add(token);
      return true;
    }
    if (force === false) {
      this.#classes.delete(token);
      return false;
    }
    if (this.#classes.has(token)) {
      this.#classes.delete(token);
      return false;
    }
    this.#classes.add(token);
    return true;
  }

  contains(token: string): boolean {
    return this.#classes.has(token);
  }

  add(...tokens: string[]): void {
    for (const t of tokens) this.#classes.add(t);
  }

  remove(...tokens: string[]): void {
    for (const t of tokens) this.#classes.delete(t);
  }

  toString(): string {
    return Array.from(this.#classes).join(' ');
  }
}

class TestStyle {
  #props: Record<string, string> = {};
  cssText = '';
  length = 0;
  parentRule = null;

  setProperty(key: string, value: string): void {
    this.#props[key] = value;
  }

  getPropertyValue(key: string): string {
    return this.#props[key] ?? '';
  }

  removeProperty(key: string): string {
    const prev = this.#props[key] ?? '';
    delete this.#props[key];
    return prev;
  }

  item(): string {
    return '';
  }

  [key: string]: unknown;
}

class TestNode {
  parentNode: TestNode | null = null;
  childNodes: TestNode[] = [];
  nodeType = 0;
  nodeName = '';
  nodeValue: string | null = null;

  get firstChild(): TestNode | null {
    return this.childNodes[0] ?? null;
  }

  get nextSibling(): TestNode | null {
    if (!this.parentNode) return null;
    const idx = this.parentNode.childNodes.indexOf(this);
    return this.parentNode.childNodes[idx + 1] ?? null;
  }

  get previousSibling(): TestNode | null {
    if (!this.parentNode) return null;
    const idx = this.parentNode.childNodes.indexOf(this);
    return this.parentNode.childNodes[idx - 1] ?? null;
  }

  get lastChild(): TestNode | null {
    return this.childNodes.at(-1) ?? null;
  }

  appendChild(child: TestNode): TestNode {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }

  removeChild(child: TestNode): TestNode {
    const idx = this.childNodes.indexOf(child);
    if (idx === -1) {
      throw new Error('Node not found');
    }
    this.childNodes.splice(idx, 1);
    child.parentNode = null;
    return child;
  }

  insertBefore(newChild: TestNode, refChild: TestNode | null): TestNode {
    if (newChild.parentNode) {
      newChild.parentNode.removeChild(newChild);
    }
    if (refChild === null) {
      this.childNodes.push(newChild);
    } else {
      const idx = this.childNodes.indexOf(refChild);
      if (idx === -1) throw new Error('Reference node not found');
      this.childNodes.splice(idx, 0, newChild);
    }
    newChild.parentNode = this;
    return newChild;
  }

  remove(): void {
    this.parentNode?.removeChild(this);
  }

  hasChildNodes(): boolean {
    return this.childNodes.length > 0;
  }

  contains(other: TestNode | null): boolean {
    if (!other) return false;
    let node: TestNode | null = other;
    while (node) {
      if (node === this) return true;
      node = node.parentNode;
    }
    return false;
  }
}

class TestTextNode extends TestNode {
  override nodeType = 3;

  constructor(text = '') {
    super();
    this.nodeValue = text;
  }

  get textContent(): string {
    return this.nodeValue ?? '';
  }

  set textContent(value: string) {
    this.nodeValue = value;
  }
}

class TestComment extends TestTextNode {
  override nodeType = 8;
}

class TestElement extends TestNode {
  tagName: string;
  #attrs = new Map<string, string>();
  classList = new TestClassList();
  style = new TestStyle();
  override nodeType = 1;

  querySelector(selector: string): TestElement | null {
    return this.childNodes
      .filter((c): c is TestElement => c instanceof TestElement)
      .find((c) => c.tagName.toLowerCase() === selector) ?? null;
  }

  querySelectorAll(selector: string): TestElement[] {
    return this.childNodes
      .filter((c): c is TestElement => c instanceof TestElement)
      .filter((c) => c.tagName.toLowerCase() === selector);
  }

  constructor(tag: string) {
    super();
    this.tagName = tag.toUpperCase();
    this.nodeName = this.tagName;
  }

  get textContent(): string {
    return this.childNodes.map((
      c,
    ) => ('textContent' in c ? String((c as TestTextNode).textContent) : '')).join('');
  }

  set textContent(value: string) {
    this.childNodes = [];
    this.appendChild(new TestTextNode(value));
  }

  get innerHTML(): string {
    return this.childNodes
      .map((c) => {
        if (c instanceof TestElement) {
          const attrs = Array.from(c.#attrs.entries())
            .map(([k, v]) => ` ${k}="${v}"`)
            .join('');
          return `<${c.tagName.toLowerCase()}${attrs}>${c.innerHTML}</${c.tagName.toLowerCase()}>`;
        }
        return (c as TestTextNode).textContent ?? '';
      })
      .join('');
  }

  set innerHTML(value: string) {
    this.childNodes = [];
    const tagRe = /<(\w+)(?:\s+class="([^"]*)")?\s*\u003e([\s\S]*?)<\/\1\s*\u003e/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    while ((match = tagRe.exec(value)) !== null) {
      if (match.index > lastIndex) {
        this.appendChild(new TestTextNode(value.slice(lastIndex, match.index)));
      }
      const child = new TestElement(match[1]);
      if (match[2]) {
        for (const cls of match[2].split(' ').filter(Boolean)) {
          child.classList.add(cls);
        }
      }
      child.innerHTML = match[3];
      this.appendChild(child);
      lastIndex = tagRe.lastIndex;
    }
    if (lastIndex < value.length) {
      this.appendChild(new TestTextNode(value.slice(lastIndex)));
    }
  }

  setAttribute(name: string, value: string): void {
    this.#attrs.set(name.toLowerCase(), String(value));
  }

  getAttribute(name: string): string | null {
    return this.#attrs.get(name.toLowerCase()) ?? null;
  }

  removeAttribute(name: string): void {
    this.#attrs.delete(name.toLowerCase());
  }

  hasAttribute(name: string): boolean {
    return this.#attrs.has(name.toLowerCase());
  }

  click(): void {
    this.dispatchEvent(new TestEvent('click', { bubbles: true }) as unknown as Event);
  }

  #listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  addEventListener(
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: unknown,
  ): void {
    const opts = typeof options === 'object' && options !== null
      ? options as AddEventListenerOptions
      : undefined;
    if (opts?.signal) {
      opts.signal.addEventListener('abort', () => this.removeEventListener(type, handler), {
        once: true,
      });
    }
    let set = this.#listeners.get(type);
    if (!set) {
      set = new Set();
      this.#listeners.set(type, set);
    }
    set.add(handler);
  }

  removeEventListener(type: string, handler: EventListenerOrEventListenerObject): void {
    this.#listeners.get(type)?.delete(handler);
  }

  dispatchEvent(event: Event): boolean {
    (event as unknown as TestEvent).target = this as unknown as EventTarget;
    const listeners = this.#listeners.get(event.type);
    if (listeners) {
      for (const h of listeners) {
        if (typeof h === 'function') {
          h.call(this, event);
        } else {
          h.handleEvent(event);
        }
      }
    }
    return !event.defaultPrevented;
  }
}

class TestDocument {
  createElement(tag: string): Element {
    return new TestElement(tag) as unknown as Element;
  }

  createTextNode(text: string): Text {
    return new TestTextNode(text) as unknown as Text;
  }

  createDocumentFragment(): DocumentFragment {
    const frag = new TestNode();
    frag.nodeType = 11;
    return frag as unknown as DocumentFragment;
  }

  createElementNS(_ns: string, tag: string): Element {
    return this.createElement(tag);
  }

  createComment(): Comment {
    return new TestComment() as unknown as Comment;
  }
}

const _savedDocument = (globalThis as unknown as Record<string, unknown>).document;
(globalThis as unknown as Record<string, unknown>).document = new TestDocument();

function asTestElement(el: Element): TestElement {
  return el as unknown as TestElement;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test('renderToDom creates element with static attributes', () => {
  const vnode = jsx('div', { id: 'x', 'data-test': 'foo', children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.tagName.toLowerCase(), 'div');
  assertEquals(el.getAttribute('id'), 'x');
  assertEquals(el.getAttribute('data-test'), 'foo');
});

Deno.test('renderToDom maps className to class attribute', () => {
  const vnode = jsx('span', { className: 'a b', children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.getAttribute('class'), 'a b');
});

Deno.test('renderToDom applies static style descriptor', () => {
  const vnode = jsx('div', { style: { color: 'red', fontSize: 12 }, children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(asTestElement(el).style.getPropertyValue('color'), 'red');
  assertEquals(asTestElement(el).style.getPropertyValue('fontSize'), '12');
});

Deno.test('renderToDom binds click event via descriptor', () => {
  let clicked = false;
  const vnode = jsx('button', { onClick: () => (clicked = true), children: 'hi' });
  const el = renderToDom(vnode) as Element;
  asTestElement(el).click();
  assert(clicked);
});

Deno.test('renderToDom binds dashed custom element events via descriptor', () => {
  let changed = false;
  const vnode = jsx('sl-switch', {
    'on-sl-change': () => (changed = true),
    children: 'Toggle',
  });
  const el = renderToDom(vnode) as Element;

  el.dispatchEvent(new TestEvent('sl-change', { bubbles: true }) as unknown as Event);

  assert(changed);
});

Deno.test('renderToDom binds signal attribute via descriptor', () => {
  const s = signal('a');
  const vnode = jsx('input', { value: s });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.getAttribute('value'), 'a');
  s.value = 'b';
  assertEquals(el.getAttribute('value'), 'b');
});

Deno.test('renderToDom binds signal class as signal-attr descriptor', () => {
  const s = signal(false);
  const div = document.createElement('div');
  // signal-driven className/class props use signal-attr to set the full
  // attribute value. Signal-class toggling is reserved for explicit
  // data-signal-class markers.
  const descriptors = collectPropBindings(div, { className: s, children: [] });
  const attrDesc = descriptors.find((d) => d.kind === 'signal-attr');
  assert(attrDesc, 'expected signal-attr descriptor');
});

Deno.test('renderToDom renders signal child as reactive text node', () => {
  const s = signal('hello');
  const vnode = jsx('p', { children: [s] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.textContent, 'hello');
  s.value = 'world';
  assertEquals(el.textContent, 'world');
});

Deno.test('collectPropBindings emits data-signal marker for registered signal', () => {
  const s = signal(1);
  const registry = new Map<string, Signal<unknown>>([['count', s as Signal<unknown>]]);
  const el = document.createElement('span');
  collectPropBindings(el, { 'data-test': 'x', value: s, children: [] }, registry);
  assertEquals(el.getAttribute('data-signal'), 'count');
});

Deno.test('collectPropBindings skips data-signal for unregistered signal', () => {
  const s = signal(1);
  const el = document.createElement('span');
  collectPropBindings(el, { value: s, children: [] });
  assertFalse(el.hasAttribute('data-signal'));
});

Deno.test('renderToDom passes signalRegistry to nested elements', () => {
  const count = signal(0);
  const registry = new Map<string, Signal<unknown>>([['count', count as Signal<unknown>]]);
  const vnode = jsx('div', { children: [jsx('span', { value: count })] });
  const root = asTestElement(renderToDom(vnode, undefined, undefined, registry) as Element);
  const span = root.querySelector('span');
  assertExists(span);
  assertEquals(span.getAttribute('data-signal'), 'count');
});

Deno.test('renderToDom escapes untrusted innerHTML', () => {
  const vnode = jsx('div', { innerHTML: '<script>xss</script>', children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.textContent, '<script>xss</script>');
});

Deno.test('renderToDom honors trustedHtml innerHTML', () => {
  const vnode = jsx('div', { innerHTML: '<span>trusted</span>', trustedHtml: true, children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(asTestElement(el).innerHTML, '<span>trusted</span>');
});

Deno.test('collectPropBindings includes ref descriptor', () => {
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

Deno.test('collectPropBindings includes boolean descriptor', () => {
  const el = document.createElement('input');
  const descriptors = collectPropBindings(el, { disabled: true, children: [] });
  const boolDesc = descriptors.find((d) => d.kind === 'static-boolean');
  assert(boolDesc);
  assertEquals((boolDesc as { attrName: string }).attrName, 'disabled');
});

Deno.test('renderToDom renders Fragment children without wrapper', () => {
  const vnode = jsx(Fragment, { children: ['a', 'b'] });
  const frag = renderToDom(vnode);
  assertEquals(frag.nodeType, 11);
  assertEquals(asTestElement(frag as unknown as Element).childNodes.length, 2);
});

Deno.test('renderToDom renders trusted HTML_TAG as fragment', () => {
  const vnode = jsx(HTML_TAG, { html: '<span class="x">y</span>', children: [] });
  const frag = renderToDom(vnode);
  assertEquals(frag.nodeType, 11);
  assertEquals(asTestElement(frag as unknown as Element).childNodes.length, 1);
});

Deno.test('renderToDom renders number children as text', () => {
  const vnode = jsx('p', { children: 42 });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.textContent, '42');
});

Deno.test('renderToDom renders null and false as empty text', () => {
  const vnode = jsx('p', { children: [null, false] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.textContent, '');
});

Deno.test('renderToDom returns comment anchor for Show and reacts after mount', () => {
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

Deno.test('renderToDom returns comment anchor for For and reacts after mount', () => {
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

Deno.test('renderToDom creates SVG elements with namespace', () => {
  const vnode = jsx('svg', { children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.tagName.toLowerCase(), 'svg');
});

Deno.test('renderToDom applies textContent prop', () => {
  const vnode = jsx('p', { textContent: 'direct', children: [] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.textContent, 'direct');
});

Deno.test('renderToDom handles component constructor errors gracefully', () => {
  const Bad = class {
    render() {
      throw new Error('boom');
    }
  };
  const vnode = jsx(Bad as unknown as string, { children: [] });
  const node = renderToDom(vnode);
  assertEquals(node.textContent, '');
});

Deno.test('renderToDom handles component function errors gracefully', () => {
  const Bad = () => {
    throw new Error('boom');
  };
  const vnode = jsx(Bad as unknown as string, { children: [] });
  const node = renderToDom(vnode);
  assertEquals(node.textContent, '');
});

Deno.test('restore global document after jsx-render-dom tests', () => {
  // ponytail: this test must remain the last one in the file so the mock
  // document survives every preceding test. A proper per-test harness is
  // overkill for this alpha-cleanup slice.
  (globalThis as unknown as Record<string, unknown>).document = _savedDocument;
});
