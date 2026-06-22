/**
 * @openelement/core — Test utilities.
 *
 * v0.25.0 (SOP-009): Single re-export point for all core test imports.
 * Tests import from './test-utils.ts' instead of '../src/xxx.ts'.
 *
 * v0.40.0: DsdElement and ErrorBoundary moved to @openelement/element.
 * Core tests import them directly from @openelement/element if needed.
 */

// ── JSX runtime ───────────────────────────────────────────────────
export { Fragment, jsx, jsxDEV, jsxs } from '../src/jsx-runtime.ts';
export { renderToDom } from '../src/jsx-render-dom.ts';
export { renderDsdTree, serializeRenderNode } from '../src/render-ir.ts';
export { isComponentCtor, isComponentFn, isVNode } from '../src/vnode.ts';
export type { ComponentCtor, ComponentFn, VNode } from '@openelement/protocol/vnode';

// ── Signals ───────────────────────────────────────────────────────
export { isSignalLike, unwrapSignalLike } from '@openelement/signal';
export type { SignalLike } from '@openelement/protocol/signal';

// ── Island / SSR ──────────────────────────────────────────────────
export { bindSsrProps, defineIsland, getSsrProps } from '../src/island.ts';
export type { IslandOptions } from '@openelement/protocol/island';

// ── Rendering ─────────────────────────────────────────────────────
export { renderDsd } from '../src/render-dsd.ts';
export { renderDsdStream } from '../src/render-dsd-stream.ts';

// ── Signal Context (v0.25) ────────────────────────────────────────
export { consumeContext, createContext, provideContext } from '../src/signal-context.ts';
export type { Context } from '../src/signal-context.ts';

// ── Cross-package (signals, style-sheet) ───────────────────────────
export { computed, effect, signal } from '../../signal/src/framework.ts';
export { StyleSheet } from '../src/style-sheet.ts';
export type { StyleSheetLike } from '@openelement/protocol/style-sheet';
