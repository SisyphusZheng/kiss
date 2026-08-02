/**
 * data-adapter.ts - MemoryDataAdapter reference implementation (ADR-0095).
 *
 * Zero-I/O, Map-backed DataAdapter for development, testing, and as the
 * reference implementation for future adapters (FileDataAdapter, Drizzle,
 * Deno KV, etc.).
 *
 * @module ./data-adapter.ts
 */

import type { DataAdapter } from '../protocol/data.ts';

/**
 * In-memory DataAdapter backed by a Map.
 *
 * Serves as the test/development baseline and the reference implementation
 * for the DataAdapter contract (ADR-0095). Production adapters (file,
 * database, KV) implement the same interface with real I/O.
 *
 * @example
 * ```ts
 * const db = new MemoryDataAdapter<Product>();
 * db.set('widget', { id: 'widget', name: 'Widget', price: 9.99 });
 * const product = await db.get('widget'); // { id: 'widget', ... }
 * const keys = await db.keys(); // ['widget']
 * ```
 */
export class MemoryDataAdapter<T = unknown> implements DataAdapter<T> {
  readonly name = 'memory';
  readonly #store = new Map<string, T>();

  get(key: string): Promise<T | undefined> {
    return Promise.resolve(this.#store.get(key));
  }

  keys(): Promise<string[]> {
    return Promise.resolve([...this.#store.keys()]);
  }

  /** Set a value (write helper — not part of the DataAdapter contract). */
  set(key: string, value: T): void {
    this.#store.set(key, value);
  }

  /** Delete a value (write helper — not part of the DataAdapter contract). */
  delete(key: string): boolean {
    return this.#store.delete(key);
  }

  /** Number of entries (test helper). */
  get size(): number {
    return this.#store.size;
  }

  /** Remove all entries (test helper). */
  clear(): void {
    this.#store.clear();
  }
}
