/**
 * #661 — Chromium DSD layout fix is batched per frame, not per component.
 *
 * HydrationScope.hydrate() queues the layout fix (a forced reflow read of
 * offsetHeight) into a module-wide batch: N hydrated hosts in the same frame
 * schedule exactly one requestAnimationFrame, and the single flush touches
 * every queued host. Uses fake shadow-root/host stand-ins like
 * client-runtime.test.ts — hydrate() with no render fn only needs
 * querySelectorAll() on the shadow root and a host to queue.
 */

import { assertEquals } from '@std/assert';
import { HydrationScope } from '../src/internal/core/hydration-scope.ts';

function fakeHost() {
  const state = { reflows: 0 };
  const host = {
    get offsetHeight() {
      state.reflows++;
      return 0;
    },
  };
  return { host, state };
}

function fakeShadowRoot(host: unknown): ShadowRoot {
  return { host, querySelectorAll: () => [] } as unknown as ShadowRoot;
}

/** Install a counting rAF stub for the duration of fn, then restore. */
function withCountingRaf(fn: (callbacks: FrameRequestCallback[]) => void): void {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const callbacks: FrameRequestCallback[] = [];
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value: (cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    },
  });
  try {
    fn(callbacks);
  } finally {
    if (original) {
      Object.defineProperty(globalThis, 'requestAnimationFrame', original);
    } else {
      Reflect.deleteProperty(globalThis, 'requestAnimationFrame');
    }
  }
}

Deno.test('hydrating multiple scopes in one frame schedules a single rAF', () => {
  withCountingRaf((callbacks) => {
    const hosts = [fakeHost(), fakeHost(), fakeHost()];

    for (const { host } of hosts) {
      const scope = new HydrationScope();
      scope.hydrate(fakeShadowRoot(host));
    }

    // Pre-fix each hydrated component scheduled its own rAF.
    assertEquals(callbacks.length, 1, 'one rAF for the whole frame batch');
    for (const { state } of hosts) {
      assertEquals(state.reflows, 0, 'no reflow before the frame fires');
    }

    callbacks[0](0);
    for (const { state } of hosts) {
      assertEquals(state.reflows, 1, 'the batched flush reflows every queued host');
    }
  });
});

Deno.test('a hydrate after the batch flushes schedules a fresh rAF', () => {
  withCountingRaf((callbacks) => {
    const { host, state } = fakeHost();

    new HydrationScope().hydrate(fakeShadowRoot(host));
    assertEquals(callbacks.length, 1);
    callbacks[0](0);
    assertEquals(state.reflows, 1);

    // The batch state must reset after flushing: the next frame gets its own
    // rAF instead of being swallowed by a stale "scheduled" flag.
    new HydrationScope().hydrate(fakeShadowRoot(host));
    assertEquals(callbacks.length, 2);
    callbacks[1](0);
    assertEquals(state.reflows, 2);
  });
});

/** Run fn with requestAnimationFrame removed entirely, then restore. */
function withoutRaf(fn: () => void): void {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  Reflect.deleteProperty(globalThis, 'requestAnimationFrame');
  try {
    fn();
  } finally {
    if (original) {
      Object.defineProperty(globalThis, 'requestAnimationFrame', original);
    }
  }
}

Deno.test('without rAF the layout fix flushes synchronously and the scheduling flag resets', () => {
  withoutRaf(() => {
    const { host, state } = fakeHost();

    new HydrationScope().hydrate(fakeShadowRoot(host));
    assertEquals(state.reflows, 1, 'no rAF: flush happens synchronously');

    // The flag must not latch: a second hydrate flushes again instead of
    // being swallowed by a stale "scheduled" flag (#845).
    new HydrationScope().hydrate(fakeShadowRoot(host));
    assertEquals(state.reflows, 2);
  });
});
