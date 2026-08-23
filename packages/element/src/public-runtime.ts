/** Deliberate root-facade implementation boundary. Not a package subpath. */
export { collectPublicProps } from './internal/core/props-utils.ts';
export type {
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from './internal/protocol/prop.ts';
export { For, Fragment, jsx, jsxDEV, jsxs } from './internal/core/jsx-runtime.ts';
export type { ComponentCtor, ComponentFn, RenderFn, VNode } from './internal/protocol/vnode.ts';
export type { RenderOutput, SsrAdmissionDecision } from './internal/protocol/render.ts';
export {
  bindSsrProps,
  consumeContext,
  createContext,
  defineCustomElement,
  defineIsland,
  escapeAttr,
  escapeHtml,
  getSsrProps,
  isVNode,
  provideContext,
  renderDsd,
  renderDsdTree,
  trustedHtml,
  wrapInDocument,
} from './internal/core/index.ts';
export type { Context, RenderError } from './internal/core/index.ts';
export { assertValidTagName, isValidTagName } from './internal/core/tag-utils.ts';
export { ERROR_PREFIX } from './internal/protocol/errors.ts';
export {
  formatError,
  OpenElementError,
  reportError,
  setErrorTelemetryHook,
} from './internal/core/errors.ts';
export type { ErrorTelemetryHook } from './internal/protocol/errors.ts';
export { computed, effect, signal } from './internal/signal/index.ts';
export type { Signal } from './internal/protocol/signal.ts';
export { isSafeAttributeName } from './internal/core/security.ts';
export type { IslandOptions } from './internal/protocol/island.ts';
export { DATA_SSR_PROPS } from './internal/protocol/hydration-markers.ts';
export { StyleSheet } from './internal/core/style-sheet.ts';
export { createLogger } from './internal/core/logger.ts';
export type { StyleSheetLike } from './internal/protocol/style-sheet.ts';
export { disposeOpenElement, hydrateOpenElement } from './internal/core/client-runtime.ts';
export type { ClientRuntimeOptions } from './internal/core/client-runtime.ts';
export { ensurePreHydrationClickCapture } from './internal/core/pre-hydration-click.ts';
export { deepGetElementById, ensureDeepFragmentNavigation } from './internal/core/deep-fragment.ts';
