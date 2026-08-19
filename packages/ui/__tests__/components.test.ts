/**
 * @openelement/ui public contract tests.
 */
import {
  assertEquals,
  assertExists,
  assertFalse,
  assertNotEquals,
  assertStringIncludes,
} from '@std/assert';
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
  addEventListener(type: string, listener: EventListener): void;
  dispatchEvent(event: Event): boolean;
  focus(): void;
  focused: boolean;
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

// ─── Mock element helpers ────────────────────────────────────────────────────

function createMockElement(
  tag: string,
  attrs: Record<string, string> = {},
  text = '',
): MockElement {
  const attributes = new Map<string, string>(Object.entries(attrs));
  const listeners = new Map<string, Set<EventListener>>();
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
    addEventListener: (type: string, listener: EventListener) => {
      let typed = listeners.get(type);
      if (!typed) {
        typed = new Set();
        listeners.set(type, typed);
      }
      typed.add(listener);
    },
    dispatchEvent: (event: Event) => {
      for (const listener of listeners.get(event.type) ?? []) listener(event);
      return true;
    },
    focused: false,
    focus() {
      this.focused = true;
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
  'open-badge',
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
  // #1061: a disabled anchor must carry no href at all — even href="" stays
  // Tab-focusable and navigates on Enter / programmatic click.
  assertEquals(disabled.props.href, undefined);
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
  // composed: true so listeners outside a wrapping shadow root can observe it.
  assertEquals(events[0].composed, true);
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
  // All four open-input events are composed so they cross shadow boundaries
  // (aligned with open-button/open-dialog).
  assertEquals(changeEvents[0].composed, true);
  assertEquals(focusEvents[0].composed, true);
  assertEquals(blurEvents[0].composed, true);
});

Deno.test('open-input: ids are instance-unique and aria wiring stays consistent', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const renderWithError = () => {
    const instance = new OpenInput();
    instance.setAttribute('label', 'Email');
    instance.setAttribute('error', 'Invalid email');
    return instance.render() as VNode;
  };
  const first = renderWithError();
  const second = renderWithError();

  const firstInput = findByPart(first, 'control') as VNode;
  const secondInput = findByPart(second, 'control') as VNode;
  const firstError = findByPart(first, 'error') as VNode;
  const firstLabel = findByPart(first, 'label') as VNode;

  // Instance-unique: two instances never share an input id.
  assertStringIncludes(String(firstInput.props.id), 'input-');
  assertEquals(firstInput.props.id === secondInput.props.id, false);

  // aria/label wiring references this instance's ids, not fixed strings.
  assertEquals(firstLabel.props.htmlFor, firstInput.props.id);
  assertEquals(firstInput.props['aria-describedby'], firstError.props.id);
  assertEquals(firstInput.props['aria-errormessage'], firstError.props.id);
});

Deno.test('open-input: error attribute add/remove re-renders the message (#770)', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  const states = new Set<string>();
  (instance as unknown as { _internals: unknown })._internals = {
    states,
    setFormValue: () => {},
  };
  let updates = 0;
  (instance as unknown as { update: () => void }).update = () => {
    updates++;
  };

  // setAttribute('error', …) must render the message, not just the border.
  instance.setAttribute('error', 'Required');
  instance.attributeChangedCallback('error', null, 'Required');
  assertEquals(updates, 1);
  assertEquals(states.has('invalid'), true);
  let vnode = instance.render() as VNode;
  assertExists(findByPart(vnode, 'error'));
  assertStringIncludes(vnodeText(vnode), 'Required');

  // removeAttribute('error') must drop the message together with the state.
  instance.removeAttribute('error');
  instance.attributeChangedCallback('error', 'Required', null);
  assertEquals(updates, 2);
  assertEquals(states.has('invalid'), false);
  vnode = instance.render() as VNode;
  assertEquals(findByPart(vnode, 'error'), undefined);
});

Deno.test('open-input: label attribute change re-renders (#770)', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  let updates = 0;
  (instance as unknown as { update: () => void }).update = () => {
    updates++;
  };

  instance.setAttribute('label', 'Email');
  instance.attributeChangedCallback('label', null, 'Email');
  assertEquals(updates, 1);
  const vnode = instance.render() as VNode;
  assertExists(findByPart(vnode, 'label'));
  assertStringIncludes(vnodeText(vnode), 'Email');
});

Deno.test('open-input: value change still syncs in place without re-render (#770)', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  const formValues: string[] = [];
  (instance as unknown as { _internals: unknown })._internals = {
    setFormValue: (v: string) => formValues.push(v),
  };
  let updates = 0;
  (instance as unknown as { update: () => void }).update = () => {
    updates++;
  };

  // `value` is written back on every keystroke — re-rendering here would
  // replace the focused <input> mid-typing, so it must sync in place.
  instance.setAttribute('value', 'typed');
  instance.attributeChangedCallback('value', null, 'typed');
  assertEquals(updates, 0);
  assertEquals(formValues, ['typed']);
});

Deno.test('open-input: removeAttribute(value) also clears the rendered input (#1067)', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  instance.setAttribute('value', 'typed');

  // The harness has no shadow DOM; stub the inner input _syncDOM re-queries.
  const inner = { value: 'typed', disabled: false };
  Object.defineProperty(instance, 'shadowRoot', {
    configurable: true,
    value: { querySelector: (selector: string) => (selector === 'input' ? inner : null) },
  });
  const sync = instance as unknown as { _syncDOM(): void };
  sync._syncDOM();
  assertEquals(inner.value, 'typed');

  // After removal the visible text must match the (already cleared) form
  // value, mirroring native input behavior where the attribute is the
  // default value.
  instance.removeAttribute('value');
  sync._syncDOM();
  assertEquals(inner.value, '');
});

// FACE pilot (ADR-0123 item 14, #864): the tests below pin the
// ElementInternals contract — what enters FormData on submit, validity
// basics, and graceful degradation where ElementInternals is absent.

Deno.test('open-input: connectedCallback is overridden to sync initial form state', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  // attributeChangedCallback for a pre-upgrade `value` fires before
  // connectedCallback, so only an own connectedCallback override can push the
  // initial value into the internals attached there. Without it the field
  // would submit empty.
  assertEquals(
    Object.prototype.hasOwnProperty.call(OpenInput.prototype, 'connectedCallback'),
    true,
  );
});

Deno.test('open-input: submission contract — value reaches FormData under name', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  instance.setAttribute('name', 'username');
  instance.setAttribute('value', 'jane');

  // What the browser hands FormData on submit: the latest setFormValue
  // payload of each form-associated element, keyed by its name attribute.
  const formData = new Map<string, string>();
  (instance as unknown as { _internals: unknown })._internals = {
    setFormValue: (v: string) => formData.set(instance.getAttribute('name') || '', v),
    setValidity: () => {},
  };

  // The base-class connectedCallback attachShadow path is unavailable in
  // this harness; invoke the same sync the override performs after super.
  const sync = instance as unknown as { _syncFormValue(): void; _syncValidity(): void };
  sync._syncFormValue();
  sync._syncValidity();
  assertEquals(formData.get('username'), 'jane');

  // Typing replaces the submission value.
  const input = findByPart(instance.render() as VNode, 'control') as VNode;
  (input.props.onInput as (e: Event) => void)?.(fakeInputEvent('jane-doe'));
  assertEquals(formData.get('username'), 'jane-doe');
});

Deno.test('open-input: required + empty value reports valueMissing, clears when filled', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  const validityCalls: Array<{ flags: Record<string, unknown>; message: string }> = [];
  (instance as unknown as { _internals: unknown })._internals = {
    setFormValue: () => {},
    setValidity: (flags: Record<string, unknown>, message?: string) =>
      validityCalls.push({ flags, message: message || '' }),
  };
  (instance as unknown as { update: () => void }).update = () => {};

  instance.setAttribute('required', '');
  instance.attributeChangedCallback('required', null, '');
  assertEquals(validityCalls.length, 1);
  assertEquals(validityCalls[0].flags.valueMissing, true);
  // A non-empty message is required by the platform when any flag is set.
  assertEquals(validityCalls[0].message.length > 0, true);

  instance.setAttribute('value', 'filled');
  instance.attributeChangedCallback('value', null, 'filled');
  assertEquals(validityCalls.length, 2);
  assertEquals(validityCalls[1].flags.valueMissing, undefined);
});

Deno.test('open-input: internals without setValidity degrade gracefully (SSR/test envs)', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  // jsdom/happy-dom-style environments may expose internals without
  // setValidity; the required/value paths must not throw.
  (instance as unknown as { _internals: unknown })._internals = {
    setFormValue: () => {},
  };
  (instance as unknown as { update: () => void }).update = () => {};

  instance.setAttribute('required', '');
  instance.attributeChangedCallback('required', null, '');
  instance.setAttribute('value', 'x');
  instance.attributeChangedCallback('value', null, 'x');
});

Deno.test('open-input: formResetCallback clears submission value and re-syncs validity', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  const formValues: string[] = [];
  const validityCalls: Array<Record<string, unknown>> = [];
  (instance as unknown as { _internals: unknown })._internals = {
    setFormValue: (v: string) => formValues.push(v),
    setValidity: (flags: Record<string, unknown>) => validityCalls.push(flags),
  };

  instance.setAttribute('required', '');
  instance.setAttribute('value', 'filled');
  instance.formResetCallback();

  assertEquals(instance.getAttribute('value'), '');
  assertEquals(formValues.at(-1), '');
  // required is still set and the value is now empty → valueMissing again.
  assertEquals(validityCalls.at(-1)?.valueMissing, true);
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

Deno.test('open-code-block: failed clipboard write sets copyState and shows Failed', async () => {
  const { OpenCodeBlock } = await import('../src/open-code-block.tsx');
  const instance = new OpenCodeBlock();
  instance.textContent = 'const answer = 42;';

  // The harness has no shadow DOM; stub the copy button the component
  // re-queries in _updateCopyButtonDOM.
  const button = { textContent: 'Copy' };
  Object.defineProperty(instance, 'shadowRoot', {
    configurable: true,
    value: {
      querySelector: (selector: string) => (selector === 'button.copy-btn' ? button : null),
    },
  });

  const restoreClipboard = installClipboardSpy(() => Promise.reject(new Error('denied')));
  try {
    await (instance as unknown as { _copy(): Promise<void> })._copy();
    assertEquals(button.textContent, 'Failed');
  } finally {
    restoreClipboard();
    // Clears the pending COPY_FEEDBACK_MS reset timer via the lifecycle scope.
    instance.disconnectedCallback?.();
  }
});

Deno.test('open-code-block: highlighted shadow code uses the parsed language class', async () => {
  const { OpenCodeBlock } = await import('../src/open-code-block.tsx');
  const instance = new OpenCodeBlock();

  const codeEl = {
    classList: ['language-python'],
    textContent: 'print(1)',
  };
  const pre = {
    tagName: 'PRE',
    querySelector: (selector: string) => (selector === 'code' ? codeEl : null),
  };
  instance.appendChild(pre as unknown as Node);

  const injectedChildren: Array<{ className?: string }> = [];
  Object.defineProperty(instance, 'shadowRoot', {
    configurable: true,
    value: {
      querySelector: (selector: string) =>
        selector === 'slot'
          ? {
            replaceWith: (el: { children: Array<{ className?: string }> }) => {
              injectedChildren.push(...el.children);
            },
          }
          : null,
    },
  });

  const originalPrism = Object.getOwnPropertyDescriptor(globalThis, 'Prism');
  Object.defineProperty(globalThis, 'Prism', {
    configurable: true,
    writable: true,
    value: {
      languages: { python: {} },
      highlight: () => '<span>print(1)</span>',
    },
  });
  try {
    (instance as unknown as { _tryHighlight(): void })._tryHighlight();
    assertEquals(injectedChildren.length, 1);
    assertEquals(injectedChildren[0]?.className, 'language-python');
  } finally {
    if (originalPrism) Object.defineProperty(globalThis, 'Prism', originalPrism);
    else delete (globalThis as { Prism?: unknown }).Prism;
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

Deno.test('open-theme-toggle: attribute applies without persisting; explicit toggle persists (#804)', async () => {
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
    // #804: the attribute/init path applies and propagates but must NOT lock
    // the theme into localStorage.
    assertEquals(stored.has('open-theme'), false);

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

Deno.test('open-theme-toggle: first-visit init does not write localStorage (#804)', async () => {
  const { OpenThemeToggle } = await import('../src/open-theme-toggle.tsx');
  const originalDocumentElement = document.documentElement;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const writes: string[] = [];
  Object.defineProperty(document, 'documentElement', {
    configurable: true,
    value: { dataset: {}, style: { colorScheme: '' }, setAttribute() {} },
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => null,
      setItem: (key: string, value: string) => writes.push(`${key}=${value}`),
    },
  });
  try {
    const instance = new OpenThemeToggle();
    (instance as unknown as { _initTheme(): void })._initTheme();
    // Persisting here would lock the resolved theme and override future
    // OS-level prefers-color-scheme switches.
    assertEquals(writes, []);
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

Deno.test('open-dialog: custom states follow open transitions and ignore unrelated changes', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  const instance = new OpenDialog();
  const states = new Set<string>();
  (instance as unknown as { _internals: { states: Set<string> } })._internals = { states };

  instance.attributeChangedCallback('open', null, null);
  instance.attributeChangedCallback('label', null, 'Ignored');
  instance.setAttribute('open', '');
  instance.attributeChangedCallback('open', null, '');
  assertEquals(states.has('open'), true);
  assertEquals(states.has('closed'), false);

  instance.removeAttribute('open');
  instance.attributeChangedCallback('open', '', null);
  assertEquals(states.has('open'), false);
  assertEquals(states.has('closed'), true);
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

Deno.test('open-dialog: modal open uses native showModal and never inerts siblings', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  const instance = new OpenDialog();
  const calls: string[] = [];
  const fakeDialog = {
    open: false,
    showModal() {
      this.open = true;
      calls.push('showModal');
    },
    show() {
      this.open = true;
      calls.push('show');
    },
    close() {
      this.open = false;
      calls.push('close');
    },
  };
  Object.defineProperty(instance, 'shadowRoot', {
    configurable: true,
    value: { querySelector: (selector: string) => selector === 'dialog' ? fakeDialog : null },
  });

  const sibling = document.createElement('aside');
  const parent = { children: [sibling, instance] };
  Object.defineProperty(instance, 'parentNode', { configurable: true, value: parent });

  instance.setAttribute('open', '');
  instance.attributeChangedCallback('open', null, '');

  // Modal semantics come from the native top layer: showModal() puts all
  // non-top-layer content inert at the platform level, so the component must
  // not hand-roll inert onto siblings.
  assertEquals(calls, ['showModal']);
  assertEquals(sibling.hasAttribute('inert'), false);

  instance.removeAttribute('open');
  instance.attributeChangedCallback('open', '', null);
  assertEquals(calls, ['showModal', 'close']);
  assertEquals(sibling.hasAttribute('inert'), false);
});

Deno.test('open-dialog: non-modal mode uses show() and leaves the page interactive', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  const instance = new OpenDialog();
  instance.setAttribute('mode', 'non-modal');
  const calls: string[] = [];
  const fakeDialog = {
    open: false,
    showModal: () => calls.push('showModal'),
    show: () => calls.push('show'),
    close: () => calls.push('close'),
  };
  Object.defineProperty(instance, 'shadowRoot', {
    configurable: true,
    value: { querySelector: (selector: string) => selector === 'dialog' ? fakeDialog : null },
  });

  instance.setAttribute('open', '');
  instance.attributeChangedCallback('open', null, '');

  // Non-modal dialogs intentionally do not block page interaction.
  assertEquals(calls, ['show']);
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

Deno.test('open-badge: tone/size attribute changes trigger re-render (#769)', async () => {
  const { OpenBadge } = await import('../src/open-badge.tsx');
  const instance = new OpenBadge();
  let updates = 0;
  (instance as unknown as { update: () => void }).update = () => {
    updates++;
  };

  // setAttribute('tone', …) after connect must take effect, not no-op.
  instance.setAttribute('tone', 'success');
  instance.attributeChangedCallback('tone', null, 'success');
  assertEquals(updates, 1);
  assertStringIncludes(String((instance.render() as VNode).props.className), 'badge--success');

  instance.setAttribute('size', 'sm');
  instance.attributeChangedCallback('size', null, 'sm');
  assertEquals(updates, 2);
  assertStringIncludes(String((instance.render() as VNode).props.className), 'badge--sm');

  // No-op change (same value) must not re-render.
  instance.attributeChangedCallback('tone', 'success', 'success');
  assertEquals(updates, 2);
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

// ─── #865: open-dropdown on the Popover API ──────────────────────────────────
// The content element is a native popover (top layer, light dismiss, focus
// return); the component must not re-implement any of that by hand.

Deno.test('open-dropdown: content is a native popover without hand-rolled dismiss or state', async () => {
  const module = asComponentModule(await import('../src/open-dropdown.tsx'));
  const instance = new (exportedConstructor(module))();
  const content = findByPart(instance.render() as VNode, 'content') as VNode;
  assertExists(content);

  // popover='auto' gives top layer + Esc/outside-click light dismiss natively,
  // so no manual key handling or toggle-event state mirroring may remain.
  assertEquals(content.props.popover, 'auto');
  assertEquals(content.props.onKeyDown, undefined);
  assertEquals(content.props.onToggle, undefined);

  // Placement relies on CSS Anchor Positioning, not z-index stacking or the
  // deleted data-open fallback attribute. The anchor-name/position-anchor
  // pair is per-instance inline style (#1061), so the shared sheet only
  // carries the anchor() longhands.
  const Component = exportedConstructor(module);
  const css = (Component as unknown as { styles: Array<{ cssRules: Array<{ cssText: string }> }> })
    .styles.map((sheet) => sheet.cssRules.map((rule) => rule.cssText).join('\n')).join('\n');
  assertStringIncludes(css, 'anchor(bottom)');
  assertFalse(css.includes('data-open'));
  assertFalse(css.includes('z-index'));
});

// ─── #1061: per-instance anchor names ────────────────────────────────────────
// A shared `--open-dropdown-trigger` anchor name made every popover on the
// page resolve to the last host in document order.

Deno.test('open-dropdown: each instance anchors its content to its own host (#1061)', async () => {
  const module = asComponentModule(await import('../src/open-dropdown.tsx'));
  const Component = exportedConstructor(module);

  const first = findByPart(new Component().render() as VNode, 'content') as VNode;
  const second = findByPart(new Component().render() as VNode, 'content') as VNode;
  const firstStyle = String(first.props.style);
  const secondStyle = String(second.props.style);

  assertStringIncludes(firstStyle, 'position-anchor: --open-dropdown-trigger-');
  // Two instances must never share an anchor name.
  assertNotEquals(firstStyle, secondStyle);
});

Deno.test('open-dropdown: connect re-syncs both anchor halves from the client realm', async () => {
  const { OpenDropdown } = await import('../src/open-dropdown.tsx');
  // DSD hydration preserves the server-baked position-anchor inline style
  // while the host anchor-name is client-written, and the two counters
  // diverge on multi-page SSG sites — so only an own connectedCallback
  // override can re-pair the popover with its host.
  assertEquals(
    Object.prototype.hasOwnProperty.call(OpenDropdown.prototype, 'connectedCallback'),
    true,
  );

  const instance = new OpenDropdown();
  const written = new Map<string, string>();
  Object.defineProperty(instance, 'style', {
    configurable: true,
    value: { setProperty: (name: string, value: string) => written.set(`host:${name}`, value) },
  });
  Object.defineProperty(instance, 'shadowRoot', {
    configurable: true,
    value: {
      querySelector: (selector: string) =>
        selector === '.content'
          ? { style: { setProperty: (n: string, v: string) => written.set(`content:${n}`, v) } }
          : null,
    },
  });

  // The base-class connectedCallback attachShadow path is unavailable in
  // this harness; invoke the same sync the override performs after super.
  (instance as unknown as { _syncAnchorName(): void })._syncAnchorName();

  // The shadow .content style must be overwritten with the same client value
  // written to the host, so the client realm wins on both ends.
  const anchorName = written.get('host:anchor-name');
  assertExists(anchorName);
  assertStringIncludes(anchorName, '--open-dropdown-trigger-');
  assertEquals(written.get('content:position-anchor'), anchorName);
});

Deno.test('open-dropdown: trigger click toggles the native popover', async () => {
  const module = asComponentModule(await import('../src/open-dropdown.tsx'));
  const instance = new (exportedConstructor(module))();

  let toggles = 0;
  let popoverOpen = false;
  const content = {
    matches: (selector: string) => selector === ':popover-open' && popoverOpen,
    togglePopover: () => {
      toggles++;
      popoverOpen = !popoverOpen;
    },
  };
  Object.defineProperty(instance, 'shadowRoot', {
    configurable: true,
    value: { querySelector: (selector: string) => (selector === '.content' ? content : null) },
  });

  const trigger = findByPart(instance.render() as VNode, 'trigger') as VNode;
  assertExists(trigger);
  const pointerDown = () => (trigger.props.onPointerDown as () => void)();
  const click = () => (trigger.props.onClick as () => void)();

  // Keyboard/programmatic activation (no pointerdown) toggles directly.
  click();
  assertEquals(toggles, 1);
  assertEquals(popoverOpen, true);
  click();
  assertEquals(toggles, 2);
  assertEquals(popoverOpen, false);

  // Mouse activation while open: the pointerdown light-dismisses natively, so
  // the following click must NOT toggle (re-open) the popover.
  popoverOpen = true;
  pointerDown();
  popoverOpen = false; // native light dismiss runs between pointerdown and click
  click();
  assertEquals(toggles, 2);
  assertEquals(popoverOpen, false);

  // Mouse activation while closed: pointerdown records closed, click toggles.
  pointerDown();
  click();
  assertEquals(toggles, 3);
  assertEquals(popoverOpen, true);

  // The consumed pointerdown guard resets: a later keyboard click toggles.
  click();
  assertEquals(toggles, 4);
  assertEquals(popoverOpen, false);
});

// ─── #726: no double-escaping of attribute text ─────────────────────────────
// Components must pass label/error text to the JSX pipeline RAW. The CSR
// renderer inserts strings via createTextNode and SSR escapes text nodes in
// render-ir, so pre-escaping here would surface literal `&amp;` (CSR) or
// `&amp;amp;` (SSR).

Deno.test('open-input: label and error text are passed raw (no pre-escaping)', async () => {
  const { OpenInput } = await import('../src/open-input.tsx');
  const instance = new OpenInput();
  instance.setAttribute('label', 'Tom & "Jerry" <3');
  instance.setAttribute('error', '5 > 3 & 2 < 4');

  const vnode = instance.render() as VNode;
  const label = findByPart(vnode, 'label') as VNode;
  assertExists(label);
  assertEquals(label.children[0], 'Tom & "Jerry" <3');

  const error = findByPart(vnode, 'error') as VNode;
  assertExists(error);
  assertEquals(error.children[0], '5 > 3 & 2 < 4');
  assertFalse(vnodeText(vnode).includes('&amp;'));
});

Deno.test('open-dialog: label text is passed raw (no pre-escaping)', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  const instance = new OpenDialog();
  instance.setAttribute('label', 'Delete "a&b" <file>?');

  const vnode = instance.render() as VNode;
  const title = findNode(vnode, (n) => n.props?.className === 'dialog-title') as VNode;
  assertExists(title);
  assertEquals(title.children[0], 'Delete "a&b" <file>?');
});

Deno.test('open-callout: label text is passed raw (no pre-escaping)', async () => {
  const { OpenCallout } = await import('../src/open-callout.tsx');
  const instance = new OpenCallout();
  instance.setAttribute('label', 'Fish & "Chips" <today>');

  const vnode = instance.render() as VNode;
  const title = findNode(vnode, (n) => n.props?.className === 'callout-title') as VNode;
  assertExists(title);
  assertEquals(title.children[0], 'Fish & "Chips" <today>');
});

// ─── #667: initial `open` state is synced by the render path ────────────────
// attributeChangedCallback fires at upgrade time — before the shadow root and
// ElementInternals exist — so SSR markup like `<open-dialog open>` must be
// reconciled once the initial render/hydration completes.

Deno.test('open-dialog: render reflects the open attribute on the inner dialog', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  const instance = new OpenDialog();
  instance.setAttribute('open', '');

  const vnode = instance.render() as VNode;
  const dialog = findByTag(vnode, 'dialog') as VNode;
  assertEquals(dialog.props.open, true);
});

Deno.test('open-dialog: initial open state syncs after the first render', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  const instance = new OpenDialog();
  const states = new Set<string>();
  (instance as unknown as { _internals: { states: Set<string> } })._internals = { states };
  const calls: string[] = [];
  const fakeDialog = {
    open: false,
    showModal() {
      this.open = true;
      calls.push('showModal');
    },
    show() {
      this.open = true;
      calls.push('show');
    },
    close() {
      this.open = false;
      calls.push('close');
    },
  };
  Object.defineProperty(instance, 'shadowRoot', {
    configurable: true,
    value: { querySelector: (selector: string) => selector === 'dialog' ? fakeDialog : null },
  });

  // SSR markup arrives with `open` already set; no attribute change follows.
  instance.setAttribute('open', '');
  instance.render();
  (instance as unknown as { onCsrRendered(): void }).onCsrRendered();

  assertEquals(calls, ['showModal']);
  assertEquals(states.has('open'), true);
  assertEquals(states.has('closed'), false);
});

Deno.test('open-dialog: DSD hydration upgrades attribute-open dialog to modal (#1030)', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  const instance = new OpenDialog();
  const calls: string[] = [];
  const fakeDialog = {
    open: true, // DSD shadow DOM carries the open attribute — visible but NON-modal
    showModal() {
      this.open = true;
      calls.push('showModal');
    },
    show: () => calls.push('show'),
    close() {
      this.open = false;
      calls.push('close');
    },
  };
  Object.defineProperty(instance, 'shadowRoot', {
    configurable: true,
    value: { querySelector: (selector: string) => selector === 'dialog' ? fakeDialog : null },
  });

  instance.setAttribute('open', '');
  (instance as unknown as { onDsdHydrated(): void }).onDsdHydrated();

  // The attribute-driven open presents as non-modal: close it and re-enter
  // via showModal() so the dialog gets the top layer, ::backdrop, and focus
  // containment the default modal mode promises.
  assertEquals(calls, ['close', 'showModal']);
  assertEquals(fakeDialog.open, true);

  // A repeated hydration sync must not re-open (no flicker, no double events).
  (instance as unknown as { onDsdHydrated(): void }).onDsdHydrated();
  assertEquals(calls, ['close', 'showModal']);
});

Deno.test('open-dialog: CSR initial open also enters modal top layer (#1030)', async () => {
  const { OpenDialog } = await import('../src/open-dialog.tsx');
  const instance = new OpenDialog();
  const calls: string[] = [];
  const fakeDialog = {
    // The first render writes open={true} onto the inner <dialog>, so the
    // platform dialog is already open when onCsrRendered() runs.
    open: true,
    showModal() {
      this.open = true;
      calls.push('showModal');
    },
    show: () => calls.push('show'),
    close() {
      this.open = false;
      calls.push('close');
    },
  };
  Object.defineProperty(instance, 'shadowRoot', {
    configurable: true,
    value: { querySelector: (selector: string) => selector === 'dialog' ? fakeDialog : null },
  });

  instance.setAttribute('open', '');
  instance.render();
  (instance as unknown as { onCsrRendered(): void }).onCsrRendered();

  assertEquals(calls, ['close', 'showModal']);
  assertEquals(fakeDialog.open, true);

  // Close → open cycle still works after the initial modal upgrade.
  instance.removeAttribute('open');
  instance.attributeChangedCallback('open', '', null);
  instance.setAttribute('open', '');
  instance.attributeChangedCallback('open', null, '');
  assertEquals(calls, ['close', 'showModal', 'close', 'showModal']);
});

function setupTabs(instance: HTMLElement): { tabs: MockElement[]; panels: MockElement[] } {
  const tabs = [
    createMockElement('span', { slot: 'tab' }, '<strong>Tab</strong> 1'),
    createMockElement('span', { slot: 'tab' }, 'Tab 2'),
    createMockElement('span', { slot: 'tab' }, 'Tab 3'),
  ];
  const panels = [
    createMockElement('div', { slot: 'panel' }, '<p>Panel 1</p>'),
    createMockElement('div', { slot: 'panel' }, '<p>Panel 2</p>'),
    createMockElement('div', { slot: 'panel' }, '<p>Panel 3</p>'),
  ];
  appendMockChildren(instance, [...tabs, ...panels]);
  installQuerySelectorAll(instance, (selector) => {
    if (selector === '[slot="tab"]') return tabs;
    if (selector === '[slot="panel"]') return panels;
    return [];
  });
  return { tabs, panels };
}

function keydownEvent(key: string): KeyboardEvent {
  return Object.assign(new Event('keydown'), { key }) as KeyboardEvent;
}

Deno.test('open-tabs: renders tablist with slots instead of copying tab content', async () => {
  const module = asComponentModule(await import('../src/open-tabs.tsx'));
  assertEquals(module.tagName, 'open-tabs');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const { tabs } = setupTabs(instance);

  const vnode = instance.render() as VNode;
  const tablist = findNode(vnode, (n) => n.props?.role === 'tablist') as VNode;
  assertExists(tablist);
  const tabSlot = findNode(tablist, (n) => n.tag === 'slot' && n.props.name === 'tab');
  assertExists(tabSlot);
  assertExists(findNode(vnode, (n) => n.tag === 'slot' && n.props.name === 'panel'));

  // Slotted children keep their own structure: nothing is flattened into the
  // shadow tree, so the source element's markup never appears in the VNode.
  assertFalse(vnodeText(vnode).includes('Tab'));
  assertEquals(tabs[0].innerHTML, '<strong>Tab</strong> 1');
});

Deno.test('open-tabs: decorates light tabs/panels with WAI-ARIA wiring', async () => {
  const { OpenTabs } = await import('../src/open-tabs.tsx');
  const instance = new OpenTabs();
  const { tabs, panels } = setupTabs(instance);

  instance.render();

  assertEquals(tabs[0].getAttribute('role'), 'tab');
  assertEquals(tabs[0].getAttribute('aria-selected'), 'true');
  assertEquals(tabs[0].getAttribute('tabindex'), '0');
  assertEquals(tabs[1].getAttribute('aria-selected'), 'false');
  assertEquals(tabs[1].getAttribute('tabindex'), '-1');

  // aria-controls / aria-labelledby cross-reference each other.
  assertEquals(tabs[1].getAttribute('aria-controls'), panels[1].getAttribute('id'));
  assertEquals(panels[1].getAttribute('aria-labelledby'), tabs[1].getAttribute('id'));

  assertEquals(panels[0].getAttribute('role'), 'tabpanel');
  assertEquals(panels[0].hasAttribute('hidden'), false);
  assertEquals(panels[1].hasAttribute('hidden'), true);
});

Deno.test('open-tabs: clicking a tab selects it and unhides its panel', async () => {
  const { OpenTabs } = await import('../src/open-tabs.tsx');
  const instance = new OpenTabs();
  const { tabs, panels } = setupTabs(instance);

  instance.render();
  tabs[1].dispatchEvent(new Event('click'));
  instance.render();

  assertEquals(tabs[1].getAttribute('aria-selected'), 'true');
  assertEquals(tabs[0].getAttribute('aria-selected'), 'false');
  assertEquals(panels[1].hasAttribute('hidden'), false);
  assertEquals(panels[0].hasAttribute('hidden'), true);
});

Deno.test('open-tabs: ArrowLeft/ArrowRight/Home/End move selection and focus', async () => {
  const { OpenTabs } = await import('../src/open-tabs.tsx');
  const instance = new OpenTabs();
  const { tabs } = setupTabs(instance);

  const tablist = () => findNode(instance.render(), (n) => n.props?.role === 'tablist') as VNode;
  const press = (key: string) => {
    (tablist().props.onKeydown as (e: KeyboardEvent) => void)(keydownEvent(key));
    instance.render();
  };

  press('ArrowRight');
  assertEquals(tabs[1].getAttribute('aria-selected'), 'true');
  assertEquals(tabs[1].focused, true);

  press('ArrowRight');
  press('ArrowRight'); // wraps around to the first tab
  assertEquals(tabs[0].getAttribute('aria-selected'), 'true');
  assertEquals(tabs[0].focused, true);

  press('ArrowLeft'); // wraps backwards to the last tab
  assertEquals(tabs[2].getAttribute('aria-selected'), 'true');

  press('Home');
  assertEquals(tabs[0].getAttribute('aria-selected'), 'true');

  press('End');
  assertEquals(tabs[2].getAttribute('aria-selected'), 'true');
});

Deno.test('open-tabs: tab without a matching panel is aria-disabled and not selectable', async () => {
  const { OpenTabs } = await import('../src/open-tabs.tsx');
  const instance = new OpenTabs();
  const { tabs } = setupTabs(instance);
  installQuerySelectorAll(instance, (selector) => {
    if (selector === '[slot="tab"]') return tabs;
    if (selector === '[slot="panel"]') return []; // no panels at all
    return [];
  });

  instance.render();
  assertEquals(tabs[0].getAttribute('aria-disabled'), 'true');

  tabs[0].dispatchEvent(new Event('click'));
  instance.render();
  assertEquals(tabs[0].getAttribute('aria-selected'), 'false');
});

Deno.test('open-tabs: ids are instance-unique across multiple tab sets', async () => {
  const { OpenTabs } = await import('../src/open-tabs.tsx');
  const first = new OpenTabs();
  const second = new OpenTabs();
  const firstSetup = setupTabs(first);
  const secondSetup = setupTabs(second);

  first.render();
  second.render();

  const firstTabId = firstSetup.tabs[0].getAttribute('id') as string;
  const secondTabId = secondSetup.tabs[0].getAttribute('id') as string;

  // Instance-unique: two <open-tabs> on one page never share tab/panel ids.
  assertStringIncludes(firstTabId, 'open-tabs-');
  assertEquals(firstTabId === secondTabId, false);
  assertEquals(
    firstSetup.panels[0].getAttribute('id') === secondSetup.panels[0].getAttribute('id'),
    false,
  );

  // aria cross-references stay inside the owning instance.
  assertEquals(
    firstSetup.tabs[1].getAttribute('aria-controls'),
    firstSetup.panels[1].getAttribute('id'),
  );
  assertEquals(
    secondSetup.panels[1].getAttribute('aria-labelledby'),
    secondSetup.tabs[1].getAttribute('id'),
  );
});

Deno.test('manifest: declares metadata for manifest-registered components', async () => {
  const { manifest } = await import('../src/index.ts') as ManifestModule;

  for (const name of COMPONENT_FILES) {
    const decl = manifest.declarations.find((d) => d.tagName === name);
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
