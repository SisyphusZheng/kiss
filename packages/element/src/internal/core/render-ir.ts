/**
 * Internal structured render IR.
 *
 * v0.29.1: Unified attribute serialization and single async render path.
 * `renderDsdTree` is the only public rendering API. All internal rendering
 * flows through `renderToNode`.
 */

import {
  createEventMarkerContext,
  type EventMarkerContext,
  serializeEventMarkers,
} from './event-marker.ts';
import { HTML_TAG, isForTag, isFragment, isShowTag } from './jsx-runtime.ts';
import { isSignalLike } from '../signal/index.ts';
import { isComponentCtor, isComponentFn, isVNode } from './vnode.ts';
import { RENDER_PATH_TRACK_MIN_DEPTH } from './render-policy.ts';
import {
  fragmentNode,
  type RenderNode,
  serializeRenderNode,
  textNode,
  trustedHtmlNode,
  VOID_ELEMENTS,
} from './render-ir-serialization.ts';
import {
  renderComponentBranch,
  renderElementChildren,
  renderForBranch,
  renderRegisteredCeBranch,
  renderShowBranch,
} from './render-ir-branches.ts';
export {
  dsdHostNode,
  serializeAttrs,
  serializeRenderNode,
  textNode,
  trustedHtmlNode,
} from './render-ir-serialization.ts';
export type { RenderNode } from './render-ir-serialization.ts';

// ─── Single async render path ───────────────────────────────────

/**
 * @param boundaryActive ADR-0053 Layer 2: an ancestor error-boundary scope is
 * active — registered custom elements below this node throw on render failure
 * instead of bare-tagging, so the nearest boundary can capture the error.
 * @param renderPath #975: bounded ancestor path window for the depth-trip
 * message. Lazily activated near the depth limit (RENDER_PATH_TRACK_MIN_DEPTH)
 * so the ordinary success path stays allocation-free; the '…' seed marks
 * untracked ancestors above the activation point.
 */
export async function renderToNode(
  node: unknown,
  eventContext: EventMarkerContext = createEventMarkerContext(),
  nestingDepth = 0,
  boundaryActive = false,
  renderPath?: readonly string[],
): Promise<RenderNode> {
  // #975: lazy activation — below the tracking depth no array exists at all;
  // at/above it the window starts with an honest '…' for untracked ancestors.
  const trackedPath = renderPath ??
    (nestingDepth >= RENDER_PATH_TRACK_MIN_DEPTH ? ['…'] : undefined);
  if (node == null || typeof node === 'boolean') return fragmentNode([]);
  if (typeof node === 'string' || typeof node === 'number') return textNode(node);
  if (isSignalLike(node)) {
    return await renderToNode(
      (node as { value: unknown }).value,
      eventContext,
      nestingDepth,
      boundaryActive,
      trackedPath,
    );
  }
  if (!isVNode(node)) return textNode(String(node));

  const { tag, props, children } = node;

  // Fragment
  if (isFragment(tag)) {
    const parts: RenderNode[] = [];
    for (const child of children) {
      parts.push(
        await renderToNode(child, eventContext, nestingDepth, boundaryActive, trackedPath),
      );
    }
    return fragmentNode(parts);
  }

  // Trusted HTML (raw HTML insertion, no wrapping tag)
  if (tag === HTML_TAG) {
    return trustedHtmlNode(props?.html ?? '');
  }

  // Show
  if (isShowTag(tag)) {
    return await renderShowBranch(
      props,
      children,
      eventContext,
      nestingDepth,
      boundaryActive,
      trackedPath,
      renderToNode,
    );
  }

  // For
  if (isForTag(tag)) {
    return await renderForBranch(
      props,
      children,
      eventContext,
      nestingDepth,
      boundaryActive,
      trackedPath,
      renderToNode,
    );
  }

  // Component function/class
  if (isComponentCtor(tag) || isComponentFn(tag)) {
    return await renderComponentBranch(
      tag,
      props,
      children,
      eventContext,
      nestingDepth,
      boundaryActive,
      trackedPath,
      renderToNode,
    );
  }

  // Registered custom element host: delegate to renderDsd. The CE check runs
  // before children rendering so an error boundary can wrap its light-DOM
  // subtree in a boundary scope (children-first eid ordering is preserved
  // inside renderRegisteredCeBranch).
  const tagName = String(tag);
  const ceCtor = typeof customElements !== 'undefined' && customElements.get
    ? customElements.get(tagName)
    : undefined;
  if (ceCtor) {
    return await renderRegisteredCeBranch(
      tagName,
      props,
      children,
      eventContext,
      nestingDepth,
      boundaryActive,
      ceCtor,
      trackedPath,
      renderToNode,
    );
  }

  // HTML / SVG element
  const childNodes = await renderElementChildren(
    props,
    children,
    eventContext,
    nestingDepth,
    boundaryActive,
    trackedPath,
    tagName,
    renderToNode,
  );

  return {
    kind: 'element',
    tag: tagName,
    attrs: props,
    eventAttrs: serializeEventMarkers(props, eventContext),
    children: childNodes,
    voidElement: VOID_ELEMENTS.has(tagName),
  };
}

/**
 * `<Show>`: record the branch taken so hydration can detect signal drift
 * between SSR and hydration (a flipped branch shifts every subsequent
 * data-eid), then render the active child.
 */
export async function renderDsdTree(
  node: unknown,
  eventContext: EventMarkerContext = createEventMarkerContext(),
  nestingDepth = 0,
  boundaryActive = false,
  renderPath?: readonly string[],
): Promise<string> {
  return serializeRenderNode(
    await renderToNode(node, eventContext, nestingDepth, boundaryActive, renderPath),
  );
}

// ─── Helpers ────────────────────────────────────────────────────
