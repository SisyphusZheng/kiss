/**
 * @openelement/core — Binding activation tests (ADR-0109 Phase 1).
 */

import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { signal } from './test-utils.ts';
import type {
  BindingDescriptor,
  BindingLifecycle,
  BindingRenderer,
} from '../src/binding-descriptor.ts';
import {
  bindAttr,
  bindClass,
  bindConditional,
  bindEvent,
  bindList,
  bindRef,
  bindRender,
  bindStaticAttr,
  bindStaticBoolean,
  bindStaticProp,
  bindStaticStyle,
  bindText,
} from '../src/binding-descriptor.ts';
import { applyBindingDescriptor, registerBindingKind } from '../src/binding-activation.ts';
import { renderToDom } from '../src/jsx-render-dom.ts';
import { jsx } from '../src/jsx-runtime.ts';

// ─── Minimal DOM harness for Deno test runner ────────────────────────────────

class TestEvent {
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

  get _stopPropagation(): boolean {
    return this.#stopPropagation;
  }

  get _stopImmediatePropagation(): boolean {
    return this.#stopImmediatePropagation;
  }

  initEvent(): void {}
  composedPath(): EventTarget[] {
    return [];
  }
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

  replace(oldToken: string, newToken: string): boolean {
    const had = this.#classes.delete(oldToken);
    this.#classes.add(newToken);
    return had;
  }

  supports(): boolean {
    return false;
  }

  item(index: number): string | null {
    return Array.from(this.#classes)[index] ?? null;
  }

  get length(): number {
    return this.#classes.size;
  }

  value = '';

  forEach(): void {}

  *[Symbol.iterator](): IterableIterator<string> {
    yield* this.#classes.values();
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
    // Minimal parser for the test cases: only handles <tag class="...">...</tag>
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface TestLifecycle extends BindingLifecycle {
  controller: AbortController;
}

function createLifecycle(): TestLifecycle {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    disposers: new Set<() => void>(),
    controller,
  };
}

function asTestElement(el: Element): TestElement {
  return el as unknown as TestElement;
}

// ─── Static bindings ─────────────────────────────────────────────────────────

Deno.test('static-attr applies attribute value', () => {
  const el = document.createElement('div');
  const desc: BindingDescriptor = bindStaticAttr(el, 'data-test', 'hello');
  const dispose = applyBindingDescriptor(desc, {});
  assertEquals(el.getAttribute('data-test'), 'hello');
  dispose();
});

Deno.test('static-boolean toggles boolean attribute', () => {
  const el = document.createElement('input');
  const desc: BindingDescriptor = bindStaticBoolean(el, 'disabled', true);
  applyBindingDescriptor(desc, {});
  assert(el.hasAttribute('disabled'));

  const descOff: BindingDescriptor = bindStaticBoolean(el, 'disabled', false);
  applyBindingDescriptor(descOff, {});
  assertFalse(el.hasAttribute('disabled'));
});

Deno.test('static-style applies CSS properties', () => {
  const el = document.createElement('div');
  const desc: BindingDescriptor = bindStaticStyle(el, { color: 'red', fontSize: '12px' });
  applyBindingDescriptor(desc, {});
  assertEquals(asTestElement(el).style.getPropertyValue('color'), 'red');
  assertEquals(asTestElement(el).style.getPropertyValue('fontSize'), '12px');
});

// ─── Signal bindings ─────────────────────────────────────────────────────────

Deno.test('signal-text updates textContent when signal changes', () => {
  const el = document.createElement('div');
  const s = signal('hello');
  const desc: BindingDescriptor = bindText(el, s);
  applyBindingDescriptor(desc, {});
  assertEquals(el.textContent, 'hello');
  s.value = 'world';
  assertEquals(el.textContent, 'world');
});

Deno.test('signal-text targets a Text node', () => {
  const textNode = document.createTextNode('');
  const s = signal('hello');
  const desc: BindingDescriptor = bindText(textNode, s);
  applyBindingDescriptor(desc, {});
  assertEquals(textNode.textContent, 'hello');
});

Deno.test('signal-class toggles class when signal changes', () => {
  const el = document.createElement('div');
  const s = signal(false);
  const desc: BindingDescriptor = bindClass(el, 'active', s);
  applyBindingDescriptor(desc, {});
  assertFalse(el.classList.contains('active'));
  s.value = true;
  assert(el.classList.contains('active'));
});

Deno.test('signal-attr updates multiple attributes', () => {
  const el = document.createElement('input');
  const s = signal('foo');
  const desc: BindingDescriptor = bindAttr(el, ['value', 'data-x'], s);
  applyBindingDescriptor(desc, {});
  assertEquals(el.getAttribute('value'), 'foo');
  assertEquals(el.getAttribute('data-x'), 'foo');
  s.value = 'bar';
  assertEquals(el.getAttribute('value'), 'bar');
  assertEquals(el.getAttribute('data-x'), 'bar');
});

Deno.test('signal-html escapes untrusted HTML', () => {
  const el = document.createElement('div');
  const s = signal('<script>xss</script>');
  const desc: BindingDescriptor = { kind: 'signal-html', el, signal: s, trusted: false };
  applyBindingDescriptor(desc, {});
  // textContent escapes HTML, so the literal string is preserved without execution.
  assertEquals(el.textContent, '<script>xss</script>');
  assertEquals(asTestElement(el).innerHTML, '<script>xss</script>');
});

Deno.test('signal-html trusts raw HTML when trusted is true', () => {
  const el = document.createElement('div');
  const s = signal('<span>trusted</span>');
  const desc: BindingDescriptor = { kind: 'signal-html', el, signal: s, trusted: true };
  applyBindingDescriptor(desc, {});
  assertEquals(asTestElement(el).innerHTML, '<span>trusted</span>');
});

Deno.test('signal-render renders VNode and updates on signal change', () => {
  const el = document.createElement('div');
  const s = signal({ tag: 'span', props: { className: 'a' }, children: ['A'] });
  const childLifecycle: BindingLifecycle = {};
  const desc: BindingDescriptor = bindRender(el, s as unknown as typeof s, childLifecycle);
  const renderer: BindingRenderer = {
    render: (node, lifecycle) => renderToDom(node, lifecycle),
  };
  applyBindingDescriptor(desc, {}, renderer);
  assertEquals(asTestElement(el).innerHTML, '<span class="a">A</span>');

  s.value = { tag: 'span', props: { className: 'b' }, children: ['B'] };
  assertEquals(asTestElement(el).innerHTML, '<span class="b">B</span>');
});

// ─── Event / ref ─────────────────────────────────────────────────────────────

Deno.test('event binds and unbinds listener', () => {
  const el = document.createElement('button');
  let count = 0;
  const handler = () => count++;
  const desc: BindingDescriptor = bindEvent(el, 'click', handler);
  const dispose = applyBindingDescriptor(desc, {});
  asTestElement(el).click();
  assertEquals(count, 1);
  dispose();
  asTestElement(el).click();
  assertEquals(count, 1);
});

Deno.test('event uses AbortSignal for cleanup', () => {
  const el = document.createElement('button');
  let count = 0;
  const handler = () => count++;
  const lifecycle = createLifecycle();
  const desc: BindingDescriptor = bindEvent(el, 'click', handler);
  applyBindingDescriptor(desc, lifecycle);
  asTestElement(el).click();
  assertEquals(count, 1);
  lifecycle.controller.abort();
  asTestElement(el).click();
  assertEquals(count, 1);
});

Deno.test('ref invokes callback with element', () => {
  const el = document.createElement('div');
  let received: Element | null = null;
  const desc: BindingDescriptor = bindRef(el, (e) => {
    received = e;
  });
  applyBindingDescriptor(desc, {});
  assertEquals(received, el);
});

// ─── Lifecycle / dispose ─────────────────────────────────────────────────────

Deno.test('dispose is registered in lifecycle.disposers', () => {
  const el = document.createElement('div');
  const s = signal('x');
  const lifecycle = createLifecycle();
  const desc: BindingDescriptor = bindText(el, s);
  applyBindingDescriptor(desc, lifecycle);
  assertEquals(lifecycle.disposers!.size, 1);
});

Deno.test('AbortSignal triggers dispose', () => {
  const el = document.createElement('div');
  const s = signal('x');
  const lifecycle = createLifecycle();
  const desc: BindingDescriptor = bindText(el, s);
  applyBindingDescriptor(desc, lifecycle);
  s.value = 'y';
  assertEquals(el.textContent, 'y');
  lifecycle.controller.abort();
  s.value = 'z';
  assertEquals(el.textContent, 'y');
});

Deno.test('event without AbortSignal registers explicit dispose', () => {
  const el = document.createElement('button');
  const handler = () => {};
  const lifecycle: BindingLifecycle = { disposers: new Set() };
  const desc: BindingDescriptor = bindEvent(el, 'click', handler);
  applyBindingDescriptor(desc, lifecycle);
  assertEquals(lifecycle.disposers!.size, 1);
});

Deno.test('static-prop assigns a DOM property', () => {
  const el = document.createElement('input');
  const desc: BindingDescriptor = bindStaticProp(el, 'value', 'hello');
  applyBindingDescriptor(desc, {});
  assertEquals((el as unknown as { value: string }).value, 'hello');
});

Deno.test('signal-attr handles boolean-ish values', () => {
  const el = document.createElement('input');
  const s = signal<string | boolean | null>('x');
  const desc: BindingDescriptor = bindAttr(el, ['value'], s);
  applyBindingDescriptor(desc, {});
  assertEquals(el.getAttribute('value'), 'x');

  s.value = null;
  assertEquals(el.getAttribute('value'), null);

  s.value = true;
  assertEquals(el.getAttribute('value'), '');

  s.value = false;
  assertEquals(el.getAttribute('value'), null);
});

Deno.test('signal-render logs error when renderer is missing', () => {
  const el = document.createElement('div');
  const s = signal({ tag: 'span', props: {}, children: ['A'] });
  const desc: BindingDescriptor = bindRender(el, s as unknown as typeof s, {});
  const dispose = applyBindingDescriptor(desc, {});
  assertEquals(asTestElement(el).innerHTML, '');
  dispose();
});

Deno.test('signal-render renders Fragment array and updates', () => {
  const el = document.createElement('div');
  const s = signal<unknown>([
    { tag: 'span', props: { className: 'a' }, children: ['A'] },
    { tag: 'span', props: { className: 'b' }, children: ['B'] },
  ]);
  const desc: BindingDescriptor = bindRender(el, s as unknown as typeof s, {});
  const renderer: BindingRenderer = {
    render: (node, lifecycle) => renderToDom(node, lifecycle),
  };
  applyBindingDescriptor(desc, {}, renderer);
  assertEquals(asTestElement(el).innerHTML, '<span class="a">A</span><span class="b">B</span>');

  s.value = { tag: 'p', props: {}, children: ['C'] };
  assertEquals(asTestElement(el).innerHTML, '<p>C</p>');
});

Deno.test('event binding supports object options', () => {
  const el = document.createElement('button');
  let count = 0;
  const handler = () => count++;
  const lifecycle: BindingLifecycle = { disposers: new Set() };
  const desc: BindingDescriptor = bindEvent(el, 'click', handler, { once: true, passive: true });
  applyBindingDescriptor(desc, lifecycle);
  asTestElement(el).click();
  assertEquals(count, 1);
});

// ─── Conditional / list bindings ─────────────────────────────────────────────

Deno.test('conditional binding renders truthy branch and reacts', () => {
  const when = signal(true);
  const anchor = document.createComment('show');
  const host = document.createElement('div');
  host.appendChild(anchor);
  const renderer: BindingRenderer = {
    render: (node, lifecycle) => renderToDom(node, lifecycle),
  };
  const desc: BindingDescriptor = bindConditional(
    anchor as ChildNode,
    when,
    () => jsx('span', { children: 'yes' }),
    () => jsx('span', { children: 'no' }),
  );
  applyBindingDescriptor(desc, {}, renderer);
  assertEquals(asTestElement(host).textContent, 'yes');

  when.value = false;
  assertEquals(asTestElement(host).textContent, 'no');

  when.value = true;
  assertEquals(asTestElement(host).textContent, 'yes');
});

Deno.test('conditional binding falls back to falsy branch', () => {
  const when = signal(false);
  const anchor = document.createComment('show');
  const host = document.createElement('div');
  host.appendChild(anchor);
  const renderer: BindingRenderer = {
    render: (node, lifecycle) => renderToDom(node, lifecycle),
  };
  const desc: BindingDescriptor = bindConditional(
    anchor as ChildNode,
    when,
    () => jsx('span', { children: 'yes' }),
    () => jsx('span', { children: 'no' }),
  );
  applyBindingDescriptor(desc, {}, renderer);
  assertEquals(asTestElement(host).textContent, 'no');
});

Deno.test('conditional binding clears content when branch returns null', () => {
  const when = signal(true);
  const anchor = document.createComment('show');
  const host = document.createElement('div');
  host.appendChild(anchor);
  const renderer: BindingRenderer = {
    render: (node, lifecycle) => renderToDom(node, lifecycle),
  };
  const desc: BindingDescriptor = bindConditional(
    anchor as ChildNode,
    when,
    () => jsx('span', { children: 'yes' }),
    () => null,
  );
  applyBindingDescriptor(desc, {}, renderer);
  assertEquals(asTestElement(host).textContent, 'yes');

  when.value = false;
  assertEquals(asTestElement(host).textContent, '');
});

Deno.test('conditional binding disposes nested renders on update', () => {
  const when = signal(true);
  const anchor = document.createComment('show');
  const host = document.createElement('div');
  host.appendChild(anchor);
  const nestedDisposers = new Set<() => void>();
  const renderer: BindingRenderer = {
    render: (node, lifecycle) => renderToDom(node, lifecycle, nestedDisposers),
  };
  const desc: BindingDescriptor = bindConditional(
    anchor as ChildNode,
    when,
    () => jsx('span', { children: 'yes' }),
    () => jsx('span', { children: 'no' }),
  );
  const dispose = applyBindingDescriptor(desc, {}, renderer);
  const initialDisposerCount = nestedDisposers.size;

  when.value = false;
  assertEquals(nestedDisposers.size, initialDisposerCount);

  dispose();
  assertEquals(nestedDisposers.size, 0);
});

Deno.test('list binding renders items and reacts', () => {
  const items = signal(['a', 'b']);
  const anchor = document.createComment('for');
  const host = document.createElement('div');
  host.appendChild(anchor);
  const renderer: BindingRenderer = {
    render: (node, lifecycle) => renderToDom(node, lifecycle),
  };
  const desc: BindingDescriptor = bindList(
    anchor as ChildNode,
    items,
    (item: unknown) => jsx('span', { children: item as string }),
  );
  applyBindingDescriptor(desc, {}, renderer);
  assertEquals(asTestElement(host).textContent, 'ab');

  items.value = ['x', 'y', 'z'];
  assertEquals(asTestElement(host).textContent, 'xyz');
});

Deno.test('list binding ignores non-array items', () => {
  const items = signal('not-an-array');
  const anchor = document.createComment('for');
  const host = document.createElement('div');
  host.appendChild(anchor);
  const renderer: BindingRenderer = {
    render: (node, lifecycle) => renderToDom(node, lifecycle),
  };
  const desc: BindingDescriptor = bindList(
    anchor as ChildNode,
    items,
    (item: unknown) => jsx('span', { children: item as string }),
  );
  applyBindingDescriptor(desc, {}, renderer);
  assertEquals(asTestElement(host).textContent, '');
});

Deno.test('list binding disposes nested renders on update', () => {
  const items = signal(['a']);
  const anchor = document.createComment('for');
  const host = document.createElement('div');
  host.appendChild(anchor);
  const nestedDisposers = new Set<() => void>();
  const renderer: BindingRenderer = {
    render: (node, lifecycle) => renderToDom(node, lifecycle, nestedDisposers),
  };
  const desc: BindingDescriptor = bindList(
    anchor as ChildNode,
    items,
    (item: unknown) => jsx('span', { children: item as string }),
  );
  const dispose = applyBindingDescriptor(desc, {}, renderer);
  const initialDisposerCount = nestedDisposers.size;

  items.value = ['b'];
  assertEquals(nestedDisposers.size, initialDisposerCount);

  dispose();
  assertEquals(nestedDisposers.size, 0);
});

Deno.test('registerBindingKind dispatches custom binding kind', () => {
  const el = document.createElement('div');
  let ran = false;
  const customDispose = () => {};
  const kind = 'custom-test-kind';
  registerBindingKind(kind, (desc, _lifecycle) => {
    ran = true;
    assertEquals((desc as unknown as { el: Element }).el, el);
    return customDispose;
  });
  const desc = { kind, el } as unknown as BindingDescriptor;
  const dispose = applyBindingDescriptor(desc, {});
  assert(ran);
  assertEquals(dispose, customDispose);
});

Deno.test('restore global document after binding-activation tests', () => {
  // ponytail: this test must remain the last one in the file so the mock
  // document survives every preceding test. A proper per-test harness is
  // overkill for this alpha-cleanup slice.
  (globalThis as unknown as Record<string, unknown>).document = _savedDocument;
});
