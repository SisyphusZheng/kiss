/**
 * @openelement/element — ADR-0142 light-mode in-place activation (#1148).
 *
 * Pins the renderer-ownership contract for `renderMode = 'light'` hosts whose
 * SSR subtree carries the `data-oe-light` provenance marker:
 *   - activation binds the surviving SSR DOM in place (node identity kept)
 *   - event, signal, Show, and For markers all activate; keyed lists keep
 *     reconciling the seeded DOM after signal writes
 *   - marker/branch drift emits OPEN_ELEMENT_HYDRATION_MISMATCH (#631) and
 *     degrades to a clean client re-render — binding is never attempted
 *     against misaligned DOM
 *   - a nested light host's subtree is pruned from the parent's marker walk
 *     and binds in the child's own scope
 *   - hosts without the marker keep the clear-and-render CSR path, and
 *     update() remains a full client re-render in both modes
 *   - reconnect with the marker present re-activates the surviving DOM
 *     without duplicating listeners
 *
 * The DOM harness below is a verbatim copy of the one in
 * open-element.test.ts (Deno's runner provides no browser DOM); keep the two
 * in sync when the harness changes.
 */

import { assertEquals, assertExists, assertStrictEquals, assertStringIncludes } from '@std/assert';
import type { Signal, VNode } from '@openelement/element';

// ─── Minimal DOM harness for Deno test environment ─────────────────

type TestNode =
  | TestElement
  | TestTextNode
  | TestCommentNode
  | TestShadowRoot
  | TestDocumentFragment;

class TestEvent {
  type: string;
  bubbles: boolean;
  composed: boolean;
  defaultPrevented = false;
  target: EventTarget | null = null;
  currentTarget: EventTarget | null = null;
  #stopPropagation = false;
  #stopImmediatePropagation = false;

  constructor(type: string, init?: { bubbles?: boolean; composed?: boolean }) {
    this.type = type;
    this.bubbles = init?.bubbles ?? false;
    this.composed = init?.composed ?? false;
  }

  stopPropagation(): void {
    this.#stopPropagation = true;
  }

  stopImmediatePropagation(): void {
    this.#stopImmediatePropagation = true;
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

  toString(): string {
    return Array.from(this.#classes).join(' ');
  }
}

class TestStyle {
  #props: Record<string, string> = {};

  setProperty(key: string, value: string): void {
    this.#props[key] = value;
  }

  getPropertyValue(key: string): string {
    return this.#props[key] ?? '';
  }

  [key: string]: unknown;
}

class TestNodeBase {
  parentNode: TestNode | null = null;
  childNodes: TestNode[] = [];
  #listeners = new Map<string, Set<EventListener>>();

  get firstChild(): TestNode | null {
    return this.childNodes[0] ?? null;
  }

  get nextSibling(): TestNode | null {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    const index = siblings.indexOf(this as unknown as TestNode);
    return index === -1 ? null : siblings[index + 1] ?? null;
  }

  get lastChild(): TestNode | null {
    return this.childNodes.at(-1) ?? null;
  }

  appendChild(child: TestNode): TestNode {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this as unknown as TestNode;
    this.childNodes.push(child);
    if ((this as unknown as { isConnected?: boolean }).isConnected) {
      const element = child as unknown as {
        isConnected?: boolean;
        connectedCallback?(): void;
      };
      element.isConnected = true;
      element.connectedCallback?.();
    }
    return child;
  }

  removeChild(child: TestNode): TestNode {
    const idx = this.childNodes.indexOf(child);
    if (idx === -1) {
      throw new Error('Node not found');
    }
    this.childNodes.splice(idx, 1);
    child.parentNode = null;
    const element = child as unknown as {
      isConnected?: boolean;
      disconnectedCallback?(): void;
    };
    element.isConnected = false;
    element.disconnectedCallback?.();
    return child;
  }

  remove(): void {
    this.parentNode?.removeChild(this as unknown as TestNode);
  }

  replaceChildren(...children: TestNode[]): void {
    for (const child of [...this.childNodes]) {
      this.removeChild(child);
    }
    for (const child of children) {
      this.appendChild(child);
    }
  }

  insertBefore(newChild: TestNode, refChild: TestNode | null): TestNode {
    if (newChild.parentNode) {
      newChild.parentNode.removeChild(newChild);
    }
    if (refChild === null) {
      return this.appendChild(newChild);
    }
    const idx = this.childNodes.indexOf(refChild);
    if (idx === -1) {
      throw new Error('Reference node not found');
    }
    newChild.parentNode = this as unknown as TestNode;
    this.childNodes.splice(idx, 0, newChild);
    return newChild;
  }

  addEventListener(type: string, listener: EventListener): void {
    let set = this.#listeners.get(type);
    if (!set) {
      set = new Set();
      this.#listeners.set(type, set);
    }
    set.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.#listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.#listeners.get(event.type);
    const testEvent = event as unknown as TestEvent;
    for (const listener of listeners ?? []) {
      listener(event);
      if (testEvent._stopImmediatePropagation) break;
    }
    return !event.defaultPrevented;
  }
}

class TestTextNode extends TestNodeBase {
  nodeType = 3;
  #text: string;

  constructor(text: string) {
    super();
    this.#text = String(text);
  }

  get textContent(): string {
    return this.#text;
  }

  set textContent(value: string) {
    this.#text = String(value);
  }

  get data(): string {
    return this.#text;
  }

  set data(value: string) {
    this.#text = String(value);
  }

  get innerHTML(): string {
    return this.#text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

class TestCommentNode extends TestNodeBase {
  nodeType = 8;
  data: string;

  constructor(data: string) {
    super();
    this.data = data;
  }

  get textContent(): string {
    return this.data;
  }

  get innerHTML(): string {
    return `<!--${this.data}-->`;
  }
}

class TestDocumentFragment extends TestNodeBase {
  nodeType = 11;

  get innerHTML(): string {
    return this.childNodes.map((c) => (c as TestElement | TestTextNode).innerHTML ?? '').join('');
  }

  set innerHTML(html: string) {
    while (this.childNodes.length > 0) {
      this.removeChild(this.childNodes[0]);
    }
    for (const node of parseHtmlFragment(html)) {
      this.appendChild(node);
    }
  }
}

class TestShadowRoot extends TestNodeBase {
  nodeType = 11;
  mode: string;
  host: TestElement;
  adoptedStyleSheets: unknown[] = [];

  constructor(host: TestElement, init: ShadowRootInit) {
    super();
    this.host = host;
    this.mode = init.mode;
  }

  querySelector(selector: string): TestElement | null {
    return querySelectorImpl(this.childNodes, selector);
  }

  querySelectorAll(selector: string): TestElement[] {
    return querySelectorAllImpl(this.childNodes, selector);
  }

  get innerHTML(): string {
    return this.childNodes.map((c) => (c as TestElement | TestTextNode).innerHTML ?? '').join('');
  }

  set innerHTML(html: string) {
    while (this.childNodes.length > 0) {
      this.removeChild(this.childNodes[0]);
    }
    for (const node of parseHtmlFragment(html)) {
      this.appendChild(node);
    }
  }
}

class TestElement extends TestNodeBase {
  nodeType = 1;
  tagName: string;
  localName: string;
  #attributes = new Map<string, string>();
  #shadowRoot: TestShadowRoot | null = null;
  classList = new TestClassList();
  style = new Proxy(new TestStyle(), {
    get(target, prop) {
      if (prop === 'setProperty') return target.setProperty.bind(target);
      if (prop === 'getPropertyValue') return target.getPropertyValue.bind(target);
      if (typeof prop === 'string') return target.getPropertyValue(prop);
      return (target as Record<string, unknown>)[prop as unknown as string];
    },
    set(target, prop, value) {
      if (typeof prop === 'string') {
        target.setProperty(prop, String(value));
      }
      return true;
    },
  }) as unknown as CSSStyleDeclaration;
  dataset: Record<string, string> = {};
  private _isConnected = false;

  constructor(
    tag = (new.target as typeof TestElement & { __localName?: string }).__localName ?? 'div',
  ) {
    super();
    this.localName = tag.toLowerCase();
    this.tagName = tag.toUpperCase();
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  set isConnected(value: boolean) {
    this._isConnected = value;
  }

  get shadowRoot(): ShadowRoot | null {
    return this.#shadowRoot as unknown as ShadowRoot | null;
  }

  getAttribute(name: string): string | null {
    return this.#attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    const old = this.#attributes.get(name) ?? null;
    this.#attributes.set(name, String(value));
    const el = this as unknown as HTMLElement & {
      attributeChangedCallback?(n: string, o: string | null, v: string | null): void;
    };
    if (
      this._observedAttributes()?.includes(name) &&
      typeof el.attributeChangedCallback === 'function'
    ) {
      el.attributeChangedCallback(name, old, String(value));
    }
    // v0.41.0: Notify registered MutationObservers (for theme broadcast tests)
    _notifyMutationObservers(this, name);
  }

  /**
   * Define-time snapshot of observedAttributes.
   *
   * Real browsers read `observedAttributes` exactly once, at
   * `customElements.define()`; later mutations have no effect. The harness
   * mirrors that semantics via `_defineTimeObservedAttributes` and only falls
   * back to a live read for constructors that were never registered.
   */
  _observedAttributes(): string[] | undefined {
    const ctor = this.constructor as typeof HTMLElement & { observedAttributes?: string[] };
    return _defineTimeObservedAttributes.get(ctor) ?? ctor.observedAttributes;
  }

  hasAttribute(name: string): boolean {
    return this.#attributes.has(name);
  }

  removeAttribute(name: string): void {
    const old = this.#attributes.get(name) ?? null;
    this.#attributes.delete(name);
    const el = this as unknown as HTMLElement & {
      attributeChangedCallback?(n: string, o: string | null, v: string | null): void;
    };
    if (
      this._observedAttributes()?.includes(name) &&
      typeof el.attributeChangedCallback === 'function'
    ) {
      el.attributeChangedCallback(name, old, null);
    }
    _notifyMutationObservers(this, name);
  }

  attachShadow(init: ShadowRootInit): ShadowRoot {
    const root = new TestShadowRoot(this, init);
    this.#shadowRoot = root;
    return root as unknown as ShadowRoot;
  }

  get innerHTML(): string {
    return this.childNodes.map((c) => {
      if (c instanceof TestTextNode) return c.innerHTML;
      if (c instanceof TestElement) return c.outerHTML;
      if (c instanceof TestDocumentFragment) return c.innerHTML;
      return '';
    }).join('');
  }

  set innerHTML(html: string) {
    while (this.childNodes.length > 0) {
      this.removeChild(this.childNodes[0]);
    }
    const parsed = parseHtmlFragment(html);
    for (const node of parsed) {
      this.appendChild(node);
    }
  }

  get outerHTML(): string {
    const attrs = Array.from(this.#attributes.entries())
      .map(([k, v]) => ` ${k}="${v.replace(/"/g, '&quot;')}"`)
      .join('');
    const children = this.childNodes.map((c) => {
      if (c instanceof TestTextNode) return c.innerHTML;
      if (c instanceof TestElement) return c.outerHTML;
      if (c instanceof TestDocumentFragment) return c.innerHTML;
      return '';
    }).join('');
    return `<${this.localName}${attrs}>${children}</${this.localName}>`;
  }

  get textContent(): string {
    return this.childNodes.map((c) => {
      if (c instanceof TestTextNode) return c.textContent;
      if (c instanceof TestElement) return c.textContent;
      return '';
    }).join('');
  }

  set textContent(value: string) {
    while (this.childNodes.length > 0) {
      this.removeChild(this.childNodes[0]);
    }
    if (value !== '') {
      this.appendChild(new TestTextNode(value));
    }
  }

  querySelector(selector: string): TestElement | null {
    return querySelectorImpl(this.childNodes, selector);
  }

  querySelectorAll(selector: string): TestElement[] {
    return querySelectorAllImpl(this.childNodes, selector);
  }

  getAttributeNames(): string[] {
    return Array.from(this.#attributes.keys());
  }

  attachInternals(): ElementInternals {
    return {
      setFormValue: () => {},
      setValidity: () => {},
      reportValidity: () => true,
      checkValidity: () => true,
      states: new Set(),
    } as unknown as ElementInternals;
  }
}

class TestDocument extends TestNodeBase {
  nodeType = 9;
  documentElement: TestElement;
  body: TestElement;
  head: TestElement;
  adoptedStyleSheets: unknown[] = [];

  constructor() {
    super();
    this.documentElement = this.createElement('html');
    this.head = this.createElement('head');
    this.body = this.createElement('body');
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.documentElement.isConnected = true;
    this.head.isConnected = true;
    this.body.isConnected = true;
  }

  createElement(tag: string): TestElement {
    const ctor = globalThis.customElements?.get(tag) as unknown as
      | (new () => TestElement)
      | undefined;
    if (ctor) return new ctor();
    return new TestElement(tag);
  }

  createElementNS(_ns: string, tag: string): TestElement {
    return new TestElement(tag);
  }

  createTextNode(text: string): TestTextNode {
    return new TestTextNode(text);
  }

  createComment(data: string): TestCommentNode {
    return new TestCommentNode(data);
  }

  createDocumentFragment(): TestDocumentFragment {
    return new TestDocumentFragment();
  }

  querySelector(selector: string): TestElement | null {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector: string): TestElement[] {
    return this.body.querySelectorAll(selector);
  }
}

/**
 * Define-time observedAttributes snapshots (see TestElement._observedAttributes).
 * Keyed by constructor; populated by TestCustomElementRegistry.define().
 */
const _defineTimeObservedAttributes = new WeakMap<object, string[]>();

class TestCustomElementRegistry {
  #defs = new Map<string, CustomElementConstructor>();

  define(name: string, ctor: CustomElementConstructor): void {
    if (this.#defs.has(name)) {
      throw new Error(`CustomElementRegistry already has "${name}" defined.`);
    }
    this.#defs.set(name, ctor);
    // Browsers read observedAttributes exactly once here and never again.
    const observed = (ctor as unknown as { observedAttributes?: string[] }).observedAttributes;
    _defineTimeObservedAttributes.set(ctor, observed ? [...observed] : []);
    (ctor as unknown as { __localName?: string }).__localName = name;
  }

  get(name: string): CustomElementConstructor | undefined {
    return this.#defs.get(name);
  }

  upgrade(element: TestElement): void {
    const ctor = this.#defs.get(element.localName);
    if (!ctor) return;
    Object.setPrototypeOf(element, ctor.prototype);
    const el = element as unknown as HTMLElement & { connectedCallback?(): void };
    if (typeof el.connectedCallback === 'function') {
      el.connectedCallback();
    }
  }
}

function querySelectorImpl(nodes: TestNode[], selector: string): TestElement | null {
  for (const node of nodes) {
    if (node instanceof TestElement) {
      if (matchesSelector(node, selector)) return node;
      const found = node.querySelector(selector);
      if (found) return found;
    }
  }
  return null;
}

function querySelectorAllImpl(nodes: TestNode[], selector: string): TestElement[] {
  const results: TestElement[] = [];
  for (const node of nodes) {
    if (node instanceof TestElement) {
      if (matchesSelector(node, selector)) results.push(node);
      results.push(...node.querySelectorAll(selector));
    }
  }
  return results;
}

function matchesSelector(el: TestElement, selector: string): boolean {
  selector = selector.trim();
  if (selector.startsWith('[') && selector.endsWith(']')) {
    const attr = selector.slice(1, -1);
    return el.hasAttribute(attr);
  }
  if (selector.startsWith('.')) {
    return el.classList.contains(selector.slice(1));
  }
  return el.localName === selector.toLowerCase();
}

function parseHtmlFragment(html: string): TestNode[] {
  const nodes: TestNode[] = [];
  let i = 0;
  while (i < html.length) {
    const open = html.indexOf('<', i);
    if (open === -1) {
      if (i < html.length) {
        nodes.push(new TestTextNode(html.slice(i)));
      }
      break;
    }
    if (open > i) {
      nodes.push(new TestTextNode(html.slice(i, open)));
    }
    const close = html.indexOf('>', open);
    if (close === -1) break;
    const tagContent = html.slice(open + 1, close);
    i = close + 1;

    if (tagContent.startsWith('!--')) {
      // Preserve comments (e.g. SSR oe-branch markers) instead of dropping them.
      const data = tagContent.endsWith('--') ? tagContent.slice(3, -2) : tagContent.slice(3);
      nodes.push(new TestCommentNode(data));
      continue;
    }

    if (tagContent.startsWith('/')) {
      // Closing tag handled by recursive parser
      continue;
    }

    const isClosing = tagContent.endsWith('/');
    const parts = (isClosing ? tagContent.slice(0, -1) : tagContent).split(/\s+/);
    const tag = parts[0];
    const attrs: Record<string, string> = {};
    const attrString = parts.slice(1).join(' ');
    const attrRegex = /([a-zA-Z0-9-:@]+)(?:="([^"]*)"|=([^\s]*))?/g;
    let match: RegExpExecArray | null;
    while ((match = attrRegex.exec(attrString)) !== null) {
      const key = match[1];
      const value = match[2] ?? match[3] ?? '';
      attrs[key] = value;
    }

    if (tag === 'template' && attrs['shadowrootmode']) {
      const template = new TestElement('template');
      for (const [k, v] of Object.entries(attrs)) {
        template.setAttribute(k, v);
      }
      const endTag = `</template>`;
      const endIdx = html.indexOf(endTag, i);
      if (endIdx !== -1) {
        template.innerHTML = html.slice(i, endIdx);
        i = endIdx + endTag.length;
      }
      nodes.push(template);
      continue;
    }

    if (isClosing || ['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tag.toLowerCase())) {
      const el = new TestElement(tag);
      for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, v);
      }
      nodes.push(el);
      continue;
    }

    const { node, nextIndex } = parseElement(html, i, tag, attrs);
    nodes.push(node);
    i = nextIndex;
  }
  return nodes;
}

function parseElement(
  html: string,
  start: number,
  tag: string,
  attrs: Record<string, string>,
): { node: TestElement; nextIndex: number } {
  const el = new TestElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  let i = start;
  const endTag = `</${tag}>`;
  while (i < html.length) {
    const nextOpen = html.indexOf('<', i);
    if (nextOpen === -1) break;
    const nextClose = html.indexOf('>', nextOpen);
    if (nextClose === -1) break;
    const nextTag = html.slice(nextOpen + 1, nextClose);

    if (html.slice(nextOpen, nextOpen + endTag.length).toLowerCase() === endTag.toLowerCase()) {
      if (nextOpen > i) {
        el.appendChild(new TestTextNode(html.slice(i, nextOpen)));
      }
      return { node: el, nextIndex: nextClose + 1 };
    }

    if (nextOpen > i) {
      el.appendChild(new TestTextNode(html.slice(i, nextOpen)));
    }

    if (nextTag.startsWith('!--')) {
      if (nextTag.endsWith('--')) {
        // Comment fully terminated within this segment: advance past its '>'
        // instead of searching for a later '-->' (which would drop siblings).
        el.appendChild(new TestCommentNode(nextTag.slice(3, -2)));
        i = nextClose + 1;
        continue;
      }
      const end = html.indexOf('-->', nextClose);
      el.appendChild(new TestCommentNode(nextTag.slice(3)));
      i = end === -1 ? html.length : end + 3;
      continue;
    }

    const selfClosing = nextTag.endsWith('/');
    const parts = (selfClosing ? nextTag.slice(0, -1) : nextTag).split(/\s+/);
    const childTag = parts[0];
    const childAttrs: Record<string, string> = {};
    const childAttrString = parts.slice(1).join(' ');
    const attrRegex = /([a-zA-Z0-9-:@]+)(?:="([^"]*)"|=([^\s]*))?/g;
    let match: RegExpExecArray | null;
    while ((match = attrRegex.exec(childAttrString)) !== null) {
      const key = match[1];
      const value = match[2] ?? match[3] ?? '';
      childAttrs[key] = value;
    }

    if (
      selfClosing || ['br', 'hr', 'img', 'input', 'meta', 'link'].includes(childTag.toLowerCase())
    ) {
      const child = new TestElement(childTag);
      for (const [k, v] of Object.entries(childAttrs)) {
        child.setAttribute(k, v);
      }
      el.appendChild(child);
      i = nextClose + 1;
      continue;
    }

    const { node: child, nextIndex } = parseElement(html, nextClose + 1, childTag, childAttrs);
    el.appendChild(child);
    i = nextIndex;
  }
  return { node: el, nextIndex: i };
}

// ─── MutationObserver harness (v0.41.0) ──────────────────────────
// Minimal MutationObserver simulation for theme broadcast tests.
// Only supports attribute mutations on observed elements.

interface ObserverRecord {
  callback: (mutations: TestMutationRecord[]) => void;
  target: TestElement;
  options: MutationObserverInit;
}

const _observerRegistry: Set<ObserverRecord> = new Set();

class TestMutationRecord {
  type = 'attributes';
  attributeName: string;
  target: TestElement;
  constructor(target: TestElement, attrName: string) {
    this.target = target;
    this.attributeName = attrName;
  }
}

class TestMutationObserver {
  #callback: (mutations: TestMutationRecord[]) => void;
  #records: ObserverRecord[] = [];

  constructor(callback: (mutations: TestMutationRecord[]) => void) {
    this.#callback = callback;
  }

  observe(target: unknown, options: MutationObserverInit): void {
    const record: ObserverRecord = {
      callback: this.#callback,
      target: target as TestElement,
      options,
    };
    this.#records.push(record);
    _observerRegistry.add(record);
  }

  disconnect(): void {
    for (const r of this.#records) _observerRegistry.delete(r);
    this.#records = [];
  }

  takeRecords(): TestMutationRecord[] {
    return [];
  }
}

function _notifyMutationObservers(target: TestElement, attrName: string): void {
  const records: TestMutationRecord[] = [];
  for (const r of _observerRegistry) {
    if (r.target !== target) continue;
    if (r.options.attributeFilter && !r.options.attributeFilter.includes(attrName)) continue;
    records.push(new TestMutationRecord(target, attrName));
  }
  // Group by callback to mimic real observer batching
  const byCallback = new Map<(m: TestMutationRecord[]) => void, TestMutationRecord[]>();
  for (const r of _observerRegistry) {
    if (r.target !== target) continue;
    if (r.options.attributeFilter && !r.options.attributeFilter.includes(attrName)) continue;
    const existing = byCallback.get(r.callback) ?? [];
    existing.push(new TestMutationRecord(target, attrName));
    byCallback.set(r.callback, existing);
  }
  for (const [cb, recs] of byCallback) {
    cb(recs);
  }
}

let installedHarness = false;
function installDomHarness(): void {
  if (installedHarness || typeof globalThis.HTMLElement !== 'undefined') return;
  installedHarness = true;

  const doc = new TestDocument();
  const registry = new TestCustomElementRegistry();

  Object.defineProperty(globalThis, 'HTMLElement', {
    configurable: true,
    value: TestElement,
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: doc,
  });
  Object.defineProperty(globalThis, 'customElements', {
    configurable: true,
    value: registry,
  });
  Object.defineProperty(globalThis, 'Event', {
    configurable: true,
    value: TestEvent,
  });
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    value: (cb: () => void) => cb(),
  });
  Object.defineProperty(globalThis, 'CSSStyleSheet', {
    configurable: true,
    value: class {
      cssRules: { cssText: string }[] = [];
      replaceSync(text: string): void {
        this.cssRules = text.split('}')
          .map((r) => r.trim())
          .filter((r) => r.length > 0)
          .map((r) => ({ cssText: `${r}}` }));
      }
    },
  });
  Object.defineProperty(globalThis, 'MutationObserver', {
    configurable: true,
    value: TestMutationObserver,
  });
}

installDomHarness();

// Imports must happen after the harness is installed: OpenElement captures its
// HTMLElement base class at module evaluation time.
const { OpenElement } = await import('@openelement/element');
const { renderDsdTree, signal } = await import('@openelement/element');
const { jsx } = await import('@openelement/element/jsx-runtime');
const { For, Show } = await import('../src/internal/core/jsx-runtime.ts');
// Same late capability check as open-element.test.ts: evaluating this at
// module load would predate the harness install.
const hasDOM = typeof customElements !== 'undefined';

// ─── Helpers ───────────────────────────────────────────────────────

function uniqueTag(prefix: string): string {
  return `test-${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function flushEffects(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ─── 1. In-place activation: identity, events, signals ─────────────

Deno.test('light activation preserves SSR node identity and binds event + signal markers (ADR-0142, #1148)', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('light-activate');
  const count = signal(0);
  let clicks = 0;
  let csrRendered = 0;
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        jsx('button', {
          onClick: () => {
            clicks++;
          },
          children: 'inc',
        }),
        jsx('span', { 'data-signal': 'count', children: String(count.value) }),
      ],
    });

  class LightActivateElement extends OpenElement {
    static override renderMode = 'light' as const;
    constructor() {
      super();
      this.registerSignal('count', count as Signal<unknown>);
    }
    override render(): VNode | null {
      return buildVNode();
    }
    override onCsrRendered(): void {
      csrRendered++;
    }
  }
  customElements.define(tagName, LightActivateElement);

  // Generate the SSR markup with the same pipeline the server uses: eids are
  // assigned children-first in traversal order, so the button is e0.
  const ssrHtml = await renderDsdTree(buildVNode());
  assertStringIncludes(ssrHtml, '<button data-eid="e0">inc</button>');
  assertStringIncludes(ssrHtml, '<span data-signal="count">0</span>');

  const el = document.createElement(tagName);
  el.innerHTML = ssrHtml;
  el.setAttribute('data-oe-light', '');
  const buttonBefore = el.querySelector('button');
  const spanBefore = el.querySelector('span');
  assertExists(buttonBefore);
  assertExists(spanBefore);

  document.body.appendChild(el);

  // ADR-0142 rules 3/4: activation binds the existing DOM — no node is
  // replaced, so references captured before the upgrade stay valid.
  assertStrictEquals(el.querySelector('button'), buttonBefore);
  assertStrictEquals(el.querySelector('span'), spanBefore);
  assertEquals(csrRendered, 1, 'light connects fire onCsrRendered on the activation path');

  buttonBefore.dispatchEvent(new Event('click'));
  assertEquals(clicks, 1, 'data-eid handler bound onto the surviving SSR button');

  count.value = 42;
  await flushEffects();
  assertEquals(spanBefore.textContent, '42', 'data-signal binding drives the surviving SSR span');

  document.body.removeChild(el);
});

// ─── 2. Show/For activation + seeded list reconciliation ───────────

Deno.test('light activation binds Show/For markers and reconciles the surviving list DOM (#1148)', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('light-show-for');
  const items = signal([
    { id: 'a', label: 'alpha' },
    { id: 'b', label: 'beta' },
  ]);
  const fired: string[] = [];
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        Show({
          when: true,
          children: [
            jsx('p', { children: 'shown' }),
            jsx('p', { children: 'hidden' }),
          ],
        }),
        For({
          each: items,
          key: (item: { id: string }) => item.id,
          children: (item: { id: string; label: string }) =>
            jsx('button', {
              onClick: () => fired.push(item.label),
              children: item.label,
            }),
        }),
      ],
    });

  class LightShowForElement extends OpenElement {
    static override renderMode = 'light' as const;
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, LightShowForElement);

  const ssrHtml = await renderDsdTree(buildVNode());
  assertStringIncludes(ssrHtml, '<!--oe-branch:show:1-->');
  assertStringIncludes(ssrHtml, '<!--oe-for-item:0-->');
  assertStringIncludes(ssrHtml, '<!--oe-for-item:1-->');
  assertStringIncludes(ssrHtml, '<!--oe-for-end-->');

  const el = document.createElement(tagName);
  el.innerHTML = ssrHtml;
  el.setAttribute('data-oe-light', '');
  const shownBefore = el.querySelector('p');
  const buttonsBefore = [...el.querySelectorAll('button')];
  assertEquals(buttonsBefore.map((b) => b.textContent), ['alpha', 'beta']);

  document.body.appendChild(el);

  // Matched activation keeps every SSR node: the Show content and both
  // For items survive the upgrade.
  assertStrictEquals(el.querySelector('p'), shownBefore);
  const buttonsAfter = [...el.querySelectorAll('button')];
  assertEquals(buttonsAfter.length, 2);
  assertStrictEquals(buttonsAfter[0], buttonsBefore[0]);
  assertStrictEquals(buttonsAfter[1], buttonsBefore[1]);

  // The seeded list binding (#917) reconciles the surviving DOM: pushing a
  // key appends exactly one node and reuses the survivors in place.
  items.value = [...items.value, { id: 'c', label: 'gamma' }];
  await flushEffects();
  const reconciled = [...el.querySelectorAll('button')];
  assertEquals(reconciled.map((b) => b.textContent), ['alpha', 'beta', 'gamma']);
  assertStrictEquals(reconciled[0], buttonsBefore[0], 'surviving item node reused');
  assertStrictEquals(reconciled[1], buttonsBefore[1], 'surviving item node reused');
  reconciled[2].dispatchEvent(new Event('click'));
  assertEquals(fired, ['gamma'], 'appended item carries a live handler');

  document.body.removeChild(el);
});

// ─── 3. Mismatch degrade (ADR-0142 rule 5) ─────────────────────────

Deno.test('light activation degrades to a client render with the mismatch diagnostic on branch drift (#1148)', async () => {
  if (!hasDOM) return;

  const when = signal(true);
  const fired: string[] = [];
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        Show({
          when,
          children: [
            jsx('button', { onClick: () => fired.push('yes'), children: 'yes' }),
            jsx('span', { onClick: () => fired.push('no'), children: 'no' }),
          ],
        }),
      ],
    });

  const ssrHtml = await renderDsdTree(buildVNode());
  assertStringIncludes(ssrHtml, '<!--oe-branch:show:1-->');
  assertStringIncludes(ssrHtml, '<button data-eid="e0">yes</button>');

  // Signal drifts between SSR and the client upgrade: the serialized branch
  // no longer matches the branch the client VNode resolves to.
  when.value = false;

  const tagName = uniqueTag('light-drift');
  class LightDriftElement extends OpenElement {
    static override renderMode = 'light' as const;
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, LightDriftElement);

  const el = document.createElement(tagName);
  el.innerHTML = ssrHtml;
  el.setAttribute('data-oe-light', '');
  const divBefore = el.firstChild;
  assertExists(divBefore);

  // #631: the mismatch diagnostic carries the stable code and structured detail.
  const warns: unknown[][] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => warns.push(args);
  try {
    document.body.appendChild(el);
  } finally {
    console.warn = origWarn;
  }

  assertEquals(warns.length, 1);
  const [message, detail] = warns[0] as [string, {
    reason: string;
    hostTag: string;
    expectedBranches: string[];
    actualBranches: string[];
  }];
  assertStringIncludes(message, 'OPEN_ELEMENT_HYDRATION_MISMATCH');
  assertStringIncludes(message, 'branch-token');
  assertStringIncludes(message, tagName);
  assertEquals(detail.reason, 'branch-token');
  assertEquals(detail.hostTag, tagName);
  assertEquals(detail.expectedBranches, ['oe-branch:show:0']);
  assertEquals(detail.actualBranches, ['oe-branch:show:1']);

  // Rule 5: binding is never attempted against misaligned DOM — the scope
  // degrades to a full client render of the host subtree.
  assertEquals(divBefore.parentNode, null, 'SSR subtree replaced by the degrade path');
  assertEquals(el.querySelector('button'), null);
  const span = el.querySelector('span');
  assertExists(span);
  span.dispatchEvent(new Event('click'));
  assertEquals(fired, ['no'], 'client re-rendered branch carries live bindings');

  document.body.removeChild(el);
});

// ─── 4. Nested light-mode hosts ────────────────────────────────────

Deno.test('nested light-mode hosts activate in their own scopes and keep node identity (#1148)', () => {
  if (!hasDOM) return;

  const childTag = uniqueTag('light-child');
  const parentTag = uniqueTag('light-parent');
  const fired: string[] = [];

  class LightChildElement extends OpenElement {
    static override renderMode = 'light' as const;
    override render(): VNode | null {
      return jsx('button', { onClick: () => fired.push('child'), children: 'child' });
    }
  }
  customElements.define(childTag, LightChildElement);

  class LightParentElement extends OpenElement {
    static override renderMode = 'light' as const;
    override render(): VNode | null {
      return jsx('div', {
        children: [
          jsx('button', { onClick: () => fired.push('parent'), children: 'parent' }),
          jsx(childTag, {}),
        ],
      });
    }
  }
  customElements.define(parentTag, LightParentElement);

  // eid spaces are per registered custom element (a fresh EventMarkerContext
  // per renderDsd), so each scope's only event binding is e0. The parent's
  // VNode walk treats the nested custom element as a host with no host-level
  // events: the child tag itself carries no parent-scope marker.
  const childEl = document.createElement(childTag);
  childEl.innerHTML = '<button data-eid="e0">child</button>';
  childEl.setAttribute('data-oe-light', '');

  const parentEl = document.createElement(parentTag);
  parentEl.innerHTML = '<div><button data-eid="e0">parent</button></div>';
  parentEl.setAttribute('data-oe-light', '');
  const parentButtonBefore = parentEl.querySelector('button');
  const parentDiv = parentEl.querySelector('div');
  assertExists(parentButtonBefore);
  assertExists(parentDiv);
  parentDiv.appendChild(childEl);

  // Parent activation must not warn: the nested host's subtree is pruned
  // from the parent's marker walk (scopeLightHost), so counts line up.
  const warns: unknown[][] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => warns.push(args);
  try {
    document.body.appendChild(parentEl);
  } finally {
    console.warn = origWarn;
  }
  assertEquals(warns.length, 0, 'no hydration mismatch from the nested host markers');

  // ADR-0142 rule 4: nested custom-element instances survive parent
  // activation untouched.
  assertStrictEquals(parentEl.querySelector(childTag), childEl);
  assertStrictEquals(parentEl.querySelector('button'), parentButtonBefore);
  parentButtonBefore.dispatchEvent(new Event('click'));
  assertEquals(fired, ['parent'], 'parent-scope binding live after activation');

  // The harness does not cascade connection into subtrees, so deliver the
  // child's own connection the way the browser would.
  (childEl as unknown as { connectedCallback(): void }).connectedCallback();
  const childButton = childEl.querySelector('button');
  assertExists(childButton);
  childButton.dispatchEvent(new Event('click'));
  assertEquals(fired, ['parent', 'child'], 'child binds its own eid space on its own scope');

  document.body.removeChild(parentEl);
});

// ─── 5. Unmarked light host keeps the CSR path ─────────────────────

Deno.test('light host without data-oe-light keeps the clear-and-render CSR path (#1148)', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('light-csr');
  let clicks = 0;
  class LightCsrElement extends OpenElement {
    static override renderMode = 'light' as const;
    override render(): VNode | null {
      return jsx('button', {
        onClick: () => {
          clicks++;
        },
        children: 'fresh',
      });
    }
  }
  customElements.define(tagName, LightCsrElement);

  // No data-oe-light on the host: pre-ADR-0142 SSR output (or a marker
  // stripped upstream) must keep the historical clear-and-render behavior.
  const el = document.createElement(tagName);
  el.innerHTML = '<p data-eid="e0">stale</p>';
  const staleBefore = el.querySelector('p');
  assertExists(staleBefore);

  const warns: unknown[][] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => warns.push(args);
  try {
    document.body.appendChild(el);
  } finally {
    console.warn = origWarn;
  }

  assertEquals(warns.length, 0, 'CSR path never runs the hydration mismatch diagnostic');
  assertEquals(staleBefore.parentNode, null, 'unmarked host children are cleared');
  assertEquals(el.querySelector('p'), null);
  const button = el.querySelector('button');
  assertExists(button);
  button.dispatchEvent(new Event('click'));
  assertEquals(clicks, 1, 'freshly rendered CSR button carries a live handler');

  document.body.removeChild(el);
});

// ─── 6. Reconnect + update() ───────────────────────────────────────

Deno.test('reconnect re-activates in place without duplicate bindings; update() stays a full re-render (#1148)', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('light-reconnect');
  let clicks = 0;
  const buildVNode = (): VNode =>
    jsx('button', {
      onClick: () => {
        clicks++;
      },
      children: 'go',
    });
  class LightReconnectElement extends OpenElement {
    static override renderMode = 'light' as const;
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, LightReconnectElement);

  const ssrHtml = await renderDsdTree(buildVNode());
  assertStringIncludes(ssrHtml, '<button data-eid="e0">go</button>');

  const el = document.createElement(tagName) as LightReconnectElement;
  el.innerHTML = ssrHtml;
  el.setAttribute('data-oe-light', '');
  document.body.appendChild(el);

  const buttonBefore = el.querySelector('button');
  assertExists(buttonBefore);
  buttonBefore.dispatchEvent(new Event('click'));
  assertEquals(clicks, 1);

  // Disconnect disposes the scope's bindings; a reconnect with the SSR marker
  // present re-activates against the surviving DOM (ADR-0142 reconnect rule).
  document.body.removeChild(el);
  document.body.appendChild(el);
  assertStrictEquals(el.querySelector('button'), buttonBefore, 'SSR node survives reconnect');
  buttonBefore.dispatchEvent(new Event('click'));
  assertEquals(clicks, 2, 'exactly one binding after reconnect — dispose removed the first');

  // update() is always a full client re-render, so the fresh CSR DOM carries
  // no markers; the next reconnect's count diverges and the rule-5 degrade
  // path re-renders cleanly instead of mis-binding.
  el.update();
  const csrButton = el.querySelector('button');
  assertExists(csrButton);

  const warns: unknown[][] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => warns.push(args);
  try {
    document.body.removeChild(el);
    document.body.appendChild(el);
  } finally {
    console.warn = origWarn;
  }
  assertEquals(warns.length, 1);
  const [message, detail] = warns[0] as [string, {
    reason: string;
    expectedMarkers: number;
    actualMarkers: number;
  }];
  assertStringIncludes(message, 'OPEN_ELEMENT_HYDRATION_MISMATCH');
  assertEquals(detail.reason, 'marker-count');
  assertEquals(detail.expectedMarkers, 1);
  assertEquals(detail.actualMarkers, 0);

  const rerendered = el.querySelector('button');
  assertExists(rerendered);
  assertEquals(rerendered === csrButton, false, 'degrade path re-rendered the subtree');
  rerendered.dispatchEvent(new Event('click'));
  assertEquals(clicks, 3, 'bindings live on the degraded re-render');

  document.body.removeChild(el);
});

// ─── 7. Exact marker-ID integrity (ADR-0142 readiness) ─────────────

Deno.test('light activation degrades with marker-id when a duplicated data-eid replaces another at equal count (#1148)', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('light-dup-id');
  const fired: string[] = [];
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        jsx('button', { onClick: () => fired.push('a'), children: 'a' }),
        jsx('button', { onClick: () => fired.push('b'), children: 'b' }),
      ],
    });
  class LightDupIdElement extends OpenElement {
    static override renderMode = 'light' as const;
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, LightDupIdElement);

  const ssrHtml = await renderDsdTree(buildVNode());
  assertStringIncludes(ssrHtml, '<button data-eid="e0">a</button>');
  assertStringIncludes(ssrHtml, '<button data-eid="e1">b</button>');

  const el = document.createElement(tagName);
  // The marker count still matches (2 vs 2), but e1 was replaced by a second
  // e0 — only the exact id-multiset check catches this.
  el.innerHTML = ssrHtml.replace('data-eid="e1"', 'data-eid="e0"');
  el.setAttribute('data-oe-light', '');
  const ssrButtons = [...el.querySelectorAll('button')];
  assertEquals(ssrButtons.length, 2);

  const warns: unknown[][] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => warns.push(args);
  // The DSD layout fix is shadow-only: count rAF callbacks around the upgrade
  // to prove the light degrade path never queues the host (#1148 readiness).
  const rafCallbacks: FrameRequestCallback[] = [];
  const origRaf = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value: (cb: FrameRequestCallback) => rafCallbacks.push(cb),
  });
  try {
    document.body.appendChild(el);
  } finally {
    console.warn = origWarn;
    if (origRaf) Object.defineProperty(globalThis, 'requestAnimationFrame', origRaf);
  }

  assertEquals(warns.length, 1);
  const [message, detail] = warns[0] as [string, {
    reason: string;
    hostTag: string;
    expectedMarkerIds?: string[];
    actualMarkerIds?: string[];
  }];
  assertStringIncludes(message, 'OPEN_ELEMENT_HYDRATION_MISMATCH');
  assertStringIncludes(message, 'marker-id');
  assertStringIncludes(message, tagName);
  // Root-neutral wording: a light host has no shadow root.
  assertStringIncludes(message, 'light DOM subtree');
  assertEquals(message.includes('shadow root'), false);
  assertEquals(detail.reason, 'marker-id');
  assertEquals(detail.hostTag, tagName);
  assertEquals(detail.expectedMarkerIds, ['e0', 'e1']);
  assertEquals(detail.actualMarkerIds, ['e0', 'e0']);
  assertEquals(rafCallbacks.length, 0, 'light degrade path never queues the DSD layout fix');

  // Rule 5: the spoofed DOM is replaced by a clean client render whose
  // bindings are live. clearChildren detaches the root's direct children, so
  // the wrapper div (not the grandchild buttons) loses its parent.
  const ssrDiv = ssrButtons[0].parentNode;
  assertExists(ssrDiv);
  assertEquals(ssrDiv.parentNode, null, 'spoofed SSR DOM replaced by the degrade path');
  const buttons = [...el.querySelectorAll('button')];
  assertEquals(buttons.map((b) => b.textContent), ['a', 'b']);
  assertEquals(
    buttons.every((b) => !ssrButtons.includes(b)),
    true,
    'degrade rendered fresh nodes, spoofed buttons not reused',
  );
  buttons[1].dispatchEvent(new Event('click'));
  assertEquals(fired, ['b'], 'client re-render carries live bindings');

  document.body.removeChild(el);
});

Deno.test('light activation degrades with marker-id on an unknown substituted data-eid (#1148)', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('light-sub-id');
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        jsx('button', { onClick: () => {}, children: 'a' }),
        jsx('button', { onClick: () => {}, children: 'b' }),
      ],
    });
  class LightSubIdElement extends OpenElement {
    static override renderMode = 'light' as const;
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, LightSubIdElement);

  const ssrHtml = await renderDsdTree(buildVNode());
  const el = document.createElement(tagName);
  // Same count, but e1 was substituted by an id the VNode never produced.
  el.innerHTML = ssrHtml.replace('data-eid="e1"', 'data-eid="e9"');
  el.setAttribute('data-oe-light', '');

  const warns: unknown[][] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => warns.push(args);
  try {
    document.body.appendChild(el);
  } finally {
    console.warn = origWarn;
  }

  assertEquals(warns.length, 1);
  const [, detail] = warns[0] as [string, {
    reason: string;
    expectedMarkerIds?: string[];
    actualMarkerIds?: string[];
  }];
  assertEquals(detail.reason, 'marker-id');
  assertEquals(detail.expectedMarkerIds, ['e0', 'e1']);
  assertEquals(detail.actualMarkerIds, ['e0', 'e9']);

  document.body.removeChild(el);
});

Deno.test('light activation accepts a reordered-but-complete data-eid set — bindings are id-keyed (#1148)', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('light-reorder');
  const fired: string[] = [];
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        jsx('button', { onClick: () => fired.push('a'), children: 'a' }),
        jsx('button', { onClick: () => fired.push('b'), children: 'b' }),
      ],
    });
  class LightReorderElement extends OpenElement {
    static override renderMode = 'light' as const;
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, LightReorderElement);

  const ssrHtml = await renderDsdTree(buildVNode());
  assertStringIncludes(ssrHtml, '<button data-eid="e0">a</button>');
  assertStringIncludes(ssrHtml, '<button data-eid="e1">b</button>');

  // Swap the two buttons WITH their markers: the id set is complete, only the
  // document order differs. Id-keyed binding must follow the marker, and no
  // degrade may fire.
  const el = document.createElement(tagName);
  el.innerHTML = '<div><button data-eid="e1">b</button><button data-eid="e0">a</button></div>';
  el.setAttribute('data-oe-light', '');
  const bBefore = el.querySelectorAll('button')[0];
  const aBefore = el.querySelectorAll('button')[1];
  assertExists(bBefore);
  assertExists(aBefore);

  const warns: unknown[][] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => warns.push(args);
  try {
    document.body.appendChild(el);
  } finally {
    console.warn = origWarn;
  }
  assertEquals(warns.length, 0, 'reordered ids still match — no degrade');

  const buttonsAfter = [...el.querySelectorAll('button')];
  assertStrictEquals(buttonsAfter[0], bBefore, 'matched activation keeps node identity');
  assertStrictEquals(buttonsAfter[1], aBefore);
  bBefore.dispatchEvent(new Event('click'));
  assertEquals(fired, ['b'], 'binding follows the data-eid marker, not the position');
  aBefore.dispatchEvent(new Event('click'));
  assertEquals(fired, ['b', 'a']);

  document.body.removeChild(el);
});

// ─── 8. Marker spoofing degrades safely ────────────────────────────

Deno.test('a hand-authored data-oe-light host whose DOM does not match degrades safely (#1148)', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('light-spoof');
  let clicks = 0;
  class LightSpoofElement extends OpenElement {
    static override renderMode = 'light' as const;
    override render(): VNode | null {
      return jsx('button', {
        onClick: () => {
          clicks++;
        },
        children: 'real',
      });
    }
  }
  customElements.define(tagName, LightSpoofElement);

  // Spoofed provenance: the marker attribute is hand-authored and the subtree
  // was never produced by this component's SSR pipeline (extra marker, wrong
  // content). Activation must degrade via the structured diagnostic instead
  // of binding against the foreign DOM.
  const el = document.createElement(tagName);
  el.innerHTML = '<div><button data-eid="e0">fake</button><span data-eid="e1">extra</span></div>';
  el.setAttribute('data-oe-light', '');
  const spoofedSubtree = el.querySelector('div');
  assertExists(spoofedSubtree);

  const warns: unknown[][] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => warns.push(args);
  try {
    // No exception may escape renderOrHydrateOpenElement through the upgrade.
    document.body.appendChild(el);
  } finally {
    console.warn = origWarn;
  }

  assertEquals(warns.length, 1);
  const [message, detail] = warns[0] as [string, { reason: string; hostTag: string }];
  assertStringIncludes(message, 'OPEN_ELEMENT_HYDRATION_MISMATCH');
  assertEquals(detail.reason, 'marker-count');
  assertEquals(detail.hostTag, tagName);

  // The host ends on clean client-rendered DOM: spoofed nodes are gone, the
  // marker attribute is never removed (ADR-0142), and bindings are live.
  assertEquals(spoofedSubtree.parentNode, null, 'spoofed subtree replaced');
  assertEquals(el.hasAttribute('data-oe-light'), true, 'provenance marker is never removed');
  const button = el.querySelector('button');
  assertExists(button);
  assertEquals(button.textContent, 'real');
  button.dispatchEvent(new Event('click'));
  assertEquals(clicks, 1, 'client-rendered button carries a live handler');

  document.body.removeChild(el);
});
