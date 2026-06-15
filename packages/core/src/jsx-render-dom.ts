/**
 * Converts a VNode tree to real DOM nodes for client-side rendering and hydration.
 *
 * Design (ADR-0057):
 * - Event handlers (onClick) are wired via native addEventListener
 * - ref callbacks are invoked with the created element
 *
 * @module @openelement/core/jsx-render-dom
 */

import { isComponentCtor, isComponentFn, isVNode, type RenderFn, type VNode } from './vnode.ts';
import { FOR_TAG, Fragment, HTML_TAG, SHOW_TAG } from './jsx-runtime.ts';
import { isSignalLike, unwrapSignalLike } from './signal-like.ts';
import { eventTypeFromProp } from './event-hydration.ts';
import { trustRenderHtml } from './security.ts';
import { effect } from '@openelement/signal';
import { createLogger } from './logger.js';
import { formatError } from './errors.js';

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

/**
 * Apply a single resolved (non-signal) prop value to a DOM element.
 * effect callbacks without unwrapping signals again.
 */
function applyStaticProp(el: Element, key: string, resolved: unknown): void {
  if (resolved == null) return;
  if (key === 'trustedHtml') return;

  if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
    const styleObj: Record<string, string> = {};
    for (const [sk, sv] of Object.entries(resolved as Record<string, unknown>)) {
      styleObj[sk] = String(unwrapSignalLike(sv));
    }
    Object.assign((el as HTMLElement).style, styleObj);
    return;
  }

  // DOM properties that are NOT HTML attributes
  if (key === 'textContent') {
    (el as HTMLElement).textContent = String(resolved);
    return;
  }

  // Resolve attribute name
  const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;

  // Boolean attributes
  if (typeof resolved === 'boolean') {
    if (resolved) {
      el.setAttribute(attrName, '');
    } else {
      el.removeAttribute(attrName);
    }
    return;
  }

  // General
  el.setAttribute(attrName, String(resolved));
}

/**
 * Apply a props object to a real DOM element.
 */
export function applyProps(
  el: Element,
  props: Record<string, unknown>,
  signal?: AbortSignal,
  /** Collect effect dispose fns for batch cleanup. */
  disposers?: Set<() => void>,
): void {
  const trustedHtml = props.trustedHtml === true;
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'key' || key === 'trustedHtml') continue;

    // ref callback
    if (key === 'ref' && typeof value === 'function') {
      (value as (el: Element) => void)(el);
      continue;
    }

    // Event handlers
    if (key.startsWith('on') && typeof value === 'function') {
      const eventType = eventTypeFromProp(key);
      if (!eventType) continue;
      const opts: AddEventListenerOptions = signal ? { signal } : {};
      el.addEventListener(eventType, value as EventListener, opts);
      continue;
    }

    if (value == null) continue;

    // innerHTML is text by default; explicit trustedHtml opts into trusted HTML.
    if (key === 'innerHTML') {
      const resolved = String(unwrapSignalLike(value));
      if (trustedHtml) {
        (el as HTMLElement).innerHTML = trustRenderHtml(resolved);
      } else {
        (el as HTMLElement).textContent = resolved;
      }
      continue;
    }

    // Signal-to-DOM direct binding (ADR-0058).
    // Instead of unwrapping the signal to a static value and calling
    // it done, create an effect that binds the signal directly to the
    // DOM attribute. When the signal changes, only that attribute/prop
    if (isSignalLike(value)) {
      const dispose = effect(() => {
        const resolved = unwrapSignalLike(value.value);
        applyStaticProp(el, key, resolved);
      });
      // Dispose when the AbortSignal fires (component disconnect)
      if (signal) {
        signal.addEventListener('abort', dispose, { once: true });
      }
      // Track for batch cleanup in DsdElement lifecycle
      disposers?.add(dispose);
      continue;
    }

    // v0.24.3: Unwrap Signal-like values before handling any attribute
    const resolved = unwrapSignalLike(value);

    applyStaticProp(el, key, resolved);
  }
}

/**
 * Render a VNode tree to a real DOM node.
 *
 * @param node - VNode, string, number, or null/undefined
 * @param signal - Optional AbortSignal for automatic event listener cleanup
 * @param disposers - Optional Set to collect effect dispose fns for batch cleanup
 * @returns DOM Node (Element, Text, or DocumentFragment)
 */
export function renderToDom(
  node: unknown,
  signal?: AbortSignal,
  disposers?: Set<() => void>,
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
  // Creates a TextNode that auto-updates when the signal changes,
  // without requiring full re-render or VDOM diff.
  if (isSignalLike(node)) {
    const sig = node as { value: unknown };
    const textNode = document.createTextNode(String(sig.value ?? ''));
    const dispose = effect(() => {
      textNode.textContent = String(sig.value ?? '');
    });
    if (signal) signal.addEventListener('abort', dispose, { once: true });
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
      frag.appendChild(renderToDom(child, signal, disposers));
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
        anchor = renderToDom(target, signal, disposers) as ChildNode;
        marker.parentNode?.insertBefore(anchor, marker.nextSibling);
      } else {
        anchor = null;
      }
    };
    const dispose = effect(() => swap());
    if (signal) signal.addEventListener('abort', dispose, { once: true });
    // Initial render: run swap so anchor is created before marker is returned
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
        const dom = renderToDom(vn, signal, disposers) as ChildNode;
        marker.parentNode?.insertBefore(dom, marker.nextSibling);
        anchors.push(dom);
      }
    };
    const dispose = effect(() => reconcile());
    if (signal) signal.addEventListener('abort', dispose, { once: true });
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
      return renderToDom(result, signal, disposers);
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
      return renderToDom(result, signal, disposers);
    } catch (err) {
      createLogger('dom-render').error(
        `renderToDom() failed for <${String(tag)}>: ${formatError(err)}`,
      );
      return document.createTextNode('');
    }
  }

  const el = createElementForTag(tag as string);
  applyProps(el, props, signal, disposers);
  for (const child of children) {
    el.appendChild(renderToDom(child, signal, disposers));
  }

  return el;
}
