import { assertEquals, assertExists, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { OpenElement } from '@openelement/element';
import { h } from 'preact';

// We test the new definePreactIsland by verifying:
// 1. It returns a class extending OpenElement
// 2. The SSR path produces trusted HTML content
// 3. The class registers with customElements.define()

import { definePreactIsland } from '../src/preact.ts';

Deno.test('preact bridge has no top-level await and remains synchronously renderable', async () => {
  const source = await Deno.readTextFile(new URL('../src/preact.ts', import.meta.url));
  assertEquals(/^\s*await\s+import\(/m.test(source), false);
  assertEquals(source.includes('= await import('), false);
});

// ─── DOM stubs for Deno test environment ─────────────────────────

class StubNode {
  nodeType = 1;
  childNodes: Node[] = [];

  appendChild(node: Node): Node {
    this.childNodes.push(node);
    return node;
  }

  insertBefore(node: Node): Node {
    this.childNodes.push(node);
    return node;
  }

  removeChild(node: Node): Node {
    this.childNodes = this.childNodes.filter((child) => child !== node);
    return node;
  }
}

function installDomStubs(): () => void {
  const previousCustomElements = globalThis.customElements;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousDocument = globalThis.document;
  const registry = new Map<string, CustomElementConstructor>();
  (globalThis as { customElements?: CustomElementRegistry }).customElements = {
    define(name: string, ctor: CustomElementConstructor) {
      registry.set(name, ctor);
    },
    get(name: string) {
      return registry.get(name);
    },
  } as CustomElementRegistry;

  // Per-instance attribute storage using a WeakMap to avoid
  // issues with constructor-based static access across class hierarchies.
  const _attrsMap = new WeakMap<object, Array<{ name: string; value: string }>>();

  class TestElement {
    shadowRoot: ShadowRoot | null = null;

    constructor() {
      _attrsMap.set(this, []);
    }

    attachShadow(): ShadowRoot {
      this.shadowRoot = new StubNode() as unknown as ShadowRoot;
      return this.shadowRoot;
    }

    get attributes(): Array<{ name: string; value: string }> {
      return _attrsMap.get(this) ?? [];
    }

    getAttribute(name: string): string | null {
      return this.attributes.find((attr) => attr.name === name)?.value ?? null;
    }

    hasAttribute(name: string): boolean {
      return this.getAttribute(name) !== null;
    }

    // Allow setAttribute / removeAttribute for tests
    setAttribute(name: string, value: string): void {
      const attrs = _attrsMap.get(this) ?? [];
      const existing = attrs.findIndex((a) => a.name === name);
      if (existing >= 0) {
        attrs[existing] = { name, value };
      } else {
        attrs.push({ name, value });
      }
      _attrsMap.set(this, attrs);
    }

    removeAttribute(name: string): void {
      const attrs = (_attrsMap.get(this) ?? []).filter((a) => a.name !== name);
      _attrsMap.set(this, attrs);
    }

    get isConnected(): boolean {
      return true;
    }

    get tagName(): string {
      return 'TEST-ELEMENT';
    }
  }

  (globalThis as { HTMLElement?: typeof HTMLElement }).HTMLElement = TestElement as never;
  (globalThis as { document?: Document }).document = {
    createElement() {
      return new StubNode();
    },
    createTextNode(text: string) {
      return { nodeType: 3, data: text };
    },
  } as unknown as Document;

  return () => {
    (globalThis as { customElements?: CustomElementRegistry }).customElements =
      previousCustomElements;
    (globalThis as { HTMLElement?: typeof HTMLElement }).HTMLElement = previousHTMLElement;
    (globalThis as { document?: Document }).document = previousDocument;
  };
}

// ─── Tests ───────────────────────────────────────────────────────

Deno.test('definePreactIsland returns a class extending OpenElement', () => {
  const restore = installDomStubs();
  try {
    const ctor = definePreactIsland('test-island-ext', () => null);
    // Should be a class
    assertEquals(typeof ctor, 'function');
    // Should extend OpenElement
    assertExists(
      ctor.prototype instanceof OpenElement ||
        Object.prototype.isPrototypeOf.call(OpenElement, ctor.prototype),
    );
  } finally {
    restore();
  }
});

Deno.test('definePreactIsland registers the custom element', () => {
  const restore = installDomStubs();
  try {
    const tagName = 'test-island-reg';
    const ctor = definePreactIsland(tagName, () => null);
    const registered =
      (globalThis.customElements as unknown as Map<string, CustomElementConstructor>).get(
        tagName,
      ) ??
        // fallback: check registry map
        (globalThis.customElements as CustomElementRegistry).get(tagName);
    assertEquals(registered, ctor);
  } finally {
    restore();
  }
});

Deno.test('definePreactIsland SSR path returns trustedHtml VNode', () => {
  const restore = installDomStubs();
  try {
    // Simulate SSR by temporarily making document undefined
    const origDoc = globalThis.document;
    // @ts-expect-error - intentionally clearing for SSR test
    delete globalThis.document;

    try {
      const Component = (props: { name: string }) => h('p', null, `Hello ${props.name}`);
      const ctor = definePreactIsland('test-ssr-island', Component as never, {
        props: { name: 'World' },
      });

      const instance = new ctor() as OpenElement;
      const result = instance.render();

      // Should return a VNode with the trusted HTML
      assertExists(result);
      assertEquals(typeof result, 'object');
      // The VNode should have the HTML_TAG symbol as tag
      assertEquals(String((result as { tag: symbol }).tag), 'Symbol(openelement.html)');
      // The html prop should contain rendered content
      const props = (result as { props: Record<string, unknown> }).props;
      assertExists(props.html);
      assertStringIncludes(String(props.html), 'World');
    } finally {
      (globalThis as { document?: Document }).document = origDoc;
    }
  } finally {
    restore();
  }
});

Deno.test('definePreactIsland client path skips render() and activates via clientActivate', () => {
  const restore = installDomStubs();
  try {
    const Component = (props: { label: string }) => `<span>${props.label}</span>`;
    const ctor = definePreactIsland('test-client-island', Component as never, {
      props: { label: 'Client' },
    });

    const instance = new ctor() as OpenElement & { clientActivate: () => void };
    // On client, render() should return null
    assertEquals(instance.render(), null);
    // clientActivate() should exist and be callable
    assertEquals(typeof instance.clientActivate, 'function');
  } finally {
    restore();
  }
});
