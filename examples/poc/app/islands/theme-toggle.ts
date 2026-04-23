import { LitElement, html, css } from 'lit'

export default class ThemeToggle extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    button {
      background: #16213e;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;
    }
    button:hover {
      background: #e94560;
    }
  `

  static properties = {
    dark: { type: Boolean },
  }

  constructor() {
    super()
    this.dark = false
  }

  private toggle() {
    this.dark = !this.dark
    document.documentElement.style.setProperty(
      'color-scheme',
      this.dark ? 'dark' : 'light'
    )
  }

  render() {
    return html`
      <button @click=${this.toggle} aria-label="Toggle theme">
        ${this.dark ? '☀️ Light' : '🌙 Dark'}
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'theme-toggle': ThemeToggle
  }
}
