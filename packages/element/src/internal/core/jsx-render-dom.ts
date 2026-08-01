/**
 * Converts a VNode tree to real DOM nodes for client-side rendering and hydration.
 *
 * Design (ADR-0057 / ADR-0109 Phase 2):
 * - Props are translated into BindingDescriptor objects.
 * - Special tags emit binding descriptors instead of creating effects directly.
 * - Binding descriptors are committed via commitBindings() after the DOM tree is
 *   created so anchors are already in the document before reactive effects run.
 *   A root-level control-flow anchor (<Show>/<For>) is first parked in a
 *   DocumentFragment: the caller attaches the returned root only after
 *   renderToDom() returns, and anchor-less commits would drop branch content.
 * - Signal names are resolved through an optional signalRegistry and emitted as
 *   data-signal markers for DSD hydration consistency.
 *
 * @module ./jsx-render-dom.ts
 */

import { isComponentCtor, isComponentFn, isVNode } from './vnode.ts';
import type { RenderFn, VNode } from '../protocol/vnode.ts';
import type { Signal } from '../protocol/signal.ts';
import { FOR_TAG, HTML_TAG, isFragment, SHOW_TAG } from './jsx-runtime.ts';
import { isSignalLike, unwrapSignalLike } from '../signal/index.ts';
import { eventTypeFromProp } from './event-marker.ts';
import { injectPropsSafe, trustRenderHtml } from './security.ts';
import { createLogger } from './logger.ts';
import { formatError } from './errors.ts';
import { commitBindings } from './binding-activation.ts';
import { camelToKebab } from './tag-utils.ts';
import {
  bindAttr,
  bindConditional,
  bindEvent,
  bindHtml,
  bindList,
  bindRef,
  bindStaticAttr,
  bindStaticBoolean,
  bindStaticProp,
  bindStaticStyle,
  bindText,
} from './binding-descriptor.ts';
import type { BindingDescriptor, BindingLifecycle, BindingRenderer } from './binding-descriptor.ts';
import { DATA_SIGNAL } from '../protocol/hydration-markers.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Elements that MUST be created with createElementNS(SVG_NS, tag) to render
 * correctly. Using createElement() puts them in the HTML namespace where
 * browsers won't render them as SVG shapes.
 */
const SVG_TAGS = new Set([
  'svg',
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'g',
  'defs',
  'clipPath',
  'mask',
  'pattern',
  'use',
  'symbol',
  'image',
  'text',
  'tspan',
  'textPath',
  'linearGradient',
  'radialGradient',
  'stop',
  'animate',
  'animateTransform',
  'animateMotion',
  'foreignObject',
  'title',
  'desc',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
]);

function createElementForTag(tag: string): Element {
  if (SVG_TAGS.has(tag)) {
    return document.createElementNS(SVG_NS, tag);
  }
  return document.createElement(tag);
}

/** Resolve a signal object to its registered name, if any. */
// ponytail: index is a lazy reverse map per registry — signal registries are
// filled in component constructors and never mutated after, so the cache is
// stable for the element's lifetime. Reverse per-registry map if signals can
// be registered post-construction.
const signalNameIndex = new WeakMap<Map<string, Signal<unknown>>, Map<Signal<unknown>, string>>();

function signalNameFor(
  value: unknown,
  signalRegistry?: Map<string, Signal<unknown>>,
): string | undefined {
  if (!signalRegistry || !isSignalLike(value)) return undefined;
  let index = signalNameIndex.get(signalRegistry);
  if (!index) {
    index = new Map();
    for (const [name, sig] of signalRegistry.entries()) {
      if (!index.has(sig)) index.set(sig, name);
    }
    signalNameIndex.set(signalRegistry, index);
  }
  return index.get(value as Signal<unknown>);
}

/**
 * Attribute name for a JSX prop, mirroring SSR serializeAttrs: className and
 * htmlFor map to class/for; every other prop on a custom-element host is
 * kebab-cased so CSR output matches the SSR/hydration attribute naming
 * (camelToKebab is the single casing rule).
 */
function attrNameFor(el: Element, key: string): string {
  const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;
  if (attrName === key && el.localName.includes('-')) {
    return camelToKebab(attrName);
  }
  return attrName;
}

/**
 * Collect BindingDescriptor objects from a JSX props object.
 *
 * @param el - Target element the descriptors will apply to.
 * @param props - VNode props.
 * @param signalRegistry - Optional registry used to name signals for hydration markers.
 * @returns Array of binding descriptors.
 */
export function collectPropBindings(
  el: Element,
  props: Record<string, unknown>,
  signalRegistry?: Map<string, Signal<unknown>>,
): BindingDescriptor[] {
  const descriptors: BindingDescriptor[] = [];
  const trustedHtml = props.trustedHtml === true;

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'key' || key === 'trustedHtml') continue;

    // ref callback
    if (key === 'ref' && typeof value === 'function') {
      descriptors.push(bindRef(el, value as (el: Element) => void));
      continue;
    }

    // Event handlers
    if (key.startsWith('on') && typeof value === 'function') {
      const eventType = eventTypeFromProp(key);
      if (!eventType) continue;
      descriptors.push(bindEvent(el, eventType, value as EventListener));
      continue;
    }

    // Non-event function props are skipped, matching SSR serializeAttrs:
    // a stringified function in an attribute is never meaningful.
    if (typeof value === 'function') continue;

    if (value == null) continue;

    // innerHTML maps to signal-html / static text injection.
    if (key === 'innerHTML') {
      if (isSignalLike(value)) {
        descriptors.push(bindHtml(el, value as Signal<unknown>, trustedHtml));
      } else {
        const resolved = String(unwrapSignalLike(value));
        if (trustedHtml) {
          (el as HTMLElement).innerHTML = trustRenderHtml(resolved);
        } else {
          (el as HTMLElement).textContent = resolved;
        }
      }
      continue;
    }

    // Signal binding — emit data-signal marker when we can resolve a name.
    if (isSignalLike(value)) {
      const sig = value as Signal<unknown>;
      const name = signalNameFor(sig, signalRegistry);

      if (name) {
        el.setAttribute(DATA_SIGNAL, name);
      }

      // Use signal-attr for all signal-driven props; signal-class toggling
      // (single class) is reserved for explicit data-signal-class markers.
      descriptors.push(bindAttr(el, [attrNameFor(el, key)], sig));
      continue;
    }

    const resolved = unwrapSignalLike(value);

    if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
      const styleObj: Record<string, string | number> = {};
      for (const [sk, sv] of Object.entries(resolved as Record<string, unknown>)) {
        styleObj[sk] = unwrapSignalLike(sv) as string | number;
      }
      descriptors.push(bindStaticStyle(el, styleObj));
      continue;
    }

    // DOM properties that are NOT HTML attributes
    if (key === 'textContent') {
      descriptors.push(bindStaticProp(el, 'textContent', resolved));
      continue;
    }

    if (typeof resolved === 'boolean') {
      descriptors.push(bindStaticBoolean(el, attrNameFor(el, key), resolved));
      continue;
    }

    descriptors.push(bindStaticAttr(el, attrNameFor(el, key), resolved));
  }

  return descriptors;
}

/**
 * Render a VNode tree to a real DOM node.
 *
 * @param node - VNode, string, number, or null/undefined
 * @param lifecycle - Optional BindingLifecycle for automatic cleanup
 * @param disposers - Optional Set to collect effect dispose fns (backward compat)
 * @param signalRegistry - Optional registry used to resolve signal names for markers
 * @returns DOM Node (Element, Text, or DocumentFragment)
 */
export function renderToDom(
  node: unknown,
  lifecycle?: BindingLifecycle,
  disposers?: Set<() => void>,
  signalRegistry?: Map<string, Signal<unknown>>,
): Node {
  const fullLifecycle: BindingLifecycle = lifecycle ?? (disposers ? { disposers } : {});
  if (disposers && !lifecycle?.disposers) {
    fullLifecycle.disposers = disposers;
  }

  const renderer: BindingRenderer = {
    render: (child, childLifecycle) =>
      renderToDom(child, childLifecycle, undefined, signalRegistry),
  };

  const descriptors: BindingDescriptor[] = [];
  const root = renderNode(node, fullLifecycle, signalRegistry, descriptors);
  if (root.nodeType === 8) {
    // Root-level <Show>/<For>: the returned root IS the control-flow anchor
    // comment, and conditional/list activation inserts branch content through
    // anchor.parentNode.insertBefore(). The caller attaches the returned node
    // only after renderToDom() returns, so park the anchor in a
    // DocumentFragment before committing — otherwise the commit-time insert
    // has no parent and the branch content is silently dropped. Appending the
    // fragment later hoists anchor + branch content into the real parent, and
    // subsequent updates insert through that parent.
    const mount = document.createDocumentFragment();
    mount.appendChild(root);
    commitBindings(descriptors, fullLifecycle, renderer);
    return mount;
  }
  commitBindings(descriptors, fullLifecycle, renderer);
  return root;
}

function renderNode(
  node: unknown,
  lifecycle: BindingLifecycle,
  signalRegistry: Map<string, Signal<unknown>> | undefined,
  descriptors: BindingDescriptor[],
): Node {
  if (node == null || node === false) {
    return document.createTextNode('');
  }
  if (typeof node === 'string') {
    return document.createTextNode(node);
  }
  if (typeof node === 'number' || typeof node === 'boolean') {
    return document.createTextNode(String(node));
  }

  // Signal-to-TextNode reactive binding (ADR-0058/0059).
  if (isSignalLike(node)) {
    const sig = node as Signal<unknown>;
    const textNode = document.createTextNode(String(sig.value ?? ''));
    descriptors.push(bindText(textNode, sig));
    return textNode;
  }

  if (!isVNode(node)) {
    return document.createTextNode(String(node));
  }

  const { tag, props, children } = node as VNode;

  if (isFragment(tag)) {
    const frag = document.createDocumentFragment();
    for (const child of children) {
      frag.appendChild(renderNode(child, lifecycle, signalRegistry, descriptors));
    }
    return frag;
  }

  // Trusted HTML — parse raw HTML string into real DOM nodes
  if (tag === HTML_TAG) {
    const container = document.createElement('div');
    const html = props?.html ?? '';
    container.innerHTML = trustRenderHtml(String(html));
    const frag = document.createDocumentFragment();
    while (container.firstChild) {
      frag.appendChild(container.firstChild);
    }
    return frag;
  }

  if (tag === SHOW_TAG || tag === 'show') {
    const whenSig = props?.when;
    const ch = children as VNode[];
    const truthy: unknown = ch[0];
    const falsy: unknown = ch[1];
    const marker = document.createComment('show');
    descriptors.push(bindConditional(
      marker as ChildNode,
      whenSig,
      () => truthy,
      () => falsy,
    ));
    return marker;
  }

  if (tag === FOR_TAG || tag === 'for') {
    const eachSig = props?.each;
    const renderFn = (children[0] as RenderFn) ?? EMPTY_RENDER;

    const marker = document.createComment('for');
    descriptors.push(
      bindList(marker as ChildNode, eachSig, renderFn),
    );
    return marker;
  }

  if (isComponentCtor(tag)) {
    try {
      const instance = new tag();
      injectPropsSafe(instance, props ?? {}, `renderToDom<${String(tag)}>`);
      const result = instance.render();
      return renderNode(result, lifecycle, signalRegistry, descriptors);
    } catch (err) {
      // Re-throw so the unified render path (open-element-implementation.ts
      // _renderOrHydrate) can route to onRenderError, mirroring the SSR
      // render-ir.ts contract — swallowing here would hide the failure as an
      // empty text node with no fallback.
      createLogger('dom-render').error(
        `renderToDom() failed for <${String(tag)}>: ${formatError(err)}`,
      );
      throw err;
    }
  }
  if (isComponentFn(tag)) {
    try {
      const result = tag({ ...props, children });
      return renderNode(result, lifecycle, signalRegistry, descriptors);
    } catch (err) {
      createLogger('dom-render').error(
        `renderToDom() failed for <${String(tag)}>: ${formatError(err)}`,
      );
      throw err;
    }
  }

  const el = createElementForTag(tag as string);
  const propDescriptors = collectPropBindings(el, props, signalRegistry);
  descriptors.push(...propDescriptors);
  for (const child of children) {
    el.appendChild(renderNode(child, lifecycle, signalRegistry, descriptors));
  }

  return el;
}
const EMPTY_RENDER: RenderFn = () => null;
