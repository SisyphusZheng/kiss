/**
 * framework.ts - Framework Layer
 *
 * Developer-friendly API wrapping the statically selected engine.
 * signal(), computed(), effect() - the primary API surface.
 *
 * @preact/signals-core is the default implementation (see selection.ts).
 *
 * @module ./framework.ts
 */

import { noteSignalCreated, selectedSignalEngine } from './selection.ts';
import type { ReadonlySignal, Unsubscribe, WritableSignal } from './types.ts';

// ─── Engine (default: @preact/signals-core) ─────────────────────
/** Create a writable signal through the selected signal engine. */
export function signal<T>(initialValue: T): WritableSignal<T> {
  const created = selectedSignalEngine().signal(initialValue);
  noteSignalCreated();
  return created;
}
/** Create a derived read-only signal recomputed from its dependencies. */
export function computed<T>(fn: () => T): ReadonlySignal<T> {
  const created = selectedSignalEngine().computed(fn);
  noteSignalCreated();
  return created;
}
/** Run a side effect that re-subscribes whenever its signal dependencies change. */
export function effect(fn: () => void | Unsubscribe): Unsubscribe {
  noteSignalCreated();
  return selectedSignalEngine().effect(fn);
}
