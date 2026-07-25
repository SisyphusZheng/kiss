/**
 * ./index.ts - Pure runtime.
 *
 * openElement is a static-first framework with a pure runtime core:
 * - Zero node:* imports - no filesystem, no process, no path
 * - Zero Vite dependency - no Plugin, no build orchestration
 * - Zero npm: specifiers - works in Deno, Node, Bun, Edge
 * - Pure Web Standard: URL, fetch, import.meta.url, console
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
  AppShellDefinition,
  ComponentLayer,
  FrameworkOptions,
  HydrateEventDescriptor,
  HydrationStrategy,
  IsrManifestEntry,
  LayoutsConfig,
  LocalePath,
  OpenElementApiContext,
  OpenElementBuildContextLike,
  OpenElementMiddleware,
  OpenElementMiddlewareContext,
  RegistryIndex,
  RegistryIndexEntry,
  RouteEntry,
  SafeHtml,
  SpecialFileType,
  StrategySource,
  UnsafeHtml,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from '../protocol/framework.ts';
export type { IslandDescriptor, SsrContext } from '../protocol/context.ts';

export {
  ERROR_PREFIX,
  ErrorCode,
  OpenElementError,
  PropValidationError,
  RenderError,
  reportError,
  setErrorTelemetryHook,
  SsrRenderError,
} from './errors.ts';
export type { ErrorPhase, ErrorSeverity, ErrorTelemetryHook } from '../protocol/errors.ts';
export { createSsrContext, extractParams, parseQuery } from './context.ts';
export { renderSsrError, wrapInDocument } from './html-escape.ts';
export { createIsrCacheKey, isIsrRouteConfig, MemoryIsrCache } from './isr.ts';
export type {
  CacheAdapter,
  CacheEntry,
  IsrCacheEntry,
  IsrCacheResult,
  IsrCacheState,
  IsrRouteConfig,
} from '../protocol/isr.ts';
export { findIsrManifestEntry, renderIsrResponse } from './isr-runtime.ts';
export type {
  IsrRuntimeOptions,
  IsrRuntimeRenderContext,
  IsrRuntimeRenderResult,
  IsrRuntimeResult,
  IsrRuntimeState,
} from './isr-runtime.ts';
export { StyleSheet } from './style-sheet.ts';
export type { StyleSheetLike, StyleSheetRule } from '../protocol/style-sheet.ts';
export { renderDsd } from './render-dsd.ts';
export type { RenderDsdOptions } from './render-dsd.ts';
export { camelToKebab, serializeAttrs } from './render-ir.ts';
export type {
  DomSimulationAttempt,
  DomSimulationReport,
  DsdBuildReport,
  DsdComponent,
  DsdComponentConstructor,
  DsdHydrationHintSummary,
  DsdHydrationStrategySummary,
  DsdMetricsSummary,
  DsdOptions,
  DsdPageDiagnostics,
  DsdRenderMetrics,
  HydrationHint,
  IsrRouteRecord,
  ManifestDecision,
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
  OpenElementExport,
  OpenElementExtensions,
  OpenElementModule,
  OpenElementPackageManifest,
  OpenElementSlot,
} from '../protocol/manifest.ts';
export type {
  CemCompatibilityReport,
  CompatibilityClassification,
  CompatibilityTier,
} from '../protocol/manifest.ts';
export { escapeAttr, escapeAttrValue, escapeHtml } from './html-escape.ts';
export {
  // v0.24.3: Neutral signal utilities — no template dependency
  isSignalLike,
  unwrapSignalLike,
} from '../signal/index.ts';
export type { SignalLike, Unsubscribe } from '../protocol/signal.ts';
export { consumeContext, type Context, createContext, provideContext } from './signal-context.ts';
export { createLogger } from './logger.ts';
export { assertValidTagName, isValidTagName } from './tag-utils.ts';
export { normalizeSeparators, pathToTagName } from './path-utils.ts';
export {
  bindSsrProps,
  defineCustomElement,
  defineIsland,
  getIslandMeta,
  getSsrProps,
} from './island.ts';
export type { IslandMeta, IslandOptions } from '../protocol/island.ts';
export { transformIslandSource } from './island-transform.ts';
export type { IslandTransformOptions, IslandTransformResult } from '../protocol/island.ts';

// Unified binding layer (ADR-0109 Phase 1)
export {
  applyBindingDescriptor,
  commitBindings,
  registerBindingKind,
} from './binding-activation.ts';
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
  DataAdapter,
  Loader,
  LoaderContext,
} from '../protocol/data.ts';

// WC Package Protocol (v0.17+)
export {
  clear as clearRegistry,
  generateIndex,
  getAll as getAllManifests,
  getByTagName,
  register as registerManifest,
  validate as validateManifest,
} from './registry.ts';
// v0.24.1 (ADR-0057): JSX + Signal component model
// VNode & jsx-runtime
export type { VNode } from '../protocol/vnode.ts';
export { isVNode } from './vnode.ts';
export { Fragment, trustedHtml } from './jsx-runtime.ts';
// Renderers
export { renderToDom } from './jsx-render-dom.ts';
export { renderDsdTree } from './render-ir.ts';
export {
  collectEventBindings,
  createEventMarkerContext,
  type EventBindingRecord,
  type EventMarkerContext,
  eventMarkerId,
  eventTypeFromProp,
  hydrateEventMarkers,
  serializeEventMarkers,
} from './event-hydration.ts';
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
