import { assertEquals, assertThrows } from '@std/assert';
import { hydrateOpenElement } from '../src/internal/core/client-runtime.ts';
import { HydrationScope, markSelfHydrated } from '../src/internal/core/hydration-scope.ts';
import { signal } from '../src/internal/signal/index.ts';

function hydrationFixture(marker?: Record<string, unknown>) {
  const shadowRoot = {
    host: undefined as unknown,
    querySelectorAll: (selector: string) => selector === '[data-signal]' && marker ? [marker] : [],
    append: () => {},
  };
  const host = {
    nodeType: 1,
    tagName: 'THIRD-PARTY-HOST',
    childNodes: [] as unknown[],
    shadowRoot: null,
    attachShadow: () => shadowRoot,
  };
  shadowRoot.host = host;
  const template = {
    nodeType: 1,
    tagName: 'TEMPLATE',
    parentElement: host,
    parentNode: host,
    childNodes: [],
    content: { childNodes: [] },
    getAttribute: (name: string) => name === 'shadowrootmode' ? 'open' : null,
  };
  host.childNodes.push(template);
  const root = { childNodes: [host] };
  return { host, root, shadowRoot };
}

/** Marker whose textContent setter counts binding writes. */
function countingMarker(signalName: string) {
  const state = { writes: 0, text: '' };
  const marker = {
    get textContent() {
      return state.text;
    },
    set textContent(value: string) {
      state.writes++;
      state.text = value;
    },
    getAttribute: (name: string) => name === 'data-signal' ? signalName : null,
    hasAttribute: () => false,
  };
  return { marker, state };
}

Deno.test('client runtime upgrades a third-party host before reading its signal registry', () => {
  const marker = {
    textContent: '',
    getAttribute: (name: string) => name === 'data-signal' ? 'count' : null,
    hasAttribute: () => false,
  };
  const { root } = hydrationFixture(marker);
  const calls: string[] = [];
  const count = signal(3);
  const registry = {
    get: () => class {},
    upgrade: (candidate: unknown) => {
      calls.push('upgrade');
      Object.defineProperty(candidate, 'signalRegistry', {
        get() {
          calls.push('registry');
          return new Map([['count', count]]);
        },
      });
    },
  };

  hydrateOpenElement(
    root as unknown as ParentNode,
    { registry: registry as unknown as CustomElementRegistry },
  );

  assertEquals(calls, ['upgrade', 'registry']);
  assertEquals(marker.textContent, '3');
});

Deno.test('client runtime reports a clear custom-element upgrade failure', () => {
  const { root } = hydrationFixture();
  const registry = {
    get: () => class {},
    upgrade: () => {
      throw new Error('registry rejected host');
    },
  };

  assertThrows(
    () =>
      hydrateOpenElement(
        root as unknown as ParentNode,
        { registry: registry as unknown as CustomElementRegistry },
      ),
    Error,
    'Failed to upgrade <third-party-host>: registry rejected host',
  );
});

Deno.test('client runtime does not stack a second scope onto a self-hydrated element', async () => {
  const { marker, state } = countingMarker('count');
  const { root, shadowRoot } = hydrationFixture(marker);
  const count = signal(3);
  const hostReg = new Map([['count', count]]);

  // Simulate an OpenElement: registry.upgrade() runs connectedCallback, which
  // hydrates the shadow root through the element's OWN HydrationScope and
  // marks the element as self-hydrated.
  const ownScope = new HydrationScope({ signalRegistry: hostReg });
  const registry = {
    get: () => class {},
    upgrade: (candidate: unknown) => {
      Object.defineProperty(candidate, 'signalRegistry', { value: hostReg });
      ownScope.hydrate(shadowRoot as unknown as ShadowRoot, hostReg);
      markSelfHydrated(candidate as Element);
    },
  };

  const dispose = hydrateOpenElement(
    root as unknown as ParentNode,
    { registry: registry as unknown as CustomElementRegistry },
  );

  // Exactly one binding wrote to the marker — pre-fix the runtime stacked a
  // second HydrationScope that bound the same marker again.
  assertEquals(state.writes, 1);
  assertEquals(state.text, '3');

  // The runtime disposer must not dispose the element's own scope: the
  // element owns its binding lifecycle (disconnectedCallback).
  dispose();
  count.value = 5;
  await new Promise((resolve) => setTimeout(resolve, 0));
  assertEquals(state.text, '5');
  assertEquals(state.writes, 2);

  ownScope.dispose();
});

Deno.test('client runtime still hydrates and disposes third-party hosts without self-hydration', async () => {
  const { marker, state } = countingMarker('count');
  const { root } = hydrationFixture(marker);
  const count = signal(3);
  const hostReg = new Map([['count', count]]);
  const registry = {
    get: () => class {},
    upgrade: (candidate: unknown) => {
      Object.defineProperty(candidate, 'signalRegistry', { value: hostReg });
    },
  };

  const dispose = hydrateOpenElement(
    root as unknown as ParentNode,
    { registry: registry as unknown as CustomElementRegistry },
  );

  assertEquals(state.writes, 1);
  assertEquals(state.text, '3');

  // The runtime-created scope owns the binding: dispose tears it down.
  dispose();
  count.value = 5;
  await new Promise((resolve) => setTimeout(resolve, 0));
  assertEquals(state.text, '3');
  assertEquals(state.writes, 1);
});
