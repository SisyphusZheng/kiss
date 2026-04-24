import { LitElement, html, css } from 'lit'
import '../components/header'
import '../components/footer'

/**
 * About page - static content
 *
 * This page demonstrates Level 0 progressive enhancement.
 * Zero JS is shipped to the client.
 */
export class AboutPage extends LitElement {
  static styles = css`
    main {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
    }

    h1 {
      margin-bottom: 1rem;
    }

    p {
      margin-bottom: 1rem;
    }
  `

  render() {
    return html`
      <app-header></app-header>
      <main>
        <h1>About This Blog</h1>
        <p>This is a minimal blog built with the KISS framework.</p>
        <p>KISS stands for <strong>Keep It Simple, Stupid</strong>.</p>
        <p>It demonstrates:</p>
        <ul>
          <li>Server-Side Rendering with Lit</li>
          <li>File-based routing</li>
          <li>Islands architecture for interactivity</li>
          <li>Progressive enhancement (0 KB JS by default)</li>
        </ul>
        <p><a href="/">← Back to home</a></p>
      </main>
      <app-footer></app-footer>
    `
  }
}

customElements.define('about-page', AboutPage)

export default AboutPage
export const tagName = 'about-page'
