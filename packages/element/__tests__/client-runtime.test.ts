import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { hydrateOpenElement } from '../src/internal/core/client-runtime.ts';
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
  return { host, root };
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
