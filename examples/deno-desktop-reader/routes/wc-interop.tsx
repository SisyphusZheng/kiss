/** @jsxImportSource @openelement/core */
/**
 * Third-party Custom Element interop page.
 * Demonstrates Lit, Shoelace, MWC, and openElement CEs coexisting.
 */

// Shoelace
import '@shoelace-style/shoelace';
// Material Web Components
import '@material/web/checkbox/checkbox.js';
// openElement UI (already registered in reader.tsx, but import for explicitness)

export default function WcInteropRoute() {
  return (
    <div>
      <h1>Custom Element Interop</h1>
      <p>
        This page proves that Lit-based, Material Web, and openElement custom elements coexist in
        the same DOM.
      </p>

      <div class='wc-interop-grid'>
        {/* Shoelace sl-button */}
        <div class='wc-interop-item'>
          <p class='wc-interop-label'>Shoelace: sl-button</p>
          <sl-button variant='primary'>Shoelace Button</sl-button>
        </div>

        {/* Shoelace sl-card */}
        <div class='wc-interop-item'>
          <p class='wc-interop-label'>Shoelace: sl-card</p>
          <sl-card>
            <div slot='header'>Shoelace Card</div>
            <p>This card is powered by Lit.</p>
          </sl-card>
        </div>

        {/* Material Web mwc-checkbox */}
        <div class='wc-interop-item'>
          <p class='wc-interop-label'>Material Web: mwc-checkbox</p>
          <label>
            <mwc-checkbox checked /> Accept terms
          </label>
        </div>

        {/* openElement open-button */}
        <div class='wc-interop-item'>
          <p class='wc-interop-label'>openElement: open-button</p>
          <open-button onClick={() => alert('open-button clicked!')}>
            openElement Button
          </open-button>
        </div>

        {/* openElement open-card */}
        <div class='wc-interop-item'>
          <p class='wc-interop-label'>openElement: open-card</p>
          <open-card>
            <h3 slot='header'>openElement Card</h3>
            <p>This card is powered by @openelement/ui.</p>
          </open-card>
        </div>

        {/* openElement open-input */}
        <div class='wc-interop-item'>
          <p class='wc-interop-label'>openElement: open-input</p>
          <open-input label='Enter text' placeholder='Type here...' />
        </div>
      </div>
    </div>
  );
}
