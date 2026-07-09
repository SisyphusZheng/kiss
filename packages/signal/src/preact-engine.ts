/**
 * SignalEngine candidate backed by @preact/signals-core.
 *
 * This IS the default engine: framework.ts wires it up via createPreactEngine()
 * at module load. It is also kept available so the shared SignalEngine conformance
 * suite can evaluate Preact Signals without pulling the dependency into core or elements.
 */

import {
  computed as preactComputed,
  effect as preactEffect,
  signal as preactSignal,
} from '@preact/signals-core';
import type { SignalEngine } from './types.ts';

export function createPreactEngine(): SignalEngine {
  return {
    signal<T>(initialValue: T) {
      const s = preactSignal(initialValue);
      return {
        get value(): T {
          return s.value;
        },
        set value(value: T) {
          s.value = value;
        },
        subscribe(fn: (value: T) => void): () => void {
          const dispose = preactEffect(() => fn(s.value));
          return () => dispose();
        },
      };
    },

    computed<T>(fn: () => T) {
      const c = preactComputed(fn);
      return {
        get value(): T {
          return c.value;
        },
        subscribe(fn: (value: T) => void): () => void {
          const dispose = preactEffect(() => fn(c.value));
          return () => dispose();
        },
      };
    },

    effect(fn: () => void | (() => void)): () => void {
      let cleanup: (() => void) | void;
      const dispose = preactEffect(() => {
        cleanup?.();
        cleanup = fn();
      });
      return () => {
        cleanup?.();
        dispose();
      };
    },
  };
}
