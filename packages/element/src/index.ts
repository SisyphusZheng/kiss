/**
 * Canonical component-authoring facade for openElement.
 *
 * This package is the single import surface for authoring custom elements,
 * DSD components, and islands. Build orchestration remains in
 * @openelement/app and @openelement/adapter-vite.
 */

// ─── Core exports ───────────────────────────────────────

export { OpenElement } from './open-element.ts';
export type { OpenElementComponentConstructor } from './open-element.ts';

export { ErrorBoundary } from './error-boundary.ts';

export { defineElement, defineLayout } from './define-element.ts';
export type { ElementDefinition } from './types.ts';

// ─── Prop types ──────────────────────────────────────────

export type {
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from './internal/protocol/prop.ts';
export {
  disposeStaticProps,
  handleStaticPropAttributeChange,
  initializeStaticProps,
  normalizePropDecl,
  registerStaticObservedAttributes,
  syncStaticPropsFromAttributes,
  unwrap,
} from './internal/core/prop.ts';

// ─── JSX runtime (re-export from core) ───────────────────

export { Fragment, jsx, jsxDEV, jsxs } from './internal/core/jsx-runtime.ts';
export type { OpenElementRenderer } from './internal/protocol/framework.ts';
export type { VNode } from './internal/protocol/vnode.ts';
export { isVNode } from './internal/core/index.ts';
export { assertValidTagName } from './internal/core/tag-utils.ts';

// ─── Renderers (re-export from core) ─────────────────────

export { renderDsd, renderDsdTree, renderToDom, wrapInDocument } from './internal/core/index.ts';

// ─── Context (re-export from core) ───────────────────────

export { consumeContext, createContext, provideContext } from './internal/core/index.ts';
export type { Context } from './internal/core/index.ts';

// ─── Error types (re-export from core) ───────────────────

export type { PropValidationError, RenderError } from './internal/core/index.ts';
export type { ErrorCode, ErrorPhase, ErrorSeverity } from './internal/protocol/errors.ts';
export { ERROR_PREFIX } from './internal/protocol/errors.ts';

// ─── Signals (re-export) ─────────────────────────────────

export type { SignalLike } from './internal/protocol/signal.ts';
export { isSignalLike } from './internal/core/index.ts';
export { computed, effect, signal } from './internal/signal/index.ts';
export type { Signal } from './internal/protocol/signal.ts';

// ─── HTML utilities (re-export from core) ────────────────

export { escapeAttr, escapeAttrValue, escapeHtml } from './internal/core/index.ts';
export type { SafeHtml, UnsafeHtml } from './internal/protocol/framework.ts';

// ─── Trusted HTML (re-export from core) ──────────────────────────

export { trustedHtml } from './internal/core/index.ts';

// ─── Island utilities (re-export from core) ──────────────

export {
  bindSsrProps,
  defineCustomElement,
  defineIsland,
  getSsrProps,
} from './internal/core/index.ts';
export type { IslandOptions } from './internal/protocol/island.ts';

// ─── StyleSheet (re-export from core) ────────────────────

export { StyleSheet } from './internal/core/style-sheet.ts';
export { createLogger } from './internal/core/logger.ts';
export { formatError, OpenElementError } from './internal/core/errors.ts';
export { formatJson } from './internal/core/write-json.ts';
export { isValidTagName } from './internal/core/tag-utils.ts';
export { normalizeSeparators, pathToTagName } from './internal/core/path-utils.ts';
export { createIsrCacheKey } from './internal/core/isr.ts';
export { SsrRenderError } from './internal/core/errors.ts';
export { transformIslandSource } from './internal/core/island-transform.ts';
export type { OpenElementRequestHandler, RuntimeContext } from './internal/core/runtime.ts';
export { createRuntimeAdapter } from './internal/core/runtime.ts';
export type { StyleSheetLike, StyleSheetRule } from './internal/protocol/style-sheet.ts';

// App-owned contracts use these types without reopening the retired protocol package.
export type { Action, ActionContext, Loader, LoaderContext } from './internal/protocol/data.ts';
export type { HydrationStrategy, LocalePath } from './internal/protocol/framework.ts';
export type {
  CompatibilityClassification,
  CompatibilityTier,
} from './internal/protocol/framework.ts';
export type {
  CreateRouteGraphOptions,
  OpenElementAssetManifest,
  OpenElementAssetManifestEntry,
  OpenElementRouteGraph,
  OpenElementRouteGraphFactory,
  OpenElementRouteKind,
  OpenElementRouteNode,
} from './internal/protocol/app-model.ts';
export type {
  OpenElementAttribute,
  OpenElementCssPart,
  OpenElementDeclaration,
  OpenElementEvent,
  OpenElementPackageManifest,
  OpenElementSlot,
} from './internal/protocol/manifest.ts';
