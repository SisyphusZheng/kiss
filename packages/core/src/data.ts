/**
 * Platform-neutral data adapter protocol.
 *
 * Data adapters are contract surfaces for route data and ISR regeneration.
 * Concrete databases, filesystems, network clients, and auth layers stay in
 * adapters or recipes.
 */

import type {
  Action,
  ActionContext,
  DataAdapter,
  Loader,
  LoaderContext,
} from '@openelement/protocol/data';
export type { Action, ActionContext, DataAdapter, Loader, LoaderContext };

/** In-memory adapter used only as a zero-I/O baseline proof. */
export class MemoryDataAdapter<T = unknown> implements DataAdapter<T> {
  readonly name = 'memory';
  #store: Map<string, T>;

  constructor(entries?: Iterable<[string, T]>) {
    this.#store = new Map(entries);
  }

  get(key: string): Promise<T | undefined> {
    return Promise.resolve(this.#store.get(key));
  }

  keys(): Promise<string[]> {
    return Promise.resolve(Array.from(this.#store.keys()));
  }

  set(key: string, value: T): void {
    this.#store.set(key, value);
  }

  delete(key: string): boolean {
    return this.#store.delete(key);
  }

  get size(): number {
    return this.#store.size;
  }
}
