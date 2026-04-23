import { LitElement, html, css } from 'lit'

export default class MyCounter extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .counter {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: #16213e;
      border-radius: 0.75rem;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
    }
    button {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      border: 2px solid #e94560;
      background: transparent;
      color: #e94560;
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    button:hover {
      background: #e94560;
      color: white;
    }
    span {
      font-size: 1.5rem;
      min-width: 2rem;
      text-align: center;
      font-weight: bold;
    }
    .label {
      font-size: 0.75rem;
      color: #aaa;
      margin-top: 0.5rem;
    }
  `

  static properties = {
    count: { type: Number },
  }

  constructor() {
    super()
    this.count = 0
  }

  private increment() {
    this.count++
  }

  private decrement() {
    this.count--
  }

  render() {
    return html`
      <div class="counter">
        <button @click=${this.decrement} aria-label="Decrement">−</button>
        <span>${this.count}</span>
        <button @click=${this.increment} aria-label="Increment">+</button>
      </div>
      <div class="label">⚡ Island Component — hydrated on interaction</div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-counter': MyCounter
  }
}
