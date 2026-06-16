/**
 * @openelement/ui public contract tests.
 */
import {
  assertEquals,
  assertExists,
  assertFalse,
  assertStringIncludes,
} from 'jsr:@std/assert@^1.0.0';
import type { VNode } from '@openelement/core';

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

installDomHarness();

const COMPONENT_FILES = [
  'open-button',
  'open-card',
  'open-input',
  'open-code-block',
  'open-layout',
  'open-theme-toggle',
  'open-dialog',
  'open-callout',
  'open-step-card',
  'open-dropdown',
  'open-modal',
  'open-tabs',
  'open-button-linear',
  'open-card-linear',
  'open-input-linear',
  'open-nav-linear',
  'open-badge-linear',
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
    fileName: 'open-layout',
    className: 'OpenLayout',
    props: ['home', 'currentPath', 'navItems', 'headerNav', 'logoText', 'logoSub', 'githubUrl'],
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
      'OpenLayout',
      'OpenThemeToggle',
      'OpenHeroPing',
      'OpenDialog',
      'OpenCallout',
      'OpenStepCard',
      'OpenDropdown',
      'OpenModal',
      'OpenTabs',
      'OpenButtonLinear',
      'OpenCardLinear',
      'OpenInputLinear',
      'OpenNavLinear',
      'OpenBadgeLinear',
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
  (input.props.onInput as (e: Event) => void)?.({ target: { value: 'typed' } } as unknown as Event);

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
  (input.props.onChange as (e: Event) => void)?.(
    { target: { value: 'changed' } } as unknown as Event,
  );
  (input.props.onFocus as (e: Event) => void)?.({} as unknown as Event);
  (input.props.onBlur as (e: Event) => void)?.({} as unknown as Event);

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
  const originalClipboard = navigator.clipboard;
  (navigator as unknown as Record<string, unknown>).clipboard = {
    writeText: (text: string) => {
      copied = text;
      return Promise.resolve();
    },
  };

  try {
    const vnode = instance.render() as VNode;
    clickVNode(findByPart(vnode, 'copy'));
    assertEquals(copied, 'const answer = 42;');
  } finally {
    (navigator as unknown as Record<string, unknown>).clipboard = originalClipboard;
  }
});

Deno.test('open-layout: has correct tagName and layout structure', async () => {
  const module = asComponentModule(await import('../src/open-layout.tsx'));
  assertEquals(module.tagName, 'open-layout');

  const Component = exportedConstructor(module);
  const instance = new Component();
  instance.setAttribute('logo-text', 'openElement');
  const vnode = instance.render() as VNode;
  assertStringIncludes(String(vnode.props.className), 'app-layout');
  assertStringIncludes(vnodeText(vnode), 'openElement');
  assertExists(findByPart(vnode, 'header'));
  assertExists(findByPart(vnode, 'main'));
});

Deno.test('open-layout: home attribute hides sidebar', async () => {
  const { OpenLayout } = await import('../src/open-layout.tsx');
  const instance = new OpenLayout();
  instance.setAttribute('home', '');
  const vnode = instance.render() as VNode;
  assertEquals(vnode.props.home, true);
});

Deno.test('open-layout: header-nav renders navigation links', async () => {
  const { OpenLayout } = await import('../src/open-layout.tsx');
  const instance = new OpenLayout();
  instance.setAttribute(
    'header-nav',
    JSON.stringify([{ href: '/guide', label: 'Guide' }]),
  );
  const vnode = instance.render() as VNode;
  assertStringIncludes(vnodeText(vnode), 'Guide');
});

Deno.test('open-layout: nav-items render sidebar sections', async () => {
  const { OpenLayout } = await import('../src/open-layout.tsx');
  const instance = new OpenLayout();
  instance.setAttribute(
    'nav-items',
    JSON.stringify([
      { section: 'Quick Start', items: [{ path: '/guide/start', label: 'Start' }] },
    ]),
  );
  instance.setAttribute('current-path', '/guide/start');
  const vnode = instance.render() as VNode;
  assertStringIncludes(vnodeText(vnode), 'Quick Start');
  assertStringIncludes(vnodeText(vnode), 'Start');
  assertExists(findByPart(vnode, 'sidebar'));
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

Deno.test('open-step-card: has correct tagName and step content', async () => {
  const module = asComponentModule(await import('../src/open-step-card.tsx'));
  assertEquals(module.tagName, 'open-step-card');

  const Component = exportedConstructor(module);
  const instance = new Component();
  instance.setAttribute('step', '3');
  instance.setAttribute('label', 'Deploy');
  instance.setAttribute('description', 'Push to production');
  const vnode = instance.render() as VNode;
  assertEquals(vnode.props.part, 'container');
  assertStringIncludes(vnodeText(vnode), '3');
  assertStringIncludes(vnodeText(vnode), 'Deploy');
  assertStringIncludes(vnodeText(vnode), 'Push to production');
  assertExists(findByPart(vnode, 'indicator'));
  assertExists(findByPart(vnode, 'title'));
  assertExists(findByPart(vnode, 'content'));
});

Deno.test('open-step-card: default step is 1', async () => {
  const { OpenStepCard } = await import('../src/open-step-card.tsx');
  const instance = new OpenStepCard();
  const vnode = instance.render() as VNode;
  assertStringIncludes(vnodeText(vnode), '1');
});

Deno.test('open-dropdown: has correct tagName and toggle structure', async () => {
  const module = asComponentModule(await import('../src/open-dropdown.tsx'));
  assertEquals(module.tagName, 'open-dropdown');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertEquals(vnode.props.class, 'dropdown');
  assertExists(
    vnode.children.find((c) => isVNodeObject(c) && c.tag === 'slot' && c.props.name === 'trigger'),
  );
});

Deno.test('open-dropdown: trigger click toggles data-open', async () => {
  const { OpenDropdown } = await import('../src/open-dropdown.tsx');
  const instance = new OpenDropdown();
  const vnode = instance.render() as VNode;
  const trigger = vnode.children.find((c) =>
    isVNodeObject(c) && c.tag === 'slot' && c.props.name === 'trigger'
  ) as VNode;
  assertEquals(instance.getAttribute('data-open'), null);
  clickVNode(trigger);
  assertEquals(instance.getAttribute('data-open'), 'true');
  clickVNode(trigger);
  assertEquals(instance.getAttribute('data-open'), 'false');
});

Deno.test('open-modal: has correct tagName and dialog role', async () => {
  const module = asComponentModule(await import('../src/open-modal.tsx'));
  assertEquals(module.tagName, 'open-modal');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertEquals(vnode.props.class, 'modal');
  assertEquals(vnode.props.role, 'dialog');
  assertEquals(vnode.props['aria-modal'], 'true');
});

Deno.test('open-modal: open and close update rendered state', async () => {
  const { OpenModal } = await import('../src/open-modal.tsx');
  const instance = new OpenModal();
  const closed = instance.render() as VNode;
  assertEquals(signalValue<boolean>(closed.props.open), false);

  instance.open();
  const opened = instance.render() as VNode;
  assertEquals(signalValue<boolean>(opened.props.open), true);

  instance.close();
  const reopened = instance.render() as VNode;
  assertEquals(signalValue<boolean>(reopened.props.open), false);
});

Deno.test('open-modal: backdrop click closes modal', async () => {
  const { OpenModal } = await import('../src/open-modal.tsx');
  const instance = new OpenModal();
  instance.open();
  const vnode = instance.render() as VNode;
  const backdrop = vnode.children.find((c) =>
    isVNodeObject(c) &&
    (c.props.class === 'modal-backdrop' || String(c.props.class).includes('modal-backdrop'))
  ) as VNode;
  assertExists(backdrop);
  (backdrop.props.onClick as (e: Event) => void)?.(
    {
      target: { classList: { contains: (t: string) => t === 'modal-backdrop' } },
    } as unknown as Event,
  );
  assertEquals(signalValue<boolean>((instance.render() as VNode).props.open), false);
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

Deno.test('open-hero-ping: has correct tagName and renders status UI', async () => {
  const module = asComponentModule(await import('../src/open-hero-ping.tsx'));
  assertEquals(module.tagName, 'open-hero-ping');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertExists(findByPart(vnode, 'dot-static'));
  const btn = findByPart(vnode, 'dot-animated') as VNode;
  assertEquals(btn.tag, 'button');
  assertStringIncludes(vnodeText(btn), 'ping server');
});

// ─── Linear component contract tests ────────────────────────────────────────

Deno.test('open-button-linear: exports tagName and class', async () => {
  const mod = await import('../src/open-button-linear.tsx');
  assertEquals(mod.tagName, 'open-button-linear');
  assertEquals(typeof mod.OpenButtonLinear, 'function');
});

Deno.test('open-button-linear: has correct tagName and default render', async () => {
  const module = asComponentModule(await import('../src/open-button-linear.tsx'));
  assertEquals(module.tagName, 'open-button-linear');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertEquals(vnode.tag, 'button');
  assertEquals(vnode.props.part, 'control');
  assertEquals(vnode.props.type, 'button');
  assertStringIncludes(String(vnode.props.className), 'btn--primary');
  assertStringIncludes(String(vnode.props.className), 'btn--md');
});

Deno.test('open-button-linear: variant attribute reflects in render', async () => {
  const { OpenButtonLinear } = await import('../src/open-button-linear.tsx');
  const instance = new OpenButtonLinear();
  instance.setAttribute('variant', 'secondary');
  const vnode = instance.render() as VNode;
  assertStringIncludes(String(vnode.props.className), 'btn--secondary');

  instance.setAttribute('variant', 'tertiary');
  const v3 = instance.render() as VNode;
  assertStringIncludes(String(vnode.props.className), 'btn--secondary');
  assertStringIncludes(String(v3.props.className), 'btn--tertiary');

  instance.setAttribute('variant', 'inverse');
  const v4 = instance.render() as VNode;
  assertStringIncludes(String(v4.props.className), 'btn--inverse');
});

Deno.test('open-button-linear: size attribute reflects in render', async () => {
  const { OpenButtonLinear } = await import('../src/open-button-linear.tsx');
  const instance = new OpenButtonLinear();
  instance.setAttribute('size', 'sm');
  const v1 = instance.render() as VNode;
  assertStringIncludes(String(v1.props.className), 'btn--sm');

  instance.setAttribute('size', 'lg');
  const v2 = instance.render() as VNode;
  assertStringIncludes(String(v2.props.className), 'btn--lg');
});

Deno.test('open-button-linear: href renders anchor tag with part=control', async () => {
  const { OpenButtonLinear } = await import('../src/open-button-linear.tsx');
  const instance = new OpenButtonLinear();
  instance.setAttribute('href', 'https://example.com');
  instance.setAttribute('target', '_blank');
  const vnode = instance.render() as VNode;
  assertEquals(vnode.tag, 'a');
  assertEquals(vnode.props.href, 'https://example.com');
  assertEquals(vnode.props.target, '_blank');
  assertEquals(vnode.props.rel, 'noopener noreferrer');
  assertEquals(vnode.props.part, 'control');
});

Deno.test('open-button-linear: disabled reflects on button and anchor', async () => {
  const { OpenButtonLinear } = await import('../src/open-button-linear.tsx');
  // Button disabled
  const btn = new OpenButtonLinear();
  btn.setAttribute('disabled', '');
  const v1 = btn.render() as VNode;
  assertEquals(v1.props.disabled, true);

  // Anchor disabled
  const anchor = new OpenButtonLinear();
  anchor.setAttribute('href', '/docs');
  anchor.setAttribute('disabled', '');
  const v2 = anchor.render() as VNode;
  assertEquals(v2.props.href, '');
  assertEquals(v2.props['aria-disabled'], 'true');
});

Deno.test('open-button-linear: click dispatches open-click event', async () => {
  const { OpenButtonLinear } = await import('../src/open-button-linear.tsx');
  const instance = new OpenButtonLinear();
  let fired = false;
  instance.addEventListener('open-click', () => {
    fired = true;
  });
  const vnode = instance.render() as VNode;
  clickVNode(vnode, undefined, instance);
  assertEquals(fired, true);
});

// ─── open-card-linear ───────────────────────────────────────────────────────

Deno.test('open-card-linear: exports tagName and class', async () => {
  const mod = await import('../src/open-card-linear.tsx');
  assertEquals(mod.tagName, 'open-card-linear');
  assertEquals(typeof mod.OpenCardLinear, 'function');
});

Deno.test('open-card-linear: has correct tagName and slot structure', async () => {
  const module = asComponentModule(await import('../src/open-card-linear.tsx'));
  assertEquals(module.tagName, 'open-card-linear');

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

Deno.test('open-card-linear: variant attribute reflects', async () => {
  const { OpenCardLinear } = await import('../src/open-card-linear.tsx');
  const instance = new OpenCardLinear();

  // standard variant (default) — article with slots
  instance.setAttribute('variant', 'standard');
  const v1 = instance.render() as VNode;
  assertEquals(v1.tag, 'article');

  // code-panel — article with header bar
  instance.setAttribute('variant', 'code-panel');
  instance.setAttribute('title', 'example.ts');
  const v2 = instance.render() as VNode;
  assertEquals(v2.tag, 'article');
  assertStringIncludes(vnodeText(v2), 'example.ts');

  // featured — article
  instance.setAttribute('variant', 'featured');
  const v3 = instance.render() as VNode;
  assertEquals(v3.tag, 'article');
});

// ─── open-input-linear ──────────────────────────────────────────────────────

Deno.test('open-input-linear: exports tagName and class', async () => {
  const mod = await import('../src/open-input-linear.tsx');
  assertEquals(mod.tagName, 'open-input-linear');
  assertEquals(typeof mod.OpenInputLinear, 'function');
});

Deno.test('open-input-linear: has correct tagName and control part', async () => {
  const module = asComponentModule(await import('../src/open-input-linear.tsx'));
  assertEquals(module.tagName, 'open-input-linear');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertEquals(vnode.tag, 'div');
  assertEquals(vnode.props.part, 'wrapper');
  const control = findByPart(vnode, 'control') as VNode;
  assertEquals(control.tag, 'input');
});

Deno.test('open-input-linear: placeholder/value attributes render', async () => {
  const { OpenInputLinear } = await import('../src/open-input-linear.tsx');
  const instance = new OpenInputLinear();
  instance.setAttribute('placeholder', 'Enter text');
  instance.setAttribute('value', 'hello');

  const input = findByPart(instance.render() as VNode, 'control') as VNode;
  assertEquals(input.props.placeholder, 'Enter text');
  assertEquals(input.props.value, 'hello');
});

Deno.test('open-input-linear: variant attribute reflects', async () => {
  const { OpenInputLinear } = await import('../src/open-input-linear.tsx');
  const instance = new OpenInputLinear();

  // standard variant — no variant class, no decorative prefix
  instance.setAttribute('variant', 'standard');
  const v1 = instance.render() as VNode;
  const input1 = findByPart(v1, 'control') as VNode;
  assertStringIncludes(String(input1.props.className), 'linear-input');

  // cli variant — $ prefix present
  instance.setAttribute('variant', 'cli');
  const v2 = instance.render() as VNode;
  const input2 = findByPart(v2, 'control') as VNode;
  assertStringIncludes(String(input2.props.className), 'linear-input--cli');
  assertStringIncludes(vnodeText(v2), '$');

  // search variant — search icon present, default placeholder
  instance.setAttribute('variant', 'search');
  instance.removeAttribute('placeholder');
  const v3 = instance.render() as VNode;
  const input3 = findByPart(v3, 'control') as VNode;
  assertStringIncludes(String(input3.props.className), 'linear-input--search');
  assertEquals(input3.props.placeholder, 'Search documentation...');
});

Deno.test('open-input-linear: input event updates value and dispatches open-input', async () => {
  const { OpenInputLinear } = await import('../src/open-input-linear.tsx');
  const instance = new OpenInputLinear();
  const events: CustomEvent[] = [];
  instance.addEventListener('open-input', (e) => events.push(e as CustomEvent));

  const input = findByPart(instance.render() as VNode, 'control') as VNode;
  (input.props.onInput as (e: Event) => void)?.({
    target: { value: 'typed' },
  } as unknown as Event);

  assertEquals(instance.getAttribute('value'), 'typed');
  assertEquals(events.length, 1);
  assertEquals((events[0] as CustomEvent).detail.value, 'typed');
});

Deno.test('open-input-linear: change and focus events dispatch', async () => {
  const { OpenInputLinear } = await import('../src/open-input-linear.tsx');
  const instance = new OpenInputLinear();
  const changeEvents: CustomEvent[] = [];
  const focusEvents: CustomEvent[] = [];
  const blurEvents: CustomEvent[] = [];
  instance.addEventListener('open-change', (e) => changeEvents.push(e as CustomEvent));
  instance.addEventListener('open-focus', (e) => focusEvents.push(e as CustomEvent));
  instance.addEventListener('open-blur', (e) => blurEvents.push(e as CustomEvent));

  const input = findByPart(instance.render() as VNode, 'control') as VNode;
  (input.props.onChange as (e: Event) => void)?.({
    target: { value: 'changed' },
  } as unknown as Event);
  (input.props.onFocus as (e: Event) => void)?.({} as unknown as Event);
  (input.props.onBlur as (e: Event) => void)?.({} as unknown as Event);

  assertEquals(changeEvents.length, 1);
  assertEquals(focusEvents.length, 1);
  assertEquals(blurEvents.length, 1);
});

// ─── open-nav-linear ────────────────────────────────────────────────────────

Deno.test('open-nav-linear: exports tagName and class', async () => {
  const mod = await import('../src/open-nav-linear.tsx');
  assertEquals(mod.tagName, 'open-nav-linear');
  assertEquals(typeof mod.OpenNavLinear, 'function');
});

Deno.test('open-nav-linear: has correct tagName and renders logo text', async () => {
  const module = asComponentModule(await import('../src/open-nav-linear.tsx'));
  assertEquals(module.tagName, 'open-nav-linear');

  const Component = exportedConstructor(module);
  const instance = new Component();
  instance.setAttribute('logo-text', 'MyApp');
  const vnode = instance.render() as VNode;
  assertStringIncludes(vnodeText(vnode), 'MyApp');
  assertEquals(vnode.props.part, 'container');
  assertExists(findByPart(vnode, 'logo'));
});

Deno.test('open-nav-linear: nav-links JSON renders navigation links', async () => {
  const { OpenNavLinear } = await import('../src/open-nav-linear.tsx');
  const instance = new OpenNavLinear();
  instance.setAttribute(
    'nav-links',
    JSON.stringify([
      { label: 'Guide', href: '/guide' },
      { label: 'API', href: '/api' },
    ]),
  );
  const vnode = instance.render() as VNode;
  assertStringIncludes(vnodeText(vnode), 'Guide');
  assertStringIncludes(vnodeText(vnode), 'API');
  const links = findByPart(vnode, 'links') as VNode;
  assertExists(links);
});

Deno.test('open-nav-linear: current-path marks active link with aria-current=page', async () => {
  const { OpenNavLinear } = await import('../src/open-nav-linear.tsx');
  const instance = new OpenNavLinear();
  instance.setAttribute('current-path', '/guide');
  instance.setAttribute(
    'nav-links',
    JSON.stringify([
      { label: 'Guide', href: '/guide' },
      { label: 'API', href: '/api' },
    ]),
  );
  const vnode = instance.render() as VNode;
  const links = findByPart(vnode, 'links') as VNode;

  const linkNodes = links.children.filter((c): c is VNode => isVNodeObject(c) && c.tag === 'a');
  assertEquals(linkNodes.length, 2);
  assertEquals(linkNodes[0].props['aria-current'], 'page');
  assertEquals(linkNodes[1].props['aria-current'], undefined);
});

Deno.test('open-nav-linear: renders GitHub and Get started CTA buttons', async () => {
  const { OpenNavLinear } = await import('../src/open-nav-linear.tsx');
  const instance = new OpenNavLinear();
  instance.setAttribute('github-url', 'https://github.com/test/repo');
  const vnode = instance.render() as VNode;

  const github = findByPart(vnode, 'github') as VNode;
  assertExists(github);
  assertStringIncludes(vnodeText(github), 'GitHub');
  assertEquals(github.props.href, 'https://github.com/test/repo');

  const cta = findByPart(vnode, 'cta') as VNode;
  assertExists(cta);
  assertStringIncludes(vnodeText(cta), 'Get started');
  assertEquals(cta.props.href, '/docs');
});

// ─── open-badge-linear ──────────────────────────────────────────────────────

Deno.test('open-badge-linear: exports tagName and class', async () => {
  const mod = await import('../src/open-badge-linear.tsx');
  assertEquals(mod.tagName, 'open-badge-linear');
  assertEquals(typeof mod.OpenBadgeLinear, 'function');
});

Deno.test('open-badge-linear: has correct tagName and renders slot content', async () => {
  const module = asComponentModule(await import('../src/open-badge-linear.tsx'));
  assertEquals(module.tagName, 'open-badge-linear');

  const Component = exportedConstructor(module);
  const instance = new Component();
  const vnode = instance.render() as VNode;
  assertEquals(vnode.tag, 'span');
  assertEquals(vnode.props.part, 'badge');
  assertExists(vnode.children.find((c) => isVNodeObject(c) && c.tag === 'slot'));
});

Deno.test('open-badge-linear: variant attribute reflects', async () => {
  const { OpenBadgeLinear } = await import('../src/open-badge-linear.tsx');
  const instance = new OpenBadgeLinear();

  // default
  let vnode = instance.render() as VNode;
  assertStringIncludes(classNameOf(vnode), 'badge--default');

  for (const variant of ['success', 'error', 'warning', 'info', 'new'] as const) {
    instance.setAttribute('variant', variant);
    vnode = instance.render() as VNode;
    assertStringIncludes(classNameOf(vnode), `badge--${variant}`);
  }
});

Deno.test('open-hero-ping: fetch updates state', async () => {
  const module = await import('../src/open-hero-ping.tsx');
  const HeroPing = module.default as new () => RenderableElement & {
    apiUrl: string;
    _fetch: () => Promise<void>;
    _state: string;
  };
  const instance = new HeroPing();
  instance.apiUrl = 'https://demo.openelement.org/api';

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({ framework: 'deno', version: '1.0', timestamp: '2024-01-01T12:34:56Z' }),
          { status: 200 },
        ),
      );
    await instance._fetch();
    assertEquals(instance._state, 'ok');
  } finally {
    globalThis.fetch = originalFetch;
  }
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
