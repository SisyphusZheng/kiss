/**
 * @openelement/element/open-element-render — CSR render-path adapters.
 *
 * These are thin adapters over HydrationScope + renderToDom. The DOM-mount
 * branch (result != null) is covered end-to-end by open-element.test.ts via the
 * OpenElement lifecycle. Here we pin the control flow that does NOT require a
 * real DOM: scope reset, cached-VNode bookkeeping, and target clearing, using
 * fake scope/element stand-ins (matching the OpenElementLike structural type).
 */

import { assertEquals, assertThrows } from '@std/assert';
import {
  type OpenElementLike,
  renderErrorFallback,
  renderIntoLightDom,
  renderIntoShadowRoot,
} from '../src/open-element-render.ts';
import { FakeScope } from './fake-scope.ts';
import type { VNode } from '@openelement/element';

class FakeShadowRoot {
  firstChild: unknown = null;
  removeCount = 0;
  removeChild(_node: unknown): void {
    this.removeCount++;
    this.firstChild = null;
  }
  replaceChildren(): void {
    this.removeCount++;
    this.firstChild = null;
  }
}

class FakeElement implements OpenElementLike {
  static renderMode: 'shadow' | 'light' = 'shadow';
  shadowRoot: ShadowRoot | null = null;
  signalRegistry = new Map<string, never>();
  tagName = 'x-test';
  renderMode: 'shadow' | 'light' = 'shadow';
  renderCalls = 0;
  appendCount = 0;
  createdRoot = false;
  firstChild: unknown = null;

  render(): VNode | null {
    this.renderCalls++;
    return null;
  }
  createRenderRoot(): void {
    this.createdRoot = true;
    this.shadowRoot = new FakeShadowRoot() as unknown as ShadowRoot;
  }
  removeChild(_node: unknown): void {
    this.firstChild = null;
  }
  replaceChildren(): void {
    this.firstChild = null;
  }
  appendChild(_node: unknown): void {
    this.appendCount++;
  }
}

Deno.test('renderIntoShadowRoot resets scope and clears target when render is null', () => {
  const scope = new FakeScope();
  const el = new FakeElement();
  el.shadowRoot = new FakeShadowRoot() as unknown as ShadowRoot;
  (el.shadowRoot as unknown as FakeShadowRoot).firstChild = { marker: 1 };

  renderIntoShadowRoot(el as unknown as OpenElementLike, scope as unknown as never);

  assertEquals(scope.resetCount, 1, 'scope.reset called once');
  assertEquals(scope.cached, null, 'null VNode cached');
  assertEquals((el.shadowRoot as unknown as FakeShadowRoot).removeCount, 1, 'target cleared');
  assertEquals(el.appendCount, 0, 'no DOM mounted when null');
});

Deno.test('renderIntoShadowRoot returns early without a shadow root', () => {
  const scope = new FakeScope();
  const el = new FakeElement();
  el.shadowRoot = null;

  renderIntoShadowRoot(el as unknown as OpenElementLike, scope as unknown as never);

  assertEquals(scope.resetCount, 0, 'scope untouched when no shadow root');
});

Deno.test('renderIntoLightDom clears itself and resets scope when render is null', () => {
  const scope = new FakeScope();
  const el = new FakeElement();
  el.firstChild = { marker: 1 };

  renderIntoLightDom(el as unknown as OpenElementLike, scope as unknown as never);

  assertEquals(scope.resetCount, 1);
  assertEquals(scope.cached, null);
  assertEquals(el.firstChild, null, 'light DOM cleared');
  assertEquals(el.appendCount, 0, 'no DOM mounted when null');
});

class ThrowingElement extends FakeElement {
  override render(): VNode | null {
    throw new Error('render boom');
  }
}

// The CSR helpers must propagate render errors to their caller — never
// swallow them into an empty text node (#662). The OpenElement render paths
// (_renderOrHydrate / update()) own the catch and route to onRenderError,
// mirroring the SSR render-ir.ts log-and-rethrow contract.
Deno.test('renderIntoShadowRoot rethrows render errors to the caller', () => {
  const scope = new FakeScope();
  const el = new ThrowingElement();
  el.shadowRoot = new FakeShadowRoot() as unknown as ShadowRoot;

  assertThrows(
    () => renderIntoShadowRoot(el as unknown as OpenElementLike, scope as unknown as never),
    Error,
    'render boom',
  );
});

Deno.test('renderIntoLightDom rethrows render errors to the caller', () => {
  const scope = new FakeScope();
  const el = new ThrowingElement();

  assertThrows(
    () => renderIntoLightDom(el as unknown as OpenElementLike, scope as unknown as never),
    Error,
    'render boom',
  );
});

Deno.test('renderErrorFallback creates a render root when absent and not light', () => {
  const scope = new FakeScope();
  const el = new FakeElement();
  el.shadowRoot = null;
  el.renderMode = 'shadow';

  const fallback: VNode | null = null;
  renderErrorFallback(
    el as unknown as OpenElementLike,
    new Error('boom'),
    scope as unknown as never,
    () => fallback,
  );

  assertEquals(el.createdRoot, true, 'createRenderRoot called when no shadow root');
  assertEquals(scope.resetCount, 1, 'scope reset after fallback computed');
});

Deno.test('renderErrorFallback does not recreate root for light-dom components', () => {
  const prevRenderMode = FakeElement.renderMode;
  FakeElement.renderMode = 'light';
  try {
    const scope = new FakeScope();
    const el = new FakeElement();
    el.shadowRoot = null;

    renderErrorFallback(
      el as unknown as OpenElementLike,
      new Error('boom'),
      scope as unknown as never,
      () => null,
    );

    assertEquals(el.createdRoot, false, 'light-dom uses the element itself, no root created');
    assertEquals(scope.resetCount, 1);
  } finally {
    FakeElement.renderMode = prevRenderMode;
  }
});
