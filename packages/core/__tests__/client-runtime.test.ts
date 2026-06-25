/**
 * @openelement/core — Client runtime tests.
 *
 * Verifies hydrateOpenElement and disposeOpenElement work without
 * importing @openelement/element.
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import { disposeOpenElement, hydrateOpenElement } from '@openelement/core/hydrate';
import type { Signal } from '@openelement/protocol/signal';
import { flushRaf, signal, TestElement, TestShadowRoot, withMockDocument } from './test-utils.ts';

/** Cast TestElement root to ParentNode for runtime functions. */
function asRoot(el: TestElement): ParentNode {
  return el as unknown as ParentNode;
}

// ─── Mock helpers ────────────────────────────────────────────────────

/** Mock CustomElementRegistry */
class TestCustomElementRegistry {
  #defs = new Map<string, CustomElementConstructor>();

  get(name: string): CustomElementConstructor | undefined {
    return this.#defs.get(name);
  }

  define(name: string, ctor: CustomElementConstructor): void {
    this.#defs.set(name, ctor);
  }
}

/**
 * Set up a host element with a DSD template, shadow root, and signal registry.
 * Returns [root, host, span].
 */
function setupHydrationFixture(
  tagName: string,
  signalMap?: Map<string, Signal<unknown>>,
): [TestElement, TestElement, TestElement, TestShadowRoot] {
  const host = new TestElement(tagName);
  const root = new TestElement('div');
  root.appendChild(host);

  const shadow = new TestShadowRoot(host);
  const span = new TestElement('span');
  span.setAttribute('data-signal', 'msg');
  span.textContent = 'hello';
  shadow.appendChild(span);

  Object.defineProperty(host, 'shadowRoot', {
    value: shadow,
    writable: true,
    configurable: true,
  });

  // DSD template (empty after browser parsing)
  const template = new TestElement('template');
  template.setAttribute('shadowrootmode', 'open');
  host.appendChild(template);

  // Mock signalRegistry on host (provided by OpenElement constructor in real code)
  if (signalMap) {
    Object.defineProperty(host, 'signalRegistry', {
      value: signalMap,
      writable: true,
      configurable: true,
    });
  }

  return [root, host, span, shadow];
}

/** Create a signal registry with a single named signal. */
function signalMap(name: string, s: ReturnType<typeof signal>): Map<string, Signal<unknown>> {
  return new Map([[name, s as Signal<unknown>]]);
}

// ─── Tests ───────────────────────────────────────────────────────────

Deno.test('hydrateOpenElement hydrates signal-text marker via DSD template', () =>
  withMockDocument(() => {
    const s = signal('hello');
    const registry = new TestCustomElementRegistry();

    class MyEl {}
    registry.define('my-el', MyEl as unknown as CustomElementConstructor);

    const [root, , span] = setupHydrationFixture('my-el', signalMap('msg', s));
    // Set a different initial textContent so we can verify hydration overwrites it.
    span.textContent = 'BEFORE_HYDRATION';

    const dispose = hydrateOpenElement(asRoot(root), {
      registry: registry as unknown as CustomElementRegistry,
    });
    flushRaf();

    // Hydration should overwrite with signal value
    assertEquals(span.textContent, 'hello');

    s.value = 'world';
    assertEquals(span.textContent, 'world');

    dispose();
    s.value = 'nope';
    assertEquals(span.textContent, 'world');
  }));

Deno.test('disposeOpenElement cleans up signal effects', () =>
  withMockDocument(() => {
    const s = signal('initial');
    const registry = new TestCustomElementRegistry();

    class MyEl {}
    registry.define('my-el', MyEl as unknown as CustomElementConstructor);

    const [root, , span] = setupHydrationFixture('my-el', signalMap('msg', s));
    span.textContent = 'initial';

    hydrateOpenElement(asRoot(root), {
      registry: registry as unknown as CustomElementRegistry,
    });
    flushRaf();

    assertEquals(span.textContent, 'initial');

    disposeOpenElement(asRoot(root));
    s.value = 'updated';
    assertEquals(span.textContent, 'initial');
  }));

Deno.test('non-custom-element nodes are skipped', () =>
  withMockDocument(() => {
    const s = signal('untouched');
    const registry = new TestCustomElementRegistry();
    // Not registering 'div' as a custom element
    const [root, , span] = setupHydrationFixture('div', signalMap('msg', s));
    span.textContent = 'untouched';

    const dispose = hydrateOpenElement(asRoot(root), {
      registry: registry as unknown as CustomElementRegistry,
    });
    flushRaf();

    // Signal binding should NOT have been applied since host is not a custom element
    assertEquals(span.textContent, 'untouched');
    // dispose should be a no-op
    dispose();
  }));

Deno.test('returned dispose function cleans up effects', () =>
  withMockDocument(() => {
    const s = signal('a');
    const registry = new TestCustomElementRegistry();

    class MyEl {}
    registry.define('my-el', MyEl as unknown as CustomElementConstructor);

    const [root, , span] = setupHydrationFixture('my-el', signalMap('msg', s));
    span.textContent = 'a';

    const dispose = hydrateOpenElement(asRoot(root), {
      registry: registry as unknown as CustomElementRegistry,
    });
    flushRaf();

    assertEquals(span.textContent, 'a');

    // Dispose via returned function
    dispose();

    s.value = 'b';
    assertEquals(span.textContent, 'a');
  }));

Deno.test('hydrateOpenElement with no DSD templates returns no-op dispose', () =>
  withMockDocument(() => {
    const registry = new TestCustomElementRegistry();
    const root = new TestElement('div');
    root.appendChild(new TestElement('span'));
    root.appendChild(new TestElement('p'));

    const dispose = hydrateOpenElement(asRoot(root), {
      registry: registry as unknown as CustomElementRegistry,
    });

    // Should not throw
    dispose();
    assert(true);
  }));

Deno.test('hydrateOpenElement uses globalThis.customElements when no registry provided', () =>
  withMockDocument(() => {
    const s = signal('global');
    const mockRegistry = new TestCustomElementRegistry();

    class MyEl {}
    mockRegistry.define('my-el', MyEl as unknown as CustomElementConstructor);

    const saved = (globalThis as unknown as { customElements?: unknown }).customElements;
    Object.defineProperty(globalThis, 'customElements', {
      value: mockRegistry as unknown as CustomElementRegistry,
      writable: true,
      configurable: true,
    });

    try {
      const [root, , span] = setupHydrationFixture('my-el', signalMap('msg', s));
      span.textContent = 'global';

      const dispose = hydrateOpenElement(asRoot(root));
      flushRaf();

      assertEquals(span.textContent, 'global');
      dispose();
    } finally {
      Object.defineProperty(globalThis, 'customElements', {
        value: saved,
        writable: true,
        configurable: true,
      });
    }
  }));
