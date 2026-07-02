/**
 * @openelement/core - DSD Renderer.
 *
 * Declarative Shadow DOM SSR renderer.
 * Framework-agnostic: no Lit dependency and no TemplateResult knowledge.
 *
 * v0.29.1: Inlined render-errors, render-instantiate, and render-serialize helpers.
 * Uses unified serializeAttrs from render-ir. Removed renderDsdByName.
 * Changed renderDsdTree import from jsx-render-string to render-ir.
 *
 * @module @openelement/core/render-dsd
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
} from '@openelement/protocol/render';
import { type DsdComponentConstructor } from '@openelement/protocol/render';
import type { ComponentLayer } from '@openelement/protocol/framework';
import { createLogger } from './logger.ts';
import { formatError } from './errors.ts';
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
import { DANGEROUS_KEYS } from './security.ts';

const log = createLogger('core');

// ─── Error Classification ──────────────────────────────────────
// RenderPhase and RenderErrorCode are imported from @openelement/protocol/render.

export function classifyError(
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

// lookup table replaces 5-case if/else chain
const ERROR_CODES: Record<string, RenderErrorCode> = {
  instantiate: 'LESS_RENDER_INSTANTIATE_FAILED',
  nested: 'LESS_RENDER_NESTED_FAILED',
  style: 'LESS_RENDER_STYLE_FAILED',
  serialize: 'LESS_RENDER_SERIALIZE_FAILED',
};

function codeForRenderError(phase: RenderPhase, message: string): RenderErrorCode {
  if (message.includes('Components must return a VNode')) {
    return 'LESS_RENDER_INVALID_OUTPUT';
  }
  return ERROR_CODES[phase] ?? 'LESS_RENDER_RENDER_FAILED';
}

function instantiationErrorHtml(
  tagName: string,
  _errMsg: string,
  _sourceStr: string,
  _route?: string,
  _source?: string,
): string {
  return `<${tagName}></${tagName}>`;
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

function injectProps(
  instance: DsdComponent,
  tagName: string,
  props: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(props)) {
    if (DANGEROUS_KEYS.has(key)) {
      log.warn(
        `Skipping dangerous prop key "${key}" on <${tagName}> - potential prototype pollution`,
      );
      continue;
    }
    try {
      (instance as Record<string, unknown>)[key] = value;
    } catch (e) {
      log.debug(
        `Cannot set read-only property "${key}" on <${tagName}>: ${formatError(e)}`,
      );
    }
  }
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
}): string {
  const { tagName, props, content, styleCss, layer, sourceStr, dsdOptions, lightDom } = params;
  const publicProps = filterPublicDsdProps(props);
  const ssrPropsAttr = Object.keys(publicProps).length > 0
    ? ` data-ssr-props="${escapeAttrValue(JSON.stringify(publicProps))}"`
    : '';

  return serializeRenderNode(
    dsdHostNode({
      tag: tagName,
      attrs: publicProps,
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

function filterPublicDsdProps(props: Record<string, unknown>): Record<string, unknown> {
  const publicProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('__openElement')) continue;
    publicProps[key] = value;
  }
  return publicProps;
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
}

export async function renderDsd(
  input: string | CustomElementConstructor,
  options: RenderDsdOptions = {},
): Promise<RenderOutput> {
  let tagName: string;
  let componentClass: CustomElementConstructor;
  const props = options.props ?? {};

  if (typeof input === 'string') {
    tagName = input;
    if (options?.componentClass) {
      componentClass = options.componentClass;
    } else {
      const cls = globalThis.customElements?.get(tagName) as CustomElementConstructor | undefined;
      if (!cls) {
        log.warn(`<${tagName}> is not registered - rendering as void element`);
        const attrs = serializeAttrs(tagName, props);
        const html = `<${tagName}${attrs}></${tagName}>`;
        return {
          html,
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
      componentClass = cls;
    }
  } else {
    componentClass = input;
    tagName = (input as DsdComponentConstructor).tagName ?? 'unknown';
  }

  const sourceInfo = options.sourceInfo;
  const dsdOptions = options.dsdOptions;
  const nestingDepth = options.nestingDepth;
  const hooks = options.hooks;

  const _nestingDepth = nestingDepth ?? 0;
  const startTime = typeof performance !== 'undefined' ? performance.now() : 0;
  const sourceStr = sourceInfo
    ? `${sourceInfo.route ? ` route="${sourceInfo.route}"` : ''}${
      sourceInfo.source ? ` source="${sourceInfo.source}"` : ''
    }`
    : '';

  const collectedErrors: RenderError[] = [];
  const collectedHints: HydrationHint[] = [];
  let hasError = false;

  const renderInput: RenderInput = {
    tagName,
    componentClass,
    props,
    dsdOptions,
    nestingDepth: _nestingDepth,
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
    const errMsg = 'Failed to instantiate';
    const err = classifyError('instantiate', tagName, errMsg, false);
    collectedErrors.push(err);
    hasError = true;
    hooks?.onError?.(err);

    const html = instantiationErrorHtml(
      tagName,
      errMsg,
      sourceStr,
      sourceInfo?.route,
      sourceInfo?.source,
    );

    const result: RenderOutput = {
      html,
      errors: collectedErrors,
      metrics: {
        tagName,
        renderTimeMs: 0,
        templateSize: 0,
        layer: 'dsd-static',
        hasError: true,
        nestingDepth: _nestingDepth,
      },
      hydrationHints: collectedHints,
    };
    hooks?.afterRender?.(result);
    return result;
  }

  injectProps(instance, tagName, props);

  let content = '';
  try {
    const result: unknown = instance.render();
    if (result == null) {
      content = '';
    } else if (isVNode(result)) {
      content = await renderDsdTree(result);
    } else {
      log.debug(`Unsupported render() return for <${tagName}>: ${describeRenderValue(result)}`);
      const errDetail = `Components must return a VNode from render(), got ${typeof result}.`;
      const err = classifyError('render', tagName, errDetail, false);
      collectedErrors.push(err);
      hasError = true;
      hooks?.onError?.(err);
      content = '';
    }
  } catch (err) {
    const classifiedErr = classifyError('render', tagName, err, true);
    collectedErrors.push(classifiedErr);
    hasError = true;
    hooks?.onError?.(classifiedErr);

    const attrs = serializeAttrs(tagName, props);
    const renderEndFallback = safeNow();
    const fallbackResult: RenderOutput = {
      html: `<${tagName}${attrs}></${tagName}>`,
      errors: collectedErrors,
      metrics: {
        tagName,
        renderTimeMs: renderEndFallback - startTime,
        templateSize: 0,
        layer: 'dsd-static',
        hasError: hasError,
        nestingDepth: _nestingDepth,
      },
      hydrationHints: collectedHints,
    };
    hooks?.afterRender?.(fallbackResult);
    return fallbackResult;
  }

  let styleCss = '';

  const ctor = componentClass as DsdComponentConstructor;
  if (ctor.styles) {
    const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
    for (const sheet of sheets) {
      try {
        for (const rule of [...sheet.cssRules]) {
          styleCss += rule.cssText + '\n';
        }
      } catch {
        // Cross-origin stylesheet or empty sheet - skip silently
      }
    }
  }

  const renderMode = ctor.renderMode ?? 'shadow';
  const resolvedLayer = renderMode === 'light'
    ? 'light-dom'
    : dsdOptions?.layer || instance.layer || 'dsd-static';

  const renderEnd = safeNow();
  const renderTimeMs = renderEnd - startTime;

  const metrics: DsdRenderMetrics = {
    tagName,
    renderTimeMs,
    templateSize: content.length,
    layer: resolvedLayer,
    hasError,
    nestingDepth: _nestingDepth,
  };

  if (resolvedLayer !== 'dsd-static') {
    collectedHints.push({
      tagName,
      layer: resolvedLayer as ComponentLayer,
    });
  }

  const html = wrapDsdOutput({
    tagName,
    props,
    content,
    styleCss,
    layer: resolvedLayer,
    sourceStr,
    dsdOptions,
    lightDom: options.lightDom,
  });

  const output: RenderOutput = {
    html,
    errors: collectedErrors,
    metrics,
    hydrationHints: collectedHints,
  };

  if (hooks?.afterRender) {
    try {
      hooks.afterRender(output);
    } catch (e) {
      log.debug(`afterRender hook threw: ${formatError(e)}`);
    }
  }

  return output;
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

// v0.21.0: Streaming types and functions moved to render-dsd-stream.ts.
export { createRenderDsdStreamMetrics, renderDsdStream } from './render-dsd-stream.ts';
export type {
  RenderDsdStreamChunk,
  RenderDsdStreamComponent,
  RenderDsdStreamMetrics,
  RenderDsdStreamOptions,
} from './render-dsd-stream.ts';
