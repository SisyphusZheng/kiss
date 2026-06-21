/**
 * @openelement/signal - Alien Signals Engine Adapter.
 *
 * v0.40.0: @preact/signals-core is the default engine (see framework.ts).
 * alien-signals remains available as an optional engine through this module.
 *
 * Alien Signals (1.6KB) is a lightweight reactive library with push-pull
 * hybrid architecture, used by Vue 3.6 core and XState.
 *
 * ## Design (SOP-004 § Signals Facade)
 * - alien-signals is available as an optional engine.
 * - The default engine can be changed at runtime via setSignalEngine().
 *
 * @module @openelement/signal/alien-engine
 */

import {
  computed as _c,
  effect as _e,
  effectScope as alienEffectScope,
  signal as _s,
} from 'alien-signals';
import type { SignalEngine } from './types.ts';

// ─── Adapter (synchronous wrapper around alien-signals API) ─────

/**
 * Minimal interface for alien-signals module.
 */
interface AlienSignalsModule {
  signal<T>(v: T): { (): T; (v: T): void };
  computed<T>(fn: () => T): { (): T };
  effect(fn: () => void): () => void;
}

/**
 * Create a SignalEngine backed by alien-signals.
 */
export function createAlienEngine(
  alienMod: AlienSignalsModule,
): SignalEngine {
  return {
    signal<T>(initialValue: T) {
      const s = alienMod.signal(initialValue);
      return {
        get value(): T {
          return s();
        },
        set value(v: T) {
          s(v);
        },
        subscribe(fn: (value: T) => void): () => void {
          const e = alienMod.effect(() => {
            fn(s());
          });
          return () => e();
        },
      };
    },

    computed<T>(fn: () => T) {
      const c = alienMod.computed(fn);
      return {
        get value(): T {
          return c();
        },
        subscribe(fn2: (value: T) => void): () => void {
          const e = alienMod.effect(() => {
            fn2(c());
          });
          return () => e();
        },
      };
    },

    effect(fn: () => void | (() => void)) {
      let cleanup: (() => void) | void;
      const e = alienMod.effect(() => {
        try {
          cleanup?.();
        } catch { /* swallow */ }
        cleanup = fn() as (() => void) | void;
      });
      return () => {
        try {
          cleanup?.();
        } catch { /* swallow */ }
        e();
      };
    },
  };
}

// ─── Default Engine (sync) ──────────────────────────────────────

const _defaultAlienMod: AlienSignalsModule = { signal: _s, computed: _c, effect: _e };

/**
 * Get the default alien-signals engine.
 *
 * v0.40.0: This returns an alien-signals engine. The framework default
 * (signal/computed/effect in framework.ts) now uses @preact/signals-core.
 */
// ─── Advanced primitives ────────────────────────────────────────

/**
 * Create an effect scope using alien-signals' effectScope.
 * All effects created inside the scope are automatically captured as children.
 * The returned dispose function cleans up all captured effects.
 *
 * Note: This is an alien-signals-specific primitive. The default engine
 * (@preact/signals-core) does not provide effectScope.
 */
export function effectScope(fn: () => void): () => void {
  return alienEffectScope(fn);
}
