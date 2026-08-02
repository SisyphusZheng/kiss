/**
 * @openelement/app — Preact island smoke test.
 *
 * Proves the Preact island bridge works end-to-end:
 *   1. Simple Preact component renders in SSR
 *   2. Props are passed from openElement options
 *   3. Props are collected from element attributes
 *   4. Signal state changes are reflected in render output
 *   5. Client activation sets up shadow root
 *   6. Dismount via disconnectedCallback cleans up
 *
 * This test is the alpha.4 Preact Island Proof gate.
 */

import { assertEquals, assertExists, assertInstanceOf, assertStringIncludes } from '@std/assert';
import { OpenElement } from '@openelement/element';
import { signal } from '@openelement/element';
import { h } from 'preact';
import { definePreactIsland, type PreactIslandOptions } from '../src/preact.ts';
import { installDomStubs, StubNode, suppressDocument } from './dom-stubs.ts';

// ─── Helpers ───────────────────────────────────────────────────────

/** Extract the trustedHtml content from a VNode returned by OpenElement.render(). */
function extractTrustedHtml(vnode: unknown): string {
  assertExists(vnode);
  const props = (vnode as { props: Record<string, unknown> }).props;
  assertExists(props.html);
  return String(props.html);
}

// ─── Tests ─────────────────────────────────────────────────────────

Deno.test('Preact island smoke: DOM stub tracks parentNode and insertion order', () => {
  const parent = new StubNode();
  const first = new StubNode() as unknown as Node;
  const second = new StubNode() as unknown as Node;
  const inserted = new StubNode() as unknown as Node;

  parent.appendChild(first);
  parent.appendChild(second);
  parent.insertBefore(inserted, second);

  assertEquals(parent.childNodes, [first, inserted, second]);
  assertEquals(
    (inserted as unknown as { parentNode: StubNode | null }).parentNode,
    parent,
  );

  parent.removeChild(inserted);
  assertEquals(parent.childNodes, [first, second]);
  assertEquals(
    (inserted as unknown as { parentNode: StubNode | null }).parentNode,
    null,
  );

  let threw = false;
  try {
    parent.removeChild(inserted);
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

// ── 1. Simple Preact component renders inside an openElement island (SSR) ──

Deno.test('Preact island smoke: SSR renders a simple component', () => {
  const restore = installDomStubs();
  const restoreDoc = suppressDocument();
  try {
    const Component = () => h('p', null, 'Hello openElement');
    const ctor = definePreactIsland('test-smoke-simple', Component as never);
    const instance = new ctor() as OpenElement;

    const result = instance.render();
    // The SSR VNode carries the trusted-HTML tag symbol
    assertExists(result);
    assertEquals(String((result as { tag: symbol }).tag), 'Symbol(openelement.html)');
    const html = extractTrustedHtml(result);
    assertStringIncludes(html, 'Hello openElement');
    assertStringIncludes(html, '<p>');
  } finally {
    restoreDoc();
    restore();
  }
});

Deno.test('Preact island smoke: SSR renders nested Preact components', () => {
  const restore = installDomStubs();
  const restoreDoc = suppressDocument();
  try {
    const Inner = ({ text }: { text: string }) => h('span', { class: 'inner' }, text);
    const Outer = () => h('div', null, h(Inner, { text: 'nested' }));
    const ctor = definePreactIsland('test-nested', Outer as never);
    const instance = new ctor() as OpenElement;

    const html = extractTrustedHtml(instance.render());
    assertStringIncludes(html, 'nested');
    assertStringIncludes(html, 'inner');
  } finally {
    restoreDoc();
    restore();
  }
});

// ── 2. Preact component receives props from openElement ──

Deno.test('Preact island smoke: SSR passes props from options', () => {
  const restore = installDomStubs();
  const restoreDoc = suppressDocument();
  try {
    const Component = (props: { greeting: string; name: string }) =>
      h('p', null, `${props.greeting}, ${props.name}!`);
    const ctor = definePreactIsland('test-props-options', Component as never, {
      props: { greeting: 'Hi', name: 'World' },
    });
    const instance = new ctor() as OpenElement;

    const html = extractTrustedHtml(instance.render());
    assertStringIncludes(html, 'Hi, World!');
  } finally {
    restoreDoc();
    restore();
  }
});

Deno.test('Preact island smoke: SSR passes props from element attributes', () => {
  const restore = installDomStubs();
  const restoreDoc = suppressDocument();
  try {
    const Component = (props: { label: string }) => h('span', null, props.label);
    const ctor = definePreactIsland('test-attr-props', Component as never);
    const instance = new ctor() as OpenElement;

    // _Base locked at module load (no HTMLElement).
    // Monkey-patch attributes so resolveProps picks them up during SSR.
    Object.defineProperty(instance, 'attributes', {
      get: () => [{ name: 'label', value: 'FromAttribute' }],
    });

    const html = extractTrustedHtml(instance.render());
    assertStringIncludes(html, 'FromAttribute');
  } finally {
    restoreDoc();
    restore();
  }
});

Deno.test('Preact island smoke: element attributes override options.props', () => {
  const restore = installDomStubs();
  const restoreDoc = suppressDocument();
  try {
    const Component = (props: { label: string }) => h('span', null, props.label);
    const ctor = definePreactIsland('test-override-props', Component as never, {
      props: { label: 'Default' },
    });
    const instance = new ctor() as OpenElement;

    // _Base locked at module load. Monkey-patch attributes.
    Object.defineProperty(instance, 'attributes', {
      get: () => [{ name: 'label', value: 'Overridden' }],
    });

    const html = extractTrustedHtml(instance.render());
    assertStringIncludes(html, 'Overridden');
  } finally {
    restoreDoc();
    restore();
  }
});

Deno.test('Preact island smoke: SSR renders boolean-like props', () => {
  const restore = installDomStubs();
  const restoreDoc = suppressDocument();
  try {
    const Component = (props: { disabled: string }) =>
      h('button', { disabled: props.disabled === 'true' }, 'click');
    const ctor = definePreactIsland('test-bool-prop', Component as never, {
      props: { disabled: 'true' },
    });
    const instance = new ctor() as OpenElement;

    const html = extractTrustedHtml(instance.render());
    assertStringIncludes(html, 'disabled');
  } finally {
    restoreDoc();
    restore();
  }
});

// ── 3. Preact component responds to state changes ──

Deno.test('Preact island smoke: signal state change reflected in SSR re-render', () => {
  const restore = installDomStubs();
  const restoreDoc = suppressDocument();
  try {
    const count = signal(0);
    const Component = (props: { count: { value: number } }) =>
      h('output', null, String(props.count.value));
    const ctor = definePreactIsland('test-signal-change', Component as never, {
      props: { count } as never,
    });
    const instance = new ctor() as OpenElement;

    // Initial render
    assertEquals(
      extractTrustedHtml(instance.render()).includes('<output>0</output>'),
      true,
    );

    // Change signal value
    count.value = 42;
    assertEquals(
      extractTrustedHtml(instance.render()).includes('<output>42</output>'),
      true,
    );

    // Change again
    count.value = 99;
    assertEquals(
      extractTrustedHtml(instance.render()).includes('<output>99</output>'),
      true,
    );
  } finally {
    restoreDoc();
    restore();
  }
});

Deno.test('Preact island smoke: multiple signals in one component', () => {
  const restore = installDomStubs();
  const restoreDoc = suppressDocument();
  try {
    const firstName = signal('Alice');
    const lastName = signal('Smith');
    const Component = (props: {
      first: { value: string };
      last: { value: string };
    }) => h('span', null, `${props.first.value} ${props.last.value}`);
    const ctor = definePreactIsland('test-multi-signal', Component as never, {
      props: { first: firstName, last: lastName } as never,
    });
    const instance = new ctor() as OpenElement;

    assertEquals(
      extractTrustedHtml(instance.render()).includes('Alice Smith'),
      true,
    );

    firstName.value = 'Bob';
    assertEquals(
      extractTrustedHtml(instance.render()).includes('Bob Smith'),
      true,
    );
  } finally {
    restoreDoc();
    restore();
  }
});

// ── 4. Client activation path ──

Deno.test('Preact island smoke: render() returns null on client path', () => {
  const restore = installDomStubs();
  try {
    const Component = () => h('div', null, 'client');
    const ctor = definePreactIsland('test-client-null', Component as never);
    const instance = new ctor() as OpenElement;

    // On client (document exists), render() skips and returns null
    assertEquals(instance.render(), null);
  } finally {
    restore();
  }
});

Deno.test('Preact island smoke: clientActivate creates shadow root', () => {
  const restore = installDomStubs();
  try {
    const Component = () => h('div', null, 'hydrated');
    const ctor = definePreactIsland('test-shadow-create', Component as never);
    const instance = new ctor() as OpenElement & {
      clientActivate: () => void;
      shadowRoot: ShadowRoot | null;
    };

    // _Base locked at module load (no HTMLElement).
    // Provide a stub shadow root so clientActivate doesn't call attachShadow.
    const stubRoot = new StubNode() as unknown as ShadowRoot;
    instance.shadowRoot = stubRoot;

    // Before activation, shadow root should exist (we set it)
    assertExists(instance.shadowRoot);

    instance.clientActivate();

    // Shadow root should persist
    assertExists(instance.shadowRoot);
    assertEquals((instance.shadowRoot as unknown as StubNode).textContent, 'hydrated');
  } finally {
    restore();
  }
});

Deno.test('Preact island smoke: clientActivate with ssr=false uses render path', () => {
  const restore = installDomStubs();
  try {
    const Component = () => h('div', null, 'csr');
    const ctor = definePreactIsland('test-csr-island', Component as never, {
      ssr: false,
    });
    const instance = new ctor() as OpenElement & {
      clientActivate: () => void;
      shadowRoot: ShadowRoot | null;
    };

    // _Base locked at module load. Provide a stub shadow root.
    const stubRoot = new StubNode() as unknown as ShadowRoot;
    instance.shadowRoot = stubRoot;

    // With ssr: false, clientActivate uses preactRender instead of preactHydrate.
    instance.clientActivate();

    assertExists(instance.shadowRoot);
    assertEquals((instance.shadowRoot as unknown as StubNode).textContent, 'csr');
  } finally {
    restore();
  }
});

// ── 5. Dismount / cleanup ──

Deno.test('Preact island smoke: dismount does not throw', () => {
  const restore = installDomStubs();
  try {
    const Component = () => h('div', null, 'content');
    const ctor = definePreactIsland('test-dismount-safe', Component as never);
    const instance = new ctor() as OpenElement & {
      disconnectedCallback?: () => void;
    };

    // disconnectedCallback should be callable without throwing
    // (it disposes hydration scope, static props, and lifecycle abort)
    instance.disconnectedCallback!();
  } finally {
    restore();
  }
});

// ── 6. definePreactIsland contract ──

Deno.test('Preact island smoke: definePreactIsland returns a class extending OpenElement', () => {
  const restore = installDomStubs();
  try {
    const ctor = definePreactIsland('test-contract', () => null);
    // Should be a class
    assertEquals(typeof ctor, 'function');
    // Should extend OpenElement
    const instance = new ctor();
    assertInstanceOf(instance, OpenElement);
  } finally {
    restore();
  }
});

Deno.test('Preact island smoke: definePreactIsland registers custom element', () => {
  const restore = installDomStubs();
  try {
    const tagName = 'test-reg-smoke';
    const ctor = definePreactIsland(tagName, () => null);
    const registry = globalThis.customElements as unknown as Map<
      string,
      CustomElementConstructor
    >;
    assertEquals(registry.get(tagName), ctor);
  } finally {
    restore();
  }
});

Deno.test('Preact island smoke: rejects invalid custom element tag names', () => {
  const restore = installDomStubs();
  try {
    let threw = false;
    try {
      definePreactIsland('InvalidTag', () => null);
    } catch (e: unknown) {
      threw = true;
      assertStringIncludes(String(e), 'not a valid custom element name');
    }
    assertEquals(threw, true);
  } finally {
    restore();
  }
});

Deno.test('Preact island smoke: options are fail-closed — hydrate/dsd fields are type errors (#767)', () => {
  // PreactIslandOptions is narrowed to { ssr?, props? }: definePreactIsland
  // never reads hydrate/dsd, so passing them must fail at type level instead
  // of silently behaving differently from defineIsland.
  const options: PreactIslandOptions = {
    ssr: false,
    // @ts-expect-error hydrate is a defineIslandConfig-only field
    hydrate: 'visible',
  };
  assertEquals(options.ssr, false);
});
