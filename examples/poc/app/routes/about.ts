import { LitElement, html, css } from 'lit'

export default class AboutPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { color: #1a1a2e; }
    a { color: #e94560; }
  `

  render() {
    return html`
      <h1>About</h1>
      <p>This is the about page. Pure SSR, zero client-side JavaScript.</p>
      <p><a href="/">← Back to Home</a></p>
    `
  }
}
