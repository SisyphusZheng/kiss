import{i as e,a as s,b as i}from"./island-api-consumer-BlPm8Uni.js";const a="code-block",o=class o extends e{constructor(){super(...arguments),this._copyState="idle"}render(){return i`
      <slot></slot>
      <button
        class="copy-btn ${this._copyState==="copied"?"copied":""} ${this._copyState==="failed"?"failed":""}"
        @click="${()=>this._copy()}"
      >
        ${this._copyState==="copied"?"✓ Copied!":this._copyState==="failed"?"✗ Failed":"Copy"}
      </button>
    `}async _copy(){try{const r=this.textContent||"";await navigator.clipboard.writeText(r),this._copyState="copied",setTimeout(()=>{this._copyState="idle"},2e3)}catch{this._copyState="failed",setTimeout(()=>{this._copyState="idle"},2e3)}}};o.styles=s`
    :host {
      display: block;
      position: relative;
    }

    ::slotted(pre) {
      margin: 0;
      padding: 1.25rem;
      background: var(--kiss-code-bg);
      border: 1px solid var(--kiss-code-border);
      border-radius: 2px;
      overflow-x: auto;
      font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
      font-size: 0.8125rem;
      line-height: 1.6;
      color: var(--kiss-text-secondary);
      scrollbar-width: thin;
      scrollbar-color: var(--kiss-scrollbar-thumb) transparent;
    }

    .copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: var(--kiss-bg-elevated);
      color: var(--kiss-text-tertiary);
      border: 1px solid var(--kiss-border);
      padding: 0.25rem 0.625rem;
      font-size: 0.6875rem;
      font-family: inherit;
      cursor: pointer;
      border-radius: 2px;
      transition: color 0.15s, border-color 0.15s;
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
  `,o.properties={_copyState:{state:!0}};let t=o;customElements.define(a,t);export{t as default,a as tagName};
