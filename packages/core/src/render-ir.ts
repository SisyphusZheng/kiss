/**
 * Internal structured render IR.
 *
 * v0.29.1: Unified attribute serialization and single async render path.
 * `renderDsdTree` is the only public rendering API. All internal rendering
 * flows through `renderToNode`.
 */

import { escapeAttr, escapeHtml } from './html-escape.ts';
import {
  createEventMarkerContext,
  type EventMarkerContext,
  serializeEventMarkers,
} from './event-marker.ts';
import { FOR_TAG, Fragment, HTML_TAG, SHOW_TAG } from './jsx-runtime.ts';
import { DANGEROUS_KEYS, trustRenderHtml } from './security.ts';
import { isSignalLike, resolveSignalProp, unwrapSignalLike } from '@openelement/signal';
import { isComponentCtor, isComponentFn, isVNode } from './vnode.ts';
import type { RenderFn, VNode } from '@openelement/protocol/vnode';
import { renderDsd } from './render-dsd.ts';
import { createLogger } from './logger.ts';
import { formatError } from './errors.ts';

export type RenderNode =
  | { kind: 'text'; value: string }
  | { kind: 'trusted-html'; value: string }
  | { kind: 'fragment'; children: RenderNode[] }
  | {
    kind: 'element';
    tag: string;
    attrs: Record<string, unknown>;
    eventAttrs?: string;
    children: RenderNode[];
    voidElement?: boolean;
  }
  | {
    kind: 'dsd-host';
    tag: string;
    attrs: Record<string, unknown>;
    ssrPropsAttr: string;
    source: string;
    templateAttrs: string;
    styleCss: string;
    shadow: RenderNode[];
    light: RenderNode[];
    layer: string;
  };

export const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export function textNode(value: unknown): RenderNode {
  return { kind: 'text', value: String(value) };
}

export function trustedHtmlNode(value: unknown): RenderNode {
  return { kind: 'trusted-html', value: trustRenderHtml(String(value)) };
}

export function fragmentNode(children: RenderNode[]): RenderNode {
  return { kind: 'fragment', children };
}

export function dsdHostNode(params: Omit<Extract<RenderNode, { kind: 'dsd-host' }>, 'kind'>) {
  return { kind: 'dsd-host', ...params } satisfies RenderNode;
}

export function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

// ─── Unified Attribute Serialization ────────────────────────────

const SKIP_ATTR_KEYS = new Set([
  'children',
  'ref',
  'key',
  'trustedHtml',
  'innerHTML',
  'textContent',
]);

export function serializeAttrs(tag: string, props: Record<string, unknown>): string {
  const isCustomElement = tag.includes('-');
  let result = '';

  for (const [key, value] of Object.entries(props)) {
    if (SKIP_ATTR_KEYS.has(key)) continue;
    if (key.startsWith('on') && typeof value === 'function') continue;
    if (typeof value === 'function') continue;
    if (value == null) continue;

    let attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;
    if (isCustomElement && attrName === key) {
      attrName = camelToKebab(attrName);
    }

    const resolved = unwrapSignalLike(value);

    if (typeof resolved === 'boolean') {
      if (resolved) result += ` ${attrName}`;
      continue;
    }

    if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
      const styleObj: Record<string, unknown> = {};
      for (const [sk, sv] of Object.entries(resolved as Record<string, unknown>)) {
        styleObj[sk] = unwrapSignalLike(sv);
      }
      const css = styleObjectToString(styleObj);
      if (css) result += ` style="${escapeAttr(css)}"`;
      continue;
    }

    if (typeof resolved === 'object') {
      result += ` ${attrName}="${escapeAttr(JSON.stringify(resolved))}"`;
    } else {
      result += ` ${attrName}="${escapeAttr(String(resolved))}"`;
    }
  }

  return result;
}

// ─── Serialization ──────────────────────────────────────────────

export function serializeRenderNode(node: RenderNode): string {
  switch (node.kind) {
    case 'text':
      return escapeHtml(node.value);
    case 'trusted-html':
      return node.value;
    case 'fragment':
      return node.children.map(serializeRenderNode).join('');
    case 'element': {
      const attrs = serializeAttrs(node.tag, node.attrs);
      const events = node.eventAttrs ?? '';
      if (node.voidElement || VOID_ELEMENTS.has(node.tag)) {
        return `<${node.tag}${attrs}${events}>`;
      }
      return `<${node.tag}${attrs}${events}>${
        node.children.map(serializeRenderNode).join('')
      }</${node.tag}>`;
    }
    case 'dsd-host': {
      const attrs = serializeAttrs(node.tag, node.attrs);
      if (node.layer === 'pure-island' || node.layer === 'light-dom') {
        return `<${node.tag}${attrs}${node.ssrPropsAttr}${node.source}>${
          [...node.shadow, ...node.light].map(serializeRenderNode).join('')
        }</${node.tag}>`;
      }
      const style = node.styleCss ? `\n    <style>${node.styleCss}</style>` : '';
      return `<${node.tag}${attrs}${node.ssrPropsAttr}${node.source}>
  <template shadowrootmode="open"${node.templateAttrs}>${style}
    ${node.shadow.map(serializeRenderNode).join('')}
  </template>
${node.light.map(serializeRenderNode).join('')}</${node.tag}>`;
    }
  }
}

// ─── Single async render path ───────────────────────────────────

export async function renderToNode(
  node: unknown,
  eventContext: EventMarkerContext = createEventMarkerContext(),
): Promise<RenderNode> {
  if (node == null || node === false || typeof node === 'boolean') return fragmentNode([]);
  if (typeof node === 'string' || typeof node === 'number') return textNode(node);
  if (isSignalLike(node)) {
    return await renderToNode((node as { value: unknown }).value, eventContext);
  }
  if (!isVNode(node)) return textNode(String(node));

  const { tag, props, children } = node;

  // Fragment
  if (
    tag === Fragment || (typeof tag === 'symbol' && String(tag) === 'Symbol(openelement.fragment)')
  ) {
    const parts: RenderNode[] = [];
    for (const child of children) parts.push(await renderToNode(child, eventContext));
    return fragmentNode(parts);
  }

  // Trusted HTML (raw HTML insertion, no wrapping tag)
  if (tag === HTML_TAG) {
    return trustedHtmlNode(props?.html ?? '');
  }

  // Show
  if (tag === SHOW_TAG || tag === 'show') {
    const whenVal = resolveSignalProp(props?.when);
    const target = whenVal ? children[0] : children[1];
    return target ? await renderToNode(target, eventContext) : fragmentNode([]);
  }

  // For
  if (tag === FOR_TAG || tag === 'for') {
    const items = resolveSignalProp(props?.each) as unknown[];
    const renderFn = children[0] as RenderFn;
    if (!Array.isArray(items) || typeof renderFn !== 'function') {
      return fragmentNode([]);
    }
    const parts: RenderNode[] = [];
    for (let index = 0; index < items.length; index++) {
      parts.push(await renderToNode(renderFn(items[index], index), eventContext));
    }
    return fragmentNode(parts);
  }

  // Component function/class
  if (isComponentCtor(tag) || isComponentFn(tag)) {
    try {
      return await renderToNode(callComponent(tag, props, children), eventContext);
    } catch (err) {
      createLogger('render').error(
        `render failed for <${String(tag)}>:` +
          ` ${formatError(err)}`,
      );
      return fragmentNode([]);
    }
  }

  // HTML / SVG element
  const tagName = String(tag);
  const childNodes: RenderNode[] = [];

  if (props?.innerHTML !== undefined) {
    const value = unwrapSignalLike(props.innerHTML);
    childNodes.push(props.trustedHtml === true ? trustedHtmlNode(value) : textNode(value));
  } else if (props?.textContent !== undefined) {
    childNodes.push(textNode(unwrapSignalLike(props.textContent)));
  } else {
    for (const child of children) childNodes.push(await renderToNode(child, eventContext));
  }

  if (
    typeof customElements !== 'undefined' &&
    customElements.get &&
    customElements.get(tagName)
  ) {
    try {
      const dsdResult = await renderDsd(tagName, {
        componentClass: customElements.get(tagName) as CustomElementConstructor,
        props,
        lightDom: childNodes,
      });
      return trustedHtmlNode(dsdResult.html);
    } catch (err) {
      createLogger('render').error(
        `renderDsd failed for registered CE <${tagName}>:` +
          ` ${formatError(err)}`,
      );
    }
  }

  return {
    kind: 'element',
    tag: tagName,
    attrs: props,
    eventAttrs: serializeEventMarkers(props, eventContext),
    children: childNodes,
    voidElement: VOID_ELEMENTS.has(tagName),
  };
}

// ─── Public API ─────────────────────────────────────────────────

export async function renderDsdTree(
  node: unknown,
  eventContext: EventMarkerContext = createEventMarkerContext(),
): Promise<string> {
  return serializeRenderNode(await renderToNode(node, eventContext));
}

// ─── Helpers ────────────────────────────────────────────────────

function callComponent(
  tag: VNode['tag'],
  props: Record<string, unknown>,
  children: (VNode | string | RenderFn)[],
): unknown {
  if (isComponentCtor(tag)) {
    const instance = new tag();
    for (const [key, value] of Object.entries(props)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      (instance as Record<string, unknown>)[key] = value;
    }
    return instance.render();
  }
  if (isComponentFn(tag)) {
    return tag({ ...props, children });
  }
  return null;
}

function styleObjectToString(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .filter(([, value]) => value != null)
    .map(([key, value]) => {
      const prop = key.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
      return `${prop}: ${value}`;
    })
    .join('; ');
}
