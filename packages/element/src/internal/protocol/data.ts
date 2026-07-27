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

/**
 * Wire shape returned to the JavaScript form-enhancement path (0.42.0-alpha.2,
 * ADR-0120). The no-JS path never sees this: it gets the equivalent semantics
 * as plain HTTP (303 on success, 422 with the re-rendered form on validation
 * failure, redirect/error as status codes).
 */
export type ActionResult<Success = unknown, Failure = unknown> =
  | { type: 'success'; status: number; data?: Success }
  | { type: 'failure'; status: number; data?: Failure }
  | { type: 'redirect'; status: number; location: string }
  | { type: 'error'; status: number; error: { message: string } };

/** Request header marking a fetch from the JS form-enhancement layer. */
export const ACTION_FETCH_HEADER = 'x-openelement-action';
