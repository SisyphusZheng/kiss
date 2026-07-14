/**
 * @openelement/ui public contract tests.
 */
import {
  assertEquals,
  assertExists,
  assertFalse,
  assertStringIncludes,
} from 'jsr:@std/assert@^1.0.0';
import type { VNode } from '@openelement/element';

type TestAttributeStore = WeakMap<object, Map<string, string>>;
type TestListenerStore = WeakMap<object, Map<string, Set<EventListener>>>;

interface ComponentModule {
  tagName: string;
  [exportName: string]: unknown;
}

interface RenderableElement extends HTMLElement {
  render(): unknown;
}

type RenderableElementConstructor = new () => RenderableElement;

interface ManifestDeclaration {
  tagName?: string;
  openElement?: {
    module?: string;
    hydrate?: string;
  };
}

interface ManifestModule {
  manifest: {
    packageName: string;
    declarations: ManifestDeclaration[];
  };
}

interface MockElement {
  tagName: string;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  hasAttribute(name: string): boolean;
  removeAttribute(name: string): void;
  textContent: string;
  innerHTML: string;
  classList: {
    toggle(token: string, force?: boolean): boolean;
    contains(token: string): boolean;
  };
}

class TestHTMLElement {
  static observedAttributes?: readonly string[];

  readonly #attributes: TestAttributeStore;
  readonly #listeners: TestListenerStore;
  readonly #children: TestHTMLElement[] = [];
  #textContent = '';

  classList = {
    toggle: (_token: string, _force?: boolean) => false,
    contains: (_token: string) => false,
    add: (_token: string) => {},
    remove: (_token: string) => {},
  };

  constructor(attributes: TestAttributeStore, listeners: TestListenerStore) {
    this.#attributes = attributes;
    this.#listeners = listeners;
  }

  getAttribute(name: string): string | null {
    return this.#attributes.get(this)?.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    let attributes = this.#attributes.get(this);
    if (!attributes) {
      attributes = new Map();
      this.#attributes.set(this, attributes);
    }
    attributes.set(name, value);
  }

  hasAttribute(name: string): boolean {
    return this.#attributes.get(this)?.has(name) ?? false;
  }

  removeAttribute(name: string): void {
    this.#attributes.get(this)?.delete(name);
  }

  addEventListener(type: string, listener: EventListener): void {
    let listeners = this.#listeners.get(this);
    if (!listeners) {
      listeners = new Map();
      this.#listeners.set(this, listeners);
    }
    let typedListeners = listeners.get(type);
    if (!typedListeners) {
      typedListeners = new Set();
      listeners.set(type, typedListeners);
    }
    typedListeners.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.#listeners.get(this)?.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.#listeners.get(this)?.get(event.type);
    for (const listener of listeners ?? []) listener(event);
    return true;
  }

  get shadowRoot(): ShadowRoot | null {
    return null;
  }

  getRootNode(): Node {
    return this as unknown as Node;
  }

  attachShadow(_init: ShadowRootInit): ShadowRoot {
    throw new Error('Shadow DOM is not available in this test harness.');
  }

  get children(): TestHTMLElement[] {
    return this.#children;
  }

  appendChild(child: TestHTMLElement): TestHTMLElement {
    this.#children.push(child);
    return child;
  }

  removeChild(child: TestHTMLElement): TestHTMLElement {
    const idx = this.#children.indexOf(child);
    if (idx >= 0) this.#children.splice(idx, 1);
    return child;
  }

  get textContent(): string {
    return this.#textContent || this.#children.map((c) => c.textContent).join('');
  }

  set textContent(value: string) {
    this.#textContent = value;
  }

  get innerHTML(): string {
    return this.textContent;
  }

  set innerHTML(value: string) {
    this.textContent = value;
  }

  querySelector(_selectors: string): Element | null {
    return null;
  }

  querySelectorAll(_selectors: string): NodeListOf<Element> {
    return [] as unknown as NodeListOf<Element>;
  }

  connectedCallback?(): void;
  disconnectedCallback?(): void;
  attributeChangedCallback?(
    _name: string,
    _oldValue: string | null,
    _newValue: string | null,
  ): void;
}

function installDomHarness(): void {
  if (typeof globalThis.HTMLElement !== 'undefined') return;

  const attributes: TestAttributeStore = new WeakMap();
  const listeners: TestListenerStore = new WeakMap();
  const ElementBase = class extends TestHTMLElement {
    constructor() {
      super(attributes, listeners);
    }
  } as unknown as typeof HTMLElement;

  Object.defineProperty(globalThis, 'HTMLElement', {
    configurable: true,
    value: ElementBase,
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      documentElement: {
        dataset: {},
        getAttribute: () => null,
        setAttribute: () => {},
      },
      createElement: () => new ElementBase(),
      createTreeWalker: () => ({ nextNode: () => null }),
      querySelector: () => null,
      querySelectorAll: () => [],
      body: new ElementBase(),
      head: new ElementBase(),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as unknown as Document,
  });
}

function asComponentModule(module: unknown): ComponentModule {
  const candidate = module as Partial<ComponentModule>;
  assertExists(candidate.tagName);
  assertEquals(typeof candidate.tagName, 'string');
  return candidate as ComponentModule;
}

function exportedConstructor(module: ComponentModule): RenderableElementConstructor {
  for (const [name, value] of Object.entries(module)) {
    if (name === 'tagName') continue;
    if (typeof value === 'function') {
      const prototype = (value as { prototype?: Partial<RenderableElement> }).prototype;
      if (typeof prototype?.render === 'function') {
        return value as RenderableElementConstructor;
      }
    }
  }
  throw new Error(`No renderable custom element export found for ${module.tagName}.`);
}

// ─── VNode inspection helpers ────────────────────────────────────────────────

function isVNodeObject(v: unknown): v is VNode {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    ['string', 'function', 'symbol'].includes(typeof (v as VNode).tag) &&
    typeof (v as VNode).props === 'object' &&
    (v as VNode).props !== null &&
    Array.isArray((v as VNode).children)
  );
}

function findNode(root: unknown, predicate: (n: VNode) => boolean): VNode | undefined {
  if (!isVNodeObject(root)) return undefined;
  if (predicate(root)) return root;
  for (const child of root.children) {
    const found = findNode(child, predicate);
    if (found) return found;
  }
  return undefined;
}

function findByTag(root: unknown, tag: string): VNode | undefined {
  return findNode(root, (n) => n.tag === tag);
}

function findByPart(root: unknown, part: string): VNode | undefined {
  return findNode(root, (n) => n.props?.part === part);
}

function _findByClass(root: unknown, className: string): VNode | undefined {
  return findNode(root, (n) => {
    const cls = n.props?.className ?? n.props?.class ?? '';
    return typeof cls === 'string' && cls.split(/\s+/).includes(className);
  });
}

function vnodeText(root: unknown): string {
  if (typeof root === 'string') return root;
  if (typeof root === 'number') return String(root);
  if (!isVNodeObject(root)) return '';
  return root.children.map(vnodeText).join('');
}

function signalValue<T>(prop: unknown): T | undefined {
  if (prop && typeof prop === 'object' && 'value' in prop) {
    return (prop as { value: T }).value;
  }
  return undefined;
}

function clickVNode(node: VNode | undefined, init?: EventInit, host?: EventTarget): void {
  if (node && typeof node.props?.onClick === 'function') {
    node.props.onClick.call(host ?? globalThis, new Event('click', init));
  }
}

function classNameOf(node: VNode | undefined): string {
  if (!node) return '';
  const cls = node.props.className ?? node.props.class ?? '';
  return String(cls);
}

// ─── Mock element helpers ────────────────────────────────────────────────────

function createMockElement(
  tag: string,
  attrs: Record<string, string> = {},
  text = '',
): MockElement {
  const attributes = new Map<string, string>(Object.entries(attrs));
  return {
    tagName: tag.toUpperCase(),
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => {
      attributes.set(name, value);
    },
    hasAttribute: (name: string) => attributes.has(name),
    removeAttribute: (name: string) => {
      attributes.delete(name);
    },
    textContent: text,
    innerHTML: text,
    classList: {
      toggle: (_token: string, _force?: boolean) => false,
      contains: (_token: string) => false,
    },
  };
}

function appendMockChildren(
  host: HTMLElement,
  children: MockElement[],
): void {
  for (const child of children) {
    (host as unknown as { appendChild: (c: unknown) => void }).appendChild(child);
  }
}

function installQuerySelectorAll(
  host: HTMLElement,
  resolver: (selector: string) => MockElement[],
): void {
  (host as unknown as { querySelectorAll: (selector: string) => NodeListOf<Element> })
    .querySelectorAll = (selector: string) => resolver(selector) as unknown as NodeListOf<Element>;
}

function _installQuerySelector(
  host: HTMLElement,
  resolver: (selector: string) => MockElement | null,
): void {
  (host as unknown as { querySelector: (selector: string) => Element | null }).querySelector = (
    selector: string,
  ) => resolver(selector) as unknown as Element | null;
}

// ─── Fake event / navigator helpers ──────────────────────────────────────────

function fakeInputEvent(value: string): Event {
  return { target: { value } } as unknown as Event;
}

function fakeEmptyEvent(type = 'event'): Event {
  return new Event(type);
}

function installClipboardSpy(writeText: (text: string) => Promise<void>): () => void {
  const originalClipboard = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    });
  };
}

installDomHarness();

const COMPONENT_FILES = [
  'open-button',
  'open-card',
  'open-input',
  'open-code-block',
  'open-theme-toggle',
  'open-dialog',
  'open-callout',
  'open-dropdown',
  'open-tabs',
] as const;

const REACTIVE_PROPERTY_CASES: ReadonlyArray<{
  fileName: string;
  className: string;
  props: readonly string[];
}> = [
  {
    fileName: 'open-button',
    className: 'OpenButton',
    props: ['variant', 'size', 'disabled', 'href', 'target', 'type'],
  },
  {
    fileName: 'open-card',
    className: 'OpenCard',
    props: ['variant'],
  },
  {
    fileName: 'open-input',
    className: 'OpenInput',
    props: ['type', 'placeholder', 'label', 'value', 'name', 'disabled', 'required', 'error'],
  },
  {
    fileName: 'open-theme-toggle',
    className: 'OpenThemeToggle',
    props: ['theme'],
  },
];

// ─── Existing baseline tests ─────────────────────────────────────────────────

for (const name of COMPONENT_FILES) {
  Deno.test(`${name}: exports a custom-element tag and renderable class`, async () => {
    const module = asComponentModule(await import(`../src/${name}.tsx`));
    assertEquals(module.tagName.includes('-'), true);

    const Component = exportedConstructor(module);
    const instance = new Component();
    assertExists(instance.render());
  });
}

Deno.test('open-props-tokens: exports a StyleSheet-compatible token sheet', async () => {
  const { openPropsTokenSheet } = await import('../src/open-props-tokens.ts');
  assertExists(openPropsTokenSheet);
  assertEquals(typeof openPropsTokenSheet.replaceSync, 'function');
  assertEquals(Array.isArray(openPropsTokenSheet.cssRules), true);
});

Deno.test('index: re-exports all public components', async () => {
  const mod = await import('../src/index.ts');

  for (
    const exportName of [
      'OpenButton',
      'OpenCard',
      'OpenInput',
      'OpenCodeBlock',
      'OpenThemeToggle',
      'OpenDialog',
      'OpenCallout',
      'OpenDropdown',
      'OpenTabs',
      'openPropsRootSheet',
      'openPropsTokenSheet',
      'manifest',
    ]
  ) {
    assertExists(mod[exportName as keyof typeof mod], `missing export ${exportName}`);
  }
});

Deno.test('index: manifest exposes island declarations', async () => {
  const { manifest } = await import('../src/index.ts') as ManifestModule;
  assertEquals(manifest.packageName, '@openelement/ui');

  const islandDecls = manifest.declarations.filter((decl) => decl.openElement?.module);
  assertEquals(islandDecls.length > 0, true);

  for (const decl of islandDecls) {
    assertExists(decl.tagName);
    assertExists(decl.openElement?.module);
    assertEquals(typeof decl.openElement?.hydrate, 'string');
  }
});

for (const { fileName, className, props } of REACTIVE_PROPERTY_CASES) {
  Deno.test(`${fileName}: reactive properties are not shadowed by class fields`, async () => {
    const module = await import(`../src/${fileName}.tsx`);
    const Component = module[className as keyof typeof module] as unknown as new () => object;
    const instance = new Component();

    for (const prop of props) {
      assertFalse(
        Object.prototype.hasOwnProperty.call(instance, prop),
        `${className}.${prop} must use generated accessors, not own fields`,
      );
    }
  });
}

// ─── Per-component contract tests ────────────────────────────────────────────

Deno.test('open-button: has correct tagName and default render', async () => {
  const module = asComponentModule(await import('../src/open-button.tsx'));
  assertEquals(module.tagName, 'open-button');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertEquals(vnode.tag, 'button');
  assertStringIncludes(String(vnode.props.className), 'btn--default');
  assertStringIncludes(String(vnode.props.className), 'btn--md');
  assertEquals(vnode.props.type, 'button');
  assertEquals(vnode.props.part, 'control');
});

Deno.test('open-button: variant and size attributes reflect in render', async () => {
  const { OpenButton } = await import('../src/open-button.tsx');
  const instance = new OpenButton();
  instance.setAttribute('variant', 'primary');
  instance.setAttribute('size', 'lg');
  const vnode = instance.render() as VNode;
  assertStringIncludes(String(vnode.props.className), 'btn--primary');
  assertStringIncludes(String(vnode.props.className), 'btn--lg');
});

Deno.test('open-button: href renders anchor and disables safely', async () => {
  const { OpenButton } = await import('../src/open-button.tsx');
  const instance = new OpenButton();
  instance.setAttribute('href', 'https://openelement.org');
  instance.setAttribute('target', '_blank');
  const vnode = instance.render() as VNode;
  assertEquals(vnode.tag, 'a');
  assertEquals(vnode.props.href, 'https://openelement.org');
  assertEquals(vnode.props.target, '_blank');
  assertEquals(vnode.props.rel, 'noopener noreferrer');

  instance.setAttribute('disabled', '');
  const disabled = instance.render() as VNode;
  assertEquals(disabled.props.href, '');
  assertEquals(disabled.props['aria-disabled'], 'true');
});

Deno.test('open-button: disabled reflects on button', async () => {
  const { OpenButton } = await import('../src/open-button.tsx');
  const instance = new OpenButton();
  instance.setAttribute('disabled', '');
  const vnode = instance.render() as VNode;
  assertEquals(vnode.props.disabled, true);
});

Deno.test('open-button: click dispatches open-click event', async () => {
  const { OpenButton } = await import('../src/open-button.tsx');
  const instance = new OpenButton();
  let fired = false;
  instance.addEventListener('open-click', () => {
    fired = true;
  });
  const vnode = instance.render() as VNode;
  clickVNode(vnode, undefined, instance);
  assertEquals(fired, true);
});

// ─── Form submission regression ─────────────────────────────
// open-button is formAssociated. Its inner <button> lives in the shadow DOM,
// so the browser's native "type=submit triggers form submit" behavior does
// NOT reach the outer <form>. The component must explicitly dispatch a
// composed 'submit' event on the form so the SPA's delegated root listener
// (which sits outside the shadow boundary) can intercept it.

/** Minimal form stub: records requestSubmit/reset calls and supports
 * dispatchEvent (returns true so defaultPrevented stays false → requestSubmit
 * runs, mirroring real form behavior when no listener cancels the event). */
function makeFormStub(
  opts: { submit?: () => void; reset?: () => void; preventDefault?: boolean } = {},
): {
  requestSubmit: () => void;
  reset: () => void;
  submit: () => void;
  dispatchEvent: (e: Event) => boolean;
} {
  const preventDefault = opts.preventDefault ?? false;
  return {
    requestSubmit: opts.submit ?? (() => {}),
    reset: opts.reset ?? (() => {}),
    submit: opts.submit ?? (() => {}),
    dispatchEvent: (e: Event) => {
      if (preventDefault && e.cancelable) e.preventDefault();
      return !preventDefault;
    },
  };
}

Deno.test('open-button: type=submit dispatches composed submit event and calls requestSubmit', async () => {
  const { OpenButton } = await import('../src/open-button.tsx');
  const instance = new OpenButton();
  instance.setAttribute('type', 'submit');

  let submitCalled = false;
  let submitEventBubbles = false;
  let submitEventComposed = false;
  const form = {
    requestSubmit: () => {
      submitCalled = true;
    },
    reset: () => {},
    submit: () => {},
    dispatchEvent: (e: Event) => {
      submitEventBubbles = e.bubbles;
      submitEventComposed = (e as Event & { composed?: boolean }).composed ?? false;
      return true; // not prevented → requestSubmit should fire
    },
  };
  (instance as unknown as { _internals: { form: unknown } })._internals = { form };

  const vnode = instance.render() as VNode;
  clickVNode(vnode, undefined, instance);

  // Must dispatch a composed submit event so it crosses shadow boundaries
  assertEquals(submitEventBubbles, true);
  assertEquals(submitEventComposed, true);
  // And fall through to requestSubmit since no listener prevented default
  assertEquals(submitCalled, true);
});

Deno.test('open-button: type=submit does NOT call requestSubmit when SPA prevents default', async () => {
  const { OpenButton } = await import('../src/open-button.tsx');
  const instance = new OpenButton();
  instance.setAttribute('type', 'submit');

  let submitCalled = false;
  const form = makeFormStub({
    submit: () => {
      submitCalled = true;
    },
    preventDefault: true, // simulate SPA calling e.preventDefault()
  });
  (instance as unknown as { _internals: { form: unknown } })._internals = { form };

  const vnode = instance.render() as VNode;
  clickVNode(vnode, undefined, instance);

  // SPA prevented default → must NOT fall through to native requestSubmit
  assertEquals(submitCalled, false);
});

Deno.test('open-button: type=reset triggers form.reset() on click', async () => {
  const { OpenButton } = await import('../src/open-button.tsx');
  const instance = new OpenButton();
  instance.setAttribute('type', 'reset');

  let resetCalled = false;
  const form = makeFormStub({
    reset: () => {
      resetCalled = true;
    },
  });
  (instance as unknown as { _internals: { form: unknown } })._internals = { form };

  const vnode = instance.render() as VNode;
  clickVNode(vnode, undefined, instance);
  assertEquals(resetCalled, true);
});

Deno.test('open-button: type=button (default) does NOT trigger form submit', async () => {
  const { OpenButton } = await import('../src/open-button.tsx');
  const instance = new OpenButton();
  // No type attribute → defaults to 'button' → no form interaction

  let submitCalled = false;
  const form = makeFormStub({
    submit: () => {
      submitCalled = true;
    },
    reset: () => {
      submitCalled = true;
    },
  });
  (instance as unknown as { _internals: { form: unknown } })._internals = { form };

  const vnode = instance.render() as VNode;
  clickVNode(vnode, undefined, instance);
  assertEquals(submitCalled, false);
});

Deno.test('open-button: type=submit without associated form does not throw', async () => {
  const { OpenButton } = await import('../src/open-button.tsx');
  const instance = new OpenButton();
  instance.setAttribute('type', 'submit');
  // No _internals.form (formAssociated but not inside a <form>)

  let threw = false;
  try {
    const vnode = instance.render() as VNode;
    clickVNode(vnode, undefined, instance);
  } catch {
    threw = true;
  }
  assertEquals(threw, false);
});

Deno.test('open-card: has correct tagName and slot structure', async () => {
  const module = asComponentModule(await import('../src/open-card.tsx'));
  assertEquals(module.tagName, 'open-card');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertEquals(vnode.tag, 'article');
  assertEquals(vnode.props.part, 'container');

  const slots: VNode[] = [];
  function collect(node: VNode): void {
    if (node.tag === 'slot') slots.push(node);
    for (const child of node.children) {
      if (isVNodeObject(child)) collect(child);
    }
  }
  collect(vnode);
  assertEquals(slots.length, 3);
  assertEquals(slots[0].props.name, 'header');
  assertEquals(slots[1].props.name, undefined);
  assertEquals(slots[2].props.name, 'footer');
});

Deno.test('open-card: variant attribute does not break render', async () => {
  const { OpenCard } = await import('../src/open-card.tsx');
  const instance = new OpenCard();
  instance.setAttribute('variant', 'elevated');
  const vnode = instance.render() as VNode;
  assertEquals(vnode.tag, 'article');
});

Deno.test('open-input: has correct tagName and control parts', async () => {
  const module = asComponentModule(await import('../src/open-input.tsx'));
  assertEquals(module.tagName, 'open-input');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertEquals(vnode.tag, 'div');
  assertEquals(vnode.props.part, 'wrapper');
  assertExists(findByPart(vnode, 'control'));
});

Deno.test('open-input: label, value and error attributes render', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  instance.setAttribute('label', 'Email');
  instance.setAttribute('value', 'hello@example.com');
  instance.setAttribute('placeholder', 'you@example.com');
  instance.setAttribute('error', 'Invalid email');

  const vnode = instance.render() as VNode;
  assertStringIncludes(vnodeText(vnode), 'Email');
  assertStringIncludes(vnodeText(vnode), 'Invalid email');

  const input = findByPart(vnode, 'control') as VNode;
  assertEquals(input.props.value, 'hello@example.com');
  assertEquals(input.props.placeholder, 'you@example.com');
  assertEquals(input.props['aria-invalid'], 'true');
});

Deno.test('open-input: input event updates value and dispatches open-input', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  const events: CustomEvent[] = [];
  instance.addEventListener('open-input', (e) => events.push(e as CustomEvent));

  const input = findByPart(instance.render() as VNode, 'control') as VNode;
  (input.props.onInput as (e: Event) => void)?.(fakeInputEvent('typed'));

  assertEquals(instance.getAttribute('value'), 'typed');
  assertEquals(events.length, 1);
  assertEquals((events[0] as CustomEvent).detail.value, 'typed');
});

Deno.test('open-input: change and focus events dispatch', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  const changeEvents: CustomEvent[] = [];
  const focusEvents: CustomEvent[] = [];
  const blurEvents: CustomEvent[] = [];
  instance.addEventListener('open-change', (e) => changeEvents.push(e as CustomEvent));
  instance.addEventListener('open-focus', (e) => focusEvents.push(e as CustomEvent));
  instance.addEventListener('open-blur', (e) => blurEvents.push(e as CustomEvent));

  const input = findByPart(instance.render() as VNode, 'control') as VNode;
  (input.props.onChange as (e: Event) => void)?.(fakeInputEvent('changed'));
  (input.props.onFocus as (e: Event) => void)?.(fakeEmptyEvent('focus'));
  (input.props.onBlur as (e: Event) => void)?.(fakeEmptyEvent('blur'));

  assertEquals(changeEvents.length, 1);
  assertEquals(focusEvents.length, 1);
  assertEquals(blurEvents.length, 1);
});

Deno.test('open-code-block: has correct tagName and copy button', async () => {
  const module = asComponentModule(await import('../src/open-code-block.tsx'));
  assertEquals(module.tagName, 'open-code-block');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertExists(findByTag(vnode, 'slot'));
  const copyBtn = findByPart(vnode, 'copy') as VNode;
  assertEquals(copyBtn.tag, 'button');
  assertStringIncludes(vnodeText(copyBtn), 'Copy');
});

Deno.test('open-code-block: copy button writes text to clipboard', async () => {
  const { OpenCodeBlock } = await import('../src/open-code-block.tsx');
  const instance = new OpenCodeBlock();
  instance.textContent = 'const answer = 42;';

  let copied = '';
  const restoreClipboard = installClipboardSpy((text: string) => {
    copied = text;
    return Promise.resolve();
  });

  try {
    const vnode = instance.render() as VNode;
    clickVNode(findByPart(vnode, 'copy'));
    assertEquals(copied, 'const answer = 42;');
  } finally {
    restoreClipboard();
  }
});

Deno.test('open-theme-toggle: has correct tagName and toggle button', async () => {
  const module = asComponentModule(await import('../src/open-theme-toggle.tsx'));
  assertEquals(module.tagName, 'open-theme-toggle');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertEquals(vnode.tag, 'button');
  assertEquals(vnode.props.part, 'toggle');
  assertExists(findByPart(vnode, 'icon-sun'));
  assertExists(findByPart(vnode, 'icon-moon'));
});

Deno.test('open-theme-toggle: theme attribute drives data-theme signal', async () => {
  const { OpenThemeToggle } = await import('../src/open-theme-toggle.tsx');
  const instance = new OpenThemeToggle();
  instance.attributeChangedCallback('theme', null, 'light');
  const vnode = instance.render() as VNode;
  assertEquals(signalValue<string>(vnode.props['data-theme']), 'light');
});

Deno.test('open-theme-toggle: click toggles theme', async () => {
  const { OpenThemeToggle } = await import('../src/open-theme-toggle.tsx');
  const instance = new OpenThemeToggle();
  instance.attributeChangedCallback('theme', null, 'light');

  const before = instance.render() as VNode;
  assertEquals(signalValue<string>(before.props['data-theme']), 'light');
  clickVNode(before);

  const after = instance.render() as VNode;
  assertEquals(signalValue<string>(after.props['data-theme']), 'dark');
});

Deno.test('open-theme-toggle: attribute and click share document and storage propagation', async () => {
  const { OpenThemeToggle } = await import('../src/open-theme-toggle.tsx');
  const originalDocumentElement = document.documentElement;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const rootAttributes = new Map<string, string>();
  const stored = new Map<string, string>();
  Object.defineProperty(document, 'documentElement', {
    configurable: true,
    value: {
      dataset: {},
      style: { colorScheme: '' },
      setAttribute(name: string, value: string) {
        rootAttributes.set(name, value);
      },
    },
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { setItem: (key: string, value: string) => stored.set(key, value) },
  });
  try {
    const instance = new OpenThemeToggle();
    instance.attributeChangedCallback('theme', null, 'light');
    assertEquals(rootAttributes.get('data-theme'), 'light');
    assertEquals(stored.get('open-theme'), 'light');

    clickVNode(instance.render() as VNode);
    assertEquals(rootAttributes.get('data-theme'), 'dark');
    assertEquals(stored.get('open-theme'), 'dark');
  } finally {
    Object.defineProperty(document, 'documentElement', {
      configurable: true,
      value: originalDocumentElement,
    });
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else delete (globalThis as Record<string, unknown>).localStorage;
  }
});

Deno.test('open-theme-toggle: initialization follows attribute, document, storage, and media priority', async () => {
  const { OpenThemeToggle } = await import('../src/open-theme-toggle.tsx');
  const originalDocumentElement = document.documentElement;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalMatchMedia = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');
  const scenarios = [
    {
      attribute: 'light',
      documentTheme: undefined,
      stored: undefined,
      media: false,
      expected: 'light',
    },
    { attribute: 'dark', documentTheme: 'light', stored: 'light', media: true, expected: 'dark' },
    {
      attribute: undefined,
      documentTheme: 'light',
      stored: 'dark',
      media: false,
      expected: 'light',
    },
    { attribute: undefined, documentTheme: 'dark', stored: 'light', media: true, expected: 'dark' },
    {
      attribute: undefined,
      documentTheme: undefined,
      stored: 'light',
      media: false,
      expected: 'light',
    },
    {
      attribute: undefined,
      documentTheme: undefined,
      stored: 'dark',
      media: true,
      expected: 'dark',
    },
    {
      attribute: undefined,
      documentTheme: undefined,
      stored: undefined,
      media: true,
      expected: 'light',
    },
    {
      attribute: undefined,
      documentTheme: undefined,
      stored: undefined,
      media: false,
      expected: 'dark',
    },
  ] as const;

  try {
    for (const scenario of scenarios) {
      Object.defineProperty(document, 'documentElement', {
        configurable: true,
        value: {
          dataset: { theme: scenario.documentTheme },
          style: { colorScheme: '' },
          setAttribute() {},
        },
      });
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
          getItem: () => scenario.stored ?? null,
          setItem() {},
        },
      });
      Object.defineProperty(globalThis, 'matchMedia', {
        configurable: true,
        value: () => ({ matches: scenario.media }),
      });

      const instance = new OpenThemeToggle();
      if (scenario.attribute) instance.setAttribute('theme', scenario.attribute);
      (instance as unknown as { _initTheme(): void })._initTheme();
      (instance as unknown as { _initTheme(): void })._initTheme(); // idempotent
      const vnode = instance.render() as VNode;
      assertEquals(signalValue<string>(vnode.props['data-theme']), scenario.expected);
    }
  } finally {
    Object.defineProperty(document, 'documentElement', {
      configurable: true,
      value: originalDocumentElement,
    });
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else delete (globalThis as Record<string, unknown>).localStorage;
    if (originalMatchMedia) Object.defineProperty(globalThis, 'matchMedia', originalMatchMedia);
    else delete (globalThis as Record<string, unknown>).matchMedia;
  }
});

Deno.test('open-theme-toggle: blocked platform services and irrelevant attributes are harmless', async () => {
  const { OpenThemeToggle } = await import('../src/open-theme-toggle.tsx');
  const originalDocumentElement = document.documentElement;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalMatchMedia = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');
  Object.defineProperty(document, 'documentElement', {
    configurable: true,
    value: { dataset: {}, setAttribute() {} },
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    },
  });
  delete (globalThis as Record<string, unknown>).matchMedia;
  try {
    const instance = new OpenThemeToggle();
    instance.attributeChangedCallback('theme', 'dark', 'dark');
    instance.attributeChangedCallback('unrelated', null, 'light');
    instance.attributeChangedCallback('theme', 'dark', null);
    instance.attributeChangedCallback('theme', null, 'system');
    (instance as unknown as { _initTheme(): void })._initTheme();
    assertEquals(signalValue<string>((instance.render() as VNode).props['data-theme']), 'dark');

    const originalShadowRoot = Object.getOwnPropertyDescriptor(globalThis, 'ShadowRoot');
    let hostTheme = '';
    class TestShadowRoot {
      host = { setAttribute: (_name: string, value: string) => (hostTheme = value) };
    }
    Object.defineProperty(globalThis, 'ShadowRoot', { configurable: true, value: TestShadowRoot });
    Object.defineProperty(instance, 'getRootNode', {
      configurable: true,
      value: () => new TestShadowRoot(),
    });
    instance.attributeChangedCallback('theme', 'dark', 'light');
    assertEquals(hostTheme, 'light');
    if (originalShadowRoot) Object.defineProperty(globalThis, 'ShadowRoot', originalShadowRoot);
    else delete (globalThis as Record<string, unknown>).ShadowRoot;

    const originalCustomEvent = Object.getOwnPropertyDescriptor(globalThis, 'CustomEvent');
    const originalDispatch = globalThis.dispatchEvent;
    try {
      delete (globalThis as Record<string, unknown>).CustomEvent;
      (instance as unknown as { _dispatchThemeChange(theme: 'dark' | 'light'): void })
        ._dispatchThemeChange('dark');
      Object.defineProperty(globalThis, 'CustomEvent', {
        configurable: true,
        value: class extends Event {},
      });
      globalThis.dispatchEvent = undefined as unknown as typeof globalThis.dispatchEvent;
      (instance as unknown as { _dispatchThemeChange(theme: 'dark' | 'light'): void })
        ._dispatchThemeChange('dark');
      globalThis.dispatchEvent = (() => {
        throw new Error('blocked');
      }) as typeof globalThis.dispatchEvent;
      (instance as unknown as { _dispatchThemeChange(theme: 'dark' | 'light'): void })
        ._dispatchThemeChange('dark');
    } finally {
      if (originalCustomEvent) {
        Object.defineProperty(globalThis, 'CustomEvent', originalCustomEvent);
      } else delete (globalThis as Record<string, unknown>).CustomEvent;
      globalThis.dispatchEvent = originalDispatch;
    }
  } finally {
    Object.defineProperty(document, 'documentElement', {
      configurable: true,
      value: originalDocumentElement,
    });
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else delete (globalThis as Record<string, unknown>).localStorage;
    if (originalMatchMedia) Object.defineProperty(globalThis, 'matchMedia', originalMatchMedia);
  }
});

Deno.test('open-dialog: has correct tagName and dialog structure', async () => {
  const module = asComponentModule(await import('../src/open-dialog.tsx'));
  assertEquals(module.tagName, 'open-dialog');

  const Component = exportedConstructor(module);
  const instance = new Component();
  instance.setAttribute('label', 'Confirm');
  const vnode = instance.render() as VNode;
  const dialog = findByTag(vnode, 'dialog') as VNode;
  assertExists(dialog);
  assertEquals(dialog.props.part, 'overlay');
  assertStringIncludes(vnodeText(vnode), 'Confirm');
});

Deno.test('open-dialog: show/close/toggle manage open attribute', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  const instance = new OpenDialog();
  assertEquals(instance.hasAttribute('open'), false);

  instance.show();
  assertEquals(instance.hasAttribute('open'), true);

  instance.toggle();
  assertEquals(instance.hasAttribute('open'), false);

  instance.toggle();
  assertEquals(instance.hasAttribute('open'), true);

  instance.close();
  assertEquals(instance.hasAttribute('open'), false);
});

Deno.test('open-dialog: trigger click toggles open state', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  const instance = new OpenDialog();
  const vnode = instance.render() as VNode;
  const trigger = vnode.children.find((c) =>
    isVNodeObject(c) && c.tag === 'slot' && c.props.name === 'trigger'
  ) as VNode;
  assertExists(trigger);
  clickVNode(trigger, undefined, instance);
  assertEquals(instance.hasAttribute('open'), true);
});

Deno.test('open-dialog: close dispatches open-dialog-close event', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  const instance = new OpenDialog();
  instance.show();
  let fired = false;
  instance.addEventListener('open-dialog-close', () => {
    fired = true;
  });
  const vnode = instance.render() as VNode;
  const closeBtn = findByPart(vnode, 'close') as VNode;
  assertExists(closeBtn);
  clickVNode(closeBtn, undefined, instance);
  assertEquals(fired, true);
});

Deno.test('open-dialog: restores each sibling inert state after close and DOM removal', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  for (const disconnectDirectly of [false, true]) {
    const instance = new OpenDialog();
    const activeSibling = document.createElement('main');
    const inertSibling = document.createElement('aside');
    inertSibling.setAttribute('inert', '');
    const parent = { children: [activeSibling, instance, inertSibling] };
    Object.defineProperty(instance, 'parentNode', { configurable: true, value: parent });

    instance.setAttribute('open', '');
    instance.attributeChangedCallback('open', null, '');
    assertEquals(activeSibling.hasAttribute('inert'), true);
    assertEquals(inertSibling.hasAttribute('inert'), true);

    if (disconnectDirectly) {
      Object.defineProperty(instance, 'parentNode', { configurable: true, value: null });
      instance.disconnectedCallback();
    } else {
      instance.removeAttribute('open');
      instance.attributeChangedCallback('open', '', null);
    }

    assertEquals(activeSibling.hasAttribute('inert'), false);
    assertEquals(inertSibling.hasAttribute('inert'), true);
  }
});

Deno.test('open-callout: has correct tagName and type classes', async () => {
  const module = asComponentModule(await import('../src/open-callout.tsx'));
  assertEquals(module.tagName, 'open-callout');

  const Component = exportedConstructor(module);
  const instance = new Component();
  instance.setAttribute('type', 'danger');
  instance.setAttribute('label', 'Warning');
  const vnode = instance.render() as VNode;
  assertEquals(vnode.props.part, 'container');
  assertStringIncludes(String(vnode.props.className), 'callout--danger');
  assertStringIncludes(vnodeText(vnode), 'Warning');
});

Deno.test('open-callout: default type is info', async () => {
  const { OpenCallout } = await import('../src/open-callout.tsx');
  const instance = new OpenCallout();
  const vnode = instance.render() as VNode;
  assertStringIncludes(String(vnode.props.className), 'callout--info');
});

Deno.test('open-dropdown: has correct tagName and toggle structure', async () => {
  const module = asComponentModule(await import('../src/open-dropdown.tsx'));
  assertEquals(module.tagName, 'open-dropdown');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertExists(findByPart(vnode, 'trigger'));
  assertExists(findByPart(vnode, 'content'));
});

Deno.test('open-tabs: has correct tagName and renders tabs from slotted children', async () => {
  const module = asComponentModule(await import('../src/open-tabs.tsx'));
  assertEquals(module.tagName, 'open-tabs');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const tabs = [
    createMockElement('span', { slot: 'tab' }, 'Tab 1'),
    createMockElement('span', { slot: 'tab' }, 'Tab 2'),
  ];
  const panels = [
    createMockElement('div', { slot: 'panel' }, '<p>Panel 1</p>'),
    createMockElement('div', { slot: 'panel' }, '<p>Panel 2</p>'),
  ];
  appendMockChildren(instance, [...tabs, ...panels]);
  installQuerySelectorAll(instance, (selector) => {
    if (selector === '[slot="tab"]') return tabs;
    if (selector === '[slot="panel"]') return panels;
    return [];
  });

  const vnode = instance.render() as VNode;
  const buttons = vnode.children
    .flatMap((c) => isVNodeObject(c) ? c.children : [])
    .filter((c): c is VNode => isVNodeObject(c) && c.tag === 'button');
  assertEquals(buttons.length, 2);
  assertStringIncludes(vnodeText(buttons[0]), 'Tab 1');
  assertStringIncludes(vnodeText(buttons[1]), 'Tab 2');
});

Deno.test('open-tabs: selecting tab updates active panel', async () => {
  const { OpenTabs } = await import('../src/open-tabs.tsx');
  const instance = new OpenTabs();
  const tabs = [
    createMockElement('span', { slot: 'tab' }, 'Tab 1'),
    createMockElement('span', { slot: 'tab' }, 'Tab 2'),
  ];
  const panels = [
    createMockElement('div', { slot: 'panel' }, '<p>Panel 1</p>'),
    createMockElement('div', { slot: 'panel' }, '<p>Panel 2</p>'),
  ];
  appendMockChildren(instance, [...tabs, ...panels]);
  installQuerySelectorAll(instance, (selector) => {
    if (selector === '[slot="tab"]') return tabs;
    if (selector === '[slot="panel"]') return panels;
    return [];
  });

  const vnode1 = instance.render() as VNode;
  const buttons1 = vnode1.children
    .flatMap((c) => isVNodeObject(c) ? c.children : [])
    .filter((c): c is VNode => isVNodeObject(c) && c.tag === 'button');
  assertStringIncludes(classNameOf(buttons1[0]), 'tab-active');
  assertFalse(classNameOf(buttons1[1]).includes('tab-active'));

  clickVNode(buttons1[1], undefined, instance);

  const vnode2 = instance.render() as VNode;
  const buttons2 = vnode2.children
    .flatMap((c) => isVNodeObject(c) ? c.children : [])
    .filter((c): c is VNode => isVNodeObject(c) && c.tag === 'button');
  assertStringIncludes(classNameOf(buttons2[1]), 'tab-active');
  assertFalse(classNameOf(buttons2[0]).includes('tab-active'));
});

Deno.test('manifest: declares metadata for manifest-registered components', async () => {
  const { manifest } = await import('../src/index.ts') as ManifestModule;
  const registeredTagNames = new Set(manifest.declarations.map((d) => d.tagName));

  for (const name of COMPONENT_FILES) {
    if (!registeredTagNames.has(name)) continue;
    const decl = manifest.declarations.find((d) => d.tagName === name) as ManifestDeclaration;
    assertExists(decl, `manifest should declare ${name}`);
    assertEquals(decl.tagName, name);
    assertExists(decl.openElement?.module, `${name} should declare openElement.module`);
    assertEquals(
      typeof decl.openElement?.hydrate,
      'string',
      `${name} should declare openElement.hydrate`,
    );
  }
});
