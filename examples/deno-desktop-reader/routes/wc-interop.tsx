/** @jsxImportSource @openelement/core */
import { OpenElement } from '@openelement/element';

// ponytail: Shoelace + MWC require import maps for bare specifier resolution.
// The wc-interop page validates @openelement/ui CE coexistence.

export const tagName = 'reader-wc-interop';

export default class WcInteropPage extends OpenElement {
  override render() {
    return (
      <div style='font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem'>
        <h1>Custom Element Interop</h1>
        <p>openElement custom elements rendering in shadow DOM.</p>

        <div style='display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-top:1rem'>
          <div>
            <p style='font-size:0.85rem;color:#666'>open-button</p>
            <open-button variant='primary' onclick={() => alert('open-button clicked!')}>
              openElement Button
            </open-button>
          </div>
          <div>
            <p style='font-size:0.85rem;color:#666'>open-card</p>
            <open-card>
              <h3 slot='header'>openElement Card</h3>
              <p>This card is powered by @openelement/ui.</p>
            </open-card>
          </div>
          <div>
            <p style='font-size:0.85rem;color:#666'>open-input</p>
            <open-input label='Enter text' placeholder='Type here...' />
          </div>
          <div>
            <p style='font-size:0.85rem;color:#666'>sync-status-island (Preact island)</p>
            <sync-status-island source-id='fixtures' />
          </div>
        </div>
      </div>
    );
  }
}
customElements.define(tagName, WcInteropPage);
