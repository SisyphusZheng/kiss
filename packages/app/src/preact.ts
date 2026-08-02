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

export type PreactIslandProps = Record<string, unknown>;

export type PreactIslandComponent<
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
    override render(): VNode | null {
      if (typeof document === 'undefined') {
        // SSR path: render Preact component to string, return as trusted HTML
        const html = renderToString(
          h(Component, resolveProps(this, baseProps) as Props),
        );
        return trustedHtml(html);
      }
      // Client: let clientActivate() handle Preact hydration/render
      return null;
    }

    protected override clientActivate(): void {
      const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
      const vnode = h(Component, resolveProps(this, baseProps) as Props);
      if (options.ssr !== false) {
        // DSD hydration: the shadow DOM already has SSR-rendered content
        preactHydrate(vnode, root);
      } else {
        // CSR: full render from scratch
        preactRender(vnode, root);
      }
    }
  }

  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, OpenElementPreactIsland);
  }

  return OpenElementPreactIsland;
}
