/**
 * Canonical component-authoring facade for openElement.
 *
 * This package is the single import surface for authoring custom elements,
 * DSD components, and islands. Build orchestration remains in
 * @openelement/app and @openelement/adapter-vite; build adapters import
 * build-time helpers from `@openelement/element/build-utils`.
 */

// ─── Core exports ───────────────────────────────────────

export { OpenElement } from './open-element.ts';

export { ErrorBoundary } from './error-boundary.ts';

export { defineElement } from './define-element.ts';
export type { ElementDefinition } from './types.ts';

// ─── Prop types ──────────────────────────────────────────

export type {
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from './internal/protocol/prop.ts';

// ─── JSX runtime (re-export from core) ───────────────────

export { Fragment, jsx, jsxDEV, jsxs } from './internal/core/jsx-runtime.ts';
export type { VNode } from './internal/protocol/vnode.ts';
// Additive type-only seam consumed by build adapters. Runtime code remains internal.
export type * from './internal/protocol/framework.ts';
export type * from './internal/protocol/manifest.ts';
export type * from './internal/protocol/render.ts';
export type * from './internal/protocol/style-sheet.ts';
export type * from './internal/protocol/vnode.ts';
export { isVNode } from './internal/core/index.ts';
export { assertValidTagName } from './internal/core/tag-utils.ts';

// ─── Renderers (re-export from core) ─────────────────────

export { renderDsd, renderDsdTree, wrapInDocument } from './internal/core/index.ts';

// ─── Context (re-export from core) ───────────────────────

export { consumeContext, createContext, provideContext } from './internal/core/index.ts';
export type { Context } from './internal/core/index.ts';

// ─── Error types (re-export from core) ───────────────────

export type { RenderError } from './internal/core/index.ts';
export { ERROR_PREFIX } from './internal/protocol/errors.ts';

// ─── Signals (re-export) ─────────────────────────────────

export { computed, effect, signal } from './internal/signal/index.ts';
export type { Signal } from './internal/protocol/signal.ts';

// ─── HTML utilities (re-export from core) ────────────────

export { escapeAttr, escapeHtml } from './internal/core/index.ts';

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
export { isValidTagName } from './internal/core/tag-utils.ts';
export type { StyleSheetLike } from './internal/protocol/style-sheet.ts';

// App-owned contracts use these types without reopening the retired protocol package.
export type { Action, ActionContext, Loader, LoaderContext } from './internal/protocol/data.ts';
export type { HydrationStrategy, LocalePath } from './internal/protocol/framework.ts';
export type {
  CompatibilityClassification,
  CompatibilityTier,
} from './internal/protocol/framework.ts';
export type { OpenElementRouteKind, OpenElementRouteNode } from './internal/protocol/app-model.ts';
export type {
  OpenElementAttribute,
  OpenElementCssPart,
  OpenElementDeclaration,
  OpenElementEvent,
  OpenElementPackageManifest,
  OpenElementSlot,
} from './internal/protocol/manifest.ts';
