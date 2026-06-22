/**
 * @openelement/protocol - Route-level ISR cache contracts.
 */

/** Generic cache entry metadata shared by ISR and runtime adapters. */
export interface CacheEntry<T = unknown> {
  value: T;
  createdAt: number;
  revalidate?: number;
  tags?: readonly string[];
}

/** Minimal cache protocol for replacement-compatible runtime adapters. */
export interface CacheAdapter<T = unknown> {
  name: string;
  get(key: string): Promise<CacheEntry<T> | undefined>;
  set(key: string, entry: CacheEntry<T>): Promise<void>;
  delete?(key: string): Promise<boolean>;
  purgeTag?(tag: string): Promise<number>;
}

export type IsrCacheState = 'miss' | 'hit' | 'stale' | 'error';

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

export interface IsrRouteConfig {
  revalidate: number;
}
