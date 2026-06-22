/**
 * Canonical component-authoring facade for openElement.
 *
 * This package is the single import surface for authoring custom elements,
 * DSD components, and islands. Build orchestration remains in
 * @openelement/app and @openelement/adapter-vite.
 */

// ─── Core exports ───────────────────────────────────────

export { OpenElement } from './open-element.js';
export type { OpenElementComponentConstructor } from './open-element.js';

export { ErrorBoundary } from './error-boundary.js';

export { defineElement, defineLayout } from './define-element.js';
export type { ElementDefinition } from './types.js';

// ─── Prop types ──────────────────────────────────────────

export type {
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from '@openelement/protocol/prop';
export {
  disposeStaticProps,
  handleStaticPropAttributeChange,
  initializeStaticProps,
  normalizePropDecl,
  registerStaticObservedAttributes,
  syncStaticPropsFromAttributes,
  unwrap,
} from '@openelement/core/prop';

// ─── JSX runtime (re-export from core) ───────────────────

export { Fragment, jsx, jsxDEV, jsxs } from '@openelement/core/jsx-runtime';
export type { OpenElementRenderer } from '@openelement/protocol/framework';
export type { VNode } from '@openelement/protocol/vnode';
export { isVNode } from '@openelement/core';

// ─── Renderers (re-export from core) ─────────────────────

export { renderDsdTree, renderToDom } from '@openelement/core';

// ─── Context (re-export from core) ───────────────────────

export { consumeContext, createContext, provideContext } from '@openelement/core';
export type { Context } from '@openelement/core';

// ─── Error types (re-export from core) ───────────────────

export type {
  OpenElementError,
  PropValidationError,
  RenderError,
  SsrRenderError,
} from '@openelement/core';
export type { ErrorCode, ErrorPhase, ErrorSeverity } from '@openelement/protocol/errors';

// ─── Signals (re-export) ─────────────────────────────────

export type { SignalLike } from '@openelement/protocol/signal';
export { isSignalLike } from '@openelement/core';
export { computed, effect, signal } from '@openelement/signal';
export type { Signal } from '@openelement/protocol/signal';

// ─── HTML utilities (re-export from core) ────────────────

export { escapeAttr, escapeAttrValue, escapeHtml } from '@openelement/core';
export type { SafeHtml, UnsafeHtml } from '@openelement/protocol/html';

// ─── Trusted HTML (re-export from core) ──────────────────────────

export { trustedHtml } from '@openelement/core';

// ─── Island utilities (re-export from core) ──────────────

export { bindSsrProps, defineIsland, getSsrProps } from '@openelement/core';
export type { IslandOptions } from '@openelement/protocol/island';

// ─── StyleSheet (re-export from core) ────────────────────

export { StyleSheet } from '@openelement/core/style-sheet';
export type { StyleSheetLike, StyleSheetRule } from '@openelement/protocol/style-sheet';
