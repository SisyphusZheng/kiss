/**
 * @openelement/core — HydrationScope tests.
 *
 * Verifies that HydrationScope can be imported from @openelement/core/hydrate
 * and used without @openelement/element.
 */

import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { HydrationScope } from '@openelement/core/hydrate';
import { signal } from './test-utils.ts';
import { jsx } from '../src/jsx-runtime.ts';

// ─── Minimal DOM harness for HydrationScope tests ────────────────────────────

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
    if (idx === -1) throw new Error('Node not found');
    this.childNodes.splice(idx, 1);
    child.parentNode = null;
    return child;
  }

  remove(): void {
    this.parentNode?.removeChild(this);
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

class TestElement extends TestNode {
  tagName: string;
  #attrs = new Map<string, string>();
  classList = new TestClassList();
  override nodeType = 1;

  constructor(tag: string) {
    super();
    this.tagName = tag.toUpperCase();
    this.nodeName = this.tagName;
  }

  get textContent(): string {
    return this.childNodes.map((c) => (c as TestTextNode).textContent ?? '').join('');
  }

  set textContent(value: string) {
    this.childNodes = [];
    this.appendChild(new TestTextNode(value));
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

class TestShadowRoot extends TestNode {
  host: TestElement;
  override nodeType = 11;

  constructor(host: TestElement) {
    super();
    this.host = host;
  }

  querySelectorAll(selector: string): TestElement[] {
    const attr = selector.replace(/^\[|\]$/g, '');
    const [name] = attr.split('=');
    const results: TestElement[] = [];
    const visit = (node: TestNode): void => {
      if (node instanceof TestElement) {
        if (node.hasAttribute(name)) results.push(node);
        for (const child of node.childNodes) visit(child);
      }
    };
    for (const child of this.childNodes) visit(child);
    return results;
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
    return new TestNode() as unknown as DocumentFragment;
  }

  createComment(): Comment {
    return new TestTextNode() as unknown as Comment;
  }

  createElementNS(_ns: string, tag: string): Element {
    return this.createElement(tag);
  }
}

const _savedDocument = (globalThis as unknown as Record<string, unknown>).document;
(globalThis as unknown as Record<string, unknown>).document = new TestDocument();

// ponytail: mock rAF so hydration-scope reflow tick runs synchronously in tests.
let rafCallbacks: FrameRequestCallback[] = [];
(globalThis as unknown as Record<string, unknown>).requestAnimationFrame = (cb: FrameRequestCallback) => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
};

function flushRaf(): void {
  const cbs = rafCallbacks;
  rafCallbacks = [];
  for (const cb of cbs) cb(performance.now());
}

function resetDomMocks(): void {
  rafCallbacks = [];
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test('HydrationScope hydrates signal-text marker', () => {
  resetDomMocks();
  const s = signal('hello');
  const registry = new Map([['msg', s as import('@openelement/protocol/signal').Signal<unknown>]]);

  const host = new TestElement('my-el');
  const shadow = new TestShadowRoot(host);
  const el = new TestElement('span');
  el.setAttribute('data-signal', 'msg');
  shadow.appendChild(el);

  const scope = new HydrationScope({ signalRegistry: registry });
  scope.hydrate(shadow as unknown as ShadowRoot);
  flushRaf();

  assertEquals(el.textContent, 'hello');
  s.value = 'world';
  assertEquals(el.textContent, 'world');
  assert(scope.debug.isActive);
  assertEquals(scope.debug.effectCount, 1);

  scope.dispose();
});

Deno.test('HydrationScope dispose clears signal effects', () => {
  resetDomMocks();
  const s = signal('a');
  const registry = new Map([['msg', s as import('@openelement/protocol/signal').Signal<unknown>]]);

  const host = new TestElement('my-el');
  const shadow = new TestShadowRoot(host);
  const el = new TestElement('span');
  el.setAttribute('data-signal', 'msg');
  shadow.appendChild(el);

  const scope = new HydrationScope({ signalRegistry: registry });
  scope.hydrate(shadow as unknown as ShadowRoot);
  flushRaf();

  assertEquals(el.textContent, 'a');
  scope.dispose();
  assertFalse(scope.debug.isActive);
  assertEquals(scope.debug.effectCount, 0);

  s.value = 'b';
  // Effect was disposed; DOM should not update.
  assertEquals(el.textContent, 'a');
});

Deno.test('HydrationScope reset clears bindings without deactivating', () => {
  resetDomMocks();
  const s = signal('a');
  const registry = new Map([['msg', s as import('@openelement/protocol/signal').Signal<unknown>]]);

  const host = new TestElement('my-el');
  const shadow = new TestShadowRoot(host);
  const el = new TestElement('span');
  el.setAttribute('data-signal', 'msg');
  shadow.appendChild(el);

  const scope = new HydrationScope({ signalRegistry: registry });
  scope.hydrate(shadow as unknown as ShadowRoot);
  flushRaf();

  assertEquals(el.textContent, 'a');
  scope.reset();
  assert(scope.debug.isActive, 'scope should stay active after reset');
  assertEquals(scope.debug.effectCount, 0, 'effects should be cleared after reset');

  // Re-hydrate with the same scope; new effect should update the DOM again.
  scope.hydrate(shadow as unknown as ShadowRoot);
  flushRaf();
  s.value = 'b';
  assertEquals(el.textContent, 'b');

  scope.dispose();
});

Deno.test('HydrationScope hydrates event markers without OpenElement', () => {
  resetDomMocks();
  let clicks = 0;
  const vnode = jsx('button', {
    onClick: () => clicks++,
    children: 'Click me',
  });

  const host = new TestElement('my-el');
  const shadow = new TestShadowRoot(host);
  const btn = new TestElement('button');
  btn.setAttribute('data-eid', 'e0');
  btn.appendChild(new TestTextNode('Click me'));
  shadow.appendChild(btn);

  const scope = new HydrationScope({ render: () => vnode });
  scope.hydrate(shadow as unknown as ShadowRoot);
  flushRaf();

  const event = new TestEvent('click') as unknown as Event;
  btn.dispatchEvent(event);
  assertEquals(clicks, 1);

  scope.dispose();
  btn.dispatchEvent(new TestEvent('click') as unknown as Event);
  assertEquals(clicks, 1);
});

Deno.test('HydrationScope imported from @openelement/core/hydrate is a class', () => {
  assertEquals(typeof HydrationScope, 'function');
});

// Restore global document to avoid leaking fake DOM into parallel tests.
Deno.test('restore global document', () => {
  (globalThis as unknown as Record<string, unknown>).document = _savedDocument;
});
