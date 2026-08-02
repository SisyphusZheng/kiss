/**
 * Supported JSX transform entrypoint for Element authors.
 *
 * The JSX namespace is declared inline here (and in jsx-dev-runtime.ts)
 * because TypeScript's automatic JSX transform resolves it from the
 * jsx-runtime module's emitted declarations — a `/// <reference>` indirection
 * does not survive `deno pack` declaration emit (consumer:packaged gate).
 * Keep in sync with internal/core/jsx-types.d.ts (used by the internal
 * runtime).
 */
export { Fragment, jsx, jsxs } from './internal/core/jsx-runtime.ts';

/** JSX type interface consumed by TypeScript's automatic JSX transform. */
export declare namespace JSX {
  /**
   * JSX expression result — structurally compatible with VNode.
   *
   * children must match VNode.children: (VNode | string)[] to satisfy
   * TypeScript's structural assignability check when a JSX expression
   * is returned from OpenElement.render(): VNode | null.
   */
  interface Element {
    tag:
      | string
      | import('./internal/protocol/vnode.ts').ComponentFn
      | import('./internal/protocol/vnode.ts').ComponentCtor
      | symbol;
    props: Record<string, unknown>;
    children: (string | import('./internal/protocol/vnode.ts').VNode)[];
    key?: string | number;
    ref?: (el: globalThis.Element) => void;
  }

  interface ElementClass {
    render(): unknown;
  }

  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }

  interface ElementAttributesProperty {
    props: Record<string, unknown>;
  }

  interface ElementChildrenAttribute {
    children: unknown;
  }
}
