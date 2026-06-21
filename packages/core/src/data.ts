/**
 * Platform-neutral data adapter protocol.
 *
 * Data adapters are contract surfaces for route data and ISR regeneration.
 * Concrete databases, filesystems, network clients, and auth layers stay in
 * adapters or recipes.
 */

/** Fetch and enumerate data by key without owning storage implementation. */
export interface DataAdapter<T = unknown> {
  /** Adapter name for diagnostics and logging. */
  name: string;
  /** Fetch data by key. Returns undefined when not found. */
  get(key: string): Promise<T | undefined>;
  /** List available keys when route generation needs enumeration. */
  keys?(): Promise<string[]>;
}

// ─── Route data layer types (v0.40.0) ──────────────────────────────

/** Context passed to a route loader function. */
export interface LoaderContext {
  request: Request;
  params: Record<string, string>;
  env: Record<string, string | undefined>;
  platform?: unknown;
}

/** Context passed to a route action function (extends loader context). */
export interface ActionContext extends LoaderContext {
  formData: FormData;
}

/** Route loader: fetches data for a page route. */
export type Loader<T = unknown> = (ctx: LoaderContext) => T | Promise<T>;

/** Route action: handles form submissions for a page route. */
export type Action<T = unknown> = (ctx: ActionContext) => T | Promise<T>;

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
