import{i,b as r,a as e}from"./island-api-consumer-BlPm8Uni.js";import{k as t}from"./design-tokens-B_mcQL4h-CZC2FRwC.js";const a="kiss-code-block",o=class extends i{constructor(){super(...arguments),this._copyState="idle"}disconnectedCallback(){super.disconnectedCallback(),this._copyTimer!==void 0&&(clearTimeout(this._copyTimer),this._copyTimer=void 0)}render(){return r`
      <slot></slot>
      <button
        class="copy-btn ${this._copyState==="copied"?"copied":""} ${this._copyState==="failed"?"failed":""}"
        @click="${()=>this._copy()}"
      >
        ${this._copyState==="copied"?"✓ Copied!":this._copyState==="failed"?"✗ Failed":"Copy"}
      </button>
    `}async _copy(){try{const s=this.textContent||"";await navigator.clipboard.writeText(s),this._copyState="copied",this._copyTimer=setTimeout(()=>{this._copyState="idle",this._copyTimer=void 0},2e3)}catch{this._copyState="failed",this._copyTimer=setTimeout(()=>{this._copyState="idle",this._copyTimer=void 0},2e3)}}};o.styles=[t,e`
      :host {
        display: block;
        position: relative;
      }

      ::slotted(pre) {
        margin: 0;
        padding: var(--kiss-size-5);
        background: var(--kiss-code-bg);
        border: 1px solid var(--kiss-code-border);
        border-radius: var(--kiss-radius-sm);
        overflow-x: auto;
        font-family: var(--kiss-font-mono);
        font-size: var(--kiss-font-size-sm);
        line-height: var(--kiss-line-height-normal);
        color: var(--kiss-text-secondary);
        scrollbar-width: thin;
        scrollbar-color: var(--kiss-border) transparent;
      }

      .copy-btn {
        position: absolute;
        top: var(--kiss-size-2);
        right: var(--kiss-size-2);
        background: var(--kiss-bg-elevated);
        color: var(--kiss-text-muted);
        border: 1px solid var(--kiss-border);
        padding: var(--kiss-size-1) var(--kiss-size-3);
        font-size: var(--kiss-font-size-xs);
        font-family: var(--kiss-font-sans);
        cursor: pointer;
        border-radius: var(--kiss-radius-sm);
        transition: color var(--kiss-transition-normal), border-color var(--kiss-transition-normal);
        z-index: 1;
      }

      .copy-btn:hover {
        color: var(--kiss-text-secondary);
        border-color: var(--kiss-border-hover);
      }

      .copy-btn.copied {
        color: var(--kiss-text-primary);
        border-color: var(--kiss-border-hover);
      }

      .copy-btn.failed {
        color: var(--kiss-error, #e55);
        border-color: var(--kiss-error, #e55);
      }
    `];o.properties={_copyState:{state:!0}};let c=o;customElements.define(a,c);export{c as KissCodeBlock,a as tagName};
