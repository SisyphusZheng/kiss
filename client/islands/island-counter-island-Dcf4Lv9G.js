import{i as r,a as s,b as i}from"./island-api-consumer-BlPm8Uni.js";const o="counter-island",t=class t extends r{constructor(){super(),this.count=0}render(){return i`
      <div class="counter">
        <button @click="${()=>this.count--}">−</button>
        <span class="count">${this.count}</span>
        <button @click="${()=>this.count++}">+</button>
      </div>
    `}};t.styles=s`
    :host {
      display: block;
    }
    .counter {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .count {
      font-size: 2rem;
      font-weight: 700;
      min-width: 3rem;
      text-align: center;
      color: var(--kiss-text-primary, inherit);
    }
    button {
      background: var(--kiss-bg-elevated, #111);
      color: var(--kiss-text-primary, #fff);
      border: 1px solid var(--kiss-border, transparent);
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-size: 1.25rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    button:hover {
      opacity: 0.85;
      transform: scale(1.05);
    }
    button:active {
      transform: scale(0.95);
    }
  `,t.properties={count:{type:Number}};let e=t;customElements.define(o,e);export{e as default,o as tagName};
