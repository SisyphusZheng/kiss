export {
  defineIsland,
  defineIslandConfig,
  definePage,
  isOpenElementNotFound,
  isOpenElementRedirect,
  notFound,
  OpenElementNotFound,
  OpenElementRedirect,
  redirect,
} from './authoring.ts';
export type {
  AppIslandOptions,
  IslandConfig,
  NormalizedPageRenderIntent,
  OpenElementPageDescriptor,
  PageDefinition,
  PageErrorContext,
  PageErrorFunction,
  PageHead,
  PageMeta,
  PageRenderContext,
  PageRenderFunction,
  PageRenderingMode,
  PageRenderIntent,
  PageRevalidate,
  PageRouteContext,
  PageRouteIntent,
  PageStreamingMode,
} from './authoring.ts';

// Re-export route data types from protocol for convenience
export type { Action, ActionContext, Loader, LoaderContext } from '@openelement/element';

// Re-export from @openelement/element for convenience
export { defineElement, defineLayout } from '@openelement/element';
export type { ElementDefinition } from '@openelement/element';

// SPA bootstrap
export { defineApp } from './spa.ts';
export type { SpaAppInstance, SpaAppOptions } from './spa.ts';
export type { RouteConfig, RouterInstance, RouterMode } from './internal/router/client-router.ts';
export { useActionData, useLoaderData } from './internal/router/data-context.ts';

// OpenElement-owned application model
export { createRequestContext } from './model.ts';
export type { CreateRequestContextOptions, OpenElementRequestContext } from './model.ts';

// Official default request driver bridge
export { createHonoRequestContext } from './hono.ts';
export type { CreateHonoRequestContextOptions, HonoContextLike, HonoRequestLike } from './hono.ts';
