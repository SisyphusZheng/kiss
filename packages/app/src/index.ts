export {
  defineIsland,
  defineIslandConfig,
  definePage,
  fail,
  isActionFailure,
  isOpenElementNotFound,
  isOpenElementRedirect,
  notFound,
  OpenElementActionFailure,
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
} from './authoring.ts';

// Re-export route data types from protocol for convenience
export type {
  Action,
  ActionContext,
  ActionResult,
  Loader,
  LoaderContext,
} from '@openelement/element';
export { ACTION_FETCH_HEADER } from '@openelement/element';

// Re-export from @openelement/element for convenience
export { defineElement } from '@openelement/element';
export type { ElementDefinition } from '@openelement/element';

// SPA bootstrap
export { defineApp } from './spa.ts';
export type { SpaAppInstance, SpaAppOptions } from './spa.ts';
export { useActionData, useLoaderData } from './internal/router/data-context.ts';

// OpenElement-owned application model
export { createRequestContext } from './model.ts';
export type { CreateRequestContextOptions, OpenElementRequestContext } from './model.ts';

// Official default request driver bridge
export { createHonoRequestContext } from './hono.ts';
export type { CreateHonoRequestContextOptions, HonoContextLike, HonoRequestLike } from './hono.ts';
