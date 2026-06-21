import type { IsrCache, IsrCacheEntry, IsrCacheResult } from '@openelement/core/isr';

/**
 * File-system backed ISR cache.
 *
 * Stores each cache entry as a JSON file on disk. Suitable for
 * single-server deployments where cache should survive restarts.
 *
 * Each entry is stored as `{cacheDir}/{sanitized-key}.json`.
 *
 * Lives in @openelement/ssg because it requires filesystem access and is
 * therefore not runtime-agnostic. Runtime-free consumers should use
 * MemoryIsrCache from @openelement/core/isr instead.
 */
export class FileIsrCache implements IsrCache {
  readonly #cacheDir: string;

  constructor(cacheDir: string) {
    this.#cacheDir = cacheDir;
    try {
      Deno.mkdirSync(cacheDir, { recursive: true });
    } catch {
      // directory may already exist
    }
  }

  #filePath(key: string): string {
    // Sanitize key for filesystem safety
    const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${this.#cacheDir}/${safe}.json`;
  }

  async get(key: string, now: number = Date.now()): Promise<IsrCacheResult> {
    try {
      const text = await Deno.readTextFile(this.#filePath(key));
      const entry = JSON.parse(text) as IsrCacheEntry;
      const ageSeconds = Math.max(0, Math.floor((now - entry.createdAt) / 1000));
      return {
        state: ageSeconds >= entry.revalidate ? 'stale' : 'hit',
        entry,
      };
    } catch {
      return { state: 'miss' };
    }
  }

  async set(key: string, entry: IsrCacheEntry): Promise<void> {
    await Deno.writeTextFile(this.#filePath(key), JSON.stringify(entry));
  }

  async delete(key: string): Promise<void> {
    try {
      await Deno.remove(this.#filePath(key));
    } catch {
      // file may not exist
    }
  }
}
