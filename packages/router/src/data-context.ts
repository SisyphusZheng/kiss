/**
 * @openelement/router - Data context for route loader/action data.
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

// ─── Render-scoped stack ─────────────────────────────────────────

const dataStack: { loaderData: unknown; actionData: unknown }[] = [];

// ─── Internal stack operations (called by ApplicationPageElement) ─

/**
 * @internal Push loader data for the current render.
 * Called by ApplicationPageElement.render() before invoking the page render.
 */
export function __internal_pushLoaderData(data: unknown): void {
  dataStack.push({ loaderData: data, actionData: undefined });
  // ponytail: warn if stack grows abnormally (missing pop indicates a leak).
  // 10 is a generous upper bound for nested app-shell renders.
  if (dataStack.length > 10) {
    console.warn(
      `[openelement:router] data-context stack depth ${dataStack.length} exceeds expected maximum. ` +
        'This may indicate a missing __internal_popData() call.',
    );
  }
}

/**
 * @internal Push action data for the current render.
 * Called by ApplicationPageElement.render() after a form submission.
 */
export function __internal_pushActionData(data: unknown): void {
  const top = dataStack[dataStack.length - 1];
  if (top) top.actionData = data;
}

/**
 * @internal Pop the render-scoped data stack.
 * Called by ApplicationPageElement.render() in a `finally` block.
 */
export function __internal_popData(): void {
  dataStack.pop();
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
  return dataStack[dataStack.length - 1]?.loaderData as T;
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
  return dataStack[dataStack.length - 1]?.actionData as T | undefined;
}
