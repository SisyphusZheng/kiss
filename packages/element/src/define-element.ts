/**
 * @openelement/element — defineElement / defineLayout helpers.
 *
 * Functional component-style authoring for OpenElement.
 */
import { OpenElement } from './open-element.ts';
import type { ElementDefinition } from './types.ts';
import type { VNode } from '@openelement/protocol/vnode';

const ERROR_PREFIX = '[openElement]';

function collectPublicProps(host: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const key of Object.keys(host)) {
    if (key.startsWith('__openElement')) continue;
    props[key] = host[key];
  }
  return props;
}

function normalizeElementDefinition<Props extends Record<string, unknown>>(
  input: ((props: Props) => VNode | null) | ElementDefinition<Props>,
): ElementDefinition<Props> {
  return typeof input === 'function' ? { render: input } : input;
}

function assertCustomElementTag(tagName: string): void {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(tagName)) {
    throw new Error(
      `${ERROR_PREFIX} "${tagName}" is not a valid custom element name. ` +
        'Use lowercase ASCII letters, digits, and at least one hyphen.',
    );
  }
}

export function defineElement<Props extends Record<string, unknown> = Record<string, unknown>>(
  tagName: string,
  input: ((props: Props) => VNode | null) | ElementDefinition<Props>,
): typeof OpenElement {
  assertCustomElementTag(tagName);
  const definition = normalizeElementDefinition(input);

  class OpenElementComponent extends OpenElement {
    static override styles = definition.styles;

    override render(): VNode | null {
      return definition.render(
        collectPublicProps(this as unknown as Record<string, unknown>) as Props,
      );
    }
  }

  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, OpenElementComponent);
  }

  return OpenElementComponent;
}

// semantic alias for defineElement, trim when template/doc migration done
export function defineLayout<Props extends Record<string, unknown> = Record<string, unknown>>(
  tagName: string,
  input: ((props: Props) => VNode | null) | ElementDefinition<Props>,
): typeof OpenElement {
  return defineElement(tagName, input);
}
