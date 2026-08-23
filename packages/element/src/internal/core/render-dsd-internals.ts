/** Resolution, boundary recovery, signal markers, and render metrics for DSD. */
import type {
  DsdComponent,
  DsdComponentConstructor,
  HydrationHint,
  RenderError,
  RenderHooks,
  RenderOutput,
} from '../protocol/render.ts';
import type { Signal } from '../protocol/signal.ts';
import type { VNode } from '../protocol/vnode.ts';
import { DATA_SIGNAL, DATA_SIGNAL_ATTR } from '../protocol/hydration-markers.ts';
import { createLogger } from './logger.ts';
import { formatError, OpenElementError } from './errors.ts';
import { isVNode } from './vnode.ts';
import { renderDsdTree } from './render-ir.ts';
import { serializeAttrs } from './render-ir.ts';
import { isSignalLike } from '../signal/index.ts';
import { BoundaryRenderError, isControlFlowThrow, isDepthLimitError } from './render-policy.ts';
import { classifyError, dispatchRenderError } from './render-dsd-errors.ts';
import { createEventMarkerContext } from './event-marker.ts';

const log = createLogger('render-dsd');

interface ResolveComponentOptions {
  componentClass?: CustomElementConstructor;
  props?: Record<string, unknown>;
}

export function resolveComponent(
  input: string | CustomElementConstructor,
  options: ResolveComponentOptions,
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
export function bareTagFallbackOutput(
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
export function instantiationFailureOutput(
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
export async function renderComponentContent(
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
      const signalRegistry = instance.signalRegistry instanceof Map
        ? instance.signalRegistry as Map<string, Signal<unknown>>
        : undefined;
      // Captured fallback content renders with an inactive scope: a failing
      // component inside the fallback degrades in place instead of looping.
      return {
        content: await renderDsdTree(
          addRegisteredSignalMarkers(result, signalRegistry),
          renderEventContext(instance),
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
  } finally {
    instance.__openElementDisposeRenderDataContext?.();
  }
}

function renderEventContext(instance: DsdComponent) {
  const context = createEventMarkerContext();
  if (typeof instance.__openElementEvaluateRender === 'function') {
    context.evaluate = instance.__openElementEvaluateRender.bind(instance);
  }
  return context;
}

/**
 * Add the same named-signal hydration markers that the CSR backend emits.
 * Registration is the sole identity source: signal-shaped values outside the
 * component registry remain ordinary serialized values.
 */
function addRegisteredSignalMarkers(
  vnode: VNode,
  registry: Map<string, Signal<unknown>> | undefined,
): VNode {
  if (!registry || registry.size === 0) return vnode;
  const names = new Map<Signal<unknown>, string>();
  for (const [name, registered] of registry) names.set(registered, name);

  const visit = (node: VNode): VNode => {
    const props = { ...node.props };
    const children = node.children.map((child) => isVNode(child) ? visit(child) : child);
    if (typeof node.tag === 'string' && props[DATA_SIGNAL] == null) {
      const attrBindings = Object.entries(props).flatMap(([key, value]) => {
        if (!isSignalLike(value)) return [];
        const name = names.get(value as Signal<unknown>);
        return name ? [{ key, name }] : [];
      });
      const textSignal = children.length === 1 && isSignalLike(children[0])
        ? names.get(children[0] as Signal<unknown>)
        : undefined;

      // The marker protocol binds one named signal per element. Do not emit a
      // misleading marker when multiple independently named signals compete.
      const bindingNames = new Set(attrBindings.map((binding) => binding.name));
      if (textSignal) bindingNames.add(textSignal);
      if (bindingNames.size === 1) {
        const [name] = bindingNames;
        props[DATA_SIGNAL] = name;
        if (!textSignal && attrBindings.length > 0 && props[DATA_SIGNAL_ATTR] == null) {
          props[DATA_SIGNAL_ATTR] = attrBindings.map((binding) => binding.key).join(',');
        }
      }
    }
    return { ...node, props, children };
  };

  return visit(vnode);
}

/**
 * Push a caught error into the render output, dispatching telemetry exactly
 * once. A BoundaryRenderError was already classified and dispatched at its
 * origin renderDsd call — carry it without double-reporting.
 */
export function recordCaughtError(
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
        content: await renderDsdTree(
          result,
          renderEventContext(instance),
          nestingDepth,
          false,
          renderPath,
        ),
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
export function collectStyleCss(ctor: DsdComponentConstructor): string {
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
export function callAfterRenderHook(hooks: RenderHooks | undefined, output: RenderOutput): void {
  if (!hooks?.afterRender) return;
  try {
    hooks.afterRender(output);
  } catch (e) {
    log.debug(`afterRender hook threw: ${formatError(e)}`);
  }
}

/** Safe high-resolution timestamp with SSR/environment fallback. */
export function safeNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function describeRenderValue(value: unknown): string {
  if (value === null || typeof value !== 'object') return typeof value;
  const keys = Object.keys(value).join(',');
  return `object keys=[${keys}]`;
}
