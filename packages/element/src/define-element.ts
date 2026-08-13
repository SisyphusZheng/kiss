/**
 * @openelement/element — defineElement helper.
 *
 * Functional component-style authoring for OpenElement.
 */
import { assertValidTagName } from './internal/core/index.ts';
import { collectPublicProps } from './internal/core/props-utils.ts';
import { effect } from './internal/signal/framework.ts';
import { OpenElement } from './open-element.ts';
import type { ElementDefinition } from './types.ts';
import type { VNode } from './internal/protocol/vnode.ts';

function normalizeElementDefinition<Props extends Record<string, unknown>>(
  input: ((props: Props) => VNode | null) | ElementDefinition<Props>,
): ElementDefinition<Props> {
  return typeof input === 'function' ? { render: input } : input;
}

/**
 * Define an OpenElement from a function-mode render or a full definition.
 *
 * Function-mode render behavior (#940): signal reads inside render() are
 * tracked by a wrapping effect, and every signal write triggers a full
 * synchronous re-render of the element (no batching, no per-node updates).
 * Consequently DSD hydration's DOM reuse is effectively void for
 * function-mode islands: the effect re-renders CSR output immediately after
 * hydration instead of patching the SSR'd nodes in place.
 */
export function defineElement<Props extends Record<string, unknown> = Record<string, unknown>>(
  tagName: string,
  input: ((props: Props) => VNode | null) | ElementDefinition<Props>,
): typeof OpenElement {
  assertValidTagName(tagName);
  const definition = normalizeElementDefinition(input);

  class OpenElementComponent extends OpenElement {
    static override styles = definition.styles;

    #disposeReactiveRender: (() => void) | null = null;

    override render(): VNode | null {
      return definition.render(
        collectPublicProps(this as unknown as Record<string, unknown>) as Props,
      );
    }

    // #940: function-mode render output is plain static text — no data-signal
    // markers and no signal props — so `count.value` reads inside render() are
    // invisible to the binding system and the island renders dead. Wrap the
    // render in a tracking effect: every signal read during render() subscribes
    // to a full re-render (update()).
    #installReactiveRender(): void {
      if (this.#disposeReactiveRender) return;
      this.#disposeReactiveRender = effect(() => {
        if (this.isConnected) this.update();
      });
    }

    protected override onCsrRendered(): void {
      this.#installReactiveRender();
    }

    protected override onDsdHydrated(): void {
      this.#installReactiveRender();
    }

    override disconnectedCallback(): void {
      this.#disposeReactiveRender?.();
      this.#disposeReactiveRender = null;
      super.disconnectedCallback();
    }
  }

  // #952: the dev SSR registry (adapter-vite's customElements stub, marked
  // __openElementSsrStub) persists on globalThis across vite module-runner
  // re-evaluations; re-define so route edits take effect on the next request.
  // Real browser registries keep the guard: a duplicate define() throws.
  const registry = typeof customElements !== 'undefined' ? customElements : undefined;
  if (
    registry &&
    ((registry as { __openElementSsrStub?: boolean }).__openElementSsrStub === true ||
      !registry.get(tagName))
  ) {
    registry.define(tagName, OpenElementComponent);
  }

  return OpenElementComponent;
}
