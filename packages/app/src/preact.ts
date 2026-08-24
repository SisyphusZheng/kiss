/**
 * @openelement/app/preact — Preact island support.
 *
 * Creates custom elements that extend OpenElement and render Preact
 * components through the DSD SSR pipeline. On the server, the Preact
 * component is rendered to a string using preact-render-to-string and
 * wrapped as trusted HTML in OpenElement's render(). On the client,
 * preactHydrate or preactRender takes over in the clientActivate() hook.
 *
 * @module @openelement/app/preact
 */

import { OpenElement, trustedHtml, type VNode } from '@openelement/element';
import { assertValidTagName, DATA_SSR_PROPS, getSsrProps } from '@openelement/element';
import { h, hydrate as preactHydrate, render as preactRender } from 'preact';
import type { ComponentChild } from 'preact';
import { renderToString } from 'preact-render-to-string';

type PreactIslandProps = Record<string, unknown>;

type PreactIslandComponent<
  Props extends PreactIslandProps = PreactIslandProps,
> = (
  props: Props,
) => ComponentChild;

export interface PreactIslandOptions {
  /**
   * Server-render the island into DSD (default). Set `false` for a CSR-only
   * island rendered from scratch in clientActivate(). Note: `hydrate`/`dsd`
   * strategies from defineIslandConfig() are not supported here — the island
   * activates immediately.
   */
  ssr?: boolean;
  props?: PreactIslandProps;
}

function collectAttributes(host: HTMLElement): PreactIslandProps {
  const props: PreactIslandProps = {};
  const attrs = host.attributes;
  if (!attrs) return props;
  for (const attr of Array.from(attrs)) {
    if (attr.name === DATA_SSR_PROPS) continue;
    props[attr.name] = attr.value;
  }
  return props;
}

function resolveProps(
  host: HTMLElement,
  baseProps: PreactIslandProps,
): PreactIslandProps {
  return {
    ...baseProps,
    ...collectAttributes(host),
    ...(getSsrProps(host) ?? {}),
  };
}

export function definePreactIsland<
  Props extends PreactIslandProps = PreactIslandProps,
>(
  tagName: string,
  Component: PreactIslandComponent<Props>,
  options: PreactIslandOptions = {},
): CustomElementConstructor {
  assertValidTagName(tagName);
  const baseProps = options.props ?? {};

  class OpenElementPreactIsland extends OpenElement {
    #preactMounted = false;
    #preactActivated = false;
    #detachGeneration = 0;

    #preactVNode() {
      return h(Component, resolveProps(this, baseProps) as Props);
    }

    override render(): VNode | null {
      if (typeof document === 'undefined') {
        // SSR path: render Preact component to string, return as trusted HTML
        const html = renderToString(this.#preactVNode());
        return trustedHtml(html);
      }
      // Client: let clientActivate() handle Preact hydration/render
      return null;
    }

    protected override clientActivate(): void {
      // A same-turn DOM move disconnects and reconnects before the deferred
      // teardown below. Invalidate that teardown and keep Preact as the sole
      // owner of the existing tree.
      this.#detachGeneration++;
      const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
      const vnode = this.#preactVNode();
      if (!this.#preactActivated && options.ssr !== false) {
        // DSD hydration: the shadow DOM already has SSR-rendered content
        preactHydrate(vnode, root);
      } else {
        // CSR, reconnect, or a same-turn DOM move: render/update through the
        // existing Preact owner instead of hydrating the same tree twice.
        preactRender(vnode, root);
      }
      this.#preactActivated = true;
      this.#preactMounted = true;
    }

    override update(): void {
      if (typeof document === 'undefined' || !this.#preactMounted) {
        super.update();
        return;
      }
      const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
      preactRender(this.#preactVNode(), root);
    }

    override requestUpdate(): void {
      this.update();
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback();
      const generation = ++this.#detachGeneration;
      queueMicrotask(() => {
        if (
          generation !== this.#detachGeneration ||
          this.isConnected ||
          !this.#preactMounted
        ) return;
        const root = this.shadowRoot;
        if (root) preactRender(null, root);
        this.#preactMounted = false;
      });
    }
  }

  // #952: same dev-SSR re-define semantics as defineElement — the marked SSR
  // stub registry outlives module re-evaluation, so island edits must
  // overwrite the stale class; browser registries keep the duplicate guard.
  // Contract: the marker name is chartered as SSR_REGISTRY_STUB_MARKER in
  // @openelement/element internal/protocol/ssr-registry-markers.ts (#965);
  // app cannot import element internals, so keep the literal in sync.
  const registry = typeof customElements !== 'undefined' ? customElements : undefined;
  if (
    registry &&
    ((registry as { __openElementSsrStub?: boolean }).__openElementSsrStub === true ||
      !registry.get(tagName))
  ) {
    registry.define(tagName, OpenElementPreactIsland);
  }

  return OpenElementPreactIsland;
}
