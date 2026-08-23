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
  type DsdOptions,
  type DsdRenderMetrics,
  type HydrationHint,
  type RenderError,
  type RenderHooks,
  type RenderInput,
  type RenderOutput,
} from '../protocol/render.ts';
import { type DsdComponentConstructor } from '../protocol/render.ts';
import type { ComponentLayer } from '../protocol/framework.ts';
import { createLogger } from './logger.ts';
import { formatError, OpenElementError } from './errors.ts';
import { classifyError, dispatchRenderError, instantiateComponent } from './render-dsd-errors.ts';
import {
  bareTagFallbackOutput,
  callAfterRenderHook,
  collectStyleCss,
  instantiationFailureOutput,
  recordCaughtError,
  renderComponentContent,
  resolveComponent,
  safeNow,
} from './render-dsd-internals.ts';
import { escapeAttrValue } from './html-escape.ts';
import { dsdHostNode, type RenderNode, serializeRenderNode, trustedHtmlNode } from './render-ir.ts';
import { injectPropsSafe } from './security.ts';
import { collectPublicProps } from './props-utils.ts';
import { DATA_SSR_PROPS } from '../protocol/hydration-markers.ts';
import {
  BoundaryRenderError,
  formatDepthPathSuffix,
  isControlFlowThrow,
  isDepthLimitError,
  MAX_SSR_NESTING_DEPTH,
} from './render-policy.ts';
export {
  appendRenderPathSegment,
  BoundaryRenderError,
  formatDepthPathSuffix,
  isControlFlowThrow,
  isDepthLimitError,
  MAX_SSR_NESTING_DEPTH,
  RENDER_PATH_TRACK_MIN_DEPTH,
} from './render-policy.ts';

const log = createLogger('render-dsd');

// ─── Depth-Trip Render Path (#975) ─────────────────────────────

/**
 * Render-path tracking for the depth-trip message activates only this close
 * to the limit, so the success path carries zero path-tracking overhead.
 * Segments recorded above this depth are honestly marked with a leading '…'.
 */

/**
 * Append one segment to the bounded render-path window. Returns a new array
 * (path tracking is only active near the depth limit, so the copy cost is
 * bounded and rare); when the window is full the oldest segments drop behind
 * a leading '…' truncation marker.
 */

/**
 * `(path: … > blog-list > for-item[key=42] > x-d60)` suffix for the
 * depth-trip message, or '' when no path was tracked. The tripping tag is
 * always the last segment.
 */

// ─── Error Classification ──────────────────────────────────────
// RenderPhase and RenderErrorCode are imported from ../protocol/render.ts.

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
