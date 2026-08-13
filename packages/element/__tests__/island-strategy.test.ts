/**
 * defineIsland() strategy registration after #606: the generated client
 * entry (island-scheduler.ts in @openelement/adapter-vite) is the single
 * owner of strategy scheduling, so defineIsland() registers load/only/visible
 * islands immediately on module evaluation. The removed defineIsland-side
 * IntersectionObserver queried only the light DOM and never found islands
 * inside page DSD shadow roots.
 *
 * These tests stub browser globals the way event-marker-alignment.test.ts
 * does; each test restores them afterwards.
 */
import { assert, assertEquals } from '@std/assert';
import { defineIsland } from '../src/internal/core/island.ts';

class FakeIntersectionObserver {}

interface Registry {
  defined: string[];
  get(tag: string): unknown;
  define(tag: string, ctor: unknown): void;
}

function withBrowserGlobals<T>(fn: (registry: Registry) => T): T {
  const hadIO = 'IntersectionObserver' in globalThis;
  const previousIO = globalThis.IntersectionObserver;
  const hadCE = 'customElements' in globalThis;
  const previousCE = globalThis.customElements;
  const registry: Registry = {
    defined: [],
    get: () => undefined,
    define(tag) {
      this.defined.push(tag);
    },
  };
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    value: FakeIntersectionObserver,
  });
  Object.defineProperty(globalThis, 'customElements', { configurable: true, value: registry });
  try {
    return fn(registry);
  } finally {
    if (hadIO) {
      Object.defineProperty(globalThis, 'IntersectionObserver', {
        configurable: true,
        value: previousIO,
      });
    } else {
      delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    }
    if (hadCE) {
      Object.defineProperty(globalThis, 'customElements', {
        configurable: true,
        value: previousCE,
      });
    } else {
      delete (globalThis as { customElements?: unknown }).customElements;
    }
  }
}

let counter = 0;
function freshTag(): string {
  return `x-test-${++counter}`;
}

Deno.test('#606 visible strategy registers immediately on module evaluation', () => {
  withBrowserGlobals((registry) => {
    class VisibleIsland {}
    defineIsland(freshTag(), VisibleIsland as unknown as CustomElementConstructor, {
      hydrate: 'visible',
    });
    // Synchronous: no observer, no light-DOM query, no 30s timeout fallback.
    assertEquals(registry.defined.length, 1);
  });
});

Deno.test('load and only strategies register immediately', () => {
  withBrowserGlobals((registry) => {
    class LoadIsland {}
    class OnlyIsland {}
    defineIsland(freshTag(), LoadIsland as unknown as CustomElementConstructor, {
      hydrate: 'load',
    });
    defineIsland(freshTag(), OnlyIsland as unknown as CustomElementConstructor, {
      hydrate: 'only',
    });
    assertEquals(registry.defined.length, 2);
  });
});

Deno.test('idle strategy defers registration to idle time', () => {
  withBrowserGlobals((registry) => {
    const hadRic = 'requestIdleCallback' in globalThis;
    const previousRic = globalThis.requestIdleCallback;
    let idle: (() => void) | null = null;
    Object.defineProperty(globalThis, 'requestIdleCallback', {
      configurable: true,
      value: (fn: () => void) => (idle = fn),
    });
    try {
      class IdleIsland {}
      defineIsland(freshTag(), IdleIsland as unknown as CustomElementConstructor, {
        hydrate: 'idle',
      });
      assertEquals(registry.defined.length, 0);
      assert(idle !== null);
      (idle as unknown as () => void)();
      assertEquals(registry.defined.length, 1);
    } finally {
      if (hadRic) {
        Object.defineProperty(globalThis, 'requestIdleCallback', {
          configurable: true,
          value: previousRic,
        });
      } else {
        delete (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback;
      }
    }
  });
});

Deno.test('SSR (no IntersectionObserver) registers immediately regardless of strategy', () => {
  const hadIO = 'IntersectionObserver' in globalThis;
  const previousIO = globalThis.IntersectionObserver;
  const hadCE = 'customElements' in globalThis;
  const previousCE = globalThis.customElements;
  const defined: string[] = [];
  // Deno has no IntersectionObserver by default; make sure it stays absent.
  delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
  Object.defineProperty(globalThis, 'customElements', {
    configurable: true,
    value: { get: () => undefined, define: (tag: string) => defined.push(tag) },
  });
  try {
    class VisibleIsland {}
    defineIsland(freshTag(), VisibleIsland as unknown as CustomElementConstructor, {
      hydrate: 'visible',
    });
    assertEquals(defined.length, 1);
  } finally {
    if (hadIO) {
      Object.defineProperty(globalThis, 'IntersectionObserver', {
        configurable: true,
        value: previousIO,
      });
    }
    if (hadCE) {
      Object.defineProperty(globalThis, 'customElements', {
        configurable: true,
        value: previousCE,
      });
    } else {
      delete (globalThis as { customElements?: unknown }).customElements;
    }
  }
});
