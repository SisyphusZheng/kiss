/**
 * index.ts - Reactive signals powered by @preact/signals-core.
 *
 * @preact/signals-core is the only supported engine.
 *
 * Architecture:
 *   Engine layer    -> @preact/signals-core adapter (preact-engine.ts)
 *   Framework layer -> User-friendly API: signal(), computed(), effect()
 *
 * @module ./index.ts
 */

// ─── Public types ───────────────────────────────────────────────
export type {
  ReadonlySignal,
  Signal,
  SignalEngine,
  SignalLike,
  Unsubscribe,
  WritableSignal,
} from '../protocol/signal.ts';
export { isSignalLike, unwrapSignalLike } from './types.ts';

// Internal alpha.2 conformance seam. The alternate engine is intentionally
// not re-exported from the package root; generated consumers select one engine
// statically and never dispatch through this test implementation per update.
export { createTestEngine } from './test-engine.ts';
export type { TestSignalEngine } from './test-engine.ts';

// ─── Framework layer ────────────────────────────────────────────
export { computed, effect, signal } from './framework.ts';
