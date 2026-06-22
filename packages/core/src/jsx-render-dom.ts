/**
 * Converts a VNode tree to real DOM nodes for client-side rendering and hydration.
 *
 * Design (ADR-0057 / ADR-0109 Phase 2):
 * - Props are translated into BindingDescriptor objects
 * - Binding descriptors are applied via applyBindingDescriptor()
 * - Signal names are resolved through an optional signalRegistry and emitted as
 *   data-signal markers for DSD hydration consistency.
 *
 * @module @openelement/core/jsx-render-dom
 */

import { isComponentCtor, isComponentFn, isVNode } from './vnode.ts';
import type { RenderFn, VNode } from '@openelement/protocol/vnode';
import type { Signal } from '@openelement/protocol/signal';
import { FOR_TAG, Fragment, HTML_TAG, SHOW_TAG } from './jsx-runtime.ts';
import { isSignalLike, unwrapSignalLike } from '@openelement/signal';
import { eventTypeFromProp } from './event-hydration.ts';
import { trustRenderHtml } from './security.ts';
import { effect } from '@openelement/signal';
import { createLogger } from './logger.js';
import { formatError } from './errors.js';
import { applyBindingDescriptor } from './binding-activation.ts';
import type { BindingDescriptor, BindingLifecycle } from './binding-descriptor.ts';
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
      descriptors.push({ kind: 'ref', el, callback: value as (el: Element) => void });
      continue;
    }

    // Event handlers
    if (key.startsWith('on') && typeof value === 'function') {
      const eventType = eventTypeFromProp(key);
      if (!eventType) continue;
      descriptors.push({ kind: 'event', el, type: eventType, handler: value as EventListener });
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
        descriptors.push({
          kind: 'signal-class',
          el,
          className,
          signal: sig,
        });
      } else {
        descriptors.push({ kind: 'signal-attr', el, attrNames: [attrName], signal: sig });
      }
      continue;
    }

    const resolved = unwrapSignalLike(value);

    if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
      const styleObj: Record<string, string | number> = {};
      for (const [sk, sv] of Object.entries(resolved as Record<string, unknown>)) {
        styleObj[sk] = unwrapSignalLike(sv) as string | number;
      }
      descriptors.push({ kind: 'static-style', el, value: styleObj });
      continue;
    }

    // DOM properties that are NOT HTML attributes
    if (key === 'textContent') {
      descriptors.push({ kind: 'static-attr', el, key, attrName: 'textContent', value: resolved });
      continue;
    }

    const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;

    if (typeof resolved === 'boolean') {
      descriptors.push({ kind: 'static-boolean', el, attrName, value: resolved });
      continue;
    }

    descriptors.push({ kind: 'static-attr', el, key, attrName, value: resolved });
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
): void {
  const descriptors = collectPropBindings(el, props, signalRegistry);
  for (const desc of descriptors) {
    applyBindingDescriptor(desc, lifecycle ?? {});
  }
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
    applyBindingDescriptor({ kind: 'signal-text', el: textNode, signal: sig }, fullLifecycle);
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
      frag.appendChild(renderToDom(child, fullLifecycle, undefined, signalRegistry));
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

    let anchor: ChildNode | null = null;
    const swap = () => {
      const show = Boolean(
        isSignalLike(whenSig) ? (whenSig as { value: unknown }).value : whenSig,
      );
      const target = show ? truthy : falsy;
      if (anchor) anchor.remove();
      if (target != null) {
        anchor = renderToDom(target, fullLifecycle, undefined, signalRegistry) as ChildNode;
        marker.parentNode?.insertBefore(anchor, marker.nextSibling);
      } else {
        anchor = null;
      }
    };
    const dispose = effect(() => swap());
    if (fullLifecycle.signal) {
      fullLifecycle.signal.addEventListener('abort', dispose, { once: true });
    }
    fullLifecycle.disposers?.add(dispose);
    swap();
    return marker;
  }

  if (tag === FOR_TAG || tag === 'fore') {
    const eachSig = props?.each;
    const renderFn = (children[0] as RenderFn) ??
      ((() => document.createTextNode('') as unknown) as RenderFn);

    const marker = document.createComment('for');
    let anchors: ChildNode[] = [];

    const reconcile = () => {
      const items =
        (isSignalLike(eachSig) ? (eachSig as { value: unknown }).value : eachSig) as unknown[];
      if (!Array.isArray(items)) return;

      // Remove old
      for (const a of anchors) a.remove();
      anchors = [];

      // Render new
      for (let i = 0; i < items.length; i++) {
        const vn = renderFn(items[i], i);
        const dom = renderToDom(vn, fullLifecycle, undefined, signalRegistry) as ChildNode;
        marker.parentNode?.insertBefore(dom, marker.nextSibling);
        anchors.push(dom);
      }
    };
    const dispose = effect(() => reconcile());
    if (fullLifecycle.signal) {
      fullLifecycle.signal.addEventListener('abort', dispose, { once: true });
    }
    fullLifecycle.disposers?.add(dispose);
    reconcile();
    return marker;
  }

  if (isComponentCtor(tag)) {
    try {
      const instance = new tag();
      for (const [k, v] of Object.entries(props)) {
        (instance as Record<string, unknown>)[k] = v;
      }
      const result = instance.render();
      return renderToDom(result, fullLifecycle, undefined, signalRegistry);
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
      return renderToDom(result, fullLifecycle, undefined, signalRegistry);
    } catch (err) {
      createLogger('dom-render').error(
        `renderToDom() failed for <${String(tag)}>: ${formatError(err)}`,
      );
      return document.createTextNode('');
    }
  }

  const el = createElementForTag(tag as string);
  applyProps(el, props, fullLifecycle, signalRegistry);
  for (const child of children) {
    el.appendChild(renderToDom(child, fullLifecycle, undefined, signalRegistry));
  }

  return el;
}
