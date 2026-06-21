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
 * For the unified openElement() entry, use @openelement/app/vite instead.
 */

// --- Public API re-exports -----------------------------------------

export type {
  AppShellConfig,
  AppShellDefinition,
  FrameworkOptions,
  LayoutsConfig,
  OpenElementBuildContextLike,
  OpenElementMiddleware,
  OpenElementMiddlewareContext,
  OpenElementPluginMeta,
  OpenElementRenderer,
  RouteEntry,
  SpecialFileType,
  SsrContext,
} from './schemas.js';

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
export type { ErrorPhase, ErrorSeverity, ErrorTelemetryHook } from './errors.js';
export { createSsrContext, extractParams, parseQuery } from './context.js';
export { renderSsrError, wrapInDocument } from './html-escape.js';
export type { OpenElementApiContext } from './schemas.js';
export { createIsrCacheKey, isIsrRouteConfig, MemoryIsrCache } from './isr.js';
export type {
  CacheAdapter,
  CacheEntry,
  IsrCache,
  IsrCacheEntry,
  IsrCacheResult,
  IsrCacheState,
  IsrManifestEntry,
  IsrRouteConfig,
} from './isr.js';
export { findIsrManifestEntry, renderIsrResponse } from './isr-runtime.js';
export type {
  IsrRuntimeOptions,
  IsrRuntimeRenderContext,
  IsrRuntimeRenderResult,
  IsrRuntimeResult,
  IsrRuntimeState,
} from './isr-runtime.js';
export { StyleSheet } from './style-sheet.js';
export type { StyleSheetLike, StyleSheetRule } from './style-sheet.js';
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
  ComponentLayer,
  HydrateEventDescriptor,
  HydrationStrategy,
  OpenElementAttribute,
  OpenElementCssPart,
  OpenElementCssProperty,
  OpenElementDeclaration,
  OpenElementEvent,
  OpenElementExport,
  OpenElementExtensions,
  OpenElementMember,
  OpenElementModule,
  OpenElementPackageExtensions,
  OpenElementPackageManifest,
  OpenElementSlot,
  ReactiveHost,
  RegistryIndex,
  RegistryIndexEntry,
  StrategySource,
  Unsubscribe,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './schemas.js';
export type {
  CemCompatibilityReport,
  CompatibilityClassification,
  CompatibilityTier,
  ManifestValidationReport,
  ValidatedTag,
  ValidationDiagnostic,
} from './compat-schemas.js';
export type {
  DomSimulationAttempt,
  DomSimulationReport,
  DsdBuildReport,
  DsdHydrationHintSummary,
  DsdHydrationStrategySummary,
  DsdMetricsSummary,
  DsdOptions,
  DsdPageDiagnostics,
  HydrationHint,
  IsrRouteRecord,
  ManifestDecision,
  RendererProtocol,
  RenderHooks,
  RenderInput,
  RenderOutput,
  RenderPhase,
  SsrAdmissionDecision,
} from './render-schemas.js';
export {
  escapeAttr,
  escapeAttrValue,
  escapeHtml,
  type SafeHtml,
  type UnsafeHtml,
} from './html-escape.js';
export {
  // v0.24.3: Neutral signal utilities — no template dependency
  isSignalLike,
  type SignalLike,
  unwrapSignalLike,
} from '@openelement/signal';
export { consumeContext, type Context, createContext, provideContext } from './signal-context.js';
export { createLogger, OpenElementLogger } from './logger.js';
/** @internal — use @openelement/core/security subpath */
export { DANGEROUS_KEYS } from './security.js';
export { isValidTagName } from './tag-utils.js';
export {
  bindSsrProps,
  defineCustomElement,
  defineIsland,
  getIslandMeta,
  getSsrProps,
  type IslandOptions,
} from './island.js';
export { transformIslandSource } from './island-transform.js';
export type { IslandTransformOptions, IslandTransformResult } from './island-transform.js';

// Data adapters
export { MemoryDataAdapter } from './data.js';
export type { Action, ActionContext, DataAdapter, Loader, LoaderContext } from './data.js';

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
export type { VNode } from './vnode.js';
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
