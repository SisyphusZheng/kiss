/**
 * @openelement/signal - Reactive signals powered by @preact/signals-core.
 *
 * v0.40.0: @preact/signals-core is the default engine.
 * alien-signals remains available as an optional engine via `./alien-engine`.
 *
 * Architecture:
 *   Engine layer    -> preact-signals-core adapter (preact-engine.ts)
 *   Framework layer -> User-friendly API: signal(), computed(), effect()
 *
 * @module @openelement/signal
 */

// ─── Public types ───────────────────────────────────────────────
export type { ReadonlySignal, Signal, SignalEngine, Unsubscribe, WritableSignal } from './types.ts';

// ─── Engine factories (available at subpaths) ───────────────────
export { createAlienEngine } from './alien-engine.ts';
export { createPreactEngine } from './preact-engine.ts';

// ─── Framework layer ────────────────────────────────────────────
export { computed, effect, setSignalEngine, signal } from './framework.ts';

// ─── Default export (tree-shakeable) ────────────────────────────
import { computed, effect, signal } from './framework.ts';

export default { signal, computed, effect };
