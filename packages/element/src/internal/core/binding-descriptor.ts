/**
 * binding-descriptor.ts - Unified binding descriptor types (ADR-0109 Phase 1).
 *
 * Declarative DOM binding contracts used by the runtime and hydration layers.
 * Each descriptor captures one side effect to apply to a host element.
 *
 * @module ./binding-descriptor.ts
 */

import type { Signal } from '../protocol/signal.ts';

/** Shared lifecycle context for a set of bindings. */
export interface BindingLifecycle {
  /** AbortSignal that triggers automatic disposal when aborted. */
  signal?: AbortSignal;
  /** Explicit disposers collected for batch cleanup. */
  disposers?: Set<() => void>;
}

/** Renderer contract injected to avoid a core intra-package cycle. */
export interface BindingRenderer {
  /** Render a VNode tree (or primitive) to a DOM node under the given lifecycle. */
  render(node: unknown, lifecycle: BindingLifecycle): Node;
}

/** Dispose function returned by bindings and registered into lifecycle. */
export type BindingDispose = () => void;

// ─── Static descriptors ─────────────────────────────────────────────────────

interface StaticAttrBindingDescriptor {
  kind: 'static-attr';
  el: Element;
  attrName: string;
  value: unknown;
}

interface StaticPropBindingDescriptor {
  kind: 'static-prop';
  el: Element;
  propName: string;
  value: unknown;
}

interface StaticBooleanBindingDescriptor {
  kind: 'static-boolean';
  el: Element;
  attrName: string;
  value: boolean;
}

interface StaticStyleBindingDescriptor {
  kind: 'static-style';
  el: Element;
  value: Record<string, string | number>;
}

// ─── Signal descriptors ─────────────────────────────────────────────────────

interface SignalTextBindingDescriptor {
  kind: 'signal-text';
  el: Element | Text;
  signal: Signal<unknown>;
}

/** @internal DSD-only descriptor emitted by hydration-scope, never by CSR collectPropBindings. */
interface SignalClassBindingDescriptor {
  kind: 'signal-class';
  el: Element;
  className: string;
  signal: Signal<unknown>;
}

interface SignalAttrBindingDescriptor {
  kind: 'signal-attr';
  el: Element;
  attrNames: string[];
  signal: Signal<unknown>;
}

interface SignalHtmlBindingDescriptor {
  kind: 'signal-html';
  el: Element;
  signal: Signal<unknown>;
  trusted: boolean;
}

interface SignalRenderBindingDescriptor {
  kind: 'signal-render';
  el: Element;
  signal: Signal<unknown>;
  lifecycle?: BindingLifecycle;
}

interface ConditionalBindingDescriptor {
  kind: 'conditional';
  anchor: ChildNode;
  condition: Signal<unknown> | unknown;
  renderTruthy: () => unknown;
  renderFalsy?: () => unknown;
}

interface ListBindingDescriptor {
  kind: 'list';
  anchor: ChildNode;
  items: Signal<unknown> | unknown;
  renderItem: (item: unknown, index: number) => unknown;
  /** Optional key extractor (ADR-0124): enables keyed reconciliation. */
  key?: (item: unknown, index: number) => string | number;
  /**
   * DOM nodes already in place at activation (matched DSD hydration, #917).
   * Keyed bindings seed their reconciliation map from it; unkeyed bindings
   * skip the initial render and clear the seeded nodes on the first change.
   * Keyed seeds carry their key; unkeyed seeds are one flat entry.
   */
  seed?: Array<{ key?: string; nodes: ChildNode[] }>;
}

// ─── Event / ref descriptors ──────────────────────────────────────────────────

export interface EventBindingDescriptor {
  kind: 'event';
  el: EventTarget;
  type: string;
  handler: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions | boolean;
}

interface RefBindingDescriptor {
  kind: 'ref';
  el: Element;
  callback: (el: Element) => void;
}

/** Union of all supported binding descriptors. */
export type BindingDescriptor =
  | StaticAttrBindingDescriptor
  | StaticPropBindingDescriptor
  | StaticBooleanBindingDescriptor
  | StaticStyleBindingDescriptor
  | SignalTextBindingDescriptor
  | SignalClassBindingDescriptor
  | SignalAttrBindingDescriptor
  | SignalHtmlBindingDescriptor
  | SignalRenderBindingDescriptor
  | ConditionalBindingDescriptor
  | ListBindingDescriptor
  | EventBindingDescriptor
  | RefBindingDescriptor;

// ─── Factory constructors ───────────────────────────────────────────────────

/** Create a signal-text binding descriptor. */
export function bindText(
  node: Text | Element,
  signal: Signal<unknown>,
): SignalTextBindingDescriptor {
  return { kind: 'signal-text', el: node, signal };
}

/** Create a signal-attribute binding descriptor. */
export function bindAttr(
  element: Element,
  names: string[],
  signal: Signal<unknown>,
): SignalAttrBindingDescriptor {
  return { kind: 'signal-attr', el: element, attrNames: names, signal };
}

/** Create a signal-class binding descriptor. */
export function bindClass(
  element: Element,
  className: string,
  signal: Signal<unknown>,
): SignalClassBindingDescriptor {
  return { kind: 'signal-class', el: element, className, signal };
}

/** Create a signal-html binding descriptor. */
export function bindHtml(
  element: Element,
  signal: Signal<unknown>,
  trusted: boolean,
): SignalHtmlBindingDescriptor {
  return { kind: 'signal-html', el: element, signal, trusted };
}

/** Create an event binding descriptor. */
export function bindEvent(
  element: EventTarget,
  event: string,
  listener: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions | boolean,
): EventBindingDescriptor {
  return { kind: 'event', el: element, type: event, handler: listener, options };
}

/** Create a signal-render binding descriptor. */
export function bindRender(
  element: Element,
  signal: Signal<unknown>,
  lifecycle: BindingLifecycle,
): SignalRenderBindingDescriptor {
  return { kind: 'signal-render', el: element, signal, lifecycle };
}

/** Create a conditional ({@link Show}) binding descriptor. */
export function bindConditional(
  anchor: ChildNode,
  condition: Signal<unknown> | unknown,
  renderTruthy: () => unknown,
  renderFalsy?: () => unknown,
): ConditionalBindingDescriptor {
  return { kind: 'conditional', anchor, condition, renderTruthy, renderFalsy };
}

/** Create a list ({@link For}) binding descriptor. */
export function bindList(
  anchor: ChildNode,
  items: Signal<unknown> | unknown,
  renderItem: (item: unknown, index: number) => unknown,
  key?: (item: unknown, index: number) => string | number,
  seed?: Array<{ key?: string; nodes: ChildNode[] }>,
): ListBindingDescriptor {
  return { kind: 'list', anchor, items, renderItem, key, seed };
}

/** Create a static attribute binding descriptor. */
export function bindStaticAttr(
  element: Element,
  attrName: string,
  value: unknown,
): StaticAttrBindingDescriptor {
  return { kind: 'static-attr', el: element, attrName, value };
}

/** Create a static DOM property binding descriptor. */
export function bindStaticProp(
  element: Element,
  propName: string,
  value: unknown,
): StaticPropBindingDescriptor {
  return { kind: 'static-prop', el: element, propName, value };
}

/** Create a static boolean attribute binding descriptor. */
export function bindStaticBoolean(
  element: Element,
  attrName: string,
  value: boolean,
): StaticBooleanBindingDescriptor {
  return { kind: 'static-boolean', el: element, attrName, value };
}

/** Create a static inline style binding descriptor. */
export function bindStaticStyle(
  element: Element,
  value: Record<string, string | number>,
): StaticStyleBindingDescriptor {
  return { kind: 'static-style', el: element, value };
}

/** Create a ref callback binding descriptor. */
export function bindRef(
  element: Element,
  callback: (el: Element) => void,
): RefBindingDescriptor {
  return { kind: 'ref', el: element, callback };
}
