import{i as h,b as g,a as c}from"./island-api-consumer-BlPm8Uni.js";import{k as d}from"./design-tokens-B_mcQL4h-CZC2FRwC.js";const m="kiss-theme-toggle",i=class extends h{constructor(){super(...arguments),this._isLight=!1}connectedCallback(){if(super.connectedCallback(),this.theme==="light")this._isLight=!0;else if(this.theme==="dark")this._isLight=!1;else if(document.documentElement.dataset.theme==="light")this._isLight=!0;else try{localStorage.getItem("kiss-theme")==="light"&&(this._isLight=!0)}catch{}this.setAttribute("data-theme",this._isLight?"light":"dark")}_handleToggle(){this._isLight=!this._isLight;const t=this._isLight?"light":"dark";document.documentElement.setAttribute("data-theme",t);try{localStorage.setItem("kiss-theme",t)}catch{}this._propagateTheme(t)}_propagateTheme(t){const s=(n,o=0)=>{o>10||n.querySelectorAll("*").forEach(e=>{var r,a;try{const l=(r=e.tagName)==null?void 0:r.toLowerCase();(l!=null&&l.startsWith("kiss-")||(a=e.hasAttribute)!=null&&a.call(e,"data-kiss"))&&e.setAttribute("data-theme",t),e.shadowRoot&&s(e.shadowRoot,o+1)}catch{}})};s(document)}render(){return g`
        <button
          class="theme-toggle ${this._isLight?"is-light":""}"
          title="${this._isLight?"Switch to dark theme":"Switch to light theme"}"
          aria-label="Toggle theme"
          @click="${()=>this._handleToggle()}"
        >
          <svg
            class="icon-sun"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          >
            <circle cx="8" cy="8" r="3" />
            <line x1="8" y1="1" x2="8" y2="3" />
            <line x1="8" y1="13" x2="8" y2="15" />
            <line x1="1" y1="8" x2="3" y2="8" />
            <line x1="13" y1="8" x2="15" y2="8" />
            <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" />
            <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" />
            <line x1="3.05" y1="12.95" x2="4.46" y2="11.54" />
            <line x1="11.54" y1="4.46" x2="12.95" y2="3.05" />
          </svg>
          <svg
            class="icon-moon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          >
            <path d="M13.5 9.14A5.5 5.5 0 0 1 6.86 2.5 5.5 5.5 0 1 0 13.5 9.14Z" />
          </svg>
        </button>
      `}};i.styles=[d,c`
      :host {
        display: inline-block;
      }

      .theme-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 1px solid var(--kiss-border);
        border-radius: var(--kiss-radius-md);
        background: transparent;
        color: var(--kiss-text-tertiary);
        cursor: pointer;
        font-size: 0;
        line-height: 1;
        transition:
          color var(--kiss-transition-normal),
          border-color var(--kiss-transition-normal),
          background var(--kiss-transition-normal);
        }

        .theme-toggle:hover {
          color: var(--kiss-text-primary);
          border-color: var(--kiss-border-hover);
          background: var(--kiss-accent-subtle);
        }

        .theme-toggle svg {
          width: 16px;
          height: 16px;
        }

        .theme-toggle .icon-sun {
          display: block;
        }

        .theme-toggle .icon-moon {
          display: none;
        }

        .theme-toggle.is-light .icon-sun {
          display: none;
        }

        .theme-toggle.is-light .icon-moon {
          display: block;
        }
      `];i.properties={theme:{type:String,reflect:!0},_isLight:{state:!0}};let u=i;customElements.define(m,u);export{u as KissThemeToggle,m as tagName};
