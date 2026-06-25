/**
 * @openelement/core — Test utilities.
 *
 * v0.25.0 (SOP-009): Single re-export point for all core test imports.
 * Tests import from './test-utils.ts' instead of '../src/xxx.ts'.
 *
 * v0.40.0: DsdElement and ErrorBoundary moved to @openelement/element.
 * Core tests import them directly from @openelement/element if needed.
 */

// ── JSX runtime ───────────────────────────────────────────────────
export { Fragment, jsx, jsxDEV, jsxs } from '../src/jsx-runtime.ts';
export { renderToDom } from '../src/jsx-render-dom.ts';
export { renderDsdTree, serializeRenderNode } from '../src/render-ir.ts';
export { isComponentCtor, isComponentFn, isVNode } from '../src/vnode.ts';
export type { ComponentCtor, ComponentFn, VNode } from '@openelement/protocol/vnode';

// ── Signals ───────────────────────────────────────────────────────
export { isSignalLike, unwrapSignalLike } from '@openelement/signal';
export type { SignalLike } from '@openelement/protocol/signal';

// ── Island / SSR ──────────────────────────────────────────────────
export { bindSsrProps, defineIsland, getSsrProps } from '../src/island.ts';
export type { IslandOptions } from '@openelement/protocol/island';

// ── Rendering ─────────────────────────────────────────────────────
export { renderDsd } from '../src/render-dsd.ts';
export { renderDsdStream } from '../src/render-dsd-stream.ts';

// ── Signal Context (v0.25) ────────────────────────────────────────
export { consumeContext, createContext, provideContext } from '../src/signal-context.ts';
export type { Context } from '../src/signal-context.ts';

// ── Cross-package (signals, style-sheet) ───────────────────────────
export { computed, effect, signal } from '../../signal/src/framework.ts';
export { StyleSheet } from '../src/style-sheet.ts';
export type { StyleSheetLike } from '@openelement/protocol/style-sheet';

// ── Fake DOM harness (shared test double for Deno runner) ──────────

export class TestEvent implements Event {
  readonly NONE = 0 as const;
  readonly CAPTURING_PHASE = 1 as const;
  readonly AT_TARGET = 2 as const;
  readonly BUBBLING_PHASE = 3 as const;

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

export class TestClassList {
  #classes = new Set<string>();
  value = '';

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

  forEach(): void {}

  *[Symbol.iterator](): IterableIterator<string> {
    yield* this.#classes.values();
  }

  toString(): string {
    return Array.from(this.#classes).join(' ');
  }
}

export class TestStyle {
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

export class TestNode {
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

export class TestTextNode extends TestNode {
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

export class TestComment extends TestTextNode {
  override nodeType = 8;
}

export class TestElement extends TestNode {
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

export class TestShadowRoot extends TestElement {
  host: TestElement;
  override nodeType = 11;

  constructor(host: TestElement) {
    super('shadowroot');
    this.host = host;
  }

  override querySelectorAll(selector: string): TestElement[] {
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

export class TestDocument {
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
const _savedRaf = (globalThis as unknown as Record<string, unknown>).requestAnimationFrame;
let _rafCallbacks: FrameRequestCallback[] = [];

function setupMockDocument(): void {
  (globalThis as unknown as Record<string, unknown>).document = new TestDocument();
  (globalThis as unknown as Record<string, unknown>).requestAnimationFrame = (
    cb: FrameRequestCallback,
  ) => {
    _rafCallbacks.push(cb);
    return _rafCallbacks.length;
  };
}

function restoreMockDocument(): void {
  (globalThis as unknown as Record<string, unknown>).document = _savedDocument;
  (globalThis as unknown as Record<string, unknown>).requestAnimationFrame = _savedRaf;
  _rafCallbacks = [];
}

export function withMockDocument(fn: () => void): void {
  try {
    setupMockDocument();
    fn();
  } finally {
    restoreMockDocument();
  }
}

export function flushRaf(): void {
  const cbs = _rafCallbacks;
  _rafCallbacks = [];
  for (const cb of cbs) cb(performance.now());
}

export function asTestElement(el: Element): TestElement {
  return el as unknown as TestElement;
}
