/** @jsxImportSource @openelement/core */
import { OpenElement } from "@openelement/element";

// Third-party CE imported via module script in HTML (ponytail: CDN avoids bundling issues)
import "@shoelace-style/shoelace";

export const tagName = "reader-wc-interop";

export default class WcInteropPage extends OpenElement {
  override render() {
    return (
      <div class="wc-interop">
        <h1>Custom Element Interop</h1>
        <p>
          This page proves that Lit-based, Material Web, and openElement custom
          elements coexist in the same DOM.
        </p>

        <div class="wc-interop-grid">
          {/* Shoelace sl-button */}
          <div class="wc-interop-item">
            <p class="wc-interop-label">Shoelace: sl-button</p>
            <sl-button variant="primary">Shoelace Button</sl-button>
          </div>

          {/* Shoelace sl-card */}
          <div class="wc-interop-item">
            <p class="wc-interop-label">Shoelace: sl-card</p>
            <sl-card>
              <div slot="header">Shoelace Card</div>
              <p>This card is powered by Lit.</p>
            </sl-card>
          </div>

          {/* Material Web mwc-checkbox */}
          <div class="wc-interop-item">
            <p class="wc-interop-label">Material Web: mwc-checkbox</p>
            <label>
              <mwc-checkbox checked /> Accept terms
            </label>
          </div>

          {/* Material Web mwc-button */}
          <div class="wc-interop-item">
            <p class="wc-interop-label">Material Web: mwc-button</p>
            <mwc-button label="MWC Button" raised />
          </div>

          {/* openElement open-button */}
          <div class="wc-interop-item">
            <p class="wc-interop-label">openElement: open-button</p>
            <open-button
              variant="primary"
              onClick={() => alert("open-button clicked!")}
            >
              openElement Button
            </open-button>
          </div>

          {/* openElement open-card */}
          <div class="wc-interop-item">
            <p class="wc-interop-label">openElement: open-card</p>
            <open-card>
              <h3 slot="header">openElement Card</h3>
              <p>This card is powered by @openelement/ui.</p>
            </open-card>
          </div>

          {/* openElement open-input */}
          <div class="wc-interop-item">
            <p class="wc-interop-label">openElement: open-input</p>
            <open-input label="Enter text" placeholder="Type here..." />
          </div>
        </div>
      </div>
    );
  }
}
customElements.define(tagName, WcInteropPage);
