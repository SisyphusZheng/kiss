/**
 * @openelement/core - Unified binding activation (ADR-0109 Phase 1).
 *
 * Applies a declarative BindingDescriptor to a host element.
 *
 * @module @openelement/core/binding-activation
 */

import { effect, unwrapSignalLike } from '@openelement/signal';
import { trustRenderHtml } from './security.js';
import { Fragment } from './jsx-runtime.ts';
import { createLogger } from './logger.js';
import { formatError } from './errors.js';
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
  lifecycle.disposers?.add(dispose);
  if (lifecycle.signal) {
    lifecycle.signal.addEventListener('abort', dispose, { once: true });
  }
}

/** Apply a single binding descriptor and return a dispose function. */
export function applyBindingDescriptor(
  desc: BindingDescriptor,
  lifecycle: BindingLifecycle,
  renderer?: BindingRenderer,
): BindingDispose {
  switch (desc.kind) {
    case 'static-attr':
      return applyStaticAttr(desc, lifecycle);
    case 'static-prop':
      return applyStaticProp(desc, lifecycle);
    case 'static-boolean':
      return applyStaticBoolean(desc, lifecycle);
    case 'static-style':
      return applyStaticStyle(desc, lifecycle);
    case 'signal-text':
      return applySignalText(desc, lifecycle);
    case 'signal-class':
      return applySignalClass(desc, lifecycle);
    case 'signal-attr':
      return applySignalAttr(desc, lifecycle);
    case 'signal-html':
      return applySignalHtml(desc, lifecycle);
    case 'signal-render':
      return applySignalRender(desc, lifecycle, renderer);
    case 'event':
      return applyEvent(desc, lifecycle);
    case 'ref':
      return applyRef(desc, lifecycle);
    default: {
      // Exhaustiveness guard: unknown descriptor kinds are no-ops.
      const _exhaustive: never = desc;
      void _exhaustive;
      return noop;
    }
  }
}

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

  const dispose = effect(() => {
    try {
      update();
    } catch (err) {
      bindingLog.error(`signal-text binding failed: ${formatError(err)}`);
    }
  });
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

  const dispose = effect(() => {
    try {
      update();
    } catch (err) {
      bindingLog.error(`signal-class binding failed: ${formatError(err)}`);
    }
  });
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

  const dispose = effect(() => {
    try {
      update();
    } catch (err) {
      bindingLog.error(`signal-attr binding failed: ${formatError(err)}`);
    }
  });
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

  const dispose = effect(() => {
    try {
      update();
    } catch (err) {
      bindingLog.error(`signal-html binding failed: ${formatError(err)}`);
    }
  });
  registerDispose(dispose, lifecycle);
  return dispose;
}

function applySignalRender(
  desc: Extract<BindingDescriptor, { kind: 'signal-render' }>,
  lifecycle: BindingLifecycle,
  renderer?: BindingRenderer,
): BindingDispose {
  const { el, signal } = desc;

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
    if (lifecycle.signal) {
      renderLifecycle.signal = lifecycle.signal;
    }

    // Normalize VNode[] into a Fragment so multiple rendered nodes can be
    // tracked and replaced together across updates.
    const node = Array.isArray(raw) ? { tag: Fragment, props: {}, children: raw } : raw;
    const result = renderer.render(node, renderLifecycle);

    if (result.nodeType === 11 || result.nodeType === 0) {
      const fragChildren: ChildNode[] = [];
      while (result.firstChild) {
        const child = result.firstChild as ChildNode;
        fragChildren.push(child);
        el.appendChild(child);
      }
      currentChildren = fragChildren;
    } else {
      const child = result as ChildNode;
      el.appendChild(child);
      currentChildren = [child];
    }
  };

  const dispose = effect(() => {
    try {
      render();
    } catch (err) {
      bindingLog.error(`signal-render binding failed: ${formatError(err)}`);
    }
  });

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
