/** Show, For, component, element-child, and registered-CE render branches. */
import {
  type EventMarkerContext,
  forBranchMarker,
  forEndMarker,
  forItemBoundaryMarker,
  forItemKey,
  serializeEventMarkers,
  showBranchMarker,
} from './event-marker.ts';
import { injectPropsSafe } from './security.ts';
import { unwrapSignalLike } from '../signal/index.ts';
import { isComponentCtor, isComponentFn } from './vnode.ts';
import type { ComponentCtor, ComponentFn, RenderFn, VNode } from '../protocol/vnode.ts';
import type { DsdComponentConstructor } from '../protocol/render.ts';
import {
  appendRenderPathSegment,
  BoundaryRenderError,
  formatDepthPathSuffix,
  isControlFlowThrow,
  isDepthLimitError,
  MAX_SSR_NESTING_DEPTH,
} from './render-policy.ts';
import { createLogger } from './logger.ts';
import { formatError, OpenElementError } from './errors.ts';
import {
  branchCommentNode,
  fragmentNode,
  type RenderNode,
  textNode,
  trustedHtmlNode,
} from './render-ir-serialization.ts';

export type RenderNodeFn = (
  node: unknown,
  eventContext: EventMarkerContext,
  nestingDepth: number,
  boundaryActive: boolean,
  renderPath?: readonly string[],
) => Promise<RenderNode>;

export async function renderShowBranch(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
  boundaryActive: boolean,
  renderPath: readonly string[] | undefined,
  renderNode: RenderNodeFn,
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
    ? await renderNode(target, eventContext, depth, boundaryActive, renderPath)
    : null;
  return fragmentNode(rendered ? [branch, rendered] : [branch]);
}

/** `<For>`: record the branch token, then render each item in order. */
export async function renderForBranch(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
  boundaryActive: boolean,
  renderPath: readonly string[] | undefined,
  renderNode: RenderNodeFn,
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
    const renderedItem = eventContext.evaluate
      ? eventContext.evaluate(() => renderFn(items[index], index))
      : renderFn(items[index], index);
    parts.push(
      await renderNode(
        renderedItem,
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
export async function renderComponentBranch(
  tag: ComponentCtor | ComponentFn,
  props: Record<string, unknown> | undefined,
  children: VNode['children'],
  eventContext: EventMarkerContext,
  nestingDepth: number,
  boundaryActive: boolean,
  renderPath: readonly string[] | undefined,
  renderNode: RenderNodeFn,
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
    const rendered = eventContext.evaluate
      ? eventContext.evaluate(() => callComponent(tag, props ?? {}, children))
      : callComponent(tag, props ?? {}, children);
    return await renderNode(
      rendered,
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
export async function renderElementChildren(
  props: Record<string, unknown> | undefined,
  children: unknown[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
  boundaryActive: boolean,
  renderPath: readonly string[] | undefined,
  parentTag: string,
  renderNode: RenderNodeFn,
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
        await renderNode(child, eventContext, depth, boundaryActive, renderPath),
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
export async function renderRegisteredCeBranch(
  tagName: string,
  props: Record<string, unknown> | undefined,
  children: unknown[],
  eventContext: EventMarkerContext,
  nestingDepth: number,
  boundaryActive: boolean,
  componentClass: CustomElementConstructor,
  renderPath: readonly string[] | undefined,
  renderNode: RenderNodeFn,
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
        renderNode,
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
      renderNode,
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
