/**
 * @openelement/core - Pure runtime.
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
  OpenElementRenderer,
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
} from '@openelement/protocol/framework';
export type { IslandDescriptor, SsrContext } from '@openelement/protocol/context';

export {
  ERROR_PREFIX,
  ErrorCode,
  OpenElementError,
  PropValidationError,
  RenderError,
  reportError,
  setErrorTelemetryHook,
  SsrRenderError,
} from './errors.js';
export type { ErrorPhase, ErrorSeverity, ErrorTelemetryHook } from '@openelement/protocol/errors';
export { createSsrContext, extractParams, parseQuery } from './context.js';
export { renderSsrError, wrapInDocument } from './html-escape.js';
export { createIsrCacheKey, isIsrRouteConfig, MemoryIsrCache } from './isr.js';
export type {
  CacheAdapter,
  CacheEntry,
  IsrCacheEntry,
  IsrCacheResult,
  IsrCacheState,
  IsrRouteConfig,
} from '@openelement/protocol/isr';
export { findIsrManifestEntry, renderIsrResponse } from './isr-runtime.js';
export type {
  IsrRuntimeOptions,
  IsrRuntimeRenderContext,
  IsrRuntimeRenderResult,
  IsrRuntimeResult,
  IsrRuntimeState,
} from './isr-runtime.js';
export { StyleSheet } from './style-sheet.js';
export type { StyleSheetLike, StyleSheetRule } from '@openelement/protocol/style-sheet';
export { bindHydrateEvents } from './dsd-hydration-events.js';
export type { Constructor, DsdHydration } from './dsd-hydration.js';
export { createRenderDsdStreamMetrics, renderDsd, renderDsdStream } from './render-dsd.js';
export type { RenderDsdOptions } from './render-dsd.js';
export type {
  RenderDsdStreamChunk,
  RenderDsdStreamComponent,
  RenderDsdStreamMetrics,
  RenderDsdStreamOptions,
} from './render-dsd-stream.js';
export { camelToKebab, serializeAttrs } from './render-ir.js';
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
} from '@openelement/protocol/render';
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
} from '@openelement/protocol/manifest';
export type {
  CemCompatibilityReport,
  CompatibilityClassification,
  CompatibilityTier,
} from '@openelement/protocol/manifest';
export { escapeAttr, escapeAttrValue, escapeHtml } from './html-escape.js';
export {
  // v0.24.3: Neutral signal utilities — no template dependency
  isSignalLike,
  unwrapSignalLike,
} from '@openelement/signal';
export type { SignalLike, Unsubscribe } from '@openelement/protocol/signal';
export { consumeContext, type Context, createContext, provideContext } from './signal-context.js';
export { createLogger } from './logger.js';
/** @internal — use @openelement/core/security subpath */
export { DANGEROUS_KEYS } from './security.js';
export { isValidTagName } from './tag-utils.js';
export {
  bindSsrProps,
  defineCustomElement,
  defineIsland,
  getIslandMeta,
  getSsrProps,
} from './island.js';
export type { IslandMeta, IslandOptions } from '@openelement/protocol/island';
export { transformIslandSource } from './island-transform.js';
export type { IslandTransformOptions, IslandTransformResult } from '@openelement/protocol/island';

// Unified binding layer (ADR-0109 Phase 1)
export {
  applyBindingDescriptor,
  commitBindings,
  registerBindingKind,
} from './binding-activation.js';
export {
  bindAttr,
  bindClass,
  bindConditional,
  bindEvent,
  bindList,
  bindRef,
  bindRender,
  bindStaticAttr,
  bindStaticBoolean,
  bindStaticProp,
  bindStaticStyle,
  bindText,
} from './binding-descriptor.js';
export type {
  BindingDescriptor,
  BindingDispose,
  BindingLifecycle,
  BindingRenderer,
} from './binding-descriptor.js';

// Data adapters — type contract surface only (ADR-0095)
export type {
  Action,
  ActionContext,
  DataAdapter,
  Loader,
  LoaderContext,
} from '@openelement/protocol/data';

// WC Package Protocol (v0.17+)
export {
  clear as clearRegistry,
  generateIndex,
  getAll as getAllManifests,
  getByTagName,
  register as registerManifest,
  validate as validateManifest,
} from './registry.js';
// v0.24.1 (ADR-0057): JSX + Signal component model
// VNode & jsx-runtime
export type { VNode } from '@openelement/protocol/vnode';
export { isVNode } from './vnode.js';
export { Fragment, trustedHtml } from './jsx-runtime.js';
// Renderers
export { renderToDom } from './jsx-render-dom.js';
export { renderDsdTree } from './render-ir.js';
export {
  collectEventBindings,
  createEventMarkerContext,
  type EventBindingRecord,
  type EventMarkerContext,
  eventMarkerId,
  eventTypeFromProp,
  hydrateEventMarkers,
  serializeEventMarkers,
} from './event-hydration.js';
// static props runtime + Signal unwrap
export {
  disposeStaticProps,
  handleStaticPropAttributeChange,
  initializeStaticProps,
  registerStaticObservedAttributes,
  syncStaticPropsFromAttributes,
  unwrap,
} from './prop.js';
export type {
  NormalizedPropDecl,
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from '@openelement/protocol/prop';
