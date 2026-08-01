/**
 * ./index.ts - Signal contracts.
 *
 * Minimal signal protocol types shared across openElement packages.
 */

/** Unsubscribe function returned by subscriptions and effects. */
export type Unsubscribe = () => void;

/** Minimal signal-like object accepted by renderers and bindings. */
export interface SignalLike<T = unknown> {
  readonly value: T;
  subscribe(fn: (value: T) => void): Unsubscribe;
}

/** Writable signal protocol used by openElement integrations. */
export interface WritableSignal<T> extends SignalLike<T> {
  value: T;
}

/** Read-only signal protocol used by computed values. */
export interface ReadonlySignal<T> extends SignalLike<T> {
  readonly value: T;
}

/** Alias for APIs that accept either writable or read-only signals. */
export type Signal<T> = WritableSignal<T> | ReadonlySignal<T>;

/**
 * Signal engine protocol used by framework and adapter integrations.
 *
 * This is a deliberate architectural seam, not speculative abstraction. The
 * framework layer (`signal.ts`) talks to signals only through this narrow
 * interface so the concrete implementation can be swapped without touching the
 * public `signal()/computed()/effect()` API surface.
 *
 * openElement currently ships exactly one engine implementation
 * (`preact-engine`, backed by `@preact/signals-core`). Additional engines are
 * intentionally out of scope and, if ever needed, would be added here behind
 * this protocol rather than inline. The single-implementation state is the
 * intended charter decision — see #723.
 */
export interface SignalEngine {
  signal<T>(initialValue: T): WritableSignal<T>;
  computed<T>(fn: () => T): ReadonlySignal<T>;
  effect(fn: () => void | Unsubscribe): Unsubscribe;
}
