/**
 * types.ts - Public type exports and runtime helpers.
 *
 * Signal protocol types are owned by ../protocol/index.ts and re-exported here.
 * Runtime helpers (isSignalLike, unwrapSignalLike) remain in this package.
 */

import type {
  ReadonlySignal,
  Signal,
  SignalEngine,
  SignalLike,
  Unsubscribe,
  WritableSignal,
} from '../protocol/signal.ts';

export type { ReadonlySignal, Signal, SignalEngine, SignalLike, Unsubscribe, WritableSignal };

/** Type guard for the protocol signal shape. */
export function isSignalLike(value: unknown): value is SignalLike {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'value' in value &&
      typeof (value as SignalLike).subscribe === 'function',
  );
}

/** Extract the current value from a protocol signal, or return the input. */
export function unwrapSignalLike<T>(value: T): T extends SignalLike<infer V> ? V : T {
  if (isSignalLike(value)) {
    return value.value as T extends SignalLike<infer V> ? V : T;
  }
  return value as T extends SignalLike<infer V> ? V : T;
}
