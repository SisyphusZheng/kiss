/**
 * alpha3-open-child — openElement child element nested inside a third-party
 * (Lit) host's shadow root (bidirectional interop section).
 *
 * v0.44 compiled island: the Lit host creates <alpha3-open-child> client-side
 * when it upgrades, so this island is client-only (ssr: false); the generated
 * client entry registers the compiled class on load and the element then
 * upgrades in place inside the Lit shadow root, creating its own shadow
 * content fresh from the compiled Part Program.
 */
import { defineIslandConfig } from '@openelement/app';
import { OpenElement } from '@openelement/element';

declare function element(
  tag: string,
  options?: { root: 'light' | 'shadow-open' | 'shadow-closed' },
): ClassDecorator;

export const openElement = defineIslandConfig({ hydrate: 'load', ssr: false, dsd: false });

@element('alpha3-open-child', { root: 'shadow-open' })
export default class Alpha3OpenChild extends OpenElement {
  render() {
    return <span id='open-child-ready'>openElement child inside Lit</span>;
  }
}
