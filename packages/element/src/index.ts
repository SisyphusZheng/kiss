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
export { collectPublicProps } from './internal/core/props-utils.ts';

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
// Explicit type-only surface for build adapters (#488): no star seams, so the
// public type surface is exactly the names listed here. SafeHtml, UnsafeHtml
// and StyleSheetRule stay internal (#487).
export type { RenderOutput, SsrAdmissionDecision } from './internal/protocol/render.ts';
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
export { reportError, setErrorTelemetryHook } from './internal/core/errors.ts';
export type { ErrorTelemetryHook } from './internal/protocol/errors.ts';

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

// ─── Hydration markers (protocol) ───────────────────────

// Shared by SSR writers (render-dsd) and client readers (island, app, www) so
// the attribute name has a single typed source (#836).
export { DATA_SSR_PROPS } from './internal/protocol/hydration-markers.ts';

// ─── StyleSheet (re-export from core) ────────────────────

export { StyleSheet } from './internal/core/style-sheet.ts';
export { createLogger } from './internal/core/logger.ts';
export { formatError, OpenElementError } from './internal/core/errors.ts';
export { isValidTagName } from './internal/core/tag-utils.ts';
export type { StyleSheetLike } from './internal/protocol/style-sheet.ts';

// App-owned contracts use these types without reopening the retired protocol package.
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
} from './internal/protocol/data.ts';
export { ACTION_FETCH_HEADER, PROBLEM_JSON_MEDIA_TYPE } from './internal/protocol/data.ts';
export type {
  AppShellConfig,
  CompatibilityClassification,
  CompatibilityTier,
  ComponentLayer,
  FrameworkOptions,
  HydrationStrategy,
  IsrManifestEntry,
  LocalePath,
  Middleware,
  OpenElementBlogOptions,
  OpenElementBuildContextLike,
  OpenElementHeaderNavLink,
  OpenElementI18nContextOptions,
  OpenElementNavSection,
  RouteEntry,
  SpecialFileType,
} from './internal/protocol/framework.ts';
// Runtime export: canonical hydration strategy list consumed by app and build
// adapters (#496). The HydrationStrategy type derives from this const.
export { HYDRATION_STRATEGIES } from './internal/protocol/framework.ts';
export type { OpenElementRouteKind, OpenElementRouteNode } from './internal/protocol/app-model.ts';
/**
 * @experimental ISR cache contracts for self-build KV adapters
 * (docs/current/ISR_KV_ADAPTER.md). ISR is not wired into the 0.42
 * request-time server entry (targeting 0.44), and no in-box adapter implements
 * cross-instance invalidation. `tags` lives on `CacheEntry`, not on
 * `IsrCacheEntry`; KV adapters persist it alongside the entry.
 */
export type { CacheEntry, IsrCacheEntry, IsrCacheResult } from './internal/protocol/isr.ts';
export type {
  OpenElementAttribute,
  OpenElementCssPart,
  OpenElementDeclaration,
  OpenElementEvent,
  OpenElementPackageManifest,
  OpenElementSlot,
} from './internal/protocol/manifest.ts';

// ─── Client runtime (@experimental) ─────────────────────

/**
 * @experimental Lightweight client runtime for third-party frameworks
 * (Fresh, Preact, ...) that hydrates openElement DSD output without the
 * OpenElement base class. `hydrateOpenElement` scans a subtree for
 * `<template shadowrootmode="open">` declarative shadow roots, upgrades
 * registered custom elements, binds `data-signal` markers, and returns a
 * dispose function; `disposeOpenElement(root)` tears down a subtree that was
 * hydrated this way. Marked experimental (aligned with the ISR contracts
 * above): the API is stable enough for Fresh/third-party integration work
 * but may still change before 0.42 stable.
 *
 * Precondition: the scan only finds templates that a native DSD parser did
 * not consume. Per the HTML standard the parser replaces each DSD template
 * with the host's ShadowRoot, so on a normally parsed page in a native-DSD
 * browser (Chromium) `hydrateOpenElement` finds nothing and is a no-op —
 * OpenElement hosts self-hydrate via connectedCallback there. The runtime is
 * meant for non-DSD browsers and for markup inserted without DSD processing
 * (e.g. innerHTML).
 */
export { disposeOpenElement, hydrateOpenElement } from './internal/core/client-runtime.ts';
export type { ClientRuntimeOptions } from './internal/core/client-runtime.ts';
