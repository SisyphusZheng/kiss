/**
 * data.ts - Platform-neutral data adapter protocol.
 *
 * Data adapters are contract surfaces for route data and ISR regeneration.
 * Concrete databases, filesystems, network clients, and auth layers stay in
 * adapters or recipes.
 */

/** Fetch and enumerate data by key without owning storage implementation. */

// ─── Route data layer types (v0.40.0) ──────────────────────────────

/**
 * Context passed to a request-time ('dynamic') route loader. This is the
 * server contract: the loader runs on the server with the Web-standard
 * request, matched route params, the host environment and the platform
 * object, and signals validation failure via fail()/redirect() (ADR-0120).
 *
 * SPA-mode loaders are a different chain — see SpaLoaderContext. The names
 * are intentionally parallel; the contexts are not interchangeable (#570).
 */
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

// ─── SPA route data types (ADR-0119 frozen semantics) ──────────────

/**
 * Context passed to an SPA-mode route loader (#570). The SPA chain runs
 * client-side and supplies only the matched route params — no request, env
 * or platform — and signals failure by throwing (a throw is normalized to
 * action data by the SPA submit handler). These semantics are frozen under
 * ADR-0119; this type names the existing narrowing without changing any
 * runtime behavior.
 */
export interface SpaLoaderContext {
  params: Record<string, string>;
}

/** Context passed to an SPA-mode route action (client-side). */
export interface SpaActionContext extends SpaLoaderContext {
  formData?: FormData;
}

/** SPA route loader: client-side data fetch receiving route params only. */
export type SpaLoader<T = unknown> = (ctx: SpaLoaderContext) => T | Promise<T>;

/** SPA route action: client-side submit handler; signal failure by throwing. */
export type SpaAction<T = unknown> = (ctx: SpaActionContext) => T | Promise<T>;

/**
 * Wire shape returned to the JavaScript form-enhancement path (0.42.0-alpha.2,
 * ADR-0120). The no-JS path never sees this: it gets the equivalent semantics
 * as plain HTTP (303 on success, 422 with the re-rendered form on validation
 * failure, redirect/error as status codes).
 *
 * Error outcomes (CSRF 403, unknown action 404, unparseable body 400,
 * unexpected 500) are NOT part of this union: since 0.42.0-alpha.13 (#863,
 * ADR-0123 addendum item 13) they answer RFC 9457 Problem Details with the
 * PROBLEM_JSON_MEDIA_TYPE content type — see ProblemDetails.
 */
export type ActionResult<Success = unknown, Failure = unknown> =
  | { type: 'success'; status: number; data?: Success }
  | { type: 'failure'; status: number; data?: Failure }
  | { type: 'redirect'; status: number; location: string };

/**
 * RFC 9457 Problem Details document (0.42.0-alpha.13, #863, ADR-0123 addendum
 * item 13): the action error channel answers `application/problem+json`
 * instead of the bespoke `{ type: 'error', error: { message } }` JSON, so
 * HTTP tooling recognizes failures natively. With `type: 'about:blank'`,
 * `title` is the HTTP reason phrase and `detail` carries the specific
 * explanation. The wire shape is alpha-unfrozen; ADR-0122 acceptance freezes
 * it in this problem+json form.
 */
export interface ProblemDetails {
  /** URI reference identifying the problem type; 'about:blank' when none applies. */
  type: string;
  /** Short human-readable summary (the HTTP reason phrase for 'about:blank'). */
  title: string;
  /** The HTTP status code generated for this occurrence. */
  status: number;
  /** Human-readable explanation specific to this occurrence. */
  detail?: string;
}

/** Media type of the RFC 9457 action error channel (#863). */
export const PROBLEM_JSON_MEDIA_TYPE = 'application/problem+json';

/**
 * Request header selecting the action response channel (ADR-0121, amends
 * ADR-0120): `true` marks a programmatic caller and selects the serialized
 * ActionResult union; `enhance` marks the built-in morph enhancement and
 * selects the same full-HTML responses the no-JS path receives.
 */
export const ACTION_FETCH_HEADER = 'x-openelement-action';
