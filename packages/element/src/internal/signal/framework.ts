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
export function signal<T>(initialValue: T): WritableSignal<T> {
  const created = selectedSignalEngine().signal(initialValue);
  noteSignalCreated();
  return created;
}
export function computed<T>(fn: () => T): ReadonlySignal<T> {
  const created = selectedSignalEngine().computed(fn);
  noteSignalCreated();
  return created;
}
export function effect(fn: () => void | Unsubscribe): Unsubscribe {
  noteSignalCreated();
  return selectedSignalEngine().effect(fn);
}
