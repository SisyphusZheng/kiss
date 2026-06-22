/**
 * @openelement/protocol - Route-level ISR cache contracts.
 */

import type { IsrManifestEntry } from './framework.js';

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

export interface IsrCache {
  get(key: string, now?: number): Promise<IsrCacheResult> | IsrCacheResult;
  set(key: string, entry: IsrCacheEntry): Promise<void> | void;
  delete?(key: string): Promise<void> | void;
}

export interface IsrRouteConfig {
  revalidate: number;
}

// --- Runtime types (from isr-runtime) ------------------------------

export type IsrRuntimeState = IsrCacheResult['state'] | 'not-found';

export interface IsrRuntimeRenderResult {
  html: string;
  headers?: Record<string, string>;
}

export interface IsrRuntimeRenderContext {
  entry: IsrManifestEntry;
  request?: Request;
}

export interface IsrRuntimeOptions {
  manifest: IsrManifestEntry[];
  cache: IsrCache;
  render: (
    path: string,
    context: IsrRuntimeRenderContext,
  ) => Promise<IsrRuntimeRenderResult> | IsrRuntimeRenderResult;
  now?: () => number;
  regenerate?: 'blocking' | 'background';
  onRegenerateError?: (error: unknown, entry: IsrManifestEntry) => void;
  schedule?: (task: Promise<void>) => void;
}

export interface IsrRuntimeResult {
  state: IsrRuntimeState;
  entry?: IsrManifestEntry;
  response: Response;
}
