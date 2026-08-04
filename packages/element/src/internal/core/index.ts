/**
 * index.ts - Pure runtime.
 *
 * openElement is a static-first framework with a pure runtime core:
 * - Zero node:* imports - no filesystem, no process, no path
 * - Zero Vite dependency - no Plugin, no build orchestration
 * - Single chartered engine dependency: @preact/signals-core (the
 *   SignalEngine backing signal/computed/effect, see internal/signal/).
 *   Everything else resolves to Web Standards: URL, fetch, import.meta.url,
 *   console - so the runtime works in Deno, Node, Bun and Edge.
 *
 * Rendering: DSD (Declarative Shadow DOM) string concatenation
 * Islands: Custom Element registration + prop deserialization
 *
 * Build orchestration (Vite plugins) lives in @openelement/adapter-vite.
 * For the unified openElement() entry, use @openelement/adapter-vite.
 */

// --- Public API re-exports -----------------------------------------

export type {
  AppShellConfig,
  ComponentLayer,
  FrameworkOptions,
  HydrationStrategy,
  IsrManifestEntry,
  LocalePath,
  OpenElementBuildContextLike,
  RouteEntry,
  SafeHtml,
  SpecialFileType,
  StrategySource,
  UnsafeHtml,
} from '../protocol/framework.ts';

export {
  ERROR_PREFIX,
  ErrorCode,
  OpenElementError,
  RenderError,
  reportError,
  setErrorTelemetryHook,
  SsrRenderError,
} from './errors.ts';
export type { ErrorPhase, ErrorSeverity, ErrorTelemetryHook } from '../protocol/errors.ts';
export { wrapInDocument } from './html-escape.ts';
export { createIsrCacheKey } from './isr.ts';
export type { CacheAdapter, CacheEntry, IsrCacheEntry, IsrCacheResult } from '../protocol/isr.ts';
export { StyleSheet } from './style-sheet.ts';
export type { StyleSheetLike, StyleSheetRule } from '../protocol/style-sheet.ts';
export { renderDsd } from './render-dsd.ts';
export type { RenderDsdOptions } from './render-dsd.ts';
export { serializeAttrs } from './render-ir.ts';
export { camelToKebab } from './tag-utils.ts';
export type {
  DsdComponent,
  DsdComponentConstructor,
  DsdOptions,
  DsdRenderMetrics,
  HydrationHint,
  RenderErrorCode,
  RenderHooks,
  RenderInput,
  RenderOutput,
  RenderPhase,
  SsrAdmissionDecision,
} from '../protocol/render.ts';
export type {
  OpenElementAttribute,
  OpenElementCssPart,
  OpenElementDeclaration,
  OpenElementEvent,
  OpenElementPackageManifest,
  OpenElementSlot,
} from '../protocol/manifest.ts';
export type {
  CemCompatibilityReport,
  CompatibilityClassification,
  CompatibilityTier,
} from '../protocol/manifest.ts';
export { escapeAttr, escapeAttrValue, escapeHtml } from './html-escape.ts';
export type { SignalLike, Unsubscribe } from '../protocol/signal.ts';
export { consumeContext, type Context, createContext, provideContext } from './signal-context.ts';
export { createLogger } from './logger.ts';
export { assertValidTagName, isValidTagName } from './tag-utils.ts';
export { normalizeSeparators, pathToTagName } from './path-utils.ts';
export { bindSsrProps, defineCustomElement, defineIsland, getSsrProps } from './island.ts';
export type { IslandOptions } from '../protocol/island.ts';
export { transformIslandSource } from './island-transform.ts';
export type { IslandTransformOptions, IslandTransformResult } from '../protocol/island.ts';

// Unified binding layer (ADR-0109 Phase 1)
export { applyBindingDescriptor, commitBindings } from './binding-activation.ts';
export {
  bindAttr,
  bindClass,
  bindConditional,
  bindEvent,
  bindHtml,
  bindList,
  bindRef,
  bindRender,
  bindStaticAttr,
  bindStaticBoolean,
  bindStaticProp,
  bindStaticStyle,
  bindText,
} from './binding-descriptor.ts';
export type {
  BindingDescriptor,
  BindingDispose,
  BindingLifecycle,
  BindingRenderer,
} from './binding-descriptor.ts';

// Data adapters — type contract surface only (ADR-0095)
export type {
  Action,
  ActionContext,
  Loader,
  LoaderContext,
  SpaAction,
  SpaActionContext,
  SpaLoader,
  SpaLoaderContext,
} from '../protocol/data.ts';

// v0.24.1 (ADR-0057): JSX + Signal component model
// VNode & jsx-runtime
export type { VNode } from '../protocol/vnode.ts';
export { isVNode } from './vnode.ts';
export { Fragment, trustedHtml } from './jsx-runtime.ts';
// Renderers
export { renderToDom } from './jsx-render-dom.ts';
export { renderDsdTree } from './render-ir.ts';
export {
  createEventMarkerContext,
  type EventMarkerContext,
  eventMarkerId,
  eventTypeFromProp,
  serializeEventMarkers,
} from './event-marker.ts';
export {
  collectEventBindings,
  type EventBindingRecord,
  hydrateEventMarkers,
} from './event-hydration.ts';
export { hasSelfHydrated, HydrationScope, markSelfHydrated } from './hydration-scope.ts';
// static props runtime
export {
  disposeStaticProps,
  handleStaticPropAttributeChange,
  initializeStaticProps,
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
