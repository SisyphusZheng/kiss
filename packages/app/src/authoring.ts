import { ERROR_PREFIX } from '@openelement/element';
/**
 * @openelement/app - JSX-first application authoring API.
 *
 * This file is intentionally free of Vite/build imports. Route modules can
 * import from @openelement/app without pulling adapter-vite into the runtime
 * graph.
 */

import {
  defineElement,
  type ElementDefinition,
  OpenElement,
  type VNode,
} from '@openelement/element';
import { defineIsland as defineRuntimeIsland, HYDRATION_STRATEGIES } from '@openelement/element';
import {
  popData,
  pushActionData,
  pushLoaderData,
} from './internal/router/internal/data-context.ts';
import type { HydrationStrategy } from '@openelement/element';
import type { PageHostElement } from './internal/page-host-data.ts';

export type PageRenderingMode = 'auto' | 'static' | 'dynamic';
export type PageRevalidate = false | number | `${number}s` | `${number}m` | `${number}h`;
export type PageMeta = Record<string, unknown>;

export interface PageRouteIntent {
  path?: string;
  id?: string;
  params?: readonly string[];
}

export interface PageRenderIntent {
  mode?: PageRenderingMode;
  revalidate?: PageRevalidate;
}

export interface NormalizedPageRenderIntent {
  mode: PageRenderingMode;
  revalidate: PageRevalidate;
}

export interface PageRouteContext {
  path?: string;
  filePath?: string;
}

const REDIRECT_STATUSES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308]);

export class OpenElementRedirect extends Error {
  readonly location: string;
  readonly status: number;

  constructor(location: string | URL, status = 302) {
    // ADR-0121 §3: only real redirect statuses — a non-3xx "redirect" is a
    // response the browser never follows, silently stranding the mutation.
    if (!REDIRECT_STATUSES.has(status)) {
      throw new Error(
        `${ERROR_PREFIX} redirect() status must be one of 301/302/303/307/308 (got ${status}). ` +
          'In the POST action context every 3xx is coerced to 303 (PRG).',
      );
    }
    super(`Redirect to ${String(location)}`);
    this.name = 'OpenElementRedirect';
    this.location = String(location);
    this.status = status;
  }
}

export class OpenElementNotFound extends Error {
  readonly status = 404;

  constructor(message = 'Not Found') {
    super(message);
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
      typeof (error as { status?: unknown }).status === 'number'
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
      throw new Error(
        `${ERROR_PREFIX} fail() status must be a 4xx code (got ${status}); ` +
          'validation failures are client errors, use 400/422.',
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

export interface PageHead {
  title?: string;
  description?: string;
  meta?: Array<Record<string, string | number | boolean>>;
  dangerouslyHeadFragments?: string[];
}

export interface PageRenderContext<
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

export interface PageErrorContext<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> extends PageRenderContext<Data, Params> {
  error: unknown;
}

export type PageRenderFunction<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> = (context: PageRenderContext<Data, Params>) => VNode | null;

export type PageErrorFunction<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> = (context: PageErrorContext<Data, Params>) => VNode | null;

export interface PageDefinition<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> {
  route?: PageRouteIntent;
  head?: PageHead;
  renderIntent?: PageRenderIntent;
  render: PageRenderFunction<Data, Params>;
  error?: PageErrorFunction<Data, Params>;
}

export interface OpenElementPageDescriptor<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> extends Omit<PageDefinition<Data, Params>, 'render' | 'renderIntent'> {
  kind: 'page';
  renderIntent: NormalizedPageRenderIntent;
  render: PageRenderFunction<Data, Params>;
}

abstract class ApplicationPageElement extends OpenElement implements PageHostElement {
  __openElementParams?: Record<string, string>;
  data?: unknown;
  __openElementActionData?: unknown;
  __openElementRequest?: Request;
  __openElementRoute?: PageRouteContext;
  __openElementMeta?: PageMeta;
  __openElementError?: unknown;
}

type PageConstructor<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> = typeof OpenElement & {
  openElementPage: OpenElementPageDescriptor<Data, Params>;
};

function collectPublicProps(host: object): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const key of Object.keys(host)) {
    if (key.startsWith('__openElement')) continue;
    props[key] = Reflect.get(host, key);
  }
  return props;
}

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
  const renderMode = definition.renderIntent?.mode ?? 'auto';
  if (renderMode !== 'auto' && renderMode !== 'static' && renderMode !== 'dynamic') {
    throw new Error(
      `${ERROR_PREFIX} renderIntent.mode must be 'auto', 'static' or 'dynamic' ` +
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
      // Provide loader/action data to hooks (useLoaderData / useActionData)
      pushLoaderData(this.data);
      pushActionData(this.__openElementActionData);

      try {
        const params = (this.__openElementParams ?? this.params ?? {}) as Params;
        const data = this.data as Data;
        const context = {
          data,
          params,
          request: this.__openElementRequest,
          route: this.__openElementRoute ?? {},
          meta: this.__openElementMeta ?? {},
          props: collectPublicProps(this),
        };

        if (this.__openElementError !== undefined && definition.error) {
          return definition.error({ ...context, error: this.__openElementError });
        }

        return definition.render(context);
      } finally {
        popData();
      }
    }
  }

  return OpenElementPage;
}

export interface IslandConfig {
  ssr?: boolean;
  dsd?: boolean;
  hydrate?: HydrationStrategy;
}

export type AppIslandOptions = IslandConfig;

export type IslandConfigType = IslandConfig;

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
  options: AppIslandOptions = {},
): CustomElementConstructor {
  const componentClass = typeof input === 'function' && input.prototype?.render
    ? input as CustomElementConstructor
    : defineElement(tagName, input as ((props: Props) => VNode | null) | ElementDefinition<Props>);
  return defineRuntimeIsland(tagName, componentClass, {
    strategy: options.hydrate,
    dsd: options.dsd,
    ssr: options.ssr,
  });
}
