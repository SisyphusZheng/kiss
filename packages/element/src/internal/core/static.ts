/**
 * ./static.ts - SSR/SSG runtime surface.
 *
 * Pure static rendering entry point. Contains everything needed to create
 * VNodes and render them to DSD/HTML strings, without pulling in any DOM
 * binding, effect, or hydration code.
 *
 * ADR-0109 Phase 1: split ./index.ts into static, hydrate, and csr.
 * (csr.ts has since been removed; only the static and hydrate surfaces
 * remain.)
 */

// VNode / JSX runtime
export type { VNode } from '../protocol/vnode.ts';
export { isVNode } from './vnode.ts';
export { For, Fragment, jsx, jsxDEV, jsxs, Show, trustedHtml } from './jsx-runtime.ts';

// Static rendering (IR + DSD)
export { camelToKebab, renderDsdTree, serializeAttrs } from './render-ir.ts';
export { renderDsd } from './render-dsd.ts';
export type { RenderDsdOptions } from './render-dsd.ts';

// HTML escaping / document wrapping
export {
  escapeAttr,
  escapeAttrValue,
  escapeHtml,
  wrapInDocument,
} from './html-escape.ts';
export type { SafeHtml, UnsafeHtml } from '../protocol/framework.ts';

// Security / errors / logging
/** @internal — use ./security.ts subpath */
export { DANGEROUS_KEYS } from './security.ts';
export {
  ERROR_PREFIX,
  ErrorCode,
  formatError,
  OpenElementError,
  RenderError,
  reportError,
  setErrorTelemetryHook,
  SsrRenderError,
} from './errors.ts';
export type { ErrorPhase, ErrorSeverity, ErrorTelemetryHook } from '../protocol/errors.ts';
export { createLogger } from './logger.ts';

// Static props runtime
export {
  disposeStaticProps,
  handleStaticPropAttributeChange,
  initializeStaticProps,
  normalizePropDecl,
  syncStaticPropsFromAttributes,
} from './prop.ts';
export type {
  NormalizedPropDecl,
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from '../protocol/prop.ts';

// Signal utilities (neutral, no DOM)
export { isSignalLike, unwrapSignalLike } from '../signal/index.ts';
export type { SignalLike, Unsubscribe } from '../protocol/signal.ts';

// Context / request helpers
export { createSsrContext, extractParams, parseQuery } from './context.ts';
export type { IslandDescriptor, SsrContext } from '../protocol/context.ts';
export { consumeContext, createContext, provideContext } from './signal-context.ts';
export type { Context } from './signal-context.ts';

// Misc static utilities
export { assertValidTagName, isValidTagName } from './tag-utils.ts';
export { normalizeSeparators, pathToTagName } from './path-utils.ts';
export { StyleSheet } from './style-sheet.ts';
export type { StyleSheetLike, StyleSheetRule } from '../protocol/style-sheet.ts';

// Event marker serialization (used by SSR; hydration lives in hydrate.ts)
export {
  createEventMarkerContext,
  eventMarkerId,
  eventTypeFromProp,
  serializeEventMarkers,
} from './event-marker.ts';
export type { EventMarkerContext } from './event-marker.ts';
