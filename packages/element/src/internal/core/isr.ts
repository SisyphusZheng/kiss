/**
 * ./isr.ts - route-level ISR cache primitives.
 *
 * v0.44: Platform adapters (CF Workers KV, Deno KV).
 *
 * Architecture:
 *   1. Build: SSG produces static HTML + isr-manifest.json
 *   2. Runtime: Edge handler checks cache before serving static
 *   3. Hit: serve fresh cached HTML directly
 *   4. Stale: serve cached HTML + async background regeneration
 *
 * MemoryIsrCache is the reference in-memory implementation. Production adapters
 * (Cloudflare Workers KV, Deno KV) are v0.44 scope.
 */

import type {
  CacheAdapter,
  CacheEntry,
  IsrCacheEntry,
  IsrCacheResult,
  IsrCacheState,
  IsrRouteConfig,
} from '../protocol/isr.ts';
import type { IsrManifestEntry } from '../protocol/framework.ts';
export type {
  CacheAdapter,
  CacheEntry,
  IsrCacheEntry,
  IsrCacheResult,
  IsrCacheState,
  IsrManifestEntry,
  IsrRouteConfig,
};

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
  // Encode each path segment so characters like '?' or '&' in a route path
  // cannot collide with the param-suffix delimiter or each other. Slashes are
  // preserved as segment separators.
  const encodedPath = routePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const sortedParams = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const suffix = sortedParams.length === 0 ? '' : '?' +
    sortedParams.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  return `openelement:isr:${encodedPath}${suffix}`;
}

export interface MemoryIsrCacheOptions {
  /** Maximum number of entries to keep in memory. Defaults to 1000. */
  maxEntries?: number;
}

/**
 * @experimental In-process LRU ISR cache. Single-instance only — no cross-instance
 * invalidation (`CacheAdapter.purgeTag` is unimplemented), so it is unsafe under
 * multi-instance/edge deployment. Not wired into 0.42 request-time serving.
 */
export class MemoryIsrCache {
  readonly #entries = new Map<string, IsrCacheEntry>();
  readonly #maxEntries: number;

  constructor(options?: MemoryIsrCacheOptions) {
    const max = options?.maxEntries ?? 1000;
    if (!Number.isInteger(max) || max <= 0) {
      throw new RangeError('MemoryIsrCache maxEntries must be a positive integer');
    }
    this.#maxEntries = max;
  }

  get(key: string, now: number = Date.now()): IsrCacheResult {
    const entry = this.#entries.get(key);
    if (!entry) return { state: 'miss' };

    const ageSeconds = Math.max(0, Math.floor((now - entry.createdAt) / 1000));
    if (ageSeconds >= entry.revalidate) {
      return {
        state: 'stale',
        entry,
      };
    }

    // LRU: move accessed entry to the end (most-recently-used).
    this.#entries.delete(key);
    this.#entries.set(key, entry);

    return {
      state: 'hit',
      entry,
    };
  }

  set(key: string, entry: IsrCacheEntry): void {
    // Update position for LRU ordering.
    this.#entries.delete(key);
    this.#entries.set(key, entry);

    // Evict oldest entries when over capacity.
    while (this.#entries.size > this.#maxEntries) {
      const firstKey = this.#entries.keys().next().value;
      if (firstKey === undefined) break;
      this.#entries.delete(firstKey);
    }
  }

  delete(key: string): void {
    this.#entries.delete(key);
  }

  get size(): number {
    return this.#entries.size;
  }
}
