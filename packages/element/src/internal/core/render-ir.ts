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
  forBranchMarker,
  forEndMarker,
  forItemBoundaryMarker,
  forItemKey,
  serializeEventMarkers,
  showBranchMarker,
} from './event-marker.ts';
import { HTML_TAG, isForTag, isFragment, isShowTag } from './jsx-runtime.ts';
import { injectPropsSafe } from './security.ts';
import { isSignalLike, unwrapSignalLike } from '../signal/index.ts';
import { isComponentCtor, isComponentFn, isVNode } from './vnode.ts';
import type { ComponentCtor, ComponentFn, RenderFn, VNode } from '../protocol/vnode.ts';
import type { DsdComponentConstructor } from '../protocol/render.ts';
import {
  appendRenderPathSegment,
  BoundaryRenderError,
  formatDepthPathSuffix,
  isControlFlowThrow,
  isDepthLimitError,
  MAX_SSR_NESTING_DEPTH,
  RENDER_PATH_TRACK_MIN_DEPTH,
} from './render-policy.ts';
import { createLogger } from './logger.ts';
import { formatError, OpenElementError } from './errors.ts';
import {
  branchCommentNode,
  dsdHostNode,
  fragmentNode,
  type RenderNode,
  serializeRenderNode,
  textNode,
  trustedHtmlNode,
  VOID_ELEMENTS,
} from './render-ir-serialization.ts';
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
async function renderShowBranch(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
  boundaryActive: boolean,
  renderPath: readonly string[] | undefined,
): Promise<RenderNode> {
  const whenVal = unwrapSignalLike(props?.when);
  const target = whenVal ? children[0] : children[1];
  const branch = branchCommentNode(showBranchMarker(Boolean(whenVal)));
  // #1067: same depth contract as a component frame (#1037) — a self-nesting
  // Show tree recurses through renderToNode without ever reaching renderDsd,
  // so the branch consumes one depth level and trips the same typed limit.
  const depth = nestingDepth + 1;
  if (depth > MAX_SSR_NESTING_DEPTH) {
    throw new OpenElementError(
      `SSR nesting depth exceeded ${MAX_SSR_NESTING_DEPTH} at <Show>${
        formatDepthPathSuffix(renderPath, 'Show')
      }`,
      { code: 'SSR_NESTING_DEPTH_EXCEEDED', phase: 'ssr' },
    );
  }
  const rendered = target
    ? await renderToNode(target, eventContext, depth, boundaryActive, renderPath)
    : null;
  return fragmentNode(rendered ? [branch, rendered] : [branch]);
}

/** `<For>`: record the branch token, then render each item in order. */
async function renderForBranch(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
  boundaryActive: boolean,
  renderPath: readonly string[] | undefined,
): Promise<RenderNode> {
  const items = unwrapSignalLike(props?.each) as unknown[];
  const renderFn = children[0] as RenderFn;
  // Read each item's identity getter exactly once per render: the branch
  // marker signs with these keys and the #975 path window reuses them —
  // a getter with side effects (or one that throws on a second read) must
  // not run twice.
  const itemKeys = Array.isArray(items) ? items.map((item) => forItemKey(item)) : undefined;
  const branch = branchCommentNode(forBranchMarker(items, itemKeys));
  if (!Array.isArray(items) || typeof renderFn !== 'function') {
    return fragmentNode([branch]);
  }
  const parts: RenderNode[] = [branch];
  // #1067: same depth contract as a component frame (#1037) — a renderFn that
  // nests another <For> per tree level recurses through renderToNode without
  // ever reaching renderDsd, so the branch consumes one depth level and trips
  // the same typed limit instead of growing the microtask queue unbounded.
  const depth = nestingDepth + 1;
  if (depth > MAX_SSR_NESTING_DEPTH) {
    throw new OpenElementError(
      `SSR nesting depth exceeded ${MAX_SSR_NESTING_DEPTH} at <For>${
        formatDepthPathSuffix(renderPath, 'For')
      }`,
      { code: 'SSR_NESTING_DEPTH_EXCEEDED', phase: 'ssr' },
    );
  }
  for (let index = 0; index < items.length; index++) {
    // Per-item boundary marker (protocol: oe-for-item:N) so matched hydration
    // can seed a keyed list binding over the existing SSR DOM (#917).
    parts.push(branchCommentNode(forItemBoundaryMarker(index)));
    // #975: while the depth-trip path window is active, distinguish the
    // per-item subtree by the item's stable key (same id/key fields the
    // branch token signs), falling back to the item ordinal. Reuses the
    // key already read for the branch marker — no second getter call.
    const itemPath = renderPath
      ? appendRenderPathSegment(
        renderPath,
        forItemPathSegment(items[index], index, itemKeys?.[index]),
      )
      : renderPath;
    parts.push(
      await renderToNode(
        renderFn(items[index], index),
        eventContext,
        depth,
        boundaryActive,
        itemPath,
      ),
    );
  }
  parts.push(branchCommentNode(forEndMarker()));
  return fragmentNode(parts);
}

/** #975 path segment for one `<For>` item: keyed when identifiable, else ordinal. */
function forItemPathSegment(item: unknown, index: number, key?: string | number): string {
  const resolved = key !== undefined ? key : forItemKey(item);
  return resolved !== undefined ? `for-item[key=${String(resolved)}]` : `for-item[index=${index}]`;
}

/** Component class/function: invoke, then render the returned node. */
async function renderComponentBranch(
  tag: ComponentCtor | ComponentFn,
  props: Record<string, unknown> | undefined,
  children: VNode['children'],
  eventContext: EventMarkerContext,
  nestingDepth: number,
  boundaryActive: boolean,
  renderPath: readonly string[] | undefined,
): Promise<RenderNode> {
  // #1037: component frames recurse through renderToNode without ever
  // reaching renderDsd, where the depth limit is enforced — a self-recursive
  // function component used to loop forever on the microtask queue. Consume
  // one depth level per component frame and trip the same typed limit here.
  // Thrown outside the try: a depth trip is control flow, never logged.
  const depth = nestingDepth + 1;
  if (depth > MAX_SSR_NESTING_DEPTH) {
    throw new OpenElementError(
      `SSR nesting depth exceeded ${MAX_SSR_NESTING_DEPTH} at <${
        (tag as { name?: string }).name || 'anonymous'
      }>`,
      { code: 'SSR_NESTING_DEPTH_EXCEEDED', phase: 'ssr' },
    );
  }
  try {
    return await renderToNode(
      callComponent(tag, props ?? {}, children),
      eventContext,
      depth,
      boundaryActive,
      renderPath,
    );
  } catch (err) {
    // Mirror renderRegisteredCeBranch: control flow needs no log,
    // BoundaryRenderError was already reported at its origin, and a
    // depth-limit trip bubbles through every frame — logging here would
    // repeat the same line once per level.
    if (
      !isControlFlowThrow(err) && !(err instanceof BoundaryRenderError) &&
      !isDepthLimitError(err)
    ) {
      createLogger('render').error(
        `render failed for <${String(tag)}>:` +
          ` ${formatError(err)}`,
      );
    }
    throw err;
  }
}

/** Element children: innerHTML / textContent override, else render children. */
async function renderElementChildren(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
  boundaryActive: boolean,
  renderPath: readonly string[] | undefined,
  parentTag: string,
): Promise<RenderNode[]> {
  const childNodes: RenderNode[] = [];

  if (props?.innerHTML !== undefined) {
    const value = unwrapSignalLike(props.innerHTML);
    childNodes.push(props.trustedHtml === true ? trustedHtmlNode(value) : textNode(value));
  } else if (props?.textContent !== undefined) {
    childNodes.push(textNode(unwrapSignalLike(props.textContent)));
  } else {
    // #1067: same depth contract as a component frame (#1037) — bare-element
    // recursion (a deeply self-similar vnode tree) reaches renderToNode
    // without a component or CE frame, so each element level consumes one
    // depth level and trips the same typed limit.
    const depth = nestingDepth + 1;
    if (depth > MAX_SSR_NESTING_DEPTH) {
      throw new OpenElementError(
        `SSR nesting depth exceeded ${MAX_SSR_NESTING_DEPTH} at <${parentTag}>${
          formatDepthPathSuffix(renderPath, parentTag)
        }`,
        { code: 'SSR_NESTING_DEPTH_EXCEEDED', phase: 'ssr' },
      );
    }
    for (const child of children) {
      childNodes.push(
        await renderToNode(child, eventContext, depth, boundaryActive, renderPath),
      );
    }
  }

  return childNodes;
}

/**
 * Registered custom element: delegate to renderDsd with the already-rendered
 * light DOM children and host-level event markers.
 *
 * Host-level event props on a registered custom element are dropped by
 * serializeAttrs, so emit the data-eid marker explicitly and thread it onto
 * the serialized host tag. Without this, hydration still counts an eid for
 * the host and every following sibling binding shifts by one. Children are
 * rendered before the host marker, preserving the SSR/hydration
 * children-first eid ordering.
 *
 * ADR-0053 Layer 2: when the host is an error boundary
 * (`static isErrorBoundary = true`), its light-DOM children render inside a
 * boundary scope — the first subtree failure aborts child rendering and the
 * boundary re-renders in captured-error state (its onError fallback) instead
 * of emitting the failed child's bare tag.
 */
async function renderRegisteredCeBranch(
  tagName: string,
  props: Record<string, unknown> | undefined,
  children: unknown[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
  boundaryActive: boolean,
  componentClass: CustomElementConstructor,
  renderPath: readonly string[] | undefined,
): Promise<RenderNode> {
  const isBoundary = (componentClass as DsdComponentConstructor).isErrorBoundary === true;

  // #975: this host consumes one depth level — while the path window is
  // active, its tag becomes the latest segment for the subtree below it.
  const hostPath = renderPath ? appendRenderPathSegment(renderPath, tagName) : renderPath;

  let childNodes: RenderNode[];
  if (isBoundary) {
    try {
      childNodes = await renderElementChildren(
        props,
        children,
        eventContext,
        nestingDepth,
        true,
        hostPath,
        tagName,
      );
    } catch (err) {
      if (isControlFlowThrow(err) || isDepthLimitError(err)) throw err;
      const { renderDsd } = await import('./render-dsd.ts');
      const captured = await renderDsd(tagName, {
        componentClass,
        props,
        nestingDepth: nestingDepth + 1,
        boundaryError: err,
        throwOnRenderError: boundaryActive,
        renderPath: hostPath,
      });
      return trustedHtmlNode(captured.html);
    }
  } else {
    childNodes = await renderElementChildren(
      props,
      children,
      eventContext,
      nestingDepth,
      boundaryActive,
      hostPath,
      tagName,
    );
  }

  try {
    const hostEventAttrs = serializeEventMarkers(props, eventContext);
    const { renderDsd } = await import('./render-dsd.ts');
    const dsdResult = await renderDsd(tagName, {
      componentClass,
      props,
      lightDom: childNodes,
      nestingDepth: nestingDepth + 1,
      hostEventAttrs,
      throwOnRenderError: boundaryActive,
      renderPath: hostPath,
    });
    return trustedHtmlNode(dsdResult.html);
  } catch (err) {
    // #922: notFound()/redirect() are expected control flow (the request-time
    // handler answers 404/3xx) — no error log for them. BoundaryRenderError
    // is already reported at its origin; it bubbles to the nearest boundary.
    // Depth-limit errors are typed safety trips that bubble through every
    // frame — logging here would repeat the same line once per level.
    if (
      !isControlFlowThrow(err) && !(err instanceof BoundaryRenderError) &&
      !isDepthLimitError(err)
    ) {
      createLogger('render').error(
        `renderDsd failed for registered CE <${tagName}>:` +
          ` ${formatError(err)}`,
      );
    }
    throw err;
  }
}

// ─── Public API ─────────────────────────────────────────────────

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

function callComponent(
  tag: VNode['tag'],
  props: Record<string, unknown>,
  children: (VNode | string | RenderFn)[],
): unknown {
  if (isComponentCtor(tag)) {
    const instance = new tag();
    injectPropsSafe(instance, props, `render<${String(tag)}>`);
    return instance.render();
  }
  if (isComponentFn(tag)) {
    return tag({ ...props, children });
  }
  return null;
}
