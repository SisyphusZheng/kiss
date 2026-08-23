/**
 * binding-activation.ts - Unified binding activation (ADR-0109 Phase 1).
 *
 * Applies a declarative BindingDescriptor to a host element.
 *
 * @module ./binding-activation.ts
 */

import { unwrapSignalLike } from '../signal/index.ts';
import { trustRenderHtml } from './security.ts';
import { Fragment } from './jsx-runtime.ts';
import { createLogger } from './logger.ts';
import { formatError, OpenElementError } from './errors.ts';
import { stylePropertyNameFor } from './vnode-prop-rules.ts';
import type {
  BindingDescriptor,
  BindingDispose,
  BindingLifecycle,
  BindingRenderer,
} from './binding-descriptor.ts';
import {
  createRenderCleanup,
  noop,
  registerDispose,
  renderToChildren,
  wrapBindingEffect,
} from './binding-runtime.ts';
import { applyConditional, applyList } from './binding-collections.ts';

const bindingLog = createLogger('binding');

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
    // stylePropertyNameFor is the single casing rule shared with SSR — browsers silently drop camelCase
    // property names passed to setProperty (#1056).
    target.style.setProperty(stylePropertyNameFor(k), String(v));
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

  // #916 residual: register in both places even when an AbortSignal was
  // provided — the signal removes the listener on root abort, but branch
  // lifecycles (keyed list items, conditionals) dispose through their
  // disposer set; skipping it left the listener live on detached DOM.
  // removeEventListener is idempotent, so the double-fire on abort is safe.
  registerDispose(dispose, lifecycle);
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
