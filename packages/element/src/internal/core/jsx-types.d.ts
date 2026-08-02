/**
 * jsx-types.d.ts - JSX type declarations.
 *
 * Required by TypeScript's `jsx: "react-jsx"` mode.
 * Defines JSX.Element as VNode so function components returning VNode
 * are recognized as valid JSX component types.
 *
 * @module ./jsx-types.ts
 */

declare namespace JSX {
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
      | import('../protocol/vnode.ts').ComponentFn
      | import('../protocol/vnode.ts').ComponentCtor
      | symbol;
    props: Record<string, unknown>;
    children: (string | import('../protocol/vnode.ts').VNode)[];
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
