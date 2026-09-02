/**
 * facade-dom.ts — DOM harness for compiled-facade (public OpenElement) tests.
 *
 * Deno's test runner has no browser DOM. This harness installs just enough of
 * the platform — a custom-elements registry with define-time
 * observedAttributes snapshots, upgrade-through-construction
 * (`document.createElement(tag)` runs the real compiled class constructor),
 * attributeChangedCallback dispatch, shadow roots, event capture/bubble
 * propagation, and connect/disconnect dispatch — for the public OpenElement
 * facade to run its compiled kernel end to end.
 *
 * Globals must be installed BEFORE importing @openelement/element: the facade
 * captures its HTMLElement base class at module evaluation time. Test files
 * call installFacadeDom() at module top level and then dynamically import the
 * package (the same pattern open-element.test.ts used).
 */

export interface FacadeDom {
  document: FacadeDocument;
  registry: FacadeCustomElementRegistry;
}

interface FacadeListener {
  fn: (event: FacadeEvent) => void;
  capture: boolean;
  once: boolean;
}

export class FacadeEvent {
  type: string;
  bubbles: boolean;
  composed: boolean;
  target: unknown = null;
  currentTarget: unknown = null;
  defaultPrevented = false;

  constructor(type: string, init?: { bubbles?: boolean; composed?: boolean }) {
    this.type = type;
    this.bubbles = init?.bubbles ?? false;
    this.composed = init?.composed ?? false;
  }

  preventDefault(): void {
    this.defaultPrevented = true;
  }
}

type FacadeNode = FacadeElement | FacadeText | FacadeComment | FacadeShadowRoot | FacadeDocument;

export abstract class FacadeNodeBase {
  readonly ownerDocument: FacadeDocument;
  parentNode: FacadeElement | FacadeShadowRoot | FacadeDocument | null = null;
  childNodes: FacadeNode[] = [];

  constructor(ownerDocument: FacadeDocument) {
    this.ownerDocument = ownerDocument;
  }

  get nextSibling(): FacadeNode | null {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    const index = siblings.indexOf(this as unknown as FacadeNode);
    return index < 0 ? null : siblings[index + 1] ?? null;
  }

  getRootNode(): FacadeNode {
    // deno-lint-ignore no-this-alias
    let root: FacadeNodeBase = this;
    while (root.parentNode) root = root.parentNode;
    return root as unknown as FacadeNode;
  }

  appendChild(node: FacadeNode): FacadeNode {
    this.#detach(node);
    node.parentNode = this as unknown as FacadeElement;
    this.childNodes.push(node);
    this.#propagateConnection(node);
    return node;
  }

  insertBefore(node: FacadeNode, reference: FacadeNode | null): FacadeNode {
    this.#detach(node);
    if (reference === null) return this.appendChild(node);
    const index = this.childNodes.indexOf(reference);
    if (index < 0) throw new Error('insertBefore reference is not a child');
    node.parentNode = this as unknown as FacadeElement;
    this.childNodes.splice(index, 0, node);
    this.#propagateConnection(node);
    return node;
  }

  removeChild(node: FacadeNode): FacadeNode {
    const index = this.childNodes.indexOf(node);
    if (index < 0) throw new Error('removeChild node is not a child');
    this.childNodes.splice(index, 1);
    node.parentNode = null;
    setConnected(node, false);
    return node;
  }

  #detach(node: FacadeNode): void {
    const parent = node.parentNode;
    if (!parent) return;
    const index = parent.childNodes.indexOf(node);
    if (index >= 0) parent.childNodes.splice(index, 1);
    node.parentNode = null;
  }

  #propagateConnection(node: FacadeNode): void {
    const host = this as unknown as { isConnected?: boolean; nodeType: number };
    const connected = host.isConnected === true || host.nodeType === 9;
    if (connected) setConnected(node, true);
  }
}

function setConnected(node: FacadeNode, connected: boolean): void {
  const element = node as unknown as {
    __connected?: boolean;
    childNodes: FacadeNode[];
    connectedCallback?(): void;
    disconnectedCallback?(): void;
  };
  if ((element.__connected ?? false) === connected) return;
  element.__connected = connected;
  if (connected) element.connectedCallback?.();
  else element.disconnectedCallback?.();
  for (const child of element.childNodes) setConnected(child, connected);
}

export class FacadeText extends FacadeNodeBase {
  readonly nodeType = 3;
  #data: string;

  constructor(ownerDocument: FacadeDocument, data: string) {
    super(ownerDocument);
    this.#data = String(data);
  }

  get data(): string {
    return this.#data;
  }

  set data(value: string) {
    this.#data = String(value);
  }
}

export class FacadeComment extends FacadeNodeBase {
  readonly nodeType = 8;

  constructor(ownerDocument: FacadeDocument, readonly data: string) {
    super(ownerDocument);
  }
}

export class FacadeShadowRoot extends FacadeNodeBase {
  readonly nodeType = 11;
  adoptedStyleSheets: unknown[] = [];

  constructor(ownerDocument: FacadeDocument, readonly host: FacadeElement) {
    super(ownerDocument);
  }
}

/** Define-time observedAttributes snapshots, keyed by constructor. */
const defineTimeObservedAttributes = new WeakMap<object, readonly string[]>();

export class FacadeElement extends FacadeNodeBase {
  readonly nodeType = 1;
  readonly tagName: string;
  readonly localName: string;
  readonly attributes = new Map<string, string>();
  readonly listeners = new Map<string, FacadeListener[]>();
  shadowRoot: FacadeShadowRoot | null = null;
  adoptedStyleSheets: unknown[] = [];
  #closedShadowRoot: FacadeShadowRoot | null = null;

  constructor(tagName?: string, ownerDocument?: FacadeDocument) {
    const doc = ownerDocument ?? installedDocument;
    if (!doc) throw new Error('facade-dom: installFacadeDom() must run first');
    super(doc);
    const tag = tagName ??
      (new.target as unknown as { __localName?: string }).__localName ?? 'div';
    this.localName = tag.toLowerCase();
    this.tagName = tag.toUpperCase();
  }

  get isConnected(): boolean {
    return (this as unknown as { __connected?: boolean }).__connected ?? false;
  }

  get dataset(): Record<string, string> {
    const attributes = this.attributes;
    return new Proxy({} as Record<string, string>, {
      get: (_target, prop) =>
        typeof prop === 'string' ? attributes.get(`data-${prop}`) ?? undefined : undefined,
      set: (_target, prop, value) => {
        if (typeof prop === 'string') this.setAttribute(`data-${prop}`, String(value));
        return true;
      },
      deleteProperty: (_target, prop) => {
        if (typeof prop === 'string') this.removeAttribute(`data-${prop}`);
        return true;
      },
    });
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  getAttributeNames(): string[] {
    return [...this.attributes.keys()];
  }

  setAttribute(name: string, value: string): void {
    const oldValue = this.attributes.get(name) ?? null;
    const next = String(value);
    this.attributes.set(name, next);
    this.#notifyAttribute(name, oldValue, next);
  }

  removeAttribute(name: string): void {
    if (!this.attributes.has(name)) return;
    const oldValue = this.attributes.get(name) ?? null;
    this.attributes.delete(name);
    this.#notifyAttribute(name, oldValue, null);
  }

  #notifyAttribute(name: string, oldValue: string | null, newValue: string | null): void {
    const observed = defineTimeObservedAttributes.get(this.constructor) ??
      (this.constructor as unknown as { observedAttributes?: string[] }).observedAttributes;
    if (observed?.includes(name)) {
      const element = this as unknown as {
        attributeChangedCallback?(n: string, o: string | null, v: string | null): void;
      };
      element.attributeChangedCallback?.(name, oldValue, newValue);
    }
    notifyMutationObservers(this, name);
  }

  attachShadow(init: { mode: 'open' | 'closed'; delegatesFocus?: boolean }): FacadeShadowRoot {
    if (this.shadowRoot) throw new Error('shadow root already exists');
    const root = new FacadeShadowRoot(this.ownerDocument, this);
    if (init.mode === 'open') this.shadowRoot = root;
    else this.#closedShadowRoot = root;
    return root;
  }

  attachInternals(): ElementInternals {
    // Real browsers expose the host's own shadow root through its internals,
    // including a closed root attached declaratively (DSD) — the only standard
    // channel through which a closed DSD root is reachable for a claim.
    const shadowRoot = this.shadowRoot ?? this.#closedShadowRoot;
    return {
      shadowRoot,
      setFormValue: () => {},
      setValidity: () => {},
    } as unknown as ElementInternals;
  }

  addEventListener(
    type: string,
    fn: (event: FacadeEvent) => void,
    options?: { capture?: boolean; once?: boolean },
  ): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push({ fn, capture: options?.capture === true, once: options?.once === true });
    this.listeners.set(type, listeners);
  }

  removeEventListener(
    type: string,
    fn: (event: FacadeEvent) => void,
    options?: { capture?: boolean },
  ): void {
    const listeners = this.listeners.get(type);
    if (!listeners) return;
    const capture = options?.capture === true;
    const index = listeners.findIndex((listener) =>
      listener.fn === fn && listener.capture === capture
    );
    if (index >= 0) listeners.splice(index, 1);
  }

  dispatchEvent(event: FacadeEvent): boolean {
    if (event.target === null) event.target = this;
    const path = propagationPath(event.target as FacadeNode);
    for (const phase of ['capture', 'bubble'] as const) {
      const ordered = phase === 'capture' ? [...path].reverse() : path;
      for (const node of ordered) {
        if (!(node instanceof FacadeElement) && !(node instanceof FacadeDocument)) continue;
        const listeners = [...(node.listeners.get(event.type) ?? [])];
        for (const listener of listeners) {
          if (listener.capture !== (phase === 'capture')) continue;
          event.currentTarget = node;
          listener.fn(event);
          if (listener.once) node.removeEventListener(event.type, listener.fn, listener);
        }
      }
    }
    return !event.defaultPrevented;
  }
}

/** target -> ... -> root, crossing shadow boundaries via the host. */
function propagationPath(target: FacadeNode): FacadeNode[] {
  const path: FacadeNode[] = [];
  let current: FacadeNode | null = target;
  while (current) {
    path.push(current);
    if (current.parentNode) {
      current = current.parentNode as FacadeNode;
    } else if (current instanceof FacadeShadowRoot) {
      current = current.host;
    } else {
      current = null;
    }
  }
  return path;
}

// ─── MutationObserver harness (theme broadcasts) ───────────────────

interface ObserverRecord {
  callback: (mutations: Array<{ type: string; attributeName: string; target: unknown }>) => void;
  target: FacadeElement;
  options: { attributes?: boolean; attributeFilter?: string[] };
}

const observerRegistry = new Set<ObserverRecord>();

class FacadeMutationObserver {
  #callback: ObserverRecord['callback'];
  #records: ObserverRecord[] = [];

  constructor(callback: ObserverRecord['callback']) {
    this.#callback = callback;
  }

  observe(target: unknown, options: ObserverRecord['options']): void {
    const record: ObserverRecord = {
      callback: this.#callback,
      target: target as FacadeElement,
      options,
    };
    this.#records.push(record);
    observerRegistry.add(record);
  }

  disconnect(): void {
    for (const record of this.#records) observerRegistry.delete(record);
    this.#records = [];
  }

  takeRecords(): unknown[] {
    return [];
  }
}

function notifyMutationObservers(target: FacadeElement, attributeName: string): void {
  const byCallback = new Map<
    ObserverRecord['callback'],
    Array<
      { type: string; attributeName: string; target: unknown }
    >
  >();
  for (const record of observerRegistry) {
    if (record.target !== target) continue;
    if (record.options.attributeFilter && !record.options.attributeFilter.includes(attributeName)) {
      continue;
    }
    const mutations = byCallback.get(record.callback) ?? [];
    mutations.push({ type: 'attributes', attributeName, target });
    byCallback.set(record.callback, mutations);
  }
  for (const [callback, mutations] of byCallback) callback(mutations);
}

// ─── Document + registry ───────────────────────────────────────────

export class FacadeDocument extends FacadeNodeBase {
  readonly nodeType = 9;
  readonly documentElement: FacadeElement;
  readonly head: FacadeElement;
  readonly body: FacadeElement;
  readonly listeners = new Map<string, FacadeListener[]>();

  constructor() {
    super(undefined as unknown as FacadeDocument);
    (this as { ownerDocument: FacadeDocument }).ownerDocument = this;
    this.documentElement = new FacadeElement('html', this);
    this.head = new FacadeElement('head', this);
    this.body = new FacadeElement('body', this);
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.appendChild(this.documentElement);
  }

  createElement(tagName: string): FacadeElement {
    const ctor = installedRegistry?.get(tagName) as unknown as
      | (new () => FacadeElement)
      | undefined;
    return ctor ? new ctor() : new FacadeElement(tagName);
  }

  createTextNode(data: string): FacadeText {
    return new FacadeText(this, data);
  }

  createComment(data: string): FacadeComment {
    return new FacadeComment(this, data);
  }

  addEventListener(
    type: string,
    fn: (event: FacadeEvent) => void,
    options?: { capture?: boolean; once?: boolean },
  ): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push({ fn, capture: options?.capture === true, once: options?.once === true });
    this.listeners.set(type, listeners);
  }

  removeEventListener(
    type: string,
    fn: (event: FacadeEvent) => void,
    options?: { capture?: boolean },
  ): void {
    const listeners = this.listeners.get(type);
    if (!listeners) return;
    const capture = options?.capture === true;
    const index = listeners.findIndex((l) => l.fn === fn && l.capture === capture);
    if (index >= 0) listeners.splice(index, 1);
  }
}

export class FacadeCustomElementRegistry {
  #definitions = new Map<string, CustomElementConstructor>();

  define(name: string, ctor: CustomElementConstructor): void {
    if (this.#definitions.has(name)) throw new Error(`"${name}" is already defined`);
    this.#definitions.set(name, ctor);
    // Browsers read observedAttributes exactly once at define() time.
    const observed = (ctor as unknown as { observedAttributes?: string[] }).observedAttributes;
    defineTimeObservedAttributes.set(ctor, observed ? [...observed] : []);
    (ctor as unknown as { __localName?: string }).__localName = name;
  }

  get(name: string): CustomElementConstructor | undefined {
    return this.#definitions.get(name);
  }
}

// ─── Installation ──────────────────────────────────────────────────

let installedDocument: FacadeDocument | undefined;
let installedRegistry: FacadeCustomElementRegistry | undefined;

/**
 * Install the harness globals. Idempotent within one test process; returns
 * the shared document and registry.
 */
export function installFacadeDom(): FacadeDom {
  if (installedDocument && installedRegistry) {
    return { document: installedDocument, registry: installedRegistry };
  }
  const document = new FacadeDocument();
  const registry = new FacadeCustomElementRegistry();
  installedDocument = document;
  installedRegistry = registry;

  const install = (name: string, value: unknown): void => {
    Object.defineProperty(globalThis, name, { configurable: true, value });
  };
  install('HTMLElement', FacadeElement);
  install('document', document);
  install('customElements', registry);
  install('Event', FacadeEvent);
  install('MutationObserver', FacadeMutationObserver);
  install('requestAnimationFrame', (callback: () => void) => {
    callback();
    return 0;
  });
  install(
    'CSSStyleSheet',
    class {
      cssRules: Array<{ cssText: string }> = [];
      replaceSync(text: string): void {
        this.cssRules = text.split('}')
          .map((rule) => rule.trim())
          .filter((rule) => rule.length > 0)
          .map((rule) => ({ cssText: `${rule}}` }));
      }
    },
  );
  return { document, registry };
}

// ─── Serialization helpers (test-side) ─────────────────────────────

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** Serialize a harness subtree; used to snapshot claimed DOM in assertions. */
export function toHtml(node: FacadeNode): string {
  if (node instanceof FacadeText) return escapeText(node.data);
  if (node instanceof FacadeComment) return `<!--${node.data}-->`;
  if (node instanceof FacadeShadowRoot || node instanceof FacadeDocument) {
    return node.childNodes.map(toHtml).join('');
  }
  const tag = node.localName;
  const attrs = [...node.attributes.entries()]
    .map(([name, value]) =>
      ` ${name}="${value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`
    )
    .join('');
  if (VOID_TAGS.has(tag)) return `<${tag}${attrs}>`;
  return `<${tag}${attrs}>${node.childNodes.map(toHtml).join('')}</${tag}>`;
}

function unescapeText(value: string): string {
  return value.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll(
    '&amp;',
    '&',
  );
}

/**
 * Parse serialized HTML into harness nodes owned by `doc` (deterministic
 * subset parser, same discipline as compiled-runtime/test-dom.ts).
 */
export function parseHtml(doc: FacadeDocument, html: string): FacadeElement {
  const host = new FacadeElement('parsed-host');
  const stack: Array<FacadeElement | FacadeShadowRoot> = [host];
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)) {
    const token = match[0];
    const parent = stack[stack.length - 1];
    if (token.startsWith('<!--')) {
      parent.appendChild(doc.createComment(token.slice(4, -3)));
    } else if (token.startsWith('</')) {
      stack.pop();
    } else if (token.startsWith('<')) {
      const inner = token.slice(1, -1);
      const space = inner.search(/\s/);
      const tag = (space < 0 ? inner : inner.slice(0, space)).toLowerCase();
      const element = doc.createElement(tag);
      const attrs = space < 0 ? '' : inner.slice(space);
      for (const attr of attrs.matchAll(/([\w:.-]+)(?:="([^"]*)")?/g)) {
        element.setAttribute(attr[1], unescapeText(attr[2] ?? ''));
      }
      parent.appendChild(element);
      if (!VOID_TAGS.has(tag)) stack.push(element);
    } else {
      parent.appendChild(doc.createTextNode(unescapeText(token)));
    }
  }
  return host;
}

/**
 * Simulate a browser upgrade from serialized compiled output: build the
 * upgraded host via the registry, apply its serialized attributes, attach the
 * serialized shadow content (DSD) or light children, and connect it. Returns
 * the connected element. Node identity of the parsed content is preserved so
 * tests can prove the claim performed no re-allocation.
 */
export function mountSerialized(
  dom: FacadeDom,
  serialized: string,
  beforeConnect?: (element: FacadeElement) => void,
): FacadeElement {
  const parsed = parseHtml(dom.document, serialized);
  const parsedHost = parsed.childNodes[0] as FacadeElement;
  const tag = parsedHost.localName;
  const element = dom.document.createElement(tag);
  for (const [name, value] of parsedHost.attributes) element.setAttribute(name, value);

  const first = parsedHost.childNodes[0];
  const isDsd = first instanceof FacadeElement && first.localName === 'template' &&
    first.hasAttribute('shadowrootmode');
  if (isDsd) {
    const mode = first.getAttribute('shadowrootmode') === 'closed' ? 'closed' : 'open';
    const root = element.attachShadow({ mode });
    for (const child of [...first.childNodes]) root.appendChild(child);
    // Retain the closed root for the kernel's re-entry path.
    if (mode === 'closed') {
      (element as unknown as { __closedRoot?: FacadeShadowRoot }).__closedRoot = root;
    }
  } else {
    for (const child of [...parsedHost.childNodes]) element.appendChild(child);
  }

  beforeConnect?.(element);
  dom.document.body.appendChild(element);
  return element;
}
