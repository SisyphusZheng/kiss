/**
 * @openelement/app/internal/router - Data context for route loader/action data.
 *
 * Provides render-scoped state for loader and action data, consumed by
 * useLoaderData / useActionData hooks inside route page renders.
 *
 * Architecture:
 *   ApplicationPageElement.render() pushes loader data (and optional action
 *   data) onto a stack before invoking the user's render function, then pops
 *   the stack in a `finally` block. This keeps data scoped to the current
 *   render instead of relying on module-level mutable state.
 *
 * v0.41.0: Replaced module-level currentState with render-scoped stack.
 */
import { __activeDataContext, currentActionData, currentLoaderData } from './data-context-store.ts';

// ─── Public hooks ────────────────────────────────────────────────

/**
 * Read loader data within a route page render.
 * Returns the data returned by the route's `loader` export, or `undefined`
 * when the route has no loader, the loader returned `undefined`, or the hook
 * is called outside a page render scope.
 *
 * @example
 * ```ts
 * const data = useLoaderData<{ message: string }>();
 * ```
 */
export function useLoaderData<T = unknown>(): T | undefined {
  return currentLoaderData(__activeDataContext()) as T | undefined;
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
  return currentActionData(__activeDataContext()) as T | undefined;
}
