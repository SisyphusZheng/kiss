/**
 * @openelement/core/static - SSR/SSG runtime surface.
 *
 * Pure static rendering entry point. Contains everything needed to create
 * VNodes and render them to DSD/HTML strings, without pulling in any DOM
 * binding, effect, or hydration code.
 *
 * ADR-0109 Phase 1: split @openelement/core into static, hydrate, and csr.
 */

// VNode / JSX runtime
export type { VNode } from '@openelement/protocol/vnode';
export { isVNode } from './vnode.ts';
export { For, Fragment, jsx, jsxDEV, jsxs, Show, trustedHtml } from './jsx-runtime.ts';

// Static rendering (IR + DSD)
export { camelToKebab, renderDsdTree, serializeAttrs } from './render-ir.ts';
export { renderDsd } from './render-dsd.ts';
export { createRenderDsdStreamMetrics, renderDsdStream } from './render-dsd-stream.ts';
export type {
  RenderDsdStreamChunk,
  RenderDsdStreamComponent,
  RenderDsdStreamMetrics,
  RenderDsdStreamOptions,
} from './render-dsd-stream.ts';
export type { RenderDsdOptions } from './render-dsd.ts';

// HTML escaping / document wrapping
export {
  escapeAttr,
  escapeAttrValue,
  escapeHtml,
  renderSsrError,
  wrapInDocument,
} from './html-escape.ts';
export type { SafeHtml, UnsafeHtml } from '@openelement/protocol/framework';

// Security / errors / logging
export { DANGEROUS_KEYS } from './security.ts';
export {
  ERROR_PREFIX,
  ErrorCode,
  formatError,
  OpenElementError,
  PropValidationError,
  RenderError,
  reportError,
  setErrorTelemetryHook,
  SsrRenderError,
} from './errors.ts';
export type { ErrorPhase, ErrorSeverity, ErrorTelemetryHook } from '@openelement/protocol/errors';
export { createLogger } from './logger.ts';

// Static props runtime
export {
  disposeStaticProps,
  handleStaticPropAttributeChange,
  initializeStaticProps,
  normalizePropDecl,
  registerStaticObservedAttributes,
  syncStaticPropsFromAttributes,
  unwrap,
} from './prop.ts';
export type {
  NormalizedPropDecl,
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from '@openelement/protocol/prop';

// Signal utilities (neutral, no DOM)
export { isSignalLike, unwrapSignalLike } from '@openelement/signal';
export type { SignalLike, Unsubscribe } from '@openelement/protocol/signal';

// Context / request helpers
export { createSsrContext, extractParams, parseQuery } from './context.ts';
export type { IslandDescriptor, SsrContext } from '@openelement/protocol/context';
export { consumeContext, createContext, provideContext } from './signal-context.ts';
export type { Context } from './signal-context.ts';

// Misc static utilities
export { isValidTagName } from './tag-utils.ts';
export { StyleSheet } from './style-sheet.ts';
export type { StyleSheetLike, StyleSheetRule } from '@openelement/protocol/style-sheet';

// Event marker serialization (used by SSR; hydration lives in hydrate.ts)
export {
  createEventMarkerContext,
  eventMarkerId,
  eventTypeFromProp,
  serializeEventMarkers,
} from './event-marker.ts';
export type { EventMarkerContext } from './event-marker.ts';
