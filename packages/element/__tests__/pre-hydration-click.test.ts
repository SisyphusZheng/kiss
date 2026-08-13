/**
 * pre-hydration-click tests (#942).
 *
 * Pins the capture/replay contract for clicks that land in the hydration
 * window (island module not yet loaded): recorded against the host found in
 * the composed path, replayed exactly once per recorded event after the host
 * hydrates, never re-recorded after flush, and inert outside island subtrees.
 *
 * Runs without a DOM: `document` is stubbed per test and the module's
 * runtime duck-typing is exercised by plain-object fakes.
 */

import { assert, assertEquals, assertFalse } from '@std/assert';
import {
  ensurePreHydrationClickCapture,
  flushPendingClicks,
  isPreHydrationClickCaptureInstalled,
} from '../src/internal/core/pre-hydration-click.ts';

interface FakeElementLike {
  nodeType: number;
  hasAttribute: (name: string) => boolean;
  shadowRoot?: { querySelector: (selector: string) => unknown };
  closest?: (selector: string) => FakeElementLike | null;
  dispatchEvent?: (event: unknown) => boolean;
  addEventListener?: (type: string, fn: unknown, capture?: unknown) => void;
}

function markerHost(): FakeElementLike {
  return {
    nodeType: 1,
    hasAttribute: () => false,
    shadowRoot: {
      querySelector: (selector: string) => selector.includes('data-signal') ? {} : null,
    },
  };
}

function plainHost(): FakeElementLike {
  return {
    nodeType: 1,
    hasAttribute: () => false,
    shadowRoot: { querySelector: () => null },
  };
}

interface CapturedListeners {
  captureHandler?: (event: unknown) => void;
  bubbleHandler?: (event: unknown) => void;
}

const captured: CapturedListeners = {};

/** Persistent stub document: the module latches its listener on first install. */
const stubDocument = {
  addEventListener: (type: string, fn: unknown, capture?: boolean) => {
    if (type === 'click' && capture === true) captured.captureHandler = fn as never;
    if (type === 'click') captured.bubbleHandler = fn as never;
  },
  removeEventListener: () => {},
};

function withStubDocument<T>(run: () => T | Promise<T>): Promise<T> {
  const previousDocument = (globalThis as Record<string, unknown>).document;
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: stubDocument,
  });
  try {
    return Promise.resolve(run());
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: previousDocument,
    });
  }
}

function fakeEvent(
  target: FakeElementLike,
  composedPath: FakeElementLike[],
): unknown {
  return {
    target,
    composedPath: () => composedPath,
    preventDefault: () => {},
  };
}

function fakeTarget(dispatchCount: { n: number }): FakeElementLike {
  return {
    nodeType: 1,
    hasAttribute: () => false,
    dispatchEvent: () => {
      dispatchCount.n++;
      return true;
    },
  };
}

Deno.test(
  'capture installs once per runtime and skips when document is absent',
  () => {
    assertFalse(isPreHydrationClickCaptureInstalled());
    // No document global: SSR-safe no-op.
    ensurePreHydrationClickCapture();
    assertFalse(isPreHydrationClickCaptureInstalled());
  },
);

Deno.test('click inside an unhydrated shadow host is recorded and replayed once', () => {
  withStubDocument(() => {
    ensurePreHydrationClickCapture();
    assert(isPreHydrationClickCaptureInstalled());
    const host = markerHost();
    const events = { n: 0 };
    const button = fakeTarget(events);
    const click = fakeEvent(button, [button, host]);

    captured.captureHandler?.(click);
    assertEquals(events.n, 0, 'no replay before hydration');

    flushPendingClicks(host as unknown as Element);
    assertEquals(events.n, 1, 'replayed exactly once after hydration');
  });
});

Deno.test(
  'a second flush replays nothing, and replay re-entering the capture listener cannot re-queue',
  () => {
    withStubDocument(() => {
      ensurePreHydrationClickCapture();
      const host = markerHost();
      const events = { n: 0 };
      // Re-entrant fake: the replayed dispatch flows back through the capture
      // listener, as a real composed event would. Only the flushedHosts guard
      // stops it from being recorded again — this kills the mutation where
      // flushPendingClicks drops its flushedHosts.add(host).
      const button: FakeElementLike = {
        nodeType: 1,
        hasAttribute: () => false,
        dispatchEvent: (event) => {
          events.n++;
          captured.captureHandler?.(event);
          return true;
        },
      };
      captured.captureHandler?.(fakeEvent(button, [button, host]));
      assertEquals(events.n, 0, 'no replay before hydration');

      flushPendingClicks(host as unknown as Element);
      assertEquals(events.n, 1, 'replayed exactly once after hydration');
      flushPendingClicks(host as unknown as Element);
      assertEquals(events.n, 1, 'second flush has no queue left to replay');
    });
  },
);

Deno.test('clicks after flush are not recorded or replayed', () => {
  withStubDocument(() => {
    ensurePreHydrationClickCapture();
    const host = markerHost();
    const events = { n: 0 };
    const button = fakeTarget(events);
    flushPendingClicks(host as unknown as Element);
    captured.captureHandler?.(fakeEvent(button, [button, host]));
    assertEquals(events.n, 0);
  });
});

Deno.test('multiple pre-hydration clicks replay in order, each once', () => {
  withStubDocument(() => {
    ensurePreHydrationClickCapture();
    const host = markerHost();
    const events = { n: 0 };
    const button = fakeTarget(events);
    for (let i = 0; i < 3; i++) {
      captured.captureHandler?.(fakeEvent(button, [button, host]));
    }
    assertEquals(events.n, 0);
    flushPendingClicks(host as unknown as Element);
    assertEquals(events.n, 3);
  });
});

Deno.test('clicks outside island subtrees are never recorded', () => {
  withStubDocument(() => {
    ensurePreHydrationClickCapture();
    const host = plainHost();
    const events = { n: 0 };
    const button = fakeTarget(events);
    captured.captureHandler?.(fakeEvent(button, [button, host]));
    assertEquals(events.n, 0);
    flushPendingClicks(host as unknown as Element);
    assertEquals(events.n, 0);
  });
});

Deno.test('light-DOM markers resolve the host via the ssr-props ancestor', () => {
  withStubDocument(() => {
    ensurePreHydrationClickCapture();
    const island = markerHost();
    island.closest = () => island;
    const markerEl = {
      nodeType: 1,
      hasAttribute: (name: string) => name === 'data-signal',
      closest: () => island,
    };
    const events = { n: 0 };
    const button = fakeTarget(events);
    captured.captureHandler?.(fakeEvent(button, [button, markerEl, island]));
    assertEquals(events.n, 0);
    flushPendingClicks(island as unknown as Element);
    assertEquals(events.n, 1);
  });
});

Deno.test(
  'marker element inside a shadow root resolves its host via the shadow root, not closest()',
  () => {
    withStubDocument(() => {
      ensurePreHydrationClickCapture();
      const island = markerHost();
      // The data-eid button precedes its host in the path; closest() cannot
      // cross the shadow boundary (returns null), so the host must come from
      // getRootNode().host or the queue keys the wrong node and never flushes.
      const markerButton = {
        nodeType: 1,
        hasAttribute: (name: string) => name === 'data-eid',
        closest: () => null,
        getRootNode: () => ({ host: island }),
      };
      const events = { n: 0 };
      const button = fakeTarget(events);
      captured.captureHandler?.(
        fakeEvent(button, [button, markerButton, island]),
      );
      assertEquals(events.n, 0);
      flushPendingClicks(island as unknown as Element);
      assertEquals(events.n, 1, 'replay keyed to the island host');
    });
  },
);
