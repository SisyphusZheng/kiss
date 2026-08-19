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
import type { ComponentCtor, ComponentFn, RenderFn, VNode } from '../protocol/vnode.ts';
import type { Signal } from '../protocol/signal.ts';
import { HTML_TAG, isForTag, isFragment, isShowTag } from './jsx-runtime.ts';
import { isSignalLike, unwrapSignalLike } from '../signal/index.ts';
import { normalizePublicProps } from './props-utils.ts';
import { eventTypeFromProp } from './event-marker.ts';
import { injectPropsSafe, trustRenderHtml } from './security.ts';
import { createLogger } from './logger.ts';
import { formatError } from './errors.ts';
import { commitBindings } from './binding-activation.ts';
import { camelToKebab } from './tag-utils.ts';
import {
  bindAttr,
  bindClass,
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
import {
  DATA_SIGNAL,
  DATA_SIGNAL_ATTR,
  DATA_SIGNAL_CLASS,
  parseSignalAttrSpec,
} from '../protocol/hydration-markers.ts';

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

  // #903: shared normalization core — framework-internal and
  // prototype-dangerous keys never become bindings, identical to the SSR
  // path. (The injection path warns; the attribute path has no pollution
  // surface, so the skip here is silent.)
  props = normalizePublicProps(props);

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

    if (key === 'innerHTML') {
      descriptors.push(...innerHtmlDescriptors(el, value, trustedHtml));
      continue;
    }

    // Signal binding — emit data-signal marker when we can resolve a name.
    if (isSignalLike(value)) {
      descriptors.push(...signalDescriptors(el, key, value as Signal<unknown>, signalRegistry));
      continue;
    }

    const resolved = unwrapSignalLike(value);

    if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
      descriptors.push(bindStaticStyle(el, resolveStyleObject(resolved)));
      continue;
    }

    descriptors.push(staticDescriptor(el, key, resolved));
  }

  // #939: manual data-signal markers (class pattern) must activate in the CSR
  // path exactly like the DSD hydration path (collectHydrationBindings): a
  // data-signal name declared in the props and registered in the registry is a
  // marker — class toggle, attr binding, or text binding — not a static
  // attribute. Signal-prop bindings (signalDescriptors) set the marker
  // attribute programmatically, so the props-declared check below never
  // double-binds them.
  const markerName = props[DATA_SIGNAL];
  if (typeof markerName === 'string' && signalRegistry) {
    const markerSig = signalRegistry.get(markerName);
    if (markerSig) {
      const className = props[DATA_SIGNAL_CLASS];
      const attrSpec = props[DATA_SIGNAL_ATTR];
      const hasClass = typeof className === 'string';
      const hasAttr = typeof attrSpec === 'string';
      if (hasClass && hasAttr) {
        descriptors.push(bindClass(el, className, markerSig));
        const attrNames = parseSignalAttrSpec(attrSpec);
        if (attrNames.length > 0) descriptors.push(bindAttr(el, attrNames, markerSig));
      } else if (hasClass) {
        descriptors.push(bindClass(el, className as string, markerSig));
      } else if (hasAttr) {
        const attrNames = parseSignalAttrSpec(attrSpec);
        if (attrNames.length > 0) descriptors.push(bindAttr(el, attrNames, markerSig));
      } else {
        descriptors.push(bindText(el, markerSig));
      }
    }
  }

  return descriptors;
}

/**
 * innerHTML prop: signal-html binding, or direct trusted/text injection when
 * the value is static.
 */
function innerHtmlDescriptors(
  el: Element,
  value: unknown,
  trustedHtml: boolean,
): BindingDescriptor[] {
  if (isSignalLike(value)) {
    return [bindHtml(el, value as Signal<unknown>, trustedHtml)];
  }
  const resolved = String(unwrapSignalLike(value));
  if (trustedHtml) {
    (el as HTMLElement).innerHTML = trustRenderHtml(resolved);
  } else {
    (el as HTMLElement).textContent = resolved;
  }
  return [];
}

/** Signal prop: emit the data-signal marker when nameable, bind signal-attr. */
function signalDescriptors(
  el: Element,
  key: string,
  sig: Signal<unknown>,
  signalRegistry: Map<string, Signal<unknown>> | undefined,
): BindingDescriptor[] {
  const name = signalNameFor(sig, signalRegistry);

  if (name) {
    el.setAttribute(DATA_SIGNAL, name);
  }

  // Use signal-attr for all signal-driven props; signal-class toggling
  // (single class) is reserved for explicit data-signal-class markers.
  return [bindAttr(el, [attrNameFor(el, key)], sig)];
}

/** style object prop: unwrap nested signals into a static style map. */
function resolveStyleObject(resolved: unknown): Record<string, string | number> {
  const styleObj: Record<string, string | number> = {};
  for (const [sk, sv] of Object.entries(resolved as Record<string, unknown>)) {
    styleObj[sk] = unwrapSignalLike(sv) as string | number;
  }
  return styleObj;
}

/** Static value: textContent DOM property, boolean attribute, or plain attribute. */
function staticDescriptor(el: Element, key: string, resolved: unknown): BindingDescriptor {
  // DOM properties that are NOT HTML attributes
  if (key === 'textContent') {
    return bindStaticProp(el, 'textContent', resolved);
  }

  if (typeof resolved === 'boolean') {
    return bindStaticBoolean(el, attrNameFor(el, key), resolved);
  }

  return bindStaticAttr(el, attrNameFor(el, key), resolved);
}

/**
 * Render a VNode tree to a real DOM node.
 *
 * @param node - VNode, string, number, or null/undefined
 * @param lifecycle - Optional BindingLifecycle for automatic cleanup
 * @param signalRegistry - Optional registry used to resolve signal names for markers
 * @returns DOM Node (Element, Text, or DocumentFragment)
 */
export function renderToDom(
  node: unknown,
  lifecycle?: BindingLifecycle,
  signalRegistry?: Map<string, Signal<unknown>>,
): Node {
  const fullLifecycle: BindingLifecycle = lifecycle ?? {};

  const renderer: BindingRenderer = {
    render: (child, childLifecycle) => renderToDom(child, childLifecycle, signalRegistry),
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
  // Booleans render nothing, matching the SSR path (render-ir.ts), so a
  // hand-built children array cannot emit the text "true"/"false" (#845).
  if (node == null || typeof node === 'boolean') {
    return document.createTextNode('');
  }
  if (typeof node === 'string') {
    return document.createTextNode(node);
  }
  if (typeof node === 'number') {
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
    return renderFragmentNode(children, lifecycle, signalRegistry, descriptors);
  }

  if (tag === HTML_TAG) {
    return renderTrustedHtmlNode(props);
  }

  if (isShowTag(tag)) {
    return renderShowNode(props, children, descriptors);
  }

  if (isForTag(tag)) {
    return renderForNode(props, children, descriptors);
  }

  if (isComponentCtor(tag)) {
    return renderComponentNode(tag, props, lifecycle, signalRegistry, descriptors);
  }

  if (isComponentFn(tag)) {
    return renderFunctionNode(tag, props, children, lifecycle, signalRegistry, descriptors);
  }

  return renderHostElement(node, props, children, lifecycle, signalRegistry, descriptors);
}

/** Fragment: render every child into one DocumentFragment. */
function renderFragmentNode(
  children: unknown[],
  lifecycle: BindingLifecycle,
  signalRegistry: Map<string, Signal<unknown>> | undefined,
  descriptors: BindingDescriptor[],
): Node {
  const frag = document.createDocumentFragment();
  for (const child of children) {
    frag.appendChild(renderNode(child, lifecycle, signalRegistry, descriptors));
  }
  return frag;
}

/** Trusted HTML — parse raw HTML string into real DOM nodes. */
function renderTrustedHtmlNode(
  props: Record<string, unknown> | undefined,
): Node {
  const container = document.createElement('div');
  const html = props?.html ?? '';
  container.innerHTML = trustRenderHtml(String(html));
  const frag = document.createDocumentFragment();
  while (container.firstChild) {
    frag.appendChild(container.firstChild);
  }
  return frag;
}

/** `<Show>`: anchor comment with a conditional binding on the branch values. */
function renderShowNode(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  descriptors: BindingDescriptor[],
): Node {
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

/** `<For>`: anchor comment with a list binding on the items signal. */
function renderForNode(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  descriptors: BindingDescriptor[],
): Node {
  const eachSig = props?.each;
  const renderFn = (children[0] as RenderFn) ?? EMPTY_RENDER;
  const keyFn = typeof props?.key === 'function'
    ? (props.key as (item: unknown, index: number) => string | number)
    : undefined;

  const marker = document.createComment('for');
  descriptors.push(
    bindList(marker as ChildNode, eachSig, renderFn, keyFn),
  );
  return marker;
}

/** Component class: instantiate with props, render its subtree. */
function renderComponentNode(
  tag: ComponentCtor,
  props: Record<string, unknown> | undefined,
  lifecycle: BindingLifecycle,
  signalRegistry: Map<string, Signal<unknown>> | undefined,
  descriptors: BindingDescriptor[],
): Node {
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

/** Function component: invoke with props + children, render the result. */
function renderFunctionNode(
  tag: ComponentFn,
  props: Record<string, unknown> | undefined,
  children: unknown[],
  lifecycle: BindingLifecycle,
  signalRegistry: Map<string, Signal<unknown>> | undefined,
  descriptors: BindingDescriptor[],
): Node {
  try {
    const result = (tag as (props: Record<string, unknown>) => unknown)({ ...props, children });
    return renderNode(result, lifecycle, signalRegistry, descriptors);
  } catch (err) {
    createLogger('dom-render').error(
      `renderToDom() failed for <${String(tag)}>: ${formatError(err)}`,
    );
    throw err;
  }
}

/** Host element: create, collect prop bindings, consume vnode.ref, render children. */
function renderHostElement(
  node: VNode,
  props: Record<string, unknown>,
  children: unknown[],
  lifecycle: BindingLifecycle,
  signalRegistry: Map<string, Signal<unknown>> | undefined,
  descriptors: BindingDescriptor[],
): Node {
  const el = createElementForTag(String(node.tag));
  const propDescriptors = collectPropBindings(el, props, signalRegistry);
  descriptors.push(...propDescriptors);
  // vnode.ref is stripped from props by createVNode (jsx-runtime.ts), so the
  // props.ref branch in collectPropBindings never sees JSX refs — consume it
  // here. The ref binding fires at commitBindings() time, after the whole
  // tree (children included) has been created (#756).
  if (typeof (node as VNode).ref === 'function') {
    descriptors.push(bindRef(el, (node as VNode).ref as (el: Element) => void));
  }
  // innerHTML overrides children, matching SSR (render-ir.ts
  // renderElementChildren): appending both would diverge the CSR tree from
  // the SSR'd one.
  if (props.innerHTML === undefined) {
    for (const child of children) {
      el.appendChild(renderNode(child, lifecycle, signalRegistry, descriptors));
    }
  }

  return el;
}
const EMPTY_RENDER: RenderFn = () => null;
