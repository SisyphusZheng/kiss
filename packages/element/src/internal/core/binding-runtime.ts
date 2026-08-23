/** Shared binding lifecycle, effect, rendering, and teardown utilities. */
import { effect } from '../signal/index.ts';
import { createLogger } from './logger.ts';
import { formatError } from './errors.ts';
import type { BindingDispose, BindingLifecycle, BindingRenderer } from './binding-descriptor.ts';

const bindingLog = createLogger('binding');

export const noop: BindingDispose = () => {};

/**
 * Register a dispose function with the lifecycle.
 *
 * #916: register in BOTH places — the abort hook alone orphaned every
 * effect inside keyed/unkeyed/conditional/signal-render branches whenever
 * the lifecycle carried a signal: their disposers never landed in the
 * branch's disposer set, so removing a keyed item (or re-rendering a
 * branch) disposed nothing and the detached DOM kept reacting to signal
 * updates. Disposers are idempotent (unsubscribe / removeEventListener /
 * preact effect dispose), so the eventual double-fire on abort is harmless.
 */
export function registerDispose(dispose: BindingDispose, lifecycle: BindingLifecycle): void {
  if (lifecycle.signal) {
    lifecycle.signal.addEventListener('abort', dispose, { once: true });
  }
  if (lifecycle.disposers) {
    lifecycle.disposers.add(dispose);
  }
}

/**
 * Run a binding update/render function inside a reactive effect, catching and
 * logging any error so one failing binding does not break the rest of the
 * render. Consolidates the previously duplicated try/catch + log boilerplate
 * shared by every binding activation function.
 */
export function wrapBindingEffect(kind: string, run: () => void): () => void {
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
export function renderToChildren(
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
export function createRenderCleanup(kind: string): {
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
