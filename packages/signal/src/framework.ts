/**
 * @openelement/signal - Framework Layer
 *
 * Developer-friendly API wrapping the engine.
 * signal(), computed(), effect() - the primary API surface.
 *
 * @preact/signals-core is the engine. The engine can be swapped at runtime via
 * setSignalEngine().
 *
 * @module @openelement/signal/framework
 */

import { createPreactEngine } from './preact-engine.ts';
import type { ReadonlySignal, SignalEngine, Unsubscribe, WritableSignal } from './types.ts';

// ─── Engine (default: @preact/signals-core) ─────────────────────
let _engine: SignalEngine = createPreactEngine();

export function signal<T>(initialValue: T): WritableSignal<T> {
  return _engine.signal(initialValue);
}
export function computed<T>(fn: () => T): ReadonlySignal<T> {
  return _engine.computed(fn);
}
export function effect(fn: () => void | Unsubscribe): Unsubscribe {
  return _engine.effect(fn);
}

/**
 * Swap the signal engine at runtime.
 * Previously created signals/computed/effects continue using the old engine.
 * New calls to signal(), computed(), effect() use the new engine.
 */
export function setSignalEngine(engine: SignalEngine): void {
  _engine = engine;
}
