/** Supported JSX transform entrypoint for Element authors. */
export { Fragment, jsx, jsxs } from './internal/core/jsx-runtime.ts';

/** JSX type interface consumed by TypeScript's automatic JSX transform. */
export declare namespace JSX {
  interface Element {
    tag:
      | string
      | import('./internal/protocol/vnode.ts').ComponentFn
      | import('./internal/protocol/vnode.ts').ComponentCtor
      | symbol;
    props: Record<string, unknown>;
    children: (string | import('./internal/protocol/vnode.ts').VNode)[];
    key?: string | number;
    ref?: (element: globalThis.Element) => void;
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
