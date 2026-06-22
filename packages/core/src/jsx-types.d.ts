/**
 * @openelement/core - JSX type declarations.
 *
 * Required by TypeScript's `jsx: "react-jsx"` mode.
 * Defines JSX.Element as VNode so function components returning VNode
 * are recognized as valid JSX component types.
 *
 * @module @openelement/core/jsx-types
 */

declare namespace JSX {
  /**
   * JSX expression result — structurally compatible with VNode.
   *
   * children must match VNode.children: (VNode | string)[] to satisfy
   * TypeScript's structural assignability check when a JSX expression
   * is returned from DsdElement.render(): VNode | null.
   */
  interface Element {
    tag:
      | string
      | import('@openelement/protocol/vnode').ComponentFn
      | import('@openelement/protocol/vnode').ComponentCtor
      | symbol;
    props: Record<string, unknown>;
    children: (string | import('@openelement/protocol/vnode').VNode)[];
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
