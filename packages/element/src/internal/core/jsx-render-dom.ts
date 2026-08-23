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
import { isSignalLike } from '../signal/index.ts';
import { injectPropsSafe, trustRenderHtml } from './security.ts';
import { createLogger } from './logger.ts';
import { formatError } from './errors.ts';
import { commitBindings } from './binding-activation.ts';
import { bindConditional, bindList, bindRef, bindText } from './binding-descriptor.ts';
import type { BindingDescriptor, BindingLifecycle, BindingRenderer } from './binding-descriptor.ts';
import { collectPropBindings, createElementForTag, signalNameFor } from './jsx-dom-props.ts';
import { DATA_SIGNAL } from '../protocol/hydration-markers.ts';
export { collectPropBindings } from './jsx-dom-props.ts';

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
  if (children.length === 1 && isSignalLike(children[0]) && !el.hasAttribute(DATA_SIGNAL)) {
    const signalName = signalNameFor(children[0], signalRegistry);
    if (signalName) el.setAttribute(DATA_SIGNAL, signalName);
  }
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
