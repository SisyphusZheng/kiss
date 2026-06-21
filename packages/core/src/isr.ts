/**
 * @openelement/core - route-level ISR cache primitives.
 *
 * v0.22: Platform adapters (CF Workers KV, Deno KV).
 *
 * Architecture:
 *   1. Build: SSG produces static HTML + isr-manifest.json
 *   2. Runtime: Edge handler checks cache before serving static
 *   4. Stale: serve cached HTML + async background regeneration
 *
 * The IsrCache interface is platform-agnostic. Production adapters
 * (Cloudflare Workers KV, Deno KV) are v0.22 scope.
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

export interface IsrCache {
  get(key: string, now?: number): Promise<IsrCacheResult> | IsrCacheResult;
  set(key: string, entry: IsrCacheEntry): Promise<void> | void;
  delete?(key: string): Promise<void> | void;
}

export interface IsrRouteConfig {
  revalidate: number;
}

export function isIsrRouteConfig(value: unknown): value is IsrRouteConfig {
  return typeof value === 'object' && value !== null &&
    typeof (value as IsrRouteConfig).revalidate === 'number' &&
    Number.isFinite((value as IsrRouteConfig).revalidate) &&
    (value as IsrRouteConfig).revalidate > 0;
}

export function createIsrCacheKey(
  routePath: string,
  params: Record<string, string> = {},
): string {
  const sortedParams = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const suffix = sortedParams.length === 0 ? '' : '?' +
    sortedParams.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  return `openelement:isr:${routePath}${suffix}`;
}

/** ISR route record written to isr-manifest.json at build time. */
export type { IsrManifestEntry } from './schemas.js';

export class MemoryIsrCache implements IsrCache {
  readonly #entries = new Map<string, IsrCacheEntry>();

  get(key: string, now: number = Date.now()): IsrCacheResult {
    const entry = this.#entries.get(key);
    if (!entry) return { state: 'miss' };
    const ageSeconds = Math.max(0, Math.floor((now - entry.createdAt) / 1000));
    return {
      state: ageSeconds >= entry.revalidate ? 'stale' : 'hit',
      entry,
    };
  }

  set(key: string, entry: IsrCacheEntry): void {
    this.#entries.set(key, entry);
  }

  delete(key: string): void {
    this.#entries.delete(key);
  }
}
