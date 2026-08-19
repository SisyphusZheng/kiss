/**
 * vnode.ts - VNode interface definition.
 *
 * VNode is the intermediate representation of a component's declarative output.
 * It is a pure JS object — zero DOM dependency, zero runtime binding.
 *
 * @module ./vnode.ts
 */

/** Function component: receives props, returns VNode or null. */
export type ComponentFn = (props: Record<string, unknown>) => unknown;

/** Class component constructor: has render() method on prototype. */
export type ComponentCtor = new (...args: unknown[]) => { render(): unknown };

export type RenderFn = (item: unknown, idx: number) => unknown;

/** openElement declarative component description. */
export interface VNode {
  /** HTML tag name (e.g. 'div'), component function/class, or Fragment symbol */
  tag: string | ComponentFn | ComponentCtor | symbol;
  /** Attribute object (includes events, class, style, etc.) */
  props: Record<string, unknown>;
  /** Child nodes (VNode or text string) */
  children: (VNode | string | RenderFn)[];
  /**
   * Optional key for list rendering on host elements. `<For key={fn}>`
   * arrives as the JSX transform's third argument and is routed into
   * `props.key` by createVNode, so this field never holds the key
   * function (#1055).
   */
  key?: string | number;
  /** Optional ref callback — called with the DOM element after mount */
  ref?: (el: Element) => void;
}
