/** Conditional and list binding reconciliation. */
import { unwrapSignalLike } from '../signal/index.ts';
import { Fragment } from './jsx-runtime.ts';
import { createLogger } from './logger.ts';
import { formatError, OpenElementError } from './errors.ts';
import type {
  BindingDescriptor,
  BindingDispose,
  BindingLifecycle,
  BindingRenderer,
} from './binding-descriptor.ts';
import {
  createRenderCleanup,
  registerDispose,
  renderToChildren,
  wrapBindingEffect,
} from './binding-runtime.ts';

const bindingLog = createLogger('binding');

export function applyConditional(
  desc: Extract<BindingDescriptor, { kind: 'conditional' }>,
  lifecycle: BindingLifecycle,
  renderer?: BindingRenderer,
): BindingDispose {
  const { anchor, condition, renderTruthy, renderFalsy } = desc;
  const cleanup = createRenderCleanup('conditional');

  const render = () => {
    cleanup.clearRender();
    const show = Boolean(unwrapSignalLike(condition));
    const target = show ? renderTruthy() : renderFalsy?.();
    if (target == null) return;
    if (!renderer) {
      throw new OpenElementError('conditional binding requires a renderer', {
        code: 'MISSING_RENDERER',
        phase: 'render',
      });
    }

    const renderLifecycle: BindingLifecycle = {
      disposers: cleanup.nestedDisposers,
    };
    if (lifecycle.signal) {
      renderLifecycle.signal = lifecycle.signal;
    }

    const node = Array.isArray(target) ? { tag: Fragment, props: {}, children: target } : target;
    const children = renderToChildren(node, renderer, renderLifecycle);
    const ref = anchor.nextSibling;
    for (const child of children) anchor.parentNode?.insertBefore(child, ref);
    cleanup.setChildren(children);
  };

  const dispose = wrapBindingEffect('conditional', render);

  const fullDispose = cleanup.fullDispose(dispose);
  registerDispose(fullDispose, lifecycle);
  return fullDispose;
}

export function applyList(
  desc: Extract<BindingDescriptor, { kind: 'list' }>,
  lifecycle: BindingLifecycle,
  renderer?: BindingRenderer,
): BindingDispose {
  const { anchor, items, renderItem, key } = desc;
  const keyFn = key; // ADR-0124: reconciliation mode is fixed per binding
  const cleanup = createRenderCleanup('list');

  // ADR-0124: keyed mode state. Each entry owns its nodes and its own
  // disposer set, so a vanished key disposes only that item's effects.
  interface KeyedEntry {
    nodes: ChildNode[];
    disposers: Set<() => void>;
  }
  let keyed: Map<string, KeyedEntry> | null = null;
  let dupKeyWarned = false;

  // Matched DSD hydration seed (#917): the SSR DOM is already in place, so the
  // first activation must not render or clear anything. Keyed seeds become
  // the reconciliation map; unkeyed seeds are tracked for the first clear.
  let seeded = false;
  const seed = desc.seed;
  if (seed) {
    const flat = seed.flatMap((entry) => entry.nodes);
    if (keyFn) {
      keyed = new Map();
      for (const entry of seed) {
        if (entry.key === undefined) continue;
        const displaced = keyed.get(entry.key);
        if (displaced) {
          // Duplicate key in the seed (SSR rendered both occurrences): last
          // occurrence wins, same contract as the runtime reconciliation
          // below — and the overwritten predecessor's nodes must leave the
          // DOM here, otherwise they become ghost nodes no cleanup path
          // tracks (#1037).
          for (const node of displaced.nodes) node.remove();
          if (!dupKeyWarned) {
            dupKeyWarned = true;
            console.warn(
              `[openElement] duplicate key "${entry.key}" in a keyed <For>; ` +
                'only the last occurrence is kept and the replaced entry is disposed.',
            );
          }
        }
        keyed.set(entry.key, { nodes: entry.nodes, disposers: new Set() });
      }
    }
    if (flat.length > 0) cleanup.setChildren(flat);
    seeded = true;
  }

  const disposeEntry = (entry: KeyedEntry) => {
    for (const dispose of entry.disposers) {
      try {
        dispose();
      } catch (err) {
        bindingLog.error(`list item dispose failed: ${formatError(err)}`);
      }
    }
    for (const node of entry.nodes) {
      node.remove();
    }
  };

  const render = () => {
    const list = unwrapSignalLike(items);
    if (seeded) {
      // First activation after matched hydration: the SSR DOM is already in
      // place and recorded — leave it untouched until the items change. The
      // signal read above still registers the effect's reactive dependency,
      // so the first later write re-runs this render.
      seeded = false;
      return;
    }
    if (!Array.isArray(list)) {
      if (keyed) {
        for (const entry of keyed.values()) disposeEntry(entry);
        keyed = null;
      }
      cleanup.clearRender();
      return;
    }
    if (!renderer) {
      throw new OpenElementError('list binding requires a renderer', {
        code: 'MISSING_RENDERER',
        phase: 'render',
      });
    }

    if (keyFn) {
      // Keyed reconciliation: move surviving nodes, dispose vanished keys,
      // render only new keys (ADR-0124). Each node is placed right after the
      // previously placed node (`prev` chain), which keeps relative order
      // even for moved nodes — a fixed insertion ref would reverse them.
      const prev = keyed ?? new Map<string, KeyedEntry>();
      const next = new Map<string, KeyedEntry>();
      const seen = new Set<string>();
      const ordered: ChildNode[] = [];
      let placed: ChildNode | null = anchor;

      const previousSiblingOf = (node: ChildNode): ChildNode | null => {
        const parent = anchor.parentNode;
        if (!parent) return null;
        const siblings = parent.childNodes;
        const idx = Array.prototype.indexOf.call(siblings, node);
        return idx <= 0 ? null : (siblings[idx - 1] as ChildNode);
      };

      for (let i = 0; i < list.length; i++) {
        const entryKey = String(keyFn(list[i], i));
        if (seen.has(entryKey)) {
          // Duplicate key in one render: last occurrence wins, but the
          // displaced first occurrence must leave the DOM and have its
          // effects disposed — otherwise it becomes an unreachable orphan
          // (nodes leak forever, disposers never fire).
          const displaced = next.get(entryKey);
          if (displaced) {
            // If the insertion cursor sits on a displaced node, rewind it to
            // the displaced entry's predecessor (or the anchor) before
            // detaching — otherwise `placed?.nextSibling` below degrades to
            // appending at the parent's end.
            if (placed && displaced.nodes.includes(placed)) {
              placed = previousSiblingOf(displaced.nodes[0]) ?? anchor;
            }
            for (const node of displaced.nodes) {
              node.remove();
              const at = ordered.indexOf(node);
              if (at !== -1) ordered.splice(at, 1);
            }
            disposeEntry(displaced);
            next.delete(entryKey);
          }
          if (!dupKeyWarned) {
            dupKeyWarned = true;
            console.warn(
              `[openElement] duplicate key "${entryKey}" in a keyed <For>; ` +
                'only the last occurrence is kept and the replaced entry is disposed.',
            );
          }
        }
        const existing = prev.get(entryKey);
        if (existing && !seen.has(entryKey)) {
          for (const node of existing.nodes) {
            if (previousSiblingOf(node) !== placed) {
              anchor.parentNode?.insertBefore(node, placed?.nextSibling ?? null);
            }
            placed = node;
          }
          ordered.push(...existing.nodes);
          seen.add(entryKey);
          next.set(entryKey, existing);
          continue;
        }
        const itemDisposers = new Set<() => void>();
        const renderLifecycle: BindingLifecycle = { disposers: itemDisposers };
        if (lifecycle.signal) {
          renderLifecycle.signal = lifecycle.signal;
        }
        const vn = renderItem(list[i], i);
        const node = Array.isArray(vn) ? { tag: Fragment, props: {}, children: vn } : vn;
        const children = renderToChildren(node, renderer, renderLifecycle);
        for (const child of children) {
          anchor.parentNode?.insertBefore(child, placed?.nextSibling ?? null);
          placed = child;
        }
        ordered.push(...children);
        seen.add(entryKey);
        next.set(entryKey, { nodes: children, disposers: itemDisposers });
      }

      for (const [entryKey, entry] of prev) {
        if (!seen.has(entryKey)) disposeEntry(entry);
      }
      keyed = next;
      cleanup.setChildren(ordered);
      return;
    }

    // Unkeyed: previous behavior verbatim (clear + full re-render).
    cleanup.clearRender();

    const ref: ChildNode | null = anchor.nextSibling;
    const rendered: ChildNode[] = [];

    for (let i = 0; i < list.length; i++) {
      const renderLifecycle: BindingLifecycle = {
        disposers: cleanup.nestedDisposers,
      };
      if (lifecycle.signal) {
        renderLifecycle.signal = lifecycle.signal;
      }

      const vn = renderItem(list[i], i);
      const node = Array.isArray(vn) ? { tag: Fragment, props: {}, children: vn } : vn;
      const children = renderToChildren(node, renderer, renderLifecycle);
      for (const child of children) {
        anchor.parentNode?.insertBefore(child, ref);
      }
      rendered.push(...children);
    }

    cleanup.setChildren(rendered);
  };

  const dispose = wrapBindingEffect('list', render);

  const fullDispose = cleanup.fullDispose(dispose);
  const combinedDispose: BindingDispose = () => {
    fullDispose();
    if (keyed) {
      for (const entry of keyed.values()) disposeEntry(entry);
      keyed = null;
    }
  };
  registerDispose(combinedDispose, lifecycle);
  return combinedDispose;
}
