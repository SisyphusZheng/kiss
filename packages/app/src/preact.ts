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
import { assertValidTagName, getSsrProps } from '@openelement/core';
import { h, hydrate as preactHydrate, render as preactRender } from 'preact';
import type { ComponentChild } from 'preact';
import type { IslandConfig } from './authoring.ts';

let renderToString:
  | typeof import('preact-render-to-string')['renderToString']
  | undefined;

// SSR-only: keep preact-render-to-string out of browser module evaluation.
if (typeof document === 'undefined') {
  ({ renderToString } = await import('preact-render-to-string'));
}

export type PreactIslandProps = Record<string, unknown>;

export type PreactIslandComponent<
  Props extends PreactIslandProps = PreactIslandProps,
> = (
  props: Props,
) => ComponentChild;

export interface PreactIslandOptions extends IslandConfig {
  props?: PreactIslandProps;
}

function collectAttributes(host: HTMLElement): PreactIslandProps {
  const props: PreactIslandProps = {};
  const attrs = host.attributes;
  if (!attrs) return props;
  for (const attr of Array.from(attrs)) {
    if (attr.name === 'data-ssr-props') continue;
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
        if (!renderToString) {
          throw new Error(
            'openElement: preact-render-to-string failed to load for SSR.',
          );
        }
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
