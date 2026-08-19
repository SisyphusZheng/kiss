/**
 * render-dsd.ts - DSD Renderer.
 *
 * Declarative Shadow DOM SSR renderer.
 * Framework-agnostic: no Lit dependency and no TemplateResult knowledge.
 *
 * v0.29.1: Inlined render-errors, render-instantiate, and render-serialize helpers.
 * Uses unified serializeAttrs from render-ir. Removed renderDsdByName.
 * Changed renderDsdTree import from jsx-render-string to render-ir.
 *
 * @module ./render-dsd.ts
 */

import {
  type DsdComponent,
  type DsdOptions,
  type DsdRenderMetrics,
  type HydrationHint,
  type RenderError,
  type RenderErrorCode,
  type RenderHooks,
  type RenderInput,
  type RenderOutput,
  type RenderPhase,
} from '../protocol/render.ts';
import { type DsdComponentConstructor } from '../protocol/render.ts';
import type { ComponentLayer } from '../protocol/framework.ts';
import { createLogger } from './logger.ts';
import {
  formatError,
  OpenElementError,
  RenderError as RenderErrorClass,
  reportError,
} from './errors.ts';
import { escapeAttrValue } from './html-escape.ts';
import { isVNode } from './vnode.ts';
import { renderDsdTree } from './render-ir.ts';
import {
  dsdHostNode,
  type RenderNode,
  serializeAttrs,
  serializeRenderNode,
  trustedHtmlNode,
} from './render-ir.ts';
import { injectPropsSafe } from './security.ts';
import { collectPublicProps } from './props-utils.ts';
import { DATA_SSR_PROPS } from '../protocol/hydration-markers.ts';

const log = createLogger('render-dsd');
export const MAX_SSR_NESTING_DEPTH = 50;

// ─── Depth-Trip Render Path (#975) ─────────────────────────────

/**
 * Render-path tracking for the depth-trip message activates only this close
 * to the limit, so the success path carries zero path-tracking overhead.
 * Segments recorded above this depth are honestly marked with a leading '…'.
 */
export const RENDER_PATH_TRACK_MIN_DEPTH = MAX_SSR_NESTING_DEPTH - 12;

/** Bounded window: at most this many path segments are retained. */
const RENDER_PATH_WINDOW = 16;

/**
 * Append one segment to the bounded render-path window. Returns a new array
 * (path tracking is only active near the depth limit, so the copy cost is
 * bounded and rare); when the window is full the oldest segments drop behind
 * a leading '…' truncation marker.
 */
export function appendRenderPathSegment(
  path: readonly string[],
  segment: string,
): string[] {
  if (path.length < RENDER_PATH_WINDOW) return [...path, segment];
  return ['…', ...path.slice(-(RENDER_PATH_WINDOW - 2)), segment];
}

/**
 * `(path: … > blog-list > for-item[key=42] > x-d60)` suffix for the
 * depth-trip message, or '' when no path was tracked. The tripping tag is
 * always the last segment.
 */
export function formatDepthPathSuffix(
  path: readonly string[] | undefined,
  tagName: string,
): string {
  if (!path || path.length === 0) return '';
  const segments = path[path.length - 1] === tagName ? path : [...path, tagName];
  return ` (path: ${segments.join(' > ')})`;
}

// ─── Error Classification ──────────────────────────────────────
// RenderPhase and RenderErrorCode are imported from ../protocol/render.ts.

function classifyError(
  phase: RenderPhase,
  tagName: string,
  err: unknown,
  recoverable = false,
): RenderError {
  const message = formatError(err);
  return {
    code: codeForRenderError(phase, message),
    severity: recoverable ? 'warning' : 'error',
    phase,
    tagName,
    message,
    recoverable,
  };
}

// #922: OpenElementRedirect / OpenElementNotFound (app package) are protocol
// control flow, not render failures — a notFound() thrown from a page
// element's render() must reach the request-time handler so it can answer
// 404. Duck-typed here (same contract as app's isOpenElementRedirect /
// isOpenElementNotFound) to avoid an element → app dependency.
export function isControlFlowThrow(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const name = (err as { name?: unknown }).name;
  if (name === 'OpenElementNotFound') {
    return (err as { status?: unknown }).status === 404;
  }
  if (name === 'OpenElementRedirect') {
    const status = (err as { status?: unknown }).status;
    return typeof status === 'number' && status >= 300 && status < 400;
  }
  return false;
}

// SSR_NESTING_DEPTH_EXCEEDED is a safety limit, not a render failure — an
// error boundary scope must never swallow it.
export function isDepthLimitError(err: unknown): boolean {
  return err instanceof OpenElementError && err.code === 'SSR_NESTING_DEPTH_EXCEEDED';
}

/**
 * ADR-0053 Layer 2: thrown in place of the bare-tag fallback while an
 * ancestor error-boundary scope is active (`throwOnRenderError`), so the
 * nearest boundary can substitute its own fallback for the failed subtree.
 * Carries the already-classified (and already-dispatched) RenderError.
 */
export class BoundaryRenderError extends Error {
  constructor(public readonly renderError: RenderError) {
    super(renderError.message);
    this.name = 'BoundaryRenderError';
  }
}

// Lookup table replaces a multi-branch error-code chain.
const ERROR_CODES: Record<string, RenderErrorCode> = {
  instantiate: 'OPEN_ELEMENT_RENDER_INSTANTIATE_FAILED',
  nested: 'OPEN_ELEMENT_RENDER_NESTED_FAILED',
  style: 'OPEN_ELEMENT_RENDER_STYLE_FAILED',
  serialize: 'OPEN_ELEMENT_RENDER_SERIALIZE_FAILED',
};

function codeForRenderError(phase: RenderPhase, message: string): RenderErrorCode {
  if (message.includes('Components must return a VNode')) {
    return 'OPEN_ELEMENT_RENDER_INVALID_OUTPUT';
  }
  return ERROR_CODES[phase] ?? 'OPEN_ELEMENT_RENDER_RENDER_FAILED';
}

/**
 * Route a classified render error to the onError hook (guarded like
 * beforeRender/afterRender) and to the error telemetry chain (#780), so
 * SSR render failures reach a configured setErrorTelemetryHook handler.
 */
function dispatchRenderError(err: RenderError, hooks?: RenderHooks): void {
  if (hooks?.onError) {
    try {
      hooks.onError(err);
    } catch (e) {
      log.debug(`onError hook threw: ${formatError(e)}`);
    }
  }
  reportError(new RenderErrorClass(err.tagName, err.message, err.code, err.tagName));
}

// ─── Component Instantiation ───────────────────────────────────

function instantiateComponent(
  tagName: string,
  componentClass: CustomElementConstructor,
): DsdComponent | null {
  try {
    const instance = new componentClass();
    if (!isDsdComponent(instance)) {
      log.error(`<${tagName}> does not implement render(): VNode | null.`);
      return null;
    }
    return instance;
  } catch (err) {
    const errMsg = formatError(err);
    log.error(`Failed to instantiate <${tagName}>: ${errMsg}`);
    return null;
  }
}

function isDsdComponent(value: unknown): value is DsdComponent {
  return typeof value === 'object' &&
    value !== null &&
    typeof Reflect.get(value, 'render') === 'function';
}

// ─── DSD Template Attributes ───────────────────────────────────

function buildDsdTemplateAttrs(options?: DsdOptions): string {
  if (!options) return '';
  const parts: string[] = [];
  if (options.delegatesFocus) parts.push(' shadowrootdelegatesfocus');
  if (options.clonable) parts.push(' shadowrootclonable');
  if (options.serializable) parts.push(' shadowrootserializable');
  if (options.slotAssignment === 'manual') {
    parts.push(' shadowrootslotassignment="manual"');
  }
  if (options.customElementRegistry) {
    parts.push(' shadowrootcustomelementregistry');
  }
  return parts.join('');
}

// ─── DSD Output Wrapping ───────────────────────────────────────

function wrapDsdOutput(params: {
  tagName: string;
  props: Record<string, unknown>;
  content: string;
  styleCss: string;
  layer: string;
  sourceStr: string;
  dsdOptions?: DsdOptions;
  lightDom?: RenderNode[];
  hostEventAttrs?: string;
}): string {
  const { tagName, props, content, styleCss, layer, sourceStr, dsdOptions, lightDom } = params;
  const publicProps = collectPublicProps(props);
  const ssrPropsAttr = Object.keys(publicProps).length > 0
    ? ` ${DATA_SSR_PROPS}="${escapeAttrValue(JSON.stringify(publicProps))}"`
    : '';

  return serializeRenderNode(
    dsdHostNode({
      tag: tagName,
      attrs: publicProps,
      eventAttrs: params.hostEventAttrs,
      ssrPropsAttr,
      source: sourceStr,
      templateAttrs: buildDsdTemplateAttrs(dsdOptions),
      styleCss,
      shadow: [trustedHtmlNode(content)],
      light: lightDom ?? [],
      layer,
    }),
  );
}

// ─── DSD Rendering ─────────────────────────────────────────────

export interface RenderDsdOptions {
  componentClass?: CustomElementConstructor;
  props?: Record<string, unknown>;
  sourceInfo?: { route?: string; source?: string };
  dsdOptions?: DsdOptions;
  nestingDepth?: number;
  hooks?: RenderHooks;
  lightDom?: RenderNode[];
  /**
   * Pre-serialized `data-eid` attribute for host-level event props.
   *
   * Function-valued props are stripped from host attributes by design, so the
   * caller (renderToNode in render-ir) serializes the event marker itself and
   * passes it here to keep SSR `data-eid` numbering aligned with hydration's
   * collectEventBindings traversal. Internal use only; ignored when empty.
   */
  hostEventAttrs?: string;
  /**
   * ADR-0053 Layer 2 (internal): render this component — which must be an
   * error boundary — in captured-error state, substituting its onError
   * fallback for the normal render output. Passed by render-ir when a
   * boundary's light-DOM subtree failed.
   */
  boundaryError?: unknown;
  /**
   * ADR-0053 Layer 2 (internal): an ancestor error-boundary scope is active.
   * Render/instantiate failures throw BoundaryRenderError instead of
   * degrading to the bare-tag fallback, so the nearest boundary captures them.
   */
  throwOnRenderError?: boolean;
  /**
   * #975 (internal): bounded window of ancestor path segments (CE host tags
   * and `<For>` item segments) tracked by render-ir once the nesting depth
   * approaches the limit; appended to the SSR_NESTING_DEPTH_EXCEEDED message
   * so the trip point is diagnosable in recursive/keyed-For trees. Tracked
   * lazily — undefined on the ordinary success path.
   */
  renderPath?: readonly string[];
}

export async function renderDsd(
  input: string | CustomElementConstructor,
  options: RenderDsdOptions = {},
): Promise<RenderOutput> {
  const props = options.props ?? {};
  const resolved = resolveComponent(input, options);
  if ('html' in resolved) return resolved;
  const { tagName, componentClass } = resolved;
  const hooks = options.hooks;

  const nestingDepth = options.nestingDepth ?? 0;
  if (nestingDepth > MAX_SSR_NESTING_DEPTH) {
    throw new OpenElementError(
      `SSR nesting depth exceeded ${MAX_SSR_NESTING_DEPTH} at <${tagName}>${
        formatDepthPathSuffix(options.renderPath, tagName)
      }`,
      {
        code: 'SSR_NESTING_DEPTH_EXCEEDED',
        phase: 'ssr',
      },
    );
  }
  const startTime = safeNow();
  const sourceStr = options.sourceInfo
    ? `${options.sourceInfo.route ? ` route="${escapeAttrValue(options.sourceInfo.route)}"` : ''}${
      options.sourceInfo.source ? ` source="${escapeAttrValue(options.sourceInfo.source)}"` : ''
    }`
    : '';

  const collectedErrors: RenderError[] = [];
  const collectedHints: HydrationHint[] = [];

  const renderInput: RenderInput = {
    tagName,
    componentClass,
    props,
    dsdOptions: options.dsdOptions,
    nestingDepth,
  };

  if (hooks?.beforeRender) {
    try {
      hooks.beforeRender(renderInput);
    } catch (e) {
      log.debug(`beforeRender hook threw: ${formatError(e)}`);
    }
  }

  const instance = instantiateComponent(tagName, componentClass);
  if (!instance) {
    if (options.throwOnRenderError) {
      // An ancestor boundary scope is active: bubble instead of bare-tagging.
      const err = classifyError('instantiate', tagName, 'Failed to instantiate', true);
      dispatchRenderError(err, hooks);
      throw new BoundaryRenderError(err);
    }
    return instantiationFailureOutput(
      tagName,
      props,
      nestingDepth,
      collectedErrors,
      collectedHints,
      hooks,
    );
  }

  injectPropsSafe(instance as unknown as Record<string, unknown>, props, tagName, log);

  const isBoundary = (componentClass as DsdComponentConstructor).isErrorBoundary === true;
  const outcome = await renderComponentContent(
    tagName,
    props,
    instance,
    nestingDepth,
    hooks,
    collectedErrors,
    collectedHints,
    startTime,
    {
      isBoundary,
      boundaryError: options.boundaryError,
      throwOnRenderError: options.throwOnRenderError,
      renderPath: options.renderPath,
    },
  );
  if (outcome.earlyReturn) return outcome.earlyReturn;
  const hasError = outcome.hasError;

  const ctor = componentClass as DsdComponentConstructor;
  const styleCss = collectStyleCss(ctor);
  const renderMode = ctor.renderMode ?? 'shadow';
  const resolvedLayer = renderMode === 'light'
    ? 'light-dom'
    : options.dsdOptions?.layer || instance.layer || 'dsd-static';

  const metrics: DsdRenderMetrics = {
    tagName,
    renderTimeMs: safeNow() - startTime,
    templateSize: outcome.content.length,
    layer: resolvedLayer,
    hasError,
    nestingDepth,
  };

  if (resolvedLayer !== 'dsd-static') {
    collectedHints.push({
      tagName,
      layer: resolvedLayer as ComponentLayer,
    });
  }

  let html: string;
  try {
    html = wrapDsdOutput({
      tagName,
      props,
      content: outcome.content,
      styleCss,
      layer: resolvedLayer,
      sourceStr,
      dsdOptions: options.dsdOptions,
      lightDom: options.lightDom,
      hostEventAttrs: options.hostEventAttrs,
    });
  } catch (err) {
    // Public-prop serialization failures (circular structure, BigInt): the
    // island could never hydrate, so this is a render failure — take the
    // same path as a render() throw: bubble to an active boundary scope,
    // else degrade to the bare tag.
    if (isControlFlowThrow(err) || isDepthLimitError(err)) throw err;
    const classifiedErr = recordCaughtError(err, tagName, collectedErrors, hooks);
    if (options.throwOnRenderError) {
      throw err instanceof BoundaryRenderError ? err : new BoundaryRenderError(classifiedErr);
    }
    return bareTagFallbackOutput(
      tagName,
      props,
      collectedErrors,
      collectedHints,
      hooks,
      safeNow() - startTime,
      nestingDepth,
    );
  }

  const output: RenderOutput = {
    html,
    errors: collectedErrors,
    metrics,
    hydrationHints: collectedHints,
  };

  callAfterRenderHook(hooks, output);

  return output;
}

// ─── Render Sub-functions (#900) ────────────────────────────────

/** Input parsing + component class resolution. */
function resolveComponent(
  input: string | CustomElementConstructor,
  options: RenderDsdOptions,
): { tagName: string; componentClass: CustomElementConstructor } | RenderOutput {
  if (typeof input === 'string') {
    const tagName = input;
    if (options.componentClass) {
      return { tagName, componentClass: options.componentClass };
    }
    const cls = globalThis.customElements?.get(tagName) as CustomElementConstructor | undefined;
    if (!cls) {
      log.warn(`<${tagName}> is not registered - rendering as void element`);
      const attrs = serializeAttrs(tagName, options.props ?? {});
      return {
        html: `<${tagName}${attrs}></${tagName}>`,
        errors: [],
        metrics: {
          tagName,
          renderTimeMs: 0,
          templateSize: 0,
          layer: 'dsd-static',
          hasError: false,
          nestingDepth: 0,
        },
        hydrationHints: [],
      };
    }
    return { tagName, componentClass: cls };
  }
  const componentClass = input;
  const resolvedName = (input as DsdComponentConstructor).tagName;
  if (!resolvedName) {
    throw new OpenElementError(
      'renderDsd: component constructor is missing a static `tagName`; ' +
        'pass the registered tag name as the first argument instead.',
      { code: 'DSD_MISSING_TAG_NAME', phase: 'ssr' },
    );
  }
  return { tagName: resolvedName, componentClass };
}

/**
 * Shared bare-tag fallback for the serialize/render/instantiate catch paths:
 * the element renders as an empty shell with its serialized props so the
 * client can still hydrate/retry, the error is already recorded, and the
 * afterRender hook fires exactly once (single source for the shape — the
 * four call sites used to inline near-copies).
 */
function bareTagFallbackOutput(
  tagName: string,
  props: Record<string, unknown>,
  collectedErrors: RenderError[],
  collectedHints: HydrationHint[],
  hooks: RenderHooks | undefined,
  renderTimeMs: number,
  nestingDepth: number,
): RenderOutput {
  // The props that forced this fallback may themselves crash attribute
  // serialization (e.g. a circular prop plus a throwing getter on the same
  // props object: serializeAttrs enumerates Object.entries, re-invoking the
  // getter). The fallback must never throw — drop the attributes instead.
  let attrs = '';
  try {
    attrs = serializeAttrs(tagName, props);
  } catch {
    // Attributes are best-effort here; the error is already recorded.
  }
  const result: RenderOutput = {
    html: `<${tagName}${attrs}></${tagName}>`,
    errors: collectedErrors,
    metrics: {
      tagName,
      renderTimeMs,
      templateSize: 0,
      layer: 'dsd-static',
      hasError: true,
      nestingDepth,
    },
    hydrationHints: collectedHints,
  };
  callAfterRenderHook(hooks, result);
  return result;
}

/** Error-fallback output when instantiation fails. */
function instantiationFailureOutput(
  tagName: string,
  props: Record<string, unknown>,
  nestingDepth: number,
  collectedErrors: RenderError[],
  collectedHints: HydrationHint[],
  hooks: RenderHooks | undefined,
): RenderOutput {
  // Recoverable, like a render() throw: the rest of the page still renders.
  const err = classifyError('instantiate', tagName, 'Failed to instantiate', true);
  collectedErrors.push(err);
  dispatchRenderError(err, hooks);

  // Align with the render()-failure fallback: bare tag with serialized props.
  return bareTagFallbackOutput(
    tagName,
    props,
    collectedErrors,
    collectedHints,
    hooks,
    0,
    nestingDepth,
  );
}

/** Boundary behavior for one renderComponentContent call (ADR-0053 Layer 2). */
interface BoundaryScope {
  /** This component is an error boundary (static isErrorBoundary = true). */
  isBoundary: boolean;
  /** Render in captured-error state: substitute the onError fallback. */
  boundaryError?: unknown;
  /** An ancestor boundary scope is active: bubble failures instead of bare-tagging. */
  throwOnRenderError?: boolean;
  /** #975: bounded ancestor path window for the depth-trip message. */
  renderPath?: readonly string[];
}

/** render() dispatch + DSD tree serialization + render-failure fallback. */
async function renderComponentContent(
  tagName: string,
  props: Record<string, unknown>,
  instance: DsdComponent,
  nestingDepth: number,
  hooks: RenderHooks | undefined,
  collectedErrors: RenderError[],
  collectedHints: HydrationHint[],
  startTime: number,
  boundary: BoundaryScope,
): Promise<{ content: string; hasError: boolean; earlyReturn?: RenderOutput }> {
  const captured = boundary.boundaryError !== undefined;
  // A boundary renders its own shadow output inside a fresh boundary scope,
  // so failures there come back to its own catch below; other components
  // only forward the scope they were called with.
  const subtreeScope = captured ? false : boundary.throwOnRenderError === true ||
    boundary.isBoundary;
  try {
    const result: unknown = captured
      ? renderBoundaryFallbackContent(
        instance,
        boundary.boundaryError,
        tagName,
        collectedErrors,
        hooks,
      )
      : instance.render();
    if (result == null) {
      return { content: '', hasError: captured };
    }
    if (isVNode(result)) {
      // Captured fallback content renders with an inactive scope: a failing
      // component inside the fallback degrades in place instead of looping.
      return {
        content: await renderDsdTree(
          result,
          undefined,
          nestingDepth,
          subtreeScope,
          boundary.renderPath,
        ),
        hasError: captured,
      };
    }
    log.debug(`Unsupported render() return for <${tagName}>: ${describeRenderValue(result)}`);
    const errDetail = `Components must return a VNode from render(), got ${typeof result}.`;
    const err = classifyError('render', tagName, errDetail, false);
    collectedErrors.push(err);
    dispatchRenderError(err, hooks);
    return { content: '', hasError: true };
  } catch (err) {
    // #922: control-flow exceptions (notFound/redirect from a page element's
    // render) propagate instead of degrading to the empty-element fallback.
    if (isControlFlowThrow(err) || isDepthLimitError(err)) throw err;

    const classifiedErr = recordCaughtError(err, tagName, collectedErrors, hooks);

    // An error boundary captures its own render failure and substitutes its
    // fallback — exactly once; a failing fallback bubbles outward / degrades.
    if (boundary.isBoundary && !captured) {
      const fallback = await tryBoundaryFallback(instance, err, nestingDepth, boundary.renderPath);
      if (fallback) return fallback;
    }

    if (boundary.throwOnRenderError) {
      throw err instanceof BoundaryRenderError ? err : new BoundaryRenderError(classifiedErr);
    }

    const fallbackResult = bareTagFallbackOutput(
      tagName,
      props,
      collectedErrors,
      collectedHints,
      hooks,
      safeNow() - startTime,
      nestingDepth,
    );
    return { content: '', hasError: true, earlyReturn: fallbackResult };
  }
}

/**
 * Push a caught error into the render output, dispatching telemetry exactly
 * once. A BoundaryRenderError was already classified and dispatched at its
 * origin renderDsd call — carry it without double-reporting.
 */
function recordCaughtError(
  err: unknown,
  tagName: string,
  collectedErrors: RenderError[],
  hooks: RenderHooks | undefined,
): RenderError {
  if (err instanceof BoundaryRenderError) {
    collectedErrors.push(err.renderError);
    return err.renderError;
  }
  const classified = classifyError('render', tagName, err, true);
  collectedErrors.push(classified);
  dispatchRenderError(classified, hooks);
  return classified;
}

/** Record a captured subtree error, then invoke the boundary fallback. */
function renderBoundaryFallbackContent(
  instance: DsdComponent,
  boundaryError: unknown,
  tagName: string,
  collectedErrors: RenderError[],
  hooks: RenderHooks | undefined,
): unknown {
  recordCaughtError(boundaryError, tagName, collectedErrors, hooks);
  // Pass the original throw (a BoundaryRenderError is itself an Error carrying
  // the origin message), not the classified RenderError metadata object.
  return callBoundaryFallback(instance, boundaryError);
}

/**
 * Invoke a boundary instance's fallback. ErrorBoundary subclasses expose
 * `_captureSsrError` (sets error state so render() swaps in onError); any
 * other isErrorBoundary component needs an `onError(error): VNode` method.
 */
function callBoundaryFallback(instance: DsdComponent, error: unknown): unknown {
  const target = instance as unknown as Record<string, unknown>;
  if (typeof target._captureSsrError === 'function') {
    (target._captureSsrError as (this: unknown, e: unknown) => void).call(instance, error);
    return instance.render();
  }
  if (typeof target.onError === 'function') {
    return (target.onError as (this: unknown, e: unknown) => unknown).call(instance, error);
  }
  return null;
}

/**
 * Render a boundary's fallback for its own render failure. Returns null when
 * the fallback itself fails — the caller then bubbles / bare-tags.
 */
async function tryBoundaryFallback(
  instance: DsdComponent,
  err: unknown,
  nestingDepth: number,
  renderPath?: readonly string[],
): Promise<{ content: string; hasError: boolean } | null> {
  try {
    const result = callBoundaryFallback(instance, err);
    if (result == null) return { content: '', hasError: true };
    if (isVNode(result)) {
      return {
        content: await renderDsdTree(result, undefined, nestingDepth, false, renderPath),
        hasError: true,
      };
    }
    return null;
  } catch (fallbackErr) {
    if (isControlFlowThrow(fallbackErr) || isDepthLimitError(fallbackErr)) throw fallbackErr;
    log.debug(`error boundary fallback render failed: ${formatError(fallbackErr)}`);
    return null;
  }
}

/** Static stylesheet rules → CSS text for the DSD template. */
function collectStyleCss(ctor: DsdComponentConstructor): string {
  if (!ctor.styles) return '';
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  let styleCss = '';
  for (const sheet of sheets) {
    try {
      for (const rule of [...sheet.cssRules]) {
        styleCss += rule.cssText + '\n';
      }
    } catch {
      // Cross-origin stylesheet or empty sheet - skip silently
    }
  }
  return styleCss;
}

/** Guarded afterRender hook dispatch, shared by all output paths. */
function callAfterRenderHook(hooks: RenderHooks | undefined, output: RenderOutput): void {
  if (!hooks?.afterRender) return;
  try {
    hooks.afterRender(output);
  } catch (e) {
    log.debug(`afterRender hook threw: ${formatError(e)}`);
  }
}

/** Safe high-resolution timestamp with SSR/environment fallback. */
function safeNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function describeRenderValue(value: unknown): string {
  if (value === null || typeof value !== 'object') return typeof value;
  const keys = Object.keys(value).join(',');
  return `object keys=[${keys}]`;
}
