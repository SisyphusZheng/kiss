/**
 * SSR error-boundary automatic capture tests (ADR-0053 Layer 2, #919).
 *
 * Covers the three SSR shapes:
 *   - a single boundary captures a failing subtree and renders its fallback
 *   - nested boundaries: the inner boundary captures; a failing inner
 *     fallback bubbles to the outer boundary
 *   - without a boundary the #892 bare-tag degradation is unchanged
 *
 * These tests run without a DOM: renderToNode only needs a `customElements`
 * registry stub (same pattern as event-marker-alignment.test.ts).
 */

import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import type { VNode } from '../src/internal/protocol/vnode.ts';
import { jsx } from '../src/jsx-runtime.ts';
import { renderDsdTree } from '../src/internal/core/render-ir.ts';
import { ErrorBoundary } from '../src/error-boundary.ts';
import type { OpenElementError } from '../src/internal/core/errors.ts';

// ─── customElements stub ─────────────────────────────────────────

type StubbedRegistry = Map<string, unknown>;

async function withCustomElementsRegistry<T>(
  registry: StubbedRegistry,
  run: () => Promise<T> | T,
): Promise<T> {
  const had = 'customElements' in globalThis;
  const previous = globalThis.customElements;
  Object.defineProperty(globalThis, 'customElements', {
    configurable: true,
    value: {
      get: (name: string) => registry.get(name),
      define: (name: string, ctor: unknown) => registry.set(name, ctor),
    },
  });
  try {
    // Await inside the try: the registry stub must stay installed for the
    // whole async render, not just until the promise is created.
    return await run();
  } finally {
    if (had) {
      Object.defineProperty(globalThis, 'customElements', { configurable: true, value: previous });
    } else {
      delete (globalThis as { customElements?: unknown }).customElements;
    }
  }
}

// ─── Fixtures ────────────────────────────────────────────────────

class BrokenChild {
  render(): unknown {
    throw new Error('child boom');
  }
}

class SlotBoundary extends ErrorBoundary {
  override render(): VNode | null {
    if (this.hasError) return this.onError(this.error!);
    return jsx('slot', {});
  }
}

class OuterBoundary extends ErrorBoundary {
  override onError(error: OpenElementError): VNode {
    return jsx('p', { children: `outer fallback: ${error.message}` });
  }

  override render(): VNode | null {
    if (this.hasError) return this.onError(this.error!);
    return jsx('slot', {});
  }
}

class InnerBoundary extends ErrorBoundary {
  override onError(error: OpenElementError): VNode {
    return jsx('p', { children: `inner fallback: ${error.message}` });
  }

  override render(): VNode | null {
    if (this.hasError) return this.onError(this.error!);
    return jsx('slot', {});
  }
}

/** Boundary whose fallback itself fails — bubbles to the outer boundary. */
class FragileBoundary extends ErrorBoundary {
  override onError(_error: OpenElementError): VNode {
    throw new Error('fallback boom');
  }

  override render(): VNode | null {
    if (this.hasError) return this.onError(this.error!);
    return jsx('slot', {});
  }
}

/** Boundary whose own shadow output (not light DOM) contains the failure. */
class ShadowSubtreeBoundary extends ErrorBoundary {
  override render(): VNode | null {
    if (this.hasError) return this.onError(this.error!);
    return jsx('div', { children: [jsx('x-broken-child', {})] });
  }
}

// ─── Single boundary ─────────────────────────────────────────────

Deno.test('SSR error boundary captures a failing light-DOM subtree (#919)', async () => {
  const registry: StubbedRegistry = new Map([
    ['x-slot-boundary', SlotBoundary],
    ['x-broken-child', BrokenChild],
  ]);

  const html = await withCustomElementsRegistry(
    registry,
    () =>
      renderDsdTree(jsx('x-slot-boundary', {
        children: [jsx('x-broken-child', { label: 'hi' })],
      })),
  );

  // The boundary renders its fallback in place of the failed subtree...
  assertStringIncludes(html, '<x-slot-boundary');
  assertStringIncludes(html, 'shadowrootmode');
  assertStringIncludes(html, 'error-boundary-fallback');
  assertStringIncludes(html, 'child boom');
  // ...instead of the #892 bare-tag degradation of the child.
  assertEquals(html.includes('<x-broken-child'), false);
});

Deno.test('SSR error boundary captures a failure inside its own shadow output (#919)', async () => {
  const registry: StubbedRegistry = new Map([
    ['x-shadow-boundary', ShadowSubtreeBoundary],
    ['x-broken-child', BrokenChild],
  ]);

  const html = await withCustomElementsRegistry(
    registry,
    () => renderDsdTree(jsx('x-shadow-boundary', {})),
  );

  assertStringIncludes(html, 'error-boundary-fallback');
  assertStringIncludes(html, 'child boom');
  assertEquals(html.includes('<x-broken-child'), false);
});

// ─── Nested boundaries ───────────────────────────────────────────

Deno.test('SSR nested boundaries: the inner boundary captures first (#919)', async () => {
  const registry: StubbedRegistry = new Map([
    ['x-outer-boundary', OuterBoundary],
    ['x-inner-boundary', InnerBoundary],
    ['x-broken-child', BrokenChild],
  ]);

  const html = await withCustomElementsRegistry(
    registry,
    () =>
      renderDsdTree(jsx('x-outer-boundary', {
        children: [jsx('x-inner-boundary', {
          children: [jsx('x-broken-child', {})],
        })],
      })),
  );

  assertStringIncludes(html, 'inner fallback: child boom');
  // The error does not bubble past the inner boundary.
  assertEquals(html.includes('outer fallback'), false);
  assertEquals(html.includes('<x-broken-child'), false);
});

Deno.test('SSR nested boundaries: a failing inner fallback bubbles to the outer boundary (#919)', async () => {
  const registry: StubbedRegistry = new Map([
    ['x-outer-boundary', OuterBoundary],
    ['x-fragile-boundary', FragileBoundary],
    ['x-broken-child', BrokenChild],
  ]);

  const html = await withCustomElementsRegistry(
    registry,
    () =>
      renderDsdTree(jsx('x-outer-boundary', {
        children: [jsx('x-fragile-boundary', {
          children: [jsx('x-broken-child', {})],
        })],
      })),
  );

  // The fragile boundary's fallback threw, so the outer boundary captures.
  assertStringIncludes(html, 'outer fallback');
  assertEquals(html.includes('<x-broken-child'), false);
});

// ─── No boundary: #892 degradation unchanged ─────────────────────

Deno.test('SSR without a boundary keeps the bare-tag-with-props degradation (#892, #919)', async () => {
  const registry: StubbedRegistry = new Map([
    ['x-broken-child', BrokenChild],
  ]);

  const html = await withCustomElementsRegistry(registry, () =>
    renderDsdTree(jsx('div', {
      children: [
        jsx('x-broken-child', { label: 'hi' }),
        jsx('span', { children: 'sibling ok' }),
      ],
    })));

  assertStringIncludes(html, '<x-broken-child label="hi"></x-broken-child>');
  assertStringIncludes(html, '<span>sibling ok</span>');
});

// ─── Control flow is never captured ──────────────────────────────

Deno.test('SSR error boundary does not swallow notFound/redirect control flow (#922, #919)', async () => {
  class NotFoundChild {
    render(): unknown {
      const err = new Error('nope') as unknown as { name: string; status: number };
      err.name = 'OpenElementNotFound';
      err.status = 404;
      throw err;
    }
  }
  const registry: StubbedRegistry = new Map([
    ['x-slot-boundary', SlotBoundary],
    ['x-notfound-child', NotFoundChild],
  ]);

  const err = await assertRejects(() =>
    withCustomElementsRegistry(registry, () =>
      renderDsdTree(jsx('x-slot-boundary', {
        children: [jsx('x-notfound-child', {})],
      })))
  );
  assertEquals((err as { name?: unknown }).name, 'OpenElementNotFound');
});
