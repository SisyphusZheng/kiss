/** A DSD shadow root is populated by any node kind, not only elements. */
export function hasPopulatedShadowRoot(
  host: Pick<HTMLElement, 'shadowRoot'>,
): host is Pick<HTMLElement, 'shadowRoot'> & { shadowRoot: ShadowRoot } {
  return host.shadowRoot !== null && host.shadowRoot.childNodes.length > 0;
}
