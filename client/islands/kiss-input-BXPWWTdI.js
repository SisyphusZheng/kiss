import{i as o,A as t,b as a,a as l}from"./island-api-consumer-BlPm8Uni.js";import{k as n}from"./design-tokens-B_mcQL4h-CZC2FRwC.js";const d="kiss-input",s=class extends o{constructor(){super(...arguments),this.type="text",this.disabled=!1,this.required=!1}connectedCallback(){super.connectedCallback(),this._internals=this.attachInternals(),this._internals.setFormValue(this.value??"")}formResetCallback(){var e;this.value="",this.error=void 0,(e=this._internals)==null||e.setFormValue("")}formDisabledCallback(e){this.disabled=e}render(){const e=this.error?"input-error":void 0;return a`
      <div class="input-wrapper">
        ${this.label?a`
            <label for="input">${this.label}${this.required?" *":""}</label>
          `:""}
        <input
          id="input"
          class="input ${this.error?"input--error":""}"
          type="${this.type}"
          placeholder="${this.placeholder}"
          .value="${this.value??""}"
          name="${this.name}"
          ?disabled="${this.disabled}"
          ?required="${this.required}"
          aria-invalid="${this.error?"true":t}"
          aria-describedby="${e||t}"
          aria-errormessage="${e||t}"
          @input="${r=>this._handleInput(r)}"
        />
        ${this.error?a`
            <small id="input-error" role="alert" class="error-message">${this.error}</small>
          `:""}
      </div>
    `}_handleInput(e){var r;const i=e.target;this.value=i.value,(r=this._internals)==null||r.setFormValue(i.value),this.dispatchEvent(new CustomEvent("kiss-input",{detail:{value:i.value},bubbles:!0,composed:!1}))}};s.formAssociated=!0;s.styles=[n,l`
      :host {
        display: block;
      }

      .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--kiss-size-2);
      }

      label {
        font-size: var(--kiss-font-size-sm);
        font-weight: var(--kiss-font-weight-medium);
        color: var(--kiss-text-tertiary);
        letter-spacing: var(--kiss-letter-spacing-wide);
      }

      .input {
        width: 100%;
        padding: var(--kiss-size-2) var(--kiss-size-3);
        font-family: var(--kiss-font-sans);
        font-size: var(--kiss-font-size-md);
        color: var(--kiss-text-primary);
        background: var(--kiss-bg-base);
        border: 1px solid var(--kiss-border);
        border-radius: var(--kiss-radius-md);
        transition:
          border-color var(--kiss-transition-normal),
          box-shadow var(--kiss-transition-normal);
        outline: none;
      }

      .input::placeholder {
        color: var(--kiss-text-muted);
      }

      .input:hover {
        border-color: var(--kiss-border-hover);
      }

      .input:focus {
        border-color: var(--kiss-accent);
        box-shadow: 0 0 0 1px var(--kiss-accent);
      }

      .input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: var(--kiss-bg-surface);
      }

      .input--error {
        border-color: var(--kiss-error, #e55);
      }

      .error-message {
        font-size: var(--kiss-font-size-xs);
        color: var(--kiss-error, #e55);
      }
    `];s.properties={type:{type:String},placeholder:{type:String},label:{type:String},value:{type:String},name:{type:String},disabled:{type:Boolean,reflect:!0},required:{type:Boolean},error:{type:String}};let u=s;customElements.define(d,u);export{u as KissInput,d as tagName};
