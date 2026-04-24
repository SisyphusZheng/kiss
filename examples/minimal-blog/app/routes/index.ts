import { LitElement, html, css } from 'lit'
import '../components/header'
import '../components/footer'

/**
 * Home page - lists all blog posts
 *
 * This is a server-side rendered page.
 * No JS is shipped to the client by default (0 KB).
 */
export class HomePage extends LitElement {
  static styles = css`
    main {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    article {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #eaeaea;
    }

    h2 {
      margin-bottom: 0.5rem;
    }

    h2 a {
      color: inherit;
      text-decoration: none;
    }

    h2 a:hover {
      text-decoration: underline;
    }

    .date {
      color: #666;
      font-size: 0.9rem;
    }

    .excerpt {
      margin-top: 0.5rem;
      color: #333;
    }
  `

  render() {
    const posts = [
      {
        slug: 'hello-kiss',
        title: 'Hello KISS Framework',
        date: '2026-04-23',
        excerpt: 'Building a minimal blog with KISS framework...'
      },
      {
        slug: 'why-web-standards',
        title: 'Why Web Standards Matter',
        date: '2026-04-22',
        excerpt: 'The web is built on standards. Let\'s use them...'
      }
    ]

    return html`
      <app-header></app-header>
      <main>
        <h1>Minimal Blog</h1>
        ${posts.map(post => html`
          <article>
            <h2><a href="/posts/${post.slug}">${post.title}</a></h2>
            <p class="date">${post.date}</p>
            <p class="excerpt">${post.excerpt}</p>
          </article>
        `)}
      </main>
      <app-footer></app-footer>
    `
  }
}

customElements.define('home-page', HomePage)

export default HomePage
export const tagName = 'home-page'
