// Register a minimal open-element custom element inline to prove
// Fresh ↔ custom-element interop without bundling @openelement/ui
// (which ships .js with JSX that Vite can't transpile yet).
//
// ponytail: once @openelement/ui ships pre-compiled JS, replace these
// inline registrations with `import "@openelement/ui"`.

function defineOpenButton() {
  if (customElements.get("open-button")) return;
  class OpenButton extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      // ponytail: minimal render; real component uses @openelement/element
      this.shadowRoot!.innerHTML = `
        <button part="control">
          <slot></slot>
        </button>
      `;
    }
  }
  customElements.define("open-button", OpenButton);
}

function defineOpenCard() {
  if (customElements.get("open-card")) return;
  class OpenCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      this.shadowRoot!.innerHTML = `
        <div part="card">
          <slot name="header"></slot>
          <slot></slot>
          <slot name="footer"></slot>
        </div>
      `;
    }
  }
  customElements.define("open-card", OpenCard);
}

export default function OpenElementsIsland() {
  if (typeof window !== "undefined") {
    defineOpenButton();
    defineOpenCard();
  }
  return null;
}
