import { ERROR_PREFIX } from '@openelement/core';
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
import { defineIsland as defineRuntimeIsland } from '@openelement/core';
import { __internal_setActionData, __internal_setLoaderData } from '@openelement/router';
import type { HydrationStrategy } from '@openelement/core';

export type PageRenderingMode = 'auto' | 'static' | 'dynamic';
export type PageStreamingMode = 'auto' | 'force' | false;
export type PageRevalidate = false | number | `${number}s` | `${number}m` | `${number}h`;
export type PageMeta = Record<string, unknown>;

export interface PageRouteIntent {
  path?: string;
  id?: string;
  params?: readonly string[];
}

export interface PageRenderIntent {
  mode?: PageRenderingMode;
  streaming?: PageStreamingMode;
  revalidate?: PageRevalidate;
}

export interface NormalizedPageRenderIntent {
  mode: PageRenderingMode;
  streaming: PageStreamingMode;
  revalidate: PageRevalidate;
}

export interface PageRouteContext {
  path?: string;
  filePath?: string;
}

export class OpenElementRedirect extends Error {
  readonly location: string;
  readonly status: number;

  constructor(location: string | URL, status = 302) {
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
      (error as { status?: unknown }).status === 404
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

type PageHostProps = {
  __openElementParams?: Record<string, string>;
  data?: unknown;
  __openElementActionData?: unknown;
  __openElementRequest?: Request;
  __openElementRoute?: PageRouteContext;
  __openElementMeta?: PageMeta;
  __openElementError?: unknown;
};

abstract class ApplicationElement extends OpenElement {
  [key: string]: unknown;
}

abstract class ApplicationPageElement extends ApplicationElement implements PageHostProps {
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

function collectPublicProps(host: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const key of Object.keys(host)) {
    if (key.startsWith('__openElement')) continue;
    props[key] = host[key];
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
const HYDRATION_STRATEGIES = new Set(['load', 'idle', 'visible', 'only']);

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
 * The returned class is a DsdElement-compatible custom element constructor, so
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
  const pageDescriptor = {
    kind: 'page',
    ...definition,
    renderIntent: {
      mode: definition.renderIntent?.mode ?? 'auto',
      streaming: definition.renderIntent?.streaming ?? 'auto',
      revalidate: definition.renderIntent?.revalidate ?? false,
    },
  } as OpenElementPageDescriptor<Data, Params>;

  class OpenElementPage extends ApplicationPageElement {
    static openElementPage = pageDescriptor;

    override render(): VNode | null {
      // Provide loader/action data to hooks (useLoaderData / useActionData)
      __internal_setLoaderData(this.data);
      __internal_setActionData(this.__openElementActionData);

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
  if (config.hydrate !== undefined && !HYDRATION_STRATEGIES.has(config.hydrate)) {
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
