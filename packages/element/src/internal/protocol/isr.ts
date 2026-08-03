/**
 * isr.ts - Route-level ISR cache contracts.
 */

/** Generic cache entry metadata shared by ISR and runtime adapters. */
export interface CacheEntry<T = unknown> {
  value: T;
  createdAt: number;
  revalidate?: number;
  tags?: readonly string[];
}

/**
 * @experimental Minimal cache protocol for replacement-compatible runtime
 * adapters. ISR is not wired in 0.42 (targeting 0.44); `purgeTag` is currently
 * unimplemented by the in-box adapter, so cross-instance invalidation is absent.
 */
export interface CacheAdapter<T = unknown> {
  name: string;
  get(key: string): Promise<CacheEntry<T> | undefined>;
  set(key: string, entry: CacheEntry<T>): Promise<void>;
  delete?(key: string): Promise<boolean>;
  purgeTag?(tag: string): Promise<number>;
}

type IsrCacheState = 'miss' | 'hit' | 'stale' | 'error';

export interface IsrCacheEntry {
  html: string;
  createdAt: number;
  revalidate: number;
  headers?: Record<string, string>;
}

export interface IsrCacheResult {
  state: IsrCacheState;
  entry?: IsrCacheEntry;
  error?: Error;
}
