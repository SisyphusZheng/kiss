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

import {
  assertEquals,
  assertExists,
  assertInstanceOf,
  assertStringIncludes,
} from 'jsr:@std/assert@1';
import type { OpenElement as OpenElementBase } from '@openelement/element';
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
      const data = nextTag.endsWith('--') ? nextTag.slice(3, -2) : nextTag.slice(3);
      el.appendChild(new TestCommentNode(data));
      const end = html.indexOf('-->', nextClose);
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
const { jsx } = await import('@openelement/element/jsx-runtime');
const { signal } = await import('@openelement/element');
const { StyleSheet } = await import('@openelement/element');
const { renderDsdTree } = await import('@openelement/element');
const { Show } = await import('../src/internal/core/jsx-runtime.ts');

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

  const el = createHydratedElement(tagName, ssrHtml);
  const root = el.shadowRoot as unknown as TestShadowRoot;

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

  const el = createHydratedElement(tagName, ssrHtml);
  const root = el.shadowRoot as unknown as TestShadowRoot;

  // One binding vs two SSR markers: degrade re-renders from the client vnode.
  const buttons = root.querySelectorAll('button');
  assertEquals(buttons.length, 1);
  buttons[0].dispatchEvent(new Event('click'));
  assertEquals(fired, ['one']);

  document.body.removeChild(el);
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
