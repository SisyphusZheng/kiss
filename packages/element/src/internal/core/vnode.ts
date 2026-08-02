/**
 * vnode.ts - VNode interface definition.
 *
 * VNode is the intermediate representation of a component's declarative output.
 * It is a pure JS object — zero DOM dependency, zero runtime binding.
 *
 * ⚠️ VNode 接口冻结条款 (ADR-0057 §1.1):
 * v1.0 前只允许以下 5 个字段，不增加 hooks/memo/suspense/context/portal。
 * 任何新字段提案必须走 ADR 流程，并证明它不引入 VDOM diff 语义。
 *
 * @module ./vnode.ts
 */

import type { ComponentCtor, ComponentFn, RenderFn, VNode } from '../protocol/vnode.ts';
export type { ComponentCtor, ComponentFn, RenderFn, VNode };

// ─── Type guard ──────────────────────────────────────────────────────────────

/**
 * Returns true if the given value is a VNode object.
 */
export function isVNode(v: unknown): v is VNode {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;

  const candidate = v as {
    tag?: unknown;
    props?: unknown;
    children?: unknown;
  };
  const tagType = typeof candidate.tag;

  return (
    (tagType === 'string' || tagType === 'function' || tagType === 'symbol') &&
    typeof candidate.props === 'object' &&
    candidate.props !== null &&
    !Array.isArray(candidate.props) &&
    Array.isArray(candidate.children)
  );
}

/**
 * Returns true if the VNode tag is a class component constructor.
 */
export function isComponentCtor(tag: VNode['tag']): tag is ComponentCtor {
  return typeof tag === 'function' &&
    tag.prototype !== undefined &&
    typeof (tag as ComponentCtor).prototype.render === 'function';
}

/**
 * Returns true if the VNode tag is a function component.
 */
export function isComponentFn(tag: VNode['tag']): tag is ComponentFn {
  return typeof tag === 'function' && !isComponentCtor(tag);
}
