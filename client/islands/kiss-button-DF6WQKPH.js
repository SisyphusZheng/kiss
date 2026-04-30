import{i as a,A as t,b as r,a as n}from"./island-api-consumer-BlPm8Uni.js";import{k as o}from"./design-tokens-B_mcQL4h-CZC2FRwC.js";const l="kiss-button",e=class extends a{constructor(){super(...arguments),this.variant="default",this.size="md",this.disabled=!1,this.type="button"}_preventClick(s){s.preventDefault()}render(){const s=`btn btn--${this.variant} btn--${this.size}`;if(this.href){const i=this.disabled?void 0:this.href;return r`
        <a
          class="${s}"
          href="${i??t}"
          target="${this.target||t}"
          aria-disabled="${this.disabled||t}"
          rel="${this.target==="_blank"?"noopener noreferrer":t}"
          @click="${this.disabled?this._preventClick:t}"
        >
          <slot></slot>
        </a>
      `}return r`
      <button class="${s}" ?disabled="${this.disabled}" type="${this.type}">
        <slot></slot>
      </button>
    `}};e.styles=[o,n`
      :host {
        display: inline-block;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--kiss-size-2);
        font-family: var(--kiss-font-sans);
        font-weight: var(--kiss-font-weight-medium);
        text-decoration: none;
        cursor: pointer;
        border: 1px solid var(--kiss-border);
        background: transparent;
        color: var(--kiss-text-primary);
        border-radius: var(--kiss-radius-md);
        transition:
          color var(--kiss-transition-normal),
          border-color var(--kiss-transition-normal),
          background var(--kiss-transition-normal);
        white-space: nowrap;
        letter-spacing: var(--kiss-letter-spacing-wide);
      }

      /* Sizes */
      .btn--sm {
        padding: var(--kiss-size-1) var(--kiss-size-3);
        font-size: var(--kiss-font-size-sm);
        height: 28px;
      }

      .btn--md {
        padding: var(--kiss-size-2) var(--kiss-size-4);
        font-size: var(--kiss-font-size-md);
        height: 36px;
      }

      .btn--lg {
        padding: var(--kiss-size-3) var(--kiss-size-5);
        font-size: var(--kiss-font-size-lg);
        height: 44px;
      }

      /* Variants */
      .btn--default:hover {
        color: var(--kiss-text-primary);
        border-color: var(--kiss-border-hover);
        background: var(--kiss-accent-subtle);
      }

      .btn--primary {
        background: var(--kiss-accent);
        color: var(--kiss-bg-base);
        border-color: var(--kiss-accent);
      }

      .btn--primary:hover {
        background: var(--kiss-accent-dim);
        border-color: var(--kiss-accent-dim);
      }

      .btn--ghost {
        border-color: transparent;
      }

      .btn--ghost:hover {
        background: var(--kiss-accent-subtle);
        border-color: transparent;
      }

      /* States */
      .btn:disabled,
      .btn[aria-disabled="true"] {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }

      .btn:focus-visible {
        outline: 2px solid var(--kiss-accent);
        outline-offset: 2px;
      }
    `];e.properties={variant:{type:String,reflect:!0},size:{type:String,reflect:!0},disabled:{type:Boolean,reflect:!0},href:{type:String,reflect:!0},target:{type:String,reflect:!0},type:{type:String}};let d=e;customElements.define(l,d);export{d as KissButton,l as tagName};
