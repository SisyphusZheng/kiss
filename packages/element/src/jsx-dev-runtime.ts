/**
 * Supported development JSX transform entrypoint for Element authors.
 *
 * The JSX namespace is declared inline here (and in jsx-runtime.ts) because
 * TypeScript's automatic JSX transform resolves it from the jsx-runtime
 * module's emitted declarations — a `/// <reference>` indirection does not
 * survive `deno pack` declaration emit (consumer:packaged gate). Keep in
 * sync with internal/core/jsx-types.d.ts (used by the internal runtime).
 */
export { Fragment, jsxDEV } from './public-runtime.ts';

/** JSX type interface consumed by TypeScript's automatic JSX transform. */
export declare namespace JSX {
  /**
   * JSX expression result — structurally compatible with VNode.
   *
   * children must match VNode.children: (VNode | string | RenderFn)[] to
   * satisfy TypeScript's structural assignability check when a JSX
   * expression is returned from OpenElement.render(): VNode | null, and so
   * that control-flow components returning VNode (<For key={fn}>, #1055)
   * are valid JSX components.
   */
  interface Element {
    tag:
      | string
      | import('./public-runtime.ts').ComponentFn
      | import('./public-runtime.ts').ComponentCtor
      | symbol;
    props: Record<string, unknown>;
    children: (
      | string
      | import('./public-runtime.ts').VNode
      | import('./public-runtime.ts').RenderFn
    )[];
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
