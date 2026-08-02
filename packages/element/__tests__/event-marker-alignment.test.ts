/**
 * SSR/hydration event-marker alignment tests (defect B1).
 *
 * Pins the deterministic contract between the SSR renderer (render-ir) and the
 * hydration collector (event-hydration):
 *   - Registered custom element hosts with event props consume a `data-eid`
 *     during SSR, matching the count hydration performs for the same vnode.
 *   - `<Show>`/`<For>` serialize their resolved branch state as
 *     `<!--oe-branch:...-->` comments so hydration can detect signal drift.
 *
 * These tests run without a DOM: renderToNode only needs a `customElements`
 * registry lookup, which is stubbed per test and restored afterwards.
 */

import { assertEquals, assertStringIncludes } from '@std/assert';
import { renderDsdTree } from '../src/internal/core/render-ir.ts';
import { collectEventBindings } from '../src/internal/core/event-hydration.ts';
import { forBranchMarker } from '../src/internal/core/event-marker.ts';
import { FOR_TAG, SHOW_TAG } from '../src/internal/core/jsx-runtime.ts';
import type { VNode } from '../src/internal/protocol/vnode.ts';
import { signal } from '../src/internal/signal/index.ts';

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

function show(when: unknown, truthy: VNode, falsy?: VNode): VNode {
  return {
    tag: SHOW_TAG,
    props: { when },
    children: falsy ? [truthy, falsy] : [truthy],
  };
}

function forEach(each: unknown, renderFn: (item: unknown, index: number) => VNode): VNode {
  return {
    tag: FOR_TAG,
    props: { each },
    children: [renderFn],
  };
}

// ─── CE host event markers ───────────────────────────────────────

Deno.test('SSR emits data-eid on registered custom element hosts with event props', async () => {
  class FakeCard {
    render(): VNode {
      return { tag: 'span', props: {}, children: ['card'] };
    }
  }
  const registry: StubbedRegistry = new Map([['x-fake-card', FakeCard]]);

  const onFirst = () => {};
  const onHost = () => {};
  const onLast = () => {};
  const vnode: VNode = {
    tag: 'div',
    props: {},
    children: [
      { tag: 'button', props: { onClick: onFirst }, children: ['first'] },
      { tag: 'x-fake-card', props: { onClick: onHost }, children: ['light'] },
      { tag: 'button', props: { onClick: onLast }, children: ['last'] },
    ],
  };

  const html = await withCustomElementsRegistry(registry, () => renderDsdTree(vnode));

  // Children-first ordering: first button e0, host e1, last button e2.
  assertStringIncludes(html, '<button data-eid="e0">first</button>');
  assertStringIncludes(html, '<x-fake-card data-eid="e1"');
  assertStringIncludes(html, '<button data-eid="e2">last</button>');

  // Hydration assigns the same ids to the same handlers.
  const bindings = collectEventBindings(vnode);
  assertEquals([...bindings.keys()], ['e0', 'e1', 'e2']);
  assertEquals(bindings.get('e0')?.[0].handler, onFirst);
  assertEquals(bindings.get('e1')?.[0].handler, onHost);
  assertEquals(bindings.get('e2')?.[0].handler, onLast);
});

Deno.test('SSR does not emit data-eid on custom element hosts without event props', async () => {
  class FakeCard {
    render(): VNode {
      return { tag: 'span', props: {}, children: ['card'] };
    }
  }
  const registry: StubbedRegistry = new Map([['x-plain-card', FakeCard]]);

  const vnode: VNode = {
    tag: 'div',
    props: {},
    children: [
      { tag: 'x-plain-card', props: {}, children: [] },
      { tag: 'button', props: { onClick: () => {} }, children: ['go'] },
    ],
  };

  const html = await withCustomElementsRegistry(registry, () => renderDsdTree(vnode));

  assertStringIncludes(html, '<x-plain-card>');
  assertStringIncludes(html, '<button data-eid="e0">go</button>');
  assertEquals([...collectEventBindings(vnode).keys()], ['e0']);
});

// ─── Show/For branch-state markers ───────────────────────────────

Deno.test('SSR serializes Show branch state and hydration recomputes the same token', async () => {
  const when = signal(true);
  const vnode = show(
    when,
    { tag: 'button', props: { onClick: () => {} }, children: ['yes'] },
    { tag: 'span', props: { onClick: () => {} }, children: ['no'] },
  );

  const html = await renderDsdTree(vnode);
  assertStringIncludes(html, '<!--oe-branch:show:1-->');
  assertStringIncludes(html, '<button data-eid="e0">yes</button>');

  const aligned: string[] = [];
  collectEventBindings(vnode, aligned);
  assertEquals(aligned, ['oe-branch:show:1']);

  // A signal flip between SSR and hydration changes the token sequence,
  // which HydrationScope uses to detect the drift and degrade safely.
  when.value = false;
  const drifted: string[] = [];
  collectEventBindings(vnode, drifted);
  assertEquals(drifted, ['oe-branch:show:0']);
});

Deno.test('SSR serializes For item identity and hydration recomputes the same token', async () => {
  const items = signal([1, 2]);
  const vnode = forEach(items, (item) => ({
    tag: 'button',
    props: { onClick: () => {} },
    children: [String(item)],
  }));

  const expectedToken = forBranchMarker([1, 2]);
  const html = await renderDsdTree(vnode);
  assertStringIncludes(html, `<!--${expectedToken}-->`);

  const aligned: string[] = [];
  const bindings = collectEventBindings(vnode, aligned);
  assertEquals(aligned, [expectedToken]);
  assertEquals([...bindings.keys()], ['e0', 'e1']);

  items.value = [1, 2, 3];
  const drifted: string[] = [];
  collectEventBindings(vnode, drifted);
  assertEquals(drifted, [forBranchMarker([1, 2, 3])]);

  // The token is content-sensitive: same-length replacement or reordering
  // also diverges it, so hydration degrades instead of mis-binding handlers.
  assertEquals(forBranchMarker([1, 2]) !== forBranchMarker([1, 3]), true);
  assertEquals(forBranchMarker([1, 2]) !== forBranchMarker([2, 1]), true);
  // Identical content always produces the identical token (SSR/hydration parity).
  assertEquals(forBranchMarker([1, 2]), forBranchMarker([1, 2]));
  assertEquals(
    forBranchMarker([{ id: 'a' }, { id: 'b' }]),
    forBranchMarker([{ id: 'a' }, { id: 'b' }]),
  );
  assertEquals(
    forBranchMarker([{ id: 'a' }]) !== forBranchMarker([{ id: 'b' }]),
    true,
  );
});

Deno.test('For with a non-array each resolves to the empty-branch token on both sides', async () => {
  const vnode = forEach(undefined, (item) => ({
    tag: 'i',
    props: {},
    children: [String(item)],
  }));

  const html = await renderDsdTree(vnode);
  assertStringIncludes(html, '<!--oe-branch:for:-1-->');

  const branches: string[] = [];
  collectEventBindings(vnode, branches);
  assertEquals(branches, ['oe-branch:for:-1']);
});

Deno.test('For item signatures are length-prefixed so separators cannot smuggle segments', () => {
  // Regression: the pre-length-prefix signature joined `${t}:${value};`
  // segments, so a string containing ';string:' could impersonate segment
  // boundaries and make different item lists collide.
  assertEquals(
    forBranchMarker(['a;string:b', 'c']) !== forBranchMarker(['a', 'b;string:c']),
    true,
  );
  // Same-length same-content lists still produce identical tokens.
  assertEquals(
    forBranchMarker(['a;string:b', 'c']),
    forBranchMarker(['a;string:b', 'c']),
  );
});
