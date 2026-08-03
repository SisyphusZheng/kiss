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
  ProblemDetails,
  SpaAction,
  SpaActionContext,
  SpaLoader,
  SpaLoaderContext,
} from '@openelement/element';
export { ACTION_FETCH_HEADER, PROBLEM_JSON_MEDIA_TYPE } from '@openelement/element';

// Re-export from @openelement/element for convenience
export { defineElement } from '@openelement/element';
export type { ElementDefinition } from '@openelement/element';

// SPA bootstrap
export { defineApp } from './spa.ts';
export type { SpaAppInstance, SpaAppOptions } from './spa.ts';
export { useActionData, useLoaderData } from './internal/router/data-context.ts';

// OpenElement-owned request context contract and convenience constructor.
// This is the single canonical RequestContext authority. Adapters build it
// from their own request event:
//   - adapter-vite's Nitro integration (nitro-mount.ts) re-implements the
//     shape inline (createNitroRequestContext) because generated Nitro server
//     output must stay free of unresolved bare package imports; the type-only
//     import in nitro-mount pins it to this contract.
// The historical Hono driver bridge (createHonoRequestContext) was removed:
// it had zero production consumers and left the "official default request
// driver bridge" API as an empty shell (🟡-F).
export { createRequestContext } from './model.ts';
export type { CreateRequestContextOptions, OpenElementRequestContext } from './model.ts';
