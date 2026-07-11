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

/** Signal engine protocol used by framework and adapter integrations. */
export interface SignalEngine {
  signal<T>(initialValue: T): WritableSignal<T>;
  computed<T>(fn: () => T): ReadonlySignal<T>;
  effect(fn: () => void | Unsubscribe): Unsubscribe;
}
