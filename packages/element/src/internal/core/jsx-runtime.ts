/**
 * ./index.ts - JSX Runtime.
 *
 * Implements the React-compatible jsx/jsxs/jsxDEV/Fragment interface.
 * Consumed by TypeScript/esbuild JSX transform when `jsxImportSource: "./index.ts"`.
 *
 * Design (ADR-0057):
 * - Fragment groups multiple children without a wrapping element
 * - jsxDEV adds source-map information in development builds
 *
 * @module ./jsx-runtime.ts
 */

/// <reference path="./jsx-types.d.ts" />

import type { ComponentCtor, ComponentFn, VNode } from '../protocol/vnode.ts';

/**
 * Usage in TSX:
 *   return <><div>a</div><div>b</div></>;
 */
export const Fragment: unique symbol = Symbol.for('openelement.fragment');

/**
 * Type guard for a VNode `tag` that represents a Fragment (grouping without a
 * wrapping element). Centralized in v0.42.0-alpha.9 (#640) so the three render
 * paths (render-ir, jsx-render-dom, event-hydration) share one check instead
 * of each repeating the `tag === Fragment || symbol-description` branch.
 *
 * The symbol-description branch also matches a non-canonical symbol that
 * carries the same description (e.g. a duplicate copy of this runtime in
 * another bundle), so cross-bundle VNodes still count as Fragments.
 */
export function isFragment(tag: unknown): boolean {
  return tag === Fragment ||
    (typeof tag === 'symbol' && String(tag) === 'Symbol(openelement.fragment)');
}

/** @internal Symbol for <Show> tag matching in renderToDom */
export const SHOW_TAG: unique symbol = Symbol.for('openelement.show');
/** @internal Symbol for <For> tag matching in renderToDom */
export const FOR_TAG: unique symbol = Symbol.for('openelement.for');
/** @internal Symbol for raw HTML insertion (trustedHtml helper) */
export const HTML_TAG: unique symbol = Symbol.for('openelement.html');

/**
 * Type guard for a VNode `tag` that represents a `<Show>` control-flow
 * directive. Centralized like `isFragment` (#740) so the three render paths
 * (render-ir, jsx-render-dom, event-hydration) share one check. The string
 * branch matches compiled JSX that emits the literal `show` tag instead of
 * the `Show()` factory symbol.
 */
export function isShowTag(tag: unknown): boolean {
  return tag === SHOW_TAG || tag === 'show';
}

/**
 * Type guard for a VNode `tag` that represents a `<For>` control-flow
 * directive. See `isShowTag` for why both the symbol and string forms match.
 */
export function isForTag(tag: unknown): boolean {
  return tag === FOR_TAG || tag === 'for';
}

/**
 * Create a VNode that renders as raw trusted HTML.
 *
 * During SSR the HTML string is emitted verbatim; on the client it is parsed
 * into real DOM nodes via innerHTML. The caller is responsible for sanitizing
 * the input — this is a trust boundary, not a sanitizer.
 *
 * @param html - The raw HTML string to render.
 * @returns A VNode that the render pipeline treats as trusted HTML.
 */
export function trustedHtml(html: string): VNode {
  return { tag: HTML_TAG, props: { html }, children: [] };
}

/**
 * Show conditional rendering factory (ADR-0059).
 *
 * Returns a VNode with the internal SHOW_TAG symbol so renderToDom
 * can intercept it as a control flow directive. Exported as a
 * function (not a Symbol) for TypeScript JSX compatibility.
 *
 * Usage: <Show when={this.#loading}><Spinner/><Content/></Show>
 */
export function Show(props: Record<string, unknown>): VNode {
  return createVNode(SHOW_TAG, props);
}

/**
 * For list rendering factory (ADR-0059).
 *
 * Usage: <For each={this.#items}>{(item) => <li>{item.name}</li>}</For>
 */
export function For(props: Record<string, unknown>): VNode {
  return createVNode(FOR_TAG, props);
}

function normaliseChildren(raw: unknown): (VNode | string)[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.flat(Infinity).filter((c) => c != null && c !== false && c !== true) as (
      | VNode
      | string
    )[];
  }
  if (raw === false || raw === true) return [];
  return [raw as VNode | string];
}

type ComponentTag = string | ComponentFn | ComponentCtor | symbol;

function createVNode(
  tag: ComponentTag | typeof Fragment,
  props: Record<string, unknown>,
  key?: string | number,
): VNode {
  const { children, ref, ...rest } = props as Record<string, unknown> & {
    children?: unknown;
    ref?: (el: Element) => void;
  };
  const childArray = normaliseChildren(children);
  const vnode: VNode = { tag, props: rest, children: childArray };
  if (key !== undefined) vnode.key = key;
  if (ref !== undefined) vnode.ref = ref as (el: Element) => void;
  return vnode;
}

/**
 * Called by the TypeScript JSX transform for elements with a single child.
 */
export function jsx(
  tag: ComponentTag | typeof Fragment,
  props: Record<string, unknown>,
  key?: string | number,
): VNode {
  return createVNode(tag, props, key);
}

/**
 * Called by the TypeScript JSX transform for elements with multiple children.
 */
export function jsxs(
  tag: ComponentTag | typeof Fragment,
  props: Record<string, unknown>,
  key?: string | number,
): VNode {
  return createVNode(tag, props, key);
}

/**
 * JSX factory for development mode.
 * Same as `jsx` but receives source-map information for better error messages.
 */
export function jsxDEV(
  tag: ComponentTag | typeof Fragment,
  props: Record<string, unknown>,
  key?: string | number,
  _isStaticChildren?: boolean,
  source?: { fileName: string; lineNumber: number; columnNumber: number },
  _self?: unknown,
): VNode {
  const vnode = createVNode(tag, props, key);
  if (source) {
    (vnode as VNode & { __source?: unknown }).__source = source;
  }
  return vnode;
}
