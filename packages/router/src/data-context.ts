/**
 * @openelement/router - Data context for route loader/action data.
 *
 * Provides module-level state for loader and action data, consumed by
 * useLoaderData / useActionData hooks inside route page renders.
 *
 * Architecture:
 *   ApplicationPageElement.render() calls setLoaderData / setActionData before
 *   invoking the user's render function. The hooks read from this module-level
 *   state. Since JavaScript is single-threaded, concurrent renders do not
 *   conflict within the same microtask.
 *
 * v0.40.0: Fresh-style data layer MVP.
 */

// ─── Module-level state ──────────────────────────────────────────

interface DataState {
  loaderData: unknown;
  actionData: unknown;
}

const currentState: DataState = {
  loaderData: undefined,
  actionData: undefined,
};

// ─── Internal setters (called by ApplicationPageElement) ─────────

/**
 * @internal Set the current loader data before rendering.
 * Called by ApplicationPageElement.render().
 */
export function __internal_setLoaderData(data: unknown): void {
  currentState.loaderData = data;
}

/**
 * @internal Set the current action data before rendering.
 * Called by ApplicationPageElement.render() after a form submission.
 */
export function __internal_setActionData(data: unknown): void {
  currentState.actionData = data;
}

/**
 * @internal Clear the current action data (e.g., after navigation).
 */
export function __internal_clearActionData(): void {
  currentState.actionData = undefined;
}

// ─── Public hooks ────────────────────────────────────────────────

/**
 * Read loader data within a route page render.
 * Returns the data returned by the route's `loader` export.
 *
 * @example
 * ```ts
 * const data = useLoaderData<{ message: string }>();
 * ```
 */
export function useLoaderData<T = unknown>(): T {
  return currentState.loaderData as T;
}

/**
 * Read action data within a route page render.
 * Returns the data returned by the route's `action` export after a form POST,
 * or `undefined` during initial load / GET navigation.
 *
 * @example
 * ```ts
 * const actionData = useActionData<{ ok: boolean }>();
 * ```
 */
export function useActionData<T = unknown>(): T | undefined {
  return currentState.actionData as T | undefined;
}
