/**
 * Converts a VNode tree to real DOM nodes for client-side rendering and hydration.
 *
 * Design (ADR-0057 / ADR-0109 Phase 2):
 * - Props are translated into BindingDescriptor objects.
 * - Special tags emit binding descriptors instead of creating effects directly.
 * - Binding descriptors are committed via commitBindings() after the DOM tree is
 *   created so anchors are already in the document before reactive effects run.
 * - Signal names are resolved through an optional signalRegistry and emitted as
 *   data-signal markers for DSD hydration consistency.
 *
 * @module @openelement/core/jsx-render-dom
 */

import { isComponentCtor, isComponentFn, isVNode } from './vnode.js';
import type { RenderFn, VNode } from '@openelement/protocol/vnode';
import type { Signal } from '@openelement/protocol/signal';
import { FOR_TAG, Fragment, HTML_TAG, SHOW_TAG } from './jsx-runtime.js';
import { isSignalLike, unwrapSignalLike } from '@openelement/signal';
import { eventTypeFromProp } from './event-hydration.js';
import { trustRenderHtml } from './security.js';
import { createLogger } from './logger.js';
import { formatError } from './errors.js';
import { commitBindings } from './binding-activation.js';
import {
  bindAttr,
  bindClass,
  bindConditional,
  bindEvent,
  bindList,
  bindRef,
  bindStaticAttr,
  bindStaticBoolean,
  bindStaticProp,
  bindStaticStyle,
  bindText,
} from './binding-descriptor.js';
import type { BindingDescriptor, BindingLifecycle, BindingRenderer } from './binding-descriptor.js';
import { DATA_SIGNAL } from '@openelement/protocol/hydration-markers';

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
function signalNameFor(
  value: unknown,
  signalRegistry?: Map<string, Signal<unknown>>,
): string | undefined {
  if (!signalRegistry || !isSignalLike(value)) return undefined;
  for (const [name, sig] of signalRegistry.entries()) {
    if (sig === value) return name;
  }
  return undefined;
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

    if (value == null) continue;

    // innerHTML maps to signal-html / static text injection.
    if (key === 'innerHTML') {
      if (isSignalLike(value)) {
        descriptors.push({
          kind: 'signal-html',
          el,
          signal: value as Signal<unknown>,
          trusted: trustedHtml,
        });
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
      const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;

      if (name) {
        el.setAttribute(DATA_SIGNAL, name);
      }

      if (key === 'className' || key === 'class') {
        // ponytail: CSR signal-class only supports a single toggle class today;
        // the string-prop branch below is unreachable because this block is gated
        // by isSignalLike. Use explicit data-signal-class markers for arbitrary
        // class names; revisit when signal-class accepts a class-name accessor.
        const className = attrName === 'class' ? '' : attrName;
        descriptors.push(bindClass(el, className, sig));
      } else {
        descriptors.push(bindAttr(el, [attrName], sig));
      }
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

    const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;

    if (typeof resolved === 'boolean') {
      descriptors.push(bindStaticBoolean(el, attrName, resolved));
      continue;
    }

    descriptors.push(bindStaticAttr(el, key, attrName, resolved));
  }

  return descriptors;
}

/**
 * Apply a props object to a real DOM element.
 */
export function applyProps(
  el: Element,
  props: Record<string, unknown>,
  lifecycle?: BindingLifecycle,
  signalRegistry?: Map<string, Signal<unknown>>,
  renderer?: BindingRenderer,
): void {
  const descriptors = collectPropBindings(el, props, signalRegistry);
  commitBindings(el, descriptors, lifecycle ?? {}, renderer);
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
  commitBindings(root, descriptors, fullLifecycle, renderer);
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

  if (
    tag === Fragment || (typeof tag === 'symbol' && String(tag) === 'Symbol(openelement.fragment)')
  ) {
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

  if (tag === FOR_TAG || tag === 'fore') {
    const eachSig = props?.each;
    const renderFn = (children[0] as RenderFn) ??
      ((() => document.createTextNode('') as unknown) as RenderFn);

    const marker = document.createComment('for');
    descriptors.push(bindList(marker as ChildNode, eachSig, renderFn));
    return marker;
  }

  if (isComponentCtor(tag)) {
    try {
      const instance = new tag();
      for (const [k, v] of Object.entries(props)) {
        (instance as Record<string, unknown>)[k] = v;
      }
      const result = instance.render();
      return renderNode(result, lifecycle, signalRegistry, descriptors);
    } catch (err) {
      createLogger('dom-render').error(
        `renderToDom() failed for <${String(tag)}>: ${formatError(err)}`,
      );
      return document.createTextNode('');
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
      return document.createTextNode('');
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
