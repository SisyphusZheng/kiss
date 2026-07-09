/**
 * @openelement/element/open-element-hydration — DSD hydration adapter.
 *
 * Thin adapter over HydrationScope. Pins the contract without a
 * real DOM: hydrateExistingDom() early-returns without a shadow root and
 * otherwise resets the scope and forwards to hydrateSignals (setCachedVNode
 * + hydrate). Uses a fake scope/element stand-in matching OpenElementLike.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { hydrateExistingDom } from '../src/open-element-hydration.ts';
import type { OpenElementLike } from '../src/open-element-render.ts';

class FakeScope {
  resetCount = 0;
  cached: unknown = '__unset__';
  hydrateRoots: unknown[] = [];

  reset(): void {
    this.resetCount++;
  }
  setCachedVNode(vnode: unknown): void {
    this.cached = vnode;
  }
  hydrate(shadowRoot: ShadowRoot): void {
    this.hydrateRoots.push(shadowRoot);
  }
}

class FakeShadowRoot {
  host: unknown = null;
}

class FakeElement implements OpenElementLike {
  shadowRoot: ShadowRoot | null = null;
  signalRegistry = new Map<string, never>();
  tagName = 'x-test';
  renderCalls = 0;

  render(): unknown {
    this.renderCalls++;
    return null;
  }
  createRenderRoot(): void {
    this.shadowRoot = new FakeShadowRoot() as unknown as ShadowRoot;
  }
}

Deno.test('hydrateExistingDom returns early without a shadow root', () => {
  const scope = new FakeScope();
  const el = new FakeElement();
  el.shadowRoot = null;

  hydrateExistingDom(el as unknown as OpenElementLike, scope as unknown as never);

  assertEquals(scope.resetCount, 0, 'scope untouched when no shadow root');
  assertEquals(scope.hydrateRoots.length, 0);
});

Deno.test('hydrateExistingDom resets and hydrates the shadow root', () => {
  const scope = new FakeScope();
  const el = new FakeElement();
  const root = new FakeShadowRoot() as unknown as ShadowRoot;
  el.shadowRoot = root;

  hydrateExistingDom(el as unknown as OpenElementLike, scope as unknown as never);

  assertEquals(scope.resetCount, 1, 'scope.reset called once');
  assertEquals(el.renderCalls, 1, 'instance.render() called to cache the VNode');
  assertEquals(scope.cached, null, 'null VNode cached');
  assertEquals(scope.hydrateRoots.length, 1, 'scope.hydrate called with the shadow root');
  assertEquals(scope.hydrateRoots[0], root);
});
