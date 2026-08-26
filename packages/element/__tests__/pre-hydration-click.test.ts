/**
 * pre-hydration-click tests (#942).
 *
 * Pins the capture/replay contract for clicks that land in the hydration
 * window (island module not yet loaded): recorded against the host found in
 * the composed path, only the latest click per host is kept and replayed
 * exactly once after the host hydrates (#1027), never re-recorded after
 * flush, and inert outside island subtrees.
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
  shadowRoot?: { querySelector: (selector: string) => unknown } | null;
  closest?: (selector: string) => FakeElementLike | null;
  dispatchEvent?: (event: unknown) => boolean;
  addEventListener?: (type: string, fn: unknown, capture?: unknown) => void;
  getRootNode?: () => unknown;
  contains?: (node: unknown) => boolean;
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

function fakeTarget(dispatchCount: { n: number }, rootNode?: unknown): FakeElementLike {
  return {
    nodeType: 1,
    hasAttribute: () => false,
    // flushPendingClicks only replays onto targets still contained in the
    // flushed host; shadow-host fakes model containment via getRootNode().
    getRootNode: () => rootNode,
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
    const button = fakeTarget(events, host.shadowRoot);
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
        getRootNode: () => host.shadowRoot,
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

Deno.test('multiple pre-hydration clicks replay only the latest click once (#1027)', () => {
  withStubDocument(() => {
    ensurePreHydrationClickCapture();
    const host = markerHost();
    const counts = [{ n: 0 }, { n: 0 }, { n: 0 }];
    const buttons = counts.map((count) => fakeTarget(count, host.shadowRoot));
    for (const button of buttons) {
      captured.captureHandler?.(fakeEvent(button, [button, host]));
    }
    flushPendingClicks(host as unknown as Element);
    assertEquals(counts[0].n, 0, 'earlier clicks are superseded, not queued');
    assertEquals(counts[1].n, 0, 'earlier clicks are superseded, not queued');
    assertEquals(counts[2].n, 1, 'only the latest click replays, exactly once');
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

Deno.test('light-DOM markers resolve the nearest custom-element host, no ssr-props needed (#1067)', () => {
  withStubDocument(() => {
    ensurePreHydrationClickCapture();
    // A shadow island whose light-DOM child carries the markers: the host has
    // no data-ssr-props (render-dsd.ts only emits it with public props), so
    // the old closest('[data-ssr-props]') lookup keyed the queue to the
    // marker node and the click never flushed.
    const island = { ...markerHost(), tagName: 'my-island' };
    const markerEl = {
      nodeType: 1,
      tagName: 'SPAN',
      hasAttribute: (name: string) => name === 'data-signal',
      parentElement: island,
    };
    const events = { n: 0 };
    const button = fakeTarget(events, island.shadowRoot);
    captured.captureHandler?.(fakeEvent(button, [button, markerEl]));
    assertEquals(events.n, 0, 'no replay before hydration');
    flushPendingClicks(island as unknown as Element);
    assertEquals(events.n, 1, 'replay keyed to the island host');
  });
});

Deno.test(
  'light-mode island clicks queue for a data-oe-light host and replay on flush (ADR-0142, #1148)',
  () => {
    withStubDocument(() => {
      ensurePreHydrationClickCapture();
      // A renderMode 'light' island whose SSR host carries data-oe-light
      // activates in place: the recorded target survives the upgrade, so the
      // click is queued for the host and replayed once its bindings are live.
      // Supersedes the #1067 skip, which assumed clearChildren + full
      // re-render detached the target before any replay could run.
      const events = { n: 0 };
      const button = fakeTarget(events);
      const island = {
        nodeType: 1,
        tagName: 'my-light-island',
        hasAttribute: (name: string) => name === 'data-oe-light',
        shadowRoot: null,
        // Light-host containment: the recorded target lives in the host's
        // light subtree, proven via host.contains(target).
        contains: (node: unknown) => node === button,
      };
      const markerEl = {
        nodeType: 1,
        tagName: 'SPAN',
        hasAttribute: (name: string) => name === 'data-signal',
        parentElement: island,
      };
      captured.captureHandler?.(fakeEvent(button, [button, markerEl]));
      assertEquals(events.n, 0, 'no replay before hydration');
      flushPendingClicks(island as unknown as Element);
      assertEquals(events.n, 1, 'queued for the light host, replayed once after hydration');
    });
  },
);

Deno.test('light-mode island clicks without data-oe-light stay unqueued (pre-ADR-0142 SSR)', () => {
  withStubDocument(() => {
    ensurePreHydrationClickCapture();
    // A light island without the provenance marker (SSR HTML predating
    // ADR-0142, or a marker stripped upstream) still takes the
    // clear-and-render path, which detaches the recorded target — so the
    // click is not queued, exactly as under #1067.
    const island = {
      nodeType: 1,
      tagName: 'my-light-island',
      hasAttribute: () => false,
      shadowRoot: null,
    };
    const markerEl = {
      nodeType: 1,
      tagName: 'SPAN',
      hasAttribute: (name: string) => name === 'data-signal',
      parentElement: island,
    };
    const events = { n: 0 };
    const button = fakeTarget(events);
    captured.captureHandler?.(fakeEvent(button, [button, markerEl]));
    flushPendingClicks(island as unknown as Element);
    assertEquals(events.n, 0, 'never queued, nothing to replay');
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
      const button = fakeTarget(events, island.shadowRoot);
      captured.captureHandler?.(
        fakeEvent(button, [button, markerButton, island]),
      );
      assertEquals(events.n, 0);
      flushPendingClicks(island as unknown as Element);
      assertEquals(events.n, 1, 'replay keyed to the island host');
    });
  },
);

Deno.test('a throwing replay target does not break the flush', () => {
  withStubDocument(() => {
    ensurePreHydrationClickCapture();
    const host = markerHost();
    const bad: FakeElementLike = {
      nodeType: 1,
      hasAttribute: () => false,
      getRootNode: () => host.shadowRoot,
      dispatchEvent: () => {
        throw new Error('target boom');
      },
    };
    captured.captureHandler?.(fakeEvent(bad, [bad, host]));

    // The throw is contained: flush completes and the host stays flushed,
    // so a second flush has nothing left to replay.
    flushPendingClicks(host as unknown as Element);
    flushPendingClicks(host as unknown as Element);
  });
});

Deno.test(
  'a light-host target detached by a mismatch-degrade re-render never receives the replay (ADR-0142, #1148)',
  () => {
    withStubDocument(() => {
      ensurePreHydrationClickCapture();
      const events = { n: 0 };
      const button = fakeTarget(events);
      // Models the degrade path swapping the subtree between record and
      // flush: contains() reports the recorded node as no longer inside.
      let attached = true;
      const island = {
        nodeType: 1,
        tagName: 'my-light-island',
        hasAttribute: (name: string) => name === 'data-oe-light',
        shadowRoot: null,
        contains: () => attached,
      };
      const markerEl = {
        nodeType: 1,
        tagName: 'SPAN',
        hasAttribute: (name: string) => name === 'data-signal',
        parentElement: island,
      };
      captured.captureHandler?.(fakeEvent(button, [button, markerEl]));

      attached = false;
      flushPendingClicks(island as unknown as Element);
      assertEquals(events.n, 0, 'detached light-DOM target is skipped at flush');
    });
  },
);

Deno.test('a shadow-host target that left the shadow root never receives the replay', () => {
  withStubDocument(() => {
    ensurePreHydrationClickCapture();
    const host = markerHost();
    const events = { n: 0 };
    let root: unknown = host.shadowRoot;
    const button: FakeElementLike = {
      nodeType: 1,
      hasAttribute: () => false,
      getRootNode: () => root,
      dispatchEvent: () => {
        events.n++;
        return true;
      },
    };
    captured.captureHandler?.(fakeEvent(button, [button, host]));

    // A degrade re-render clears the shadow root: the detached node's
    // getRootNode() now returns its own tree root, not the shadow root.
    root = button;
    flushPendingClicks(host as unknown as Element);
    assertEquals(events.n, 0, 'target outside the shadow root is skipped at flush');
  });
});
