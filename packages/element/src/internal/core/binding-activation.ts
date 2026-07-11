/**
 * ./index.ts - Unified binding activation (ADR-0109 Phase 1).
 *
 * Applies a declarative BindingDescriptor to a host element.
 *
 * @module ./binding-activation.ts
 */

import { effect, unwrapSignalLike } from '../signal/index.ts';
import { trustRenderHtml } from './security.ts';
import { Fragment } from './jsx-runtime.ts';
import { createLogger } from './logger.ts';
import { formatError } from './errors.ts';
import type {
  BindingDescriptor,
  BindingDispose,
  BindingLifecycle,
  BindingRenderer,
} from './binding-descriptor.ts';

const bindingLog = createLogger('binding');

const noop: BindingDispose = () => {};

/** Register a dispose function with the lifecycle. */
export function registerDispose(dispose: BindingDispose, lifecycle: BindingLifecycle): void {
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

/** Register a custom binding kind in the activation registry. */
export function registerBindingKind(kind: string, applyFn: ApplyFn): void {
  if (registry.has(kind)) {
    bindingLog.warn(`Overwriting registered binding kind: ${kind}`);
  }
  registry.set(kind, applyFn);
}

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
 * result. Shared by signal-render and conditional bindings so the
 * fragment-unpacking logic is defined in one place (see #301).
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

  let currentChildren: ChildNode[] = [];
  const currentNestedDisposers = new Set<() => void>();

  const clearRender = () => {
    for (const dispose of currentNestedDisposers) {
      try {
        dispose();
      } catch (err) {
        bindingLog.error(`signal-render nested dispose failed: ${formatError(err)}`);
      }
    }
    currentNestedDisposers.clear();
    for (const child of currentChildren) {
      child.remove();
    }
    currentChildren = [];
  };

  const render = () => {
    clearRender();
    const raw = unwrapSignalLike(signal.value);
    if (raw == null) return;
    if (!renderer) {
      throw new Error('signal-render binding requires a renderer');
    }

    // Render into a fresh child lifecycle so nested signal effects can be
    // disposed per render without leaking into previous renders.
    const renderLifecycle: BindingLifecycle = {
      disposers: currentNestedDisposers,
    };
    if (descLifecycle.signal ?? lifecycle.signal) {
      renderLifecycle.signal = descLifecycle.signal ?? lifecycle.signal;
    }

    const node = Array.isArray(raw) ? { tag: Fragment, props: {}, children: raw } : raw;
    const children = renderToChildren(node, renderer, renderLifecycle);
    for (const child of children) el.appendChild(child);
    currentChildren = children;
  };

  const dispose = wrapBindingEffect('signal-render', render);

  const fullDispose: BindingDispose = () => {
    clearRender();
    dispose();
  };
  registerDispose(fullDispose, lifecycle);
  return fullDispose;
}

function applyConditional(
  desc: Extract<BindingDescriptor, { kind: 'conditional' }>,
  lifecycle: BindingLifecycle,
  renderer?: BindingRenderer,
): BindingDispose {
  const { anchor, condition, renderTruthy, renderFalsy } = desc;

  let currentChildren: ChildNode[] = [];
  const currentNestedDisposers = new Set<() => void>();

  const clearRender = () => {
    for (const dispose of currentNestedDisposers) {
      try {
        dispose();
      } catch (err) {
        bindingLog.error(`conditional nested dispose failed: ${formatError(err)}`);
      }
    }
    currentNestedDisposers.clear();
    for (const child of currentChildren) {
      child.remove();
    }
    currentChildren = [];
  };

  const render = () => {
    clearRender();
    const show = Boolean(unwrapSignalLike(condition));
    const target = show ? renderTruthy() : renderFalsy?.();
    if (target == null) return;
    if (!renderer) {
      throw new Error('conditional binding requires a renderer');
    }

    const renderLifecycle: BindingLifecycle = {
      disposers: currentNestedDisposers,
    };
    if (lifecycle.signal) {
      renderLifecycle.signal = lifecycle.signal;
    }

    const node = Array.isArray(target) ? { tag: Fragment, props: {}, children: target } : target;
    const children = renderToChildren(node, renderer, renderLifecycle);
    const ref = anchor.nextSibling;
    for (const child of children) anchor.parentNode?.insertBefore(child, ref);
    currentChildren = children;
  };

  const dispose = wrapBindingEffect('conditional', render);

  const fullDispose: BindingDispose = () => {
    clearRender();
    dispose();
  };
  registerDispose(fullDispose, lifecycle);
  return fullDispose;
}

function applyList(
  desc: Extract<BindingDescriptor, { kind: 'list' }>,
  lifecycle: BindingLifecycle,
  renderer?: BindingRenderer,
): BindingDispose {
  const { anchor, items, renderItem } = desc;

  let anchors: ChildNode[] = [];
  const currentNestedDisposers = new Set<() => void>();

  const clearRender = () => {
    for (const dispose of currentNestedDisposers) {
      try {
        dispose();
      } catch (err) {
        bindingLog.error(`list nested dispose failed: ${formatError(err)}`);
      }
    }
    currentNestedDisposers.clear();
    for (const a of anchors) {
      a.remove();
    }
    anchors = [];
  };

  const render = () => {
    clearRender();
    const list = unwrapSignalLike(items);
    if (!Array.isArray(list)) return;
    if (!renderer) {
      throw new Error('list binding requires a renderer');
    }

    const ref: ChildNode | null = anchor.nextSibling;
    const rendered: ChildNode[] = [];

    for (let i = 0; i < list.length; i++) {
      const renderLifecycle: BindingLifecycle = {
        disposers: currentNestedDisposers,
      };
      if (lifecycle.signal) {
        renderLifecycle.signal = lifecycle.signal;
      }

      const vn = renderItem(list[i], i);
      const node = Array.isArray(vn) ? { tag: Fragment, props: {}, children: vn } : vn;
      const dom = renderer.render(node, renderLifecycle);

      if (dom.nodeType === 11) {
        const fragChildren: ChildNode[] = [];
        while (dom.firstChild) {
          const child = dom.firstChild as ChildNode;
          fragChildren.push(child);
          dom.removeChild(child);
        }
        for (let j = 0; j < fragChildren.length; j++) {
          anchor.parentNode?.insertBefore(fragChildren[j], ref);
        }
        rendered.push(...fragChildren);
      } else {
        const child = dom as ChildNode;
        anchor.parentNode?.insertBefore(child, ref);
        rendered.push(child);
      }
    }

    anchors = rendered;
  };

  const dispose = wrapBindingEffect('list', render);

  const fullDispose: BindingDispose = () => {
    clearRender();
    dispose();
  };
  registerDispose(fullDispose, lifecycle);
  return fullDispose;
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
