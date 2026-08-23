import { ERROR_PREFIX } from '@openelement/element';
/**
 * @openelement/app - JSX-first application authoring API.
 *
 * This file is intentionally free of Vite/build imports. Route modules can
 * import from @openelement/app without pulling adapter-vite into the runtime
 * graph.
 */

import {
  collectPublicProps,
  defineElement,
  type ElementDefinition,
  OpenElement,
  OpenElementError,
  type VNode,
} from '@openelement/element';
import { defineIsland as defineRuntimeIsland, HYDRATION_STRATEGIES } from '@openelement/element';
import {
  __enterDataContext,
  __exitDataContext,
  createRenderDataContext,
  popData,
  pushActionData,
  pushLoaderData,
  type RenderDataContext,
} from './internal/router/data-context-store.ts';
import type { HydrationStrategy } from '@openelement/element';
import type { PageHostElement } from './internal/page-host-data.ts';

/**
 * Where a page renders (#609, ADR-0123):
 * - `'static'` (default when renderIntent.mode is unset): prerendered at
 *   build time by SSG; pages exporting an action must NOT use this mode —
 *   the build rejects prerendered action pages (ADR-0120).
 * - `'dynamic'`: skipped by prerendering and rendered per request through
 *   the generated `dist/server` entry, running the route loader on every
 *   request.
 *
 * The former `'auto'` value collapsed into `'static'`: it never had distinct
 * behavior — an unset or `'auto'` mode always meant prerender-at-build.
 */
type PageRenderingMode = 'static' | 'dynamic';
/**
 * @experimental ISR is not active in 0.42 (see `docs/current/VERSION_PLAN.md`).
 * `revalidate` is recorded on the route but does NOT enable caching in this
 * release line; it is reserved for the 0.44 ISR work. Treat it as unstable.
 */
type PageRevalidate = false | number | `${number}s` | `${number}m` | `${number}h`;
export type PageMeta = Record<string, unknown>;

interface PageRouteIntent {
  path?: string;
  id?: string;
  params?: readonly string[];
}

interface PageRenderIntent {
  mode?: PageRenderingMode;
  /** @experimental ISR is not wired in 0.42; recorded but inactive (0.44 target). */
  revalidate?: PageRevalidate;
}

interface NormalizedPageRenderIntent {
  mode: PageRenderingMode;
  /** @experimental ISR is not wired in 0.42; recorded but inactive (0.44 target). */
  revalidate: PageRevalidate;
}

export interface PageRouteContext {
  path?: string;
  filePath?: string;
}

const REDIRECT_STATUSES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308]);

export class OpenElementRedirect extends OpenElementError {
  readonly location: string;
  readonly status: number;

  constructor(location: string | URL, status = 302) {
    // ADR-0121 §3: only real redirect statuses — a non-3xx "redirect" is a
    // response the browser never follows, silently stranding the mutation.
    if (!REDIRECT_STATUSES.has(status)) {
      throw new OpenElementError(
        `${ERROR_PREFIX} redirect() status must be one of 301/302/303/307/308 (got ${status}). ` +
          'In the POST action context every 3xx is coerced to 303 (PRG).',
        { code: 'INVALID_REDIRECT_STATUS', phase: 'validation' },
      );
    }
    super(`Redirect to ${String(location)}`, {
      code: 'REDIRECT',
      severity: 'error',
      phase: 'navigation',
      recoverable: false,
      statusCode: status,
    });
    this.name = 'OpenElementRedirect';
    this.location = String(location);
    this.status = status;
  }
}

export class OpenElementNotFound extends OpenElementError {
  readonly status = 404;

  constructor(message = 'Not Found') {
    super(message, {
      code: 'NOT_FOUND',
      severity: 'error',
      phase: 'navigation',
      recoverable: false,
      statusCode: 404,
    });
    this.name = 'OpenElementNotFound';
  }
}

export function redirect(location: string | URL, status = 302): never {
  throw new OpenElementRedirect(location, status);
}

export function notFound(message = 'Not Found'): never {
  throw new OpenElementNotFound(message);
}

export function isOpenElementRedirect(error: unknown): error is OpenElementRedirect {
  return error instanceof OpenElementRedirect ||
    (
      typeof error === 'object' &&
      error !== null &&
      (error as { name?: unknown }).name === 'OpenElementRedirect' &&
      typeof (error as { location?: unknown }).location === 'string' &&
      typeof (error as { status?: unknown }).status === 'number' &&
      // ADR-0121 (#583): the duck-typed branch honors the same whitelist —
      // a shaped object must not smuggle an arbitrary status into the
      // redirect channel.
      REDIRECT_STATUSES.has((error as { status: number }).status)
    );
}

export function isOpenElementNotFound(error: unknown): error is OpenElementNotFound {
  return error instanceof OpenElementNotFound ||
    (
      typeof error === 'object' &&
      error !== null &&
      (error as { name?: unknown }).name === 'OpenElementNotFound' &&
      typeof (error as { status?: unknown }).status === 'number' &&
      (error as { status: number }).status === 404
    );
}

/**
 * Expected-failure channel for actions (0.42.0-alpha.2, ADR-0120): validation
 * failures RETURN `fail(status, data)` — never throw — so the server can
 * answer 422 with the form re-rendered and the submitted values echoed back.
 * Thrown values keep the exception channel (redirect/notFound/error page).
 */
export class OpenElementActionFailure<Data = unknown> {
  readonly name = 'OpenElementActionFailure';
  readonly status: number;
  readonly data: Data;

  constructor(status: number, data: Data) {
    if (status < 400 || status > 499) {
      throw new OpenElementError(
        `${ERROR_PREFIX} fail() status must be a 4xx code (got ${status}); ` +
          'validation failures are client errors, use 400/422.',
        { code: 'INVALID_FAIL_STATUS', phase: 'validation' },
      );
    }
    this.status = status;
    this.data = data;
  }
}

export function fail<Data>(status: number, data: Data): OpenElementActionFailure<Data> {
  return new OpenElementActionFailure(status, data);
}

export function isActionFailure(error: unknown): error is OpenElementActionFailure {
  return error instanceof OpenElementActionFailure ||
    (
      typeof error === 'object' &&
      error !== null &&
      (error as { name?: unknown }).name === 'OpenElementActionFailure' &&
      typeof (error as { status?: unknown }).status === 'number' &&
      'data' in (error as Record<string, unknown>)
    );
}

interface PageHead {
  title?: string;
  description?: string;
  meta?: Array<Record<string, string | number | boolean>>;
  dangerouslyHeadFragments?: string[];
}

interface PageRenderContext<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> {
  data: Data;
  params: Params;
  request?: Request;
  route: PageRouteContext;
  meta: PageMeta;
  props: Record<string, unknown>;
}

interface PageErrorContext<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> extends PageRenderContext<Data, Params> {
  error: unknown;
}

type PageRenderFunction<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> = (context: PageRenderContext<Data, Params>) => VNode | null;

type PageErrorFunction<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> = (context: PageErrorContext<Data, Params>) => VNode | null;

interface PageDefinition<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> {
  route?: PageRouteIntent;
  head?: PageHead;
  renderIntent?: PageRenderIntent;
  render: PageRenderFunction<Data, Params>;
  error?: PageErrorFunction<Data, Params>;
}

interface OpenElementPageDescriptor<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> extends Omit<PageDefinition<Data, Params>, 'render' | 'renderIntent'> {
  kind: 'page';
  renderIntent: NormalizedPageRenderIntent;
  render: PageRenderFunction<Data, Params>;
}

abstract class ApplicationPageElement extends OpenElement implements PageHostElement {
  __openElementParams?: Record<string, string>;
  __openElementData?: unknown;
  data?: unknown;
  __openElementActionData?: unknown;
  __openElementRequest?: Request;
  __openElementRoute?: PageRouteContext;
  __openElementMeta?: PageMeta;
  __openElementError?: unknown;
  __openElementRenderDataContext?: RenderDataContext;

  __openElementEvaluateRender<T>(render: () => T): T {
    const context = this.__openElementRenderDataContext;
    if (!context) return render();
    __enterDataContext(context);
    try {
      return render();
    } finally {
      __exitDataContext();
    }
  }

  __openElementDisposeRenderDataContext(): void {
    const context = this.__openElementRenderDataContext;
    if (!context) return;
    popData(context);
    this.__openElementRenderDataContext = undefined;
  }
}

type PageConstructor<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> = typeof OpenElement & {
  openElementPage: OpenElementPageDescriptor<Data, Params>;
};

const PAGE_DESCRIPTOR_FIELDS = new Set([
  'route',
  'head',
  'renderIntent',
  'render',
  'error',
]);

const ISLAND_CONFIG_FIELDS = new Set(['ssr', 'dsd', 'hydrate']);
const HYDRATION_STRATEGY_SET: ReadonlySet<string> = new Set(HYDRATION_STRATEGIES);

function assertCanonicalPageDefinition(input: unknown): asserts input is PageDefinition {
  if (typeof input === 'function') {
    throw new Error(
      `${ERROR_PREFIX} definePage() requires a canonical object descriptor. ` +
        'Use definePage({ route, head, renderIntent, render, error }).',
    );
  }
  if (typeof input !== 'object' || input === null) {
    throw new Error(`${ERROR_PREFIX} definePage() requires an object descriptor.`);
  }
  for (const key of Object.keys(input)) {
    if (PAGE_DESCRIPTOR_FIELDS.has(key)) continue;
    throw new Error(
      `${ERROR_PREFIX} definePage() does not accept top-level "${key}". ` +
        'Use only route, head, renderIntent, render, and error.',
    );
  }
  if (typeof (input as { render?: unknown }).render !== 'function') {
    throw new Error(`${ERROR_PREFIX} definePage() descriptor requires a render() function.`);
  }
}

/**
 * Define a file-route page.
 *
 * The returned class is an OpenElement-compatible custom element constructor, so
 * the existing renderer pipeline remains unchanged while app authors write JSX
 * functions instead of class components.
 */
export function definePage<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
>(
  input: PageDefinition<Data, Params>,
): PageConstructor<Data, Params> {
  assertCanonicalPageDefinition(input);
  const definition = input;
  // ADR-0121 (#572): validate the mode at definition time — a typo like
  // 'dynmaic' must not silently prerender a request-time page.
  const renderMode = definition.renderIntent?.mode ?? 'static';
  if (renderMode !== 'static' && renderMode !== 'dynamic') {
    throw new Error(
      `${ERROR_PREFIX} renderIntent.mode must be 'static' or 'dynamic' ` +
        `(got "${String(definition.renderIntent?.mode)}").`,
    );
  }
  const pageDescriptor = {
    kind: 'page',
    ...definition,
    renderIntent: {
      mode: renderMode,
      revalidate: definition.renderIntent?.revalidate ?? false,
    },
  } as OpenElementPageDescriptor<Data, Params>;

  class OpenElementPage extends ApplicationPageElement {
    static openElementPage = pageDescriptor;

    override render(): VNode | null {
      // Provide loader/action data to hooks (useLoaderData / useActionData).
      // The stack is request-scoped. The element renderer calls the evaluator
      // below around every deferred function component / For callback, so the
      // context covers complete VNode evaluation without staying globally
      // active across an await (#1126).
      this.__openElementDisposeRenderDataContext();
      const dataCtx = createRenderDataContext();
      const loaderData = this.__openElementData !== undefined ? this.__openElementData : this.data;
      pushLoaderData(dataCtx, loaderData);
      pushActionData(dataCtx, this.__openElementActionData);
      this.__openElementRenderDataContext = dataCtx;
      try {
        const params = (this.__openElementParams ?? this.params ?? {}) as Params;
        const data = loaderData as Data;
        const context = {
          data,
          params,
          request: this.__openElementRequest,
          route: this.__openElementRoute ?? {},
          meta: this.__openElementMeta ?? {},
          props: collectPublicProps(this),
        };

        return this.__openElementEvaluateRender(() =>
          this.__openElementError !== undefined && definition.error
            ? definition.error({ ...context, error: this.__openElementError })
            : definition.render(context)
        );
      } catch (error) {
        this.__openElementDisposeRenderDataContext();
        throw error;
      }
    }
  }

  return OpenElementPage;
}

interface IslandConfig {
  ssr?: boolean;
  dsd?: boolean;
  /**
   * Hydration strategy — same values as `IslandOptions.hydrate` on the
   * element package (`packages/element/src/internal/protocol/island.ts`):
   * 'load' | 'idle' | 'visible' | 'only'.
   */
  hydrate?: HydrationStrategy;
}

export function defineIslandConfig(config: IslandConfig): IslandConfig {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new Error(`${ERROR_PREFIX} defineIslandConfig() requires an object descriptor.`);
  }
  for (const key of Object.keys(config)) {
    if (!ISLAND_CONFIG_FIELDS.has(key)) {
      throw new Error(
        `${ERROR_PREFIX} defineIslandConfig() does not accept "${key}". ` +
          'Use only ssr, dsd, and hydrate.',
      );
    }
  }
  if (config.hydrate !== undefined && !HYDRATION_STRATEGY_SET.has(config.hydrate)) {
    throw new Error(
      `${ERROR_PREFIX} Invalid island hydrate strategy "${String(config.hydrate)}". ` +
        'Use one of: load, idle, visible, only.',
    );
  }
  return { ...config };
}

export function defineIsland<Props extends Record<string, unknown> = Record<string, unknown>>(
  tagName: string,
  input: ((props: Props) => VNode | null) | ElementDefinition<Props> | CustomElementConstructor,
  options: IslandConfig = {},
): CustomElementConstructor {
  const componentClass = typeof input === 'function' && input.prototype?.render
    ? input as CustomElementConstructor
    : defineElement(tagName, input as ((props: Props) => VNode | null) | ElementDefinition<Props>);
  return defineRuntimeIsland(tagName, componentClass, {
    hydrate: options.hydrate,
    dsd: options.dsd,
    ssr: options.ssr,
  });
}
