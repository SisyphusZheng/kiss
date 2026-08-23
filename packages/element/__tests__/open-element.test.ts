/**
 * @openelement/element — OpenElement base class unit tests.
 *
 * Covers the core lifecycle and rendering contracts of OpenElement:
 *   - instantiation and base static properties
 *   - shadow DOM default rendering
 *   - light DOM opt-in
 *   - DSD hydration path
 *   - CSR path
 *   - static styles / adoptedStyleSheets
 *   - signal-driven re-rendering
 *   - event binding and hydration
 *   - static props reactivity
 *   - onRenderError fallback
 *   - formAssociated / ElementInternals
 *   - params attribute parsing
 *
 * Deno's test runner does not provide a real browser DOM, so the file installs
 * a minimal DOM harness when `globalThis.HTMLElement` is missing. The harness
 * is installed before the test capability is evaluated, so lifecycle tests
 * exercise the same contract in both Deno and a browser-capable runtime.
 */

import { assertEquals, assertExists, assertInstanceOf, assertStringIncludes } from '@std/assert';
import type { OpenElement as OpenElementBase } from '@openelement/element';
import type { OpenElementError } from '@openelement/element';
import type { VNode } from '@openelement/element';
import type { Signal } from '@openelement/element';

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
const { OpenElement, ErrorBoundary } = await import('@openelement/element');
const { defineElement } = await import('@openelement/element');
const { jsx } = await import('@openelement/element/jsx-runtime');
const { effect, signal } = await import('@openelement/element');
const { StyleSheet } = await import('@openelement/element');
const { renderDsd, renderDsdTree } = await import('@openelement/element');
const { Show, For } = await import('../src/internal/core/jsx-runtime.ts');
const { renderToDom } = await import('../src/internal/core/jsx-render-dom.ts');
import type { BindingLifecycle } from '../src/internal/core/binding-descriptor.ts';
// Deliberately evaluate this after installing the Deno harness. Evaluating it
// at module load used to make every DOM lifecycle test silently return early.
const hasDOM = typeof customElements !== 'undefined';

// ─── Helpers ───────────────────────────────────────────────────────

function uniqueTag(prefix: string): string {
  return `test-${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function flushEffects(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createHydratedElement(tagName: string, html: string): HTMLElement {
  const element = document.createElement(tagName) as HTMLElement;
  const root = element.attachShadow({ mode: 'open' }) as unknown as TestShadowRoot;
  (root as unknown as { innerHTML: string }).innerHTML = html;
  document.body.appendChild(element as unknown as Node);
  return element;
}

Deno.test('defineElement function-mode render reacts to signal reads (#940)', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('fn-reactive');
  const count = signal(0);
  defineElement(tagName, {
    render: () => jsx('output', { children: String(count.value) }),
  });

  const el = document.createElement(tagName) as HTMLElement;
  document.body.appendChild(el);

  const shadowRoot = el.shadowRoot as unknown as TestShadowRoot;
  assertStringIncludes(shadowRoot.innerHTML, '0');

  count.value = 7;
  await flushEffects();
  assertStringIncludes(shadowRoot.innerHTML, '7');

  // The tracking effect must be disposed on disconnect: a later signal change
  // must not re-render a detached element.
  document.body.removeChild(el);
  count.value = 9;
  await flushEffects();
  assertStringIncludes(shadowRoot.innerHTML, '7');
});

// ─── 1. Instantiation and base properties ──────────────────────────

Deno.test('OpenElement is instantiable', () => {
  const el = new OpenElement();
  assertInstanceOf(el, OpenElement);
});

Deno.test('OpenElement.render() returns null by default', () => {
  const el = new OpenElement();
  assertEquals(el.render(), null);
});

Deno.test('OpenElement exposes base static contract', () => {
  assertEquals(OpenElement.renderMode, undefined);
  assertEquals(OpenElement.formAssociated, undefined);
  assertEquals(OpenElement.delegatesFocus, undefined);
});

// ─── 2. Shadow DOM default rendering ───────────────────────────────

Deno.test('OpenElement creates a shadow root and renders by default', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('shadow-default');
  class ShadowElement extends OpenElement {
    override render(): VNode | null {
      return jsx('p', { children: 'shadow content' });
    }
  }
  customElements.define(tagName, ShadowElement);

  const el = document.createElement(tagName) as ShadowElement;
  document.body.appendChild(el);

  assertExists(el.shadowRoot);
  assertStringIncludes((el.shadowRoot as unknown as TestShadowRoot).innerHTML, 'shadow content');

  document.body.removeChild(el);
});

// ─── 3. Light DOM explicit opt-in ──────────────────────────────────

Deno.test('OpenElement keeps explicit light DOM opt-in behavior', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('open-element-light');
  class LightOpenElement extends OpenElement {
    static override renderMode = 'light' as const;

    override render(): VNode | null {
      return jsx('span', { children: 'open light' });
    }
  }
  customElements.define(tagName, LightOpenElement);

  const el = document.createElement(tagName) as LightOpenElement;
  document.body.appendChild(el);

  assertEquals(el.shadowRoot, null);
  assertEquals(el.innerHTML, '<span>open light</span>');

  document.body.removeChild(el);
});

Deno.test('OpenElement light DOM updates via update()', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('light-update');
  let value = 'a';
  class LightUpdateElement extends OpenElement {
    static override renderMode = 'light' as const;

    override render(): VNode | null {
      return jsx('em', { children: value });
    }
  }
  customElements.define(tagName, LightUpdateElement);

  const el = document.createElement(tagName) as LightUpdateElement;
  document.body.appendChild(el);
  assertEquals(el.innerHTML, '<em>a</em>');

  value = 'b';
  el.update();
  assertEquals(el.innerHTML, '<em>b</em>');

  document.body.removeChild(el);
});

// ─── 4. DSD hydration path ─────────────────────────────────────────

Deno.test('OpenElement hydrates pre-populated DSD shadow DOM', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('dsd-hydrate');
  let hydrated = false;
  class DsdElement extends OpenElement {
    override render(): VNode | null {
      return jsx('section', { children: 'dsd content' });
    }

    protected override onDsdHydrated(): void {
      hydrated = true;
    }
  }
  customElements.define(tagName, DsdElement);

  const el = createHydratedElement(tagName, '<section>dsd content</section>') as DsdElement;

  assertExists(el.shadowRoot);
  assertStringIncludes((el.shadowRoot as unknown as TestShadowRoot).innerHTML, 'dsd content');
  assertEquals(hydrated, true);
});

// ─── 5. CSR path ───────────────────────────────────────────────────

Deno.test('OpenElement CSR path creates shadow root and calls onCsrRendered', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('csr');
  let rendered = false;
  class CsrElement extends OpenElement {
    override render(): VNode | null {
      return jsx('div', { children: 'csr content' });
    }

    protected override onCsrRendered(): void {
      rendered = true;
    }
  }
  customElements.define(tagName, CsrElement);

  const el = document.createElement(tagName) as CsrElement;
  document.body.appendChild(el);

  assertExists(el.shadowRoot);
  assertStringIncludes((el.shadowRoot as unknown as TestShadowRoot).innerHTML, 'csr content');
  assertEquals(rendered, true);

  document.body.removeChild(el);
});

// ─── 6. Static styles / adoptedStyleSheets ─────────────────────────

Deno.test('OpenElement applies static styles via adoptedStyleSheets', () => {
  if (!hasDOM) return;

  const sheet = new StyleSheet();
  sheet.replaceSync(':host { display: block; }');

  const tagName = uniqueTag('styled');
  class StyledElement extends OpenElement {
    static override styles = sheet;

    override render(): VNode | null {
      return jsx('b', { children: 'styled' });
    }
  }
  customElements.define(tagName, StyledElement);

  const el = document.createElement(tagName) as StyledElement;
  document.body.appendChild(el);

  const root = el.shadowRoot as unknown as TestShadowRoot;
  assertExists(root);
  assertEquals(root.adoptedStyleSheets.length, 1);
  assertEquals(root.adoptedStyleSheets[0], sheet);

  document.body.removeChild(el);
});

// ─── 7. Signal-driven re-rendering ─────────────────────────────────

Deno.test('OpenElement re-renders when a signal value changes', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('signal-render');
  const count = signal(0);
  class SignalElement extends OpenElement {
    override render(): VNode | null {
      return jsx('output', { children: String(count.value) });
    }
  }
  customElements.define(tagName, SignalElement);

  const el = document.createElement(tagName) as SignalElement;
  document.body.appendChild(el);

  assertStringIncludes((el.shadowRoot as unknown as TestShadowRoot).innerHTML, '0');

  count.value = 1;
  await flushEffects();
  el.update();

  assertStringIncludes((el.shadowRoot as unknown as TestShadowRoot).innerHTML, '1');

  document.body.removeChild(el);
});

Deno.test('OpenElement signal hydration binds data-signal markers', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('signal-hydrate');
  const count = signal(42);
  class SignalHydrateElement extends OpenElement {
    constructor() {
      super();
      this.registerSignal('count', count as Signal<unknown>);
    }

    override render(): VNode | null {
      return jsx('span', { 'data-signal': 'count', children: String(count.value) });
    }
  }
  customElements.define(tagName, SignalHydrateElement);

  const el = createHydratedElement(
    tagName,
    '<span data-signal="count">42</span>',
  ) as SignalHydrateElement;

  const span = el.shadowRoot?.querySelector('span') as TestElement | null;
  assertExists(span);
  assertEquals(span.textContent, '42');

  count.value = 100;
  await flushEffects();
  assertEquals(span.textContent, '100');
});

Deno.test('OpenElement signal hydration binds data-signal-class markers', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('signal-class-hydrate');
  const open = signal(false);
  class SignalClassElement extends OpenElement {
    constructor() {
      super();
      this.registerSignal('open', open as Signal<unknown>);
    }

    override render(): VNode | null {
      return jsx('span', {
        'data-signal': 'open',
        'data-signal-class': 'open',
        children: String(open.value),
      });
    }
  }
  customElements.define(tagName, SignalClassElement);

  const el = createHydratedElement(
    tagName,
    '<span data-signal="open" data-signal-class="open">false</span>',
  ) as SignalClassElement;

  const span = el.shadowRoot?.querySelector('span') as TestElement | null;
  assertExists(span);
  assertEquals(span.classList.contains('open'), false);

  open.value = true;
  await flushEffects();
  assertEquals(span.classList.contains('open'), true);
});

Deno.test('OpenElement signal hydration binds data-signal-attr markers', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('signal-attr-hydrate');
  const label = signal('a');
  class SignalAttrElement extends OpenElement {
    constructor() {
      super();
      this.registerSignal('label', label as Signal<unknown>);
    }

    override render(): VNode | null {
      return jsx('input', {
        'data-signal': 'label',
        'data-signal-attr': 'value,aria-label',
      });
    }
  }
  customElements.define(tagName, SignalAttrElement);

  const el = createHydratedElement(
    tagName,
    '<input data-signal="label" data-signal-attr="value,aria-label" value="a" aria-label="a">',
  ) as SignalAttrElement;

  const input = el.shadowRoot?.querySelector('input') as TestElement | null;
  assertExists(input);
  assertEquals(input.getAttribute('value'), 'a');

  label.value = 'b';
  await flushEffects();
  assertEquals(input.getAttribute('value'), 'b');
  assertEquals(input.getAttribute('aria-label'), 'b');
});

Deno.test('OpenElement signal hydration binds data-signal-render markers', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('signal-render-hydrate');
  const nodes = signal<VNode[]>([jsx('span', { children: 'one' })]);
  class SignalRenderElement extends OpenElement {
    constructor() {
      super();
      this.registerSignal('nodes', nodes as Signal<unknown>);
    }

    override render(): VNode | null {
      return jsx('div', {
        'data-signal-render': 'nodes',
        children: 'placeholder',
      });
    }
  }
  customElements.define(tagName, SignalRenderElement);

  const el = createHydratedElement(
    tagName,
    '<div data-signal-render="nodes">placeholder</div>',
  ) as SignalRenderElement;

  const root = el.shadowRoot as unknown as TestShadowRoot | null;
  assertExists(root);
  assertEquals(root.innerHTML.includes('placeholder'), false);
  assertEquals(root.innerHTML.includes('one'), true);

  nodes.value = [jsx('span', { children: 'two' })];
  await flushEffects();
  assertEquals(root.innerHTML.includes('one'), false);
  assertEquals(root.innerHTML.includes('two'), true);
});

// ─── 8. Event binding and hydration ────────────────────────────────

Deno.test('CSR-only island binds data-signal markers and click events (#939)', async () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('csr-only');
  const count = signal(0);
  class CsrOnlyElement extends OpenElement {
    constructor() {
      super();
      this.registerSignal('count', count as Signal<unknown>);
    }

    override render(): VNode | null {
      return jsx('span', {
        'data-signal': 'count',
        children: String(count.value),
      });
    }
  }
  customElements.define(tagName, CsrOnlyElement);

  const el = document.createElement(tagName) as CsrOnlyElement;
  document.body.appendChild(el); // no DSD template — hydrate:'only' CSR path

  const span = el.shadowRoot?.querySelector('span') as TestElement | null;
  assertExists(span);
  assertEquals(span.textContent, '0');

  count.value = 5;
  await flushEffects();
  assertEquals(span.textContent, '5');

  document.body.removeChild(el);
});

Deno.test('OpenElement binds click events in CSR render', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('event-csr');
  let clicked = false;
  class EventElement extends OpenElement {
    override render(): VNode | null {
      return jsx('button', {
        onClick: () => {
          clicked = true;
        },
        children: 'click me',
      });
    }
  }
  customElements.define(tagName, EventElement);

  const el = document.createElement(tagName) as EventElement;
  document.body.appendChild(el);

  const btn = el.shadowRoot?.querySelector('button') as TestElement | null;
  assertExists(btn);
  btn.dispatchEvent(new Event('click'));
  assertEquals(clicked, true);

  document.body.removeChild(el);
});

Deno.test('OpenElement hydrates event markers in DSD shadow DOM', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('event-dsd');
  let clicked = false;
  class EventDsdElement extends OpenElement {
    override render(): VNode | null {
      return jsx('button', {
        'data-eid': 'e0',
        onClick: () => {
          clicked = true;
        },
        children: 'hydrated',
      });
    }
  }
  customElements.define(tagName, EventDsdElement);

  const el = createHydratedElement(
    tagName,
    '<button data-eid="e0">hydrated</button>',
  ) as EventDsdElement;

  const btn = el.shadowRoot?.querySelector('button') as TestElement | null;
  assertExists(btn);
  btn.dispatchEvent(new Event('click'));
  assertEquals(clicked, true);
});

// ─── 8b. SSR/hydration event-marker alignment (defect B1) ────────

Deno.test('DSD hydration binds events on registered custom element hosts in traversal order', async () => {
  if (!hasDOM) return;

  const cardTag = uniqueTag('card');
  class CardElement extends OpenElement {
    override render(): VNode | null {
      return jsx('span', { children: 'card' });
    }
  }
  customElements.define(cardTag, CardElement);

  const fired: string[] = [];
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        jsx('button', { onClick: () => fired.push('first'), children: 'first' }),
        jsx(cardTag, { onClick: () => fired.push('host'), children: 'light' }),
        jsx('button', { onClick: () => fired.push('last'), children: 'last' }),
      ],
    });

  const ssrHtml = await renderDsdTree(buildVNode());
  // The CE host itself must carry the middle marker: children-first ordering
  // gives first=e0, host=e1, last=e2.
  assertStringIncludes(ssrHtml, `<${cardTag} data-eid="e1"`);

  const tagName = uniqueTag('host-events');
  class HostEventsElement extends OpenElement {
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, HostEventsElement);

  const el = createHydratedElement(tagName, ssrHtml);
  const root = el.shadowRoot as unknown as TestShadowRoot;
  const buttons = root.querySelectorAll('button');
  const host = root.querySelector(cardTag);
  assertEquals(buttons.length, 2);
  assertExists(host);

  buttons[0].dispatchEvent(new Event('click'));
  assertEquals(fired, ['first']);

  // Pre-fix this fired the host handler: the uncounted SSR host shifted every
  // following marker by one.
  buttons[1].dispatchEvent(new Event('click'));
  assertEquals(fired, ['first', 'last']);

  host.dispatchEvent(new Event('click'));
  assertEquals(fired, ['first', 'last', 'host']);

  document.body.removeChild(el);
});

Deno.test('DSD hydration degrades to client render when a Show branch flips after SSR', async () => {
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

  // Signal drifts between SSR and hydration: the serialized branch no longer
  // matches the branch the client vnode resolves to.
  when.value = false;

  const tagName = uniqueTag('show-flip');
  class ShowFlipElement extends OpenElement {
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, ShowFlipElement);

  // #631: the mismatch diagnostic carries the stable code and structured detail.
  const warns: unknown[][] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => warns.push(args);
  let el: HTMLElement | undefined;
  try {
    el = createHydratedElement(tagName, ssrHtml);
  } finally {
    console.warn = origWarn;
  }
  assertExists(el);
  const root = el.shadowRoot as unknown as TestShadowRoot;

  assertEquals(warns.length, 1);
  const [message, detail] = warns[0] as [string, {
    reason: string;
    hostTag: string;
    expectedBranches: string[];
    actualBranches: string[];
    divergedAt: number;
  }];
  assertStringIncludes(message, 'OPEN_ELEMENT_HYDRATION_MISMATCH');
  assertStringIncludes(message, 'branch-token');
  assertStringIncludes(message, tagName);
  assertEquals(detail.reason, 'branch-token');
  assertEquals(detail.hostTag, tagName);
  assertEquals(detail.expectedBranches, ['oe-branch:show:0']);
  assertEquals(detail.actualBranches, ['oe-branch:show:1']);
  assertEquals(detail.divergedAt, 0);

  // The scope must not bind the 'no' handler onto the SSR 'yes' button; it
  // degrades to a client-side render of the current branch instead.
  assertEquals(root.querySelector('button'), null);
  const span = root.querySelector('span');
  assertExists(span);
  span.dispatchEvent(new Event('click'));
  assertEquals(fired, ['no']);

  document.body.removeChild(el);
});

Deno.test('DSD hydration degrades to client render when data-eid marker count diverges', async () => {
  if (!hasDOM) return;

  const fired: string[] = [];
  const ssrHtml = await renderDsdTree(
    jsx('div', {
      children: [
        jsx('button', { onClick: () => fired.push('one'), children: 'one' }),
        jsx('button', { onClick: () => fired.push('two'), children: 'two' }),
      ],
    }),
  );
  assertStringIncludes(ssrHtml, 'data-eid="e1"');

  const tagName = uniqueTag('eid-drift');
  class EidDriftElement extends OpenElement {
    override render(): VNode | null {
      return jsx('div', {
        children: [
          jsx('button', { onClick: () => fired.push('one'), children: 'one' }),
        ],
      });
    }
  }
  customElements.define(tagName, EidDriftElement);

  // #631: the mismatch diagnostic reports expected vs actual marker counts.
  const warns: unknown[][] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => warns.push(args);
  let el: HTMLElement | undefined;
  try {
    el = createHydratedElement(tagName, ssrHtml);
  } finally {
    console.warn = origWarn;
  }
  assertExists(el);
  const root = el.shadowRoot as unknown as TestShadowRoot;

  assertEquals(warns.length, 1);
  const [message, detail] = warns[0] as [string, {
    reason: string;
    expectedMarkers: number;
    actualMarkers: number;
  }];
  assertStringIncludes(message, 'OPEN_ELEMENT_HYDRATION_MISMATCH');
  assertStringIncludes(message, 'marker-count');
  assertEquals(detail.reason, 'marker-count');
  assertEquals(detail.expectedMarkers, 1);
  assertEquals(detail.actualMarkers, 2);

  // One binding vs two SSR markers: degrade re-renders from the client vnode.
  const buttons = root.querySelectorAll('button');
  assertEquals(buttons.length, 1);
  buttons[0].dispatchEvent(new Event('click'));
  assertEquals(fired, ['one']);

  document.body.removeChild(el);
});

Deno.test('DSD hydration degrades when For items change content at the same length', async () => {
  if (!hasDOM) return;

  const items = signal(['a', 'b']);
  const fired: string[] = [];
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        For({
          each: items,
          children: (item: string) =>
            jsx('button', { onClick: () => fired.push(item), children: item }),
        }),
      ],
    });

  const ssrHtml = await renderDsdTree(buildVNode());
  // The branch token now carries a content hash alongside the item count.
  assertStringIncludes(ssrHtml, '<!--oe-branch:for:2:');

  // Same length, different content between SSR and hydration: the count-only
  // token used to match here and mis-bound the 'c'/'d' handlers onto the
  // stale 'a'/'b' DOM.
  items.value = ['c', 'd'];

  const tagName = uniqueTag('for-drift');
  class ForDriftElement extends OpenElement {
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, ForDriftElement);

  const el = createHydratedElement(tagName, ssrHtml);
  const root = el.shadowRoot as unknown as TestShadowRoot;

  const buttons = root.querySelectorAll('button');
  assertEquals(buttons.map((b) => b.textContent), ['c', 'd']);
  buttons[0].dispatchEvent(new Event('click'));
  assertEquals(fired, ['c']);

  document.body.removeChild(el);
});

// ─── 8b5. Matched hydration keeps keyed/unkeyed lists reactive (#917) ────────
//
// The matched path used to bind event markers only — pushing to a For items
// signal after a successful hydrate did nothing until the scope degraded to a
// client re-render. SSR now emits per-item boundary markers (oe-for-item:N +
// oe-for-end) and hydration seeds a list binding over the existing DOM.

Deno.test('keyed For stays reactive after matched hydration (SSR DOM reconciled in place)', async () => {
  if (!hasDOM) return;

  const items = signal([
    { id: 'a', label: 'alpha' },
    { id: 'b', label: 'beta' },
  ]);
  const fired: string[] = [];
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
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

  const ssrHtml = await renderDsdTree(buildVNode());
  assertStringIncludes(ssrHtml, '<!--oe-for-item:0-->');
  assertStringIncludes(ssrHtml, '<!--oe-for-item:1-->');
  assertStringIncludes(ssrHtml, '<!--oe-for-end-->');
  assertStringIncludes(ssrHtml, 'alpha');

  const tagName = uniqueTag('for-keyed-hydrate');
  class ForKeyedHydrateElement extends OpenElement {
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, ForKeyedHydrateElement);

  const el = createHydratedElement(tagName, ssrHtml);
  const root = el.shadowRoot as unknown as TestShadowRoot;

  // Matched hydration must keep the SSR DOM untouched.
  assertEquals(root.querySelectorAll('button').map((b) => b.textContent), ['alpha', 'beta']);

  // Append: only the new key is rendered, survivors are reused in place.
  items.value = [
    { id: 'a', label: 'alpha' },
    { id: 'b', label: 'beta' },
    { id: 'c', label: 'gamma' },
  ];
  assertEquals(root.querySelectorAll('button').map((b) => b.textContent), [
    'alpha',
    'beta',
    'gamma',
  ]);
  const buttons = root.querySelectorAll('button');
  buttons[2].dispatchEvent(new Event('click'));
  assertEquals(fired, ['gamma']);

  // Remove the first key: only that item leaves the DOM.
  items.value = [
    { id: 'b', label: 'beta' },
    { id: 'c', label: 'gamma' },
  ];
  assertEquals(root.querySelectorAll('button').map((b) => b.textContent), ['beta', 'gamma']);
  root.querySelectorAll('button')[0].dispatchEvent(new Event('click'));
  assertEquals(fired, ['gamma', 'beta']);

  document.body.removeChild(el);
});

Deno.test('keyed For hydration seed drops duplicate-key ghost DOM (#1037)', async () => {
  if (!hasDOM) return;

  // Duplicate keys are a user error; SSR renders both occurrences, so the
  // hydration seed sees the same key twice.
  const items = signal([
    { id: 'a', label: 'first' },
    { id: 'a', label: 'second' },
    { id: 'b', label: 'third' },
  ]);
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        For({
          each: items,
          key: (item: { id: string }) => item.id,
          children: (item: { label: string }) => jsx('button', { children: item.label }),
        }),
      ],
    });

  const ssrHtml = await renderDsdTree(buildVNode());
  const tagName = uniqueTag('for-dup-seed');
  class ForDupSeedElement extends OpenElement {
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, ForDupSeedElement);

  const el = createHydratedElement(tagName, ssrHtml);
  const root = el.shadowRoot as unknown as TestShadowRoot;

  // Last occurrence wins (the runtime reconciliation contract); the
  // overwritten predecessor's SSR nodes must leave the DOM at seed time
  // instead of becoming ghost nodes no cleanup path tracks.
  assertEquals(root.querySelectorAll('button').map((b) => b.textContent), ['second', 'third']);

  // A later items change reconciles without resurrecting the ghost.
  items.value = [
    { id: 'a', label: 'second' },
    { id: 'b', label: 'third' },
    { id: 'c', label: 'fourth' },
  ];
  assertEquals(root.querySelectorAll('button').map((b) => b.textContent), [
    'second',
    'third',
    'fourth',
  ]);

  document.body.removeChild(el);
});

Deno.test('update() render throw keeps last-good DOM and recovers on the next update (#1037)', () => {
  if (!hasDOM) return;

  // Contract pinned after review: a render throw during update() is routed to
  // onRenderError (default: log + null fallback). The last-good DOM stays
  // mounted — deliberately, so a transient error does not blank the element —
  // and the next successful update() re-renders normally. The alternative
  // (clearing the root on a null fallback) was rejected: it would erase
  // still-readable content on every transient throw.
  const tagName = uniqueTag('update-throw');
  let shouldThrow = false;
  let value = 'ok';
  class UpdateThrowElement extends OpenElement {
    override render(): VNode | null {
      if (shouldThrow) throw new Error('update boom');
      return jsx('p', { children: value });
    }
  }
  customElements.define(tagName, UpdateThrowElement);

  const el = document.createElement(tagName) as UpdateThrowElement;
  document.body.appendChild(el);
  assertEquals(el.shadowRoot?.querySelector('p')?.textContent, 'ok');

  shouldThrow = true;
  el.update();
  assertEquals(
    el.shadowRoot?.querySelector('p')?.textContent,
    'ok',
    'failed update keeps the last-good DOM',
  );

  shouldThrow = false;
  value = 'recovered';
  el.update();
  assertEquals(
    el.shadowRoot?.querySelector('p')?.textContent,
    'recovered',
    'the next successful update fully recovers',
  );

  document.body.removeChild(el);
});

Deno.test('unkeyed For stays reactive after matched hydration (clear + re-render on change)', async () => {
  if (!hasDOM) return;

  const items = signal(['one', 'two']);
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        For({
          each: items,
          children: (item: string) => jsx('button', { children: item }),
        }),
      ],
    });

  const ssrHtml = await renderDsdTree(buildVNode());
  assertStringIncludes(ssrHtml, '<!--oe-for-item:0-->');

  const tagName = uniqueTag('for-unkeyed-hydrate');
  class ForUnkeyedHydrateElement extends OpenElement {
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, ForUnkeyedHydrateElement);

  const el = createHydratedElement(tagName, ssrHtml);
  const root = el.shadowRoot as unknown as TestShadowRoot;
  assertEquals(root.querySelectorAll('button').map((b) => b.textContent), ['one', 'two']);

  items.value = ['three'];
  assertEquals(root.querySelectorAll('button').map((b) => b.textContent), ['three']);

  document.body.removeChild(el);
});

// #917 residual: branch ordinals count ALL branches (Show included) on both
// the VNode and the DOM side, but listTargets is a compact For-only array —
// indexing it by branchOrdinal mis-pairs whenever a Show precedes a For.

Deno.test('matched hydration keeps a For reactive when a Show branch precedes it (#917 residual)', async () => {
  if (!hasDOM) return;

  const when = signal(true);
  const items = signal(['one', 'two']);
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        Show({
          when,
          children: [
            jsx('span', { children: 'visible' }),
            jsx('span', { children: 'hidden' }),
          ],
        }),
        For({
          each: items,
          children: (item: string) => jsx('button', { children: item }),
        }),
      ],
    });

  const ssrHtml = await renderDsdTree(buildVNode());

  const tagName = uniqueTag('show-for-hydrate');
  class ShowForHydrateElement extends OpenElement {
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, ShowForHydrateElement);

  const el = createHydratedElement(tagName, ssrHtml);
  const root = el.shadowRoot as unknown as TestShadowRoot;

  assertEquals(root.querySelectorAll('button').map((b) => b.textContent), ['one', 'two']);

  // Pre-fix: listTargets[branchOrdinal] indexed past the For-only array (the
  // Show consumed ordinal 0), so the lookup missed and the list was never
  // seeded — signal writes left the hydrated list inert.
  items.value = ['one', 'two', 'three'];
  assertEquals(root.querySelectorAll('button').map((b) => b.textContent), [
    'one',
    'two',
    'three',
  ]);

  document.body.removeChild(el);
});

Deno.test('matched hydration keeps each For bound to its own items when a Show precedes them (#917 residual)', async () => {
  if (!hasDOM) return;

  const when = signal(true);
  const listA = signal(['a1']);
  const listB = signal(['b1']);
  const buildVNode = (): VNode =>
    jsx('div', {
      children: [
        Show({
          when,
          children: [
            jsx('span', { children: 'visible' }),
            jsx('span', { children: 'hidden' }),
          ],
        }),
        For({
          each: listA,
          children: (item: string) => jsx('button', { children: item }),
        }),
        For({
          each: listB,
          children: (item: string) => jsx('button', { children: item }),
        }),
      ],
    });

  const ssrHtml = await renderDsdTree(buildVNode());

  const tagName = uniqueTag('show-for-for-hydrate');
  class ShowForForHydrateElement extends OpenElement {
    override render(): VNode | null {
      return buildVNode();
    }
  }
  customElements.define(tagName, ShowForForHydrateElement);

  const el = createHydratedElement(tagName, ssrHtml);
  const root = el.shadowRoot as unknown as TestShadowRoot;

  assertEquals(root.querySelectorAll('button').map((b) => b.textContent), ['a1', 'b1']);

  // Pre-fix: the first For's DOM group paired with the SECOND For's target
  // (listTargets[1]), so listA writes did nothing and listB writes rewrote
  // the first group's DOM with the second list's items.
  listA.value = ['a1', 'a2'];
  assertEquals(
    root.querySelectorAll('button').map((b) => b.textContent),
    ['a1', 'a2', 'b1'],
    'listA writes must reconcile the first list region',
  );

  listB.value = ['b1', 'b2'];
  assertEquals(
    root.querySelectorAll('button').map((b) => b.textContent),
    ['a1', 'a2', 'b1', 'b2'],
    'listB writes must reconcile the second list region, not the first',
  );

  document.body.removeChild(el);
});

// ─── 8c. Root-level <Show>/<For> CSR (carried-over edge) ─────────
//
// renderToDom() commits binding descriptors before the caller attaches the
// returned root node. For a root-level Show/For the root node IS the
// control-flow anchor comment, so pre-fix the anchor had no parentNode at
// commit time and the branch content was silently dropped. The fix parks a
// root anchor in a DocumentFragment before committing; the harness keeps
// fragments as child nodes (real browsers hoist their children), so these
// tests query through the fragment layer.

/** Recursive element lookup that descends into DocumentFragment children. */
function deepQuerySelector(root: TestShadowRoot, localName: string): TestElement | null {
  const walk = (nodes: TestNode[]): TestElement | null => {
    for (const node of nodes) {
      if (node instanceof TestElement) {
        if (node.localName === localName) return node;
        const found = walk(node.childNodes);
        if (found) return found;
      } else if (node instanceof TestDocumentFragment || node instanceof TestShadowRoot) {
        const found = walk(node.childNodes);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(root.childNodes);
}

Deno.test('OpenElement CSR renders a root-level Show branch and reacts to flips', async () => {
  if (!hasDOM) return;

  const when = signal(true);
  const fired: string[] = [];
  const tagName = uniqueTag('root-show');
  class RootShowElement extends OpenElement {
    override render(): VNode | null {
      return Show({
        when,
        children: [
          jsx('button', { onClick: () => fired.push('yes'), children: 'yes' }),
          jsx('span', { onClick: () => fired.push('no'), children: 'no' }),
        ],
      });
    }
  }
  customElements.define(tagName, RootShowElement);

  const el = document.createElement(tagName) as RootShowElement;
  document.body.appendChild(el);
  const root = el.shadowRoot as unknown as TestShadowRoot;

  // Pre-fix the truthy branch never reached the shadow root.
  assertStringIncludes(root.innerHTML, 'yes');
  const yesButton = deepQuerySelector(root, 'button');
  assertExists(yesButton);
  yesButton.dispatchEvent(new Event('click'));
  assertEquals(fired, ['yes']);

  // Branch flips keep working after the anchor gained a real parent.
  when.value = false;
  await flushEffects();
  assertEquals(root.innerHTML.includes('yes'), false);
  assertStringIncludes(root.innerHTML, 'no');
  const noSpan = deepQuerySelector(root, 'span');
  assertExists(noSpan);
  noSpan.dispatchEvent(new Event('click'));
  assertEquals(fired, ['yes', 'no']);

  document.body.removeChild(el);
});

Deno.test('OpenElement CSR renders a root-level For list and reacts to item changes', async () => {
  if (!hasDOM) return;

  const items = signal<string[]>(['a', 'b']);
  const tagName = uniqueTag('root-for');
  class RootForElement extends OpenElement {
    override render(): VNode | null {
      return For({
        each: items,
        children: (item: string) => jsx('li', { children: item }),
      });
    }
  }
  customElements.define(tagName, RootForElement);

  const el = document.createElement(tagName) as RootForElement;
  document.body.appendChild(el);
  const root = el.shadowRoot as unknown as TestShadowRoot;

  // Pre-fix the list items never reached the shadow root.
  assertStringIncludes(root.innerHTML, 'a');
  assertStringIncludes(root.innerHTML, 'b');

  items.value = ['c'];
  await flushEffects();
  assertEquals(root.innerHTML.includes('a'), false);
  assertStringIncludes(root.innerHTML, 'c');

  document.body.removeChild(el);
});

Deno.test('OpenElement DSD hydration degrade re-renders a root-level Show client-side', () => {
  if (!hasDOM) return;

  const fired: string[] = [];
  const tagName = uniqueTag('root-show-degrade');
  class RootShowDegradeElement extends OpenElement {
    override render(): VNode | null {
      return Show({
        when: true,
        children: [
          jsx('button', { onClick: () => fired.push('live'), children: 'live' }),
          null,
        ],
      });
    }
  }
  customElements.define(tagName, RootShowDegradeElement);

  // The SSR branch token says show:0 but the client VNode resolves show:1:
  // the scope degrades to a client-side render whose root is the Show anchor
  // itself — the path that silently dropped content pre-fix.
  const el = createHydratedElement(
    tagName,
    '<!--oe-branch:show:0--><button data-eid="e0">stale</button>',
  );
  const root = el.shadowRoot as unknown as TestShadowRoot;

  assertStringIncludes(root.innerHTML, 'live');
  assertEquals(root.innerHTML.includes('stale'), false);
  const button = deepQuerySelector(root, 'button');
  assertExists(button);
  button.dispatchEvent(new Event('click'));
  assertEquals(fired, ['live']);

  document.body.removeChild(el);
});

// ─── 8d. CSR attribute serialization parity (M2/L5) ──────────────
//
// SSR serializeAttrs kebab-cases props on custom-element hosts and skips
// non-event function props; the CSR DOM renderer must produce the same
// attribute shape or the hydration/degrade re-render diverges from SSR.

Deno.test('renderToDom kebab-cases camelCase props on custom-element hosts', () => {
  if (!hasDOM) return;

  const host = renderToDom(
    jsx('x-thing', { itemCount: 5, className: 'box' }),
  ) as unknown as TestElement;
  assertEquals(host.getAttribute('item-count'), '5');
  assertEquals(host.getAttribute('itemCount'), null);
  assertEquals(host.getAttribute('class'), 'box');

  // Plain HTML elements keep prop names verbatim (serializeAttrs only kebabs
  // custom-element tags).
  const div = renderToDom(jsx('div', { itemCount: 5 })) as unknown as TestElement;
  assertEquals(div.getAttribute('itemCount'), '5');
});

Deno.test('renderToDom skips non-event function props like SSR serializeAttrs', () => {
  if (!hasDOM) return;

  const el = renderToDom(
    jsx('div', { title: 'kept', transform: () => 'ignored' }),
  ) as unknown as TestElement;
  // Pre-fix the function source string landed in the attribute.
  assertEquals(el.getAttribute('transform'), null);
  assertEquals(el.getAttribute('title'), 'kept');
});

// ─── 8e. CSR signal-name resolution (#660) ─────────────────────────
//
// signalNameFor resolves a registered signal to its name through a cached
// per-registry reverse index instead of a per-lookup linear scan. These
// tests pin the observable contract: each signal resolves to its own
// registered name, repeated renders against the same registry (which reuse
// the cached index) keep resolving correctly, and unregistered signals emit
// no marker.

Deno.test('renderToDom resolves registered signals to their data-signal names', () => {
  if (!hasDOM) return;

  const count = signal(0);
  const label = signal('a');
  const registry = new Map<string, Signal<unknown>>([
    ['count', count],
    ['label', label],
  ]);

  const first = renderToDom(
    jsx('span', { title: count }),
    undefined,
    registry,
  ) as unknown as TestElement;
  assertEquals(first.getAttribute('data-signal'), 'count');

  // Second render reuses the cached reverse index for the same registry and
  // must still resolve a different signal to its own name.
  const second = renderToDom(
    jsx('span', { title: label }),
    undefined,
    registry,
  ) as unknown as TestElement;
  assertEquals(second.getAttribute('data-signal'), 'label');
});

Deno.test('renderToDom emits no data-signal marker for signals outside the registry', () => {
  if (!hasDOM) return;

  const registry = new Map([['count', signal(0)]]);
  const el = renderToDom(
    jsx('span', { title: signal(9) }),
    undefined,
    registry,
  ) as unknown as TestElement;
  assertEquals(el.getAttribute('data-signal'), null);
});

Deno.test('renderToDom consumes vnode.ref callbacks from JSX (#756)', () => {
  if (!hasDOM) return;

  let received: Element | null = null;
  const el = renderToDom(
    jsx('div', {
      ref: (target: Element) => {
        received = target;
      },
      children: 'x',
    }),
  ) as unknown as TestElement;

  // createVNode strips ref from props onto vnode.ref; the ref must fire with
  // the created element once the tree is committed.
  assertEquals(received === (el as unknown as Element), true);
});

// ─── 9. Props system (static props) ────────────────────────────────

Deno.test('OpenElement static props initialize from attributes', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('static-props');
  class StaticPropsElement extends OpenElement {
    static props = {
      label: String,
      count: Number,
      active: Boolean,
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, StaticPropsElement);

  const el = document.createElement(tagName) as StaticPropsElement;
  el.setAttribute('label', 'hello');
  el.setAttribute('count', '7');
  el.setAttribute('active', '');
  document.body.appendChild(el);

  const elProps = el as unknown as Record<string, { value: unknown }>;
  assertEquals(elProps.label.value, 'hello');
  assertEquals(elProps.count.value, 7);
  assertEquals(elProps.active.value, true);

  document.body.removeChild(el);
});

Deno.test('OpenElement static props react to attribute changes', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('static-props-change');
  class StaticPropsChangeElement extends OpenElement {
    static props = {
      count: Number,
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, StaticPropsChangeElement);

  const el = document.createElement(tagName) as StaticPropsChangeElement;
  document.body.appendChild(el);

  el.setAttribute('count', '5');
  const elProps = el as unknown as Record<string, { value: unknown }>;
  assertEquals(elProps.count.value, 5);

  document.body.removeChild(el);
});

Deno.test('OpenElement static prop signals participate in framework effects (#1092)', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('static-props-effect');
  class StaticPropsEffectElement extends OpenElement {
    static props = { count: { type: Number, default: 1 } } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, StaticPropsEffectElement);

  const el = document.createElement(tagName) as StaticPropsEffectElement;
  document.body.appendChild(el);
  const count = (el as unknown as Record<string, { value: number }>).count;
  const values: number[] = [];
  const dispose = effect(() => {
    values.push(count.value);
  });

  count.value = 2;
  assertEquals(values, [1, 2]);

  dispose();
  document.body.removeChild(el);
});

Deno.test('OpenElement static prop signals emit automatic SSR hydration markers (#1092, #1093)', async () => {
  if (!hasDOM) return;

  class StaticPropsSsrElement extends OpenElement {
    static props = { label: { type: String, default: 'ready' } } as const;
    declare label: Signal<string>;

    override render(): VNode | null {
      return jsx('span', { title: this.label, children: 'value' });
    }
  }

  const output = await renderDsd('x-static-props-ssr', {
    componentClass: StaticPropsSsrElement,
  });
  assertStringIncludes(
    output.html,
    '<span title="ready" data-signal="label" data-signal-attr="title">value</span>',
  );
});

Deno.test('OpenElement static props restore declared defaults when attributes are removed', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('static-props-default');
  class StaticPropsDefaultElement extends OpenElement {
    static props = {
      count: { type: Number, default: 7 },
      label: { type: String, default: 'ready' },
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, StaticPropsDefaultElement);

  const el = document.createElement(tagName) as StaticPropsDefaultElement;
  document.body.appendChild(el);
  el.setAttribute('count', '12');
  el.setAttribute('label', 'busy');
  el.removeAttribute('count');
  el.removeAttribute('label');

  const props = el as unknown as Record<string, { value: unknown }>;
  assertEquals(props.count.value, 7);
  assertEquals(props.label.value, 'ready');
  document.body.removeChild(el);
});

// ─── 9b. Define-time observedAttributes merge (defect B2) ────────
//
// The harness registry snapshots observedAttributes once at define(), like a
// real browser. The tests above ('react to attribute changes', 'restore
// declared defaults') therefore only pass when static props attributes are
// registered before define — the pre-fix runtime push happened at
// connectedCallback and never reached the browser.

Deno.test('OpenElement merges static props into observedAttributes read at define time', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('static-props-define-time');
  class DefineTimeElement extends OpenElement {
    static props = {
      count: Number,
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  assertEquals(DefineTimeElement.observedAttributes, ['count']);
  customElements.define(tagName, DefineTimeElement);

  const el = document.createElement(tagName) as DefineTimeElement;
  document.body.appendChild(el);
  el.setAttribute('count', '41');
  const elProps = el as unknown as Record<string, { value: unknown }>;
  assertEquals(elProps.count.value, 41);

  document.body.removeChild(el);
});

Deno.test('OpenElement unions assigned observedAttributes with static props attributes', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('static-props-union');
  const changes: string[] = [];
  class UnionElement extends OpenElement {
    static props = {
      count: Number,
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue);
      changes.push(name);
    }
  }
  // Assignment form: stored by the base-class setter and unioned on read.
  UnionElement.observedAttributes = ['manual'];
  assertEquals(UnionElement.observedAttributes, ['manual', 'count']);
  customElements.define(tagName, UnionElement);

  const el = document.createElement(tagName) as UnionElement;
  document.body.appendChild(el);

  el.setAttribute('manual', 'x');
  el.setAttribute('count', '5');
  assertEquals(changes, ['manual', 'count']);
  const elProps = el as unknown as Record<string, { value: unknown }>;
  assertEquals(elProps.count.value, 5);

  document.body.removeChild(el);
});

Deno.test('OpenElement observedAttributes merge never mutates base or sibling classes', () => {
  if (!hasDOM) return;

  class ParentPropsElement extends OpenElement {
    static props: Record<string, unknown> = { alpha: String };

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  class ChildPropsElement extends ParentPropsElement {
    static override props: Record<string, unknown> = { beta: String };
  }
  class SiblingPropsElement extends ParentPropsElement {
    static override props: Record<string, unknown> = { gamma: String };
  }

  customElements.define(uniqueTag('props-parent'), ParentPropsElement);
  customElements.define(uniqueTag('props-child'), ChildPropsElement);
  customElements.define(uniqueTag('props-sibling'), SiblingPropsElement);

  assertEquals(ParentPropsElement.observedAttributes, ['alpha']);
  assertEquals(ChildPropsElement.observedAttributes, ['beta']);
  assertEquals(SiblingPropsElement.observedAttributes, ['gamma']);
  assertEquals(OpenElement.observedAttributes, []);

  // Reads return fresh arrays; mutating one does not poison later reads.
  ParentPropsElement.observedAttributes.push('hacked');
  assertEquals(ParentPropsElement.observedAttributes, ['alpha']);
});

Deno.test('OpenElement preserves hand-written class-field observedAttributes verbatim', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('manual-observed');
  const changes: string[] = [];
  class ManualObservedElement extends OpenElement {
    static override observedAttributes = ['tone'];

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue);
      changes.push(name);
    }
  }
  customElements.define(tagName, ManualObservedElement);
  assertEquals(ManualObservedElement.observedAttributes, ['tone']);

  const el = document.createElement(tagName) as ManualObservedElement;
  document.body.appendChild(el);
  el.setAttribute('tone', 'dark');
  assertEquals(changes, ['tone']);

  document.body.removeChild(el);
});

// ─── 9c. reflect: true static props (R2-H1) ──────────────────────
//
// The reflect subscriber mirrors signal writes into the attribute, and
// attributeChangedCallback writes attribute changes back into the signal.
// Both directions short-circuit on equality so one logical write cannot
// re-enter itself (setAttribute fires attributeChangedCallback even for an
// identical value). The reflect subscription also skips its first
// synchronous fire: connectedCallback runs syncStaticPropsFromAttributes
// right after initializeStaticProps, so writing the default at subscribe
// time would clobber SSR-delivered attributes before the sync reads them.

Deno.test('OpenElement reflect props preserve SSR-delivered attributes on connect', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('reflect-ssr');
  class ReflectSsrElement extends OpenElement {
    static props = {
      count: { type: Number, default: 0, reflect: true },
      label: { type: String, default: 'init', reflect: true },
      active: { type: Boolean, default: false, reflect: true },
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ReflectSsrElement);

  const el = document.createElement(tagName) as ReflectSsrElement;
  el.setAttribute('count', '5');
  el.setAttribute('label', 'ssr');
  el.setAttribute('active', '');
  document.body.appendChild(el);

  const props = el as unknown as Record<string, { value: unknown }>;
  // Pre-fix the reflect subscription fired synchronously with the default
  // value and overwrote every attribute before the sync ran (count="5"
  // became count="0"), then looped until the stack blew.
  assertEquals(el.getAttribute('count'), '5');
  assertEquals(el.getAttribute('label'), 'ssr');
  assertEquals(el.hasAttribute('active'), true);
  assertEquals(props.count.value, 5);
  assertEquals(props.label.value, 'ssr');
  assertEquals(props.active.value, true);

  document.body.removeChild(el);
});

Deno.test('OpenElement reflect prop writes produce zero redundant attributeChangedCallback runs', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('reflect-loop');
  const changes: Array<string | null> = [];
  class ReflectLoopElement extends OpenElement {
    static props = {
      count: { type: Number, default: 0, reflect: true },
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      // Record on entry: the reflected mirror write re-enters this callback
      // synchronously from inside super.attributeChangedCallback, so pushing
      // after super() would list the nested write before its cause.
      if (name === 'count') changes.push(newValue);
      super.attributeChangedCallback(name, oldValue, newValue);
    }
  }
  customElements.define(tagName, ReflectLoopElement);

  const el = document.createElement(tagName) as ReflectLoopElement;
  document.body.appendChild(el);
  const props = el as unknown as Record<string, { value: unknown }>;

  // No SSR attribute: connect must not write the default into the attribute.
  assertEquals(changes, []);
  assertEquals(el.getAttribute('count'), null);

  // Signal -> attribute: exactly one reflected write, no re-entry.
  props.count.value = 7;
  assertEquals(changes, ['7']);
  assertEquals(el.getAttribute('count'), '7');

  // Attribute -> signal: the reflect subscriber sees the attribute already
  // holds the value and must not write it back.
  changes.length = 0;
  el.setAttribute('count', '9');
  assertEquals(changes, ['9']);
  assertEquals(props.count.value, 9);

  // Removal restores the declared default; reflect mirrors the restored
  // default back (removal notification + one mirror write), then stops.
  changes.length = 0;
  el.removeAttribute('count');
  assertEquals(props.count.value, 0);
  assertEquals(changes, [null, '0']);
  assertEquals(el.getAttribute('count'), '0');

  document.body.removeChild(el);
});

Deno.test('OpenElement Boolean reflect prop re-mirrors the attribute after removal restores the default', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('reflect-bool-removal');
  class ReflectBoolRemovalElement extends OpenElement {
    static props = {
      active: { type: Boolean, default: true, reflect: true },
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ReflectBoolRemovalElement);

  const el = document.createElement(tagName) as ReflectBoolRemovalElement;
  document.body.appendChild(el);
  const props = el as unknown as Record<string, { value: unknown }>;

  // Sync the attribute in: signal stays at the default (true).
  el.setAttribute('active', '');
  assertEquals(props.active.value, true);

  // Removal restores the declared default, which already equals the signal
  // value. The removal branch bypasses the equality short-circuit, so the
  // reflect subscriber still fires and re-mirrors the attribute.
  el.removeAttribute('active');
  assertEquals(props.active.value, true);
  assertEquals(el.getAttribute('active'), '');

  document.body.removeChild(el);
});

Deno.test('OpenElement reflect prop re-mirrors a non-Boolean default after attribute removal', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('reflect-default-removal');
  class ReflectDefaultRemovalElement extends OpenElement {
    static props = {
      count: { type: Number, default: 0, reflect: true },
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ReflectDefaultRemovalElement);

  const el = document.createElement(tagName) as ReflectDefaultRemovalElement;
  document.body.appendChild(el);
  const props = el as unknown as Record<string, { value: unknown }>;

  // Attribute value matches the declared default, so the sync write is
  // short-circuited and the signal already holds the default.
  el.setAttribute('count', '0');
  assertEquals(props.count.value, 0);

  // Removal restores the default; the removal branch bypasses the equality
  // short-circuit so the restored value is mirrored back into the attribute.
  el.removeAttribute('count');
  assertEquals(props.count.value, 0);
  assertEquals(el.getAttribute('count'), '0');

  document.body.removeChild(el);
});

Deno.test('OpenElement reflect props survive reconnect through the attribute mirror', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('reflect-reconnect');
  const changes: Array<string | null> = [];
  class ReflectReconnectElement extends OpenElement {
    static props = {
      count: { type: Number, default: 0, reflect: true },
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue);
      if (name === 'count') changes.push(newValue);
    }
  }
  customElements.define(tagName, ReflectReconnectElement);

  const el = document.createElement(tagName) as ReflectReconnectElement;
  document.body.appendChild(el);
  const props = el as unknown as Record<string, { value: unknown }>;

  props.count.value = 33;
  assertEquals(el.getAttribute('count'), '33');

  // DOM move: disconnect disposes the reflect subscription; reconnect
  // preserves the signal (#772) and re-arms the reflect subscription.
  document.body.removeChild(el);
  document.body.appendChild(el);
  assertEquals(props.count.value, 33);
  assertEquals(el.getAttribute('count'), '33');

  // The re-armed subscription is the only one live: one logical write still
  // produces exactly one attribute change.
  changes.length = 0;
  props.count.value = 44;
  assertEquals(changes, ['44']);
  assertEquals(el.getAttribute('count'), '44');

  document.body.removeChild(el);
});

Deno.test('OpenElement Array/Object static props JSON.parse attribute values (#764)', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('json-props');
  class JsonPropsElement extends OpenElement {
    static props = {
      items: Array,
      config: Object,
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, JsonPropsElement);

  const el = document.createElement(tagName) as JsonPropsElement;
  el.setAttribute('items', '[1,2]');
  el.setAttribute('config', '{"a":1}');
  document.body.appendChild(el);

  const props = el as unknown as Record<string, { value: unknown }>;
  assertEquals(props.items.value, [1, 2]);
  assertEquals(props.config.value, { a: 1 });

  // A non-JSON attribute falls back to the declared default instead of
  // leaking the raw string into a prop typed as unknown[].
  el.setAttribute('items', 'not json');
  assertEquals(props.items.value, []);

  document.body.removeChild(el);
});

Deno.test('OpenElement preserves property-set static prop state across disconnect→reconnect (#772)', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('reconnect-props');
  class ReconnectPropsElement extends OpenElement {
    static props = {
      count: { type: Number, default: 0 },
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ReconnectPropsElement);

  const el = document.createElement(tagName) as ReconnectPropsElement;
  document.body.appendChild(el);
  const props = el as unknown as Record<string, { value: unknown }>;

  props.count.value = 5;

  // DOM move: connectedCallback fires again, but the already-initialized
  // signals must be preserved rather than rebuilt from defaults.
  document.body.removeChild(el);
  document.body.appendChild(el);
  assertEquals(props.count.value, 5);

  document.body.removeChild(el);
});

// ─── 9d. camelCase static props kebab-case contract (M2) ─────────
//
// One casing rule (camelToKebab) covers SSR serialization, observedAttributes
// registration, attribute sync, and reflect, so a multi-word prop like
// itemCount round-trips as item-count through SSR -> hydration -> reflect.

Deno.test('OpenElement camelCase static props observe kebab-case attributes', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('camel-props');
  class CamelPropsElement extends OpenElement {
    static props = {
      itemCount: { type: Number, default: 0, reflect: true },
      itemLabel: { type: String, default: 'init' },
    } as const;

    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  assertEquals(CamelPropsElement.observedAttributes, ['item-count', 'item-label']);
  customElements.define(tagName, CamelPropsElement);

  const el = document.createElement(tagName) as CamelPropsElement;
  el.setAttribute('item-count', '5');
  el.setAttribute('item-label', 'ssr');
  document.body.appendChild(el);

  const props = el as unknown as Record<string, { value: unknown }>;
  // SSR serializes item-count; connect must read it into the signal.
  assertEquals(props.itemCount.value, 5);
  assertEquals(props.itemLabel.value, 'ssr');
  // Reflect mirrors into the kebab-case name, never the lowercase join.
  assertEquals(el.getAttribute('item-count'), '5');
  assertEquals(el.getAttribute('itemcount'), null);
  props.itemCount.value = 7;
  assertEquals(el.getAttribute('item-count'), '7');
  assertEquals(el.getAttribute('itemcount'), null);
  // Attribute -> signal direction uses the same kebab-case name.
  el.setAttribute('item-count', '9');
  assertEquals(props.itemCount.value, 9);

  document.body.removeChild(el);
});

// ─── 10. Error boundary / onRenderError ────────────────────────────

Deno.test('OpenElement onRenderError renders fallback on render failure', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('render-error');
  class BrokenElement extends OpenElement {
    override render(): VNode | null {
      throw new Error('boom');
    }

    protected override onRenderError(_error: unknown): VNode | null {
      return jsx('div', { children: 'fallback' });
    }
  }
  customElements.define(tagName, BrokenElement);

  const el = document.createElement(tagName) as BrokenElement;
  document.body.appendChild(el);

  assertStringIncludes((el.shadowRoot as unknown as TestShadowRoot).innerHTML, 'fallback');

  document.body.removeChild(el);
});

Deno.test('OpenElement update() routes re-render errors to onRenderError fallback', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('update-error');
  let broken = false;
  let errorSeen: unknown = null;
  class UpdateErrorElement extends OpenElement {
    override render(): VNode | null {
      if (broken) throw new Error('update boom');
      return jsx('div', { children: 'ok' });
    }

    protected override onRenderError(error: unknown): VNode | null {
      errorSeen = error;
      return jsx('div', { children: 'update fallback' });
    }
  }
  customElements.define(tagName, UpdateErrorElement);

  const el = document.createElement(tagName) as UpdateErrorElement;
  document.body.appendChild(el);
  assertStringIncludes((el.shadowRoot as unknown as TestShadowRoot).innerHTML, 'ok');

  broken = true;
  // Must not throw — update() errors follow the same onRenderError contract
  // as the initial render (#662).
  el.update();

  assertInstanceOf(errorSeen, Error);
  assertStringIncludes((el.shadowRoot as unknown as TestShadowRoot).innerHTML, 'update fallback');

  // The element recovers on the next successful render.
  broken = false;
  el.update();
  assertStringIncludes((el.shadowRoot as unknown as TestShadowRoot).innerHTML, 'ok');

  document.body.removeChild(el);
});

Deno.test('OpenElement update() routes light-DOM re-render errors to onRenderError', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('update-error-light');
  let broken = false;
  class LightUpdateErrorElement extends OpenElement {
    static override renderMode = 'light' as const;

    override render(): VNode | null {
      if (broken) throw new Error('light update boom');
      return jsx('em', { children: 'light ok' });
    }

    protected override onRenderError(_error: unknown): VNode | null {
      return jsx('em', { children: 'light fallback' });
    }
  }
  customElements.define(tagName, LightUpdateErrorElement);

  const el = document.createElement(tagName) as LightUpdateErrorElement;
  document.body.appendChild(el);
  assertEquals(el.innerHTML, '<em>light ok</em>');

  broken = true;
  el.update();
  assertEquals(el.innerHTML, '<em>light fallback</em>');

  document.body.removeChild(el);
});

Deno.test('ErrorBoundary catches and displays fallback UI', () => {
  class Boundary extends ErrorBoundary {
    override render(): VNode | null {
      if (this.hasError) {
        return this.onError(this.error!);
      }
      return jsx('div', { children: 'ok' });
    }
  }

  const boundary = new Boundary();
  boundary.catchError(new Error('child failed'));

  assertEquals(boundary.hasError, true);
  assertExists(boundary.error);
  assertStringIncludes(boundary.error!.message, 'child failed');
  assertEquals(boundary.retryCount, 0);
});

Deno.test('ErrorBoundary default retry control clears the captured error', () => {
  class Boundary extends ErrorBoundary {}

  const boundary = new Boundary();
  boundary.catchError(new Error('child failed'));
  const fallback = boundary.onError(boundary.error!);
  const retry = fallback.children?.[1] as VNode;
  const onClick = retry.props?.onClick as (() => void) | undefined;

  assertExists(onClick);
  onClick();
  assertEquals(boundary.hasError, false);
  assertEquals(boundary.retryCount, 1);
});

// ─── 10b. ErrorBoundary automatic capture / bubbling (ADR-0053 Layer 2, #919) ──

Deno.test('ErrorBoundary auto-captures a descendant CSR render failure (#919)', () => {
  if (!hasDOM) return;

  const boundaryTag = uniqueTag('auto-boundary');
  const childTag = uniqueTag('auto-child');
  class AutoBoundary extends ErrorBoundary {
    override render(): VNode | null {
      if (this.hasError) return this.onError(this.error!);
      return jsx('slot', {});
    }
  }
  class AutoChild extends OpenElement {
    override render(): VNode | null {
      throw new Error('csr boom');
    }

    protected override onRenderError(_error: unknown): VNode | null {
      return jsx('div', { children: 'child own fallback' });
    }
  }
  customElements.define(boundaryTag, AutoBoundary);
  customElements.define(childTag, AutoChild);

  const boundary = document.createElement(boundaryTag) as AutoBoundary;
  document.body.appendChild(boundary);
  const child = document.createElement(childTag) as AutoChild;
  boundary.appendChild(child);

  assertEquals(boundary.hasError, true);
  assertStringIncludes(boundary.error!.message, 'csr boom');
  assertStringIncludes(
    (boundary.shadowRoot as unknown as TestShadowRoot).innerHTML,
    'Something went wrong: csr boom',
  );
  // The boundary captured the error, so the child's own onRenderError
  // fallback never rendered.
  assertEquals((child.shadowRoot as unknown as TestShadowRoot).innerHTML, '');

  document.body.removeChild(boundary);
});

Deno.test('ErrorBoundary retry re-renders the auto-captured source element (#919)', () => {
  if (!hasDOM) return;

  let broken = true;
  const boundaryTag = uniqueTag('retry-boundary');
  const childTag = uniqueTag('retry-child');
  class RetryBoundary extends ErrorBoundary {
    override render(): VNode | null {
      if (this.hasError) return this.onError(this.error!);
      return jsx('slot', {});
    }
  }
  class RetryChild extends OpenElement {
    override render(): VNode | null {
      if (broken) throw new Error('still broken');
      return jsx('div', { children: 'recovered' });
    }
  }
  customElements.define(boundaryTag, RetryBoundary);
  customElements.define(childTag, RetryChild);

  const boundary = document.createElement(boundaryTag) as RetryBoundary;
  document.body.appendChild(boundary);
  const child = document.createElement(childTag) as RetryChild;
  boundary.appendChild(child);
  assertEquals(boundary.hasError, true);

  broken = false;
  boundary.retry();

  assertEquals(boundary.hasError, false);
  assertEquals(boundary.retryCount, 1);
  // Back to normal content: the fallback is gone (the harness serializes a
  // shadow root's top-level elements by their inner content, so a childless
  // <slot> shows up as an empty string).
  assertEquals(
    (boundary.shadowRoot as unknown as TestShadowRoot).innerHTML.includes('Something went wrong'),
    false,
  );
  assertStringIncludes((child.shadowRoot as unknown as TestShadowRoot).innerHTML, 'recovered');

  document.body.removeChild(boundary);
});

Deno.test('ErrorBoundary retry with a still-broken source recaptures the error (#919)', () => {
  if (!hasDOM) return;

  const boundaryTag = uniqueTag('rethrow-boundary');
  const childTag = uniqueTag('rethrow-child');
  class RethrowBoundary extends ErrorBoundary {
    override render(): VNode | null {
      if (this.hasError) return this.onError(this.error!);
      return jsx('slot', {});
    }
  }
  class RethrowChild extends OpenElement {
    override render(): VNode | null {
      throw new Error('permanently broken');
    }
  }
  customElements.define(boundaryTag, RethrowBoundary);
  customElements.define(childTag, RethrowChild);

  const boundary = document.createElement(boundaryTag) as RethrowBoundary;
  document.body.appendChild(boundary);
  const child = document.createElement(childTag) as RethrowChild;
  boundary.appendChild(child);
  assertEquals(boundary.hasError, true);

  // The source fails again during retry: the failure bubbles back into
  // catchError and the fallback is restored with the retry counted.
  boundary.retry();

  assertEquals(boundary.hasError, true);
  assertEquals(boundary.retryCount, 1);
  assertStringIncludes(
    (boundary.shadowRoot as unknown as TestShadowRoot).innerHTML,
    'Something went wrong: permanently broken',
  );

  document.body.removeChild(boundary);
});

Deno.test('Nested error boundaries: the inner boundary captures first (#919)', () => {
  if (!hasDOM) return;

  const outerTag = uniqueTag('outer-boundary');
  const innerTag = uniqueTag('inner-boundary');
  const childTag = uniqueTag('nested-child');
  class OuterBoundary extends ErrorBoundary {
    override onError(error: OpenElementError): VNode {
      return jsx('p', { children: `outer fallback: ${error.message}` });
    }

    override render(): VNode | null {
      if (this.hasError) return this.onError(this.error!);
      return jsx('slot', {});
    }
  }
  class InnerBoundary extends ErrorBoundary {
    override onError(error: OpenElementError): VNode {
      return jsx('p', { children: `inner fallback: ${error.message}` });
    }

    override render(): VNode | null {
      if (this.hasError) return this.onError(this.error!);
      return jsx('slot', {});
    }
  }
  class NestedChild extends OpenElement {
    override render(): VNode | null {
      throw new Error('nested boom');
    }
  }
  customElements.define(outerTag, OuterBoundary);
  customElements.define(innerTag, InnerBoundary);
  customElements.define(childTag, NestedChild);

  const outer = document.createElement(outerTag) as OuterBoundary;
  document.body.appendChild(outer);
  const inner = document.createElement(innerTag) as InnerBoundary;
  outer.appendChild(inner);
  const child = document.createElement(childTag) as NestedChild;
  inner.appendChild(child);

  assertEquals(inner.hasError, true);
  assertEquals(outer.hasError, false);
  assertStringIncludes((inner.shadowRoot as unknown as TestShadowRoot).innerHTML, 'inner fallback');
  // The error does not bubble past the inner boundary: the outer boundary
  // keeps its normal content (a childless <slot> serializes as an empty
  // string under the harness's shadow-root innerHTML).
  assertEquals(
    (outer.shadowRoot as unknown as TestShadowRoot).innerHTML.includes('outer fallback'),
    false,
  );

  document.body.removeChild(outer);
});

// ─── 11. formAssociated / ElementInternals ─────────────────────────

Deno.test('OpenElement attaches ElementInternals when formAssociated', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('form-el');
  class FormElement extends OpenElement {
    static override formAssociated = true;

    override render(): VNode | null {
      return jsx('input', {});
    }
  }
  customElements.define(tagName, FormElement);

  const el = document.createElement(tagName) as FormElement;
  document.body.appendChild(el);

  assertExists((el as unknown as { _internals?: ElementInternals })._internals);

  document.body.removeChild(el);
});

// ─── 12. params attribute parsing ──────────────────────────────────

Deno.test('OpenElement parses params attribute into reactive params property', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('params');
  class ParamsElement extends OpenElement {
    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ParamsElement);

  const el = document.createElement(tagName) as ParamsElement;
  el.setAttribute('params', JSON.stringify({ id: '42', slug: 'hello' }));
  document.body.appendChild(el);

  assertEquals(el.params, { id: '42', slug: 'hello' });

  document.body.removeChild(el);
});

Deno.test('OpenElement params setter is reactive', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('params-setter');
  class ParamsSetterElement extends OpenElement {
    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ParamsSetterElement);

  const el = document.createElement(tagName) as ParamsSetterElement;
  document.body.appendChild(el);

  el.params = { page: '2' };
  assertEquals(el.params, { page: '2' });

  document.body.removeChild(el);
});

Deno.test('OpenElement surfaces malformed params attribute as a logged error', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('params-malformed');
  class ParamsMalformedElement extends OpenElement {
    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ParamsMalformedElement);

  const el = document.createElement(tagName) as ParamsMalformedElement;
  el.setAttribute('params', '{not valid json');
  document.body.appendChild(el);

  // params should remain empty/default, not crash, and the element should still render.
  assertEquals(el.params, {});

  document.body.removeChild(el);
});

Deno.test('OpenElement rejects params attributes larger than 64 KiB', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('params-too-large');
  class ParamsTooLargeElement extends OpenElement {
    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ParamsTooLargeElement);

  const errors: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => errors.push(args.join(' '));
  try {
    const el = document.createElement(tagName) as ParamsTooLargeElement;
    el.setAttribute('params', JSON.stringify({ value: 'x'.repeat(65_536) }));
    document.body.appendChild(el);
    assertEquals(el.params, {});
    assertEquals(errors.some((message) => message.includes('64 KiB')), true);
    document.body.removeChild(el);
  } finally {
    console.error = originalError;
  }
});

Deno.test('OpenElement preserves an author supplied display style during DSD hydration', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('display');
  class DisplayElement extends OpenElement {
    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, DisplayElement);

  const el = createHydratedElement(tagName, '<span>ok</span>') as DisplayElement;
  el.style.display = 'inline-flex';
  el.connectedCallback();
  assertEquals(el.style.display, 'inline-flex');
  document.body.removeChild(el);
});

// ─── 8. Global styles (v0.41.0 / ADR-0061) ─────────────────────────

Deno.test('registerGlobalStyles applies to new OpenElement shadow roots', () => {
  if (!hasDOM) return;

  const globalSheet = new StyleSheet();
  globalSheet.replaceSync(':host { --global-token: 1; }');
  OpenElement.registerGlobalStyles(globalSheet);
  try {
    const tagName = uniqueTag('global-styled');
    class GlobalStyledElement extends OpenElement {
      override render(): VNode | null {
        return jsx('span', { children: 'ok' });
      }
    }
    customElements.define(tagName, GlobalStyledElement);

    const el = document.createElement(tagName) as GlobalStyledElement;
    document.body.appendChild(el);

    const root = el.shadowRoot as unknown as TestShadowRoot;
    assertExists(root);
    assertEquals(root.adoptedStyleSheets.includes(globalSheet), true);

    document.body.removeChild(el);
  } finally {
    OpenElement._resetGlobalStyles();
  }
});

Deno.test('registerGlobalStyles merges ahead of component-level styles', () => {
  if (!hasDOM) return;

  const globalSheet = new StyleSheet();
  globalSheet.replaceSync(':host { --g: 1; }');
  const componentSheet = new StyleSheet();
  componentSheet.replaceSync(':host { --c: 1; }');

  OpenElement.registerGlobalStyles(globalSheet);
  try {
    const tagName = uniqueTag('merge-styled');
    class MergeStyledElement extends OpenElement {
      static override styles = componentSheet;
      override render(): VNode | null {
        return jsx('span', { children: 'ok' });
      }
    }
    customElements.define(tagName, MergeStyledElement);

    const el = document.createElement(tagName) as MergeStyledElement;
    document.body.appendChild(el);

    const root = el.shadowRoot as unknown as TestShadowRoot;
    const sheets = root.adoptedStyleSheets as unknown[];
    // Global first, component second (cascade order: component wins)
    assertEquals(sheets.length, 2);
    assertEquals(sheets[0], globalSheet);
    assertEquals(sheets[1], componentSheet);

    document.body.removeChild(el);
  } finally {
    OpenElement._resetGlobalStyles();
  }
});

Deno.test('registerGlobalStyles is idempotent', () => {
  const sheet = new StyleSheet();
  sheet.replaceSync(':host { --x: 1; }');
  OpenElement.registerGlobalStyles(sheet);
  OpenElement.registerGlobalStyles(sheet);
  assertEquals(OpenElement.getGlobalStyles().length, 1);
  OpenElement._resetGlobalStyles();
});

Deno.test('registerGlobalStyles applies to elements without component styles', () => {
  if (!hasDOM) return;

  const globalSheet = new StyleSheet();
  globalSheet.replaceSync(':host { --global: 1; }');
  OpenElement.registerGlobalStyles(globalSheet);
  try {
    const tagName = uniqueTag('global-only');
    class GlobalOnlyElement extends OpenElement {
      // No static styles declared
      override render(): VNode | null {
        return jsx('span', { children: 'ok' });
      }
    }
    customElements.define(tagName, GlobalOnlyElement);

    const el = document.createElement(tagName) as GlobalOnlyElement;
    document.body.appendChild(el);

    const root = el.shadowRoot as unknown as TestShadowRoot;
    assertEquals(root.adoptedStyleSheets.includes(globalSheet), true);

    document.body.removeChild(el);
  } finally {
    OpenElement._resetGlobalStyles();
  }
});

// ─── 9. Theme broadcast (v0.41.0 / ADR-0061) ──────────────────────

Deno.test('connected OpenElement instances receive data-theme broadcasts', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('theme-bcast');
  class ThemeBcastElement extends OpenElement {
    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ThemeBcastElement);

  const docEl = document.documentElement as unknown as TestElement;

  // Pre-set document theme
  docEl.dataset.theme = 'dark';

  const el = document.createElement(tagName) as ThemeBcastElement;
  document.body.appendChild(el);

  // First connect: theme synced from document (existing behavior)
  assertEquals(el.getAttribute('data-theme'), 'dark');

  // Now switch document theme → should broadcast to connected instance
  docEl.dataset.theme = 'sepia';
  docEl.setAttribute('data-theme', 'sepia');

  assertEquals(el.getAttribute('data-theme'), 'sepia');

  document.body.removeChild(el);
  delete docEl.dataset.theme;
});

Deno.test('connected OpenElement instances clear data-theme when document theme is removed', () => {
  if (!hasDOM) return;
  OpenElement._resetGlobalStyles();

  const tagName = uniqueTag('theme-clear');
  class ThemeClearEl extends OpenElement {
    override render(): VNode {
      return jsx('div', {}, 'theme');
    }
  }
  customElements.define(tagName, ThemeClearEl);

  const docEl = document.documentElement as unknown as TestElement;
  docEl.dataset.theme = 'dark';
  docEl.setAttribute('data-theme', 'dark');

  const el = document.createElement(tagName) as OpenElementBase;
  document.body.appendChild(el);
  assertEquals(el.getAttribute('data-theme'), 'dark');

  delete docEl.dataset.theme;
  docEl.removeAttribute('data-theme');
  assertEquals(el.getAttribute('data-theme'), null);
});

Deno.test('disconnected instances stop receiving theme broadcasts', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('theme-disc');
  class ThemeDiscElement extends OpenElement {
    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ThemeDiscElement);

  const docEl = document.documentElement as unknown as TestElement;
  docEl.dataset.theme = 'light';

  const el = document.createElement(tagName) as ThemeDiscElement;
  document.body.appendChild(el);
  assertEquals(el.getAttribute('data-theme'), 'light');

  document.body.removeChild(el);

  // After disconnect, theme changes should NOT affect this element
  docEl.dataset.theme = 'dark';
  docEl.setAttribute('data-theme', 'dark');

  assertEquals(el.getAttribute('data-theme'), 'light');

  delete docEl.dataset.theme;
});

Deno.test('theme broadcasts skip hosts that declare their own data-theme (#773)', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('theme-self');
  class ThemeSelfElement extends OpenElement {
    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ThemeSelfElement);

  const docEl = document.documentElement as unknown as TestElement;
  docEl.dataset.theme = 'light';

  const el = document.createElement(tagName) as ThemeSelfElement;
  el.setAttribute('data-theme', 'brand');
  document.body.appendChild(el);

  // Host-owned theme is not overwritten by the document theme at connect...
  assertEquals(el.getAttribute('data-theme'), 'brand');

  // ...nor by broadcasts.
  docEl.dataset.theme = 'dark';
  docEl.setAttribute('data-theme', 'dark');
  assertEquals(el.getAttribute('data-theme'), 'brand');

  // ...nor cleared when the document theme is removed.
  delete docEl.dataset.theme;
  docEl.removeAttribute('data-theme');
  assertEquals(el.getAttribute('data-theme'), 'brand');

  document.body.removeChild(el);
});

Deno.test('multiple connected instances all receive theme broadcasts', () => {
  if (!hasDOM) return;

  const tagName = uniqueTag('theme-multi');
  class ThemeMultiElement extends OpenElement {
    override render(): VNode | null {
      return jsx('span', { children: 'ok' });
    }
  }
  customElements.define(tagName, ThemeMultiElement);

  const docEl = document.documentElement as unknown as TestElement;
  docEl.dataset.theme = 'light';

  const el1 = document.createElement(tagName) as ThemeMultiElement;
  const el2 = document.createElement(tagName) as ThemeMultiElement;
  document.body.appendChild(el1);
  document.body.appendChild(el2);

  assertEquals(el1.getAttribute('data-theme'), 'light');
  assertEquals(el2.getAttribute('data-theme'), 'light');

  docEl.dataset.theme = 'dark';
  docEl.setAttribute('data-theme', 'dark');

  assertEquals(el1.getAttribute('data-theme'), 'dark');
  assertEquals(el2.getAttribute('data-theme'), 'dark');

  document.body.removeChild(el1);
  document.body.removeChild(el2);
  delete docEl.dataset.theme;
});

// ─── 8e. Keyed <For> reconciliation (ADR-0124, #890) ──────────────
//
// With `key`, applyList must move surviving DOM nodes (state preservation)
// and render only new keys; without `key` behavior is unchanged (full
// re-render). The harness's matchesSelector only knows tag/class/[attr]
// selectors, so identity is tracked via getAttribute('id').

Deno.test('keyed For: head insertion moves surviving nodes, creates only the new one', () => {
  if (!hasDOM) return;

  const items = signal([
    { id: 1, name: 'one' },
    { id: 2, name: 'two' },
    { id: 3, name: 'three' },
  ]);

  const root = renderToDom(
    jsx('ul', {
      children: [
        For({
          each: items,
          key: (item: { id: number }) => item.id,
          children: (item: { id: number; name: string }) =>
            jsx('li', { id: `item-${item.id}`, children: item.name }),
        }),
      ],
    }),
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const list = container.querySelector('ul') as unknown as TestElement;
  const byId = new Map(
    list.querySelectorAll('li').map((node) => [node.getAttribute('id'), node]),
  );

  items.value = [
    { id: 0, name: 'zero' },
    { id: 1, name: 'one' },
    { id: 2, name: 'two' },
    { id: 3, name: 'three' },
  ];

  const after = list.querySelectorAll('li');
  for (const id of ['item-1', 'item-2', 'item-3']) {
    assertEquals(
      after.find((node) => node.getAttribute('id') === id),
      byId.get(id),
      `${id} must be the same DOM node (state preserved)`,
    );
  }
  assertEquals(after.length, 4);
  assertEquals(after[0].getAttribute('id'), 'item-0');
  assertEquals(
    after.map((node) => node.textContent),
    ['zero', 'one', 'two', 'three'],
  );
});

Deno.test('keyed For: removal disposes only the vanished item', () => {
  if (!hasDOM) return;

  const items = signal([
    { id: 1, name: 'one' },
    { id: 2, name: 'two' },
  ]);

  const root = renderToDom(
    jsx('ul', {
      children: [
        For({
          each: items,
          key: (item: { id: number }) => item.id,
          children: (item: { id: number; name: string }) =>
            jsx('li', { id: `item-${item.id}`, children: item.name }),
        }),
      ],
    }),
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const list = container.querySelector('ul') as unknown as TestElement;
  const surviving = list.querySelectorAll('li').find(
    (node) => node.getAttribute('id') === 'item-2',
  );

  items.value = [{ id: 2, name: 'two' }];

  const after = list.querySelectorAll('li');
  assertEquals(after.length, 1);
  assertEquals(after[0], surviving, 'surviving node must be the same DOM node');
});

// #915: same-key replacement pins Solid-style freeze semantics — a
// surviving key keeps its exact DOM node and its rendered content is NOT
// re-rendered from the new item object. Item content must be signal-driven
// (or driven by key-unique state) to update; this is documented in
// ADR-0124 Consequences.
Deno.test('keyed For: same-key replacement keeps frozen per-key content (#915)', () => {
  if (!hasDOM) return;

  const items = signal([
    { id: 1, name: 'one' },
  ]);

  const root = renderToDom(
    jsx('ul', {
      children: [
        For({
          each: items,
          key: (item: { id: number }) => item.id,
          children: (item: { id: number; name: string }) =>
            jsx('li', { id: `item-${item.id}`, children: item.name }),
        }),
      ],
    }),
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const list = container.querySelector('ul') as unknown as TestElement;
  const node = list.querySelector('li');

  items.value = [{ id: 1, name: 'two' }];

  assertEquals(list.querySelectorAll('li').length, 1);
  assertEquals(list.querySelector('li'), node, 'same-key item must keep its DOM node');
  assertEquals(
    node?.textContent,
    'one',
    'per-key content is frozen; the replacement object is not re-rendered',
  );
});

Deno.test('keyed For: duplicate keys keep last occurrence, dispose the displaced entry', () => {
  if (!hasDOM) return;

  const items = signal([{ id: 1 }, { id: 1 }]);
  const clicks: number[] = [];
  const warns: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warns.push(msg);

  try {
    const root = renderToDom(
      jsx('ul', {
        children: [
          For({
            each: items,
            key: (item: { id: number }) => item.id,
            children: (item: { id: number }) =>
              jsx('li', {
                id: `item-${item.id}`,
                onClick: () => clicks.push(item.id),
                children: String(item.id),
              }),
          }),
        ],
      }),
    );

    const container = document.createElement('div');
    container.appendChild(root);
    const list = container.querySelector('ul') as unknown as TestElement;
    assertEquals(list.querySelectorAll('li').length, 1, 'duplicate key collapses to one item');
    assertEquals(warns.length, 1, 'duplicate-key warning fires exactly once per binding');

    items.value = [{ id: 1 }];
    const kept = list.querySelectorAll('li').find(
      (node) => node.getAttribute('id') === 'item-1',
    ) as HTMLElement | undefined;
    assertExists(kept);
    assertEquals(list.querySelectorAll('li').length, 1);

    items.value = [{ id: 2 }];
    const after = list.querySelectorAll('li');
    assertEquals(after.length, 1, 'replaced entry must not survive as an orphan');
    assertEquals(after[0].getAttribute('id'), 'item-2');
    assertEquals(warns.length, 1, 'warning stays exactly-once across renders');

    // The displaced item's event binding must be disposed with it.
    kept.dispatchEvent(new Event('click'));
    assertEquals(clicks, [], 'displaced entry effects must be disposed');

    items.value = [{ id: 1 }];
    list.querySelectorAll('li').find((node) => node.getAttribute('id') === 'item-1')
      ?.dispatchEvent(new Event('click'));
    assertEquals(clicks, [1], 'fresh items still bind events (guard against false pass)');
  } finally {
    console.warn = origWarn;
  }
});

Deno.test('keyed For: duplicate-key displacement keeps new items before static siblings', () => {
  if (!hasDOM) return;

  const items = signal([{ id: 1 }]);
  const origWarn = console.warn;
  console.warn = () => {};

  try {
    const root = renderToDom(
      jsx('div', {
        children: [
          For({
            each: items,
            key: (item: { id: number }) => item.id,
            children: (item: { id: number }) =>
              jsx('li', { id: `item-${item.id}`, children: String(item.id) }),
          }),
          jsx('span', { children: 'tail' }),
        ],
      }),
    );

    const container = document.createElement('div');
    container.appendChild(root);
    const list = container.querySelector('div') as unknown as TestElement;

    // Duplicate key in an update: the first occurrence is displaced while the
    // insertion cursor (`placed`) still points at the detached node — the
    // replacement must not degrade to appending after the static sibling.
    items.value = [{ id: 1 }, { id: 1 }];

    const lis = list.querySelectorAll('li');
    assertEquals(lis.length, 1, 'duplicate key collapses to one item');
    const tail = list.querySelector('span');
    assertExists(tail);
    const liIndex = list.childNodes.indexOf(lis[0]);
    const tailIndex = list.childNodes.indexOf(tail);
    assertEquals(liIndex !== -1 && tailIndex !== -1, true);
    assertEquals(
      liIndex < tailIndex,
      true,
      'replacement item must be inserted before the static tail sibling',
    );
  } finally {
    console.warn = origWarn;
  }
});

Deno.test('keyed For: reorder preserves DOM node identity for surviving items', () => {
  if (!hasDOM) return;

  const items = signal([
    { id: 1, name: 'one' },
    { id: 2, name: 'two' },
    { id: 3, name: 'three' },
  ]);

  const root = renderToDom(
    jsx('ul', {
      children: [
        For({
          each: items,
          key: (item: { id: number }) => item.id,
          children: (item: { id: number; name: string }) =>
            jsx('li', { id: `item-${item.id}`, children: item.name }),
        }),
      ],
    }),
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const list = container.querySelector('ul') as unknown as TestElement;
  const byId = new Map(
    list.querySelectorAll('li').map((node) => [node.getAttribute('id'), node]),
  );

  items.value = [
    { id: 3, name: 'three' },
    { id: 1, name: 'one' },
    { id: 2, name: 'two' },
  ];

  const after = list.querySelectorAll('li');
  assertEquals(after.length, 3);
  for (const id of ['item-1', 'item-2', 'item-3']) {
    assertEquals(
      after.find((node) => node.getAttribute('id') === id),
      byId.get(id),
      `${id} must be the same DOM node after reorder`,
    );
  }
  assertEquals(after.map((node) => node.textContent), ['three', 'one', 'two']);
});

Deno.test('keyed For: removed item effects are disposed, survivors keep theirs', () => {
  if (!hasDOM) return;

  const items = signal([{ id: 1 }, { id: 2 }]);
  const clicks: number[] = [];

  const root = renderToDom(
    jsx('ul', {
      children: [
        For({
          each: items,
          key: (item: { id: number }) => item.id,
          children: (item: { id: number }) =>
            jsx('li', {
              id: `item-${item.id}`,
              onClick: () => clicks.push(item.id),
              children: String(item.id),
            }),
        }),
      ],
    }),
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const list = container.querySelector('ul') as unknown as TestElement;
  const removed = list.querySelectorAll('li').find(
    (node) => node.getAttribute('id') === 'item-2',
  ) as HTMLElement | undefined;
  const kept = list.querySelectorAll('li').find(
    (node) => node.getAttribute('id') === 'item-1',
  ) as HTMLElement | undefined;
  assertExists(removed);
  assertExists(kept);

  items.value = [{ id: 1 }];

  removed.dispatchEvent(new Event('click'));
  assertEquals(clicks, [], 'vanished item effects must be disposed');
  kept.dispatchEvent(new Event('click'));
  assertEquals(clicks, [1], 'surviving item effects must stay bound');
});

// #916: with a signal-bearing lifecycle, item effects must still land in
// the item's disposer set — before the fix, registerDispose hooked them to
// the abort signal ONLY, so disposeEntry ran an empty set on key removal
// and the detached item DOM kept reacting to signal updates.
Deno.test('keyed For: removed item stops reacting even with an abort-signal lifecycle (#916)', () => {
  if (!hasDOM) return;

  const items = signal([{ id: 1 }, { id: 2 }]);
  const counter = signal(0);
  const controller = new AbortController();
  const lifecycle: BindingLifecycle = {
    disposers: new Set<() => void>(),
    signal: controller.signal,
  };

  const root = renderToDom(
    jsx('div', {
      children: [
        For({
          each: items,
          key: (item: { id: number }) => item.id,
          children: () => jsx('span', { children: counter }),
        }),
      ],
    }),
    lifecycle,
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const spans = container.querySelectorAll('span');
  assertEquals(spans.length, 2);
  const detached = spans[1] as HTMLElement;

  items.value = [{ id: 1 }];
  counter.value = 99;

  assertEquals(
    detached.textContent,
    '0',
    'detached item DOM must stop reacting to signal updates after key removal',
  );
  assertEquals(
    lifecycle.disposers?.size ?? -1,
    1,
    'only the list binding remains registered',
  );
});

// #916 residual: applyEvent skipped registerDispose entirely when the
// lifecycle carried a signal, so the listener never landed in the item's
// disposer set — key removal left it live on the detached DOM until the
// root abort.
Deno.test('keyed For: removed item event listeners are disposed with an abort-signal lifecycle (#916 residual)', () => {
  if (!hasDOM) return;

  const items = signal([{ id: 1 }, { id: 2 }]);
  const clicks: number[] = [];
  const controller = new AbortController();
  const lifecycle: BindingLifecycle = {
    disposers: new Set<() => void>(),
    signal: controller.signal,
  };

  const root = renderToDom(
    jsx('div', {
      children: [
        For({
          each: items,
          key: (item: { id: number }) => item.id,
          children: (item: { id: number }) =>
            jsx('button', {
              onClick: () => clicks.push(item.id),
              children: String(item.id),
            }),
        }),
      ],
    }),
    lifecycle,
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const buttons = container.querySelectorAll('button');
  assertEquals(buttons.length, 2);
  const detached = buttons[1] as HTMLElement;

  items.value = [{ id: 1 }];

  detached.dispatchEvent(new Event('click'));
  assertEquals(clicks, [], 'removed item listener must be disposed with its entry');

  const kept = container.querySelectorAll('button')[0] as HTMLElement;
  kept.dispatchEvent(new Event('click'));
  assertEquals(clicks, [1], 'surviving item listener must stay bound');
});

// #918 coverage matrix: nested lists, reorder+bindings, transitions, fragments.

// #918: nested keyed For — inner re-render must stay within its own list,
// and removing an outer key must cascade disposal into the inner bindings.
Deno.test('keyed For: nested lists isolate re-renders and cascade disposal (#918)', () => {
  if (!hasDOM) return;

  const counter = signal(0);
  const innerA = signal([{ id: 1 }, { id: 2 }]);
  const innerB = signal([{ id: 2 }]);
  const groups = signal([
    { id: 'a', items: innerA },
    { id: 'b', items: innerB },
  ]);

  const root = renderToDom(
    jsx('div', {
      children: [
        For({
          each: groups,
          key: (g: { id: string }) => g.id,
          children: (g: { id: string; items: typeof innerA }) =>
            jsx('ul', {
              id: `group-${g.id}`,
              children: [
                For({
                  each: g.items,
                  key: (i: { id: number }) => i.id,
                  children: () => jsx('li', { children: [jsx('span', { children: counter })] }),
                }),
              ],
            }),
        }),
      ],
    }),
  );

  const container = document.createElement('div');
  container.appendChild(root);
  assertEquals(container.querySelectorAll('li').length, 3);

  innerA.value = [{ id: 1 }];
  const containerEl = container as unknown as TestElement;
  const groupA = containerEl.querySelectorAll('ul').find(
    (node) => node.getAttribute('id') === 'group-a',
  );
  const groupB = containerEl.querySelectorAll('ul').find(
    (node) => node.getAttribute('id') === 'group-b',
  );
  assertExists(groupA);
  assertExists(groupB);
  assertEquals(groupA.querySelectorAll('li').length, 1);
  assertEquals(
    groupB.querySelectorAll('li').length,
    1,
    'inner re-render must not touch the sibling inner list',
  );

  const detachedSpan = groupB.querySelector('span');
  assertExists(detachedSpan);
  groups.value = [{ id: 'a', items: innerA }];
  counter.value = 99;
  assertEquals(
    detachedSpan.textContent,
    '0',
    'outer key removal must cascade disposal into the inner list binding',
  );
});

// #918: reorder must preserve per-item signal bindings, not just node
// identity — the existing reorder test only asserts the DOM node objects.
Deno.test('keyed For: reorder keeps signal bindings attached to their nodes (#918)', () => {
  if (!hasDOM) return;

  const item1 = { id: 1, n: signal('one') };
  const item2 = { id: 2, n: signal('two') };
  const items = signal([item1, item2]);

  const root = renderToDom(
    jsx('ul', {
      children: [
        For({
          each: items,
          key: (item: { id: number }) => item.id,
          children: (item: { id: number; n: typeof item1.n }) =>
            jsx('li', { id: `item-${item.id}`, children: item.n }),
        }),
      ],
    }),
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const list = container.querySelector('ul') as unknown as TestElement;
  const secondBefore = list.querySelector('#item-2');

  items.value = [item2, item1];
  item2.n.value = 'TWO';

  const firstAfter = list.querySelectorAll('li')[0];
  assertEquals(firstAfter.textContent, 'TWO', 'signal binding must move with its node');
  assertEquals(
    list.querySelector('#item-2'),
    secondBefore,
    'node identity preserved across reorder',
  );
});

// #918: empty and non-array transitions must dispose all keyed entries.
Deno.test('keyed For: empty and non-array transitions clean up fully (#918)', () => {
  if (!hasDOM) return;

  const counter = signal(0);
  const items = signal([{ id: 1 }, { id: 2 }]);

  const root = renderToDom(
    jsx('ul', {
      children: [
        For({
          each: items,
          key: (item: { id: number }) => item.id,
          children: () => jsx('li', { children: [jsx('span', { children: counter })] }),
        }),
      ],
    }),
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const list = container.querySelector('ul') as unknown as TestElement;
  const detachedSpan = list.querySelectorAll('span')[1];

  items.value = [];
  assertEquals(list.querySelectorAll('li').length, 0, 'empty list must clear');

  items.value = [{ id: 1 }];
  assertEquals(list.querySelectorAll('li').length, 1, 're-populate after empty must render');

  items.value = null as never;
  assertEquals(list.querySelectorAll('li').length, 0, 'non-array value must clear');

  counter.value = 99;
  assertEquals(
    detachedSpan.textContent,
    '0',
    'entries disposed by the empty transition must not react to later pushes',
  );
});

// #918: fragment (multi-root) items must move as a unit on reorder.
Deno.test('keyed For: fragment items reorder as a unit, order preserved (#918)', () => {
  if (!hasDOM) return;

  const items = signal([{ id: 1 }, { id: 2 }]);

  const root = renderToDom(
    jsx('ul', {
      children: [
        For({
          each: items,
          key: (item: { id: number }) => item.id,
          children: (item: { id: number }) => [
            jsx('span', { id: `s-${item.id}` }),
            jsx('em', { id: `e-${item.id}` }),
          ],
        }),
      ],
    }),
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const list = container.querySelector('ul') as unknown as TestElement;
  const span1Before = list.querySelectorAll('span').find(
    (node) => node.getAttribute('id') === 's-1',
  );
  assertExists(span1Before);

  items.value = [{ id: 2 }, { id: 1 }];

  const ids = list.childNodes
    .filter((n): n is TestElement =>
      'tagName' in n && n.tagName === 'SPAN' || 'tagName' in n && n.tagName === 'EM'
    )
    .map((n) => n.getAttribute('id') ?? '');
  assertEquals(ids, ['s-2', 'e-2', 's-1', 'e-1'], 'both roots of an item must move together');
  assertEquals(
    list.querySelectorAll('span').find((node) => node.getAttribute('id') === 's-1'),
    span1Before,
    'fragment roots keep node identity across reorder',
  );
});

Deno.test('unkeyed For: behavior unchanged (full re-render)', () => {
  if (!hasDOM) return;

  const items = signal([{ id: 1 }, { id: 2 }]);

  const root = renderToDom(
    jsx('ul', {
      children: [
        For({
          each: items,
          children: (item: { id: number }) =>
            jsx('li', { id: `item-${item.id}`, children: String(item.id) }),
        }),
      ],
    }),
  );

  const container = document.createElement('div');
  container.appendChild(root);
  const list = container.querySelector('ul') as unknown as TestElement;
  const oldNode = list.querySelectorAll('li').find(
    (node) => node.getAttribute('id') === 'item-1',
  );

  items.value = [{ id: 1 }, { id: 2 }, { id: 3 }];

  const newNode = list.querySelectorAll('li').find(
    (node) => node.getAttribute('id') === 'item-1',
  );
  assertEquals(newNode !== oldNode, true, 'unkeyed list must re-render items');
  assertEquals(list.querySelectorAll('li').length, 3);
});
