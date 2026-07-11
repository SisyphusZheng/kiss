/**
 * ./index.ts - Platform-neutral data adapter protocol.
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
