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
export type { Action, ActionContext, Loader, LoaderContext } from '@openelement/protocol/data';

// Re-export from @openelement/element for convenience
export { defineElement, defineLayout } from '@openelement/element';
export type { ElementDefinition } from '@openelement/element';
