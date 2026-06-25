import { css, html, LitElement } from 'lit';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/switch/switch.js';

class Alpha3LitCounter extends LitElement {
  static properties = { count: { type: Number }, label: { type: String } };
  static styles = css`
    :host {
      display: inline-flex;
      gap: 0.5rem;
      align-items: center;
    }
    button {
      cursor: pointer;
    }
  `;
  count = 0;
  label = 'Lit counter';
  #increment() {
    this.count++;
    this.dispatchEvent(
      new CustomEvent('lit-count', {
        detail: { count: this.count },
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    return html`
      <slot name="label"></slot>
      <button
        id="lit-button"
        @click="${() => this.#increment()}"
      >
        ${this.label}: ${this.count}
      </button>
    `;
  }
}

class Alpha3LitHost extends LitElement {
  render() {
    return html`
      <alpha3-open-child></alpha3-open-child>
    `;
  }
}

customElements.define('alpha3-lit-counter', Alpha3LitCounter);
customElements.define('alpha3-lit-host', Alpha3LitHost);
