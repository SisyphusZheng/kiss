/**
 * binding-activation.ts - Unified binding activation (ADR-0109 Phase 1).
 *
 * Applies a declarative BindingDescriptor to a host element.
 *
 * @module ./binding-activation.ts
 */

import { effect, unwrapSignalLike } from '../signal/index.ts';
import { trustRenderHtml } from './security.ts';
import { Fragment } from './jsx-runtime.ts';
import { createLogger } from './logger.ts';
import { formatError, OpenElementError } from './errors.ts';
import type {
  BindingDescriptor,
  BindingDispose,
  BindingLifecycle,
  BindingRenderer,
} from './binding-descriptor.ts';

const bindingLog = createLogger('binding');

const noop: BindingDispose = () => {};

/** Register a dispose function with the lifecycle. */
function registerDispose(dispose: BindingDispose, lifecycle: BindingLifecycle): void {
  if (lifecycle.signal) {
    lifecycle.signal.addEventListener('abort', dispose, { once: true });
  } else {
    lifecycle.disposers?.add(dispose);
  }
}

type ApplyFn = (
  desc: BindingDescriptor,
  lifecycle: BindingLifecycle,
  renderer?: BindingRenderer,
) => BindingDispose;

const registry = new Map<string, ApplyFn>();

/** Apply a single binding descriptor and return a dispose function. */
export function applyBindingDescriptor(
  desc: BindingDescriptor,
  lifecycle: BindingLifecycle,
  renderer?: BindingRenderer,
): BindingDispose {
  const apply = registry.get(desc.kind);
  if (apply) {
    return apply(desc, lifecycle, renderer);
  }
  return noop;
}

/** Commit all binding descriptors against the activation layer in document order. */
export function commitBindings(
  descriptors: BindingDescriptor[],
  lifecycle: BindingLifecycle,
  renderer?: BindingRenderer,
): void {
  for (const desc of descriptors) {
    applyBindingDescriptor(desc, lifecycle, renderer);
  }
}

registry.set(
  'static-attr',
  (desc, lifecycle) =>
    applyStaticAttr(desc as Extract<BindingDescriptor, { kind: 'static-attr' }>, lifecycle),
);
registry.set(
  'static-prop',
  (desc, lifecycle) =>
    applyStaticProp(desc as Extract<BindingDescriptor, { kind: 'static-prop' }>, lifecycle),
);
registry.set(
  'static-boolean',
  (desc, lifecycle) =>
    applyStaticBoolean(desc as Extract<BindingDescriptor, { kind: 'static-boolean' }>, lifecycle),
);
registry.set(
  'static-style',
  (desc, lifecycle) =>
    applyStaticStyle(desc as Extract<BindingDescriptor, { kind: 'static-style' }>, lifecycle),
);
registry.set(
  'signal-text',
  (desc, lifecycle) =>
    applySignalText(desc as Extract<BindingDescriptor, { kind: 'signal-text' }>, lifecycle),
);
registry.set(
  'signal-class',
  (desc, lifecycle) =>
    applySignalClass(desc as Extract<BindingDescriptor, { kind: 'signal-class' }>, lifecycle),
);
registry.set(
  'signal-attr',
  (desc, lifecycle) =>
    applySignalAttr(desc as Extract<BindingDescriptor, { kind: 'signal-attr' }>, lifecycle),
);
registry.set(
  'signal-html',
  (desc, lifecycle) =>
    applySignalHtml(desc as Extract<BindingDescriptor, { kind: 'signal-html' }>, lifecycle),
);
registry.set('signal-render', (desc, lifecycle, renderer) =>
  applySignalRender(
    desc as Extract<BindingDescriptor, { kind: 'signal-render' }>,
    lifecycle,
    renderer,
  ));
registry.set('conditional', (desc, lifecycle, renderer) =>
  applyConditional(
    desc as Extract<BindingDescriptor, { kind: 'conditional' }>,
    lifecycle,
    renderer,
  ));
registry.set(
  'list',
  (desc, lifecycle, renderer) =>
    applyList(desc as Extract<BindingDescriptor, { kind: 'list' }>, lifecycle, renderer),
);
registry.set(
  'event',
  (desc, lifecycle) => applyEvent(desc as Extract<BindingDescriptor, { kind: 'event' }>, lifecycle),
);
registry.set(
  'ref',
  (desc, lifecycle) => applyRef(desc as Extract<BindingDescriptor, { kind: 'ref' }>, lifecycle),
);

function applyStaticAttr(
  desc: Extract<BindingDescriptor, { kind: 'static-attr' }>,
  _lifecycle: BindingLifecycle,
): BindingDispose {
  if (desc.value == null) {
    desc.el.removeAttribute(desc.attrName);
  } else {
    desc.el.setAttribute(desc.attrName, String(desc.value));
  }
  return noop;
}

function applyStaticProp(
  desc: Extract<BindingDescriptor, { kind: 'static-prop' }>,
  _lifecycle: BindingLifecycle,
): BindingDispose {
  (desc.el as unknown as Record<string, unknown>)[desc.propName] = desc.value;
  return noop;
}

function applyStaticBoolean(
  desc: Extract<BindingDescriptor, { kind: 'static-boolean' }>,
  _lifecycle: BindingLifecycle,
): BindingDispose {
  if (desc.value) {
    desc.el.setAttribute(desc.attrName, '');
  } else {
    desc.el.removeAttribute(desc.attrName);
  }
  return noop;
}

function applyStaticStyle(
  desc: Extract<BindingDescriptor, { kind: 'static-style' }>,
  _lifecycle: BindingLifecycle,
): BindingDispose {
  const target = desc.el as HTMLElement;
  for (const [k, v] of Object.entries(desc.value)) {
    target.style.setProperty(k, String(v));
  }
  return noop;
}

/**
 * Run a binding update/render function inside a reactive effect, catching and
 * logging any error so one failing binding does not break the rest of the
 * render. Consolidates the previously duplicated try/catch + log boilerplate
 * shared by every binding activation function.
 */
function wrapBindingEffect(kind: string, run: () => void): () => void {
  return effect(() => {
    try {
      run();
    } catch (err) {
      bindingLog.error(`${kind} binding failed: ${formatError(err)}`);
    }
  });
}

/**
 * Render a VNode (or VNode[]) through the renderer and return the resulting DOM
 * nodes as a flat ChildNode[] - extracting children out of a DocumentFragment
 * result. Shared by signal-render, conditional and list bindings so the
 * fragment-unpacking logic is defined in one place (see #301, #789).
 */
function renderToChildren(
  node: unknown,
  renderer: BindingRenderer,
  renderLifecycle: BindingLifecycle,
): ChildNode[] {
  const result = renderer.render(node, renderLifecycle);
  if (result.nodeType === 11) {
    const children: ChildNode[] = [];
    while (result.firstChild) {
      const child = result.firstChild as ChildNode;
      children.push(child);
      result.removeChild(child);
    }
    return children;
  }
  return [result as ChildNode];
}

/**
 * Shared teardown for bindings that replace rendered content (signal-render,
 * conditional, list): dispose nested effects, then remove the current
 * children. `fullDispose` wraps the reactive effect dispose so both run on
 * lifecycle teardown (#789).
 */
function createRenderCleanup(kind: string): {
  nestedDisposers: Set<() => void>;
  clearRender: () => void;
  setChildren: (next: ChildNode[]) => void;
  fullDispose: (dispose: BindingDispose) => BindingDispose;
} {
  let currentChildren: ChildNode[] = [];
  const nestedDisposers = new Set<() => void>();

  const clearRender = () => {
    for (const dispose of nestedDisposers) {
      try {
        dispose();
      } catch (err) {
        bindingLog.error(`${kind} nested dispose failed: ${formatError(err)}`);
      }
    }
    nestedDisposers.clear();
    for (const child of currentChildren) {
      child.remove();
    }
    currentChildren = [];
  };

  return {
    nestedDisposers,
    clearRender,
    setChildren(next: ChildNode[]) {
      currentChildren = next;
    },
    fullDispose(dispose: BindingDispose): BindingDispose {
      return () => {
        clearRender();
        dispose();
      };
    },
  };
}

function applySignalText(
  desc: Extract<BindingDescriptor, { kind: 'signal-text' }>,
  lifecycle: BindingLifecycle,
): BindingDispose {
  const target = desc.el as Text | Element;
  const sig = desc.signal;

  const update = () => {
    const value = unwrapSignalLike(sig.value);
    const text = value == null ? '' : String(value);
    target.textContent = text;
  };

  const dispose = wrapBindingEffect('signal-text', update);
  registerDispose(dispose, lifecycle);
  return dispose;
}

function applySignalClass(
  desc: Extract<BindingDescriptor, { kind: 'signal-class' }>,
  lifecycle: BindingLifecycle,
): BindingDispose {
  const { el, className, signal } = desc;

  const update = () => {
    const value = Boolean(unwrapSignalLike(signal.value));
    el.classList.toggle(className, value);
  };

  const dispose = wrapBindingEffect('signal-class', update);
  registerDispose(dispose, lifecycle);
  return dispose;
}

function applySignalAttr(
  desc: Extract<BindingDescriptor, { kind: 'signal-attr' }>,
  lifecycle: BindingLifecycle,
): BindingDispose {
  const { el, attrNames, signal } = desc;

  const update = () => {
    const value = unwrapSignalLike(signal.value);
    for (const attrName of attrNames) {
      if (value == null || value === false) {
        el.removeAttribute(attrName);
      } else if (value === true) {
        el.setAttribute(attrName, '');
      } else {
        el.setAttribute(attrName, String(value));
      }
    }
  };

  const dispose = wrapBindingEffect('signal-attr', update);
  registerDispose(dispose, lifecycle);
  return dispose;
}

function applySignalHtml(
  desc: Extract<BindingDescriptor, { kind: 'signal-html' }>,
  lifecycle: BindingLifecycle,
): BindingDispose {
  const { el, signal, trusted } = desc;

  const update = () => {
    const raw = unwrapSignalLike(signal.value);
    const str = raw == null ? '' : String(raw);
    if (trusted) {
      el.innerHTML = trustRenderHtml(str);
    } else {
      el.textContent = str;
    }
  };

  const dispose = wrapBindingEffect('signal-html', update);
  registerDispose(dispose, lifecycle);
  return dispose;
}

function applySignalRender(
  desc: Extract<BindingDescriptor, { kind: 'signal-render' }>,
  lifecycle: BindingLifecycle,
  renderer?: BindingRenderer,
): BindingDispose {
  const { el, signal } = desc;
  const descLifecycle = desc.lifecycle ?? {};
  const cleanup = createRenderCleanup('signal-render');

  const render = () => {
    cleanup.clearRender();
    const raw = unwrapSignalLike(signal.value);
    if (raw == null) return;
    if (!renderer) {
      throw new OpenElementError('signal-render binding requires a renderer', {
        code: 'MISSING_RENDERER',
        phase: 'render',
      });
    }

    // Render into a fresh child lifecycle so nested signal effects can be
    // disposed per render without leaking into previous renders.
    const renderLifecycle: BindingLifecycle = {
      disposers: cleanup.nestedDisposers,
    };
    if (descLifecycle.signal ?? lifecycle.signal) {
      renderLifecycle.signal = descLifecycle.signal ?? lifecycle.signal;
    }

    const node = Array.isArray(raw) ? { tag: Fragment, props: {}, children: raw } : raw;
    const children = renderToChildren(node, renderer, renderLifecycle);
    for (const child of children) el.appendChild(child);
    cleanup.setChildren(children);
  };

  const dispose = wrapBindingEffect('signal-render', render);

  const fullDispose = cleanup.fullDispose(dispose);
  registerDispose(fullDispose, lifecycle);
  return fullDispose;
}

function applyConditional(
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

function applyList(
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

  let dupKeyWarned = false;

  const render = () => {
    const list = unwrapSignalLike(items);
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

function applyEvent(
  desc: Extract<BindingDescriptor, { kind: 'event' }>,
  lifecycle: BindingLifecycle,
): BindingDispose {
  const { el, type, handler, options } = desc;

  const listenerOptions: AddEventListenerOptions | boolean = lifecycle.signal
    ? {
      ...(typeof options === 'object' && options !== null ? options : {}),
      signal: lifecycle.signal,
    }
    : (options ?? {});

  el.addEventListener(type, handler, listenerOptions);

  const dispose: BindingDispose = () => {
    el.removeEventListener(type, handler, listenerOptions);
  };

  // When no AbortSignal was provided we still want an explicit dispose path.
  if (!lifecycle.signal) {
    registerDispose(dispose, lifecycle);
  }
  return dispose;
}

function applyRef(
  desc: Extract<BindingDescriptor, { kind: 'ref' }>,
  _lifecycle: BindingLifecycle,
): BindingDispose {
  try {
    desc.callback(desc.el);
  } catch (err) {
    bindingLog.error(`ref binding failed: ${formatError(err)}`);
  }
  return noop;
}
