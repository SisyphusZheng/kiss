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
export { collectPublicProps } from './public-runtime.ts';

// ─── Prop types ──────────────────────────────────────────

export type {
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from './public-runtime.ts';

// ─── JSX runtime (re-export from core) ───────────────────

export { For, Fragment, jsx, jsxDEV, jsxs } from './public-runtime.ts';
export type { VNode } from './public-runtime.ts';
// Explicit type-only surface for build adapters (#488): no star seams, so the
// public type surface is exactly the names listed here. SafeHtml, UnsafeHtml
// and StyleSheetRule stay internal (#487).
export type { RenderOutput, SsrAdmissionDecision } from './public-runtime.ts';
export { assertValidTagName, isVNode } from './public-runtime.ts';

// ─── Renderers (re-export from core) ─────────────────────

export { renderDsd, renderDsdTree, wrapInDocument } from './public-runtime.ts';

// ─── Context (re-export from core) ───────────────────────

export { consumeContext, createContext, provideContext } from './public-runtime.ts';
export type { Context } from './public-runtime.ts';

// ─── Error types (re-export from core) ───────────────────

export type { ErrorTelemetryHook, RenderError } from './public-runtime.ts';
export { ERROR_PREFIX, reportError, setErrorTelemetryHook } from './public-runtime.ts';

// ─── Signals (re-export) ─────────────────────────────────

export { computed, effect, signal } from './public-runtime.ts';
export type { Signal } from './public-runtime.ts';

// ─── HTML utilities (re-export from core) ────────────────

export { escapeAttr, escapeHtml } from './public-runtime.ts';

// ─── Trusted HTML (re-export from core) ──────────────────────────

export { trustedHtml } from './public-runtime.ts';

// ─── Security predicates (re-export from core) ───────────────────

export { isSafeAttributeName } from './public-runtime.ts';

// ─── Island utilities (re-export from core) ──────────────

export { bindSsrProps, defineCustomElement, defineIsland, getSsrProps } from './public-runtime.ts';
export type { IslandOptions } from './public-runtime.ts';

// ─── Hydration markers (protocol) ───────────────────────

// Shared by SSR writers (render-dsd) and client readers (island, app, www) so
// the attribute name has a single typed source (#836).
export { DATA_SSR_PROPS } from './public-runtime.ts';

// ─── StyleSheet (re-export from core) ────────────────────

export {
  createLogger,
  formatError,
  isValidTagName,
  OpenElementError,
  StyleSheet,
} from './public-runtime.ts';
export type { StyleSheetLike } from './public-runtime.ts';

// App-owned contracts use these types without reopening the retired protocol package.
export type {
  Action,
  ActionContext,
  ActionResult,
  Loader,
  LoaderContext,
  ProblemDetails,
  ServerRouteContext,
  ServerRouteMetadata,
  SpaAction,
  SpaActionContext,
  SpaLoader,
  SpaLoaderContext,
} from './public-contracts.ts';
export { ACTION_FETCH_HEADER, PROBLEM_JSON_MEDIA_TYPE } from './public-contracts.ts';
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
  RouteEntry,
  SpecialFileType,
} from './public-contracts.ts';
// Runtime export: canonical hydration strategy list consumed by app and build
// adapters (#496). The HydrationStrategy type derives from this const.
export { HYDRATION_STRATEGIES } from './public-contracts.ts';
export type { OpenElementRouteKind, OpenElementRouteNode } from './public-contracts.ts';
/**
 * @experimental ISR cache contracts for self-build KV adapters
 * (docs/current/ISR_KV_ADAPTER.md). ISR is not wired into the 0.42
 * request-time server entry (targeting 0.44), and no in-box adapter implements
 * cross-instance invalidation. `tags` lives on `CacheEntry`, not on
 * `IsrCacheEntry`; KV adapters persist it alongside the entry.
 */
export type { CacheEntry, IsrCacheEntry, IsrCacheResult } from './public-contracts.ts';
export type {
  OpenElementAttribute,
  OpenElementCssPart,
  OpenElementDeclaration,
  OpenElementEvent,
  OpenElementPackageManifest,
  OpenElementSlot,
} from './public-contracts.ts';

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
export { disposeOpenElement, hydrateOpenElement } from './public-runtime.ts';
// #942: click capture/replay across the pre-hydration window (generated client entry).
export {
  deepGetElementById,
  ensureDeepFragmentNavigation,
  ensurePreHydrationClickCapture,
} from './public-runtime.ts';
export type { ClientRuntimeOptions } from './public-runtime.ts';
