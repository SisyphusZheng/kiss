import { unwrapSignalLike } from '../signal/index.ts';
import { escapeAttr, escapeHtml } from './html-escape.ts';
import { isSafeAttributeName, trustRenderHtml } from './security.ts';
import { attrNameFor, SSR_SKIP_ATTR_KEYS, styleObjectToString } from './vnode-prop-rules.ts';

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
const RAW_TEXT_ELEMENTS = new Set(['style', 'script']);

export function textNode(value: unknown): RenderNode {
  return { kind: 'text', value: String(value) };
}

export function branchCommentNode(value: string): RenderNode {
  return { kind: 'comment', value };
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

export function serializeAttrs(tag: string, props: Record<string, unknown>): string {
  const isCustomElement = tag.includes('-');
  let result = '';
  for (const [key, value] of Object.entries(props)) {
    if (SSR_SKIP_ATTR_KEYS.has(key) || (key.startsWith('on') && typeof value === 'function')) {
      continue;
    }
    if (typeof value === 'function' || value == null) continue;
    const attrName = attrNameFor(isCustomElement ? tag : '', key);
    if (!isSafeAttributeName(attrName)) continue;
    const resolved = unwrapSignalLike(value);
    if (typeof resolved === 'boolean') {
      if (resolved) result += ` ${attrName}`;
      continue;
    }
    if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
      const css = styleObjectToString(resolved);
      if (css) result += ` style="${escapeAttr(css)}"`;
      continue;
    }
    if (typeof resolved === 'object') {
      try {
        result += ` ${attrName}="${escapeAttr(JSON.stringify(resolved))}"`;
      } catch {
        continue;
      }
    } else result += ` ${attrName}="${escapeAttr(String(resolved))}"`;
  }
  return result;
}

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
      if (node.voidElement || VOID_ELEMENTS.has(node.tag)) return `<${node.tag}${attrs}${events}>`;
      const children = RAW_TEXT_ELEMENTS.has(node.tag.toLowerCase())
        ? node.children.map((child) =>
          child.kind === 'text' ? child.value : serializeRenderNode(child)
        ).join('')
        : node.children.map(serializeRenderNode).join('');
      return `<${node.tag}${attrs}${events}>${children}</${node.tag}>`;
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
