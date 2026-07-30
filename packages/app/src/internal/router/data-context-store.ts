/**
 * @openelement/app - Render-scoped data context store for loader/action data.
 *
 * Provides a per-render (request-scoped) stack consumed by the
 * useLoaderData / useActionData hooks. The stack lives on a `RenderDataContext`
 * object created at the render entry (ApplicationPageElement.render) and passed
 * explicitly through the push/pop functions. The public hooks read it via an
 * "active context" bridge that the render entry enters/exits around the
 * (synchronous) render.
 *
 * Design note (v0.42.0-alpha.9, #632): the previous implementation used a
 * module-level array, which allowed loader/action data to leak across requests
 * or to be read empty by a nested (non-page) component serialized outside a
 * page render. The context is now request-scoped and never shared globally.
 *
 * No AsyncLocalStorage / AsyncContext is used, so this stays compatible with
 * Deno Deploy, Cloudflare Workers and Node (locked decision for #632).
 */

export interface RenderDataContext {
  stack: { loaderData: unknown; actionData: unknown }[];
}

/** Create a fresh, empty render-scoped data context. */
export function createRenderDataContext(): RenderDataContext {
  return { stack: [] };
}

export const MAX_DATA_CONTEXT_DEPTH = 50;

export function pushLoaderData(ctx: RenderDataContext, data: unknown): void {
  if (ctx.stack.length >= MAX_DATA_CONTEXT_DEPTH) {
    throw new Error(
      `Data context stack overflow at depth ${MAX_DATA_CONTEXT_DEPTH} ` +
        '(possible recursive error renderer)',
    );
  }
  ctx.stack.push({ loaderData: data, actionData: undefined });
}

export function pushActionData(ctx: RenderDataContext, data: unknown): void {
  const top = ctx.stack[ctx.stack.length - 1];
  if (top) top.actionData = data;
}

export function popData(ctx: RenderDataContext): void {
  ctx.stack.pop();
}

export function currentLoaderData(ctx: RenderDataContext): unknown {
  return ctx.stack[ctx.stack.length - 1]?.loaderData;
}

export function currentActionData(ctx: RenderDataContext): unknown {
  return ctx.stack[ctx.stack.length - 1]?.actionData;
}

// ─── Active-context bridge for the public hooks ────────────────────────────
// useLoaderData / useActionData are called from user render code without an
// explicit context argument, so the render entry sets the active context for
// the duration of one (synchronous) render. This is an explicit slot, not a
// process-global, so two sequential renders never share data and a nested
// component serialized inside a render reads the current page's stack.

let _active: RenderDataContext | null = null;
const _nullContext: RenderDataContext = { stack: [] };
let _warnedOutsideRender = false;

/** @internal Enter a render-scoped data context. Called by the render entry. */
export function __enterDataContext(ctx: RenderDataContext): void {
  _active = ctx;
}

/** @internal Exit the active render-scoped data context. Called by the render entry. */
export function __exitDataContext(): void {
  _active = null;
}

function _devMode(): boolean {
  try {
    const deno = (globalThis as { Deno?: { env?: { get(k: string): string | undefined } } }).Deno;
    if (deno && typeof deno.env?.get === 'function') {
      return deno.env.get('DENO_ENV') !== 'production';
    }
  } catch (e) {
    /* anomaly only: Workers hit the `undefined Deno` branch above and never reach here */
    console.warn('[data-context-store] Unexpected error reading DENO_ENV, defaulting to non-dev mode', e);
  }
  return false;
}

/** @internal Resolve the currently active render-scoped data context. */
export function __activeDataContext(): RenderDataContext {
  if (_active) return _active;
  if (_devMode() && !_warnedOutsideRender) {
    _warnedOutsideRender = true;
    console.warn(
      '[app] useLoaderData/useActionData called outside of a page render scope; returning undefined. ' +
        'Loader/action data is only available during a page render.',
    );
  }
  return _nullContext;
}
