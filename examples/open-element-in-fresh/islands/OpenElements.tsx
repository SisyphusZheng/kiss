// Register a minimal open-element custom element inline to prove
// Fresh ↔ custom-element interop without bundling @openelement/ui.
//
// ponytail: the deno pack JSX transpilation gap is fixed (packed
// @openelement/ui .js output contains jsx() calls), so these stubs can be
// replaced with `import "@openelement/ui"`; they remain to keep the example
// dependency-light.
//
// ponytail: stub ignores variant/size/disabled attributes. The real
// open-button renders different styles per variant; the stub renders
// a plain button regardless. Full component behavior after ui import.

function defineOpenButton() {
  if (customElements.get('open-button')) return;
  class OpenButton extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
      // ponytail: guard against re-render on disconnect/reconnect
      if (this.shadowRoot!.childElementCount > 0) return;
      // ponytail: minimal render; real component via @openelement/ui
      this.shadowRoot!.innerHTML = `
        <button part="control">
          <slot></slot>
        </button>
      `;
    }
  }
  customElements.define('open-button', OpenButton);
}

function defineOpenCard() {
  if (customElements.get('open-card')) return;
  class OpenCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
      if (this.shadowRoot!.childElementCount > 0) return;
      this.shadowRoot!.innerHTML = `
        <div part="card">
          <slot name="header"></slot>
          <slot></slot>
          <slot name="footer"></slot>
        </div>
      `;
    }
  }
  customElements.define('open-card', OpenCard);
}

export default function OpenElementsIsland() {
  if (typeof window !== 'undefined') {
    defineOpenButton();
    defineOpenCard();
  }
  return null;
}
