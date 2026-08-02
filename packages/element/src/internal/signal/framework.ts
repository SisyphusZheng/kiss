/**
 * ./framework.ts - Framework Layer
 *
 * Developer-friendly API wrapping the engine.
 * signal(), computed(), effect() - the primary API surface.
 *
 * @preact/signals-core is the fixed private implementation.
 *
 * @module ./framework.ts
 */

import { createPreactEngine } from './preact-engine.ts';
import type { ReadonlySignal, SignalEngine, Unsubscribe, WritableSignal } from './types.ts';

// ─── Engine (default: @preact/signals-core) ─────────────────────
const engine: SignalEngine = createPreactEngine();

export function signal<T>(initialValue: T): WritableSignal<T> {
  return engine.signal(initialValue);
}
export function computed<T>(fn: () => T): ReadonlySignal<T> {
  return engine.computed(fn);
}
export function effect(fn: () => void | Unsubscribe): Unsubscribe {
  return engine.effect(fn);
}
