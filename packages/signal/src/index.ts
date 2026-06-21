/**
 * @openelement/signal - Reactive signals powered by @preact/signals-core.
 *
 * @preact/signals-core is the only supported engine.
 *
 * Architecture:
 *   Engine layer    -> @preact/signals-core adapter (preact-engine.ts)
 *   Framework layer -> User-friendly API: signal(), computed(), effect()
 *
 * @module @openelement/signal
 */

// ─── Public types ───────────────────────────────────────────────
export type {
  ReadonlySignal,
  Signal,
  SignalEngine,
  SignalLike,
  Unsubscribe,
  WritableSignal,
} from './types.ts';
export { isSignalLike, unwrapSignalLike } from './types.ts';

// ─── Engine factory (available at subpath) ──────────────────────
export { createPreactEngine } from './preact-engine.ts';

// ─── Framework layer ────────────────────────────────────────────
export { computed, effect, setSignalEngine, signal } from './framework.ts';

// ─── Default export (tree-shakeable) ────────────────────────────
import { computed, effect, signal } from './framework.ts';

export default { signal, computed, effect };
