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
  forBranchMarker,
  serializeEventMarkers,
  showBranchMarker,
} from './event-marker.ts';
import { HTML_TAG, isForTag, isFragment, isShowTag } from './jsx-runtime.ts';
import { injectPropsSafe, trustRenderHtml } from './security.ts';
import { isSignalLike, unwrapSignalLike } from '../signal/index.ts';
import { isComponentCtor, isComponentFn, isVNode } from './vnode.ts';
import type { ComponentCtor, ComponentFn, RenderFn, VNode } from '../protocol/vnode.ts';
import { isControlFlowThrow, renderDsd } from './render-dsd.ts';
import { createLogger } from './logger.ts';
import { formatError } from './errors.ts';
import { camelToKebab } from './tag-utils.ts';

export type RenderNode =
  | { kind: 'text'; value: string }
  | { kind: 'trusted-html'; value: string }
  | { kind: 'comment'; value: string }
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
    eventAttrs?: string;
    ssrPropsAttr: string;
    source: string;
    templateAttrs: string;
    styleCss: string;
    shadow: RenderNode[];
    light: RenderNode[];
    layer: string;
  };

const VOID_ELEMENTS = new Set([
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

/**
 * Internal branch-state comment (`<!--oe-branch:...-->`). Values are produced
 * by showBranchMarker/forBranchMarker and contain only `[a-z0-9:-]`, so they
 * are safe to serialize verbatim inside an HTML comment.
 */
function branchCommentNode(value: string): RenderNode {
  return { kind: 'comment', value };
}

export function trustedHtmlNode(value: unknown): RenderNode {
  return { kind: 'trusted-html', value: trustRenderHtml(String(value)) };
}

function fragmentNode(children: RenderNode[]): RenderNode {
  return { kind: 'fragment', children };
}

export function dsdHostNode(params: Omit<Extract<RenderNode, { kind: 'dsd-host' }>, 'kind'>) {
  return { kind: 'dsd-host', ...params } satisfies RenderNode;
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

// #602: attribute *names* are not escaped — reject anything that cannot be a
// safe HTML attribute name (blocks quote/space/event-handler injection).
const SAFE_ATTR_NAME = /^[a-zA-Z_:][\w:.-]*$/;

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
    if (!SAFE_ATTR_NAME.test(attrName)) continue;
    // Never emit HTML event-handler attributes from SSR props.
    if (/^on/i.test(attrName)) continue;

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
    case 'comment':
      return `<!--${node.value}-->`;
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
      const events = node.eventAttrs ?? '';
      if (node.layer === 'pure-island' || node.layer === 'light-dom') {
        return `<${node.tag}${attrs}${events}${node.ssrPropsAttr}${node.source}>${
          [...node.shadow, ...node.light].map(serializeRenderNode).join('')
        }</${node.tag}>`;
      }
      const style = node.styleCss ? `\n    <style>${node.styleCss}</style>` : '';
      return `<${node.tag}${attrs}${events}${node.ssrPropsAttr}${node.source}>
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
  nestingDepth = 0,
): Promise<RenderNode> {
  if (node == null || typeof node === 'boolean') return fragmentNode([]);
  if (typeof node === 'string' || typeof node === 'number') return textNode(node);
  if (isSignalLike(node)) {
    return await renderToNode((node as { value: unknown }).value, eventContext, nestingDepth);
  }
  if (!isVNode(node)) return textNode(String(node));

  const { tag, props, children } = node;

  // Fragment
  if (isFragment(tag)) {
    const parts: RenderNode[] = [];
    for (const child of children) parts.push(await renderToNode(child, eventContext, nestingDepth));
    return fragmentNode(parts);
  }

  // Trusted HTML (raw HTML insertion, no wrapping tag)
  if (tag === HTML_TAG) {
    return trustedHtmlNode(props?.html ?? '');
  }

  // Show
  if (isShowTag(tag)) {
    return await renderShowBranch(props, children, eventContext, nestingDepth);
  }

  // For
  if (isForTag(tag)) {
    return await renderForBranch(props, children, eventContext, nestingDepth);
  }

  // Component function/class
  if (isComponentCtor(tag) || isComponentFn(tag)) {
    return await renderComponentBranch(tag, props, children, eventContext, nestingDepth);
  }

  // HTML / SVG element
  const tagName = String(tag);
  const childNodes = await renderElementChildren(props, children, eventContext, nestingDepth);

  if (
    typeof customElements !== 'undefined' &&
    customElements.get &&
    customElements.get(tagName)
  ) {
    return await renderRegisteredCeBranch(
      tagName,
      props,
      childNodes,
      eventContext,
      nestingDepth,
    );
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

/**
 * `<Show>`: record the branch taken so hydration can detect signal drift
 * between SSR and hydration (a flipped branch shifts every subsequent
 * data-eid), then render the active child.
 */
async function renderShowBranch(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
): Promise<RenderNode> {
  const whenVal = unwrapSignalLike(props?.when);
  const target = whenVal ? children[0] : children[1];
  const branch = branchCommentNode(showBranchMarker(Boolean(whenVal)));
  const rendered = target ? await renderToNode(target, eventContext, nestingDepth) : null;
  return fragmentNode(rendered ? [branch, rendered] : [branch]);
}

/** `<For>`: record the branch token, then render each item in order. */
async function renderForBranch(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
): Promise<RenderNode> {
  const items = unwrapSignalLike(props?.each) as unknown[];
  const renderFn = children[0] as RenderFn;
  const branch = branchCommentNode(forBranchMarker(items));
  if (!Array.isArray(items) || typeof renderFn !== 'function') {
    return fragmentNode([branch]);
  }
  const parts: RenderNode[] = [branch];
  for (let index = 0; index < items.length; index++) {
    parts.push(await renderToNode(renderFn(items[index], index), eventContext, nestingDepth));
  }
  return fragmentNode(parts);
}

/** Component class/function: invoke, then render the returned node. */
async function renderComponentBranch(
  tag: ComponentCtor | ComponentFn,
  props: Record<string, unknown> | undefined,
  children: VNode['children'],
  eventContext: EventMarkerContext,
  nestingDepth: number,
): Promise<RenderNode> {
  try {
    return await renderToNode(
      callComponent(tag, props ?? {}, children),
      eventContext,
      nestingDepth,
    );
  } catch (err) {
    createLogger('render').error(
      `render failed for <${String(tag)}>:` +
        ` ${formatError(err)}`,
    );
    throw err;
  }
}

/** Element children: innerHTML / textContent override, else render children. */
async function renderElementChildren(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
): Promise<RenderNode[]> {
  const childNodes: RenderNode[] = [];

  if (props?.innerHTML !== undefined) {
    const value = unwrapSignalLike(props.innerHTML);
    childNodes.push(props.trustedHtml === true ? trustedHtmlNode(value) : textNode(value));
  } else if (props?.textContent !== undefined) {
    childNodes.push(textNode(unwrapSignalLike(props.textContent)));
  } else {
    for (const child of children) {
      childNodes.push(await renderToNode(child, eventContext, nestingDepth));
    }
  }

  return childNodes;
}

/**
 * Registered custom element: delegate to renderDsd with the already-rendered
 * light DOM children and host-level event markers.
 *
 * Host-level event props on a registered custom element are dropped by
 * serializeAttrs, so emit the data-eid marker explicitly and thread it onto
 * the serialized host tag. Without this, hydration still counts an eid for
 * the host and every following sibling binding shifts by one. Children are
 * already rendered above, preserving the SSR/hydration children-first eid
 * ordering.
 */
async function renderRegisteredCeBranch(
  tagName: string,
  props: Record<string, unknown> | undefined,
  childNodes: RenderNode[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
): Promise<RenderNode> {
  try {
    const hostEventAttrs = serializeEventMarkers(props, eventContext);
    const dsdResult = await renderDsd(tagName, {
      componentClass: customElements.get(tagName) as CustomElementConstructor,
      props,
      lightDom: childNodes,
      nestingDepth: nestingDepth + 1,
      hostEventAttrs,
    });
    return trustedHtmlNode(dsdResult.html);
  } catch (err) {
    // #922: notFound()/redirect() are expected control flow (the request-time
    // handler answers 404/3xx) — no error log for them.
    if (!isControlFlowThrow(err)) {
      createLogger('render').error(
        `renderDsd failed for registered CE <${tagName}>:` +
          ` ${formatError(err)}`,
      );
    }
    throw err;
  }
}

// ─── Public API ─────────────────────────────────────────────────

export async function renderDsdTree(
  node: unknown,
  eventContext: EventMarkerContext = createEventMarkerContext(),
  nestingDepth = 0,
): Promise<string> {
  return serializeRenderNode(await renderToNode(node, eventContext, nestingDepth));
}

// ─── Helpers ────────────────────────────────────────────────────

function callComponent(
  tag: VNode['tag'],
  props: Record<string, unknown>,
  children: (VNode | string | RenderFn)[],
): unknown {
  if (isComponentCtor(tag)) {
    const instance = new tag();
    injectPropsSafe(instance, props, `render<${String(tag)}>`);
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
    .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
    .join('; ');
}
