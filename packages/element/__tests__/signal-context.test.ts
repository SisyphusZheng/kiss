/**
 * @openelement/element — signal-context tree-walk regression tests.
 *
 * Self-contained fake DOM: enough of parentNode / getRootNode / ShadowRoot to
 * exercise findProvidedSignal's cross-shadow-boundary walk without a browser.
 */

import { assertEquals } from '@std/assert';
import {
  consumeContext,
  createContext,
  provideContext,
} from '../src/internal/core/signal-context.ts';

// signal-context references the global `ShadowRoot` for `instanceof`, so tests
// install a minimal stand-in while they run under Deno (no DOM globals) and
// restore the previous global afterwards (#845) — a module-top-level stub would
// leak into every other test file sharing the process.
class FakeShadowRoot {
  constructor(public host: FakeNode) {}
  getRootNode(): FakeNode | FakeShadowRoot {
    return this;
  }
}

function withShadowRootStub(fn: () => void): void {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'ShadowRoot');
  Object.defineProperty(globalThis, 'ShadowRoot', {
    configurable: true,
    writable: true,
    value: FakeShadowRoot,
  });
  try {
    fn();
  } finally {
    if (previous) {
      Object.defineProperty(globalThis, 'ShadowRoot', previous);
    } else {
      Reflect.deleteProperty(globalThis, 'ShadowRoot');
    }
  }
}

class FakeNode {
  parentNode: FakeNode | FakeShadowRoot | null = null;
  #shadow: FakeShadowRoot | null = null;

  attachShadow(): FakeShadowRoot {
    this.#shadow = new FakeShadowRoot(this);
    return this.#shadow;
  }

  getRootNode(): FakeNode | FakeShadowRoot {
    let node: FakeNode | FakeShadowRoot | null = this.parentNode;
    while (node instanceof FakeNode && node.parentNode) {
      if (node.parentNode instanceof FakeShadowRoot) return node.parentNode;
      node = node.parentNode;
    }
    return node ?? this;
  }
}

function link(child: FakeNode, parent: FakeNode | FakeShadowRoot): FakeNode {
  child.parentNode = parent;
  return child;
}

Deno.test('signal-context: provider in outer tree is found from inside a shadow root', () => {
  withShadowRootStub(() => {
    const outer = new FakeNode();
    const shadowHost = link(new FakeNode(), outer);
    const shadow = shadowHost.attachShadow();
    const innerChild = link(new FakeNode(), shadow);

    const ctx = createContext<number>(Symbol('count'), 0);
    provideContext(outer as unknown as HTMLElement, ctx, 42);

    const signal = consumeContext(ctx, innerChild as unknown as HTMLElement);
    assertEquals(signal.value, 42);
  });
});

Deno.test('signal-context: unprovided context inside a shadow root returns default without hanging', () => {
  withShadowRootStub(() => {
    const outer = new FakeNode();
    const shadowHost = link(new FakeNode(), outer);
    const shadow = shadowHost.attachShadow();
    const innerChild = link(new FakeNode(), shadow);

    const ctx = createContext<string>(Symbol('name'), 'fallback');
    const signal = consumeContext(ctx, innerChild as unknown as HTMLElement);
    assertEquals(signal.value, 'fallback');
  });
});

Deno.test('signal-context: nested shadow boundaries are crossed exactly once', () => {
  withShadowRootStub(() => {
    const root = new FakeNode();
    const level1Host = link(new FakeNode(), root);
    const level1Shadow = level1Host.attachShadow();
    const level2Host = link(new FakeNode(), level1Shadow);
    const level2Shadow = level2Host.attachShadow();
    const leaf = link(new FakeNode(), level2Shadow);

    const ctx = createContext<boolean>(Symbol('flag'), false);
    provideContext(root as unknown as HTMLElement, ctx, true);

    const signal = consumeContext(ctx, leaf as unknown as HTMLElement);
    assertEquals(signal.value, true);
  });
});

Deno.test('signal-context: defaults are isolated by Context identity even when keys match', () => {
  const key = Symbol('shared');
  const first = createContext(key, 'first');
  const second = createContext(key, 'second');

  consumeContext(first).value = 'changed';

  assertEquals(consumeContext(first).value, 'changed');
  assertEquals(consumeContext(second).value, 'second');
});
