/**
 * @openelement/core - Unified binding descriptor types (ADR-0109 Phase 1).
 *
 * Declarative DOM binding contracts used by the runtime and hydration layers.
 * Each descriptor captures one side effect to apply to a host element.
 *
 * @module @openelement/core/binding-descriptor
 */

import type { Signal } from '@openelement/protocol/signal';

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

export interface StaticAttrBindingDescriptor {
  kind: 'static-attr';
  el: Element;
  key: string;
  attrName: string;
  value: unknown;
}

export interface StaticPropBindingDescriptor {
  kind: 'static-prop';
  el: Element;
  propName: string;
  value: unknown;
}

export interface StaticBooleanBindingDescriptor {
  kind: 'static-boolean';
  el: Element;
  attrName: string;
  value: boolean;
}

export interface StaticStyleBindingDescriptor {
  kind: 'static-style';
  el: Element;
  value: Record<string, string | number>;
}

// ─── Signal descriptors ─────────────────────────────────────────────────────

export interface SignalTextBindingDescriptor {
  kind: 'signal-text';
  el: Element | Text;
  signal: Signal<unknown>;
}

export interface SignalClassBindingDescriptor {
  kind: 'signal-class';
  el: Element;
  className: string;
  signal: Signal<unknown>;
}

export interface SignalAttrBindingDescriptor {
  kind: 'signal-attr';
  el: Element;
  attrNames: string[];
  signal: Signal<unknown>;
}

export interface SignalHtmlBindingDescriptor {
  kind: 'signal-html';
  el: Element;
  signal: Signal<unknown>;
  trusted: boolean;
}

export interface SignalRenderBindingDescriptor {
  kind: 'signal-render';
  el: Element;
  signal: Signal<unknown>;
  lifecycle: BindingLifecycle;
}

// ─── Event / ref descriptors ──────────────────────────────────────────────────

export interface EventBindingDescriptor {
  kind: 'event';
  el: EventTarget;
  type: string;
  handler: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions | boolean;
}

export interface RefBindingDescriptor {
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
  | EventBindingDescriptor
  | RefBindingDescriptor;
